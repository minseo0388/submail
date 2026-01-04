import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import AliasManagement from "@/components/AliasManagement";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/api/auth/signin");
    }

    // @ts-ignore
    const userId = session.user.id;

    const aliases = await prisma.alias.findMany({
        where: { userId: userId },
        include: { rules: true },
        orderBy: { createdAt: 'desc' }
    });

    const recentLogs = await prisma.log.findMany({
        where: {
            alias: {
                userId: userId
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { alias: true }
    });

    const domain = process.env.SMTP_DOMAIN || "example.com";

    return (
        <div className="min-h-screen p-6 md:p-12 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                            Dashboard
                        </h1>
                        <p className="text-white/40">Manage your identity and aliases.</p>
                    </div>

                    <div className="glass px-6 py-3 rounded-2xl flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                            {session.user.name?.[0] || "U"}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{session.user.name}</span>
                            <span className="text-xs text-white/50">{session.user.email}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10 mx-2" />
                        <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded-full border border-green-400/20">
                            Verified
                        </span>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Aliases (2/3 width) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4">
                            <StatCard label="Active Aliases" value={aliases.length.toString()} icon="📧" />
                            <StatCard label="Emails Forwarded" value="-" icon="📨" />
                            <StatCard label="Spam Blocked" value="-" icon="🛡️" />
                        </div>

                        {/* Alias Management Component */}
                        <AliasManagement aliases={aliases} domain={domain} />
                    </div>

                    {/* Right Column: Activity Log (1/3 width) */}
                    <div className="glass rounded-3xl p-6 h-fit bg-white/5 md:sticky top-6">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Recent Activity
                        </h2>

                        <div className="space-y-4">
                            {recentLogs.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-sm">
                                    No activity recorded yet.
                                </div>
                            ) : (
                                recentLogs.map((log: any) => (
                                    <div key={log.id} className="relative pl-4 border-l border-white/10 pb-4 last:pb-0">
                                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-[#050505] bg-indigo-500" />
                                        <div className="flex flex-col gap-1">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-mono text-indigo-300 truncate max-w-[120px]">
                                                    {log.alias.address}
                                                </span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(log.status)}`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-white/80 truncate">{log.sender}</p>
                                            <span className="text-[10px] text-white/30">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: any) {
    return (
        <div className="glass p-5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 hover:bg-white/5 transition-colors">
            <span className="text-2xl mb-1">{icon}</span>
            <span className="text-2xl font-bold text-white">{value}</span>
            <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
        </div>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'SUCCESS': return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'BLOCKED': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
        case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
        default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
}
