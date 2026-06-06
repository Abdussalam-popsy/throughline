import * as SQLite from "expo-sqlite";
import { SEED_ENTRIES } from "../lib/seed";
import type { Entry } from "../lib/types";

const db = SQLite.openDatabaseSync("throughline.db");
db.execSync(`CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, promptShown TEXT, text TEXT NOT NULL,
  riskLevel TEXT, themes TEXT, domain TEXT, stressor TEXT, createdAt INTEGER );`);

// Migration: add the model-generated `stressor` column to DBs created before it
// existed. SQLite throws on a duplicate column, so swallow that case.
try {
  db.execSync(`ALTER TABLE entries ADD COLUMN stressor TEXT`);
} catch {
  // column already present — nothing to do
}

// Seed the demo account into the DB on first launch so the timeline reads real,
// persistent data instead of a hardcoded array.
const seeded = db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM entries`);
if (!seeded || seeded.n === 0) {
  for (const e of SEED_ENTRIES) addEntry(e);
}

export function addEntry(e: Entry) {
  db.runSync(
    `INSERT OR REPLACE INTO entries
       (id, date, promptShown, text, riskLevel, themes, domain, stressor, createdAt)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      e.id,
      e.date,
      e.promptShown ?? null,
      e.text,
      e.riskLevel ?? "none",
      JSON.stringify(e.themes ?? []),
      e.domain ?? "general",
      e.stressor ?? null,
      e.createdAt,
    ]
  );
}

export function getEntries(): Entry[] {
  return db
    .getAllSync<any>(`SELECT * FROM entries ORDER BY date ASC`)
    .map((r) => ({
      ...r,
      themes: JSON.parse(r.themes || "[]"),
      stressor: r.stressor ?? undefined,
    }));
}
