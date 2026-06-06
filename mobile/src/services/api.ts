import type { Entry, SendResult } from "../lib/types";

const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function generateBriefApi(entries: Entry[]): Promise<string> {
  const r = await fetch(`${BASE}/api/brief/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entries }),
  });
  if (!r.ok) throw new Error("generate failed");
  return (await r.json()).briefMarkdown;
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
