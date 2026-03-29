import { NextResponse } from "next/server";

import { scrapeImages } from "@/../cli";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { url?: string };

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 },
      );
    }

    const images = await scrapeImages(body.url);

    return NextResponse.json({ images });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
