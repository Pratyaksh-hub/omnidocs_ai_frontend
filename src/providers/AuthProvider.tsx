"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { api, authApi, UserProfileResponse } from "@/services/api";

interface AuthContextType {
  user: UserProfileResponse | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshSessionContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const activeRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isHydratedRef = useRef<boolean>(false);
  // NEW: Strict Mode Interceptor prevents concurrent dual-flight network triggers
  const isFetchingRef = useRef<boolean>(false);

  const logout = useCallback(async () => {
    if (activeRefreshTimeoutRef.current) {
      clearTimeout(activeRefreshTimeoutRef.current);
    }
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Session cleanup exception:", err);
    } finally {
      setUser(null);
      isHydratedRef.current = false;
      isFetchingRef.current = false;
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    }
  }, []);

  const scheduleBackgroundRefresh = useCallback(() => {
    function runHeartbeatLoop() {
      if (typeof window === "undefined") return;

      if (activeRefreshTimeoutRef.current) {
        clearTimeout(activeRefreshTimeoutRef.current);
      }

      const expiresAtStr = localStorage.getItem("access_token_expires_at");
      if (!expiresAtStr) return;

      const expirationTimeMs = new Date(expiresAtStr).getTime();
      if (isNaN(expirationTimeMs)) return;

      const bufferMs = 60 * 1000;
      const delayTimeMs = expirationTimeMs - Date.now() - bufferMs;

      activeRefreshTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("🔄 Background Auth Lifecycle Provider: Syncing session keys...");
          await authApi.executeDirectSilentTokenRefresh();
          runHeartbeatLoop();
        } catch (err) {
          console.error("Proactive background refresh failed, executing fallback logout:", err);
          logout();
        }
      }, Math.max(0, delayTimeMs));
    }

    runHeartbeatLoop();
  }, [logout]);

  const refreshSessionContext = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // Short-circuit 1: Skip if already fully hydrated
    if (isHydratedRef.current) {
      return;
    }

    // Short-circuit 2: If a profile fetch flight is currently active, intercept the second concurrent Strict Mode trigger
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;

    try {
      const data = await api.getCurrentUser();
      setUser(data);
      isHydratedRef.current = true;
      scheduleBackgroundRefresh();
    } catch (err) {
      console.error("Could not rebuild active profile context mapping:", err);
      logout();
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    let isMounted = true;

    const initializeAuthSession = async () => {
      if (isMounted) {
        await refreshSessionContext();
      }
    };

    initializeAuthSession();

    return () => {
      isMounted = false;
      if (activeRefreshTimeoutRef.current) {
        clearTimeout(activeRefreshTimeoutRef.current);
      }
    };
  }, [refreshSessionContext]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshSessionContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be executed from inside an explicit AuthProvider wrapper layout.");
  }
  return context;
}