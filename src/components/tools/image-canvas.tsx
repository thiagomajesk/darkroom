"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

type ImageCanvasProps = {
  src: string;
  alt: string;
  children?: React.ReactNode;
};

export function ImageCanvas({ src, alt, children }: ImageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number | null>(null); // null = not yet computed
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });

  const getContainerSize = useCallback(() => {
    const el = containerRef.current;
    if (!el) return { w: 0, h: 0 };
    return { w: el.clientWidth, h: el.clientHeight };
  }, []);

  const computeFitZoom = useCallback(() => {
    const c = getContainerSize();
    if (!naturalSize.w || !c.w) return 0.5;
    return Math.min(
      (c.w * 0.85) / naturalSize.w,
      (c.h * 0.85) / naturalSize.h,
      1,
    );
  }, [naturalSize, getContainerSize]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  }, []);

  // Set initial zoom once we have both natural size and container
  useEffect(() => {
    if (naturalSize.w > 0 && zoom === null) {
      // Small delay to let container measure
      requestAnimationFrame(() => {
        setZoom(computeFitZoom());
      });
    }
  }, [naturalSize, zoom, computeFitZoom]);

  function fitToView() {
    setZoom(computeFitZoom());
  }

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  function onWheel(e: React.WheelEvent) {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.min(Math.max((z ?? 1) + delta, 0.05), 4));
  }

  function onMouseDown(e: React.MouseEvent) {
    // Middle click (button 1) to pan
    if (e.button !== 1) return;
    e.preventDefault();
    const el = containerRef.current;
    if (!el) return;
    setIsPanning(true);
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: el.scrollLeft,
      scrollTop: el.scrollTop,
    };
  }

  useEffect(() => {
    if (!isPanning) return;

    function onMouseMove(e: MouseEvent) {
      const el = containerRef.current;
      if (!el) return;
      el.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x);
      el.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y);
    }

    function onMouseUp() {
      setIsPanning(false);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isPanning]);

  const currentZoom = zoom ?? computeFitZoom();
  const imgW = naturalSize.w * currentZoom;
  const imgH = naturalSize.h * currentZoom;

  return (
    <div className="relative h-full w-full">
      {/* Zoom controls — fixed position, never scrolls */}
      <div className="absolute right-3 top-3 z-30 flex items-center gap-0.5 rounded-md border border-border/40 bg-card/95 px-1 py-0.5 shadow-sm backdrop-blur-sm">
        <button type="button" onClick={() => setZoom((z) => Math.max((z ?? 1) - 0.25, 0.1))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ZoomOut className="size-3.5" />
        </button>
        <span className="min-w-[3.5ch] text-center text-[10px] tabular-nums text-muted-foreground">
          {Math.round(currentZoom * 100)}%
        </span>
        <button type="button" onClick={() => setZoom((z) => Math.min((z ?? 1) + 0.25, 4))} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
          <ZoomIn className="size-3.5" />
        </button>
        <button type="button" onClick={fitToView} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Fit to view">
          <Maximize className="size-3" />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="h-full w-full overflow-auto"
        style={{ backgroundColor: "oklch(0.11 0 0)", cursor: isPanning ? "grabbing" : undefined }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
      >
        {/* Centering wrapper: always at least 100% of container, flex centers the image */}
        <div
          className="flex items-center justify-center"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            width: imgW > 0 ? Math.max(imgW + 48, containerRef.current?.clientWidth ?? 0) : "100%",
            height: imgH > 0 ? Math.max(imgH + 48, containerRef.current?.clientHeight ?? 0) : "100%",
            padding: 24,
          }}
        >
          {naturalSize.w > 0 ? (
            <div
              className="relative shadow-2xl shadow-black/40"
              style={{ width: imgW, height: imgH }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt}
                draggable={false}
                className="relative block"
                style={{ width: imgW, height: imgH }}
              />
              {children && <div className="absolute inset-0">{children}</div>}
            </div>
          ) : null}
        </div>

        {/* Hidden image to measure natural size */}
        {naturalSize.w === 0 && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} onLoad={handleLoad} className="invisible absolute" />
        )}
        {/* Visible image also triggers load */}
        {naturalSize.w > 0 ? null : null}
      </div>

      {/* Also load via visible path */}
      {naturalSize.w === 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          className="pointer-events-none invisible absolute left-0 top-0"
        />
      )}
    </div>
  );
}
