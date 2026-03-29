import Link from "next/link";
import { Paintbrush, ArrowLeft } from "lucide-react";

export default function RestylePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
      <div
        className="flex size-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#fb923c20", color: "#fb923c" }}
      >
        <Paintbrush className="size-8" />
      </div>
      <div className="text-center">
        <h1 className="text-lg font-semibold">Restyle</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This tool is not available yet. Stay tuned!
        </p>
      </div>
      <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
        coming soon
      </span>
      <Link
        href="/"
        className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to tools
      </Link>
    </div>
  );
}
