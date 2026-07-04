"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AlertBanner from "@/components/shared/AlertBanner";
import { api, DocumentSummaryResponse } from "@/services/api";
import { Trash2, Loader2, RefreshCw, Undo2, AlertCircle, FileText, Folder, Check, X } from "lucide-react";

export default function TrashPage() {
  const [trashDocs, setTrashDocs] = useState<DocumentSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  
  // Custom Confirmation state tracking
  const [confirmPurgeUuid, setConfirmPurgeUuid] = useState<string | null>(null);

  // Global Notification States
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearNotificationStates = () => {
    if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    setIsBannerVisible(false);
    setSuccess(null);
    setError(null);
  };

  const triggerNotification = useCallback((successText: string | null, errorObj: unknown | null) => {
    if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);

    setSuccess(successText);
    setError(errorObj);
    setIsBannerVisible(true);

    autoDismissTimeoutRef.current = setTimeout(() => {
      setIsBannerVisible(false);

      fadeOutTimeoutRef.current = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 1000);
    }, 10000);
  }, []);

  const fetchGlobalTrash = useCallback(async (forceRefresh = false) => {
    try {
      const paginatedTrash = await api.getTrashDocuments(0, 100, forceRefresh);
      setTrashDocs(paginatedTrash.content || []);
    } catch (err) {
      console.error("Failed to cleanly sync global trash bin metrics:", err);
      // Centralized text intercepts passed straight into user alerts
      triggerNotification(null, err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    let isMounted = true;
    
    const run = async () => {
      if (isMounted) {
        await fetchGlobalTrash(false);
      }
    };
    run();

    return () => {
      isMounted = false;
      if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    };
  }, [fetchGlobalTrash]);

  const handleRestore = async (uuid: string, name: string) => {
    setActioningId(uuid);
    setConfirmPurgeUuid(null);
    try {
      await api.restoreDocument(uuid);
      setTrashDocs((prev) => prev.filter((doc) => {
        const docId = doc.documentUuid || (doc as unknown as Record<string, unknown>).uuid;
        return docId !== uuid;
      }));
      triggerNotification(`"${name}" restored successfully back to its workspace!`, null);
    } catch (err) {
      triggerNotification(null, err);
    } finally {
      setActioningId(null);
    }
  };

  const handlePermanentDelete = async (uuid: string, name: string) => {
    setActioningId(uuid);
    try {
      await api.permanentDeleteDocument(uuid);
      setTrashDocs((prev) => prev.filter((doc) => {
        const docId = doc.documentUuid || (doc as unknown as Record<string, unknown>).uuid;
        return docId !== uuid;
      }));
      setConfirmPurgeUuid(null);
      triggerNotification(`Document "${name}" permanently purged from system memory.`, null);
    } catch (err) {
      triggerNotification(null, err);
    } finally {
      setActioningId(null);
    }
  };

  if (loading && !isRefreshing) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-sm font-medium">Scanning global trash storage sectors...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 relative">
        
        {/* Animated Central Notification Banner */}
        <div 
          className={`transition-all duration-1000 ease-in-out ${
            isBannerVisible ? "opacity-100 max-h-40 transform translate-y-0" : "opacity-0 max-h-0 overflow-hidden transform -translate-y-2 pointer-events-none"
          }`}
        >
          <AlertBanner 
            success={success} 
            error={error} 
            onClose={clearNotificationStates} 
          />
        </div>

        {/* Header Controls Bar */}
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
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
            title="Refresh global trash list"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
          </button>
        </div>

        {/* Warning Information Banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-amber-800 dark:text-amber-300 text-sm leading-relaxed">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Retention Rule:</strong> Restoring documents will instantly re-integrate their tokens back into active vector indices, making them available for the AI engine to query.
          </p>
        </div>

        {/* Render List View */}
        {trashDocs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-16 text-center">
            <Trash2 className="mx-auto h-12 w-12 text-zinc-400 dark:text-zinc-500 stroke-[1.5]" />
            <p className="text-sm font-medium mt-4 text-zinc-600 dark:text-zinc-300">Your trash repository is empty.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">No soft-deleted data records exist inside your database right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trashDocs.map((doc) => {
              const docId = (doc.documentUuid || (doc as unknown as Record<string, unknown>).uuid) as string;
              const workspaceName = String((doc as unknown as Record<string, unknown>).workspaceName || "Unknown Workspace");
              
              return (
                <div 
                  key={docId}
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
                    {confirmPurgeUuid === docId ? (
                      <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-1">
                        <span className="text-xs font-bold text-red-600 dark:text-red-400 px-1.5">Purge Forever?</span>
                        <button
                          onClick={() => handlePermanentDelete(docId, doc.originalFileName)}
                          disabled={actioningId !== null}
                          className="p-1 rounded-md bg-red-600 text-white cursor-pointer transition"
                        >
                          {actioningId === docId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                        <button 
                          onClick={() => setConfirmPurgeUuid(null)} 
                          className="p-1 rounded-md text-zinc-400 cursor-pointer"
                          disabled={actioningId !== null}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleRestore(docId, doc.originalFileName)}
                          disabled={actioningId !== null}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition text-zinc-700 dark:text-zinc-200 cursor-pointer"
                        >
                          {actioningId === docId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Undo2 size={14} />
                          )}
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => setConfirmPurgeUuid(docId)}
                          disabled={actioningId !== null}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Purge Forever</span>
                        </button>
                      </>
                    )}
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