import { getImage } from "@/lib/images";
import {
  getImageDimensions,
  getSpritesheetPrompt,
  parseGridResult,
  runStreamedCodex,
} from "@/lib/tools/ai";
import { computeBoxesFromGrid } from "@/lib/tools/grid";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { imageId?: string };

  if (!body.imageId) {
    return Response.json({ error: "Missing imageId." }, { status: 400 });
  }

  const image = getImage(body.imageId);
  if (!image) {
    return Response.json({ error: "Image not found." }, { status: 404 });
  }

  const { width, height } = await getImageDimensions(image.filePath);
  const prompt = getSpritesheetPrompt(width, height);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const finalResponse = await runStreamedCodex(
          prompt,
          image.filePath,
          (event) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
            );
          },
        );

        const grid = parseGridResult(finalResponse);
        const boxes = computeBoxesFromGrid(grid, width, height);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "result",
              analysis: {
                grid,
                boxes,
                imageWidth: width,
                imageHeight: height,
              },
            })}\n\n`,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
