import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

import { desc, eq } from "drizzle-orm";
import sharp from "sharp";

import { getDatabase } from "@/lib/database";
import { images, collectionImages } from "@/lib/schema";
import { ensureStorageDirectories, getImageFilePath } from "@/lib/storage";
import type { ImageRecord, ImageSourceType } from "@/lib/types";

function toRecord(row: typeof images.$inferSelect): ImageRecord {
  return {
    id: row.id,
    sourceType: row.sourceType as ImageSourceType,
    originalName: row.originalName,
    mimeType: row.mimeType,
    filePath: row.filePath,
    width: row.width,
    height: row.height,
    metadata: JSON.parse(row.metadataJson),
    createdAt: row.createdAt,
  };
}

export function normalizeExtension(name: string, mimeType: string) {
  const cleanName = name.split("?")[0].split("#")[0];
  const extension = extname(cleanName).replace(".", "").toLowerCase();

  if (extension) {
    return extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "png";
}

async function insertImage(params: {
  id: string;
  sourceType: ImageSourceType;
  originalName: string;
  mimeType: string;
  filePath: string;
  width: number;
  height: number;
  metadata?: Record<string, unknown>;
}) {
  const db = getDatabase();

  db.insert(images).values({
    id: params.id,
    sourceType: params.sourceType,
    originalName: params.originalName,
    mimeType: params.mimeType,
    filePath: params.filePath,
    width: params.width,
    height: params.height,
    metadataJson: JSON.stringify(params.metadata ?? {}),
    createdAt: new Date().toISOString(),
  }).run();

  const image = getImage(params.id);

  if (!image) {
    throw new Error("Failed to load inserted image.");
  }

  return image;
}

export function listImages() {
  const db = getDatabase();
  const rows = db.select().from(images).orderBy(desc(images.createdAt)).all();
  return rows.map(toRecord);
}

export function getImage(imageId: string) {
  const db = getDatabase();
  const row = db.select().from(images).where(eq(images.id, imageId)).get();
  return row ? toRecord(row) : null;
}

export async function createImageFromBuffer(params: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sourceType: ImageSourceType;
  metadata?: Record<string, unknown>;
}) {
  await ensureStorageDirectories();

  const imageId = crypto.randomUUID();
  const extension = normalizeExtension(params.originalName, params.mimeType);
  const filePath = getImageFilePath(imageId, extension);
  const img = sharp(params.buffer);
  const metadata = await img.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to determine image dimensions.");
  }

  await writeFile(filePath, params.buffer);

  return insertImage({
    id: imageId,
    sourceType: params.sourceType,
    originalName: params.originalName,
    mimeType: params.mimeType,
    filePath,
    width: metadata.width,
    height: metadata.height,
    metadata: params.metadata,
  });
}

export async function createGeneratedImage(params: {
  filePath: string;
  originalName: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}) {
  const fileBuffer = await readFile(params.filePath);
  const img = sharp(fileBuffer);
  const metadata = await img.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to determine generated image dimensions.");
  }

  return insertImage({
    id: crypto.randomUUID(),
    sourceType: "generated",
    originalName: params.originalName,
    mimeType: params.mimeType ?? "image/png",
    filePath: params.filePath,
    width: metadata.width,
    height: metadata.height,
    metadata: params.metadata,
  });
}

export function deleteImage(imageId: string): void {
  const { unlinkSync } = require("node:fs");
  const db = getDatabase();
  const image = getImage(imageId);

  if (image) {
    try {
      unlinkSync(image.filePath);
    } catch {
      // File may already be missing — continue with DB cleanup
    }
  }

  db.delete(collectionImages).where(eq(collectionImages.imageId, imageId)).run();
  db.delete(images).where(eq(images.id, imageId)).run();
}

export async function replaceImage(
  targetImageId: string,
  sourceImageId: string,
) {
  const target = getImage(targetImageId);
  const source = getImage(sourceImageId);

  if (!target) throw new Error("Target image not found.");
  if (!source) throw new Error("Source image not found.");

  const { copyFileSync, unlinkSync } = require("node:fs");

  copyFileSync(source.filePath, target.filePath);

  const fileBuffer = await readFile(target.filePath);
  const img = sharp(fileBuffer);
  const metadata = await img.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to determine replacement image dimensions.");
  }

  const db = getDatabase();

  db.update(images)
    .set({ width: metadata.width, height: metadata.height })
    .where(eq(images.id, targetImageId))
    .run();

  // Delete the source image (file + DB rows)
  try {
    unlinkSync(source.filePath);
  } catch {
    // File may already be missing
  }

  db.delete(collectionImages).where(eq(collectionImages.imageId, sourceImageId)).run();
  db.delete(images).where(eq(images.id, sourceImageId)).run();

  return getImage(targetImageId)!;
}

export async function createImageFromUrl(url: string, extraMetadata?: Record<string, unknown>) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download image: ${response.status}`);
  }

  const mimeType = response.headers.get("content-type") ?? "image/png";

  if (!mimeType.startsWith("image/")) {
    throw new Error("The provided URL did not return an image.");
  }

  const originalName = url.split("/").pop() || "remote-image";
  const buffer = Buffer.from(await response.arrayBuffer());

  return createImageFromBuffer({
    buffer,
    originalName,
    mimeType,
    sourceType: "url",
    metadata: { sourceUrl: url, ...extraMetadata },
  });
}
