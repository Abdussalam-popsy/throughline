import { Router } from "express";
import { classifyDomain, processEntry } from "../services/ai";
import { getResourceForDomain } from "../services/resources";

export const entryRouter = Router();

// Call 0 — quick domain triage. A lightweight LLM check the app runs BEFORE
// storing an entry, so the entry is tagged with the right domain up front.
entryRouter.post("/domain", async (req, res) => {
  const { text } = req.body ?? {};
  if (typeof text !== "string" || text.trim().length === 0)
    return res.status(400).json({ error: "entry text required" });
  const domain = await classifyDomain(text.trim());
  res.json({ domain });
});

// Call 1 — reflect + domain. Returns the analysis plus a matching institutional
// resource (null for "general" or for crisis, where the app suppresses it).
entryRouter.post("/process", async (req, res) => {
  const { recent, today, stressors } = req.body ?? {};
  if (typeof today !== "string" || today.trim().length === 0)
    return res.status(400).json({ error: "today entry text required" });
  const analysis = await processEntry(
    Array.isArray(recent) ? recent : [],
    today,
    Array.isArray(stressors) ? stressors : []
  );
  const resource =
    analysis.risk_level === "crisis"
      ? null
      : getResourceForDomain(analysis.domain);
  res.json({ analysis, resource });
});
