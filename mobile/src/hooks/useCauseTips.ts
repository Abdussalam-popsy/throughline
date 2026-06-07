import { useEffect, useState } from "react";
import { fetchTipApi } from "../services/api";
import type { Domain, Tip } from "../lib/types";
import type { RankedCause } from "../lib/causes";

export type TipState =
  | { status: "loading" }
  | { status: "loaded"; tip: Tip }
  | { status: "error" };

/**
 * Fetches one curated tip per non-sensitive cause. Sensitive causes are skipped
 * (the UI routes them to support instead). No tip content is held on the client:
 * a failed fetch surfaces as `error`, never fabricated text.
 */
export function useCauseTips(causes: RankedCause[]): Record<string, TipState> {
  const [tips, setTips] = useState<Record<string, TipState>>({});

  // Only non-sensitive domains get a tip; key the effect on that exact set so it
  // re-runs when the ranked causes change (e.g. after new entries on focus).
  const domains = causes.filter((c) => !c.sensitive).map((c) => c.domain);
  const key = domains.join(",");

  useEffect(() => {
    let cancelled = false;
    setTips(Object.fromEntries(domains.map((d) => [d, { status: "loading" }])));

    domains.forEach(async (domain: Domain) => {
      const tip = await fetchTipApi(domain);
      if (cancelled) return;
      setTips((prev) => ({
        ...prev,
        [domain]: tip ? { status: "loaded", tip } : { status: "error" },
      }));
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return tips;
}
