import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { PrismaClient } from "@submail/db";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// GET: List Aliases
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;

    try {
        const aliases = await prisma.alias.findMany({
            where: { userId: userId },
            include: { rules: true }
        });
        return NextResponse.json(aliases);
    } catch (error) {
        console.error("Failed to fetch aliases:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST: Create Alias
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { address, destination } = await request.json(); // destination is optional

    // 1. Validation: Length and Regex (Alphanumeric, dot, underscore, dash)
    const validRegex = /^[a-z0-9._-]+$/;
    if (!address || address.length < 3 || address.length > 30 || !validRegex.test(address)) {
        return new NextResponse("Invalid alias. Use 3-30 chars, lowercase letters, numbers, dot, underscore, or dash.", { status: 400 });
    }

    // 2. Reserved Words
    const reserved = ['admin', 'postmaster', 'hostmaster', 'abuse', 'webmaster', 'support', 'help'];
    if (reserved.includes(address)) {
        return new NextResponse("This alias is reserved.", { status: 400 });
    }

    // 3. Loop Prevention & Destination Validation
    let targetEmail = session.user.email!;
    if (destination && destination.trim() !== "") {
        targetEmail = destination.trim();
        // Basic Email Regex
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
            return new NextResponse("Invalid destination email format.", { status: 400 });
        }

        // LOOP PREVENTION: Disallow forwarding to our own domain
        const myDomain = process.env.SMTP_DOMAIN || "example.com";
        if (targetEmail.endsWith(`@${myDomain}`)) {
            return new NextResponse("Loop Detected: You cannot forward emails back to this server.", { status: 400 });
        }
    }

    try {
        await prisma.user.upsert({
            where: { id: userId },
            update: { realEmail: session.user.email! },
            create: { id: userId, realEmail: session.user.email! }
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

        return NextResponse.json(newAlias);
    } catch (error) {
        console.error("Create alias error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE: Remove Alias
export async function DELETE(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    try {
        const alias = await prisma.alias.findUnique({ where: { id } });
        if (!alias || alias.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.$transaction([
            prisma.rule.deleteMany({ where: { aliasId: id } }),
            prisma.alias.delete({ where: { id } })
        ]);

        return new NextResponse("Deleted", { status: 200 });
    } catch (error) {
        console.error("Delete error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH: Toggle Rule or Update Destination
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    // @ts-ignore
    const userId = session.user.id;
    const { id, active, destination } = await request.json();

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    try {
        const alias = await prisma.alias.findUnique({
            where: { id },
            include: { rules: true }
        });

        if (!alias || alias.userId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updates: any = {};

        // Logic: active field toggles FORWARD/BLOCK
        if (typeof active === 'boolean') {
            updates.type = active ? "FORWARD" : "BLOCK";
        }

        // Logic: destination field updates target
        if (destination) {
            const targetEmail = destination.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
                return new NextResponse("Invalid destination email format.", { status: 400 });
            }
            const myDomain = process.env.SMTP_DOMAIN || "example.com";
            if (targetEmail.endsWith(`@${myDomain}`)) {
                return new NextResponse("Loop Detected: You cannot forward emails back to this server.", { status: 400 });
            }
            updates.destination = targetEmail;
        }

        if (Object.keys(updates).length > 0) {
            await prisma.rule.updateMany({
                where: { aliasId: id },
                data: updates
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
