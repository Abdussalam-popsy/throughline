export type RiskLevel = "none" | "elevated" | "crisis";

export type Domain =
  | "exam_stress"
  | "body_image"
  | "loneliness"
  | "financial_anxiety"
  | "general";

export type Destination =
  | "crisis"
  | "wellbeing_team"
  | "gp_or_talking_therapies"
  | "trusted_contact"
  | "not_yet";

export type BriefFormat =
  | "extenuating_circumstances"
  | "clinical_intake"
  | "plain_share"
  | "none";

export interface Entry {
  id: string;
  date: string; // ISO date, e.g. "2026-05-15"
  promptShown?: string;
  text: string;
  riskLevel?: RiskLevel;
  themes?: string[];
  domain?: Domain;
  createdAt: number;
}

/** A source of stress the model extracted from an entry, in the user's framing. */
export interface ExtractedStressor {
  label: string;
  domain: Domain;
}

/**
 * The single stressor a new entry is primarily about. The model chooses an
 * existing stressor (reusing its label) when the entry is about it, otherwise
 * names a new one. `isNew` is decided server-side against the existing list.
 */
export interface RelatedStressor extends ExtractedStressor {
  isNew: boolean;
}

export interface EntryAnalysis {
  next_prompt: string;
  risk_level: RiskLevel;
  risk_rationale: string;
  themes: string[];
  domain: Domain;
  // Concrete stressors the model surfaced from today's entry. Optional so older
  // callers/mocks that predate stressor extraction still typecheck.
  stressors?: ExtractedStressor[];
  // The one stressor this entry relates to (existing or new), or null if none
  // is clear. Drives the per-entry stressor link / "stressor added" tag.
  related_stressor?: RelatedStressor | null;
}

export interface RouteSuggestion {
  primary_destination: Destination;
  brief_format: BriefFormat;
  rationale: string;
  confidence: "low" | "medium" | "high";
}

export interface Resource {
  domain: string;
  title: string;
  source: string;
  snippet: string;
  url?: string;
}

/** Recipient context the BRIEF_SYSTEM prompt is rendered against. */
export type BriefDestination =
  | "wellbeing_team"
  | "gp_or_talking_therapies"
  | "trusted_contact"
  | "extenuating_circumstances";

export interface GenerateBriefRequest {
  entries: Entry[];
  destination?: BriefDestination;
  generatedDate?: string;
}

export interface GenerateBriefResponse {
  briefMarkdown: string;
}

export interface ProcessEntryRequest {
  recent: Entry[];
  today: string;
}

export interface ProcessEntryResponse {
  analysis: EntryAnalysis;
  resource: Resource | null;
}

export interface RouteBriefRequest {
  themes: string[];
  riskLevel: RiskLevel;
  concern?: string;
}

export interface SendBriefRequest {
  briefMarkdown: string;
  recipientKey: string;
  patientName: string;
  consentTimestamp: string;
}

export interface SendBriefResponse {
  success: true;
  recipient: string;
  previewUrl?: string;
}
