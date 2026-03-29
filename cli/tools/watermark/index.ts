import { removeWatermark } from "./remove";

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
  await removeWatermark(input, output);
  console.log(JSON.stringify({ success: true, outputPath: output }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
