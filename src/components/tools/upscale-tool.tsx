"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpCircle,
  Loader2,
  ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import { ImageCanvas } from "@/components/tools/image-canvas";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type Step = "select" | "configure" | "preview" | "saved";

const stepLabels = ["Select", "Configure", "Preview", "Saved"];

function stepIndex(step: Step): number {
  return (["select", "configure", "preview", "saved"] as const).indexOf(step);
}

function stepMeta(step: Step, selectedImage: ImageRecord | null, scaleFactor: number) {
  switch (step) {
    case "select":
      return {
        title: "Select an image",
        description: "Choose an image from your gallery or upload a new one.",
      };
    case "configure":
      return {
        title: "Configure upscale",
        description: selectedImage
          ? `${selectedImage.originalName} — ${selectedImage.width}\u00d7${selectedImage.height}`
          : "Choose a scale factor for the image.",
      };
    case "preview":
      return {
        title: "Preview result",
        description: selectedImage
          ? `Upscaled ${scaleFactor}x — ${selectedImage.width * scaleFactor}\u00d7${selectedImage.height * scaleFactor}`
          : "Review the upscaled image.",
      };
    case "saved":
      return {
        title: "Saved to gallery",
        description: "The upscaled image has been saved.",
      };
  }
}

type UpscaleToolProps = {
  initialImages: ImageRecord[];
  preselectedImage?: ImageRecord | null;
};

