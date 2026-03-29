import { NextResponse } from "next/server";

import { createImageFromUrl } from "@/lib/images";
import {
  listCollections,
  createCollection,
  addImageToCollection,
} from "@/lib/collections";
import type { ImageRecord } from "@/lib/types";

function getOrCreateScrapedCollection() {
  const collections = listCollections();
  const existing = collections.find((c) => c.name === "Scraped");

  if (existing) {
    return existing;
  }

  return createCollection("Scraped");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { urls?: string[] };

    if (!Array.isArray(body.urls) || body.urls.length === 0) {
      return NextResponse.json(
        { error: "Missing required field: urls (non-empty array)" },
        { status: 400 },
      );
    }

    const collection = getOrCreateScrapedCollection();
    const images: ImageRecord[] = [];
    const errors: string[] = [];

    for (const url of body.urls) {
      try {
        const image = await createImageFromUrl(url, { tool: "scraper", params: { sourceUrl: url } });
        addImageToCollection(collection.id, image.id);
        images.push(image);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to download";
        errors.push(`${url}: ${message}`);
      }
    }

    return NextResponse.json({ images, errors });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
