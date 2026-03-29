import sharp from "sharp";

/**
 * Pixelate an image by a percentage (0 = no effect, 100 = maximum pixelation).
 * The percentage maps to how much detail to remove: at 100% the image is
 * reduced to roughly 4-8 pixels on its shortest side before being scaled back up.
 */
export async function pixelate(
  inputPath: string,
  outputPath: string,
  percent: number,
): Promise<void> {
  const metadata = await sharp(inputPath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Unable to determine image dimensions.");
  }

  // Clamp to 1-100
  const p = Math.max(1, Math.min(100, percent));

  // Map percentage to a scale factor:
  // 1% → keep ~95% of detail (barely visible)
  // 50% → keep ~30% of detail (moderate)
  // 100% → keep ~8% of detail (heavy but still recognizable)
  const minKeep = 0.08; // At 100%, keep at least 8% of the smallest dimension
  const maxKeep = 0.95; // At 1%, keep 95%
  const keepFraction = maxKeep - (maxKeep - minKeep) * Math.pow(p / 100, 1.5);
  const minDim = Math.min(metadata.width, metadata.height);
  const targetSmallDim = Math.max(16, Math.round(minDim * keepFraction));
  const scale = targetSmallDim / minDim;

  const smallWidth = Math.max(1, Math.round(metadata.width * scale));
  const smallHeight = Math.max(1, Math.round(metadata.height * scale));

  const small = await sharp(inputPath)
    .resize(smallWidth, smallHeight, { kernel: "nearest" })
    .toBuffer();

  await sharp(small)
    .resize(metadata.width, metadata.height, { kernel: "nearest" })
    .toFile(outputPath);
}
