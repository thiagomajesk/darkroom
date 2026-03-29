import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getDatabase } from "@/lib/database";
import { images } from "@/lib/schema";
import { getImage } from "@/lib/images";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ imageId: string }> },
) {
  const { imageId } = await params;
  const image = getImage(imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const merged = { ...image.metadata, ...body };

  const db = getDatabase();
  db.update(images)
    .set({ metadataJson: JSON.stringify(merged) })
    .where(eq(images.id, imageId))
    .run();

  return NextResponse.json({ ok: true });
}
