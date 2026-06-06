export type RiskLevel = "none" | "elevated" | "crisis";

export type Domain =
  | "exam_stress"
  | "body_image"
  | "loneliness"
  | "financial_anxiety"
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
  createdAt: number;
}

export interface EntryAnalysis {
  next_prompt: string;
  risk_level: RiskLevel;
  risk_rationale: string;
  themes: string[];
  domain: Domain;
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
