import request from "supertest";

jest.mock("../src/services/ai", () => ({
  generateBrief: async () => "## Summary\nok",
  routeBrief: async () => ({
    primary_destination: "gp_or_talking_therapies",
    brief_format: "clinical_intake",
    rationale: "you could share this with a GP or talking therapies",
    confidence: "medium",
  }),
}));

import { app } from "../src/index";

test("generate returns markdown", async () => {
  const r = await request(app)
    .post("/api/brief/generate")
    .send({ entries: [{ date: "x", text: "y" }] });
  expect(r.status).toBe(200);
  expect(r.body.briefMarkdown).toContain("Summary");
});

test("empty entries rejected", async () => {
  const r = await request(app).post("/api/brief/generate").send({ entries: [] });
  expect(r.status).toBe(400);
});

test("route proposes a destination category", async () => {
  const r = await request(app)
    .post("/api/brief/route")
    .send({ themes: ["low mood"], riskLevel: "elevated" });
  expect(r.status).toBe(200);
  expect(r.body.route.primary_destination).toBe("gp_or_talking_therapies");
  expect(r.body.route.brief_format).toBe("clinical_intake");
});

test("recipients are exposed without raw emails leaking the allowlist shape", async () => {
  const r = await request(app).get("/api/brief/recipients");
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body.recipients)).toBe(true);
  expect(r.body.recipients.length).toBeGreaterThan(0);
  expect(r.body.recipients[0]).toHaveProperty("key");
  expect(r.body.recipients[0]).toHaveProperty("label");
  expect(r.body.recipients[0]).not.toHaveProperty("email");
});
