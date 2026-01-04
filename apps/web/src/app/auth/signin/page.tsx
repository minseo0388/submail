"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[20%] right-[30%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[20%] left-[30%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="glass p-10 rounded-3xl w-full max-w-md text-center relative z-10 mx-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-white/40">Secure access via Discord</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => signIn("discord", { callbackUrl })}
                        className="w-full btn-primary py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 3.903 3.903 0 0 0-.74 1.535 18.324 18.324 0 0 0-5.23 0 3.931 3.931 0 0 0-.745-1.535.074.074 0 0 0-.079-.037 19.721 19.721 0 0 0-4.882 1.515.05.05 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Continue with Discord
                    </button>
                </div>

                <p className="mt-8 text-xs text-white/20">
                    By logging in, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/50">Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}
