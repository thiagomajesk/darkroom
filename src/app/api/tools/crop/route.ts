import { mkdir } from "node:fs/promises";
import { NextResponse } from "next/server";

import { getImage, createGeneratedImage } from "@/lib/images";
import { getStorageDirectory } from "@/lib/storage";
import { cropImage } from "@/../cli";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    imageId?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };

  if (
    !body.imageId ||
    body.x === undefined ||
    body.y === undefined ||
    body.width === undefined ||
    body.height === undefined
  ) {
    return NextResponse.json(
      { error: "Missing imageId, x, y, width, or height." },
      { status: 400 },
    );
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    const outputDirectory = `${getStorageDirectory()}/crop`;
    await mkdir(outputDirectory, { recursive: true });

    const outputPath = `${outputDirectory}/${body.imageId}-cropped.png`;

    await cropImage(
      image.filePath,
      outputPath,
      body.x,
      body.y,
      body.width,
      body.height,
    );

    const croppedImage = await createGeneratedImage({
      filePath: outputPath,
      originalName: `${image.originalName.replace(/\.[^.]+$/, "")}-cropped.png`,
      metadata: {
        tool: "crop",
        sourceImageId: body.imageId,
        params: { x: body.x, y: body.y, width: body.width, height: body.height },
      },
    });

    return NextResponse.json({ image: croppedImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
