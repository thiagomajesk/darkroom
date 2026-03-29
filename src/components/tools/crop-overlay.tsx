"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CropRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type CropOverlayProps = {
  crop: CropRect;
  imageWidth: number;
  imageHeight: number;
  onChange: (crop: CropRect) => void;
};

type DragMode =
  | "move"
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw"
  | null;

const EDGE_SIZE = 8;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getCursorForMode(mode: DragMode): string {
  switch (mode) {
    case "move":
      return "move";
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    default:
      return "crosshair";
  }
}

export function CropOverlay({
  crop,
  imageWidth,
  imageHeight,
  onChange,
}: CropOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, crop: crop });

  // Convert natural pixel values to percentages for positioning
  const leftPct = (crop.x / imageWidth) * 100;
  const topPct = (crop.y / imageHeight) * 100;
  const widthPct = (crop.w / imageWidth) * 100;
  const heightPct = (crop.h / imageHeight) * 100;

  const getMouseNaturalCoords = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const el = overlayRef.current;
      if (!el) return { nx: 0, ny: 0 };
      const rect = el.getBoundingClientRect();
      const ratioX = imageWidth / rect.width;
      const ratioY = imageHeight / rect.height;
      return {
        nx: (e.clientX - rect.left) * ratioX,
        ny: (e.clientY - rect.top) * ratioY,
      };
    },
    [imageWidth, imageHeight],
  );

  const detectMode = useCallback(
    (e: React.MouseEvent): DragMode => {
      const { nx, ny } = getMouseNaturalCoords(e);
      const el = overlayRef.current;
      if (!el) return null;

      const rect = el.getBoundingClientRect();
      const edgeNatX = (EDGE_SIZE / rect.width) * imageWidth;
      const edgeNatY = (EDGE_SIZE / rect.height) * imageHeight;

      const { x, y, w, h } = crop;

      const insideX = nx >= x && nx <= x + w;
      const insideY = ny >= y && ny <= y + h;

      if (!insideX || !insideY) return null;

      const nearLeft = nx - x < edgeNatX;
      const nearRight = x + w - nx < edgeNatX;
      const nearTop = ny - y < edgeNatY;
      const nearBottom = y + h - ny < edgeNatY;

      if (nearTop && nearLeft) return "nw";
      if (nearTop && nearRight) return "ne";
      if (nearBottom && nearLeft) return "sw";
      if (nearBottom && nearRight) return "se";
      if (nearTop) return "n";
      if (nearBottom) return "s";
      if (nearLeft) return "w";
      if (nearRight) return "e";

      return "move";
    },
    [crop, getMouseNaturalCoords, imageWidth, imageHeight],
  );

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    const mode = detectMode(e);
    const { nx, ny } = getMouseNaturalCoords(e);

    if (!mode) {
      // Click outside crop — start a new selection
      const newCrop = { x: Math.round(nx), y: Math.round(ny), w: 0, h: 0 };
      onChange(newCrop);
      dragStart.current = { mouseX: nx, mouseY: ny, crop: newCrop };
      setDragMode("se");
      return;
    }

    dragStart.current = { mouseX: nx, mouseY: ny, crop: { ...crop } };
    setDragMode(mode);
  }

  useEffect(() => {
    if (!dragMode) return;

    const currentMode = dragMode;

    function handleMouseMove(e: MouseEvent) {
      const el = overlayRef.current;
      if (!el || !currentMode) return;

      const rect = el.getBoundingClientRect();
      const ratioX = imageWidth / rect.width;
      const ratioY = imageHeight / rect.height;
      const nx = (e.clientX - rect.left) * ratioX;
      const ny = (e.clientY - rect.top) * ratioY;

      const dx = nx - dragStart.current.mouseX;
      const dy = ny - dragStart.current.mouseY;
      const orig = dragStart.current.crop;

      let newX = orig.x;
      let newY = orig.y;
      let newW = orig.w;
      let newH = orig.h;

      const MIN_SIZE = 4;

      if (currentMode === "move") {
        newX = clamp(orig.x + dx, 0, imageWidth - orig.w);
        newY = clamp(orig.y + dy, 0, imageHeight - orig.h);
      } else {
        // Handle horizontal edges
        if (currentMode.includes("w")) {
          const maxDx = orig.w - MIN_SIZE;
          const clampedDx = clamp(dx, -orig.x, maxDx);
          newX = orig.x + clampedDx;
          newW = orig.w - clampedDx;
        }
        if (currentMode.includes("e")) {
          newW = clamp(orig.w + dx, MIN_SIZE, imageWidth - orig.x);
        }

        // Handle vertical edges
        if (currentMode.includes("n")) {
          const maxDy = orig.h - MIN_SIZE;
          const clampedDy = clamp(dy, -orig.y, maxDy);
          newY = orig.y + clampedDy;
          newH = orig.h - clampedDy;
        }
        if (currentMode.includes("s")) {
          newH = clamp(orig.h + dy, MIN_SIZE, imageHeight - orig.y);
        }
      }

      onChange({
        x: Math.round(newX),
        y: Math.round(newY),
        w: Math.round(newW),
        h: Math.round(newH),
      });
    }

    function handleMouseUp() {
      setDragMode(null);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragMode, imageWidth, imageHeight, onChange]);

  // Cursor based on hover position
  const [hoverCursor, setHoverCursor] = useState("crosshair");

  function handleMouseMoveLocal(e: React.MouseEvent) {
    if (dragMode) return;
    const mode = detectMode(e);
    setHoverCursor(getCursorForMode(mode));
  }

  const hasCrop = crop.w > 0 && crop.h > 0;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0"
      style={{ cursor: dragMode ? getCursorForMode(dragMode) : (hasCrop ? hoverCursor : "crosshair") }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMoveLocal}
    >
      {/* Dark overlays around crop area */}
      {/* Top */}
      <div
        className="absolute left-0 top-0 bg-black/50"
        style={{
          width: "100%",
          height: `${topPct}%`,
        }}
      />
      {/* Bottom */}
      <div
        className="absolute bottom-0 left-0 bg-black/50"
        style={{
          width: "100%",
          height: `${100 - topPct - heightPct}%`,
        }}
      />
      {/* Left */}
      <div
        className="absolute left-0 bg-black/50"
        style={{
          top: `${topPct}%`,
          width: `${leftPct}%`,
          height: `${heightPct}%`,
        }}
      />
      {/* Right */}
      <div
        className="absolute right-0 bg-black/50"
        style={{
          top: `${topPct}%`,
          width: `${100 - leftPct - widthPct}%`,
          height: `${heightPct}%`,
        }}
      />

      {/* Crop window border */}
      <div
        className="absolute border-2 border-primary"
        style={{
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: `${heightPct}%`,
        }}
      >
        {/* Rule-of-thirds grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-2/3 top-0 h-full w-px bg-white/20" />
          <div className="absolute left-0 top-1/3 h-px w-full bg-white/20" />
          <div className="absolute left-0 top-2/3 h-px w-full bg-white/20" />
        </div>

        {/* Corner handles */}
        <div className="absolute -left-1 -top-1 size-2.5 border-2 border-primary bg-white rounded-sm" />
        <div className="absolute -right-1 -top-1 size-2.5 border-2 border-primary bg-white rounded-sm" />
        <div className="absolute -bottom-1 -left-1 size-2.5 border-2 border-primary bg-white rounded-sm" />
        <div className="absolute -bottom-1 -right-1 size-2.5 border-2 border-primary bg-white rounded-sm" />

        {/* Edge handles */}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary" />
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary" />
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary" />
        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary" />
      </div>

      {!hasCrop && !dragMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="rounded-lg bg-black/60 px-4 py-2 text-xs text-white/80 backdrop-blur-sm">
            Click and drag to select
          </p>
        </div>
      )}
    </div>
  );
}
