import 'server-only';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@submail/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { apiHandler } from "@/lib/api-error";
import { logAudit } from "@/lib/audit";

const prisma = new PrismaClient();

// Initialize Rate Limiter
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "10 s"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

// Zod Schemas
const createAliasSchema = z.object({
    address: z.string().min(3).max(30).regex(/^[a-z0-9._-]+$/, {
        message: "Address must be 3-30 lowercase characters (a-z, 0-9, ., _, -)"
    }),
    destination: z.string().optional(),
});

const updateAliasSchema = z.object({
    id: z.string(),
    active: z.boolean().optional(),
    destination: z.string().email("Invalid email address").optional(),
});

// GET: List Aliases
export const GET = apiHandler(async (request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    const aliases = await prisma.alias.findMany({
        where: { userId: userId },
        include: { rules: true }
    });
    return NextResponse.json(aliases, {
        headers: {
            'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300'
        }
    });
});

// POST: Create Alias
export const POST = apiHandler(async (request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Rate Limiting (Fail-open)
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    try {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            console.warn("[RateLimit] Missing Upstash Env Vars - Skipping Check");
        } else {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                // Audit Rate Limit Attack
                await logAudit({
                    action: "RATE_LIMIT_EXCEEDED",
                    userId: "anonymous",
                    ip: ip,
                    details: "Too many create alias requests"
                });
                return new NextResponse("Too Many Requests", { status: 429 });
            }
        }
    } catch (redisError) {
        console.error("[RateLimit] Redis Error (Fail-open):", redisError);
        // We continue execution (Fail-open)
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await request.json();
    const { address, destination } = createAliasSchema.parse(body);

    // 2. Reserved Words
    const reserved = ['admin', 'postmaster', 'hostmaster', 'abuse', 'webmaster', 'support', 'help'];
    if (reserved.includes(address)) {
        return new NextResponse("This alias is reserved.", { status: 400 });
    }

    // 3. Loop Prevention & Destination Validation
    let targetEmail = session.user.email!;
    if (destination && destination.trim() !== "") {
        targetEmail = destination.trim();
        const emailSchema = z.string().email();
        const emailResult = emailSchema.safeParse(targetEmail);
        if (!emailResult.success) {
            return new NextResponse("Invalid destination email format.", { status: 400 });
        }

        const myDomain = process.env.SMTP_DOMAIN || "example.com";
        if (targetEmail.endsWith(`@${myDomain}`)) {
            return new NextResponse("Loop Detected: You cannot forward emails back to this server.", { status: 400 });
        }
    }

    // 4. DB Operations
    await prisma.user.upsert({
        where: { id: userId },
        update: { realEmail: session.user.email! },
        create: { id: userId, realEmail: session.user.email!, providerId: (session.user as any).providerId || 'unknown' }
    });

    const existing = await prisma.alias.findUnique({
        where: { address: address }
    });

    if (existing) {
        return new NextResponse("Alias already taken", { status: 409 });
    }

    const newAlias = await prisma.alias.create({
        data: {
            address: address,
            userId: userId,
            rules: {
                create: {
                    type: "FORWARD",
                    destination: targetEmail
                }
            }
        },
        include: { rules: true }
    });

    await logAudit({
        action: "ALIAS_CREATED",
        userId: userId,
        ip: ip,
        details: `Alias ${address} created`
    });

    return NextResponse.json(newAlias);
});

// DELETE: Remove Alias
export const DELETE = apiHandler(async (request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    const alias = await prisma.alias.findUnique({ where: { id } });
    if (!alias || alias.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.$transaction([
        prisma.rule.deleteMany({ where: { aliasId: id } }),
        prisma.alias.delete({ where: { id } })
    ]);

    await logAudit({
        action: "ALIAS_DELETED",
        userId: userId,
        ip: request.headers.get("x-forwarded-for") ?? "unknown",
        details: `Alias ${alias.address} deleted`
    });

    return new NextResponse("Deleted", { status: 200 });
});

// PATCH: Toggle Rule or Update Destination
export const PATCH = apiHandler(async (request: Request) => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // Rate Limit Updates too (Fail-open)
    const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
    try {
        if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
            // Warn but allow
        } else {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                return new NextResponse("Too Many Requests", { status: 429 });
            }
        }
    } catch (e) {
        console.error("[RateLimit] Redis Error (Fail-open):", e);
    }

    // @ts-ignore
    const userId = session.user.id;
    const body = await request.json();
    const { id, active, destination } = updateAliasSchema.parse(body);

    const alias = await prisma.alias.findUnique({
        where: { id },
        include: { rules: true }
    });

    if (!alias || alias.userId !== userId) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const updates: any = {};

    if (typeof active === 'boolean') {
        updates.type = active ? "FORWARD" : "BLOCK";
    }

    if (destination) {
        const myDomain = process.env.SMTP_DOMAIN || "example.com";
        if (destination.endsWith(`@${myDomain}`)) {
            return new NextResponse("Loop Detected", { status: 400 });
        }
        updates.destination = destination;
    }

    if (Object.keys(updates).length > 0) {
        await prisma.rule.updateMany({
            where: { aliasId: id },
            data: updates
        });
    }

    await logAudit({
        action: "ALIAS_UPDATED",
        userId: userId,
        ip: ip,
        details: `Alias ${alias.address} updated`
    });

    return NextResponse.json({ success: true });
});
