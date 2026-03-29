"use client";

import { useState, useRef, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Pencil,
  Trash2,
  Check,
  X,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CollectionRecord } from "@/lib/types";

export type GalleryFilter =
  | { type: "all" }
  | { type: "uploaded" }
  | { type: "generated" }
  | { type: "collection"; collectionId: string };

export function CollectionSidebar({
  collections,
  filter,
  onFilterChange,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
}: {
  collections: CollectionRecord[];
  filter: GalleryFilter;
  onFilterChange: (filter: GalleryFilter) => void;
  onCreateCollection: (name: string) => void;
  onRenameCollection: (id: string, name: string) => void;
  onDeleteCollection: (id: string) => void;
}) {
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const newInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingNew) newInputRef.current?.focus();
  }, [creatingNew]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  function submitNewCollection() {
    const trimmed = newName.trim();
    if (trimmed) {
      onCreateCollection(trimmed);
    }
    setNewName("");
    setCreatingNew(false);
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && renamingId) {
      onRenameCollection(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue("");
  }

  function isActive(f: GalleryFilter) {
    if (f.type !== filter.type) return false;
    if (f.type === "collection" && filter.type === "collection") {
      return f.collectionId === filter.collectionId;
    }
    return true;
  }

  const itemBase =
    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer select-none";
  const itemActive = "bg-muted text-foreground font-medium";
  const itemInactive =
    "text-muted-foreground hover:bg-muted/50 hover:text-foreground";

  return (
    <aside className="flex w-52 shrink-0 flex-col border-r border-border/60 bg-card/50 p-4">
      {/* Smart filters */}
      <div className="flex flex-col gap-0.5">
        <button
          className={`${itemBase} ${isActive({ type: "all" }) ? itemActive : itemInactive}`}
          onClick={() => onFilterChange({ type: "all" })}
        >
          <Layers className="size-4" />
          <span>All</span>
        </button>
        <button
          className={`${itemBase} ${isActive({ type: "uploaded" }) ? itemActive : itemInactive}`}
          onClick={() => onFilterChange({ type: "uploaded" })}
        >
          <Upload className="size-4" />
          <span>Uploaded</span>
        </button>
        <button
          className={`${itemBase} ${isActive({ type: "generated" }) ? itemActive : itemInactive}`}
          onClick={() => onFilterChange({ type: "generated" })}
        >
          <Sparkles className="size-4" />
          <span>Generated</span>
        </button>
      </div>

      <Separator className="my-3" />

      {/* Collections label */}
      <div className="mb-1 flex items-center justify-between px-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Collections
        </span>
      </div>

      {/* Collection list */}
      <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {collections.map((col) =>
          renamingId === col.id ? (
            <div key={col.id} className="flex items-center gap-1 px-1">
              <Input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") {
                    setRenamingId(null);
                    setRenameValue("");
                  }
                }}
                className="h-7 text-xs"
              />
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={submitRename}
              >
                <Check className="size-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => {
                  setRenamingId(null);
                  setRenameValue("");
                }}
              >
                <X className="size-3" />
              </Button>
            </div>
          ) : (
            <div
              key={col.id}
              className={`group/col ${itemBase} ${
                isActive({ type: "collection", collectionId: col.id })
                  ? itemActive
                  : itemInactive
              }`}
              onClick={() =>
                onFilterChange({ type: "collection", collectionId: col.id })
              }
            >
              <Folder className="size-4 shrink-0" />
              <span className="flex-1 truncate">{col.name}</span>
              <span className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/col:opacity-100">
                <button
                  className="rounded p-0.5 hover:bg-muted-foreground/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(col.id);
                    setRenameValue(col.name);
                  }}
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  className="rounded p-0.5 text-destructive hover:bg-destructive/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCollection(col.id);
                  }}
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            </div>
          ),
        )}

        {/* Create new collection */}
        {creatingNew ? (
          <div className="flex items-center gap-1 px-1">
            <Input
              ref={newInputRef}
              value={newName}
              placeholder="Collection name"
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitNewCollection();
                if (e.key === "Escape") {
                  setCreatingNew(false);
                  setNewName("");
                }
              }}
              className="h-7 text-xs"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={submitNewCollection}
            >
              <Check className="size-3" />
            </Button>
          </div>
        ) : (
          <button
            className={`${itemBase} ${itemInactive} mt-1`}
            onClick={() => setCreatingNew(true)}
          >
            <FolderPlus className="size-4" />
            <span>New collection</span>
          </button>
        )}
      </div>
    </aside>
  );
}
