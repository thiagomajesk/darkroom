"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Wand2,
  Loader2,
  ImageIcon,
  Palette,
  Grid2X2,
  FileCode,
  Sun,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type Step = "select" | "configure" | "preview" | "saved";

type SynthesizeMode = "grayscale" | "colorshift" | "pixelate" | "svg";

const stepLabels = ["Select", "Configure", "Preview", "Saved"];

function stepIndex(step: Step): number {
  return (["select", "configure", "preview", "saved"] as const).indexOf(step);
}

function stepMeta(step: Step, selectedImage: ImageRecord | null) {
  switch (step) {
    case "select":
      return {
        title: "Select an image",
        description: "Choose an image from your gallery or upload a new one.",
      };
    case "configure":
      return {
        title: "Configure synthesis",
        description: selectedImage
          ? `${selectedImage.originalName} — ${selectedImage.width}x${selectedImage.height}`
          : "Choose a mode and adjust settings.",
      };
    case "preview":
      return {
        title: "Preview result",
        description: "Adjust settings and re-process, or save to gallery.",
      };
    case "saved":
      return {
        title: "Saved to gallery",
        description: "The transformed image has been saved.",
      };
  }
}

const modes: {
  id: SynthesizeMode;
  name: string;
  description: string;
  icon: typeof Wand2;
}[] = [
  {
    id: "grayscale",
    name: "Grayscale",
    description: "Convert to black and white",
    icon: Sun,
  },
  {
    id: "colorshift",
    name: "Color Shift",
    description: "Rotate the color hue",
    icon: Palette,
  },
  {
    id: "pixelate",
    name: "Pixelate",
    description: "Apply pixel block effect",
    icon: Grid2X2,
  },
  {
    id: "svg",
    name: "SVG Trace",
    description: "Convert to vector graphic",
    icon: FileCode,
  },
];

type SynthesizeToolProps = {
  initialImages: ImageRecord[];
  preselectedImage?: ImageRecord | null;
};

