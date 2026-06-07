import { Router } from "express";
import { getUniversity, listUniversities } from "../services/universities";

export const universitiesRouter = Router();

// The full list (alphabetised) for the "Select your university" dropdown. Each
// item carries the service contact — phone/email only when available, plus the
// always-present service URL — so the client can store it straight to SQLite.
universitiesRouter.get("/", (_req, res) => {
  res.json({ universities: listUniversities() });
});

// A single university by key. Useful for refreshing a stored selection.
universitiesRouter.get("/:key", (req, res) => {
  const university = getUniversity(req.params.key);
  if (!university) return res.status(404).json({ error: "unknown university" });
  res.json({ university });
});
