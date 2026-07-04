"use client";

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { ShieldAlert, ShieldCheck, ToggleLeft, ToggleRight, Loader2, RefreshCw, KeyRound, Lock, Binary, Cpu } from "lucide-react";
import { SecurityPoolItem } from "@/lib/api";

export default function SecurityPoolsPage() {
  const [pools, setPools] = useState<SecurityPoolItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [togglingUuid, setTogglingUuid] = useState<string | null>(null);

  const loadSecurityPools = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      // Mock tracking data modeled on your backend Spring AI schema structures
      const mockPools: SecurityPoolItem[] = [
        {
          poolUuid: "p1-7e2b-4f40-bb0d-6cf2b3b4a7b5",
          name: "Default Isolation Bound",
          description: "Standard tenant partition housing general active workspace document embeddings.",
          associatedWorkspacesCount: 4,
          piiRedactionActive: false,
          allowedRoleTier: "USER",
          totalEmbeddedVectors: 14205,
          createdAt: "2026-06-29T18:15:21"
        },
        {
          poolUuid: "p2-3c8a-9f12-cc2d-8df1a4b2c9e3",
          name: "Strict Compliance Vector Pool",
          description: "High-security space. Automatically strips PII strings, financial markers, and secret tokens on ingestion.",
          associatedWorkspacesCount: 1,
          piiRedactionActive: true,
          allowedRoleTier: "ADMIN",
          totalEmbeddedVectors: 3120,
          createdAt: "2026-07-02T10:30:15"
        },
        {
          poolUuid: "p3-5a1f-8e6b-02cd-11ab4c8d5e9f",
          name: "System Engineering Root Context",
          description: "Encrypted memory region restricted exclusively to operational config models and cluster keys.",
          associatedWorkspacesCount: 2,
          piiRedactionActive: true,
          allowedRoleTier: "SYSTEM_ROOT",
          totalEmbeddedVectors: 840,
          createdAt: "2026-07-04T12:00:00"
        }
      ];
      
      setPools(mockPools);
    } catch (err) {
      console.error("Failed to fetch secure partition boundaries:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Safe mounting layer blocks cascading layout lifecycle updates
  useEffect(() => {
    let isMounted = true;

    const executeAsyncLoad = async () => {
      if (isMounted) {
        await loadSecurityPools(false);
      }
    };

    executeAsyncLoad();

    return () => {
      isMounted = false;
    };
  }, [loadSecurityPools]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadSecurityPools(true);
  };

  const handleTogglePiiFilter = async (uuid: string, currentStatus: boolean) => {
    setTogglingUuid(uuid);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      
      setPools((prev) =>
        prev.map((pool) =>
          pool.poolUuid === uuid ? { ...pool, piiRedactionActive: !currentStatus } : pool
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingUuid(null);
    }
  };

  const getTierBadgeStyles = (tier: string) => {
    switch (tier) {
      case "SYSTEM_ROOT":
        return "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30";
      case "ADMIN":
        return "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30";
      default:
        return "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/30";
    }
  };

  const aggregateVectorsCount = pools.reduce((sum, p) => sum + p.totalEmbeddedVectors, 0);
  const activeScrubbersCount = pools.filter((p) => p.piiRedactionActive).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="animate-spin text-blue-600" size={24} />
          <span className="text-sm font-medium">Assembling cryptographic security graph loops...</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 text-zinc-900 dark:text-zinc-100">
        
        {/* Header Title Section */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Security Pools</h1>
            <p className="mt-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Isolate vector layers, apply inline PII data scrubbers, and govern cross-tenant access tokens.
            </p>
          </div>
          
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-blue-500" : ""} />
          </button>
        </div>

        {/* Dynamic Metric Dashboard Summary Panel Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
              <Binary size={22} />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total Isolated Vectors</span>
              <h3 className="text-2xl font-black mt-0.5 tracking-tight font-mono">{aggregateVectorsCount.toLocaleString()}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
              <Cpu size={22} />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Active PII Scrubbers</span>
              <h3 className="text-2xl font-black mt-0.5 tracking-tight font-mono">{activeScrubbersCount} / {pools.length}</h3>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-4 shadow-2xs">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
              <KeyRound size={22} />
            </div>
            <div>
              <span className="text-2xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Access Trust State</span>
              <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <Lock size={12} /> Strict Isolation
              </h3>
            </div>
          </div>
        </div>

        {/* Main Partitions List Data Grid Container */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase text-zinc-400 tracking-wider">Active Vector Boundary Partitions</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {pools.map((pool) => (
              <div
                key={pool.poolUuid}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200 shadow-2xs"
              >
                <div className="space-y-2 max-w-xl min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                      {pool.name}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-black border tracking-wider rounded-md uppercase ${getTierBadgeStyles(pool.allowedRoleTier)}`}>
                      {pool.allowedRoleTier === "SYSTEM_ROOT" ? "ROOT CONTROL" : `${pool.allowedRoleTier} ALLOWED`}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                    {pool.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-3xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
                    <span>Workspaces Bound: <span className="text-zinc-700 dark:text-zinc-300">{pool.associatedWorkspacesCount}</span></span>
                    <span>•</span>
                    <span>Tokens Loaded: <span className="text-blue-600 dark:text-blue-400">{pool.totalEmbeddedVectors.toLocaleString()} Chunks</span></span>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800 pt-3 md:pt-0 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-end gap-1.5 leading-none">
                        {pool.piiRedactionActive ? (
                          <>
                            <ShieldCheck size={14} className="text-emerald-500" />
                            <span>PII Scrubbing Live</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} className="text-zinc-400" />
                            <span>No Active Filters</span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Token cleansing rule</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTogglePiiFilter(pool.poolUuid, pool.piiRedactionActive)}
                      disabled={togglingUuid === pool.poolUuid}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition cursor-pointer disabled:opacity-40"
                    >
                      {togglingUuid === pool.poolUuid ? (
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      ) : pool.piiRedactionActive ? (
                        <ToggleRight size={32} className="text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ToggleLeft size={32} className="text-zinc-300 dark:text-zinc-700" />
                      )}
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  );
}