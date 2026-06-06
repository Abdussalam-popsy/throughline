import { getResourceForDomain } from "../src/services/resources";

test("maps a known domain to a resource", () => {
  const r = getResourceForDomain("exam_stress");
  expect(r).not.toBeNull();
  expect(r?.source).toContain("Imperial");
});

test("returns null for the general domain", () => {
  expect(getResourceForDomain("general")).toBeNull();
});

test("returns null for an unknown domain", () => {
  expect(getResourceForDomain("not_a_domain")).toBeNull();
});

test("body_image resource carries no diet/fitness/weight content", () => {
  const r = getResourceForDomain("body_image");
  const blob = `${r?.title} ${r?.snippet}`.toLowerCase();
  expect(blob).not.toMatch(/\b(diet|fitness|exercise|weight|calorie)\b/);
});
