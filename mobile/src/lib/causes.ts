import type { Domain, Entry } from "./types";

/** Friendly, low-key labels for each domain — shown as the cause name. */
export const DOMAIN_LABEL: Record<Domain, string> = {
  exam_stress: "Exam stress",
  body_image: "Body image",
  loneliness: "Loneliness",
  financial_anxiety: "Money worries",
  relationship_stress: "Relationships",
  identity_uncertainty: "Identity",
  work_burnout: "Burnout",
  sleep_fatigue: "Sleep & fatigue",
  self_harm: "Self-harm",
  crisis: "Crisis",
  general: "General",
};

/**
 * Domains that must never be shown with a casual tip. They still appear in the
 * ranking, but the UI routes them to support instead of fetching a tip.
 */
export const SENSITIVE_DOMAINS: ReadonlySet<Domain> = new Set<Domain>([
  "self_harm",
  "crisis",
]);

/** "general" is the unclassified catch-all — never a nameable cause of stress. */
const EXCLUDED_DOMAINS: ReadonlySet<Domain> = new Set<Domain>(["general"]);

export interface RankedCause {
  domain: Domain;
  label: string;
  count: number;
  sensitive: boolean;
}

const TOP_N = 3;

/**
 * Tally entries by domain and return the biggest causes of stress, most frequent
 * first. Excludes "general" and untagged entries. Ties break by most recent entry.
 */
export function rankCauses(entries: Entry[]): RankedCause[] {
  const counts = new Map<Domain, { count: number; latest: number }>();

  for (const entry of entries) {
    const domain = entry.domain;
    if (!domain || EXCLUDED_DOMAINS.has(domain)) continue;
    const prev = counts.get(domain);
    if (prev) {
      prev.count += 1;
      prev.latest = Math.max(prev.latest, entry.createdAt);
    } else {
      counts.set(domain, { count: 1, latest: entry.createdAt });
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || b[1].latest - a[1].latest)
    .slice(0, TOP_N)
    .map(([domain, { count }]) => ({
      domain,
      label: DOMAIN_LABEL[domain],
      count,
      sensitive: SENSITIVE_DOMAINS.has(domain),
    }));
}
