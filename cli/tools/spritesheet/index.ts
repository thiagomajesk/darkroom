import type { SpritesheetBox } from "../../../src/lib/types";
import { inspectSpritesheetCli } from "./analyze";
import { extractSpritesCli } from "./extract";

function getArgument(flag: string) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredArgument(flag: string) {
  const value = getArgument(flag);

  if (!value) {
    throw new Error(`Missing required argument: ${flag}`);
  }

  return value;
}

async function main() {
  const command = process.argv[2];

  if (command === "inspect") {
    const input = requiredArgument("--input");
    await inspectSpritesheetCli(input);
    return;
  }

  if (command === "extract") {
    const input = requiredArgument("--input");
    const outputDir = requiredArgument("--output-dir");
    const boxesJson = requiredArgument("--boxes-json");
    const boxes = JSON.parse(boxesJson) as SpritesheetBox[];
    await extractSpritesCli(input, outputDir, boxes);
    return;
  }

  throw new Error(
    "Usage: tsx cli/spritesheet/index.ts <inspect|extract> --input <path> ...",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
