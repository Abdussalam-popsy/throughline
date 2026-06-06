const mockCreate = jest.fn();
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}));

import { generateBrief, processEntry, routeBrief } from "../src/services/ai";
import type { Entry } from "../src/lib/types";

beforeEach(() => {
  // GLM transport (processEntry / routeBrief still use fetch).
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: "## Summary\nlow mood" } }],
    }),
  }));
  // Brief generation goes through Claude.
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: "## Summary\nlow mood" }],
  });
});

afterEach(() => jest.restoreAllMocks());

test("generateBrief returns Claude content", async () => {
  const out = await generateBrief([
    { id: "1", date: "2026-05-15", text: "bad day", createdAt: 0 } as Entry,
  ]);
  expect(out).toContain("Summary");
  expect(mockCreate).toHaveBeenCalled();
});

test("generateBrief surfaces Claude errors", async () => {
  mockCreate.mockRejectedValueOnce(new Error("anthropic 401"));
  await expect(
    generateBrief([{ id: "1", date: "x", text: "y", createdAt: 0 } as Entry])
  ).rejects.toThrow(/anthropic 401/);
});

test("processEntry parses JSON (incl. fenced) into analysis with domain", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '```json\n{"next_prompt":"You mentioned the 9am — what makes mornings hardest?","risk_level":"elevated","risk_rationale":"persistent low mood","themes":["sleep","low mood"],"domain":"exam_stress"}\n```',
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
  expect(a.domain).toBe("exam_stress");
  expect(a.next_prompt).not.toEqual("");
});

test("processEntry relates the entry to an existing stressor (isNew=false)", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '{"next_prompt":"q","risk_level":"elevated","risk_rationale":"r","themes":["exam-pressure"],"domain":"exam_stress","related_stressor":{"label":"Final exams","domain":"exam_stress"}}',
          },
        },
      ],
    }),
  }));
  const a = await processEntry([], "exams next week", [
    { label: "Final exams", domain: "exam_stress" },
  ]);
  expect(a.related_stressor).toEqual({
    label: "Final exams",
    domain: "exam_stress",
    isNew: false,
  });
});

test("processEntry marks a brand-new stressor as isNew=true", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '{"next_prompt":"q","risk_level":"elevated","risk_rationale":"r","themes":["money"],"domain":"financial_anxiety","related_stressor":{"label":"Rent","domain":"financial_anxiety"}}',
          },
        },
      ],
    }),
  }));
  const a = await processEntry([], "worried about rent", [
    { label: "Final exams", domain: "exam_stress" },
  ]);
  expect(a.related_stressor?.isNew).toBe(true);
  expect(a.related_stressor?.label).toBe("Rent");
});

test("processEntry fails safe to elevated on unparseable output", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: "not json at all" } }] }),
  }));
  const a = await processEntry([], "today was hard");
  expect(a.risk_level).toBe("elevated");
  expect(a.domain).toBe("general");
});

test("processEntry forces empty next_prompt on crisis", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '{"next_prompt":"should not survive","risk_level":"crisis","risk_rationale":"explicit intent","themes":["crisis"],"domain":"general"}',
          },
        },
      ],
    }),
  }));
  const a = await processEntry([], "farewell");
  expect(a.risk_level).toBe("crisis");
  expect(a.next_prompt).toBe("");
});

test("processEntry fails safe when the network throws", async () => {
  (global as any).fetch = jest.fn(async () => {
    throw new Error("network down");
  });
  const a = await processEntry([], "anything");
  expect(a.risk_level).toBe("elevated");
});

test("routeBrief returns a destination category", async () => {
  (global as any).fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content:
              '{"primary_destination":"wellbeing_team","brief_format":"extenuating_circumstances","rationale":"you could share this with your wellbeing team","confidence":"medium"}',
          },
        },
      ],
    }),
  }));
  const r = await routeBrief(["exam-pressure", "sleep"], "elevated");
  expect(r.primary_destination).toBe("wellbeing_team");
  expect(r.brief_format).toBe("extenuating_circumstances");
});

test("generateBrief substitutes destination + date into the prompt", async () => {
  await generateBrief(
    [{ id: "1", date: "2026-05-15", text: "bad day", createdAt: 0 } as Entry],
    { destination: "extenuating_circumstances", generatedDate: "2026-06-06" }
  );
  const sentSystem = mockCreate.mock.calls[0][0].system as string;
  expect(sentSystem).toContain("extenuating_circumstances");
  expect(sentSystem).toContain("2026-06-06");
  expect(sentSystem).not.toContain("{{destination}}");
});
