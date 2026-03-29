import { copyFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, rmdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { eq } from "drizzle-orm";

import { ensureSchema, getDatabase } from "@/lib/database";
import { images } from "@/lib/schema";
import { getResolvedStoragePath } from "@/lib/settings";

export const dataDirectory = join(process.cwd(), "data");

export function getStorageDirectory() {
  return getResolvedStoragePath();
}

export async function ensureStorageDirectories() {
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(getStorageDirectory(), { recursive: true });
  await ensureSchema();
}

export function getDatabasePath() {
  return join(dataDirectory, "darkroom.db");
}

export function getImageFilePath(imageId: string, extension: string) {
  return join(getStorageDirectory(), `${imageId}.${extension}`);
}

export function migrateStorage(oldPath: string, newPath: string): { moved: number; errors: string[] } {
  if (oldPath === newPath) {
    return { moved: 0, errors: [] };
  }

  mkdirSync(newPath, { recursive: true });

  const db = getDatabase();
  const rows = db.select({ id: images.id, filePath: images.filePath }).from(images).all();

  let moved = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.filePath.startsWith(oldPath)) {
      continue;
    }

    const relativePath = row.filePath.slice(oldPath.length);
    const newFilePath = join(newPath, relativePath);

    try {
      if (!existsSync(row.filePath)) {
        errors.push(`File not found: ${row.filePath}`);
        continue;
      }

      mkdirSync(dirname(newFilePath), { recursive: true });
      copyFileSync(row.filePath, newFilePath);
      unlinkSync(row.filePath);

      db.update(images)
        .set({ filePath: newFilePath })
        .where(eq(images.id, row.id))
        .run();

      moved++;
    } catch (err) {
      errors.push(
        `Failed to move ${row.filePath}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  try {
    if (existsSync(oldPath) && readdirSync(oldPath).length === 0) {
      rmdirSync(oldPath);
    }
  } catch {
    // Ignore cleanup errors
  }

  return { moved, errors };
}
