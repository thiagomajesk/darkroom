import { mkdir } from "node:fs/promises";
import { join } from "node:path";

import sharp from "sharp";

import type { SpritesheetBox } from "../../../src/lib/types";

export async function extractSpritesCli(
  input: string,
  outputDirectory: string,
  boxes: SpritesheetBox[],
) {
  await mkdir(outputDirectory, { recursive: true });

  const outputs = await Promise.all(
    boxes.map(async (box, index) => {
      const outputPath = join(outputDirectory, `sprite-${index + 1}.png`);

      await sharp(input)
        .extract({
          left: Math.round(box.x),
          top: Math.round(box.y),
          width: Math.round(box.width),
          height: Math.round(box.height),
        })
        .png()
        .toFile(outputPath);

      return {
        outputPath,
        width: Math.round(box.width),
        height: Math.round(box.height),
        box,
      };
    }),
  );

  const result = { outputs };
  console.log(JSON.stringify(result));
  return result;
}
