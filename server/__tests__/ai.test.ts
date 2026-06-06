import { generateBrief, processEntry } from "../src/services/ai";
import type { Entry } from "../src/lib/types";

beforeEach(() => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "## Summary\nlow mood" } }],
    }),
  }));
});

afterEach(() => jest.restoreAllMocks());

test("generateBrief returns model content", async () => {
  const out = await generateBrief([
    { id: "1", date: "2026-05-15", text: "bad day", createdAt: 0 } as Entry,
  ]);
  expect(out).toContain("Summary");
  expect(fetch).toHaveBeenCalled();
});

test("generateBrief surfaces GLM errors", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: false,
    status: 401,
    text: async () => "unauthorized",
  }));
  await expect(
    generateBrief([{ id: "1", date: "x", text: "y", createdAt: 0 } as Entry])
  ).rejects.toThrow(/GLM 401/);
});

test("processEntry parses JSON (incl. fenced) into analysis", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '```json\n{"next_prompt":"You mentioned the 9am — what makes mornings hardest?","risk_level":"elevated","risk_rationale":"persistent low mood","themes":["sleep","low mood"]}\n```',
          },
        },
      ],
    }),
  }));
  const a = await processEntry(
    [{ id: "1", date: "2026-05-22", text: "missed the 9am", createdAt: 0 } as Entry],
    "still can't sleep"
  );
  expect(a.risk_level).toBe("elevated");
  expect(a.themes).toContain("sleep");
  expect(a.next_prompt).not.toEqual("");
});
