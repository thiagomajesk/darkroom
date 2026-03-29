"use client";

import { useState } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FolderOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AppSettings } from "@/lib/settings";
import type { SystemCheckResult } from "@/lib/system-check";

type SettingsPageProps = {
  initialSettings: AppSettings;
  initialChecks: SystemCheckResult[];
  resolvedStoragePath: string;
};

export function SettingsPage({ initialSettings, initialChecks, resolvedStoragePath }: SettingsPageProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [checks] = useState(initialChecks);
  const [storagePath, setStoragePath] = useState(resolvedStoragePath);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{ moved: number; errors: string[] } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const pathChanged = storagePath !== resolvedStoragePath;

  async function handleSaveStorage() {
    setIsSaving(true);
    setSaveSuccess(false);
    setMigrationResult(null);
    setShowConfirm(false);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath }),
      });
      if (response.ok) {
        const data = (await response.json()) as {
          settings: AppSettings;
          resolvedStoragePath: string;
          migration: { moved: number; errors: string[] };
        };
        setSettings(data.settings);
        setStoragePath(data.resolvedStoragePath);
        setMigrationResult(data.migration);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      }
    } finally {
      setIsSaving(false);
    }
  }

  function handleCopy(id: string, command: string) {
    void navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-6 py-8">
      <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Configure storage and check your system setup.
      </p>

      <Separator className="my-6" />

      {/* Storage configuration */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Storage path</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Directory where gallery images and generated files are saved. Relative
          to the project root or an absolute path.
        </p>
        <div className="flex gap-2">
          <Input
            value={storagePath}
            onChange={(e) => {
              setStoragePath(e.target.value);
              setShowConfirm(false);
              setMigrationResult(null);
            }}
            placeholder="/path/to/storage"
          />
          {showConfirm ? (
            <Button
              variant="destructive"
              disabled={isSaving}
              onClick={() => void handleSaveStorage()}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
              {isSaving ? "Moving..." : "Confirm"}
            </Button>
          ) : (
            <Button
              variant="outline"
              disabled={!pathChanged}
              onClick={() => setShowConfirm(true)}
            >
              <Save />
              Save
            </Button>
          )}
        </div>

        {showConfirm && !isSaving && (
          <p className="text-xs text-amber-400">
            This will move all existing files to the new location and update the database.
          </p>
        )}

        {migrationResult && (
          <div className="rounded-lg border p-3 text-xs">
            {migrationResult.moved > 0 && (
              <p className="text-emerald-400">
                Moved {migrationResult.moved} file{migrationResult.moved === 1 ? "" : "s"} to the new location.
              </p>
            )}
            {migrationResult.moved === 0 && migrationResult.errors.length === 0 && (
              <p className="text-muted-foreground">No files to move.</p>
            )}
            {migrationResult.errors.length > 0 && (
              <div className="mt-1 space-y-1 text-red-400">
                {migrationResult.errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <Separator className="my-6" />

      {/* System checks */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">System setup</h2>
        <p className="text-sm text-muted-foreground">
          External tools used by Darkroom.
        </p>

        <div className="space-y-2">
          {checks.map((check) => (
            <div key={check.id} className="rounded-lg border border-border/60 bg-card p-3 shadow-sm shadow-black/10">
              <div className="flex items-center gap-3">
                {check.status === "ok" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="size-4 shrink-0 text-amber-400" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{check.name}</span>
                    {check.version && (
                      <Badge variant="secondary" className="text-xs">
                        {check.version}
                      </Badge>
                    )}
                    {check.status === "ok" && check.message && (
                      <span className="text-xs text-muted-foreground">{check.message}</span>
                    )}
                  </div>
                  {check.status === "missing" && check.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {check.message}
                    </p>
                  )}
                </div>
              </div>

              {check.status === "missing" && check.installHint && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs text-foreground">
                    {check.installHint}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleCopy(check.id, check.installHint!)}
                  >
                    {copiedId === check.id ? (
                      <Check className="text-emerald-400" />
                    ) : (
                      <Copy />
                    )}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
