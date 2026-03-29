"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type ConsoleEntry = {
  id: string;
  type: string;
  text?: string;
};

export function WizardConsole({
  entries,
  loading = false,
}: {
  entries: ConsoleEntry[];
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, open]);

  // Auto-open when first entry arrives
  useEffect(() => {
    if (entries.length > 0 || loading) {
      setOpen(true);
    }
  }, [entries.length, loading]);

  if (!loading && entries.length === 0) return null;

  return (
    <div className="shrink-0 border-t border-border/60">
      <button
        type="button"
        className="flex w-full items-center gap-2 bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        <ChevronUp
          className={cn(
            "size-3.5 transition-transform",
            !open && "rotate-180",
          )}
        />
        <span>Console</span>
        <span className="text-muted-foreground/50">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        {loading && <Loader2 className="ml-auto size-3 animate-spin text-primary" />}
      </button>

      {open && (
        <div
          ref={scrollRef}
          className="no-scrollbar h-40 overflow-y-auto bg-[oklch(0.12_0_0)] px-4 py-3 font-mono text-[11px] leading-relaxed"
        >
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={
                entry.type === "error"
                  ? "text-red-400"
                  : "text-foreground/70"
              }
            >
              <span className={cn("mr-2 select-none", entry.type === "error" ? "text-red-500" : "text-muted-foreground/50")}>
                {entry.type === "error" ? "✕" : entry.type === "agent_message" ? "▸" : entry.type === "reasoning" ? "◦" : "›"}
              </span>
              {entry.text}
            </div>
          ))}
          {loading && entries.length === 0 && (
            <span className="text-muted-foreground">Waiting for response...</span>
          )}
        </div>
      )}
    </div>
  );
}
