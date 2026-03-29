import { NextResponse } from "next/server";

import { createCollection, listCollections } from "@/lib/collections";

export function GET() {
  return NextResponse.json({ collections: listCollections() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { name?: string };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Missing collection name." }, { status: 400 });
  }

  const collection = createCollection(body.name.trim());
  return NextResponse.json({ collection });
}
