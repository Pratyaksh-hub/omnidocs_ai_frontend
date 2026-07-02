import { FileText } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
        <FileText size={20} />
      </div>

      <div>
        <h1 className="text-lg font-bold">OmniDocs</h1>
        <p className="text-xs text-zinc-400">AI Workspace</p>
      </div>
    </div>
  );
}