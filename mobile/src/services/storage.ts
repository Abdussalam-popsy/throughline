import * as SQLite from "expo-sqlite";
import type { Entry } from "../lib/types";

const db = SQLite.openDatabaseSync("throughline.db");
db.execSync(`CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, promptShown TEXT, text TEXT NOT NULL,
  riskLevel TEXT, themes TEXT, domain TEXT, createdAt INTEGER );`);

export function addEntry(e: Entry) {
  db.runSync(
    `INSERT OR REPLACE INTO entries
       (id, date, promptShown, text, riskLevel, themes, domain, createdAt)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      e.id,
      e.date,
      e.promptShown ?? null,
      e.text,
      e.riskLevel ?? "none",
      JSON.stringify(e.themes ?? []),
      e.domain ?? "general",
      e.createdAt,
    ]
  );
}

export function getEntries(): Entry[] {
  return db
    .getAllSync<any>(`SELECT * FROM entries ORDER BY date ASC`)
    .map((r) => ({ ...r, themes: JSON.parse(r.themes || "[]") }));
}
