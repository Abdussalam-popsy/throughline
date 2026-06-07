import fs from "fs";
import path from "path";
import type { Tip } from "../lib/types";

/** Shape of a record in `server/data/resources.json` (snake_case on disk). */
interface RawTip {
  domain: string;
  tip: string;
  source: string;
  read_more?: string;
}

const DATA_PATH = path.join(__dirname, "..", "..", "data", "resources.json");
const RAW: RawTip[] = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));

// Curated tips, camelCased once at load.
const TIPS: Tip[] = RAW.map((r) => ({
  domain: r.domain,
  tip: r.tip,
  source: r.source,
  readMore: r.read_more,
}));

// Buckets that must never be surfaced as a casual tip — they fall back to general.
const SENSITIVE = new Set(["crisis", "self_harm"]);

function randomFrom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * A random tip for `domain`. Always returns a valid tip: unknown domains and the
 * sensitive crisis/self_harm buckets fall back to a random `general` tip, so the
 * server never hands the client empty or inappropriate content.
 */
export function getTipForDomain(domain: string): Tip {
  const hasDomain = !SENSITIVE.has(domain) && TIPS.some((t) => t.domain === domain);
  const wanted = hasDomain ? domain : "general";
  return randomFrom(TIPS.filter((t) => t.domain === wanted));
}
