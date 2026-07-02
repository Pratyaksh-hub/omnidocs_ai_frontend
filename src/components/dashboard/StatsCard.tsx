"use client";

interface StatsCardProps {
  title: string;
  value: string;
}

export default function StatsCard({ title, value }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs transition-all duration-300">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
        {title}
      </p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}