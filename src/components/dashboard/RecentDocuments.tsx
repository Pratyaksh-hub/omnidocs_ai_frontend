"use client";

import React, { useState, useEffect, useCallback } from "react";
import DocumentViewerModal from "./DocumentViewerModal";
import { secureFetch, api, BASE_URL, DocumentSummaryResponse } from "@/services/api";
import { Eye, Download, Loader2, FileText, RefreshCw } from "lucide-react";

interface RecentDocumentsProps {
  currentWorkspaceUuid: string;
}

export default function RecentDocuments({ currentWorkspaceUuid }: RecentDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentSummaryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentSummaryResponse | null>(null);

  // Core internal API data runner
  const loadWorkspaceFiles = useCallback(async (shouldToggleLoader = false) => {
    if (!currentWorkspaceUuid) return;
    
    if (shouldToggleLoader) {
      setLoading(true);
    }
    
    try {
      const res = await api.getWorkspaceDocuments(currentWorkspaceUuid, 0, 50, true);
      setDocuments(res.content || []);
    } catch (err) {
      console.error("Failed to gather files for context space:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceUuid]);

  // FIXED: Handles loading trigger completely asynchronously to satisfy strict React engine linter bounds
  useEffect(() => {
    let isMounted = true;

    const executeAsyncLoad = async () => {
      // Allow async macro-task loop execution to decouple state changes from direct synchronization layout blocks
      if (isMounted) {
        await loadWorkspaceFiles(false);
      }
    };

    executeAsyncLoad();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspaceUuid, loadWorkspaceFiles]);

  const handleManualRefreshTrigger = () => {
    loadWorkspaceFiles(true);
  };

  const executeSecureDownloadAction = async (doc: DocumentSummaryResponse) => {
    setDownloadingUuid(doc.documentUuid);
    try {
      const response = await secureFetch(`${BASE_URL}/documents/${doc.documentUuid}/download?inline=false`, {
        method: "GET"
      });
      if (!response.ok) throw new Error("Could not pipe download request targets.");

      const fileBlob = await response.blob();
      const localUrl = window.URL.createObjectURL(fileBlob);
      
      const downloadAnchor = document.createElement("a");
      downloadAnchor.href = localUrl;
      downloadAnchor.download = doc.originalFileName;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      
      document.body.removeChild(downloadAnchor);
      window.URL.revokeObjectURL(localUrl);
    } catch (err) {
      console.error("Authorized file fetch execution failure:", err);
    } finally {
      setDownloadingUuid(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center gap-2 text-zinc-500">
        <Loader2 className="animate-spin text-blue-600" size={20} />
        <span className="text-sm font-medium">Reading indexing registries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Workspace Documents ({documents.length})
        </h3>
        <button 
          onClick={handleManualRefreshTrigger}
          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 cursor-pointer transition-all"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
              <th className="p-4">File Parameters</th>
              <th className="p-4 hidden sm:table-cell">Extension Info</th>
              <th className="p-4 text-right">System Triggers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                  No documents found inside this workspace index. Click upload above to add files.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.documentUuid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition">
                  <td className="p-4 font-medium max-w-xs truncate text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileText size={16} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{doc.originalFileName}</span>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-xs font-mono text-zinc-400">{doc.contentType}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setActivePreviewDoc(doc)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition text-zinc-600 dark:text-zinc-300"
                        title="Preview Inline Panel"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => executeSecureDownloadAction(doc)}
                        disabled={downloadingUuid === doc.documentUuid}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition text-zinc-600 dark:text-zinc-300 disabled:opacity-40"
                        title="Save binary down to system root"
                      >
                        {downloadingUuid === doc.documentUuid ? (
                          <Loader2 size={14} className="animate-spin text-blue-600" />
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activePreviewDoc && (
        <DocumentViewerModal
          documentUuid={activePreviewDoc.documentUuid}
          fileName={activePreviewDoc.originalFileName}
          contentType={activePreviewDoc.contentType}
          onClose={() => setActivePreviewDoc(null)}
        />
      )}
    </div>
  );
}