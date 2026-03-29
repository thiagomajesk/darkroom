import { grayscale } from "./grayscale";
import { colorshift } from "./colorshift";
import { pixelate } from "./pixelate";
import { svgTrace } from "./svg-trace";

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
  const input = requiredArgument("--input");
  const output = requiredArgument("--output");
  const mode = requiredArgument("--mode");

  switch (mode) {
    case "grayscale": {
      await grayscale(input, output);
      break;
    }
    case "colorshift": {
      const hue = Number(requiredArgument("--hue"));
      await colorshift(input, output, hue);
      break;
    }
    case "pixelate": {
      const blockSize = Number(requiredArgument("--block-size"));
      await pixelate(input, output, blockSize);
      break;
    }
    case "svg": {
      const detail = (getArgument("--detail") ?? "medium") as
        | "low"
        | "medium"
        | "high";
      await svgTrace(input, output, detail);
      break;
    }
    default: {
      throw new Error(
        `Unknown mode: ${mode}. Use grayscale, colorshift, pixelate, or svg.`,
      );
    }
  }

  console.log(JSON.stringify({ success: true, outputPath: output }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
