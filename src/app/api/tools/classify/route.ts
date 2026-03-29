import { NextResponse } from "next/server";

import { getImage } from "@/lib/images";
import { classifyImage } from "@/lib/tools/ai";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { imageId?: string };

  if (!body.imageId) {
    return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    const classification = await classifyImage(image.filePath);
    return NextResponse.json({ classification });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