export function SynthesizeTool({ initialImages, preselectedImage }: SynthesizeToolProps) {
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(preselectedImage ?? null);
  const [step, setStep] = useState<Step>(preselectedImage ? "configure" : "select");
  const [selectedMode, setSelectedMode] = useState<SynthesizeMode>("grayscale");
  const [intensity, setIntensity] = useState(100);
  const [hue, setHue] = useState(180);
  const [pixelAmount, setPixelAmount] = useState(30);
  const [detail, setDetail] = useState<"low" | "medium" | "high">("medium");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<ImageRecord | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isReplacing, setIsReplacing] = useState(false);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);

  useEffect(() => {
    if (resultImage && resultImage.mimeType === "image/svg+xml") {
      fetch(getImagePublicUrl(resultImage.id))
        .then((res) => res.text())
        .then(setSvgContent)
        .catch(() => setSvgContent(null));
    }
  }, [resultImage]);

  async function handleSynthesize() {
    if (!selectedImage) return;
    setIsProcessing(true);

    const modeName = modes.find((m) => m.id === selectedMode)?.name ?? selectedMode;
    setConsoleEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "info", text: `Applying ${modeName}...` },
    ]);

    const options: Record<string, unknown> = {};
    if (selectedMode === "grayscale") options.intensity = intensity;
    if (selectedMode === "colorshift") options.hue = hue;
    if (selectedMode === "pixelate") options.pixelAmount = pixelAmount;
    if (selectedMode === "svg") options.detail = detail;

    try {
      const response = await fetch("/api/tools/synthesize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageId: selectedImage.id,
          mode: selectedMode,
          options,
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
      setSvgContent(null);
      setConsoleEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "agent_message", text: `${modeName} applied successfully.` },
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
    setSvgContent(null);

    setConsoleEntries([]);
  }

  function resetToConfigure() {
    setResultImage(null);
    setSvgContent(null);

    setConsoleEntries([]);
    setStep("configure");
  }

  const meta = stepMeta(step, selectedImage);

  function renderSidebar() {
    // Configure step: mode selection only
    if (step === "configure" && selectedImage) {
      return (
        <div className="space-y-4 p-4">
          <p className="text-xs font-medium text-muted-foreground">Mode</p>
          <div className="space-y-1.5">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  className={`flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-all ${
                    isSelected
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                  type="button"
                >
                  <Icon className={`mt-0.5 size-3.5 shrink-0 ${isSelected ? "text-primary" : ""}`} />
                  <div>
                    <span className="text-xs font-medium">{mode.name}</span>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      {mode.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Preview step: adjustment sliders
    if (step === "preview" && resultImage) {
      const modeName = modes.find((m) => m.id === selectedMode)?.name ?? selectedMode;
      return (
        <div className="space-y-4 p-4">
          <p className="text-xs font-medium text-muted-foreground">{modeName} settings</p>

          {selectedMode === "grayscale" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Intensity</label>
                <span className="text-xs tabular-nums text-muted-foreground">{intensity}%</span>
              </div>
              <input type="range" min={0} max={100} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          )}

          {selectedMode === "colorshift" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Hue shift</label>
                <span className="text-xs tabular-nums text-muted-foreground">{hue}°</span>
              </div>
              <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          )}

          {selectedMode === "pixelate" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Amount</label>
                <span className="text-xs tabular-nums text-muted-foreground">{pixelAmount}%</span>
              </div>
              <input type="range" min={1} max={100} value={pixelAmount} onChange={(e) => setPixelAmount(Number(e.target.value))} className="w-full accent-primary" />
            </div>
          )}

          {selectedMode === "svg" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Detail level</p>
              <div className="flex gap-1.5">
                {(["low", "medium", "high"] as const).map((level) => (
                  <Button
                    key={level}
                    variant={detail === level ? "default" : "outline"}
                    size="sm"
                    className="h-7 flex-1 text-[10px]"
                    onClick={() => setDetail(level)}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={isProcessing}
            onClick={() => void handleSynthesize()}
          >
            {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Re-process
          </Button>
        </div>
      );
    }

    return undefined;
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
          <Button disabled={isProcessing} onClick={() => void handleSynthesize()}>
            {isProcessing ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {isProcessing ? "Processing..." : "Synthesize"}
          </Button>
        </>
      );
    }
    if (step === "preview") {
      return (
        <>
          <Button variant="outline" onClick={resetToConfigure}>Change mode</Button>
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
          <Button variant="outline" onClick={resetToConfigure}>Synthesize another mode</Button>
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
        title="Synthesize"
        icon="Wand2"
        color="#c084fc"
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
          <div className="relative">
            <Image
              alt={selectedImage.originalName}
              className="block max-h-[60vh] w-full object-contain"
              height={selectedImage.height}
              src={getImagePublicUrl(selectedImage.id)}
              unoptimized
              width={selectedImage.width}
            />
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Synthesizing...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(step === "preview" || step === "saved") && selectedImage && resultImage && (
          <div className="grid h-full min-h-0 gap-4 p-4 md:grid-cols-2">
            <div className="flex min-h-0 flex-col gap-2">
              <p className="shrink-0 text-xs font-medium text-muted-foreground">Original</p>
              <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border bg-muted/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={selectedImage.originalName}
                  className="block"
                  src={getImagePublicUrl(selectedImage.id)}
                />
              </div>
            </div>

            <div className="flex min-h-0 flex-col gap-2">
              <p className="shrink-0 text-xs font-medium text-muted-foreground">
                {modes.find((m) => m.id === selectedMode)?.name ?? "Result"}
              </p>
              <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border bg-muted/10">
                {resultImage.mimeType === "image/svg+xml" && svgContent ? (
                  <div
                    className="p-4 [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: svgContent }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    alt={resultImage.originalName}
                    className="block"
                    src={getImagePublicUrl(resultImage.id)}
                  />
                )}
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
