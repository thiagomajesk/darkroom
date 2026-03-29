import { execSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import sharp from "sharp";

import type { ImageClassification, SpritesheetBox } from "../../src/lib/types";

const TMP_DIR = join(process.cwd(), "data", "tmp");

async function getImageDimensions(inputPath: string) {
  const metadata = await sharp(inputPath).metadata();
  return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
}

function runCodex(prompt: string, imagePath: string): string {
  mkdirSync(TMP_DIR, { recursive: true });
  const outputFile = join(TMP_DIR, `codex-${Date.now()}.txt`);

  execSync(
    `echo ${JSON.stringify(prompt)} | codex exec --json -c 'model="gpt-5.4-mini"' --output-last-message ${JSON.stringify(outputFile)} --image ${JSON.stringify(imagePath)}`,
    {
      timeout: 180_000,
      shell: "/bin/sh",
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    },
  );

  return readFileSync(outputFile, "utf-8").trim();
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const jsonObj = text.match(/\{[\s\S]*\}/);
  if (jsonObj) return jsonObj[0];

  const jsonArr = text.match(/\[[\s\S]*\]/);
  if (jsonArr) return jsonArr[0];

  return text;
}

function clampBox(box: SpritesheetBox, width: number, height: number): SpritesheetBox {
  const x = Math.max(0, Math.min(Math.round(box.x), width - 1));
  const y = Math.max(0, Math.min(Math.round(box.y), height - 1));
  const clampedWidth = Math.max(1, Math.min(Math.round(box.width), width - x));
  const clampedHeight = Math.max(1, Math.min(Math.round(box.height), height - y));
  return { ...box, x, y, width: clampedWidth, height: clampedHeight };
}

export async function analyzeSpritesheet(inputPath: string) {
  const { width, height } = await getImageDimensions(inputPath);

  const prompt = `Analyze this spritesheet image. It is ${width}px wide and ${height}px tall.

Detect every distinct sprite/icon in the image. Return ONLY a JSON object in this exact format (no other text):

{
  "isSpritesheet": true,
  "notes": "description of what you found",
  "boxes": [
    {"label": "short name", "x": 0, "y": 0, "width": 64, "height": 64}
  ]
}

Rules:
- Return tight bounding boxes in absolute pixels
- Keep labels short and human readable
- If it is a grid of icons, detect EACH individual icon
- If it is a single image (not a spritesheet), return one box covering the full image and set isSpritesheet to false
- Do NOT assume equal divisions - measure the actual sprite boundaries`;

  const raw = runCodex(prompt, inputPath);
  const json = extractJson(raw);
  const parsed = JSON.parse(json) as {
    isSpritesheet: boolean;
    notes: string;
    boxes: Array<{ label: string; x: number; y: number; width: number; height: number }>;
  };

  return {
    isSpritesheet: parsed.isSpritesheet,
    notes: parsed.notes,
    boxes: parsed.boxes.map((box, index) =>
      clampBox(
        {
          id: crypto.randomUUID(),
          label: box.label || `Sprite ${index + 1}`,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        width,
        height,
      ),
    ),
    imageWidth: width,
    imageHeight: height,
  };
}

export async function classifyImage(inputPath: string) {
  const prompt = `Classify this image for a local asset library.

Return ONLY a JSON object in this exact format (no other text):

{
  "objectDescription": "describe the main object or subject in the image",
  "artStyleDescription": "describe the art style, technique, and visual characteristics",
  "tags": ["tag1", "tag2", "tag3"]
}

Rules:
- Be concrete and concise, avoid generic filler
- Tags should be useful for searching and organizing (3 to 12 tags)
- Include tags for: subject matter, art style, color palette, mood`;

  const raw = runCodex(prompt, inputPath);
  const json = extractJson(raw);
  const parsed = JSON.parse(json) as ImageClassification;

  return {
    objectDescription: parsed.objectDescription,
    artStyleDescription: parsed.artStyleDescription,
    tags: parsed.tags,
  };
}
