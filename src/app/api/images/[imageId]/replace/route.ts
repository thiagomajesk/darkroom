import { NextResponse } from "next/server";

import { getImage, replaceImage } from "@/lib/images";

type RequestBody = {
  sourceImageId?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const body = (await request.json().catch(() => ({}))) as RequestBody;

  if (!body.sourceImageId) {
    return NextResponse.json(
      { error: "Missing sourceImageId in request body." },
      { status: 400 },
    );
  }

  const target = getImage(imageId);
  if (!target) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const source = getImage(body.sourceImageId);
  if (!source) {
    return NextResponse.json({ error: "Source image not found." }, { status: 404 });
  }

  try {
    const updatedImage = await replaceImage(imageId, body.sourceImageId);
    return NextResponse.json({ image: updatedImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
