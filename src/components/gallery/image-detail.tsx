"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Grid3X3,
  Fingerprint,
  Wand2,
  Crop,
  ArrowUpCircle,
  Trash2,
  Calendar,
  Ruler,
  Tag,
  MoreHorizontal,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord, ImageClassification } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(sourceType: ImageRecord["sourceType"]) {
  switch (sourceType) {
    case "upload":
      return "Uploaded";
    case "paste":
      return "Pasted";
    case "url":
      return "From URL";
    case "generated":
      return "Generated";
  }
}

export function ImageDetail({
  image,
  open,
  onClose,
  onDelete,
}: {
  image: ImageRecord;
  open: boolean;
  onClose: () => void;
  onDelete: (imageId: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const classification = image.metadata?.classification as ImageClassification | undefined;

  async function handleDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/images/${image.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDelete(image.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  }

  function handleCopyPrompt() {
    if (!classification?.reproductionPrompt) return;
    void navigator.clipboard.writeText(classification.reproductionPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          setFlipped(false);
          onClose();
        }
      }}
    >
      <DialogContent className="flex aspect-square flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="truncate">{image.originalName}</DialogTitle>
          <DialogDescription>
            Image details and quick actions
          </DialogDescription>
        </DialogHeader>

        {/* Card flip container */}
        <div className="min-h-0 flex-1" style={{ perspective: "1200px" }}>
          <div
            className="relative h-full w-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front: image */}
            <div
              className="group/img absolute inset-0 overflow-hidden rounded-lg border bg-muted/10"
              style={{ backfaceVisibility: "hidden" }}
            >
              <Image
                src={getImagePublicUrl(image.id)}
                alt={image.originalName}
                fill
                unoptimized
                className="object-contain"
              />

              {/* Hover overlays */}
              <div className="absolute left-2 top-2 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover/img:opacity-100">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem render={<Link href={`/tools/spritesheet?imageId=${image.id}`} />}>
                      <Grid3X3 className="size-3.5" />
                      Spritesheet Splitter
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/tools/classify?imageId=${image.id}`} />}>
                      <Fingerprint className="size-3.5" />
                      Classify
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/tools/crop?imageId=${image.id}`} />}>
                      <Crop className="size-3.5" />
                      Crop
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/tools/synthesize?imageId=${image.id}`} />}>
                      <Wand2 className="size-3.5" />
                      Synthesize
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href={`/tools/upscale?imageId=${image.id}`} />}>
                      <ArrowUpCircle className="size-3.5" />
                      Upscale
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Flip button (only when classified) */}
              {classification && (
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm opacity-0 transition-all hover:bg-black/80 group-hover/img:opacity-100"
                  title="Show classification"
                >
                  <RotateCcw className="size-4" />
                </button>
              )}
            </div>

            {/* Back: classification metadata */}
            <div
              className="absolute inset-0 overflow-y-auto rounded-lg border bg-card p-6"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Classification
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcw className="size-3" />
                    Back to image
                  </button>
                </div>

                {classification && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Object</p>
                      <p className="mt-1 text-sm leading-relaxed">{classification.objectDescription}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Art style</p>
                      <p className="mt-1 text-sm leading-relaxed">{classification.artStyleDescription}</p>
                    </div>
                    {classification.tags.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Tags</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {classification.tags.map((tag) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {classification.reproductionPrompt && (
                      <div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground">Prompt</p>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            onClick={handleCopyPrompt}
                          >
                            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                        <p className="mt-1 rounded-md bg-muted/50 p-3 text-sm leading-relaxed text-foreground/80">
                          {classification.reproductionPrompt}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer: badges + delete */}
        <div className="flex shrink-0 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <Tag className="size-3" />
              {sourceLabel(image.sourceType)}
            </Badge>
            <Badge variant="outline">
              <Ruler className="size-3" />
              {image.width} × {image.height}
            </Badge>
            <Badge variant="outline">
              <Calendar className="size-3" />
              {formatDate(image.createdAt)}
            </Badge>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-3.5" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
