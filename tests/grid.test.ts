import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { computeBoxesFromGrid } from "../src/lib/tools/grid";
import type { GridParams } from "../src/lib/types";

function makeGrid(overrides: Partial<GridParams> = {}): GridParams {
  return {
    rows: 2,
    cols: 2,
    offsetX: 0,
    offsetY: 0,
    cellWidth: 50,
    cellHeight: 50,
    paddingX: 0,
    paddingY: 0,
    ...overrides,
  };
}

describe("computeBoxesFromGrid", () => {
  it("should produce the correct number of boxes for a 2x2 grid", () => {
    const boxes = computeBoxesFromGrid(makeGrid(), 100, 100);
    assert.equal(boxes.length, 4);
  });

  it("should compute correct positions for a 2x2 grid", () => {
    const boxes = computeBoxesFromGrid(makeGrid(), 100, 100);
    assert.equal(boxes[0].x, 0);
    assert.equal(boxes[0].y, 0);
    assert.equal(boxes[1].x, 50);
    assert.equal(boxes[1].y, 0);
    assert.equal(boxes[2].x, 0);
    assert.equal(boxes[2].y, 50);
    assert.equal(boxes[3].x, 50);
    assert.equal(boxes[3].y, 50);
  });

  it("should apply offset correctly", () => {
    const grid = makeGrid({ offsetX: 10, offsetY: 20, cellWidth: 40, cellHeight: 30 });
    const boxes = computeBoxesFromGrid(grid, 100, 100);
    assert.equal(boxes[0].x, 10);
    assert.equal(boxes[0].y, 20);
  });

  it("should apply padding (gap) between cells", () => {
    const grid = makeGrid({ paddingX: 5, paddingY: 5, cellWidth: 45, cellHeight: 45 });
    const boxes = computeBoxesFromGrid(grid, 100, 100);
    // Second column: 0 + 1 * (45 + 5) = 50
    assert.equal(boxes[1].x, 50);
    // Second row: 0 + 1 * (45 + 5) = 50
    assert.equal(boxes[2].y, 50);
  });

  it("should clip boxes that exceed image bounds", () => {
    // Grid where second row would go out of bounds
    const grid = makeGrid({ rows: 3, cols: 1, cellWidth: 100, cellHeight: 40 });
    const boxes = computeBoxesFromGrid(grid, 100, 100);
    // Row 0: y=0, y+h=40 <= 100 OK
    // Row 1: y=40, y+h=80 <= 100 OK
    // Row 2: y=80, y+h=120 > 100 — clipped out
    assert.equal(boxes.length, 2);
  });

  it("should generate unique IDs for each box", () => {
    const boxes = computeBoxesFromGrid(makeGrid(), 100, 100);
    const ids = boxes.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("should generate sequential labels", () => {
    const boxes = computeBoxesFromGrid(makeGrid(), 100, 100);
    assert.equal(boxes[0].label, "sprite-1");
    assert.equal(boxes[1].label, "sprite-2");
    assert.equal(boxes[2].label, "sprite-3");
    assert.equal(boxes[3].label, "sprite-4");
  });

  it("should return empty array for zero rows", () => {
    const grid = makeGrid({ rows: 0 });
    const boxes = computeBoxesFromGrid(grid, 100, 100);
    assert.equal(boxes.length, 0);
  });
});
