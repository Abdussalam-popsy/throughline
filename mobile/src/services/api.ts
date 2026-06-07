import type {
  BriefDestination,
  Domain,
  Entry,
  ExtractedStressor,
  ProcessEntryResult,
  RiskLevel,
  RouteSuggestion,
  SendResult,
  SupportResult,
  Tip,
  University,
} from "../lib/types";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// The full, alphabetised list of universities for the "Select your university"
// dropdown. The server owns the contact data; on any error we return an empty
// list so the picker can show a quiet retry state rather than crashing.
export async function fetchUniversitiesApi(): Promise<University[]> {
  try {
    const r = await fetch(`${BASE}/api/universities`);
    if (!r.ok) throw new Error("universities failed");
    return (await r.json()).universities ?? [];
  } catch (error) {
    console.error("Error in fetchUniversitiesApi:", error);
    return [];
  }
}

// One curated coping tip for a domain (from the tips backend). The server owns
// all tip content; on any error we return null and the UI shows a quiet note
// rather than fabricating a tip.
export async function fetchTipApi(domain: Domain): Promise<Tip | null> {
  try {
    const r = await fetch(`${BASE}/api/entry/tip?domain=${encodeURIComponent(domain)}`);
    if (!r.ok) throw new Error("tip failed");
    return (await r.json()).tip ?? null;
  } catch {
    return null;
  }
}

// Call 0 — quick domain triage. Run before saving an entry so it's tagged with
// the right domain. Fails safe to "general" if the backend is unreachable.
export async function classifyDomainApi(text: string): Promise<Domain> {
  try {
    const r = await fetch(`${BASE}/api/entry/domain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error("domain failed");
    return (await r.json()).domain;
  } catch (error) {
    console.error("Error in classifyDomainApi:", error);
    throw error;
    return "general";
  }
}

// Call 1 — reflect + domain (per entry). Returns the analysis only; the support
// bundle (tip + grounding) is fetched separately via fetchSupportApi. Fails safe
// to an elevated result if the backend is unreachable, so the UI never sticks.
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
    };
  }
}

// The result-screen support bundle: a domain tip + a matching grounding technique.
// The server decides what is sent (both null on crisis). The frontend keeps no
// hardcoded content — on any error we return nulls and the UI shows a quiet note.
export async function fetchSupportApi(
  domain: Domain,
  riskLevel: RiskLevel
): Promise<SupportResult> {
  try {
    const r = await fetch(`${BASE}/api/entry/support`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain, riskLevel }),
    });
    if (!r.ok) throw new Error("support failed");
    const data = await r.json();
    return { tip: data.tip ?? null, grounding: data.grounding ?? null };
  } catch {
    return { tip: null, grounding: null };
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
