"use client";

import type { LucideIcon } from "lucide-react";

export function ToolCard({
  title,
  description,
  icon: Icon,
  color,
  ai,
  soon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  ai?: boolean;
  soon?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-5 text-left shadow-md shadow-black/20 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/30 ${soon ? "opacity-60" : ""}`}
    >
      <div className="absolute right-3 top-3 flex gap-1.5">
        {ai && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-400">
            ai
          </span>
        )}
        {soon && (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            soon
          </span>
        )}
      </div>

      <div
        className="flex size-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-foreground">{title}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </button>
  );
}
