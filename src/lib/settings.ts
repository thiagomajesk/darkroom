import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const settingsPath = join(process.cwd(), "data", "settings.json");

export type AppSettings = {
  storagePath: string;
};

const defaults: AppSettings = {
  storagePath: "storage",
};

export function getSettings(): AppSettings {
  try {
    if (existsSync(settingsPath)) {
      const raw = readFileSync(settingsPath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...defaults, ...parsed };
    }
  } catch {
    // Fall through to defaults
  }
  return { ...defaults };
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...partial };

  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(updated, null, 2), "utf-8");

  return updated;
}

export function getResolvedStoragePath(): string {
  const settings = getSettings();
  return resolve(process.cwd(), settings.storagePath);
}
