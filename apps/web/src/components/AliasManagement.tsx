"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
    id: string;
    type: string; // "FORWARD" | "BLOCK"
    destination?: string | null;
}

interface Alias {
    id: string;
    address: string;
    rules: Rule[];
}

export default function AliasManagement({ aliases, domain }: { aliases: Alias[], domain: string }) {
    const router = useRouter();
    const [newAlias, setNewAlias] = useState("");
    const [newDestination, setNewDestination] = useState("");
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDestination, setEditDestination] = useState("");
    const [error, setError] = useState("");
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/aliases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address: newAlias.toLowerCase(),
                    destination: newDestination || undefined
                }),
            });

            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg || "Failed to create alias");
            }

            setNewAlias("");
            setNewDestination("");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDestination = async (id: string) => {
        try {
            const res = await fetch("/api/aliases", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, destination: editDestination })
            });
            if (!res.ok) {
                const msg = await res.text();
                throw new Error(msg);
            }
            setEditingId(null);
            router.refresh();
        } catch (err: any) {
            alert("Update failed: " + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this alias? Emails will bounce.")) return;

        try {
            const res = await fetch(`/api/aliases?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            router.refresh();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
        // Toggle logic
        const newStatus = !currentStatus;
        try {
            const res = await fetch("/api/aliases", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, active: newStatus })
            });
            if (!res.ok) throw new Error("Failed to update");
            router.refresh();
        } catch (err) {
            alert("Update failed");
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">My Aliases</h2>

            {/* Creation Form */}
            <form onSubmit={handleCreate} className="mb-8 flex flex-col sm:flex-row gap-2 items-start">
                <div className="flex-1 w-full">
                    <div className="flex items-center border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 focus-within:ring-2 ring-blue-500 mb-2 sm:mb-0">
                        <input
                            type="text"
                            value={newAlias}
                            onChange={(e) => setNewAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                            placeholder="username"
                            className="bg-transparent outline-none flex-1 dark:text-white"
                            minLength={3}
                            maxLength={30}
                            required
                        />
                        <span className="text-gray-500 dark:text-gray-400 select-none">@{domain}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 pl-1">Only lowercase letters, numbers, dots, dashes.</p>
                </div>

                <div className="flex-1 w-full sm:w-auto">
                    <input
                        type="email"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        placeholder="Forward to (optional)"
                        className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 ring-blue-500 h-[42px]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors h-[42px]"
                >
                    {loading ? "Creating..." : "Create"}
                </button>
            </form>

            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

            {/* List */}
            <div className="space-y-3">
                {aliases.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-900 rounded border border-dashed border-gray-300 dark:border-gray-700">
                        No aliases created yet.
                    </div>
                ) : (
                    aliases.map((alias) => {
                        const fullAddress = `${alias.address}@${domain}`;
                        // Determine if active: Look for rules. If any rule is BLOCK, it's inactive. Else active.
                        const isBlocked = alias.rules.some(r => r.type === "BLOCK");
                        const isActive = !isBlocked;

                        // Get destination from rule
                        const activeRule = alias.rules.find(r => r.type === "FORWARD");
                        const destination = activeRule?.destination || "Default Email";

                        return (
                            <div key={alias.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-lg dark:text-gray-200">{fullAddress}</span>
                                            <button
                                                onClick={() => copyToClipboard(fullAddress, alias.id)}
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                                title="Copy to clipboard"
                                            >
                                                {copyFeedback === alias.id ? (
                                                    <span className="text-green-500 text-xs font-bold">Copied!</span>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                )}
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            {isActive ? (
                                                editingId === alias.id ? (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs">→</span>
                                                        <input
                                                            className="border rounded px-2 py-0.5 text-xs dark:bg-gray-600 dark:text-white"
                                                            value={editDestination}
                                                            onChange={(e) => setEditDestination(e.target.value)}
                                                        />
                                                        <button onClick={() => handleUpdateDestination(alias.id)} className="text-green-600 text-xs hover:underline">Save</button>
                                                        <button onClick={() => setEditingId(null)} className="text-gray-500 text-xs hover:underline">Cancel</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 group cursor-pointer" onClick={() => { setEditingId(alias.id); setEditDestination(destination); }}>
                                                        <span>→ {destination}</span>
                                                        <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-500">Edit</span>
                                                    </div>
                                                )
                                            ) : (
                                                "Blocking all emails"
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(alias.id, isActive)}
                                        className={`px-3 py-1.5 text-sm rounded border ${isActive ? 'bg-white border-gray-300 hover:bg-gray-50 text-gray-700' : 'bg-green-100 border-green-200 text-green-800 hover:bg-green-200'}`}
                                    >
                                        {isActive ? "Pause" : "Resume"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(alias.id)}
                                        className="px-3 py-1.5 text-sm rounded border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
