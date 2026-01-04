import { NextResponse } from "next/server";
import { z } from "zod";

type ApiHandlerCallback = (req: Request) => Promise<NextResponse>;

export function apiHandler(handler: ApiHandlerCallback): ApiHandlerCallback {
    return async (req: Request) => {
        try {
            return await handler(req);
        } catch (error: any) {
            // 1. Zod Validation Errors (Always exposed for client feedback)
            if (error instanceof z.ZodError) {
                return new NextResponse(JSON.stringify(error.issues), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // 2. Log Internal Errors Server-Side
            // In a real app, send to Sentry/DataDog
            const isProduction = process.env.NODE_ENV === 'production';
            console.error("[API Error]", isProduction ? "Masked for Prod" : error);

            // 3. Return Safe Response
            if (isProduction) {
                // Determine if it's a known operational error or completely unexpected
                // For now, default to 500 for unhandled exceptions
                return new NextResponse(JSON.stringify({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "An internal error occurred."
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                // Development: Return full error details
                return new NextResponse(JSON.stringify({
                    code: "DEV_ERROR",
                    message: error.message,
                    stack: error.stack
                }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
    };
}
