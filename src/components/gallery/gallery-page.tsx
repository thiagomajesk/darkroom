"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { MousePointerClick, Trash2, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { UploadButton } from "@/components/gallery/upload-button";
import {
  CollectionSidebar,
  type GalleryFilter,
} from "@/components/gallery/collection-sidebar";
import { ImageDetail } from "@/components/gallery/image-detail";
import type { ImageRecord, CollectionRecord } from "@/lib/types";

export function GalleryPage({
  initialImages,
  initialCollections,
}: {
  initialImages: ImageRecord[];
  initialCollections: CollectionRecord[];
}) {
  const [images, setImages] = useState(initialImages);
  const [collections, setCollections] = useState(initialCollections);
  const [filter, setFilter] = useState<GalleryFilter>({ type: "all" });
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [collectionAssetIds, setCollectionAssetIds] = useState<
    Record<string, string[]>
  >({});

  // Selection mode
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  function handleUpload(image: ImageRecord) {
    setImages((prev) => [image, ...prev]);
  }

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;

    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file, file.name || "pasted-image.png");
    formData.set("sourceType", "paste");

    const response = await fetch("/api/images", { method: "POST", body: formData });
    if (response.ok) {
      const data = (await response.json()) as { image: ImageRecord };
      setImages((prev) => [data.image, ...prev]);
    }
  }, []);

  useEffect(() => {
    const handler = ((e: Event) => void handlePaste(e as ClipboardEvent)) as EventListener;
    document.addEventListener("paste", handler);
    return () => document.removeEventListener("paste", handler);
  }, [handlePaste]);

  function handleDeleteAsset(imageId: string) {
    setImages((prev) => prev.filter((a) => a.id !== imageId));
    setSelectedImage(null);
  }

  function enterSelectMode() {
    setSelectMode(true);
    setSelectedIds(new Set());
    setSelectedImage(null);
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function handleSelectionToggle(imageId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    setIsDeleting(true);

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/images/${id}`, { method: "DELETE" }),
        ),
      );
      setImages((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      exitSelectMode();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCreateCollection(name: string) {
    const response = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const data = (await response.json()) as { collection: CollectionRecord };
      setCollections((prev) => [...prev, data.collection]);
    }
  }

  async function handleRenameCollection(id: string, name: string) {
    const response = await fetch(`/api/collections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      const data = (await response.json()) as { collection: CollectionRecord };
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? data.collection : c)),
      );
    }
  }

  async function handleDeleteCollection(id: string) {
    const response = await fetch(`/api/collections/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
      if (filter.type === "collection" && filter.collectionId === id) {
        setFilter({ type: "all" });
      }
    }
  }

  async function handleFilterChange(newFilter: GalleryFilter) {
    setFilter(newFilter);
    if (
      newFilter.type === "collection" &&
      !collectionAssetIds[newFilter.collectionId]
    ) {
      const response = await fetch(
        `/api/collections/${newFilter.collectionId}/images`,
      );
      if (response.ok) {
        const data = (await response.json()) as { images: ImageRecord[] };
        const ids = data.images.map((a) => a.id);
        setCollectionAssetIds((prev) => ({
          ...prev,
          [newFilter.collectionId]: ids,
        }));
      }
    }
  }

  const filteredAssets = useMemo(() => {
    switch (filter.type) {
      case "all":
        return images;
      case "uploaded":
        return images.filter(
          (a) => a.sourceType === "upload" || a.sourceType === "paste",
        );
      case "generated":
        return images.filter((a) => a.sourceType === "generated");
      case "collection": {
        const ids = collectionAssetIds[filter.collectionId];
        if (!ids) return [];
        return images.filter((a) => ids.includes(a.id));
      }
    }
  }, [images, filter, collectionAssetIds]);

  return (
    <main className="flex min-h-0 flex-1 overflow-hidden">
      <CollectionSidebar
        collections={collections}
        filter={filter}
        onFilterChange={handleFilterChange}
        onCreateCollection={handleCreateCollection}
        onRenameCollection={handleRenameCollection}
        onDeleteCollection={handleDeleteCollection}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight">Gallery</h1>
            <span className="hidden text-xs text-muted-foreground/60 sm:inline">Ctrl+V to paste</span>
            {selectMode && (
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectMode ? (
              <>
                <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                  <X />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedIds.size === 0 || isDeleting}
                  onClick={() => void handleDeleteSelected()}
                >
                  {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enterSelectMode}
                  disabled={filteredAssets.length === 0}
                >
                  <MousePointerClick />
                  Select
                </Button>
                <UploadButton onUpload={handleUpload} />
              </>
            )}
          </div>
        </div>
        <GalleryGrid
          images={filteredAssets}
          selectedId={selectedImage?.id}
          onSelect={setSelectedImage}
          batchMode={selectMode}
          batchSelectedIds={selectedIds}
          onBatchToggle={handleSelectionToggle}
        />
      </div>

      {selectedImage && !selectMode && (
        <ImageDetail
          image={selectedImage}
          open={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDeleteAsset}
        />
      )}
    </main>
  );
}
