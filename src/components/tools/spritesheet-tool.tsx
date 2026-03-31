"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid3X3, Loader2, ImageIcon, Scan, Pipette } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BoxEditor } from "@/components/tools/box-editor";
import { CropOverlay, type CropRect } from "@/components/tools/crop-overlay";
import { GridControls } from "@/components/tools/grid-controls";
import { ImageCanvas } from "@/components/tools/image-canvas";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import { computeBoxesFromGrid } from "@/lib/tools/grid";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord, GridParams, SpritesheetBox } from "@/lib/types";

type Step = "configure" | "results";

const stepLabels = ["Configure", "Results"];

function stepIndex(step: Step): number {
  return (["configure", "results"] as const).indexOf(step);
}

function stepMeta(step: Step) {
  switch (step) {
    case "configure":
      return { title: "Configure grid", description: "Adjust the grid parameters to fine-tune the detected regions, then extract." };
    case "results":
      return { title: "Extraction complete", description: "All sprites have been extracted and saved to your gallery." };
  }
}

function defaultGridForImage(image: ImageRecord): GridParams {
  const rows = 2;
  const cols = 2;
  return {
    rows,
    cols,
    offsetX: 0,
    offsetY: 0,
    cellWidth: Math.floor(image.width / cols),
    cellHeight: Math.floor(image.height / rows),
    paddingX: 0,
    paddingY: 0,
  };
}

