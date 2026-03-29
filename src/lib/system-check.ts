import { execSync } from "node:child_process";

export type SystemCheckResult = {
  id: string;
  name: string;
  status: "ok" | "missing";
  version?: string;
  message?: string;
  installHint?: string;
};

function tryCommand(command: string): string | null {
  try {
    return execSync(command, { encoding: "utf-8", timeout: 5000 }).trim();
  } catch {
    return null;
  }
}

function checkCodex(): SystemCheckResult {
  const path = tryCommand("which codex 2>/dev/null");
  const version = path ? tryCommand("codex --version 2>/dev/null") : null;
  return {
    id: "codex",
    name: "Codex CLI",
    status: path ? "ok" : "missing",
    version: version ?? undefined,
    message: path
      ? undefined
      : "Required for AI-powered image analysis.",
    installHint: path
      ? undefined
      : "npm install -g @openai/codex",
  };
}

export function checkSystem(): SystemCheckResult[] {
  return [checkCodex()];
}

export function hasAnyIssues(results: SystemCheckResult[]): boolean {
  return results.some((r) => r.status === "missing");
}
