import sharp from "sharp";

import type { SpritesheetBox } from "../../../src/lib/types";

type RGBA = { r: number; g: number; b: number; a: number; isTransparent?: boolean };

type DetectOptions = {
  mergeTolerance?: number;
  minSize?: number;
  bgColor?: { r: number; g: number; b: number };
  tolerance?: number;
  region?: { x: number; y: number; width: number; height: number };
};

function detectBackgroundColor(data: Buffer, width: number, height: number, region?: DetectOptions["region"]): RGBA {
  const rx = region?.x ?? 0;
  const ry = region?.y ?? 0;
  const rw = region?.width ?? width;
  const rh = region?.height ?? height;

  // Check if image has significant transparency in the region
  let transparentPixels = 0;
  let sampled = 0;
  for (let y = ry; y < ry + rh; y += 2) {
    for (let x = rx; x < rx + rw; x += 2) {
      const i = (y * width + x) * 4 + 3;
      if (data[i] < 250) transparentPixels++;
      sampled++;
    }
  }
  if (sampled > 0 && transparentPixels / sampled > 0.05) {
    return { r: 0, g: 0, b: 0, a: 0, isTransparent: true };
  }

  // Sample edge pixels of the region
  const colorCounts = new Map<string, { r: number; g: number; b: number; count: number }>();

  function samplePixel(x: number, y: number) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const index = (y * width + x) * 4;
    if (data[index + 3] < 50) return;
    const key = `${data[index]},${data[index + 1]},${data[index + 2]}`;
    const existing = colorCounts.get(key);
    if (existing) {
      existing.count++;
    } else {
      colorCounts.set(key, { r: data[index], g: data[index + 1], b: data[index + 2], count: 1 });
    }
  }

  for (let x = rx; x < rx + rw; x++) {
    samplePixel(x, ry);
    samplePixel(x, ry + rh - 1);
  }
  for (let y = ry; y < ry + rh; y++) {
    samplePixel(rx, y);
    samplePixel(rx + rw - 1, y);
  }

  let best = { r: 0, g: 0, b: 0, count: 0 };
  for (const entry of colorCounts.values()) {
    if (entry.count > best.count) best = entry;
  }

  return { r: best.r, g: best.g, b: best.b, a: 255 };
}

export async function detectSprites(
  inputPath: string,
  options: DetectOptions = {},
): Promise<SpritesheetBox[]> {
  const { mergeTolerance = 0, minSize = 4, tolerance = 0, region } = options;

  const image = sharp(inputPath);
  const { width: w, height: h } = await image.metadata();
  if (!w || !h) throw new Error("Unable to read image dimensions.");

  const { data } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const width = w;
  const height = h;

  // Use user-provided bgColor or auto-detect
  let bgColor: RGBA;
  if (options.bgColor) {
    bgColor = { ...options.bgColor, a: 255 };
  } else {
    bgColor = detectBackgroundColor(data, width, height, region);
  }

  const colorTolerance = tolerance * tolerance; // squared for comparison

  // Region bounds
  const scanX = region?.x ?? 0;
  const scanY = region?.y ?? 0;
  const scanW = region?.width ?? width;
  const scanH = region?.height ?? height;

  const visited = new Uint8Array(width * height);

  function isBackground(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= width || y >= height) return true;
    const index = (y * width + x) * 4;

    if (bgColor.isTransparent) {
      return data[index + 3] < 10;
    }

    if (data[index + 3] === 0) return true;
    if (data[index + 3] < 255) return false;

    const dr = data[index] - bgColor.r;
    const dg = data[index + 1] - bgColor.g;
    const db = data[index + 2] - bgColor.b;
    return dr * dr + dg * dg + db * db <= colorTolerance;
  }

  // Region bounds for constraining the flood fill
  const boundX1 = scanX;
  const boundY1 = scanY;
  const boundX2 = scanX + scanW;
  const boundY2 = scanY + scanH;

  function findSprite(startX: number, startY: number): SpritesheetBox | null {
    const startIdx = startY * width + startX;
    if (isBackground(startX, startY) || visited[startIdx]) return null;

    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    const queue = [startIdx];
    visited[startIdx] = 1;

    while (queue.length > 0) {
      const cur = queue.pop()!;
      const cx = cur % width;
      const cy = (cur - cx) / width;

      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);

      for (const [dx, dy] of [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < boundX1 || nx >= boundX2 || ny < boundY1 || ny >= boundY2) continue;
        const ni = ny * width + nx;
        if (visited[ni] || isBackground(nx, ny)) continue;
        visited[ni] = 1;
        queue.push(ni);
      }
    }

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;

    if (bw < minSize || bh < minSize) return null;

    return {
      id: crypto.randomUUID(),
      label: "",
      x: minX,
      y: minY,
      width: bw,
      height: bh,
    };
  }

  // Scan within region bounds only
  const sprites: SpritesheetBox[] = [];
  for (let y = scanY; y < scanY + scanH && y < height; y++) {
    for (let x = scanX; x < scanX + scanW && x < width; x++) {
      const sprite = findSprite(x, y);
      if (sprite) sprites.push(sprite);
    }
  }

  let result = sprites;
  if (mergeTolerance > 0) {
    result = mergeNearby(result, mergeTolerance);
  }

  result.sort((a, b) => a.y - b.y || a.x - b.x);
  result.forEach((s, i) => {
    s.label = `sprite-${i + 1}`;
  });

  return result;
}

function mergeNearby(sprites: SpritesheetBox[], tolerance: number): SpritesheetBox[] {
  const working = sprites.map((s) => ({ ...s }));
  const merged = new Set<number>();
  const result: SpritesheetBox[] = [];

  for (let i = 0; i < working.length; i++) {
    if (merged.has(i)) continue;

    let current = { ...working[i] };
    let didMerge = true;

    while (didMerge) {
      didMerge = false;
      for (let j = 0; j < working.length; j++) {
        if (merged.has(j) || j === i) continue;
        const other = working[j];

        const overlaps =
          current.x <= other.x + other.width &&
          current.x + current.width >= other.x &&
          current.y <= other.y + other.height &&
          current.y + current.height >= other.y;

        const close =
          !overlaps &&
          Math.abs(current.x + current.width - other.x) <= tolerance &&
          current.y <= other.y + other.height &&
          current.y + current.height >= other.y;

        if (overlaps || close) {
          const newX = Math.min(current.x, other.x);
          const newY = Math.min(current.y, other.y);
          current = {
            ...current,
            x: newX,
            y: newY,
            width: Math.max(current.x + current.width, other.x + other.width) - newX,
            height: Math.max(current.y + current.height, other.y + other.height) - newY,
          };
          merged.add(j);
          didMerge = true;
        }
      }
    }

    result.push(current);
  }

  return result;
}
