"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Folder, Trash2, Shield, Sun, Moon } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // FIX: Read directly from localStorage safely inside a lazy initializer function.
  // This executes synchronously once when the state is instantiated on the client.
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });

  // Track hydration state over a simple requestAnimationFrame loop
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsHydrated(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  // Sync the DOM class token list explicitly when darkMode or hydration shifts
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle("dark", darkMode);
    }
  }, [darkMode, isHydrated]);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    localStorage.setItem("theme", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
  };

  const navigationRoutes = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workspaces", href: "/workspace", icon: Folder },
    { name: "Trash Bin", href: "/trash", icon: Trash2 },
    { name: "Security Pools", href: "/security", icon: Shield },
  ];

  if (!isHydrated) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" />;
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex font-sans transition-colors duration-300">
      
      {/* Permanent Left Sidebar Navigation Panel */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex md:flex-col justify-between shrink-0 transition-colors duration-300">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              Ω
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">OmniDocs AI</span>
          </div>

          <nav className="space-y-1">
            {navigationRoutes.map((route) => {
              const IconComponent = route.icon;
              const isActiveRoute = pathname === route.href;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActiveRoute
                      ? "bg-blue-600 text-white font-semibold shadow-sm shadow-blue-500/10"
                      : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <IconComponent size={18} className={isActiveRoute ? "text-white" : "text-zinc-400 dark:text-zinc-500"} />
                  <span>{route.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Lower Sidebar Actions Block */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
          
          {/* Enhanced Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              {darkMode ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-500" />}
              <span>{darkMode ? "Dark Appearance" : "Light Appearance"}</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Toggle</span>
          </button>

          {/* Connected Session Logout Trigger Component */}
          <div className="border-t border-zinc-200/50 dark:border-zinc-700/50 pt-2">
            <LogoutButton />
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            <span>Server Cluster Status</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Framework Content Panel */}
      <main className="flex-1 overflow-x-hidden p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}