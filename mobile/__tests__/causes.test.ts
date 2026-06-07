/// <reference types="jest" />
import { rankCauses } from "../src/lib/causes";
import type { Domain, Entry } from "../src/lib/types";

let seq = 0;
function entry(domain: Domain | undefined, createdAt = ++seq): Entry {
  return { id: `e${createdAt}`, date: "2026-06-01", text: "x", domain, createdAt };
}

test("rankCauses tallies by domain, most frequent first", () => {
  const r = rankCauses([
    entry("exam_stress"),
    entry("exam_stress"),
    entry("loneliness"),
  ]);
  expect(r.map((c) => [c.domain, c.count])).toEqual([
    ["exam_stress", 2],
    ["loneliness", 1],
  ]);
});

test("rankCauses excludes general and untagged entries", () => {
  const r = rankCauses([entry("general"), entry(undefined), entry("loneliness")]);
  expect(r).toHaveLength(1);
  expect(r[0].domain).toBe("loneliness");
});

test("rankCauses caps at the top 3 causes", () => {
  const r = rankCauses([
    entry("exam_stress"),
    entry("loneliness"),
    entry("sleep_fatigue"),
    entry("body_image"),
  ]);
  expect(r).toHaveLength(3);
});

test("rankCauses breaks count ties by most recent entry", () => {
  const r = rankCauses([
    entry("loneliness", 100),
    entry("exam_stress", 200),
  ]);
  expect(r[0].domain).toBe("exam_stress");
});

test("rankCauses flags sensitive domains and gives a friendly label", () => {
  const r = rankCauses([entry("self_harm"), entry("exam_stress")]);
  const selfHarm = r.find((c) => c.domain === "self_harm")!;
  expect(selfHarm.sensitive).toBe(true);
  expect(selfHarm.label).toBe("Self-harm");
  expect(r.find((c) => c.domain === "exam_stress")!.sensitive).toBe(false);
});

test("rankCauses returns nothing for an empty list", () => {
  expect(rankCauses([])).toEqual([]);
});
