import { NextResponse } from "next/server";

import { getImage, createGeneratedImage } from "@/lib/images";
import { extractSpritesCli } from "@/../cli";
import { getStorageDirectory } from "@/lib/storage";
import type { SpritesheetBox } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    imageId?: string;
    boxes?: SpritesheetBox[];
  };

  if (!body.imageId || !body.boxes?.length) {
    return NextResponse.json(
      { error: "Missing imageId or boxes." },
      { status: 400 },
    );
  }

  const image = getImage(body.imageId);

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const outputDirectory = `${getStorageDirectory()}/spritesheet/${body.imageId}`;

  const result = await extractSpritesCli(image.filePath, outputDirectory, body.boxes);

  const extractedImages = await Promise.all(
    result.outputs.map(async (output) => {
      const name = output.outputPath.split("/").pop() ?? "sprite.png";
      return createGeneratedImage({
        filePath: output.outputPath,
        originalName: name,
        metadata: {
          tool: "spritesheet",
          sourceImageId: body.imageId,
          params: { box: output.box },
        },
      });
    }),
  );

  return NextResponse.json({ images: extractedImages });
}
