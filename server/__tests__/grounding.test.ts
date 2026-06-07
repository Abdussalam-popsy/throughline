import { getGroundingForDomain } from "../src/services/grounding";

// The only techniques whose best_for lists financial_anxiety.
const FINANCIAL_MATCHES = new Set(["brain_dump", "worst_case", "tidy_one_thing"]);

test("only returns techniques whose best_for includes the domain", () => {
  for (let i = 0; i < 25; i++) {
    expect(FINANCIAL_MATCHES.has(getGroundingForDomain("financial_anxiety").id)).toBe(
      true
    );
  }
});

test("returns a fully-formed Grounding shape", () => {
  const g = getGroundingForDomain("loneliness");
  expect(g.id.length).toBeGreaterThan(0);
  expect(g.title.length).toBeGreaterThan(0);
  expect(g.durationLabel.length).toBeGreaterThan(0);
  expect(g.description.length).toBeGreaterThan(0);
  expect(g.type.length).toBeGreaterThan(0);
});

test("falls back to a valid technique for an unmatched domain", () => {
  const g = getGroundingForDomain("not_a_domain");
  expect(g.id.length).toBeGreaterThan(0);
  expect(g.title.length).toBeGreaterThan(0);
});
