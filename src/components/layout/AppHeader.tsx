import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AppHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-8">
      <div className="flex w-96 items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2">
        <Search size={18} className="text-zinc-500" />
        <input
          placeholder="Search documents..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-xl border border-zinc-200 p-2 hover:bg-zinc-100">
          <Bell size={18} />
        </button>

        <Avatar>
          <AvatarFallback>PM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}