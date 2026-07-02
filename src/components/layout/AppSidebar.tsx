"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/common/Logo";
import { navigation } from "@/constants/navigation";

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950 text-white">
      <div className="border-b border-zinc-800 p-6">
        <Logo />
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <Icon size={20} />

                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-xl bg-zinc-900 p-4">
          <p className="font-medium">Pratyaksh</p>
          <p className="text-sm text-zinc-400">
            Senior Software Engineer
          </p>
        </div>
      </div>
    </aside>
  );
}