export function SpritesheetTool({
  initialImages,
  preselectedImage,
}: {
  initialImages: ImageRecord[];
  preselectedImage?: ImageRecord | null;
}) {
  const [step, setStep] = useState<Step>("configure");
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(preselectedImage ?? null);
  const [extracting, setExtracting] = useState(false);
  const [gridParams, setGridParams] = useState<GridParams | null>(
    preselectedImage ? defaultGridForImage(preselectedImage) : null,
  );
  const [boxes, setBoxes] = useState<SpritesheetBox[]>(() => {
    if (!preselectedImage) return [];
    const grid = defaultGridForImage(preselectedImage);
    return computeBoxesFromGrid(grid, preselectedImage.width, preselectedImage.height);
  });
  const [extractedImages, setExtractedAssets] = useState<ImageRecord[]>([]);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);
  const [isDetecting, setIsDetecting] = useState(false);

  // Detection controls
  const [bgColor, setBgColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [tolerance, setTolerance] = useState(30);
  const [region, setRegion] = useState<CropRect | null>(
    preselectedImage ? { x: 0, y: 0, w: preselectedImage.width, h: preselectedImage.height } : null,
  );
  const [pickingColor, setPickingColor] = useState(false);

  async function handleAutoDetect() {
    if (!selectedImage) return;
    setIsDetecting(true);
    setPickingColor(false);

    const params: Record<string, unknown> = {
      imageId: selectedImage.id,
      tolerance,
    };
    if (bgColor) params.bgColor = bgColor;
    if (region) {
      params.region = { x: region.x, y: region.y, width: region.w, height: region.h };
    }

    const details: string[] = [];
    if (bgColor) details.push(`bg: rgb(${bgColor.r},${bgColor.g},${bgColor.b})`);
    details.push(`tolerance: ${tolerance}`);
    if (region && (region.w < selectedImage.width || region.h < selectedImage.height)) {
      details.push(`region: ${region.w}×${region.h}`);
    }

    setConsoleEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "info", text: `Auto-detecting sprites... (${details.join(", ")})` },
    ]);

    try {
      const response = await fetch("/api/tools/spritesheet/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const payload = await response.json();
        setConsoleEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "error", text: payload.error ?? "Detection failed." },
        ]);
        return;
      }

      const data = (await response.json()) as { boxes: SpritesheetBox[] };
      setBoxes(data.boxes);
      setGridParams(null);
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "agent_message", text: `Detected ${data.boxes.length} sprite${data.boxes.length !== 1 ? "s" : ""}.` },
      ]);
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Failed to connect to the server." },
      ]);
    } finally {
      setIsDetecting(false);
    }
  }

  const handleColorPick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectedImage || !pickingColor) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = selectedImage.width / rect.width;
      const scaleY = selectedImage.height / rect.height;
      const px = Math.floor((e.clientX - rect.left) * scaleX);
      const py = Math.floor((e.clientY - rect.top) * scaleY);

      const img = e.currentTarget.querySelector("img");
      if (!img) return;

      const canvas = document.createElement("canvas");
      canvas.width = selectedImage.width;
      canvas.height = selectedImage.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, selectedImage.width, selectedImage.height);
      const pixel = ctx.getImageData(px, py, 1, 1).data;
      const color = { r: pixel[0], g: pixel[1], b: pixel[2] };
      setBgColor(color);
      setPickingColor(false);

      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "info", text: `Background color set to rgb(${color.r}, ${color.g}, ${color.b})` },
      ]);
    },
    [selectedImage, pickingColor],
  );

  function handleSelectImage(image: ImageRecord) {
    setSelectedImage(image);
    const grid = defaultGridForImage(image);
    setGridParams(grid);
    setBoxes(computeBoxesFromGrid(grid, image.width, image.height));
    setBgColor(null);
    setRegion({ x: 0, y: 0, w: image.width, h: image.height });
    setPickingColor(false);
    setStep("configure");
  }

  async function handleExtract() {
    if (!selectedImage || boxes.length === 0) return;
    setExtracting(true);
    try {
      const response = await fetch("/api/tools/spritesheet/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: selectedImage.id, boxes }),
      });
      if (!response.ok) throw new Error("Extraction failed");
      const data = await response.json();
      setExtractedAssets(data.images as ImageRecord[]);
      setStep("results");
    } finally {
      setExtracting(false);
    }
  }

  function resetTool() {
    setStep("configure");
    setSelectedImage(null);
    setGridParams(null);
    setBoxes([]);
    setExtractedAssets([]);
    setConsoleEntries([]);
    setBgColor(null);
    setRegion(null);
    setPickingColor(false);
    setShowPicker(true);
  }

  function handleGridChange(newGrid: GridParams) {
    if (!selectedImage) return;
    setGridParams(newGrid);
    setBoxes(computeBoxesFromGrid(newGrid, selectedImage.width, selectedImage.height));
  }

  const meta = stepMeta(step);

  function renderFooter() {
    if (step === "configure" && !selectedImage) {
      return (
        <Button onClick={() => setShowPicker(true)}>
          <ImageIcon />
          Select image
        </Button>
      );
    }
    if (step === "configure") {
      return (
        <>
          <span className="mr-auto text-xs text-muted-foreground">
            {boxes.length} box{boxes.length === 1 ? "" : "es"}
          </span>
          <Button variant="outline" onClick={resetTool}>Change image</Button>
          <Button onClick={() => void handleExtract()} disabled={boxes.length === 0 || extracting}>
            {extracting ? <Loader2 className="animate-spin" /> : <Grid3X3 />}
            {extracting ? "Extracting..." : "Extract sprites"}
          </Button>
        </>
      );
    }
    if (step === "results") {
      return (
        <>
          <Button variant="outline" onClick={resetTool}>Process another</Button>
          <Button nativeButton={false} render={<Link href="/" />}>Back to tools</Button>
        </>
      );
    }
    return null;
  }

  return (
    <>
      <ToolWizard
        title="Spritesheet Splitter"
        icon="Grid3X3"
        color="#ff9b71"
        stepLabels={stepLabels}
        currentStep={stepIndex(step)}
        stepTitle={meta.title}
        stepDescription={meta.description}
        footer={renderFooter()}
        sidebar={
          step === "configure" && selectedImage ? (
            <div className="flex h-full flex-col overflow-y-auto">
              {/* Auto Detect section */}
              <div className="space-y-3 border-b border-border/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">Auto Detect</p>

                {/* Background color */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Background</span>
                    {bgColor && (
                      <button
                        type="button"
                        onClick={() => setBgColor(null)}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPickingColor(!pickingColor)}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors ${
                        pickingColor
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Pipette className="size-3" />
                      Pick
                    </button>
                    {bgColor ? (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="size-5 rounded border border-border/60"
                          style={{ backgroundColor: `rgb(${bgColor.r},${bgColor.g},${bgColor.b})` }}
                        />
                        <span className="text-[10px] tabular-nums text-muted-foreground">
                          {bgColor.r},{bgColor.g},{bgColor.b}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground/50">Auto</span>
                    )}
                  </div>
                </div>

                {/* Tolerance */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Tolerance</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">{tolerance}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={tolerance}
                    onChange={(e) => setTolerance(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>

                {/* Region info */}
                {region && selectedImage && (region.w < selectedImage.width || region.h < selectedImage.height) && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">
                      Region: {region.w}×{region.h}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegion({ x: 0, y: 0, w: selectedImage.width, h: selectedImage.height })}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Reset
                    </button>
                  </div>
                )}

                {/* Detect button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isDetecting}
                  onClick={() => void handleAutoDetect()}
                >
                  {isDetecting ? <Loader2 className="animate-spin" /> : <Scan />}
                  {isDetecting ? "Detecting..." : "Detect"}
                </Button>
              </div>

              {/* Grid controls */}
              {gridParams && (
                <GridControls
                  grid={gridParams}
                  imageWidth={selectedImage.width}
                  imageHeight={selectedImage.height}
                  onChange={handleGridChange}
                />
              )}
            </div>
          ) : undefined
        }
        console={
          <WizardConsole entries={consoleEntries} loading={extracting || isDetecting} />
        }
      >
        {step === "configure" && !selectedImage && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No image selected yet.</p>
          </div>
        )}

        {step === "configure" && selectedImage && (
          <ImageCanvas
            src={getImagePublicUrl(selectedImage.id)}
            alt={selectedImage.originalName}
          >
            {/* Color picking overlay */}
            {pickingColor && (
              <>
                <div
                  className="absolute inset-0 cursor-crosshair"
                  onClick={handleColorPick}
                />
                <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground">
                  Click to sample background color
                </div>
              </>
            )}

            {/* Region overlay (crop-style handles) */}
            {!pickingColor && region && (
              <CropOverlay
                crop={region}
                imageWidth={selectedImage.width}
                imageHeight={selectedImage.height}
                onChange={setRegion}
              />
            )}

            {/* Detected/grid boxes */}
            {!pickingColor && boxes.map((box) => (
              <div
                key={box.id}
                className="absolute border border-primary/60 bg-transparent pointer-events-none transition-colors"
                style={{
                  left: `${(box.x / selectedImage.width) * 100}%`,
                  top: `${(box.y / selectedImage.height) * 100}%`,
                  width: `${(box.width / selectedImage.width) * 100}%`,
                  height: `${(box.height / selectedImage.height) * 100}%`,
                }}
                title={box.label}
              />
            ))}
          </ImageCanvas>
        )}

        {step === "results" && (
          <div className="grid grid-cols-4 gap-2 px-6 pb-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {extractedImages.map((sprite) => (
              <div key={sprite.id} className="group flex flex-col gap-1">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted/10">
                  <Image
                    src={getImagePublicUrl(sprite.id)}
                    alt={sprite.originalName}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                </div>
                <span className="truncate px-0.5 text-[10px] text-muted-foreground">
                  {sprite.originalName}
                </span>
              </div>
            ))}
          </div>
        )}
      </ToolWizard>

      <ImagePickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        images={initialImages}
        onSelect={(image) => {
          handleSelectImage(image);
        }}
      />
    </>
  );
}
