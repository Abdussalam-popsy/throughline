import fs from "fs";
import path from "path";
import type { Grounding } from "../lib/types";

/** Shape of a record in `server/data/grounding.json` (snake_case on disk). */
interface RawGrounding {
  id: string;
  title: string;
  duration_seconds: number;
  duration_label: string;
  description: string;
  type: string;
  interaction: string;
  logs_as: string;
  best_for: string[];
}

const DATA_PATH = path.join(__dirname, "..", "..", "data", "grounding.json");
const RAW: RawGrounding[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Keep the raw best_for alongside the public Grounding shape for matching.
const TECHNIQUES: { grounding: Grounding; bestFor: string[] }[] = RAW.map((r) => ({
  grounding: {
    id: r.id,
    title: r.title,
    durationLabel: r.duration_label,
    description: r.description,
    type: r.type,
  },
  bestFor: r.best_for,
}));

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * A random grounding technique whose `best_for` includes `domain`. Always returns
 * a valid technique: an unmatched domain falls back to a random `general` technique.
 */
export function getGroundingForDomain(domain: string): Grounding {
  const matches = TECHNIQUES.filter((t) => t.bestFor.includes(domain));
  const pool = matches.length > 0 ? matches : TECHNIQUES.filter((t) => t.bestFor.includes("general"));
  return randomFrom(pool).grounding;
}
