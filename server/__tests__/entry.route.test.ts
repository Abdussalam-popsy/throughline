import request from "supertest";

jest.mock("../src/services/ai", () => ({
  processEntry: jest.fn(),
  classifyDomain: jest.fn(),
}));

import { app } from "../src/index";
import { classifyDomain, processEntry } from "../src/services/ai";

const mockedProcess = processEntry as jest.MockedFunction<typeof processEntry>;
const mockedClassify = classifyDomain as jest.MockedFunction<typeof classifyDomain>;

afterEach(() => jest.clearAllMocks());

test("domain returns the classified domain for an entry", async () => {
  mockedClassify.mockResolvedValue("exam_stress");
  const r = await request(app)
    .post("/api/entry/domain")
    .send({ text: "deadlines everywhere and I can't keep up" });
  expect(r.status).toBe(200);
  expect(r.body.domain).toBe("exam_stress");
  expect(mockedClassify).toHaveBeenCalledWith(
    "deadlines everywhere and I can't keep up"
  );
});

test("domain rejects an empty entry", async () => {
  const r = await request(app).post("/api/entry/domain").send({ text: "   " });
  expect(r.status).toBe(400);
  expect(mockedClassify).not.toHaveBeenCalled();
});

test("process returns the analysis only — no eager tip/resource", async () => {
  mockedProcess.mockResolvedValue({
    next_prompt: "You mentioned revision — what part feels heaviest?",
    risk_level: "elevated",
    risk_rationale: "persistent exam pressure",
    themes: ["exam-pressure"],
    domain: "exam_stress",
  });
  const r = await request(app)
    .post("/api/entry/process")
    .send({ recent: [], today: "exams are crushing me" });
  expect(r.status).toBe(200);
  expect(r.body.analysis.domain).toBe("exam_stress");
  expect(r.body.resource).toBeUndefined();
  expect(r.body.tip).toBeUndefined();
});

test("process rejects an empty entry", async () => {
  const r = await request(app)
    .post("/api/entry/process")
    .send({ recent: [], today: "   " });
  expect(r.status).toBe(400);
});

test("support returns a domain tip and grounding technique", async () => {
  const r = await request(app)
    .post("/api/entry/support")
    .send({ domain: "exam_stress", riskLevel: "elevated" });
  expect(r.status).toBe(200);
  expect(r.body.tip).not.toBeNull();
  expect(r.body.tip.domain).toBe("exam_stress");
  expect(typeof r.body.tip.tip).toBe("string");
  expect(r.body.grounding).not.toBeNull();
  expect(typeof r.body.grounding.title).toBe("string");
});

test("support suppresses tip and grounding on crisis", async () => {
  const r = await request(app)
    .post("/api/entry/support")
    .send({ domain: "general", riskLevel: "crisis" });
  expect(r.status).toBe(200);
  expect(r.body.tip).toBeNull();
  expect(r.body.grounding).toBeNull();
});

test("support falls back to general when no domain is given", async () => {
  const r = await request(app).post("/api/entry/support").send({});
  expect(r.status).toBe(200);
  expect(r.body.tip.domain).toBe("general");
  expect(typeof r.body.grounding.title).toBe("string");
});

test("tip re-roll returns a tip for the requested domain", async () => {
  const r = await request(app).get("/api/entry/tip?domain=loneliness");
  expect(r.status).toBe(200);
  expect(r.body.tip.domain).toBe("loneliness");
});
