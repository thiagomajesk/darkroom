import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";

import { getImage } from "@/lib/images";

type RouteContext = {
  params: Promise<{
    imageId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { imageId } = await context.params;
  const image = getImage(imageId);

  if (!image) {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }

  await stat(image.filePath);

  const stream = createReadStream(image.filePath);

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "content-type": image.mimeType,
      "cache-control": "no-store",
    },
  });
}
