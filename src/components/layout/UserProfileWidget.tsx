"use client";

import React, { useState, useEffect, useRef } from "react";
import { User, LogOut, Shield, Mail, Calendar, Key, X, Loader2 } from "lucide-react";

// Mock interface mimicking a typical production Spring Security authenticated user response
interface UserProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  joinedAt: string;
  avatarUrl?: string | null;
}

export default function UserProfileWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user details securely (Simulated from localStorage/Session context or secure backend payload)
  useEffect(() => {
    const fetchSessionUser = async () => {
      try {
        // Simulating loading state buffer
        setLoading(true);
        
        // Replace this mock structure with your actual auth state hook or context provider
        const mockUser: UserProfileData = {
          firstName: "Pratyaksh",
          lastName: "Sharma",
          email: "pratyaksh@omnidocs.ai",
          role: "Java Backend & AI Engineer",
          joinedAt: "March 2026",
          avatarUrl: null // Set to a string URL if an uploaded profile picture exists
        };
        
        setUser(mockUser);
      } catch (err) {
        console.error("Could not read auth context parameters:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionUser();

    // Close the dropdown if the user clicks completely outside of the widget container area
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-2 animate-pulse">
        <div className="w-9 h-9 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-1.5 flex-1 hidden md:block">
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-sm" />
          <div className="h-2 w-32 bg-zinc-100 dark:bg-zinc-800/60 rounded-sm" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Resolve clean initials fallback signature (e.g., "Pratyaksh Sharma" -> "PS")
  const getInitials = () => {
    const firstLetter = user.firstName ? user.firstName.charAt(0).toUpperCase() : "";
    const lastLetter = user.lastName ? user.lastName.charAt(0).toUpperCase() : "";
    return `${firstLetter}${lastLetter}` || "?";
  };

  const userInitials = getInitials();
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Target Clickable Trigger Card anchored on your Sidebar template baseline */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all outline-none cursor-pointer group ${
          isOpen 
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" 
            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
        }`}
      >
        {/* Avatar Render Block */}
        <div className="w-9 h-9 rounded-xl shrink-0 font-bold text-xs flex items-center justify-center border shadow-xs transition-colors overflow-hidden border-zinc-200 dark:border-zinc-700 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:border-blue-300 dark:group-hover:border-blue-800">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span>{userInitials}</span>
          )}
        </div>

        {/* Text Details Node (Responsive concealment layout keeps sidebar compact on mobile viewports) */}
        <div className="min-w-0 flex-1 hidden lg:block">
          <h4 className="text-sm font-bold truncate tracking-tight text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white mt-0.5 leading-none">
            {fullName}
          </h4>
          <p className="text-2xs font-medium text-zinc-400 dark:text-zinc-500 truncate mt-1 font-mono">
            {user.email}
          </p>
        </div>
      </button>

      {/* Flyout Complete Detail Pop-up Sheet Panel */}
      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 z-50 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 origin-bottom-left">
          
          {/* Header context info banner inside modal frame */}
          <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-3">
            <div className="w-11 h-11 rounded-xl font-bold text-sm flex items-center justify-center border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-2xs overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span>{userInitials}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">{fullName}</h3>
              <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                <Shield size={11} className="text-blue-500" />
                <span>{user.role}</span>
              </p>
            </div>
          </div>

          {/* Core Properties Data Grid Grid rows */}
          <div className="space-y-2.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2.5 px-1">
              <Mail size={13} className="text-zinc-400" />
              <span className="truncate text-zinc-800 dark:text-zinc-300 font-mono">{user.email}</span>
            </div>
            <div className="flex items-center gap-2.5 px-1">
              <Calendar size={13} className="text-zinc-400" />
              <span>Joined <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{user.joinedAt}</span></span>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-3 space-y-1">
            <button
              onClick={() => alert("Redirecting to profile details configuration matrix...")}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition text-left"
            >
              <User size={13} className="text-zinc-400" />
              <span>Account Settings</span>
            </button>
            
            <button
              onClick={() => alert("Terminating auth context token tokens...")}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition text-left"
            >
              <LogOut size={13} />
              <span>Sign Out Session</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
}