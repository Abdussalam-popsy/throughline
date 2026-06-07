import { getTipForDomain } from "../src/services/resources";

test("returns a valid tip for a known domain", () => {
  const t = getTipForDomain("exam_stress");
  expect(t.domain).toBe("exam_stress");
  expect(typeof t.tip).toBe("string");
  expect(t.tip.length).toBeGreaterThan(0);
  expect(typeof t.source).toBe("string");
  expect(t.source.length).toBeGreaterThan(0);
});

test("falls back to a general tip for an unknown domain", () => {
  expect(getTipForDomain("not_a_domain").domain).toBe("general");
});

test("never serves sensitive-bucket tips — crisis/self_harm fall back to general", () => {
  expect(getTipForDomain("crisis").domain).toBe("general");
  expect(getTipForDomain("self_harm").domain).toBe("general");
});

test("maps read_more to readMore when present", () => {
  // exam_stress tips all carry a read_more URL in the source data.
  const t = getTipForDomain("exam_stress");
  expect(t.readMore).toMatch(/^https?:\/\//);
});
