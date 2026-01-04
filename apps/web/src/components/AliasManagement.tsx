"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
    id: string;
    type: string;
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
        if (!confirm("Are you sure? This action cannot be undone.")) return;

        try {
            const res = await fetch(`/api/aliases?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            router.refresh();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean) => {
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
        <div className="glass rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-white mb-6">Manage Aliases</h2>

            {/* Creation Form */}
            <form onSubmit={handleCreate} className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-4 items-start md:items-center">

                <div className="flex-1 w-full relative">
                    <input
                        type="text"
                        value={newAlias}
                        onChange={(e) => setNewAlias(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                        placeholder="your-alias"
                        className="w-full bg-black/20 text-white border border-white/10 rounded-xl px-4 py-3 pr-32 focus:outline-none focus:border-indigo-500 transition-colors"
                        minLength={3}
                        maxLength={30}
                        required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">
                        @{domain}
                    </span>
                </div>

                <div className="flex-[0.7] w-full">
                    <input
                        type="email"
                        value={newDestination}
                        onChange={(e) => setNewDestination(e.target.value)}
                        placeholder="Forward to (optional)"
                        className="w-full bg-black/20 text-white border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto btn-primary px-6 py-3 rounded-xl font-bold text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Generating..." : "Create Alias"}
                </button>
            </form>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2">
                    <span className="text-lg">⚠️</span> {error}
                </div>
            )}

            {/* Alias List */}
            <div className="space-y-4">
                {aliases.length === 0 ? (
                    <div className="text-center py-12 text-white/30 border-2 border-dashed border-white/10 rounded-2xl">
                        No aliases found. Create your first one above!
                    </div>
                ) : (
                    aliases.map((alias) => {
                        const fullAddress = `${alias.address}@${domain}`;
                        const isBlocked = alias.rules.some(r => r.type === "BLOCK");
                        const isActive = !isBlocked;
                        const activeRule = alias.rules.find(r => r.type === "FORWARD");
                        const destination = activeRule?.destination || "Default Email";

                        return (
                            <div key={alias.id} className="group glass-hover bg-white/5 rounded-2xl p-4 md:p-6 transition-all border border-transparent hover:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">

                                <div className="flex items-start gap-4">
                                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isActive ? 'bg-green-400 shadow-green-500/50' : 'bg-red-400 shadow-red-500/50'}`} />

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono text-lg font-medium ${isActive ? 'text-white' : 'text-white/40 line-through'}`}>
                                                {alias.address}
                                                <span className="text-white/30">@{domain}</span>
                                            </span>

                                            <button
                                                onClick={() => copyToClipboard(fullAddress, alias.id)}
                                                className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors"
                                                title="Copy Address"
                                            >
                                                {copyFeedback === alias.id ? (
                                                    <span className="text-green-400 text-xs font-bold">✓</span>
                                                ) : (
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                                )}
                                            </button>
                                        </div>

                                        <div className="text-sm text-white/50 flex items-center gap-2">
                                            {isActive ? (
                                                editingId === alias.id ? (
                                                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                                                        <span className="text-xs ml-1">→</span>
                                                        <input
                                                            className="bg-transparent border-none text-white text-xs w-32 focus:ring-0"
                                                            value={editDestination}
                                                            onChange={(e) => setEditDestination(e.target.value)}
                                                            autoFocus
                                                        />
                                                        <button onClick={() => handleUpdateDestination(alias.id)} className="text-green-400 text-xs px-2 hover:bg-white/10 rounded">Save</button>
                                                        <button onClick={() => setEditingId(null)} className="text-white/40 text-xs px-2 hover:bg-white/10 rounded">✕</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-indigo-300 transition-colors" onClick={() => { setEditingId(alias.id); setEditDestination(destination); }}>
                                                        <span className="text-xs">↳</span>
                                                        <span>{destination}</span>
                                                        <span className="opacity-0 group-hover:opacity-100 text-[10px] bg-white/10 px-1 rounded">EDIT</span>
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-red-400/60 text-xs">⛔ Paused (Messages Rejected)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pl-6 md:pl-0 border-l border-white/5 md:border-l-0">
                                    <button
                                        onClick={() => handleToggle(alias.id, isActive)}
                                        className={`px-4 py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${isActive
                                                ? 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            }`}
                                    >
                                        {isActive ? "Pause" : "Resume"}
                                    </button>

                                    <button
                                        onClick={() => handleDelete(alias.id)}
                                        className="p-2 text-white/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete Alias"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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
