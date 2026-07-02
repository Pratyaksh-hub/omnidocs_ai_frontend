import { FileText } from "lucide-react";

interface Props {
  title: string;
  workspace: string;
  updated: string;
}

export default function DocumentCard({
  title,
  workspace,
  updated,
}: Props) {
  return (
    <div className="cursor-pointer rounded-2xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl">
      <FileText className="mb-4 text-blue-600" />

      <h3 className="font-semibold">
        {title}
      </h3>

      <p className="mt-1 text-sm text-zinc-500">
        {workspace}
      </p>

      <p className="mt-4 text-xs text-zinc-400">
        Updated {updated}
      </p>
    </div>
  );
}