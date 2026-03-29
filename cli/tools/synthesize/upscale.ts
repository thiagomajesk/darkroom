import sharp from "sharp";

export async function upscale(
  inputPath: string,
  outputPath: string,
  factor: number,
): Promise<void> {
  const meta = await sharp(inputPath).metadata();
  const w = (meta.width ?? 1) * factor;
  const h = (meta.height ?? 1) * factor;

  await sharp(inputPath)
    .resize(w, h, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.8 })
    .toFile(outputPath);
}
