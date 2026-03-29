import { NextResponse } from "next/server";
import { deleteImage, getImage } from "@/lib/images";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const image = getImage(imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  deleteImage(imageId);

  return NextResponse.json({ ok: true });
}
