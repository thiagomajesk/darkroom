"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Globe,
  Loader2,
  CheckCircle2,
  Search,
  CheckSquare,
  XSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import type { ImageRecord } from "@/lib/types";

type ScrapedImage = {
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

type Step = "scan" | "review";

const stepLabels = ["Scan", "Review"];

function stepIndex(step: Step): number {
  return (["scan", "review"] as const).indexOf(step);
}

function stepMeta(step: Step, url: string, imageCount: number) {
  switch (step) {
    case "scan":
      return {
        title: "Scanning...",
        description: `Fetching images from ${url}`,
      };
    case "review":
      return {
        title: "Review images",
        description: imageCount > 0
          ? `Found ${imageCount} image${imageCount !== 1 ? "s" : ""} on ${url}`
          : `No images found on ${url}`,
      };
  }
}

function RangeSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const lo = value[0];
  const hi = value[1];
  const range = max - min || 1;
  const loPercent = ((lo - min) / range) * 100;
  const hiPercent = ((hi - min) / range) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {lo}–{hi}px
        </span>
      </div>
      <div className="relative h-5">
        {/* Track background */}
        <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-muted" />
        {/* Active range */}
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary"
          style={{ left: `${loPercent}%`, width: `${hiPercent - loPercent}%` }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={lo}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([Math.min(v, hi), hi]);
          }}
          className="pointer-events-none absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background"
        />
        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          value={hi}
          onChange={(e) => {
            const v = Number(e.target.value);
            onChange([lo, Math.max(v, lo)]);
          }}
          className="pointer-events-none absolute inset-0 m-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-background [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background"
        />
      </div>
    </div>
  );
}

