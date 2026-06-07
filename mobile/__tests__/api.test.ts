/// <reference types="jest" />
import { processEntryApi, fetchSupportApi, fetchTipApi } from "../src/services/api";

afterEach(() => jest.restoreAllMocks());

test("processEntryApi returns the analysis on success", async () => {
  (globalThis as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      analysis: {
        next_prompt: "What made the library easier today?",
        risk_level: "elevated",
        risk_rationale: "persistent low mood",
        themes: ["low mood"],
        domain: "loneliness",
      },
    }),
  }));
  const r = await processEntryApi([], "felt invisible all day");
  expect(r.analysis.domain).toBe("loneliness");
});

test("processEntryApi fails safe to an elevated analysis when fetch throws", async () => {
  (globalThis as any).fetch = jest.fn(async () => {
    throw new Error("offline");
  });
  const r = await processEntryApi([], "anything");
  expect(r.analysis.risk_level).toBe("elevated");
});

test("processEntryApi fails safe on a non-OK response", async () => {
  (globalThis as any).fetch = jest.fn(async () => ({ ok: false, status: 502 }));
  const r = await processEntryApi([], "anything");
  expect(r.analysis.risk_level).toBe("elevated");
});

test("fetchSupportApi returns the tip + grounding bundle on success", async () => {
  (globalThis as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      tip: { domain: "loneliness", tip: "Reach out to one person", source: "Mind" },
      grounding: {
        id: "text_someone",
        title: "Text One Person",
        durationLabel: "2 min",
        description: "Text one person something real.",
        type: "social",
      },
    }),
  }));
  const r = await fetchSupportApi("loneliness", "elevated");
  expect(r.tip?.tip).toBe("Reach out to one person");
  expect(r.grounding?.id).toBe("text_someone");
});

test("fetchSupportApi fails safe to nulls — no hardcoded content — on error", async () => {
  (globalThis as any).fetch = jest.fn(async () => {
    throw new Error("offline");
  });
  const r = await fetchSupportApi("loneliness", "elevated");
  expect(r.tip).toBeNull();
  expect(r.grounding).toBeNull();
});

test("fetchTipApi returns a tip on success", async () => {
  (globalThis as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      tip: { domain: "exam_stress", tip: "Take regular breaks", source: "NHS" },
    }),
  }));
  const t = await fetchTipApi("exam_stress");
  expect(t?.tip).toBe("Take regular breaks");
});

test("fetchTipApi returns null on error", async () => {
  (globalThis as any).fetch = jest.fn(async () => {
    throw new Error("offline");
  });
  expect(await fetchTipApi("exam_stress")).toBeNull();
});
