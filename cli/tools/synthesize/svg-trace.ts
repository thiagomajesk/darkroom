import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const detailPresets = {
  low: ["--filter_speckle", "8", "--color_precision", "4"],
  medium: ["--filter_speckle", "4", "--color_precision", "6"],
  high: ["--filter_speckle", "2", "--color_precision", "8"],
} as const;

function findVtracer(): string {
  // Bundled binary in the project's bin/ directory
  const bundled = join(process.cwd(), "bin", "vtracer");
  if (existsSync(bundled)) {
    return bundled;
  }

  throw new Error(
    "vtracer binary not found at bin/vtracer. Run the setup in Settings to fix this.",
  );
}

export async function svgTrace(
  inputPath: string,
  outputPath: string,
  detail: "low" | "medium" | "high",
): Promise<void> {
  const vtracerPath = findVtracer();
  const flags = detailPresets[detail];

  await execFileAsync(vtracerPath, [
    "--input",
    inputPath,
    "--output",
    outputPath,
    ...flags,
  ]);
}
