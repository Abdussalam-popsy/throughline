import type {
  BriefDestination,
  Entry,
  ExtractedStressor,
  ProcessEntryResult,
  RiskLevel,
  RouteSuggestion,
  SendResult,
} from "../lib/types";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// Call 1 — reflect + domain (per entry). Fails safe to an elevated, no-resource
// result if the backend is unreachable, so the UI never gets stuck.
export async function processEntryApi(
  recent: Entry[],
  today: string,
  stressors: ExtractedStressor[] = []
): Promise<ProcessEntryResult> {
  try {
    const r = await fetch(`${BASE}/api/entry/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recent, today, stressors }),
    });
    if (!r.ok) throw new Error("process failed");
    return r.json();
  } catch {
    return {
      analysis: {
        next_prompt: "",
        risk_level: "elevated",
        risk_rationale: "Reflection was unavailable.",
        themes: [],
        domain: "general",
        stressors: [],
        related_stressor: null,
      },
      resource: null,
    };
  }
}

// Call 2 — propose a destination category (on demand).
export async function routeBriefApi(
  themes: string[],
  riskLevel: RiskLevel,
  concern?: string
): Promise<RouteSuggestion> {
  const r = await fetch(`${BASE}/api/brief/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ themes, riskLevel, concern }),
  });
  if (!r.ok) throw new Error("route failed");
  return (await r.json()).route;
}

// Call 3 — generate the recipient-aware one-pager (on demand).
export async function generateBriefApi(
  entries: Entry[],
  destination?: BriefDestination
): Promise<string> {
  try {
    console.log("generateBriefApi", entries, destination);
    const r = await fetch(`${BASE}/api/brief/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries, destination }),
    });
    if (!r.ok) throw new Error("generate failed");
    return (await r.json()).briefMarkdown;
  } catch (error) {
    console.error("Error in generateBriefApi:", error);
    throw error;
  }
}

export async function sendBriefApi(p: {
  briefMarkdown: string;
  recipientKey: string;
  patientName: string;
  consentTimestamp: string;
}): Promise<SendResult> {
  const r = await fetch(`${BASE}/api/brief/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
  });
  if (!r.ok) throw new Error("send failed");
  return r.json();
}
