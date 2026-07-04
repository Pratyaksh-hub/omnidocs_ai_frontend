"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import AlertBanner from "@/components/shared/AlertBanner";
import { api, WorkspaceResponse } from "@/services/api";
import { FolderPlus, Loader2, UploadCloud, Folder, Layers, RefreshCw, X, Edit2, Check, Send, Bot, User, MessageSquare, Maximize2, Minimize2 } from "lucide-react";

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
      const data = await api.getAllWorkspaces(0, 100, forceRefresh);
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
        const data = await api.getAllWorkspaces(0, 100, false);
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
      if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    };
  }, [triggerNotification]);

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
  };

  const executeWorkspaceProvisioning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalWsName || !modalWsName.trim()) return;

    setIsCreating(true);
    try {
      const targetName = modalWsName.trim();
      const newWs = await api.createWorkspace({
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
      const updatedWs = await api.renameWorkspace(spaceUuid, cleanName);

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
      const res = await api.uploadDocument(activeUuid, file);
      if (res && typeof res === "object") {
        const obj = res as Record<string, unknown>;
        if (obj.success === false || obj.error) {
          const nestedError = obj.error as Record<string, unknown> | undefined;
          throw new Error(
            typeof nestedError?.message === "string" 
              ? nestedError.message 
              : "Document streaming pipeline rejected processing."
          );
        }
      }
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
      const result = await api.askWorkspaceAI(activeUuid, query);
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

        {/* Layout container */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 relative pr-0">
          
          {/* Left Side Navigation Panel */}
          <div className="lg:col-span-1 space-y-4 border-r border-zinc-200 dark:border-zinc-800 pr-4 block">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
                <Layers size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Workspaces ({workspaces.length})</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                  title="Bypass cache and sync databases"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
                </button>
                <button 
                  onClick={() => { clearNotificationStates(); setShowCreateModal(true); }}
                  disabled={isCreating}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="New Workspace"
                >
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[72vh] pr-1">
              {workspaces.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 p-2">No active backend structures found.</p>
              ) : (
                workspaces.map((space) => (
                  <div
                    key={space.uuid}
                    onClick={() => selectWorkspace(space)}
                    className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                      activeUuid === space.uuid 
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                      <Folder size={16} className={activeUuid === space.uuid ? "text-blue-600 dark:text-blue-400 shrink-0" : "text-zinc-400 dark:text-zinc-500 shrink-0"} />
                      
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
                          className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 transition cursor-pointer"
                          disabled={isRenaming}
                        >
                          {isRenaming ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                      ) : (
                        <button
                          onClick={(e) => startRenameWorkflow(e, space)}
                          className="p-1 rounded-md hover:bg-zinc-200/60 dark:hover:bg-zinc-700 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Rename workspace"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side Main Content Viewport */}
          <div className="lg:col-span-3">
            
            {/* Main Workspace Workspace Content Block */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
                <div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Selected Workspace</span>
                  <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">{activeName || "No Workspace"}</h1>
                  {activeUuid && <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1">ID: {activeUuid}</p>}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  {activeUuid && !isChatEnabled && (
                    <button
                      onClick={() => setIsChatEnabled(true)}
                      className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition cursor-pointer"
                    >
                      <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                      <span>Open Copilot</span>
                    </button>
                  )}

                  {activeUuid && (
                    <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer disabled:opacity-50">
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
                <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No active context initialized.</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Select or initialize a workspace environment pool on the left side menu.</p>
                </div>
              )}
            </div>

            {/* FIXED ANIMATED OVERLAY RIGHT CHAT PANEL */}
            <div 
              className={`fixed top-0 right-0 h-screen bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-40 shadow-2xl ${
                isChatEnabled 
                  ? isChatMaximized 
                    ? "w-screen opacity-100" // Expands fully from right-to-left by transitioning width to full screen width
                    : "w-100 opacity-100" // Standard sidebar width tracking right-0
                  : "w-0 opacity-0 border-l-0 pointer-events-none" // Collapses smoothly back to the right-0 edge
              }`}
            >
              {/* Header Section */}
              <div className="px-4 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center justify-between h-16.25 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <MessageSquare size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 truncate">Workspace Copilot</h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsChatMaximized(!isChatMaximized)}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                    title={isChatMaximized ? "Restore Sidebar Size" : "Maximize Full Screen"}
                  >
                    {isChatMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                  </button>
                  <button
                    onClick={() => { setIsChatEnabled(false); setIsChatMaximized(false); }}
                    className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition cursor-pointer"
                    title="Close Chat"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Messages Feed Viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/20 dark:bg-zinc-950/10">
                {currentWorkspaceMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                    <Bot size={26} className="text-zinc-400" />
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Isolated Chat Context</p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-55 leading-relaxed">
                      Ask anything. Responses are grounded only in context from this workspace.
                    </p>
                  </div>
                )}

                {currentWorkspaceMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 max-w-[90%] ${
                      msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                      msg.sender === "user" ? "bg-blue-600 text-white border-blue-700" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent"
                    }`}>
                      {msg.sender === "user" ? <User size={12} /> : <Bot size={12} />}
                    </div>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white font-medium"
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {isChatProcessing && (
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-medium pl-1 animate-pulse">
                    <Loader2 size={12} className="animate-spin text-blue-500" />
                    <span>Scanning isolated vector nodes...</span>
                  </div>
                )}
                <div ref={chatScrollRef} />
              </div>

              {/* Bottom Input Field */}
              <form onSubmit={handleSendChatMessage} className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 px-3 py-2.5 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-950 transition">
                  <input
                    type="text"
                    value={chatInputValue}
                    onChange={(e) => setChatInputValue(e.target.value)}
                    placeholder="Query documents in this space..."
                    className="flex-1 bg-transparent text-xs text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400"
                    disabled={isChatProcessing}
                  />
                  <button
                    type="submit"
                    disabled={!chatInputValue.trim() || isChatProcessing}
                    className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-30 transition cursor-pointer"
                  >
                    <Send size={12} />
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>

      {/* MODAL WINDOW SYSTEM */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Provision Workspace</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg p-1 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={executeWorkspaceProvisioning} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Workspace Name</label>
                <input
                  type="text"
                  value={modalWsName}
                  onChange={(e) => setModalWsName(e.target.value)}
                  placeholder="e.g., Spring-AI-Vectors"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2.5 bg-zinc-50 dark:bg-zinc-800/40 text-sm text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-950 transition"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !modalWsName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                >
                  {isCreating && <Loader2 size={12} className="animate-spin" />}
                  <span>{isCreating ? "Provisioning..." : "Provision Workspace"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}