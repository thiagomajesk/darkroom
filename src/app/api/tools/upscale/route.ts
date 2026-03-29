import { mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";

import { getImage, createGeneratedImage } from "@/lib/images";
import { getStorageDirectory } from "@/lib/storage";
import { upscale } from "@/../cli";

type RequestBody = {
  imageId?: string;
  scaleFactor?: number;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RequestBody;

  if (!body.imageId) {
    return NextResponse.json(
      { error: "Missing imageId." },
      { status: 400 },
    );
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const scaleFactor = body.scaleFactor ?? 4;
  const outputDir = `${getStorageDirectory()}/upscale`;
  await mkdir(outputDir, { recursive: true });

  const outputFilename = `${body.imageId}-${scaleFactor}x.png`;
  const outputPath = `${outputDir}/${outputFilename}`;

  try {
    await upscale(image.filePath, outputPath, scaleFactor);

    const originalName = `${image.originalName.replace(/\.[^.]+$/, "")}-${scaleFactor}x.png`;

    const generatedImage = await createGeneratedImage({
      filePath: outputPath,
      originalName,
      mimeType: "image/png",
      metadata: {
        tool: "upscale",
        sourceImageId: body.imageId,
        params: { scaleFactor },
      },
    });

    return NextResponse.json({ image: generatedImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
