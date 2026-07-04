"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import AlertBanner from "@/components/shared/AlertBanner";
import { aiApi, workspaceApi, WorkspaceResponse } from "@/lib/api";
import { documentApi } from "@/lib/api";
import { FolderPlus, Loader2, UploadCloud, Folder, RefreshCw, X, Edit2, Check, Send, Bot, User, MessageSquare, Maximize2, Minimize2, Menu } from "lucide-react";

interface MessageLog {
  id: string;
  sender: "user" | "ai";
  text: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeUuid, setActiveUuid] = useState("");
  const [activeName, setActiveName] = useState("");

  const [refreshKey, setRefreshKey] = useState<number>(0);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalWsName, setModalWsName] = useState("");

  const [editingUuid, setEditingUuid] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // NEW: State to control page-specific mobile folders drawer
  const [isMobileFoldersOpen, setIsMobileFoldersOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState<Record<string, MessageLog[]>>({});
  const [chatInputValue, setChatInputValue] = useState("");
  const [isChatProcessing, setIsChatProcessing] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const [isChatEnabled, setIsChatEnabled] = useState(false);
  const [isChatMaximized, setIsChatMaximized] = useState(false);

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

  useEffect(() => {
    if (isChatEnabled) {
      chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, activeUuid, isChatEnabled]);

  const fetchAllSpaces = useCallback(async (forceRefresh = false) => {
    try {
      const data = await workspaceApi.getAllWorkspaces(0, 100, forceRefresh);
      setWorkspaces(data);
      
      const savedUuid = localStorage.getItem("active_workspace_uuid");
      
      if (savedUuid && data.some(space => space.uuid === savedUuid)) {
        const activeMatch = data.find(space => space.uuid === savedUuid);
        setActiveUuid(savedUuid);
        setActiveName(activeMatch?.name || "Selected Workspace");
      } else if (data.length > 0) {
        setActiveUuid(data[0].uuid);
        setActiveName(data[0].name);
      }
    } catch (err) {
      console.error("Could not fetch remote workspace collection arrays:", err);
      triggerNotification(null, "System failed to aggregate workspace environments.");
    } finally {
      setLoadingWorkspaces(false);
      setIsHydrated(true);
      setIsRefreshing(false);
    }
  }, [triggerNotification]);

  useEffect(() => {
    let isMounted = true;
    
    const initializeWorkspaces = async () => {
      try {
        const data = await workspaceApi.getAllWorkspaces(0, 100, false);
        if (!isMounted) return;
        
        setWorkspaces(data);
        const savedUuid = localStorage.getItem("active_workspace_uuid");
        
        if (savedUuid && data.some(space => space.uuid === savedUuid)) {
          const activeMatch = data.find(space => space.uuid === savedUuid);
          setActiveUuid(savedUuid);
          setActiveName(activeMatch?.name || "Selected Workspace");
        } else if (data.length > 0) {
          setActiveUuid(data[0].uuid);
          setActiveName(data[0].name);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Could not fetch remote workspace collection arrays:", err);
          triggerNotification(null, "System initialization failed to hook database channels.");
        }
      } finally {
        if (isMounted) {
          setLoadingWorkspaces(false);
          setIsHydrated(true);
        }
      }
    };
    
    initializeWorkspaces();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    clearNotificationStates();
    setRefreshKey((prev) => prev + 1);
    fetchAllSpaces(true);
  };

  const selectWorkspace = (space: WorkspaceResponse) => {
    if (editingUuid !== space.uuid) setEditingUuid(null);
    
    setActiveUuid(space.uuid);
    setActiveName(space.name);
    localStorage.setItem("active_workspace_uuid", space.uuid);
    localStorage.setItem("active_workspace_name", space.name);
    clearNotificationStates();
    setIsMobileFoldersOpen(false); // Auto-close drawer on selection
  };

  const executeWorkspaceProvisioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalWsName || !modalWsName.trim()) return;

    setIsCreating(true);
    try {
      const targetName = modalWsName.trim();
      const newWs = await workspaceApi.createWorkspace({
        name: targetName,
        description: `Dedicated storage pool for ${targetName}`
      });

      setWorkspaces((prev) => [newWs, ...prev]);
      selectWorkspace(newWs);
      setShowCreateModal(false);
      setModalWsName("");
      triggerNotification(`Workspace "${newWs.name}" built successfully!`, null);
    } catch (err) {
      console.error(err);
      triggerNotification(null, err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameWorkspaceSubmit = async (spaceUuid: string) => {
    if (!renameInputValue || !renameInputValue.trim() || isRenaming) return;

    setIsRenaming(true);
    try {
      const cleanName = renameInputValue.trim();
      const updatedWs = await workspaceApi.renameWorkspace(spaceUuid, cleanName);

      setWorkspaces((prev) =>
        prev.map((ws) => (ws.uuid === spaceUuid ? { ...ws, name: updatedWs.name } : ws))
      );

      if (activeUuid === spaceUuid) {
        setActiveName(updatedWs.name);
        localStorage.setItem("active_workspace_name", updatedWs.name);
      }

      setEditingUuid(null);
      triggerNotification(`Workspace successfully renamed to "${updatedWs.name}"!`, null);
    } catch (err) {
      console.error(err);
      triggerNotification(null, err);
    } finally {
      setIsRenaming(false);
    }
  };

  const startRenameWorkflow = (e: React.MouseEvent, space: WorkspaceResponse) => {
    e.stopPropagation();
    setEditingUuid(space.uuid);
    setRenameInputValue(space.name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await documentApi.uploadDocument(activeUuid, file);
      triggerNotification(`"${file.name}" uploaded to target workspace successfully!`, null);
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      triggerNotification(null, err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputValue.trim() || isChatProcessing || !activeUuid) return;

    const query = chatInputValue.trim();
    setChatInputValue("");

    const userMsg: MessageLog = { id: `u-${Date.now()}`, sender: "user", text: query };
    setChatMessages((prev) => ({
      ...prev,
      [activeUuid]: [...(prev[activeUuid] || []), userMsg],
    }));
    setIsChatProcessing(true);

    try {
      const result = await aiApi.askWorkspace(activeUuid, query);
      const aiMsg: MessageLog = { id: `ai-${Date.now()}`, sender: "ai", text: result.answer };
      setChatMessages((prev) => ({
        ...prev,
        [activeUuid]: [...(prev[activeUuid] || []), aiMsg],
      }));
    } catch (err: unknown) {
      console.error("RAG pipeline breakdown:", err);
      const fallbackMsg = err instanceof Error ? err.message : "Isolation lookup dropped. Please retry.";
      const errMsg: MessageLog = { id: `err-${Date.now()}`, sender: "ai", text: fallbackMsg };
      setChatMessages((prev) => ({
        ...prev,
        [activeUuid]: [...(prev[activeUuid] || []), errMsg],
      }));
    } finally {
      setIsChatProcessing(false);
    }
  };

  const currentWorkspaceMessages = chatMessages[activeUuid] || [];

  const renderFoldersContent = () => (
    <>
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Workspace Folders</span>
        <div className="flex items-center gap-1">
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={() => { clearNotificationStates(); setShowCreateModal(true); }}
            disabled={isCreating}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-1 overflow-y-auto max-h-[60vh] lg:max-h-[72vh] pr-1 mt-3">
        {workspaces.map((space) => (
          <div
            key={space.uuid}
            onClick={() => selectWorkspace(space)}
            className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
              activeUuid === space.uuid 
                ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold" 
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
              <Folder size={16} className={activeUuid === space.uuid ? "text-blue-600 dark:text-blue-400" : "text-zinc-400"} />
              {editingUuid === space.uuid ? (
                <input
                  type="text"
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameWorkspaceSubmit(space.uuid);
                    if (e.key === "Escape") setEditingUuid(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-xs px-2 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 outline-none font-medium focus:border-blue-500"
                  autoFocus
                  disabled={isRenaming}
                />
              ) : (
                <span className="truncate">{space.name}</span>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-1">
              {editingUuid === space.uuid ? (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRenameWorkspaceSubmit(space.uuid); }}
                  className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                  disabled={isRenaming}
                >
                  {isRenaming ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                </button>
              ) : (
                <button
                  onClick={(e) => startRenameWorkflow(e, space)}
                  className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (!isHydrated || loadingWorkspaces) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-sm font-medium">Synchronizing application pools...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 text-zinc-900 dark:text-zinc-100 relative min-h-[85vh] flex flex-col">
        
        <div 
          className={`transition-all duration-1000 ease-in-out ${
            isBannerVisible ? "opacity-100 max-h-40 transform translate-y-0" : "opacity-0 max-h-0 overflow-hidden transform -translate-y-2 pointer-events-none"
          }`}
        >
          <AlertBanner success={success} error={error} onClose={clearNotificationStates} />
        </div>

        {/* MOBILE RE-ROUTE PICKER TOOL BAR: Appears only on small screens */}
        <div className="lg:hidden flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <button
            onClick={() => setIsMobileFoldersOpen(true)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-xl text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <Menu size={14} />
            <span>Select Workspace ({workspaces.length})</span>
          </button>
          <span className="text-xs font-semibold text-zinc-500 truncate max-w-40">Active: {activeName || "None"}</span>
        </div>

        {/* Content Layout Inner Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 relative pr-0">
          
          {/* DESKTOP WORKSPACE SIDE BAR PANELS (Hidden on Mobile) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 border-r border-zinc-200 dark:border-zinc-800 pr-4">
            {renderFoldersContent()}
          </div>

          {/* MOBILE SLIDING FOLDER OVERLAY DRAWER */}
          <aside className={`
            fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-950 p-6 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 lg:hidden
            ${isMobileFoldersOpen ? "translate-x-0" : "-translate-x-full"}
          `}>
            <div className="flex justify-end mb-2">
              <button onClick={() => setIsMobileFoldersOpen(false)} className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>
            {renderFoldersContent()}
          </aside>

          {/* MOBILE FOLDER BACKDROP MASK */}
          {isMobileFoldersOpen && (
            <div onClick={() => setIsMobileFoldersOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden" />
          )}

          {/* Main Context Explorer Stream Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Active Pool</span>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">{activeName || "No Workspace Loaded"}</h1>
                {activeUuid && <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-1">UUID: {activeUuid}</p>}
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                {activeUuid && !isChatEnabled && (
                  <button
                    onClick={() => setIsChatEnabled(true)}
                    className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                    <span>Open Copilot</span>
                  </button>
                )}

                {activeUuid && (
                  <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition cursor-pointer">
                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                    <span>{isUploading ? "Uploading..." : "Upload Document"}</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  </label>
                )}
              </div>
            </div>

            {activeUuid ? (
              <RecentDocuments key={`${activeUuid}-${refreshKey}`} currentWorkspaceUuid={activeUuid} />
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-900">
                <p className="text-sm text-zinc-500 font-medium">No workspace instance active.</p>
              </div>
            )}
          </div>

        </div>

        {/* ANIMATED SLIDING COPILOT FLYOUT DRAW BAR */}
        <div 
          className={`fixed top-0 right-0 h-screen bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-50 shadow-2xl ${
            isChatEnabled 
              ? isChatMaximized ? "w-screen opacity-100" : "w-full sm:w-96 opacity-100"
              : "w-0 opacity-0 border-l-0 pointer-events-none"
          }`}
        >
          {/* Flyout Header */}
          <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between h-16 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={16} className="text-blue-600 shrink-0" />
              <h3 className="text-sm font-bold uppercase tracking-wider truncate">Workspace Copilot</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setIsChatMaximized(!isChatMaximized)} className="hidden sm:block p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
                {isChatMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button onClick={() => { setIsChatEnabled(false); setIsChatMaximized(false); }} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Grid Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/10">
            {currentWorkspaceMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <Bot size={26} className="text-zinc-400" />
                <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Grounded Chat Pipeline</p>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">Ask anything related to this storage group framework pool.</p>
              </div>
            )}

            {currentWorkspaceMessages.map((msg) => (
              <div key={msg.id} className={`flex items-start gap-2 max-w-[90%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`p-1.5 rounded-lg border shrink-0 ${msg.sender === "user" ? "bg-blue-600 text-white border-blue-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                  {msg.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                </div>
                <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs ${msg.sender === "user" ? "bg-blue-600 text-white font-medium" : "bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800"}`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {isChatProcessing && (
              <div className="flex items-center gap-2 text-zinc-400 text-[11px] animate-pulse pl-1">
                <Loader2 size={12} className="animate-spin text-blue-500" />
                <span>Scanning isolated matrix vector embeddings...</span>
              </div>
            )}
            <div ref={chatScrollRef} />
          </div>

          {/* Input Chat Box Interface */}
          <form onSubmit={handleSendChatMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white transition">
              <input
                type="text"
                value={chatInputValue}
                onChange={(e) => setChatInputValue(e.target.value)}
                placeholder="Query documents in this pool..."
                className="flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400"
                disabled={isChatProcessing}
              />
              <button type="submit" disabled={!chatInputValue.trim() || isChatProcessing} className="p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30 transition cursor-pointer">
                <Send size={12} />
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* COMPONENT MODAL POPUP GATE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="text-lg font-bold">Provision Workspace</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-zinc-600 rounded-lg p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={executeWorkspaceProvisioning} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Workspace Name</label>
                <input
                  type="text"
                  value={modalWsName}
                  onChange={(e) => setModalWsName(e.target.value)}
                  placeholder="e.g., Spring-AI-Vectors"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 transition cursor-pointer" disabled={isCreating}>
                  Cancel
                </button>
                <button type="submit" disabled={isCreating || !modalWsName.trim()} className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer">
                  {isCreating && <Loader2 size={12} className="animate-spin" />}
                  <span>Provision</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}