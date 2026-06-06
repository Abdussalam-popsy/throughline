export type RiskLevel = "none" | "elevated" | "crisis";

export interface Entry {
  id: string;
  date: string; // ISO date, e.g. "2026-05-15"
  promptShown?: string;
  text: string;
  riskLevel?: RiskLevel;
  themes?: string[];
  createdAt: number;
}

export interface EntryAnalysis {
  next_prompt: string;
  risk_level: RiskLevel;
  risk_rationale: string;
  themes: string[];
}

export interface GenerateBriefRequest {
  entries: Entry[];
}

export interface GenerateBriefResponse {
  briefMarkdown: string;
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
