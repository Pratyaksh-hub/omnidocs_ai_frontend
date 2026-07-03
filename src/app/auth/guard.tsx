"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [authorized, setAuthorized] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const isAuthRoute = pathname.startsWith("/auth");

    const timerId = setTimeout(() => {
      if (!token && !isAuthRoute) {
        setAuthorized(false);
        router.replace("/auth");
      } else if (token && isAuthRoute) {
        setAuthorized(true);
        router.replace("/dashboard");
      } else {
        setAuthorized(true);
      }
      setCheckingAuth(false);
    }, 0);

    return () => clearTimeout(timerId);
  }, [pathname, router]);

  if (checkingAuth || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3 text-zinc-500">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm font-medium tracking-wide text-zinc-600 dark:text-zinc-400">
            Verifying secure cluster clearance...
          </span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}