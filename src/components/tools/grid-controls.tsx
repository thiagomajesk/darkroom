"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { GridParams } from "@/lib/types";

type GridControlsProps = {
  grid: GridParams;
  imageWidth: number;
  imageHeight: number;
  onChange: (grid: GridParams) => void;
};


function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded-md border border-border/60 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          −
        </button>
        <input
          type="number"
          min={min}
          value={value}
          onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
          className="h-6 w-14 rounded-md border border-border/60 bg-background px-1.5 text-center text-xs tabular-nums text-foreground outline-none focus:border-primary"
        />
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded-md border border-border/60 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={() => onChange(value + 1)}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function GridControls({ grid, imageWidth, imageHeight, onChange }: GridControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  function updateRowsCols(key: "rows" | "cols", value: number) {
    const next = { ...grid, [key]: value };
    // Auto-compute cell dimensions
    next.cellWidth = Math.floor((imageWidth - next.offsetX) / Math.max(1, next.cols));
    next.cellHeight = Math.floor((imageHeight - next.offsetY) / Math.max(1, next.rows));
    onChange(next);
  }

  function update(key: keyof GridParams, value: number) {
    onChange({ ...grid, [key]: value });
  }

  return (
    <div className="flex h-full flex-col p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Grid parameters</p>

      <div className="space-y-2">
        <Stepper label="Rows" value={grid.rows} onChange={(v) => updateRowsCols("rows", v)} min={1} />
        <Stepper label="Cols" value={grid.cols} onChange={(v) => updateRowsCols("cols", v)} min={1} />
      </div>

      {/* Cell size info */}
      <div className="mt-3 rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        Cell size: {grid.cellWidth} × {grid.cellHeight}px
      </div>

      {/* Advanced section */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronDown className={`size-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        Advanced
      </button>

      {showAdvanced && (
        <div className="mt-2 space-y-2">
          <Stepper label="Offset X" value={grid.offsetX} onChange={(v) => update("offsetX", v)} />
          <Stepper label="Offset Y" value={grid.offsetY} onChange={(v) => update("offsetY", v)} />
          <div className="my-1 border-t border-border/30" />
          <Stepper label="Gap X" value={grid.paddingX} onChange={(v) => update("paddingX", v)} />
          <Stepper label="Gap Y" value={grid.paddingY} onChange={(v) => update("paddingY", v)} />
          <div className="my-1 border-t border-border/30" />
          <Stepper label="Cell W" value={grid.cellWidth} onChange={(v) => update("cellWidth", v)} min={1} />
          <Stepper label="Cell H" value={grid.cellHeight} onChange={(v) => update("cellHeight", v)} min={1} />
        </div>
      )}
    </div>
  );
}
