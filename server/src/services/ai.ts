import { BRIEF_SYSTEM, ENTRY_SYSTEM } from "../lib/prompts";
import type { Entry, EntryAnalysis } from "../lib/types";
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

/* --- BACKUP: Anthropic Claude. Uncomment + `npm i @anthropic-ai/sdk` if GLM stalls on stage. ---
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
async function claudeChat(system: string, user: string): Promise<string> {
  const m = await anthropic.messages.create({
    model: "claude-sonnet-4-5", max_tokens: 2000, system,
    messages: [{ role: "user", content: user }],
  });
  return m.content.filter(b => b.type === "text").map(b => (b as any).text).join("");
}
*/

export async function generateBrief(entries: Entry[]): Promise<string> {
  const body = entries.map((e) => `[${e.date}] ${e.text}`).join("\n\n");
  return glmChat(BRIEF_SYSTEM, `Here are the student's journal entries:\n\n${body}`);
  // return claudeChat(BRIEF_SYSTEM, `Here are the student's journal entries:\n\n${body}`);
}

export async function processEntry(
  recent: Entry[],
  today: string
): Promise<EntryAnalysis> {
  const ctx = recent.map((e) => `[${e.date}] ${e.text}`).join("\n\n");
  const raw = await glmChat(
    ENTRY_SYSTEM,
    `Recent entries:\n${ctx}\n\nToday's entry:\n${today}`
  );
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
