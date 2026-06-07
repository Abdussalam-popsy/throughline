import * as SQLite from "expo-sqlite";
import { SEED_ENTRIES } from "../lib/seed";
import type { Entry, University } from "../lib/types";

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

// Simple key/value table for app preferences (e.g. whether onboarding is done).
db.execSync(`CREATE TABLE IF NOT EXISTS prefs ( key TEXT PRIMARY KEY, value TEXT );`);

// The user's chosen university and its mental-health service contact, picked
// once after onboarding. Single-row table (id is always pinned to 1) so a
// re-selection overwrites the previous choice. Drives the Support page card.
db.execSync(`CREATE TABLE IF NOT EXISTS university (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  key TEXT NOT NULL, name TEXT NOT NULL, city TEXT, serviceName TEXT,
  phone TEXT, email TEXT, url TEXT NOT NULL, notes TEXT );`);

// Seed the demo account into the DB on first launch so the timeline reads real,
// persistent data instead of a hardcoded array.
const seeded = db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM entries`);
if (!seeded || seeded.n === 0) {
  for (const e of SEED_ENTRIES) addEntry(e);
}

const ONBOARDING_KEY = "onboarding_complete";

export function hasCompletedOnboarding(): boolean {
  const row = db.getFirstSync<{ value: string }>(
    `SELECT value FROM prefs WHERE key = ?`,
    [ONBOARDING_KEY]
  );
  return row?.value === "1";
}

export function markOnboardingComplete() {
  db.runSync(
    `INSERT OR REPLACE INTO prefs (key, value) VALUES (?, ?)`,
    [ONBOARDING_KEY, "1"]
  );
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

export function hasSelectedUniversity(): boolean {
  const row = db.getFirstSync<{ n: number }>(`SELECT COUNT(*) AS n FROM university`);
  return !!row && row.n > 0;
}

// Persist the chosen university (overwriting any prior pick). null DB columns
// become `undefined` on the type, matching the optional phone/email contract.
export function saveUniversity(u: University) {
  db.runSync(
    `INSERT OR REPLACE INTO university
       (id, key, name, city, serviceName, phone, email, url, notes)
     VALUES (1,?,?,?,?,?,?,?,?)`,
    [u.key, u.name, u.city, u.serviceName, u.phone ?? null, u.email ?? null, u.url, u.notes]
  );
}

export function getUniversity(): University | null {
  const r = db.getFirstSync<any>(`SELECT * FROM university WHERE id = 1`);
  if (!r) return null;
  return {
    key: r.key,
    name: r.name,
    city: r.city ?? "",
    serviceName: r.serviceName ?? "",
    phone: r.phone ?? undefined,
    email: r.email ?? undefined,
    url: r.url,
    notes: r.notes ?? "",
  };
}
