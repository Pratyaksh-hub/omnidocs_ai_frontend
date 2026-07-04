"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { dashboardApi } from "@/lib/api";
import { FolderPlus, ArrowRight, Loader2, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const [totalWorkspaces, setTotalWorkspaces] = useState<number>(0);
  const [totalDocuments, setTotalDocuments] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const updateDashboardStates = (workspaces: number, documents: number) => {
    setTotalWorkspaces(workspaces);
    setTotalDocuments(documents);
    setLoadingStats(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    // Pull directly from our persistent global module layer
    dashboardApi.getMetrics(false)
      .then((metrics) => {
        if (isMounted) {
          updateDashboardStates(metrics.totalWorkspaces || 0, metrics.totalDocuments || 0);
        }
      })
      .catch((err) => {
        console.error("Failed to generate global system stats updates:", err);
        if (isMounted) {
          setLoadingStats(false);
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []); 

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Passing true bypasses the global cache and forces a single fresh network update
      const metrics = await dashboardApi.getMetrics(true);
      updateDashboardStates(metrics.totalWorkspaces || 0, metrics.totalDocuments || 0);
    } catch (err) {
      console.error("Failed to generate global system stats updates:", err);
      setLoadingStats(false);
      setIsRefreshing(false);
    }
  };

  if (loadingStats) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500 dark:text-zinc-400">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-sm font-medium">Aggregating cross-workspace metrics...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-10 animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
                System Dashboard
              </h1>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="mt-1 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all text-zinc-600 dark:text-zinc-300 cursor-pointer"
                title="Force clear cache and sync metrics"
              >
                <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""} />
              </button>
            </div>
            <p className="mt-1.5 text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Here is an aggregate live overview of your data.
            </p>
          </div>
          <Link 
            href="/workspace"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 self-start sm:self-center"
          >
            <span>Manage Workspaces</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <StatsCard title="Total Uploaded Documents" value={totalDocuments.toString()} />
          <StatsCard title="Active Workspaces" value={totalWorkspaces.toString()} />
          <StatsCard title="AI Engine Credits" value="1,240" />
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xs transition-colors duration-300">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Getting Started</h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
            To view indexed file pools, upload raw PDFs, or trigger contextual vector embeddings, jump over to your dedicated workspaces explorer console.
          </p>
          <div className="mt-6">
            <Link 
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <FolderPlus size={16} />
              <span>Go to Workspaces</span>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}