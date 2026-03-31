import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { extractJson } from "../src/lib/tools/parse";

describe("extractJson", () => {
  it("extracts JSON from a fenced code block", () => {
    const input = '```json\n{"rows": 2, "cols": 3}\n```';
    assert.equal(extractJson(input), '{"rows": 2, "cols": 3}');
  });

  it("extracts JSON from a fenced block without language tag", () => {
    const input = '```\n{"key": "value"}\n```';
    assert.equal(extractJson(input), '{"key": "value"}');
  });

  it("extracts a raw JSON object from surrounding text", () => {
    const input = 'Here is the result: {"rows": 4, "cols": 4} as requested.';
    assert.equal(extractJson(input), '{"rows": 4, "cols": 4}');
  });

  it("returns the full text when no JSON is found", () => {
    const input = "no json here";
    assert.equal(extractJson(input), "no json here");
  });

  it("handles multiline JSON in fenced blocks", () => {
    const input = '```json\n{\n  "a": 1,\n  "b": 2\n}\n```';
    const result = extractJson(input);
    const parsed = JSON.parse(result);
    assert.deepEqual(parsed, { a: 1, b: 2 });
  });

  it("prefers fenced block over raw JSON object", () => {
    const input = 'before {"stray": true} ```json\n{"real": true}\n``` after';
    assert.equal(extractJson(input), '{"real": true}');
  });
});
