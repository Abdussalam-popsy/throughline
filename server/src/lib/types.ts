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

export interface EntryAnalysis {
  next_prompt: string;
  risk_level: RiskLevel;
  risk_rationale: string;
  themes: string[];
  domain: Domain;
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
