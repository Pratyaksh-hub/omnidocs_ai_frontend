"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { api, DocumentSummaryResponse } from "@/services/api";
import { Trash2, Loader2, RefreshCw, Undo2, AlertCircle, FileText, Folder } from "lucide-react";

export default function TrashPage() {
  const [trashDocs, setTrashDocs] = useState<DocumentSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function fetchGlobalTrash(forceRefresh = false) {
    try {
      // Pulls all files natively marked as deleted across your entire DB cluster instance
      const paginatedTrash = await api.getTrashDocuments(0, 100, forceRefresh);
      setTrashDocs(paginatedTrash.content || []);
    } catch {
      console.error("Failed to cleanly sync global trash bin metrics");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setActioningId(null);
    }
  }

  useEffect(() => {
    // Avoid calling setState synchronously inside the effect body by
    // invoking the async fetch function from an async callback.
    const run = async () => {
      await fetchGlobalTrash(false);
    };
    run();
  }, []);

  const handleRestore = async (uuid: string, name: string) => {
    setActioningId(uuid);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/documents/${uuid}/restore`, { method: "POST" });
      if (!res.ok) throw new Error();
      alert(`"${name}" restored successfully.`);
      setTrashDocs((prev) => prev.filter((doc) => doc.documentUuid !== uuid));
    } catch {
      alert("Failed to restore item.");
    } finally {
      setActioningId(null);
    }
  };

  const handlePermanentDelete = async (uuid: string, name: string) => {
    if (!confirm(`Permanently purge "${name}"?`)) return;
    setActioningId(uuid);
    try {
      await fetch(`http://localhost:8080/api/v1/documents/${uuid}/permanent`, { method: "DELETE" });
      setTrashDocs((prev) => prev.filter((doc) => doc.documentUuid !== uuid));
    } catch {
      alert("Error purging metadata.");
    } finally {
      setActioningId(null);
    }
  };

  if (loading && !isRefreshing) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-medium">Scanning global trash storage sectors...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        
        {/* Simplified Header Controls Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Trash Bin</h1>
            <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Review soft-deleted files or purge them permanently from your Spring AI engine vectors.
            </p>
          </div>
          
          <button
            onClick={() => { setIsRefreshing(true); fetchGlobalTrash(true); }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
            title="Refresh global trash list"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
          </button>
        </div>

        {/* Warning Information Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Retention Rule Node:</strong> Restoring documents will instantly re-integrate their tokens back into active vector indices, making them available for the AI engine to query.
          </p>
        </div>

        {/* Render List View */}
        {trashDocs.length === 0 ? (
          <div className="sys-panel py-16 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 stroke-[1.5]" />
            <p className="text-sm font-medium mt-4 text-zinc-600 dark:text-zinc-300">Your trash repository is empty.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">No soft-deleted data records exist inside your cluster database right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashDocs.map((doc) => {
              const docId = doc.documentUuid || (doc as unknown as Record<string, unknown>).uuid;
              const workspaceName = String((doc as unknown as Record<string, unknown>).workspaceName || "Unknown Workspace");
              return (
              <div 
                key={docId as string}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 shrink-0">
                    <FileText size={22} />
                  </div>
                  
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                      {doc.originalFileName}
                    </h3>
                    
                    {/* Origin Environment Tracker Badge */}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      <Folder size={12} className="text-zinc-400 dark:text-zinc-500" />
                      <span>From Workspace: </span>
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                        {workspaceName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interaction Button Controls */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRestore(docId as string, doc.originalFileName)}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition text-zinc-700 dark:text-zinc-200"
                  >
                    {actioningId === docId ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Undo2 size={14} />
                    )}
                    <span>Restore</span>
                  </button>

                  <button
                    onClick={() => handlePermanentDelete(docId as string, doc.originalFileName)}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    <Trash2 size={14} />
                    <span>Purge Forever</span>
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}