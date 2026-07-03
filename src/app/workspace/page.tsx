"use client";

import { useState, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/AppLayout";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import AlertBanner from "@/components/shared/AlertBanner";
import { api, WorkspaceResponse } from "@/services/api";
import { FolderPlus, Loader2, UploadCloud, Folder, Layers, RefreshCw, X } from "lucide-react";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeUuid, setActiveUuid] = useState("");
  const [activeName, setActiveName] = useState("");

  // Notification States
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<unknown | null>(null);
  
  // Custom Animation State Management
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const autoDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modern Modal State Controllers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalWsName, setModalWsName] = useState("");

  // Wipes existing hooks to avoid stacking alerts on rapid continuous inputs
  const clearNotificationStates = () => {
    if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    setIsBannerVisible(false);
    setSuccess(null);
    setError(null);
  };

  // Central Controller to trigger notifications with smooth auto-fading timelines
  const triggerNotification = (successText: string | null, errorObj: unknown | null) => {
    // Clear any previous scheduled running timers instantly
    if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
    if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);

    setSuccess(successText);
    setError(errorObj);
    setIsBannerVisible(true);

    // Only apply the automatic 6-second fade-out timer on explicit success alerts
    if (successText) {
      autoDismissTimeoutRef.current = setTimeout(() => {
        setIsBannerVisible(false); // Triggers the 1-second CSS fade-out transition

        fadeOutTimeoutRef.current = setTimeout(() => {
          setSuccess(null);
        }, 1000); // Wipes the layout context state completely after visibility hits 0
      }, 6000);
    }
  };

  // Cleanup active timeouts on component unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimeoutRef.current) clearTimeout(autoDismissTimeoutRef.current);
      if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
    };
  }, []);

  async function fetchAllSpaces(forceRefresh = false) {
    try {
      const data = await api.getAllWorkspaces(0, 100, forceRefresh);
      
      const savedUuid = localStorage.getItem("active_workspace_uuid");
      const savedName = localStorage.getItem("active_workspace_name");
      
      setWorkspaces(data);
      if (savedUuid && data.some(space => space.uuid === savedUuid)) {
        setActiveUuid(savedUuid);
        setActiveName(savedName || "Selected Workspace");
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
  }

  useEffect(() => {
    let isMounted = true;
    
    const initializeWorkspaces = async () => {
      try {
        const data = await api.getAllWorkspaces(0, 100, false);
        
        if (!isMounted) return;
        
        const savedUuid = localStorage.getItem("active_workspace_uuid");
        const savedName = localStorage.getItem("active_workspace_name");
        
        setWorkspaces(data);
        if (savedUuid && data.some(space => space.uuid === savedUuid)) {
          setActiveUuid(savedUuid);
          setActiveName(savedName || "Selected Workspace");
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
    fetchAllSpaces(true);
  };

  const selectWorkspace = (space: WorkspaceResponse) => {
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
      setIsRefreshing(true);
      fetchAllSpaces(true);
    } catch (err) {
      console.error(err);
      triggerNotification(null, err);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

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
      <div className="space-y-6 text-zinc-900 dark:text-zinc-100 relative min-h-[75vh]">
        
        {/* Animated Wrapper Container handling the 1-Second Smooth Fade-Out */}
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Side Navigation Panel */}
          <div className="lg:col-span-1 space-y-4 border-r border-zinc-200 dark:border-zinc-800 pr-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-200">
                <Layers size={18} className="text-blue-600 dark:text-blue-400" />
                <span>Workspaces ({workspaces.length})</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleManualRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  title="Bypass cache and sync databases"
                >
                  <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
                </button>
                <button 
                  onClick={() => { clearNotificationStates(); setShowCreateModal(true); }}
                  disabled={isCreating}
                  className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                  title="New Workspace"
                >
                  <FolderPlus size={14} />
                </button>
              </div>
            </div>

            {/* Left Inner Items Explorer Explorer List View */}
            <div className="space-y-1 overflow-y-auto max-h-[70vh] pr-1">
              {workspaces.length === 0 ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 p-2">No active backend structures found.</p>
              ) : (
                workspaces.map((space) => (
                  <button
                    key={space.uuid}
                    onClick={() => selectWorkspace(space)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      activeUuid === space.uuid 
                        ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Folder size={16} className={activeUuid === space.uuid ? "text-blue-600 dark:text-blue-400" : "text-zinc-400 dark:text-zinc-500"} />
                    <span className="truncate">{space.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Side Main Panel Content Viewport */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Selected Context</span>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-0.5">{activeName || "No Workspace"}</h1>
                {activeUuid && <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500 mt-1">ID: {activeUuid}</p>}
              </div>

              {activeUuid && (
                <label className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer self-start sm:self-center disabled:opacity-50">
                  {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                  <span>{isUploading ? "Uploading..." : "Upload Document"}</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                    disabled={isUploading} 
                  />
                </label>
              )}
            </div>

            {activeUuid ? (
              <RecentDocuments currentWorkspaceUuid={activeUuid} />
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No active context initialized.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Select or initialize a workspace environment pool on the left side menu.</p>
              </div>
            )}
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
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg p-1 transition"
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !modalWsName.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
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