export function UpscaleTool({ initialImages, preselectedImage }: UpscaleToolProps) {
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(preselectedImage ?? null);
  const [step, setStep] = useState<Step>(preselectedImage ? "configure" : "select");
  const [scaleFactor, setScaleFactor] = useState<number>(4);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<ImageRecord | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);

  async function handleUpscale() {
    if (!selectedImage) return;
    setIsProcessing(true);
    setConsoleEntries([]);

    setConsoleEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "agent_message",
        text: `Upscaling ${selectedImage.originalName} by ${scaleFactor}x...`,
      },
    ]);

    try {
      const response = await fetch("/api/tools/upscale", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          scaleFactor,
        }),
      });

      const payload = (await response.json()) as {
        image?: ImageRecord;
        error?: string;
      };

      if (!response.ok || payload.error) {
        setConsoleEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), type: "error", text: payload.error ?? "An unexpected error occurred." },
        ]);
        setIsProcessing(false);
        return;
      }

      setResultImage(payload.image ?? null);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "agent_message",
          text: `Upscale complete — ${selectedImage.width * scaleFactor}\u00d7${selectedImage.height * scaleFactor} output generated.`,
        },
      ]);
      setStep("preview");
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Failed to connect to the server." },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReplaceOriginal() {
    if (!selectedImage || !resultImage) return;
    setIsReplacing(true);
    try {
      const response = await fetch(`/api/images/${selectedImage.id}/replace`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceImageId: resultImage.id }),
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
        { id: crypto.randomUUID(), type: "agent_message", text: "Original image replaced successfully." },
      ]);
      setStep("saved");
    } catch {
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: "Failed to connect to the server." },
      ]);
    } finally {
      setIsReplacing(false);
    }
  }

  function resetToStart() {
    setSelectedImage(null);
    setStep("select");
    setResultImage(null);

    setConsoleEntries([]);
  }

  function resetToConfigure() {
    setResultImage(null);

    setConsoleEntries([]);
    setStep("configure");
  }

  const meta = stepMeta(step, selectedImage, scaleFactor);

  function renderSidebar() {
    if (step !== "configure" || !selectedImage) return undefined;

    const outputW = selectedImage.width * scaleFactor;
    const outputH = selectedImage.height * scaleFactor;

    return (
      <div className="space-y-5 p-4">
        {/* Current dimensions */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            Current dimensions
          </p>
          <p className="text-sm tabular-nums text-foreground">
            {selectedImage.width} &times; {selectedImage.height}
          </p>
        </div>

        {/* Scale factor */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Scale factor
          </p>
          <div className="flex gap-1.5">
            {([2, 4, 8] as const).map((factor) => (
              <Button
                key={factor}
                variant={scaleFactor === factor ? "default" : "outline"}
                size="sm"
                className="h-7 flex-1 text-[10px]"
                onClick={() => setScaleFactor(factor)}
              >
                {factor}x
              </Button>
            ))}
          </div>
        </div>

        {/* Output dimensions preview */}
        <div className="space-y-1.5 border-t border-border/40 pt-4">
          <p className="text-xs font-medium text-muted-foreground">
            Output dimensions
          </p>
          <p className="text-sm tabular-nums text-foreground">
            <span className="text-muted-foreground">
              {selectedImage.width}&times;{selectedImage.height}
            </span>
            <span className="mx-1.5 text-muted-foreground/60">&rarr;</span>
            <span className="font-medium" style={{ color: "#38bdf8" }}>
              {outputW}&times;{outputH}
            </span>
          </p>
        </div>
      </div>
    );
  }

  function renderFooter() {
    if (step === "select") {
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
          <Button variant="outline" onClick={resetToStart}>Change image</Button>
          <Button disabled={isProcessing} onClick={() => void handleUpscale()}>
            {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowUpCircle />}
            {isProcessing ? "Upscaling..." : "Upscale"}
          </Button>
        </>
      );
    }
    if (step === "preview") {
      return (
        <>
          <Button variant="outline" onClick={resetToConfigure}>Try again</Button>
          <Button
            variant="outline"
            disabled={isReplacing}
            onClick={() => void handleReplaceOriginal()}
          >
            {isReplacing ? <Loader2 className="animate-spin" /> : null}
            Replace original
          </Button>
          <Button onClick={() => setStep("saved")}>Save as copy</Button>
        </>
      );
    }
    if (step === "saved") {
      return (
        <>
          <Button variant="outline" onClick={resetToConfigure}>Upscale again</Button>
          <Button variant="outline" onClick={resetToStart}>New image</Button>
          <Button nativeButton={false} render={<Link href="/" />}>Back to tools</Button>
        </>
      );
    }
    return null;
  }

  return (
    <>
      <ToolWizard
        title="Upscale"
        icon="ArrowUpCircle"
        color="#38bdf8"
        stepLabels={stepLabels}
        currentStep={stepIndex(step)}
        stepTitle={meta.title}
        stepDescription={meta.description}
        footer={renderFooter()}
        sidebar={renderSidebar()}
        console={
          <WizardConsole entries={consoleEntries} loading={isProcessing} />
        }
      >
        {step === "select" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImageIcon className="size-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No image selected yet.</p>
          </div>
        )}

        {step === "configure" && selectedImage && (
          <div className="relative h-full min-h-[400px]">
            <ImageCanvas
              src={getImagePublicUrl(selectedImage.id)}
              alt={selectedImage.originalName}
            />
            {isProcessing && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Upscaling...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(step === "preview" || step === "saved") && selectedImage && resultImage && (
          <div className="px-6 py-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Original ({selectedImage.width}&times;{selectedImage.height})
                </p>
                <div className="overflow-hidden rounded-xl border">
                  <Image
                    alt={selectedImage.originalName}
                    className="block w-full"
                    height={selectedImage.height}
                    src={getImagePublicUrl(selectedImage.id)}
                    unoptimized
                    width={selectedImage.width}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Upscaled {scaleFactor}x ({resultImage.width}&times;{resultImage.height})
                </p>
                <div className="overflow-hidden rounded-xl border">
                  <Image
                    alt={resultImage.originalName}
                    className="block w-full"
                    height={resultImage.height}
                    src={getImagePublicUrl(resultImage.id)}
                    unoptimized
                    width={resultImage.width}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </ToolWizard>

      <ImagePickerDialog
        open={showPicker}
        onOpenChange={setShowPicker}
        images={initialImages}
        onSelect={(image) => {
          setSelectedImage(image);
          setStep("configure");
        }}
      />
    </>
  );
}
