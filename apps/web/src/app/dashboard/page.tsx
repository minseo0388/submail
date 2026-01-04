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

    // Fetch aliases
    // Handle case where user might not exist in DB yet (if they logged in but api didn't sync)
    // Actually, in our API POST we upsert user. Here, we might get empty array.
    // Fetch recent logs (limit 20)
    // We need logs where alias.userId = userId.
    // However, Log model relates to Alias.
    const aliases = await prisma.alias.findMany({
        where: { userId: userId },
        include: { rules: true }
    });

    const recentLogs = await (prisma as any).log.findMany({
        where: {
            alias: {
                userId: userId
            }
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { alias: true }
    });

    const domain = process.env.SMTP_DOMAIN || "example.com";

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6 dark:text-white">Dashboard (Submail)</h1>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Welcome, {session.user?.name}</h2>
                    <div className="flex gap-2">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                            {session.user.email}
                        </span>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                            Verified Member
                        </span>
                    </div>
                </div>

                <AliasManagement aliases={aliases} domain={domain} />

                {/* Activity Logs Section */}
                <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Activity Log</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Alias</th>
                                    <th className="px-6 py-3">Sender</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentLogs.length === 0 ? (
                                    <tr className="bg-white dark:bg-gray-800">
                                        <td colSpan={4} className="px-6 py-4 text-center">No activity yet.</td>
                                    </tr>
                                ) : (
                                    recentLogs.map((log: any) => (
                                        <tr key={log.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                                            <td className="px-6 py-4">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-blue-600 font-medium">{log.alias.address}</td>
                                            <td className="px-6 py-4">{log.sender}</td>
                                            <td className="px-6 py-4">
                                                {log.status === 'SUCCESS' && <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Success</span>}
                                                {log.status === 'BLOCKED' && <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Blocked</span>}
                                                {log.status === 'FAILED' && <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Failed</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
