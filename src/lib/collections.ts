import { asc, count, desc, eq, and } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import { collections, collectionImages, images } from "@/lib/schema";
import type { ImageRecord, ImageSourceType, CollectionRecord } from "@/lib/types";

function toCollectionRecord(row: typeof collections.$inferSelect): CollectionRecord {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function listCollections(): CollectionRecord[] {
  const db = getDatabase();
  return db.select().from(collections).orderBy(asc(collections.name)).all().map(toCollectionRecord);
}

export function getCollection(id: string): CollectionRecord | null {
  const db = getDatabase();
  const row = db.select().from(collections).where(eq(collections.id, id)).get();
  return row ? toCollectionRecord(row) : null;
}

export function createCollection(name: string): CollectionRecord {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.insert(collections).values({ id, name, createdAt: now, updatedAt: now }).run();

  return { id, name, createdAt: now, updatedAt: now };
}

export function renameCollection(id: string, name: string): CollectionRecord | null {
  const db = getDatabase();
  const now = new Date().toISOString();

  db.update(collections)
    .set({ name, updatedAt: now })
    .where(eq(collections.id, id))
    .run();

  return getCollection(id);
}

export function deleteCollection(id: string): void {
  const db = getDatabase();
  db.delete(collections).where(eq(collections.id, id)).run();
}

export function addImageToCollection(collectionId: string, imageId: string): void {
  const db = getDatabase();
  db.insert(collectionImages)
    .values({ collectionId, imageId })
    .onConflictDoNothing()
    .run();
}

export function removeImageFromCollection(collectionId: string, imageId: string): void {
  const db = getDatabase();
  db.delete(collectionImages)
    .where(and(eq(collectionImages.collectionId, collectionId), eq(collectionImages.imageId, imageId)))
    .run();
}

export function listCollectionImages(collectionId: string): ImageRecord[] {
  const db = getDatabase();
  const rows = db
    .select({
      id: images.id,
      sourceType: images.sourceType,
      originalName: images.originalName,
      mimeType: images.mimeType,
      filePath: images.filePath,
      width: images.width,
      height: images.height,
      metadataJson: images.metadataJson,
      createdAt: images.createdAt,
    })
    .from(images)
    .innerJoin(collectionImages, eq(collectionImages.imageId, images.id))
    .where(eq(collectionImages.collectionId, collectionId))
    .orderBy(desc(collectionImages.addedAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    sourceType: row.sourceType as ImageSourceType,
    originalName: row.originalName,
    mimeType: row.mimeType,
    filePath: row.filePath,
    width: row.width,
    height: row.height,
    metadata: JSON.parse(row.metadataJson),
    createdAt: row.createdAt,
  }));
}

export function getCollectionCountForImage(imageId: string): number {
  const db = getDatabase();
  const row = db
    .select({ value: count() })
    .from(collectionImages)
    .where(eq(collectionImages.imageId, imageId))
    .get();

  return row?.value ?? 0;
}
