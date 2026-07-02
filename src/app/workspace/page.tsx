"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import { api, WorkspaceResponse } from "@/services/api";
import { FolderPlus, Loader2, UploadCloud, Folder, Layers, RefreshCw } from "lucide-react";

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeUuid, setActiveUuid] = useState("");
  const [activeName, setActiveName] = useState("");

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
    fetchAllSpaces(true);
  };

  const selectWorkspace = (space: WorkspaceResponse) => {
    setActiveUuid(space.uuid);
    setActiveName(space.name);
    localStorage.setItem("active_workspace_uuid", space.uuid);
    localStorage.setItem("active_workspace_name", space.name);
  };

  const handleCreateWorkspace = async () => {
    const name = prompt("Enter Workspace Name:");
    if (!name || !name.trim()) return;

    setIsCreating(true);
    try {
      const newWs = await api.createWorkspace({
        name: name.trim(),
        description: `Dedicated storage pool for ${name.trim()}`
      });

      setWorkspaces((prev) => [newWs, ...prev]);
      selectWorkspace(newWs);
      alert(`Workspace "${newWs.name}" built!`);
    } catch (err) {
      console.error(err);
      alert("Error parsing workspace configuration.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await api.uploadDocument(activeUuid, file);
      alert(`"${file.name}" uploaded to target workspace successfully!`);
      handleManualRefresh();
    } catch (err) {
      console.error(err);
      alert("File transmission failed.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isHydrated || loadingWorkspaces) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-sm font-medium">Synchronizing application pools...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-zinc-900 dark:text-zinc-100">
        
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
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
                title="Bypass cache and sync databases"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
              </button>
              <button 
                onClick={handleCreateWorkspace}
                disabled={isCreating}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition"
                title="New Workspace"
              >
                <FolderPlus size={14} />
              </button>
            </div>
          </div>

          {/* Left Inner Items Explorer Deck */}
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
    </AppLayout>
  );
}