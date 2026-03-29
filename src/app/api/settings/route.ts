import { NextResponse } from "next/server";
import { resolve } from "node:path";

import { getSettings, getResolvedStoragePath, updateSettings } from "@/lib/settings";
import { checkSystem, hasAnyIssues } from "@/lib/system-check";
import { migrateStorage } from "@/lib/storage";

export async function GET() {
  const settings = getSettings();
  const checks = checkSystem();
  return NextResponse.json({
    settings,
    checks,
    hasIssues: hasAnyIssues(checks),
    resolvedStoragePath: getResolvedStoragePath(),
  });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    storagePath?: string;
  };

  if (!body.storagePath) {
    return NextResponse.json({ error: "Missing storagePath." }, { status: 400 });
  }

  const oldPath = getResolvedStoragePath();
  const newPath = resolve(process.cwd(), body.storagePath);

  const settings = updateSettings({ storagePath: body.storagePath });
  const migration = migrateStorage(oldPath, newPath);

  return NextResponse.json({
    settings,
    resolvedStoragePath: getResolvedStoragePath(),
    migration,
  });
}
