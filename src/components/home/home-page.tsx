"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid3X3, Fingerprint, Globe, Eraser, Wand2, Crop, ArrowUpCircle, Paintbrush } from "lucide-react";

import { ToolCard } from "@/components/tools/tool-card";
import { ImagePickerDialog } from "@/components/tools/image-picker-dialog";
import type { ImageRecord } from "@/lib/types";

export function HomePage({ initialImages }: { initialImages: ImageRecord[] }) {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [images, setImages] = useState(initialImages);

  function openWithPicker(href: string) {
    setPendingHref(href);
    setShowPicker(true);
  }

  function handleImageSelected(image: ImageRecord) {
    if (!images.find((a) => a.id === image.id)) {
      setImages((prev) => [image, ...prev]);
    }
    if (pendingHref) {
      router.push(`${pendingHref}?imageId=${image.id}`);
    }
    setShowPicker(false);
    setPendingHref(null);
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold tracking-tight">Tools</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a tool to process your images.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <ToolCard
          title="Spritesheet Splitter"
          description="Break a spritesheet into separate extracted images."
          icon={Grid3X3}
          color="#ff9b71"
          onClick={() => openWithPicker("/tools/spritesheet")}
        />
        <ToolCard
          title="Image Classifier"
          description="Generate object, style, and tag metadata."
          icon={Fingerprint}
          color="#89a6fb"
          ai
          onClick={() => openWithPicker("/tools/classify")}
        />
        <ToolCard
          title="Image Scraper"
          description="Scrape and download images from any webpage."
          icon={Globe}
          color="#4ade80"
          onClick={() => router.push("/tools/scraper")}
        />
        <ToolCard
          title="Watermark Remover"
          description="Detect and remove watermarks from images."
          icon={Eraser}
          color="#f472b6"
          ai
          soon
        />
        <ToolCard
          title="Synthesize"
          description="Transform images into synthetic variants: grayscale, colorshift, pixelate, or SVG trace."
          icon={Wand2}
          color="#c084fc"
          onClick={() => openWithPicker("/tools/synthesize")}
        />
        <ToolCard
          title="Crop"
          description="Crop images with a visual selection tool."
          icon={Crop}
          color="#fbbf24"
          onClick={() => openWithPicker("/tools/crop")}
        />
        <ToolCard
          title="Upscale"
          description="Enlarge small images with high-quality interpolation."
          icon={ArrowUpCircle}
          color="#38bdf8"
          onClick={() => openWithPicker("/tools/upscale")}
        />
        <ToolCard
          title="Restyle"
          description="Generate a visually similar but distinct version of an image."
          icon={Paintbrush}
          color="#fb923c"
          ai
          soon
        />
      </div>

      <ImagePickerDialog
        open={showPicker}
        onOpenChange={(open) => {
          setShowPicker(open);
          if (!open) setPendingHref(null);
        }}
        images={images}
        onSelect={handleImageSelected}
      />
    </main>
  );
}
