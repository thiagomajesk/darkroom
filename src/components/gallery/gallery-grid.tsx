"use client";

import Image from "next/image";
import { Check } from "lucide-react";

import { cn, getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

export function GalleryGrid({
  images,
  selectedId,
  onSelect,
  batchMode = false,
  batchSelectedIds,
  onBatchToggle,
}: {
  images: ImageRecord[];
  selectedId?: string | null;
  onSelect?: (image: ImageRecord) => void;
  batchMode?: boolean;
  batchSelectedIds?: Set<string>;
  onBatchToggle?: (imageId: string) => void;
}) {
  if (images.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No images yet. Upload one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {images.map((image) => {
        const isSelected = batchMode
          ? batchSelectedIds?.has(image.id) ?? false
          : selectedId === image.id;

        return (
          <button
            key={image.id}
            type="button"
            className="group flex cursor-pointer flex-col gap-1.5 text-left"
            onClick={() => {
              if (batchMode) {
                onBatchToggle?.(image.id);
              } else {
                onSelect?.(image);
              }
            }}
          >
            <div
              className={cn(
                "relative aspect-square overflow-hidden rounded-lg border bg-muted/30 transition-all duration-200 group-hover:scale-[1.02]",
                isSelected && !batchMode &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-background",
                isSelected && batchMode &&
                  "ring-2 ring-destructive ring-offset-2 ring-offset-background",
              )}
            >
              <Image
                src={getImagePublicUrl(image.id)}
                alt={image.originalName}
                fill
                unoptimized
                className="object-cover"
              />
              {batchMode && isSelected && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <div className="flex size-6 items-center justify-center rounded-full bg-destructive text-white">
                    <Check className="size-3.5" />
                  </div>
                </div>
              )}
              {batchMode && !isSelected && (
                <div className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border-2 border-muted-foreground/40 bg-background/60 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </div>
            <div className="flex flex-col px-0.5">
              <span className="truncate text-xs text-foreground">
                {image.originalName}
              </span>
              <span className="text-xs text-muted-foreground">
                {image.width} x {image.height}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
