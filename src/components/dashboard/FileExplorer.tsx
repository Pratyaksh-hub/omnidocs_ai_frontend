"use client";

import { useState } from "react";
import { mockStorageItems } from "@/constants/mock-data";
import { Folder, FileText, FileSpreadsheet, MoreVertical, LayoutGrid, List, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function FileExplorer() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getIcon = (type: string) => {
    switch (type) {
      case "folder": return <Folder className="h-8 w-8 text-amber-400 fill-amber-400/20" />;
      case "pdf": return <FileText className="h-8 w-8 text-rose-500" />;
      case "sheet": return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
      default: return <FileText className="h-8 w-8 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight">Files & Folders</h2>
        <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
          <button 
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 transition ${viewMode === "grid" ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 transition ${viewMode === "list" ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-900"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {mockStorageItems.map((item) => (
            <div key={item.id} className="group relative cursor-pointer rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md">
              <div className="flex items-start justify-between">
                {getIcon(item.type)}
                <div className="flex items-center gap-1">
                  {item.isFavorite && <Star size={14} className="text-amber-500 fill-amber-500" />}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem>Open</DropdownMenuItem>
                      <DropdownMenuItem>Share</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="truncate font-medium text-zinc-900 dark:text-zinc-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400">{item.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>{item.updatedAt}</span>
                  {item.size && (
                    <>
                      <span>•</span>
                      <span>{item.size}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Last Modified</th>
                <th className="px-6 py-3">Size</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
              {mockStorageItems.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    <div className="flex items-center gap-3">
                      {getIcon(item.type)}
                      <span className="truncate max-w-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer">{item.name}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">{item.updatedAt}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-zinc-500 dark:text-zinc-400">{item.size || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300">
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Download</DropdownMenuItem>
                        <DropdownMenuItem>Rename</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}