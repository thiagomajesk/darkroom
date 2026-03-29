import { getSettings, getResolvedStoragePath } from "@/lib/settings";
import { checkSystem } from "@/lib/system-check";
import { SettingsPage } from "@/components/settings/settings-page";

export default function Settings() {
  const settings = getSettings();
  const checks = checkSystem();
  const resolvedPath = getResolvedStoragePath();
  return <SettingsPage initialSettings={settings} initialChecks={checks} resolvedStoragePath={resolvedPath} />;
}
