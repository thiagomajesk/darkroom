import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";

import { ensureSchema, getDatabase, resetDatabaseForTests } from "../src/lib/database";
import { listImages, getImage, deleteImage } from "../src/lib/images";
import { images } from "../src/lib/schema";

const STORAGE_DIR = join(process.cwd(), "storage");

function clearTables() {
  const db = getDatabase();
  db.run(sql`DELETE FROM collection_images`);
  db.run(sql`DELETE FROM images`);
  db.run(sql`DELETE FROM collections`);
}

function insertTestImage(id: string, name = "test.png") {
  const db = getDatabase();
  const filePath = join(STORAGE_DIR, `${id}.png`);

  mkdirSync(STORAGE_DIR, { recursive: true });
  writeFileSync(filePath, Buffer.alloc(0));

  db.insert(images).values({
    id,
    sourceType: "upload",
    originalName: name,
    mimeType: "image/png",
    filePath,
    width: 100,
    height: 100,
    metadataJson: "{}",
    createdAt: new Date().toISOString(),
  }).run();

  return id;
}

describe("images data layer", () => {
  before(async () => {
    resetDatabaseForTests();
    await ensureSchema();
  });

  beforeEach(() => {
    clearTables();
  });

  it("listImages returns empty array when no images exist", () => {
    const result = listImages();
    assert.deepEqual(result, []);
  });

  it("listImages returns inserted images ordered by createdAt desc", () => {
    const db = getDatabase();

    db.insert(images).values({
      id: "older",
      sourceType: "upload",
      originalName: "old.png",
      mimeType: "image/png",
      filePath: "/tmp/old.png",
      width: 10,
      height: 10,
      metadataJson: "{}",
      createdAt: "2024-01-01T00:00:00.000Z",
    }).run();

    db.insert(images).values({
      id: "newer",
      sourceType: "upload",
      originalName: "new.png",
      mimeType: "image/png",
      filePath: "/tmp/new.png",
      width: 20,
      height: 20,
      metadataJson: "{}",
      createdAt: "2025-01-01T00:00:00.000Z",
    }).run();

    const result = listImages();
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "newer");
    assert.equal(result[1].id, "older");
  });

  it("getImage returns null for nonexistent ID", () => {
    assert.equal(getImage("nonexistent"), null);
  });

  it("getImage returns the correct image record", () => {
    insertTestImage("img-1", "hello.png");
    const image = getImage("img-1");

    assert.ok(image);
    assert.equal(image.id, "img-1");
    assert.equal(image.originalName, "hello.png");
    assert.equal(image.sourceType, "upload");
    assert.equal(image.width, 100);
    assert.equal(image.height, 100);
  });

  it("getImage parses metadata JSON", () => {
    const db = getDatabase();
    db.insert(images).values({
      id: "with-meta",
      sourceType: "generated",
      originalName: "gen.png",
      mimeType: "image/png",
      filePath: "/tmp/gen.png",
      width: 50,
      height: 50,
      metadataJson: JSON.stringify({ tool: "crop", sourceImageId: "abc" }),
      createdAt: new Date().toISOString(),
    }).run();

    const image = getImage("with-meta");
    assert.ok(image);
    assert.equal(image.metadata.tool, "crop");
    assert.equal(image.metadata.sourceImageId, "abc");
  });

  it("deleteImage removes the image from the database", () => {
    insertTestImage("to-delete");
    assert.ok(getImage("to-delete"));

    deleteImage("to-delete");
    assert.equal(getImage("to-delete"), null);
  });

  it("deleteImage is a no-op for nonexistent IDs", () => {
    assert.doesNotThrow(() => deleteImage("nonexistent"));
  });
});
