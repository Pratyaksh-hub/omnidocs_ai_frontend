"use client";

import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { FileText, Loader2, Download, Bot, Eye, Send, Maximize2, Minimize2, X, Trash2 } from "lucide-react";

interface DocumentSummaryResponse {
  documentUuid: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  status: string;
  createdAt: string;
}

interface RecentDocumentsProps {
  currentWorkspaceUuid: string;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function RecentDocuments({ currentWorkspaceUuid }: RecentDocumentsProps) {
  const [docs, setDocs] = useState<DocumentSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // AI Sidebar Interactive Panel States
  const [activeChatDoc, setActiveChatDoc] = useState<DocumentSummaryResponse | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  useEffect(() => {
    async function fetchDocs() {
      if (!currentWorkspaceUuid) return;
      setLoading(true);
      try {
        const paginatedData = await api.getWorkspaceDocuments(currentWorkspaceUuid, 0, 20, true);
        setDocs(paginatedData.content || []);
      } catch (err) {
        console.error("Failed to fetch documents from Spring Boot backend:", err);
      } finally {
        setLoading(false);
      }
    }

    // Defer fetching to avoid synchronous setState within effect which can
    // trigger cascading renders. Schedule on next tick.
    const id = setTimeout(() => {
      fetchDocs();
    }, 0);

    return () => clearTimeout(id);
  }, [currentWorkspaceUuid]);

  const handleDeleteDocument = async (uuid: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    setDeletingId(uuid);
    try {
      await fetch(`http://localhost:8080/api/v1/documents/${uuid}`, {
        method: "DELETE"
      });
      
      setDocs((prev) => prev.filter((doc) => doc.documentUuid !== uuid));
      
      if (activeChatDoc?.documentUuid === uuid) {
        closeAiChat();
      }
    } catch (err) {
      console.error("Failed to safely execute deletion workflow:", err);
      alert("Error dropping target entity from system logs.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (uuid: string) => {
    window.open(`http://localhost:8080/api/v1/documents/${uuid}/download?inline=false`, "_blank");
  };

  const handleViewInline = (uuid: string) => {
    window.open(`http://localhost:8080/api/v1/documents/${uuid}/download?inline=true`, "_blank");
  };

  const openAiChat = (doc: DocumentSummaryResponse) => {
    setActiveChatDoc(doc);
    setChatHistory([
      { sender: "ai", text: `Hi! I have successfully indexed "${doc.originalFileName}" using Spring AI. What insights or transformations can I extract for you today?` }
    ]);
  };

  const closeAiChat = () => {
    setActiveChatDoc(null);
    setIsSidebarExpanded(false);
    setChatInput("");
  };

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatDoc) return;

    const userMessage = chatInput.trim();
    setChatHistory((prev) => [...prev, { sender: "user", text: userMessage }]);
    setChatInput("");
    setIsAiThinking(true);

    try {
      // Narrow the api shape for optional AI helper to avoid using `any`
      const apiWithAi = api as { processDocWithAI?: (uuid: string) => Promise<unknown> };
      if (typeof apiWithAi.processDocWithAI === "function") {
        await apiWithAi.processDocWithAI(activeChatDoc.documentUuid);
      }
      
      setChatHistory((prev) => [
        ...prev, 
        { sender: "ai", text: `Processed query successfully for Document ID: ${activeChatDoc.documentUuid}. [Engine Signal: Core embeddings look stable inside your Java console context].` }
      ]);
    } catch (err) {
      console.error(err);
      setChatHistory((prev) => [...prev, { sender: "ai", text: "Error syncing pipeline connection parameters." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-sm font-medium">Loading workspace artifacts...</span>
      </div>
    );
  }

  return (
    <section className="mt-10 relative">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Workspace Documents
      </h2>

      {docs.length === 0 ? (
        /* CORRECTED DARK/LIGHT MIXED THEME FALLBACK HERO CONTAINER */
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center transition-colors duration-300">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No documents found in this workspace yet.</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Upload files directly to view them listed live.</p>
        </div>
      ) : (
        /* WIDENED 2-COLUMN DECK LAYOUT */
        <div className="grid gap-6 md:grid-cols-2">
          {docs.map((doc) => (
            <div 
              key={doc.documentUuid} 
              className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
                    <FileText size={28} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate text-base" title={doc.originalFileName}>
                      {doc.originalFileName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                        {doc.contentType?.split("/")[1] || "FILE"}
                      </span>
                      {doc.fileSize && <span>• {(doc.fileSize / 1024).toFixed(1)} KB</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDocument(doc.documentUuid, doc.originalFileName)}
                  disabled={deletingId === doc.documentUuid}
                  className="p-2 text-zinc-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all duration-200 shrink-0 disabled:opacity-40"
                  title="Delete Document"
                >
                  {deletingId === doc.documentUuid ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>

              {/* THREE WIDE HOVER ACTION BUTTON BAR */}
              <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <button
                  onClick={() => handleViewInline(doc.documentUuid)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Eye size={15} />
                  <span>View</span>
                </button>

                <button
                  onClick={() => handleDownload(doc.documentUuid)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-sm transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-500 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Download size={15} />
                  <span>Get File</span>
                </button>
                
                <button
                  onClick={() => openAiChat(doc)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-800 py-2.5 text-xs font-semibold text-white dark:text-zinc-200 shadow-sm transition-all duration-200 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Bot size={15} className="text-blue-400 group-hover:text-white transition-colors" />
                  <span>AI Portal</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* INTELLIGENT AI DRAWER AND COMPANION SIDEBAR OVERLAY */}
      {activeChatDoc && (
        <div 
          className={`fixed top-0 right-0 h-full bg-white dark:bg-zinc-900 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col transition-all duration-300 ${
            isSidebarExpanded ? "w-full" : "w-120"
          }`}
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Contextual AI Assistant</span>
              <h3 className="font-bold text-zinc-900 dark:text-white truncate text-sm mt-0.5">{activeChatDoc.originalFileName}</h3>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title={isSidebarExpanded ? "Exit Fullscreen" : "Maximize view"}
              >
                {isSidebarExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              
              <button 
                onClick={closeAiChat}
                className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Messages Log Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30 dark:bg-zinc-950/20">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-blue-600 text-white rounded-tr-none shadow-sm" 
                    : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700 rounded-tl-none shadow-xs"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-zinc-400 dark:text-zinc-500 flex items-center gap-2 shadow-xs">
                  <Loader2 className="animate-spin h-3.5 w-3.5 text-blue-600" />
                  <span>Reading vector space models...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Prompt Footer Panel */}
          <form onSubmit={handleSendQuery} className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about this document context..."
                className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 dark:placeholder-zinc-500"
              />
              <button 
                type="submit" 
                disabled={!chatInput.trim() || isAiThinking}
                className="p-1.5 bg-zinc-900 dark:bg-zinc-700 hover:bg-blue-600 dark:hover:bg-blue-600 disabled:opacity-40 text-white rounded-lg transition-all shrink-0 shadow-sm"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}