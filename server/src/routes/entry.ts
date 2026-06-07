import { Router } from "express";
import { classifyDomain, processEntry } from "../services/ai";
import { getTipForDomain } from "../services/resources";
import { getGroundingForDomain } from "../services/grounding";

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

// Call 1 — reflect + risk. Returns the analysis only. The result-screen support
// content (tip + grounding) is assembled separately by POST /support, so the
// server owns what is sent to the client in one place.
entryRouter.post("/process", async (req, res) => {
  const { recent, today, stressors } = req.body ?? {};
  if (typeof today !== "string" || today.trim().length === 0)
    return res.status(400).json({ error: "today entry text required" });
  const analysis = await processEntry(
    Array.isArray(recent) ? recent : [],
    today,
    Array.isArray(stressors) ? stressors : []
  );
  res.json({ analysis });
});

const cleanDomain = (value: unknown): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : "general";

// Support — the single source of truth for what the result screen shows. Returns
// a domain tip + grounding technique, both null on crisis (CrisisCard-only).
entryRouter.post("/support", (req, res) => {
  const { domain, riskLevel } = req.body ?? {};
  if (riskLevel === "crisis") return res.json({ tip: null, grounding: null });
  const d = cleanDomain(domain);
  res.json({ tip: getTipForDomain(d), grounding: getGroundingForDomain(d) });
});

// Tip re-roll — drives the TipCard "Show another".
entryRouter.get("/tip", (req, res) => {
  res.json({ tip: getTipForDomain(cleanDomain(req.query.domain)) });
});
