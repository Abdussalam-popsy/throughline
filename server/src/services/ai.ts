import Anthropic from "@anthropic-ai/sdk";
import { BRIEF_SYSTEM, DOMAIN_SYSTEM, ENTRY_SYSTEM, ROUTE_SYSTEM } from "../lib/prompts";
import type {
  BriefDestination,
  Entry,
  EntryAnalysis,
  ExtractedStressor,
  RelatedStressor,
  RiskLevel,
  RouteSuggestion,
  Domain,
} from "../lib/types";
import { config } from "../config";

// Standard key -> general endpoint. If using the sk-sp- CODING key, switch base to:
//   https://api.z.ai/api/coding/paas/v4/chat/completions
const GLM_URL = config.glm.baseUrl;
const GLM_MODEL = config.glm.model;

async function glmChat(system: string, user: string): Promise<string> {
  const res = await fetch(GLM_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.glm.apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`GLM ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  return data.choices[0].message.content;
}

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
async function claudeChat(system: string, user: string): Promise<string> {
  const m = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    system,
    messages: [{ role: "user", content: user }],
  });
  return m.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("");
}

function stripFences(raw: string): string {
  return raw.replace(/```json|```/g, "").trim();
}

const VALID_RISK: RiskLevel[] = ["none", "elevated", "crisis"];
const VALID_DOMAIN: Domain[] = [
  "exam_stress",
  "body_image",
  "loneliness",
  "financial_anxiety",
  "general",
];

/** Keep only well-formed stressors, cap at 3, and de-dupe by label (case-insensitive). */
function parseStressors(raw: unknown): ExtractedStressor[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: ExtractedStressor[] = [];
  for (const s of raw) {
    const label = typeof s?.label === "string" ? s.label.trim() : "";
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const domain: Domain = VALID_DOMAIN.includes(s?.domain) ? s.domain : "general";
    out.push({ label, domain });
    if (out.length === 3) break;
  }
  return out;
}

/**
 * Resolve the single stressor an entry relates to. The model proposes a label;
 * the server decides `isNew` authoritatively by matching (case-insensitively)
 * against the user's existing stressors, so the flag can't drift from reality.
 */
function parseRelatedStressor(
  raw: unknown,
  existing: ExtractedStressor[]
): RelatedStressor | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as { label?: unknown; domain?: unknown };
  const label = typeof r.label === "string" ? r.label.trim() : "";
  if (!label) return null;
  const domain: Domain = VALID_DOMAIN.includes(r.domain as Domain)
    ? (r.domain as Domain)
    : "general";
  const isNew = !existing.some(
    (s) => s.label.toLowerCase() === label.toLowerCase()
  );
  return { label, domain, isNew };
}

/**
 * Cross-cutting rule 7 (fail safe): if JSON fails to parse or risk_level is
 * missing/invalid, treat the entry as "elevated" and show support. Crisis
 * forces an empty next_prompt regardless of what the model returned.
 */
function safeParseAnalysis(
  raw: string,
  existingStressors: ExtractedStressor[] = []
): EntryAnalysis {
  const fallback: EntryAnalysis = {
    next_prompt: "",
    risk_level: "elevated",
    risk_rationale: "Analysis was unavailable, defaulting to a supportive stance.",
    themes: [],
    domain: "general",
    stressors: [],
    related_stressor: null,
  };
  let parsed: Partial<EntryAnalysis>;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch {
    return fallback;
  }
  if (!parsed || !VALID_RISK.includes(parsed.risk_level as RiskLevel)) {
    return fallback;
  }
  const analysis: EntryAnalysis = {
    next_prompt: typeof parsed.next_prompt === "string" ? parsed.next_prompt : "",
    risk_level: parsed.risk_level as RiskLevel,
    risk_rationale:
      typeof parsed.risk_rationale === "string" ? parsed.risk_rationale : "",
    themes: Array.isArray(parsed.themes) ? parsed.themes : [],
    domain: (parsed.domain as EntryAnalysis["domain"]) ?? "general",
    stressors: parseStressors((parsed as { stressors?: unknown }).stressors),
    related_stressor: parseRelatedStressor(
      (parsed as { related_stressor?: unknown }).related_stressor,
      existingStressors
    ),
  };
  if (analysis.risk_level === "crisis") analysis.next_prompt = "";
  return analysis;
}

/**
 * Quick, single-purpose domain triage. A lightweight LLM check that decides which
 * domain a fresh entry fits into, BEFORE the entry is stored. Fails safe to
 * "general" on any transport or parse error, so the caller always gets a domain.
 */
export async function classifyDomain(text: string): Promise<Domain> {
  let raw: string;
  try {
    // raw = await glmChat(DOMAIN_SYSTEM, text);
    raw = await claudeChat(DOMAIN_SYSTEM, text);
  } catch {
    return "general";
  }
  const cleaned = stripFences(raw);
  // Prefer the JSON shape, but tolerate a bare domain word if the model drifts.
  try {
    const parsed = JSON.parse(cleaned) as { domain?: unknown };
    if (VALID_DOMAIN.includes(parsed.domain as Domain)) {
      return parsed.domain as Domain;
    }
  } catch {
    const word = cleaned.replace(/["'.\s]/g, "") as Domain;
    if (VALID_DOMAIN.includes(word)) return word;
  }
  return "general";
}

export async function processEntry(
  recent: Entry[],
  today: string,
  existingStressors: ExtractedStressor[] = []
): Promise<EntryAnalysis> {
  const ctx = recent.map((e) => `[${e.date}] ${e.text}`).join("\n\n");
  const stressorContext = existingStressors.length
    ? `\n\nExisting stressors (reuse a label verbatim if today's entry is about it):\n` +
      existingStressors.map((s) => `- ${s.label} [${s.domain}]`).join("\n")
    : "";
  let raw: string;
  try {
    // raw = await glmChat(
    //   ENTRY_SYSTEM,
    //   `Recent entries:\n${ctx}\n\nToday's entry:\n${today}${stressorContext}`
    // );
    raw = await claudeChat(
      ENTRY_SYSTEM,
      `Recent entries:\n${ctx}\n\nToday's entry:\n${today}${stressorContext}`
    );
  } catch {
    // Even on transport failure we fail safe rather than throw.
    return safeParseAnalysis("", existingStressors);
  }
  return safeParseAnalysis(raw, existingStressors);
}

export async function routeBrief(
  themes: string[],
  riskLevel: RiskLevel,
  concern?: string
): Promise<RouteSuggestion> {
  const user = [
    `Recent themes: ${themes.length ? themes.join(", ") : "(none yet)"}`,
    `Latest risk_level: ${riskLevel}`,
    concern ? `Self-described concern: ${concern}` : null,
  ]
    .filter(Boolean)
    .join("\n");
  // const raw = await glmChat(ROUTE_SYSTEM, user);
  const raw = await claudeChat(ROUTE_SYSTEM, user);
  return JSON.parse(stripFences(raw)) as RouteSuggestion;
}

export async function generateBrief(
  entries: Entry[],
  opts: { destination?: BriefDestination; generatedDate?: string } = {}
): Promise<string> {
  const destination = opts.destination ?? "gp_or_talking_therapies";
  const generatedDate = opts.generatedDate ?? new Date().toISOString().slice(0, 10);
  const system = BRIEF_SYSTEM.replace(/\{\{destination\}\}/g, destination).replace(
    /\{\{generated_date\}\}/g,
    generatedDate
  );
  const body = entries.map((e) => `[${e.date}] ${e.text}`).join("\n\n");
  // Brief generation uses Claude Sonnet; GLM is disabled here until the Z.ai balance is restored.
  // return glmChat(system, `Here are the student's journal entries:\n\n${body}`);
  return claudeChat(system, `Here are the student's journal entries:\n\n${body}`);
}
