"use client";

import React, { useState, useEffect, useCallback } from "react";
import DocumentViewerModal from "./DocumentViewerModal";
import { Eye, Download, Loader2, FileText, RefreshCw, Edit2, Check, Trash2, X } from "lucide-react";
import { documentApi, DocumentSummaryResponse, secureFetch, workspaceApi } from "@/lib/api";
import { BASE_URL } from "@/lib/api/endpoints";

interface RecentDocumentsProps {
  currentWorkspaceUuid: string;
}

export default function RecentDocuments({ currentWorkspaceUuid }: RecentDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentSummaryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingUuid, setDownloadingUuid] = useState<string | null>(null);
  const [activePreviewDoc, setActivePreviewDoc] = useState<DocumentSummaryResponse | null>(null);
  
  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [processingUuid, setProcessingUuid] = useState<string | null>(null);
  const [confirmDeleteUuid, setConfirmDeleteUuid] = useState<string | null>(null);

  const loadWorkspaceFiles = useCallback(async (shouldToggleLoader = false) => {
    if (!currentWorkspaceUuid) return;
    if (shouldToggleLoader) setLoading(true);
    
    try {
      const res = await workspaceApi.getWorkspaceDocuments(currentWorkspaceUuid, 0, 50, true);
      setDocuments(res.content || []);
    } catch (err) {
      console.error("Failed to gather files for space:", err);
    } finally {
      setLoading(false);
    }
  }, [currentWorkspaceUuid]);

  useEffect(() => {
    let isMounted = true;
    const executeAsyncLoad = async () => {
      if (isMounted) await loadWorkspaceFiles(false);
    };
    executeAsyncLoad();
    return () => {
      isMounted = false;
    };
  }, [currentWorkspaceUuid, loadWorkspaceFiles]);

  const handleRenameSubmit = async (docUuid: string) => {
    if (!renameValue.trim() || processingUuid) return;
    setProcessingUuid(docUuid);
    try {
      const updated = await documentApi.renameDocument(docUuid, renameValue.trim());
      setDocuments((prev) =>
        prev.map((doc) => (doc.documentUuid === docUuid ? { ...doc, originalFileName: updated.originalFileName } : doc))
      );
      setEditingUuid(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingUuid(null);
    }
  };

  const handleSoftDeleteExecute = async (docUuid: string) => {
    setProcessingUuid(docUuid);
    try {
      await documentApi.deleteDocument(docUuid); // Calls DELETE /api/v1/documents/{uuid}
      setDocuments((prev) => prev.filter((doc) => doc.documentUuid !== docUuid));
      setConfirmDeleteUuid(null);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingUuid(null);
    }
  };

  const executeSecureDownloadAction = async (doc: DocumentSummaryResponse) => {
    setDownloadingUuid(doc.documentUuid);
    try {
      const response = await secureFetch(`${BASE_URL}/documents/${doc.documentUuid}/download?inline=false`, {
        method: "GET"
      });
      if (!response.ok) throw new Error("Could not download file.");

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
      console.error(err);
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
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          Workspace Documents ({documents.length})
        </h3>
        <button 
          onClick={() => loadWorkspaceFiles(true)}
          className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 cursor-pointer transition-all"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 dark:text-zinc-400 uppercase text-xs tracking-wider">
              <th className="p-4">File Name & Properties</th>
              <th className="p-4 hidden sm:table-cell">Extension Info</th>
              <th className="p-4 text-right">Actions</th>
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
                <tr key={doc.documentUuid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition group">
                  <td className="p-4 font-medium max-w-xs text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-zinc-400 shrink-0" />
                      
                      {editingUuid === doc.documentUuid ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white px-2 py-1 text-xs rounded-lg focus:border-blue-500 outline-none flex-1 min-w-0 font-medium"
                            autoFocus
                            disabled={processingUuid === doc.documentUuid}
                          />
                          <button
                            onClick={() => handleRenameSubmit(doc.documentUuid)}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer transition"
                          >
                            <Check size={12} />
                          </button>
                          <button onClick={() => setEditingUuid(null)} className="p-1 rounded-md text-zinc-400 cursor-pointer">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="truncate">{doc.originalFileName}</span>
                          <button
                            onClick={() => { setEditingUuid(doc.documentUuid); setRenameValue(doc.originalFileName); }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5 transition cursor-pointer shrink-0"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden sm:table-cell text-xs font-mono text-zinc-400">{doc.contentType}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {confirmDeleteUuid === doc.documentUuid ? (
                        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg p-0.5">
                          <span className="text-2xs font-bold text-red-600 dark:text-red-400 px-1.5">Delete?</span>
                          <button
                            onClick={() => handleSoftDeleteExecute(doc.documentUuid)}
                            className="p-1 rounded-md bg-red-600 text-white cursor-pointer"
                          >
                            <Check size={10} />
                          </button>
                          <button onClick={() => setConfirmDeleteUuid(null)} className="p-1 rounded-md text-zinc-400 cursor-pointer">
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setActivePreviewDoc(doc)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition text-zinc-600 dark:text-zinc-300">
                            <Eye size={14} />
                          </button>
                          <button onClick={() => executeSecureDownloadAction(doc)} disabled={downloadingUuid === doc.documentUuid} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition text-zinc-600 dark:text-zinc-300 disabled:opacity-40">
                            <Download size={14} />
                          </button>
                          <button onClick={() => setConfirmDeleteUuid(doc.documentUuid)} className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-red-200 dark:hover:border-red-900 text-zinc-400 hover:text-red-600 transition cursor-pointer">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
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