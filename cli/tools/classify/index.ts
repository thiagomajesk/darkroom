import { classifyImageCli } from "./classify";

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
  await classifyImageCli(input);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
