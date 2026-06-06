import request from "supertest";

jest.mock("../src/services/ai", () => ({
  generateBrief: async () => "## Summary\nok",
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

test("recipients are exposed without raw emails leaking the allowlist shape", async () => {
  const r = await request(app).get("/api/brief/recipients");
  expect(r.status).toBe(200);
  expect(Array.isArray(r.body.recipients)).toBe(true);
  expect(r.body.recipients.length).toBeGreaterThan(0);
  expect(r.body.recipients[0]).toHaveProperty("key");
  expect(r.body.recipients[0]).toHaveProperty("label");
  expect(r.body.recipients[0]).not.toHaveProperty("email");
});
