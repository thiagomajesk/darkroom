import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { getImagePublicUrl } from "../src/lib/utils";

describe("getImagePublicUrl", () => {
  it("returns the content endpoint path for an image ID", () => {
    assert.equal(getImagePublicUrl("abc-123"), "/api/images/abc-123/content");
  });

  it("works with UUID-style IDs", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    assert.equal(getImagePublicUrl(id), `/api/images/${id}/content`);
  });
});
