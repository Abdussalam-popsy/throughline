export type RiskLevel = "none" | "elevated" | "crisis";

export type Domain =
  | "exam_stress"
  | "body_image"
  | "loneliness"
  | "financial_anxiety"
  | "relationship_stress"
  | "identity_uncertainty"
  | "work_burnout"
  | "sleep_fatigue"
  | "self_harm"
  | "crisis"
  | "general";

export type BriefDestination =
  | "wellbeing_team"
  | "gp_or_talking_therapies"
  | "trusted_contact"
  | "extenuating_circumstances";

export interface Entry {
  id: string;
  date: string; // ISO date, e.g. "2026-05-15"
  promptShown?: string;
  text: string;
  riskLevel?: RiskLevel;
  themes?: string[];
  domain?: Domain;
  // The single source of stress this entry is about, chosen by the model at
  // submit time (never picked by the user). Undefined if none was clear.
  stressor?: string;
  createdAt: number;
}

/** A source of stress the model extracted from an entry, in the user's framing. */
export interface ExtractedStressor {
  label: string;
  domain: Domain;
}

/**
 * The single stressor the model decided an entry is primarily about. Mirrors the
 * backend contract; the app consumes `label` as the entry's `stressor` string.
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
  // Concrete stressors the model surfaced from today's entry (0-3).
  stressors?: ExtractedStressor[];
  // The one stressor this entry is primarily about; its label becomes
  // Entry.stressor. Null when no source of stress is clear.
  related_stressor?: RelatedStressor | null;
}

export interface Resource {
  domain: string;
  title: string;
  source: string;
  snippet: string;
  url?: string;
}

export interface ProcessEntryResult {
  analysis: EntryAnalysis;
  resource: Resource | null;
}

export interface RouteSuggestion {
  primary_destination:
    | "crisis"
    | "wellbeing_team"
    | "gp_or_talking_therapies"
    | "trusted_contact"
    | "not_yet";
  brief_format:
    | "extenuating_circumstances"
    | "clinical_intake"
    | "plain_share"
    | "none";
  rationale: string;
  confidence: "low" | "medium" | "high";
}

export interface RecipientOption {
  key: string;
  label: string;
}

export interface SendResult {
  recipient: string;
  previewUrl?: string;
}
