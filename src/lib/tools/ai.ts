import { existsSync } from "node:fs";
import { join } from "node:path";
import { arch, platform } from "node:os";

import { Codex } from "@openai/codex-sdk";
import sharp from "sharp";

import type { GridParams, ImageClassification, SpritesheetBox } from "@/lib/types";

function findCodexBinary(): string | undefined {
  const os = platform();
  const cpu = arch();
  const platformMap: Record<string, string> = {
    "linux-x64": "x86_64-unknown-linux-musl",
    "linux-arm64": "aarch64-unknown-linux-musl",
    "darwin-x64": "x86_64-apple-darwin",
    "darwin-arm64": "aarch64-apple-darwin",
  };
  const target = platformMap[`${os}-${cpu}`];
  if (!target) return undefined;

  const path = join(
    process.cwd(),
    "node_modules",
    `@openai/codex-${os}-${cpu}`,
    "vendor",
    target,
    "codex",
    "codex",
  );
  return existsSync(path) ? path : undefined;
}

function getCodexThread() {
  const codex = new Codex({ codexPathOverride: findCodexBinary() });
  return codex.startThread({
    model: "gpt-5.4-mini",
    approvalPolicy: "never",
    sandboxMode: "read-only",
    modelReasoningEffort: "medium",
  });
}

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const jsonObj = text.match(/\{[\s\S]*\}/);
  if (jsonObj) return jsonObj[0];

  return text;
}

function clampBox(box: SpritesheetBox, width: number, height: number): SpritesheetBox {
  const x = Math.max(0, Math.min(Math.round(box.x), width - 1));
  const y = Math.max(0, Math.min(Math.round(box.y), height - 1));
  const clampedWidth = Math.max(1, Math.min(Math.round(box.width), width - x));
  const clampedHeight = Math.max(1, Math.min(Math.round(box.height), height - y));
  return { ...box, x, y, width: clampedWidth, height: clampedHeight };
}

export function parseGridResult(finalResponse: string): GridParams {
  const json = extractJson(finalResponse);
  return JSON.parse(json) as GridParams;
}

export function getSpritesheetPrompt(width: number, height: number): string {
  return `This is a spritesheet image (${width}px wide, ${height}px tall) containing a grid of individual sprites/icons.

Analyze the grid structure and return ONLY a JSON object (no other text):
{"rows": 10, "cols": 10, "offsetX": 5, "offsetY": 50, "cellWidth": 56, "cellHeight": 56, "paddingX": 2, "paddingY": 2}

- rows/cols: number of sprite rows and columns
- offsetX/offsetY: pixel position of the TOP-LEFT corner of the FIRST sprite (not the image edge)
- cellWidth/cellHeight: size of each individual sprite artwork (NOT including padding/gaps)
- paddingX/paddingY: gap in pixels between adjacent sprites

Measure carefully by looking at actual pixel boundaries. The offset should point exactly where the first sprite's artwork begins.`;
}

export async function getImageDimensions(imagePath: string) {
  const metadata = await sharp(imagePath).metadata();
  return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
}

export async function runStreamedCodex(
  prompt: string,
  imagePath: string,
  onEvent: (event: { type: string; text?: string }) => void,
): Promise<string> {
  const thread = getCodexThread();
  const streamed = await thread.runStreamed([
    { type: "text", text: prompt },
    { type: "local_image", path: imagePath },
  ]);

  let finalResponse = "";

  for await (const event of streamed.events) {
    if (event.type === "item.completed") {
      const item = event.item;
      const text = "text" in item ? (item.text as string) : undefined;
      onEvent({ type: item.type, text });
      if (item.type === "agent_message" && text) {
        finalResponse = text;
      }
    }
  }

  return finalResponse;
}

export async function classifyImage(imagePath: string) {
  const thread = getCodexThread();
  const turn = await thread.run([
    {
      type: "text",
      text: `Analyze this image in detail for a local image library. Return ONLY a JSON object:

{
  "objectDescription": "...",
  "artStyleDescription": "...",
  "tags": ["tag1", "tag2"],
  "reproductionPrompt": "..."
}

Rules:
- objectDescription: Describe the subject/object in thorough detail — what it is, its pose/position, colors, materials, textures, lighting, background elements, composition, and any notable features. Be specific enough that someone could understand exactly what the image depicts without seeing it.
- artStyleDescription: Describe the art style in thorough detail — technique (digital painting, pixel art, vector, photo, etc.), rendering style, line work, shading approach, color palette characteristics, level of detail, influences, and visual mood/atmosphere.
- tags: 5-15 searchable tags covering subject matter, art style, color palette, mood, use case.
- reproductionPrompt: Write an extremely detailed prompt (3-5 sentences) that could be given to an AI image generator (like DALL-E or Stable Diffusion) to reproduce this exact image as faithfully as possible. The prompt must be comprehensive and self-contained — it should describe BOTH the subject/object in full detail AND the art style, rendering technique, color palette, lighting, composition, mood, and any other visual qualities. Someone reading only this prompt should be able to recreate the image without seeing the original.`,
    },
    { type: "local_image", path: imagePath },
  ]);

  const threadItems = turn.items.map((item) => ({
    type: item.type,
    text: "text" in item ? (item.text as string) : undefined,
    id: item.id,
  }));

  const json = extractJson(turn.finalResponse);
  const parsed = JSON.parse(json) as ImageClassification;

  return { ...parsed, thread: threadItems };
}
