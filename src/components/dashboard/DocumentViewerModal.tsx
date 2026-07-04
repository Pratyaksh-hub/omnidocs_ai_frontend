"use client";

import React, { useEffect, useState, useRef } from "react";
import { secureFetch, BASE_URL } from "@/services/api";
import { X, Loader2, Download, AlertTriangle } from "lucide-react";

interface DocumentViewerModalProps {
  documentUuid: string;
  fileName: string;
  contentType: string;
  onClose: () => void;
}

export default function DocumentViewerModal({ documentUuid, fileName, contentType, onClose }: DocumentViewerModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchedUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedUuidRef.current === documentUuid) return;
    
    let isCurrentTaskActive = true;
    let localBlobUrlString: string | null = null;

    async function loadSecureStream() {
      try {
        setLoading(true);
        setError(null);

        const response = await secureFetch(`${BASE_URL}/documents/${documentUuid}/download?inline=true`, {
          method: "GET",
        });

        if (!response.ok) throw new Error(`Server returned status layout: ${response.status}`);

        const fileBlob = await response.blob();
        
        if (!isCurrentTaskActive) return;

        // Generate a clear browser object URL context mapping string
        localBlobUrlString = window.URL.createObjectURL(fileBlob);
        
        fetchedUuidRef.current = documentUuid;
        setBlobUrl(localBlobUrlString);
      } catch (err) {
        console.error("Secure file preview streaming fell through:", err);
        if (isCurrentTaskActive) {
          setError("Could not resolve secure session access clearances for this file asset.");
        }
      } finally {
        if (isCurrentTaskActive) {
          setLoading(false);
        }
      }
    }

    loadSecureStream();

    return () => {
      isCurrentTaskActive = false;
      if (localBlobUrlString) {
        window.URL.revokeObjectURL(localBlobUrlString);
      }
      fetchedUuidRef.current = null;
    };
  }, [documentUuid]);

  const triggerSecureDownload = () => {
    if (!blobUrl) return;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = blobUrl;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
  };

  const isEmbeddable = 
    contentType.includes("pdf") || 
    contentType.includes("image/") || 
    contentType.includes("text/") ||
    contentType === "application/pdf";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 rounded-l-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="min-w-0 flex-1 mr-4">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate" title={fileName}>
              {fileName}
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono mt-0.5 truncate">{contentType}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {blobUrl && (
              <button
                onClick={triggerSecureDownload}
                className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer transition flex items-center gap-1.5 text-xs font-semibold"
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-xl p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewport Content Panel Section */}
        <div className="flex-1 bg-zinc-100 dark:bg-zinc-950 flex items-center justify-center relative p-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <Loader2 className="animate-spin text-blue-600" size={32} />
              <span className="text-sm font-medium">Decrypting secure document stream...</span>
            </div>
          )}

          {error && (
            <div className="max-w-md p-6 text-center space-y-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
              <AlertTriangle className="text-red-500 mx-auto" size={32} />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{error}</p>
            </div>
          )}

          {!loading && !error && blobUrl && (
            <>
              {isEmbeddable ? (
                /* FIXED: Replaced standard sandboxed iframe with a clean object container tag */
                <object
                  data={blobUrl}
                  type={contentType}
                  className="w-full h-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white"
                  aria-label="Secure Document Render Frame"
                >
                  <div className="text-center p-6 text-zinc-500">
                    Your current browser configuration cannot open this asset inline. 
                    <button onClick={triggerSecureDownload} className="text-blue-600 font-semibold underline ml-1">Click here to save locally.</button>
                  </div>
                </object>
              ) : (
                <div className="max-w-md p-6 text-center space-y-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
                  <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full w-fit mx-auto">
                    <Download size={32} className="text-zinc-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">Preview Window Unavailable</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      This specific file extension format cannot be compiled natively within the dashboard modal viewport page sheet.
                    </p>
                  </div>
                  <button
                    onClick={triggerSecureDownload}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm cursor-pointer transition shadow-sm"
                  >
                    Download File Safely
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}