import { mkdirSync, rmSync } from "node:fs";
import { dirname } from "node:path";

import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { pushSQLiteSchema } from "drizzle-kit/api";

import { getDatabasePath } from "@/lib/storage";
import * as schema from "@/lib/schema";

let db: BetterSQLite3Database<typeof schema> | null = null;
let sqlite: Database.Database | null = null;
let synced = false;

async function syncSchema(instance: BetterSQLite3Database<typeof schema>) {
  if (synced) return;

  // pushSQLiteSchema types expect LibSQLDatabase but works with BetterSQLite3Database at runtime
  const result = await pushSQLiteSchema(schema, instance as never);

  for (const statement of result.statementsToExecute) {
    instance.run(sql.raw(statement));
  }

  synced = true;
}

export function getDatabase() {
  if (!db) {
    mkdirSync(dirname(getDatabasePath()), { recursive: true });
    sqlite = new Database(getDatabasePath());
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");

    db = drizzle(sqlite, { schema });
  }

  return db;
}

export async function ensureSchema() {
  await syncSchema(getDatabase());
}

export function resetDatabaseForTests() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
    synced = false;
  }

  rmSync(getDatabasePath(), { force: true });
  rmSync(`${getDatabasePath()}-wal`, { force: true });
  rmSync(`${getDatabasePath()}-shm`, { force: true });
}
