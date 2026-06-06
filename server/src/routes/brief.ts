import { Router } from "express";
import { generateBrief, routeBrief } from "../services/ai";
import { recipientList } from "../lib/recipients";
import type { BriefDestination, RiskLevel } from "../lib/types";

export const briefRouter = Router();

briefRouter.get("/recipients", (_req, res) => {
  res.json({ recipients: recipientList() });
});

// Call 2 — propose a destination category + brief format. Decides nothing.
briefRouter.post("/route", async (req, res) => {
  const { themes, riskLevel, concern } = req.body ?? {};
  const risk: RiskLevel = ["none", "elevated", "crisis"].includes(riskLevel)
    ? riskLevel
    : "elevated"; // fail safe
  try {
    const route = await routeBrief(
      Array.isArray(themes) ? themes : [],
      risk,
      typeof concern === "string" ? concern : undefined
    );
    res.json({ route });
  } catch {
    res.status(502).json({ error: "routing failed" });
  }
});

// Call 3 — generate the recipient-aware one-pager.
briefRouter.post("/generate", async (req, res) => {
  const { entries, destination, generatedDate } = req.body ?? {};
  if (!Array.isArray(entries) || entries.length === 0)
    return res.status(400).json({ error: "entries required" });
  try {
    const briefMarkdown = await generateBrief(entries, {
      destination: destination as BriefDestination | undefined,
      generatedDate: typeof generatedDate === "string" ? generatedDate : undefined,
    });
    res.json({ briefMarkdown });
  } catch {
    res.status(502).json({ error: "brief generation failed" });
  }
});

// POST /send is wired in build-order step 3 (pdf.ts + email.ts).
