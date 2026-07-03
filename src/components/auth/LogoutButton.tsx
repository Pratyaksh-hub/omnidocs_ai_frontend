"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/api";
import { LogOut, Loader2 } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Session logout cleanup error:", err);
    } finally {
      setIsLoggingOut(false);
      router.push("/auth");
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 disabled:opacity-50 group"
    >
      {isLoggingOut ? (
        <Loader2 size={18} className="animate-spin text-red-500" />
      ) : (
        <LogOut size={18} className="text-zinc-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors" />
      )}
      <span>{isLoggingOut ? "Ending Session..." : "Log Out"}</span>
    </button>
  );
}