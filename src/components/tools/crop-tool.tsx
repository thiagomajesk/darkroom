"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Crop, Loader2, ImageIcon, RotateCcw, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageCanvas } from "@/components/tools/image-canvas";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import { CropOverlay, type CropRect } from "@/components/tools/crop-overlay";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type Step = "select" | "crop" | "preview" | "saved";

const stepLabels = ["Select", "Crop", "Preview", "Saved"];

function stepIndex(step: Step): number {
  return (["select", "crop", "preview", "saved"] as const).indexOf(step);
}

function stepMeta(step: Step, selectedImage: ImageRecord | null) {
  switch (step) {
    case "select":
      return selectedImage
        ? { title: "Image selected", description: "Proceed to crop your image." }
        : { title: "Select an image", description: "Choose an image from your gallery or upload a new one." };
    case "crop":
      return { title: "Crop image", description: "Drag to adjust the crop area, then confirm." };
    case "preview":
      return { title: "Preview crop", description: "Review the cropped result before saving." };
    case "saved":
      return { title: "Image saved", description: "Your cropped image has been saved to the gallery." };
  }
}

type AspectRatio = "free" | "1:1" | "4:3" | "16:9";

function applyAspectRatio(
  crop: CropRect,
  ratio: AspectRatio,
  imageWidth: number,
  imageHeight: number,
): CropRect {
  if (ratio === "free") return crop;

  const ratioMap: Record<string, number> = {
    "1:1": 1,
    "4:3": 4 / 3,
    "16:9": 16 / 9,
  };

  const targetRatio = ratioMap[ratio];
  if (!targetRatio) return crop;

  // Fit within current crop center
  const centerX = crop.x + crop.w / 2;
  const centerY = crop.y + crop.h / 2;

  let newW = crop.w;
  let newH = crop.w / targetRatio;

  if (newH > crop.h) {
    newH = crop.h;
    newW = crop.h * targetRatio;
  }

  let newX = centerX - newW / 2;
  let newY = centerY - newH / 2;

  // Clamp to image bounds
  if (newX < 0) newX = 0;
  if (newY < 0) newY = 0;
  if (newX + newW > imageWidth) newX = imageWidth - newW;
  if (newY + newH > imageHeight) newY = imageHeight - newH;

  return {
    x: Math.round(newX),
    y: Math.round(newY),
    w: Math.round(newW),
    h: Math.round(newH),
  };
}

