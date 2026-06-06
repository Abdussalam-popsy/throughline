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

test("process returns analysis + matching resource for a domain", async () => {
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
  expect(r.body.resource).not.toBeNull();
  expect(r.body.resource.source).toContain("Imperial");
});

test("process suppresses the resource on crisis", async () => {
  mockedProcess.mockResolvedValue({
    next_prompt: "",
    risk_level: "crisis",
    risk_rationale: "explicit intent",
    themes: ["crisis"],
    domain: "general",
  });
  const r = await request(app)
    .post("/api/entry/process")
    .send({ recent: [], today: "i can't go on" });
  expect(r.status).toBe(200);
  expect(r.body.resource).toBeNull();
});

test("process rejects an empty entry", async () => {
  const r = await request(app)
    .post("/api/entry/process")
    .send({ recent: [], today: "   " });
  expect(r.status).toBe(400);
});
