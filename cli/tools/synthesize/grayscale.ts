import sharp from "sharp";

export async function grayscale(
  inputPath: string,
  outputPath: string,
  intensity = 100,
): Promise<void> {
  if (intensity >= 100) {
    await sharp(inputPath).grayscale().toFile(outputPath);
    return;
  }

  if (intensity <= 0) {
    await sharp(inputPath).toFile(outputPath);
    return;
  }

  // Blend: create grayscale version, then composite with original at reduced opacity
  const original = sharp(inputPath);
  const meta = await original.metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;

  const grayBuffer = await sharp(inputPath).grayscale().toBuffer();
  const originalBuffer = await sharp(inputPath).toBuffer();

  // Composite: gray base + original on top at (100 - intensity)% opacity
  const blendOpacity = Math.round((1 - intensity / 100) * 255);

  await sharp(grayBuffer)
    .resize(w, h)
    .composite([
      {
        input: await sharp(originalBuffer)
          .ensureAlpha(blendOpacity / 255)
          .toBuffer(),
        blend: "over",
      },
    ])
    .toFile(outputPath);
}