export function CropTool({
  initialImages,
  preselectedImage,
}: {
  initialImages: ImageRecord[];
  preselectedImage?: ImageRecord | null;
}) {
  const [step, setStep] = useState<Step>(preselectedImage ? "crop" : "select");
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(preselectedImage ?? null);
  const [cropping, setCropping] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(
    preselectedImage ? { x: 0, y: 0, w: preselectedImage.width, h: preselectedImage.height } : null,
  );
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [croppedImage, setCroppedImage] = useState<ImageRecord | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);

  const hasCrop = crop !== null && crop.w > 0 && crop.h > 0;

  function initCrop(image: ImageRecord) {
    setCrop({ x: 0, y: 0, w: image.width, h: image.height });
    setAspectRatio("free");
  }

  function handleSelectImage(image: ImageRecord) {
    setSelectedImage(image);
    initCrop(image);
    setStep("crop");
  }

  const handleCropChange = useCallback(
    (newCrop: CropRect) => {
      if (aspectRatio !== "free" && selectedImage) {
        setCrop(applyAspectRatio(newCrop, aspectRatio, selectedImage.width, selectedImage.height));
      } else {
        setCrop(newCrop);
      }
    },
    [aspectRatio, selectedImage],
  );

  function handleAspectChange(ratio: AspectRatio) {
    setAspectRatio(ratio);
    if (selectedImage && ratio !== "free" && crop) {
      setCrop(applyAspectRatio(crop, ratio, selectedImage.width, selectedImage.height));
    }
  }

  function resetCrop() {
    if (!selectedImage) return;
    initCrop(selectedImage);
  }

  async function handleCrop() {
    if (!selectedImage || !hasCrop) return;
    setCropping(true);
    setConsoleEntries([]);

    try {
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "info",
          text: `Cropping ${crop.w}x${crop.h} region at (${crop.x}, ${crop.y})...`,
        },
      ]);

      const response = await fetch("/api/tools/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          x: crop.x,
          y: crop.y,
          width: crop.w,
          height: crop.h,
        }),
      });

      if (!response.ok) throw new Error("Crop failed");

      const data = await response.json();
      const resultImage = data.image as ImageRecord;
      setCroppedImage(resultImage);

      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "info",
          text: `Crop complete: ${resultImage.width}x${resultImage.height} image saved.`,
        },
      ]);

      setStep("preview");
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Crop failed. Please try again." },
      ]);
    } finally {
      setCropping(false);
    }
  }

  async function handleDiscard() {
    if (!croppedImage) return;
    try {
      await fetch(`/api/images/${croppedImage.id}`, { method: "DELETE" });
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Failed to discard cropped image." },
      ]);
    }
    setCroppedImage(null);
    setStep("crop");
  }

  function handleSave() {
    setStep("saved");
  }

  async function handleReplaceOriginal() {
    if (!selectedImage || !croppedImage) return;
    setIsReplacing(true);
    try {
      const response = await fetch(`/api/images/${selectedImage.id}/replace`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceImageId: croppedImage.id }),
      });
      if (!response.ok) {
        const payload = await response.json();
        setConsoleEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "error", text: payload.error ?? "Failed to replace original." },
        ]);
        return;
      }
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "info",
          text: "Original image replaced successfully.",
        },
      ]);
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Failed to connect to the server." },
      ]);
    } finally {
      setIsReplacing(false);
    }
  }

  function resetTool() {
    setStep("select");
    setSelectedImage(null);
    setCroppedImage(null);
    setCrop(null);
    setAspectRatio("free");
    setConsoleEntries([]);
  }

  const meta = stepMeta(step, selectedImage);

  function renderSidebar() {
    if (step !== "crop" || !selectedImage) return undefined;

    return (
      <div className="flex flex-col gap-4 p-4">
        {/* Aspect ratio buttons */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aspect Ratio</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {(["free", "1:1", "4:3", "16:9"] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleAspectChange(ratio)}
                className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                  aspectRatio === ratio
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {ratio === "free" ? "Free" : ratio}
              </button>
            ))}
          </div>
        </div>

        {/* Reset button */}
        <button
          type="button"
          onClick={resetCrop}
          className="flex items-center justify-center gap-1.5 rounded-md border border-border/60 px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="size-3" />
          Reset crop
        </button>
      </div>
    );
  }

  function renderFooter() {
    if (step === "select" && !selectedImage) {
      return (
        <Button onClick={() => setShowPicker(true)}>
          <ImageIcon />
          Select image
        </Button>
      );
    }
    if (step === "select" && selectedImage) {
      return (
        <>
          <Button variant="outline" onClick={resetTool}>Change image</Button>
          <Button onClick={() => { initCrop(selectedImage!); setStep("crop"); }}>
            <Crop />
            Crop
          </Button>
        </>
      );
    }
    if (step === "crop") {
      return (
        <>
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            {hasCrop ? `${crop.w} x ${crop.h}px` : "No selection"}
          </span>
          <Button variant="outline" onClick={() => setStep("select")}>Back</Button>
          <Button onClick={() => void handleCrop()} disabled={cropping || !hasCrop}>
            {cropping ? <Loader2 className="animate-spin" /> : <Crop />}
            {cropping ? "Cropping..." : "Crop"}
          </Button>
        </>
      );
    }
    if (step === "preview") {
      return (
        <>
          <Button variant="outline" onClick={() => void handleDiscard()}>
            <Trash2 />
            Discard
          </Button>
          <Button
            variant="outline"
            disabled={isReplacing}
            onClick={() => void handleReplaceOriginal()}
          >
            {isReplacing ? <Loader2 className="animate-spin" /> : null}
            Replace original
          </Button>
          <Button onClick={handleSave}>
            <Save />
            Save
          </Button>
        </>
      );
    }
    if (step === "saved") {
      return (
        <>
          <Button variant="outline" onClick={resetTool}>Crop another</Button>
          <Button nativeButton={false} render={<Link href="/" />}>Back to tools</Button>
        </>
      );
    }
    return null;
  }

  return (
    <>
      <ToolWizard
        title="Crop"
        icon="Crop"
        color="#fbbf24"
        stepLabels={stepLabels}
        currentStep={stepIndex(step)}
        stepTitle={meta.title}
        stepDescription={meta.description}
        footer={renderFooter()}
        sidebar={renderSidebar()}
        console={<WizardConsole entries={consoleEntries} loading={cropping} />}
      >
        {step === "select" && !selectedImage && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No image selected yet.</p>
          </div>
        )}

        {step === "select" && selectedImage && (
          <ImageCanvas
            src={getImagePublicUrl(selectedImage.id)}
            alt={selectedImage.originalName}
          />
        )}

        {step === "crop" && selectedImage && (
          <ImageCanvas
            src={getImagePublicUrl(selectedImage.id)}
            alt={selectedImage.originalName}
          >
            <CropOverlay
              crop={crop ?? { x: 0, y: 0, w: 0, h: 0 }}
              imageWidth={selectedImage.width}
              imageHeight={selectedImage.height}
              onChange={handleCropChange}
            />
          </ImageCanvas>
        )}

        {step === "preview" && croppedImage && (
          <div className="flex flex-col items-center gap-4 px-6 py-8">
            <div className="relative overflow-hidden rounded-lg shadow-lg shadow-black/20">
              <Image
                src={getImagePublicUrl(croppedImage.id)}
                alt={croppedImage.originalName}
                width={croppedImage.width}
                height={croppedImage.height}
                unoptimized
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">{croppedImage.originalName}</p>
              <p className="text-xs text-muted-foreground">
                {croppedImage.width} x {croppedImage.height}px
              </p>
            </div>
          </div>
        )}

        {step === "saved" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Save className="size-10 text-emerald-400" />
            <p className="text-sm text-muted-foreground">Image saved to gallery</p>
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
