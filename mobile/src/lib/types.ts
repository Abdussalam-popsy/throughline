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

export interface RecipientOption {
  key: string;
  label: string;
}

export interface SendResult {
  recipient: string;
  previewUrl?: string;
}
