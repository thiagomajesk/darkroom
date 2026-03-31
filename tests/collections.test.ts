import { describe, it, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";

import { ensureSchema, getDatabase, resetDatabaseForTests } from "../src/lib/database";
import { images } from "../src/lib/schema";
import {
  listCollections,
  getCollection,
  createCollection,
  renameCollection,
  deleteCollection,
  addImageToCollection,
  removeImageFromCollection,
  listCollectionImages,
  getCollectionCountForImage,
} from "../src/lib/collections";

function clearTables() {
  const db = getDatabase();
  db.run(sql`DELETE FROM collection_images`);
  db.run(sql`DELETE FROM images`);
  db.run(sql`DELETE FROM collections`);
}

function insertTestImage(id: string) {
  const db = getDatabase();
  db.insert(images).values({
    id,
    sourceType: "upload",
    originalName: `${id}.png`,
    mimeType: "image/png",
    filePath: `/tmp/${id}.png`,
    width: 100,
    height: 100,
    metadataJson: "{}",
    createdAt: new Date().toISOString(),
  }).run();
}

describe("collections data layer", () => {
  before(async () => {
    resetDatabaseForTests();
    await ensureSchema();
  });

  beforeEach(() => {
    clearTables();
  });

  it("listCollections returns empty array initially", () => {
    assert.deepEqual(listCollections(), []);
  });

  it("createCollection creates and returns a collection", () => {
    const col = createCollection("My Collection");
    assert.ok(col.id);
    assert.equal(col.name, "My Collection");
    assert.ok(col.createdAt);
    assert.ok(col.updatedAt);
  });

  it("listCollections returns collections ordered by name", () => {
    createCollection("Zebra");
    createCollection("Alpha");

    const result = listCollections();
    assert.equal(result.length, 2);
    assert.equal(result[0].name, "Alpha");
    assert.equal(result[1].name, "Zebra");
  });

  it("getCollection returns null for nonexistent ID", () => {
    assert.equal(getCollection("nonexistent"), null);
  });

  it("getCollection returns the correct collection", () => {
    const col = createCollection("Test");
    const found = getCollection(col.id);
    assert.ok(found);
    assert.equal(found.name, "Test");
  });

  it("renameCollection updates the name", () => {
    const col = createCollection("Old Name");
    const updated = renameCollection(col.id, "New Name");
    assert.ok(updated);
    assert.equal(updated.name, "New Name");
  });

  it("deleteCollection removes the collection", () => {
    const col = createCollection("To Delete");
    assert.ok(getCollection(col.id));

    deleteCollection(col.id);
    assert.equal(getCollection(col.id), null);
  });

  it("addImageToCollection and listCollectionImages", () => {
    const col = createCollection("Sprites");
    insertTestImage("img-a");
    insertTestImage("img-b");

    addImageToCollection(col.id, "img-a");
    addImageToCollection(col.id, "img-b");

    const result = listCollectionImages(col.id);
    assert.equal(result.length, 2);
    const ids = result.map((r) => r.id);
    assert.ok(ids.includes("img-a"));
    assert.ok(ids.includes("img-b"));
  });

  it("addImageToCollection is idempotent", () => {
    const col = createCollection("Dupes");
    insertTestImage("img-dup");

    addImageToCollection(col.id, "img-dup");
    addImageToCollection(col.id, "img-dup");

    const result = listCollectionImages(col.id);
    assert.equal(result.length, 1);
  });

  it("removeImageFromCollection removes the link", () => {
    const col = createCollection("Remove Test");
    insertTestImage("img-rem");

    addImageToCollection(col.id, "img-rem");
    assert.equal(listCollectionImages(col.id).length, 1);

    removeImageFromCollection(col.id, "img-rem");
    assert.equal(listCollectionImages(col.id).length, 0);
  });

  it("getCollectionCountForImage returns correct count", () => {
    const col1 = createCollection("Col 1");
    const col2 = createCollection("Col 2");
    insertTestImage("img-count");

    assert.equal(getCollectionCountForImage("img-count"), 0);

    addImageToCollection(col1.id, "img-count");
    assert.equal(getCollectionCountForImage("img-count"), 1);

    addImageToCollection(col2.id, "img-count");
    assert.equal(getCollectionCountForImage("img-count"), 2);
  });
});
