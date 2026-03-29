import sharp from "sharp";

export async function removeWatermark(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  await sharp(inputPath)
    .median(5)
    .modulate({ brightness: 1.02 })
    .sharpen({ sigma: 1 })
    .png()
    .toFile(outputPath);
}