export function ScraperTool() {
  const [step, setStep] = useState<Step>("scan");

  const [url, setUrl] = useState("");
  const [showUrlDialog, setShowUrlDialog] = useState(true);

  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [images, setImages] = useState<ScrapedImage[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [savedCount, setSavedCount] = useState(0);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);

  // Filter bounds derived from scraped images
  const boundsWidth = useMemo(() => Math.max(1, ...images.map((img) => img.width ?? 0)), [images]);
  const boundsHeight = useMemo(() => Math.max(1, ...images.map((img) => img.height ?? 0)), [images]);

  // Filter ranges [min, max]
  const [widthRange, setWidthRange] = useState<[number, number]>([0, 1]);
  const [heightRange, setHeightRange] = useState<[number, number]>([0, 1]);

  const filteredImages = useMemo(() => {
    return images.filter((img) => {
      const w = img.width ?? 0;
      const h = img.height ?? 0;

      if (w < widthRange[0] || w > widthRange[1]) return false;
      if (h < heightRange[0] || h > heightRange[1]) return false;
      return true;
    });
  }, [images, widthRange, heightRange]);

  async function handleScan() {
    if (!url.trim()) return;

    setShowUrlDialog(false);
    setIsScanning(true);
    setError(null);
    setConsoleEntries([
      {
        id: crypto.randomUUID(),
        type: "agent_message",
        text: `Scanning ${url.trim()}...`,
      },
    ]);

    try {
      const response = await fetch("/api/tools/scraper/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Scan failed: ${response.status}`);
      }

      const payload = (await response.json()) as { images: ScrapedImage[] };
      setImages(payload.images);
      setSelected(new Set());

      // Initialize filter ranges to cover all scraped images
      const mw = Math.max(1, ...payload.images.map((img) => img.width ?? 0));
      const mh = Math.max(1, ...payload.images.map((img) => img.height ?? 0));
      setWidthRange([0, mw]);
      setHeightRange([0, mh]);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "agent_message",
          text: `Found ${payload.images.length} image${payload.images.length !== 1 ? "s" : ""}.`,
        },
      ]);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "error",
          text: err instanceof Error ? err.message : "Scan failed.",
        },
      ]);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSave() {
    const urls = Array.from(selected);
    if (urls.length === 0) return;

    setIsSaving(true);
    setError(null);
    setConsoleEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "agent_message",
        text: `Downloading ${urls.length} image${urls.length !== 1 ? "s" : ""}...`,
      },
    ]);

    try {
      const response = await fetch("/api/tools/scraper/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ urls }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Download failed: ${response.status}`);
      }

      const payload = (await response.json()) as {
        images: ImageRecord[];
        errors: string[];
      };

      setSavedCount(payload.images.length);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "agent_message",
          text: `Saved ${payload.images.length} image${payload.images.length !== 1 ? "s" : ""}.${payload.errors.length > 0 ? ` ${payload.errors.length} failed.` : ""}`,
        },
      ]);
      // Stay on review — console shows the success message
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleImage(imageUrl: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(imageUrl)) {
        next.delete(imageUrl);
      } else {
        next.add(imageUrl);
      }
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected(new Set(filteredImages.map((img) => img.url)));
  }

  function deselectAll() {
    setSelected(new Set());
  }

  function reset() {
    setStep("scan");
    setUrl("");
    setWidthRange([0, 1]);
    setHeightRange([0, 1]);
    setImages([]);
    setSelected(new Set());
    setSavedCount(0);
    setError(null);
    setConsoleEntries([]);
    setShowUrlDialog(true);
  }

  const meta = stepMeta(step, url, filteredImages.length);

  function renderSidebar() {
    if (step !== "review") return undefined;

    return (
      <div className="flex flex-col gap-4 p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Filters</h3>
        <div className="space-y-4">
          <RangeSlider label="Width" min={0} max={boundsWidth} value={widthRange} onChange={setWidthRange} />
          <RangeSlider label="Height" min={0} max={boundsHeight} value={heightRange} onChange={setHeightRange} />
        </div>
      </div>
    );
  }

  function renderFooter() {
    if (step === "scan") {
      return (
        <Button onClick={() => setShowUrlDialog(true)} disabled={isScanning}>
          <Search />
          {isScanning ? "Scanning..." : "Scan URL"}
        </Button>
      );
    }
    if (step === "review") {
      return (
        <>
          <Button variant="outline" onClick={reset}>
            {savedCount > 0 ? "Scrape another" : "Back"}
          </Button>
          {savedCount > 0 ? (
            <Button nativeButton={false} render={<Link href="/" />}>Back to tools</Button>
          ) : (
            <Button
              disabled={selected.size === 0 || isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
              {isSaving ? "Saving..." : `Save selected (${selected.size})`}
            </Button>
          )}
        </>
      );
    }
    return null;
  }

  return (
    <>
      <ToolWizard
        title="Image Scraper"
        icon="Globe"
        color="#4ade80"
        stepLabels={stepLabels}
        currentStep={stepIndex(step)}
        stepTitle={meta.title}
        stepDescription={meta.description}
        footer={renderFooter()}
        sidebar={renderSidebar()}
        console={
          <WizardConsole entries={consoleEntries} loading={isScanning || isSaving} />
        }
      >
        {step === "scan" && (
          <div className="flex h-full flex-1 flex-col items-center justify-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Globe className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isScanning ? "Scanning for images..." : "Enter a URL to scan for images."}
            </p>
            {isScanning && <Loader2 className="size-5 animate-spin text-primary" />}
          </div>
        )}

        {step === "review" && (
          <div className="p-4">
            {filteredImages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-muted-foreground">
                <Search className="size-8" />
                <p className="text-sm">No images found matching your filters.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {selected.size} of {filteredImages.length} selected
                  </Badge>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllFiltered}>
                      <CheckSquare className="size-3.5" />
                      Select all
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAll}>
                      <XSquare className="size-3.5" />
                      Deselect all
                    </Button>
                  </div>
                </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                {filteredImages.map((image) => {
                  const isSelected = selected.has(image.url);
                  return (
                    <button
                      key={image.url}
                      type="button"
                      className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-muted-foreground/30"
                      }`}
                      onClick={() => toggleImage(image.url)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                      {image.width != null && image.height != null && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[9px] text-white/80 backdrop-blur-sm">
                          {image.width}×{image.height}
                        </span>
                      )}
                      <div
                        className={`absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-black/40 text-white opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <CheckCircle2 className="size-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-destructive">{error}</p>
            )}
          </div>
        )}

      </ToolWizard>

      {/* URL input dialog — shown immediately on mount */}
      <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan a webpage</DialogTitle>
            <DialogDescription>Enter a URL to scan for images.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="relative">
              <Globe className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="https://example.com"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleScan();
                }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              disabled={!url.trim() || isScanning}
              onClick={() => void handleScan()}
            >
              {isScanning ? <Loader2 className="animate-spin" /> : <Search />}
              {isScanning ? "Scanning..." : "Scan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
