import { Router } from "express";
import { generateBrief } from "../services/ai";
import { recipientList } from "../lib/recipients";

export const briefRouter = Router();

briefRouter.get("/recipients", (_req, res) => {
  res.json({ recipients: recipientList() });
});

briefRouter.post("/generate", async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0)
    return res.status(400).json({ error: "entries required" });
  try {
    res.json({ briefMarkdown: await generateBrief(entries) });
  } catch {
    res.status(502).json({ error: "brief generation failed" });
  }
});

// POST /send is wired in build-order step 3 (pdf.ts + email.ts).
