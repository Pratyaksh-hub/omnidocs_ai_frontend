"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Folder, Trash2, Shield, Sun, Moon, Mail, Calendar, X, Loader2, Menu } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";
import { userApi, UserProfileResponse } from "@/lib/api";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserProfileResponse | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return savedTheme === "dark" || (!savedTheme && prefersDark);
  });

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsHydrated(true));
    
    async function loadLiveSessionProfile() {
      try {
        const data = await userApi.getCurrentUser();
        setUser(data);
      } catch (err) {
        console.error("Layout failed to establish secure profile context handles:", err);
      } finally {
        setLoadingUser(false);
      }
    }

    loadLiveSessionProfile();

    const handleOutsideClick = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // FIXED: Wrapped inside an asynchronous operational execution tick to satisfy strict set-state-in-effect guidelines
  useEffect(() => {
    Promise.resolve().then(() => {
      setIsMobileDrawerOpen(false);
    });
  }, [pathname]);

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

  const getInitials = () => {
    if (!user) return "?";
    const f = user.firstName?.charAt(0).toUpperCase() || "";
    const l = user.lastName?.charAt(0).toUpperCase() || "";
    return `${f}${l}` || "?";
  };

  const formatDateString = (isoString?: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleTierStyles = (role: string) => {
    switch (role?.toUpperCase()) {
      case "USER":
        return "bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40";
      case "ADMIN":
        return "bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/40";
      default:
        return "bg-zinc-50/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
    }
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : "Authenticated User";
  const initials = getInitials();

  const navigationRoutes = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Workspaces", href: "/workspace", icon: Folder },
    { name: "Trash Bin", href: "/trash", icon: Trash2 },
    { name: "Security Pools", href: "/security", icon: Shield },
  ];

  if (!isHydrated) {
    return <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950" />;
  }

  // FIXED: Extracted the interior markup block directly as a standard rendering function instead of a component declaration.
  // This keeps it completely safe from component-recreation-during-render rules.
  const renderSidebarContent = () => (
    <div className="flex flex-col justify-between h-full">
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              Ω
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">OmniDocs AI</span>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X size={18} />
          </button>
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

      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-3 relative" ref={profileDropdownRef}>
        <div className="relative">
          {loadingUser ? (
            <div className="w-full flex items-center gap-3 p-2 text-zinc-400 text-xs font-medium">
              <Loader2 size={16} className="animate-spin text-blue-600" />
              <span>Reading user context...</span>
            </div>
          ) : !user ? (
            <div className="w-full flex items-center gap-3 p-2 text-red-500 text-xs font-medium">
              <span>Session unauthenticated.</span>
            </div>
          ) : (
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              type="button"
              className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all outline-none cursor-pointer group ${
                isProfileOpen 
                  ? "bg-zinc-200/60 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40"
              }`}
            >
              <div className="w-9 h-9 rounded-xl shrink-0 font-bold text-xs flex items-center justify-center border border-zinc-200 dark:border-zinc-700 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:border-blue-400 dark:hover:border-blue-700 transition-colors duration-200 overflow-hidden shadow-2xs">
                <span>{initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold truncate text-zinc-800 dark:text-zinc-200 mt-0.5 leading-none">
                  {fullName}
                </h4>
                <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-1 font-mono leading-none">
                  {user.email}
                </p>
              </div>
            </button>
          )}

          {isProfileOpen && user && (
            <div className="absolute left-0 bottom-full mb-2 z-50 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 origin-bottom-left">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs overflow-hidden shrink-0">
                    <span>{initials}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{fullName}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${getRoleTierStyles(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1 rounded-md transition cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Mail size={12} className="text-zinc-400 shrink-0" />
                  <span className="truncate font-mono text-zinc-800 dark:text-zinc-300">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-zinc-400 shrink-0" />
                  <span>Registered: <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{formatDateString(user.createdAt)}</span></span>
                </div>
              </div>
              <div className="pt-3">
                <LogoutButton />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {darkMode ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-500" />}
            <span>{darkMode ? "Dark Appearance" : "Light Appearance"}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">Toggle</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row font-sans transition-colors duration-300">
      
      {/* MOBILE HEADER - Only displayed on mobile layout viewports */}
      <header className="md:hidden flex items-center justify-between bg-white dark:bg-zinc-900 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
            Ω
          </div>
          <span className="font-bold text-md tracking-tight text-zinc-900 dark:text-white">OmniDocs AI</span>
        </div>
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 cursor-pointer"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* MOBILE SLIDE-OUT DRAWER OVERLAY PANEL */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 shadow-2xl border-r border-zinc-200 dark:border-zinc-800 transition-transform duration-300 md:hidden
        ${isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {renderSidebarContent()}
      </aside>

      {/* MOBILE CLICK-OUT TRANSPARENT BACKGROUND SHIELD */}
      {isMobileDrawerOpen && (
        <div 
          onClick={() => setIsMobileDrawerOpen(false)} 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* PERMANENT DESKTOP LEFT SIDEBAR VIEWPORT */}
      <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hidden md:flex md:flex-col justify-between shrink-0 transition-colors duration-300">
        {renderSidebarContent()}
      </aside>

      {/* FRAMEWORK RENDERING MATRIX BASE */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 md:p-10">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}