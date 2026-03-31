import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { normalizeExtension } from "../src/lib/images";

describe("normalizeExtension", () => {
  it("extracts extension from a simple filename", () => {
    assert.equal(normalizeExtension("photo.png", "image/png"), "png");
  });

  it("extracts extension from a jpeg filename", () => {
    assert.equal(normalizeExtension("photo.jpg", "image/jpeg"), "jpg");
  });

  it("strips query strings before extracting (regression)", () => {
    assert.equal(normalizeExtension("image.jpg?1738663867", "image/jpeg"), "jpg");
  });

  it("strips fragment identifiers before extracting", () => {
    assert.equal(normalizeExtension("image.webp#section", "image/webp"), "webp");
  });

  it("strips both query string and fragment", () => {
    assert.equal(normalizeExtension("icon.png?v=2#top", "image/png"), "png");
  });

  it("falls back to mime type when no extension is present", () => {
    assert.equal(normalizeExtension("no-ext", "image/png"), "png");
    assert.equal(normalizeExtension("no-ext", "image/jpeg"), "jpg");
    assert.equal(normalizeExtension("no-ext", "image/webp"), "webp");
  });

  it("defaults to png for unknown mime types", () => {
    assert.equal(normalizeExtension("no-ext", "application/octet-stream"), "png");
  });

  it("lowercases the extension", () => {
    assert.equal(normalizeExtension("photo.PNG", "image/png"), "png");
    assert.equal(normalizeExtension("photo.JPG", "image/jpeg"), "jpg");
  });
});
