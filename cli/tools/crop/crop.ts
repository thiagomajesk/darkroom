import sharp from "sharp";

export async function cropImage(
  inputPath: string,
  outputPath: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  await sharp(inputPath)
    .extract({
      left: Math.round(x),
      top: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    })
    .toFile(outputPath);
}
