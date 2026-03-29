import { NextResponse } from "next/server";

import {
  addImageToCollection,
  listCollectionImages,
  removeImageFromCollection,
} from "@/lib/collections";

type RouteContext = {
  params: Promise<{ collectionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { collectionId } = await context.params;
  const images = listCollectionImages(collectionId);
  return NextResponse.json({ images });
}

export async function POST(request: Request, context: RouteContext) {
  const { collectionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { imageId?: string };

  if (!body.imageId) {
    return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
  }

  addImageToCollection(collectionId, body.imageId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { collectionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { imageId?: string };

  if (!body.imageId) {
    return NextResponse.json({ error: "Missing imageId." }, { status: 400 });
  }

  removeImageFromCollection(collectionId, body.imageId);
  return NextResponse.json({ ok: true });
}
