import { NextResponse } from "next/server";

import { getImage } from "@/lib/images";
import { detectSprites } from "@/../cli";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    imageId?: string;
    mergeTolerance?: number;
    minSize?: number;
    bgColor?: { r: number; g: number; b: number };
    tolerance?: number;
    region?: { x: number; y: number; width: number; height: number };
  };

  if (!body.imageId) {
    return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    const boxes = await detectSprites(image.filePath, {
      mergeTolerance: body.mergeTolerance,
      minSize: body.minSize,
      bgColor: body.bgColor,
      tolerance: body.tolerance,
      region: body.region,
    });

    return NextResponse.json({
      boxes,
      imageWidth: image.width,
      imageHeight: image.height,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
