import sharp from "sharp";

export async function colorshift(
  inputPath: string,
  outputPath: string,
  hueShift: number,
): Promise<void> {
  await sharp(inputPath).modulate({ hue: hueShift }).toFile(outputPath);
}
