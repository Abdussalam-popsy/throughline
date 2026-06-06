import { generateBrief, processEntry, routeBrief } from "../src/services/ai";
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
  let sentSystem = "";
  (global as any).fetch = jest.fn(async (_url: string, init: any) => {
    sentSystem = JSON.parse(init.body).messages[0].content;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: "## Summary\nok" } }] }),
    };
  });
  await generateBrief(
    [{ id: "1", date: "2026-05-15", text: "bad day", createdAt: 0 } as Entry],
    { destination: "extenuating_circumstances", generatedDate: "2026-06-06" }
  );
  expect(sentSystem).toContain("extenuating_circumstances");
  expect(sentSystem).toContain("2026-06-06");
  expect(sentSystem).not.toContain("{{destination}}");
});
