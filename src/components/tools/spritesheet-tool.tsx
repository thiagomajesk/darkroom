"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Grid3X3, Loader2, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BoxEditor } from "@/components/tools/box-editor";
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
  const [gridParams, setGridParams] = useState<GridParams | null>(null);
  const [boxes, setBoxes] = useState<SpritesheetBox[]>([]);
  const [extractedImages, setExtractedAssets] = useState<ImageRecord[]>([]);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);

  function handleSelectImage(image: ImageRecord) {
    setSelectedImage(image);
    const grid = defaultGridForImage(image);
    setGridParams(grid);
    setBoxes(computeBoxesFromGrid(grid, image.width, image.height));
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
          step === "configure" && gridParams && selectedImage ? (
            <GridControls
              grid={gridParams}
              imageWidth={selectedImage.width}
              imageHeight={selectedImage.height}
              onChange={handleGridChange}
            />
          ) : undefined
        }
        console={
          <WizardConsole entries={consoleEntries} loading={extracting} />
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
          <BoxEditor
            image={selectedImage}
            boxes={boxes}
            onBoxesChange={setBoxes}
            onExtract={() => void handleExtract()}
            extracting={extracting}
            extracted={false}
          />
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
