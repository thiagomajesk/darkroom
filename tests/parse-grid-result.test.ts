import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseGridResult } from "../src/lib/tools/parse";

describe("parseGridResult", () => {
  it("parses a fenced JSON response into GridParams", () => {
    const input = '```json\n{"rows": 4, "cols": 8, "offsetX": 5, "offsetY": 10, "cellWidth": 32, "cellHeight": 32, "paddingX": 2, "paddingY": 2}\n```';
    const result = parseGridResult(input);
    assert.equal(result.rows, 4);
    assert.equal(result.cols, 8);
    assert.equal(result.offsetX, 5);
    assert.equal(result.offsetY, 10);
    assert.equal(result.cellWidth, 32);
    assert.equal(result.cellHeight, 32);
    assert.equal(result.paddingX, 2);
    assert.equal(result.paddingY, 2);
  });

  it("parses a raw JSON response", () => {
    const input = '{"rows": 2, "cols": 2, "offsetX": 0, "offsetY": 0, "cellWidth": 50, "cellHeight": 50, "paddingX": 0, "paddingY": 0}';
    const result = parseGridResult(input);
    assert.equal(result.rows, 2);
    assert.equal(result.cols, 2);
  });

  it("parses JSON embedded in surrounding text", () => {
    const input = 'Here is the grid: {"rows": 3, "cols": 3, "offsetX": 0, "offsetY": 0, "cellWidth": 64, "cellHeight": 64, "paddingX": 1, "paddingY": 1} done.';
    const result = parseGridResult(input);
    assert.equal(result.rows, 3);
    assert.equal(result.cellWidth, 64);
  });

  it("throws on invalid JSON", () => {
    assert.throws(() => parseGridResult("not json at all"));
  });
});
