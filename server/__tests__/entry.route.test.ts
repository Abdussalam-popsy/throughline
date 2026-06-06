import request from "supertest";

jest.mock("../src/services/ai", () => ({
  processEntry: jest.fn(),
}));

import { app } from "../src/index";
import { processEntry } from "../src/services/ai";

const mockedProcess = processEntry as jest.MockedFunction<typeof processEntry>;

afterEach(() => jest.clearAllMocks());

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
