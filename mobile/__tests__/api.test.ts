/// <reference types="jest" />
import { processEntryApi } from "../src/services/api";

afterEach(() => jest.restoreAllMocks());

test("processEntryApi returns the backend result on success", async () => {
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
      resource: { domain: "loneliness", title: "T", source: "S", snippet: "X" },
    }),
  }));
  const r = await processEntryApi([], "felt invisible all day");
  expect(r.analysis.domain).toBe("loneliness");
  expect(r.resource?.title).toBe("T");
});

test("processEntryApi fails safe to elevated + no resource when fetch throws", async () => {
  (globalThis as any).fetch = jest.fn(async () => {
    throw new Error("offline");
  });
  const r = await processEntryApi([], "anything");
  expect(r.analysis.risk_level).toBe("elevated");
  expect(r.resource).toBeNull();
});

test("processEntryApi fails safe on a non-OK response", async () => {
  (globalThis as any).fetch = jest.fn(async () => ({ ok: false, status: 502 }));
  const r = await processEntryApi([], "anything");
  expect(r.analysis.risk_level).toBe("elevated");
  expect(r.resource).toBeNull();
});
