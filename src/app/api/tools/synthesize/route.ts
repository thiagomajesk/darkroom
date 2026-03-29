import { mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";

import { getImage, createGeneratedImage } from "@/lib/images";
import { getStorageDirectory } from "@/lib/storage";
import { grayscale, colorshift, pixelate, svgTrace } from "@/../cli";

type RequestBody = {
  imageId?: string;
  mode?: string;
  options?: {
    intensity?: number;
    hue?: number;
    pixelAmount?: number;
    detail?: string;
  };
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;

  if (!body.imageId || !body.mode) {
    return NextResponse.json(
      { error: "Missing imageId or mode." },
      { status: 400 },
    );
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const outputDir = `${getStorageDirectory()}/synthesize`;
  await mkdir(outputDir, { recursive: true });

  const isSvg = body.mode === "svg";
  const extension = isSvg ? "svg" : "png";
  const outputFilename = `${body.imageId}-${body.mode}.${extension}`;
  const outputPath = `${outputDir}/${outputFilename}`;

  try {
    switch (body.mode) {
      case "grayscale": {
        const intensity = body.options?.intensity ?? 100;
        await grayscale(image.filePath, outputPath, intensity);
        break;
      }
      case "colorshift": {
        const hue = body.options?.hue ?? 0;
        await colorshift(image.filePath, outputPath, hue);
        break;
      }
      case "pixelate": {
        const pixelAmount = body.options?.pixelAmount ?? 30;
        await pixelate(image.filePath, outputPath, pixelAmount);
        break;
      }
      case "svg": {
        const detail = (body.options?.detail ?? "medium") as
          | "low"
          | "medium"
          | "high";
        await svgTrace(image.filePath, outputPath, detail);
        break;
      }
      default: {
        return NextResponse.json(
          { error: `Unknown mode: ${body.mode}` },
          { status: 400 },
        );
      }
    }

    const mimeType = isSvg ? "image/svg+xml" : "image/png";
    const originalName = `${image.originalName.replace(/\.[^.]+$/, "")}-${body.mode}.${extension}`;

    const generatedImage = await createGeneratedImage({
      filePath: outputPath,
      originalName,
      mimeType,
      metadata: {
        tool: "synthesize",
        sourceImageId: body.imageId,
        params: { mode: body.mode, options: body.options ?? {} },
      },
    });

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
