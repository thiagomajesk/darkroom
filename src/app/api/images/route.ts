import { NextResponse } from "next/server";

import { createImageFromBuffer, createImageFromUrl, listImages } from "@/lib/images";

export async function GET() {
  return NextResponse.json({
    images: listImages(),
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    const sourceType = (formData.get("sourceType")?.toString() ?? "upload") as
      | "upload"
      | "paste";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload." }, { status: 400 });
    }

    const image = await createImageFromBuffer({
      buffer: Buffer.from(await file.arrayBuffer()),
      originalName: file.name || "pasted-image.png",
      mimeType: file.type || "image/png",
      sourceType,
    });

    return NextResponse.json({ image });
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };

  if (!body.url) {
    return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
  }

  const image = await createImageFromUrl(body.url);
  return NextResponse.json({ image });
}
