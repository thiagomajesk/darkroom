import { NextResponse } from "next/server";

import { deleteCollection, renameCollection } from "@/lib/collections";

type RouteContext = {
  params: Promise<{ collectionId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { collectionId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as { name?: string };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Missing name." }, { status: 400 });
  }

  const collection = renameCollection(collectionId, body.name.trim());
  return NextResponse.json({ collection });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { collectionId } = await context.params;
  deleteCollection(collectionId);
  return NextResponse.json({ ok: true });
}
