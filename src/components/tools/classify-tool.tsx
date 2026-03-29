"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Fingerprint, Loader2, ImageIcon, Copy, Check, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import { ToolWizard } from "@/components/tools/tool-wizard";
import { WizardConsole, type ConsoleEntry } from "@/components/tools/wizard-console";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord, ImageClassification } from "@/lib/types";

type Step = "select" | "classify" | "results";

const stepLabels = ["Select", "Classify", "Results"];

function stepIndex(step: Step): number {
  return (["select", "classify", "results"] as const).indexOf(step);
}

function stepMeta(step: Step, selectedImage: ImageRecord | null) {
  switch (step) {
    case "select":
      return {
        title: "Select an image",
        description: "Choose an image from your gallery or upload a new one.",
      };
    case "classify":
      return {
        title: "Classify image",
        description: selectedImage
          ? `${selectedImage.originalName} — ${selectedImage.width}x${selectedImage.height}`
          : "AI will generate metadata for the selected image.",
      };
    case "results":
      return {
        title: "Classification complete",
        description: "Object, style, and tag metadata have been generated.",
      };
  }
}

type ClassifyToolProps = {
  initialImages: ImageRecord[];
  preselectedImage?: ImageRecord | null;
};

export function ClassifyTool({ initialImages, preselectedImage }: ClassifyToolProps) {
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(preselectedImage ?? null);
  const [step, setStep] = useState<Step>(preselectedImage ? "classify" : "select");
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ImageClassification | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [showPicker, setShowPicker] = useState(!preselectedImage);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveMetadata() {
    if (!selectedImage || !result) return;
    setIsSaving(true);
    try {
      await fetch(`/api/images/${selectedImage.id}/metadata`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ classification: result }),
      });
      setSaved(true);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "agent_message",
          text: "Classification metadata saved to image.",
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClassify() {
    if (!selectedImage) return;
    setIsClassifying(true);
    setConsoleEntries([]);
    try {
      const response = await fetch("/api/tools/classify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ imageId: selectedImage.id }),
      });
      const payload = (await response.json()) as {
        classification: ImageClassification;
      };
      setResult(payload.classification);
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: "agent_message",
          text: `Classification complete — ${payload.classification.tags.length} tags generated.`,
        },
      ]);
      setStep("results");
    } finally {
      setIsClassifying(false);
    }
  }

  function reset() {
    setSelectedImage(null);
    setStep("select");
    setResult(null);
    setConsoleEntries([]);
  }

  const meta = stepMeta(step, selectedImage);

  function renderFooter() {
    if (step === "select") {
      return (
        <Button onClick={() => setShowPicker(true)}>
          <ImageIcon />
          Select image
        </Button>
      );
    }
    if (step === "classify") {
      return (
        <>
          <Button variant="outline" onClick={reset}>Change image</Button>
          <Button disabled={isClassifying} onClick={() => void handleClassify()}>
            {isClassifying ? <Loader2 className="animate-spin" /> : <Fingerprint />}
            {isClassifying ? "Classifying..." : "Classify"}
          </Button>
        </>
      );
    }
    if (step === "results") {
      return (
        <>
          <Button variant="outline" onClick={reset}>Classify another</Button>
          <Button
            variant="outline"
            disabled={isSaving || saved}
            onClick={() => void handleSaveMetadata()}
          >
            {isSaving ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <Save />}
            {saved ? "Saved" : "Save metadata"}
          </Button>
          <Button nativeButton={false} render={<Link href="/" />}>Back to tools</Button>
        </>
      );
    }
    return null;
  }

  return (
    <>
      <ToolWizard
        title="Image Classifier"
        icon="Fingerprint"
        color="#89a6fb"
        stepLabels={stepLabels}
        currentStep={stepIndex(step)}
        stepTitle={meta.title}
        stepDescription={meta.description}
        footer={renderFooter()}
        console={
          <WizardConsole entries={consoleEntries} loading={isClassifying} />
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

        {step === "classify" && selectedImage && (
          <div className="relative">
            <Image
              alt={selectedImage.originalName}
              className="block max-h-[60vh] w-full object-contain"
              height={selectedImage.height}
              src={getImagePublicUrl(selectedImage.id)}
              unoptimized
              width={selectedImage.width}
            />
            {isClassifying && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Classifying...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {step === "results" && selectedImage && result && (
          <div className="px-6 py-6">
            <div className="grid gap-6 md:grid-cols-[1fr_1.5fr]">
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

              <div className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Object</p>
                  <p className="mt-1 text-sm leading-relaxed">{result.objectDescription}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Art style</p>
                  <p className="mt-1 text-sm leading-relaxed">{result.artStyleDescription}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Tags</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {result.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                {result.reproductionPrompt && (
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">Prompt</p>
                      <button
                        type="button"
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => {
                          void navigator.clipboard.writeText(result.reproductionPrompt);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="mt-1 rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-foreground/80">
                      {result.reproductionPrompt}
                    </p>
                  </div>
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
          setStep("classify");
        }}
      />
    </>
  );
}
