"use client";

import NextImage from "next/image";
import { useRef, useState } from "react";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getImagePublicUrl } from "@/lib/utils";
import type { ImageRecord } from "@/lib/types";

type ImagePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: ImageRecord[];
  onSelect: (image: ImageRecord) => void;
};

export function ImagePickerDialog({
  open,
  onOpenChange,
  images,
  onSelect,
}: ImagePickerDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [tab, setTab] = useState(images.length > 0 ? "gallery" : "upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("sourceType", "upload");
      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as { image: ImageRecord };
      onSelect(payload.image);
      onOpenChange(false);
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      void handleUpload(file);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="flex h-[85vh] max-h-[85vh] w-[90vw] !max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Select an image</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList variant="line">
            <TabsTrigger value="gallery">
              <ImageIcon className="size-3.5" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="size-3.5" />
              Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="min-h-0 flex-1 overflow-y-auto pt-4">
            {images.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No images in gallery yet. Upload one first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {images.map((image) => (
                  <button
                    key={image.id}
                    className="group flex flex-col gap-1.5 text-left"
                    onClick={() => {
                      onSelect(image);
                      onOpenChange(false);
                    }}
                    type="button"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30 transition-all duration-150 group-hover:border-primary/40 group-hover:ring-2 group-hover:ring-primary/20">
                      <NextImage
                        alt={image.originalName}
                        className="size-full object-cover"
                        fill
                        src={getImagePublicUrl(image.id)}
                        unoptimized
                      />
                    </div>
                    <div className="px-0.5">
                      <p className="truncate text-xs text-foreground">
                        {image.originalName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {image.width}x{image.height}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="min-h-0 flex-1 pt-4">
            <button
              className="flex h-full w-full flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              type="button"
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-10 animate-spin" />
              ) : (
                <Upload className="size-10" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isUploading ? "Uploading..." : "Click or drag an image here"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WebP supported
                </p>
              </div>
              <input
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
            </button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
