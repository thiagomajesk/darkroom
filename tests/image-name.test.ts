import { describe, it } from "node:test";
import assert from "node:assert/strict";

/**
 * Utility extracted from route handlers to strip the file extension from an
 * image's original name before appending a suffix.  Keeping it pure makes it
 * easy to unit-test without spinning up a Next.js server.
 */
function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

describe("image name generation — extension stripping", () => {
  it("strips .png extension before appending upscale suffix", () => {
    const originalName = "icon.png";
    const scaleFactor = 4;
    const result = `${stripExtension(originalName)}-${scaleFactor}x.png`;
    assert.equal(result, "icon-4x.png");
  });

  it("strips .jpg extension before appending synthesize suffix", () => {
    const originalName = "photo.jpg";
    const mode = "grayscale";
    const extension = "png";
    const result = `${stripExtension(originalName)}-${mode}.${extension}`;
    assert.equal(result, "photo-grayscale.png");
  });

  it("leaves names without an extension unchanged", () => {
    const originalName = "no-ext";
    const scaleFactor = 4;
    const result = `${stripExtension(originalName)}-${scaleFactor}x.png`;
    assert.equal(result, "no-ext-4x.png");
  });

  it("does not produce double extensions (regression: icon.png-4x.png)", () => {
    const originalName = "icon.png";
    const scaleFactor = 4;
    const result = `${stripExtension(originalName)}-${scaleFactor}x.png`;
    assert.notEqual(result, "icon.png-4x.png", "double extension must not appear");
  });
});
