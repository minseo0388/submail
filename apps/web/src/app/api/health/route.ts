import 'server-only';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@submail/db';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
    const health: any = {
        db: 'unknown',
        redis: 'unknown',
        smtp: 'unknown',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    };

    // 1. Check DB
    try {
        await prisma.$queryRaw`SELECT 1`;
        health.db = 'healthy';
    } catch (e) {
        health.db = 'unhealthy';
        console.error('[Health] DB Check Failed:', e);
    }

    // 2. Check Redis
    try {
        if (!process.env.UPSTASH_REDIS_REST_URL) {
            health.redis = 'skipped (no env)';
        } else {
            const Redis = require('@upstash/redis').Redis;
            const redis = Redis.fromEnv();
            await redis.ping();
            health.redis = 'healthy';
        }
    } catch (e) {
        health.redis = 'unhealthy';
        console.error('[Health] Redis Check Failed:', e);
    }

    // 3. Check SMTP (TCP Connect - Optional)
    if (process.env.SMTP_PORT) {
        const smtpPort = parseInt(process.env.SMTP_PORT, 10);
        const smtpHost = 'localhost';
        try {
            await new Promise<void>((resolve, reject) => {
                const net = require('net');
                const socket = new net.Socket();
                socket.setTimeout(2000); // 2s timeout
                socket.on('connect', () => {
                    socket.destroy();
                    resolve();
                });
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error('Timeout'));
                });
                socket.on('error', (err: any) => {
                    socket.destroy();
                    reject(err);
                });
                socket.connect(smtpPort, smtpHost);
            });
            health.smtp = 'healthy';
        } catch (e) {
            health.smtp = 'unhealthy';
            console.error('[Health] SMTP Check Failed:', e);
        }
    } else {
        health.smtp = 'skipped';
    }

    const status = (health.db === 'healthy' && (health.redis === 'healthy' || health.redis.startsWith('skipped')))
        ? 200
        : 503;

    health.status = status === 200 ? 'ok' : 'error';

    return NextResponse.json(health, { status });
}
