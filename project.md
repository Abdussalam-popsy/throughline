# Throughline — Build Spec (`project.md`)

> Turns weeks of private journaling into a one-page brief a GP/uni service can read in 30 seconds.
> **The product is the brief, not the journal. The demo leads with the brief.**

Stack: **Expo (React Native, TypeScript) + Express (TypeScript)**, package manager **yarn**, AI on **Z.AI GLM** (Claude wired but commented).

---

## Monorepo layout

Two independent apps, one repo. Types are duplicated per side on purpose — a shared package isn't worth the wiring in 24h.

```
throughline/
├─ mobile/                       # Expo app (frontend)
│  ├─ app/                       # expo-router screens — each screen owns its UI
│  │  ├─ _layout.tsx             # tab nav: Today / Timeline / Brief / Support
│  │  ├─ index.tsx               # Today: entry box + AI continuity prompt
│  │  ├─ timeline.tsx            # past entries + simple mood thread
│  │  ├─ brief.tsx               # generate → review → consent → send
│  │  └─ support.tsx             # NHS/uni signposting + crisis card
│  ├─ src/
│  │  ├─ services/
│  │  │  ├─ storage.ts           # expo-sqlite CRUD for entries
│  │  │  └─ api.ts               # typed client for the backend
│  │  ├─ hooks/
│  │  │  ├─ useEntries.ts        # load/add entries
│  │  │  └─ useBriefSender.ts    # idle→generating→review→sending→success
│  │  └─ lib/
│  │     ├─ types.ts
│  │     └─ recipients.ts        # display list of uni/NHS targets (keys only)
│  ├─ __tests__/
│  │  ├─ useBriefSender.test.tsx
│  │  └─ storage.test.ts
│  ├─ app.json · package.json · tsconfig.json · jest.config.js
│
├─ server/                       # Express API (backend)
│  ├─ src/
│  │  ├─ index.ts                # exports `app`, listens only when run directly (so tests can import it)
│  │  ├─ routes/brief.ts         # POST /api/brief/generate · POST /api/brief/send
│  │  ├─ services/
│  │  │  ├─ ai.ts                # GLM (primary) + Claude (commented). generateBrief() + processEntry()
│  │  │  ├─ nhs.ts               # NHS Service Search by postcode + hardcoded fallback
│  │  │  ├─ pdf.ts               # markdown → HTML → PDF (puppeteer)
│  │  │  └─ email.ts             # nodemailer; Ethereal by default (safe), real SMTP via env
│  │  ├─ lib/
│  │  │  ├─ prompts.ts           # BRIEF_SYSTEM + ENTRY_SYSTEM
│  │  │  ├─ types.ts
│  │  │  └─ recipients.ts        # ALLOWLIST: key → real email. Prevents open relay.
│  │  └─ config.ts               # env access in one place
│  ├─ __tests__/
│  │  ├─ ai.test.ts
│  │  ├─ nhs.test.ts
│  │  └─ sendBrief.route.test.ts
│  ├─ .env.example · package.json · tsconfig.json · jest.config.js
└─ README.md
```

**Component rule (as requested):** a screen's UI lives *in that screen file*. Only promote something to `src/components/` if it's used in **2+ screens**. As specced, nothing qualifies — so there is no `components/` folder. Don't create one speculatively.

---

## API contract (the only coupling between the two apps)

```
POST /api/brief/generate
  body:  { entries: Entry[] }
  200:   { briefMarkdown: string }          // app displays this; nothing sent yet

POST /api/brief/send
  body:  { briefMarkdown: string, recipientKey: string,
           patientName: string, consentTimestamp: string }
  200:   { success: true, recipient: string, previewUrl?: string }
```

Two endpoints, not one — generation and sending are split so the user **reviews and consents** before anything leaves. The app never sends a raw email address; it sends a `recipientKey` the backend resolves against its allowlist.

---

## Backend

### `src/lib/prompts.ts`
```ts
export const BRIEF_SYSTEM = `
You generate a one-page brief a STUDENT chooses to share with a GP or counsellor.
Built FROM their own journal entries, in their own words, to save the clinician time.
NOT a diagnosis. NO clinical conclusions. You surface patterns and flag areas to explore.

Output Markdown, skimmable in <30s:
## Summary
One neutral factual line.
## Timeline
When it started and the trajectory (improving/worsening/steady), from the dates.
## Recurring themes
Each with rough frequency, e.g. "Sleep difficulty — 6 of 13 entries".
## Functioning signals
ONLY if mentioned (sleep, appetite, attendance, withdrawal, concentration). Never inferred.
## In their words
2-3 short verbatim quotes.
## Areas the student may want to discuss
2-4 items as questions/areas — NEVER diagnoses or condition names.
---
*Prepared by the student from personal journal entries via Throughline. Not a clinical assessment.*

Rules: never diagnose or name a condition; never invent details; plain language; quote verbatim where it adds signal.
`.trim();

export const ENTRY_SYSTEM = `
You are the reflection engine inside Throughline. NOT a therapist or chatbot. You NEVER give
advice, therapy, or coping strategies. Three jobs: next prompt, risk level, theme tags.
Return ONLY valid JSON:
{ "next_prompt": string,   // one warm open question referencing a CONCRETE detail they wrote;
                           // max 25 words; never "how are you feeling?"; "" if crisis
  "risk_level": "none" | "elevated" | "crisis",
  "risk_rationale": string,
  "themes": string[] }
crisis = explicit suicidal thoughts/intent/plan, active self-harm, immediate danger → next_prompt MUST be "".
elevated = persistent low mood/anxiety/hopelessness across entries, no immediate danger.
Be conservative. Ground everything in their own words.
`.trim();
```

### `src/services/ai.ts`
```ts
import { BRIEF_SYSTEM, ENTRY_SYSTEM } from "../lib/prompts";
import type { Entry, EntryAnalysis } from "../lib/types";

// Standard key → general endpoint. If using the sk-sp- CODING key, switch base to:
//   https://api.z.ai/api/coding/paas/v4/chat/completions
const GLM_URL   = process.env.GLM_BASE_URL ?? "https://api.z.ai/api/paas/v4/chat/completions";
const GLM_MODEL = process.env.GLM_MODEL ?? "glm-5.1";

async function glmChat(system: string, user: string): Promise<string> {
  const res = await fetch(GLM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GLM_API_KEY}` },
    body: JSON.stringify({ model: GLM_MODEL, messages: [
      { role: "system", content: system }, { role: "user", content: user } ] }),
  });
  if (!res.ok) throw new Error(`GLM ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message.content as string;
}

/* --- BACKUP: Anthropic Claude. Uncomment + `yarn add @anthropic-ai/sdk` if GLM stalls on stage. ---
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
async function claudeChat(system: string, user: string): Promise<string> {
  const m = await anthropic.messages.create({
    model: "claude-sonnet-4-5", max_tokens: 2000, system,
    messages: [{ role: "user", content: user }],
  });
  return m.content.filter(b => b.type === "text").map(b => (b as any).text).join("");
}
*/

export async function generateBrief(entries: Entry[]): Promise<string> {
  const body = entries.map(e => `[${e.date}] ${e.text}`).join("\n\n");
  return glmChat(BRIEF_SYSTEM, `Here are the student's journal entries:\n\n${body}`);
  // return claudeChat(BRIEF_SYSTEM, `Here are the student's journal entries:\n\n${body}`);
}

export async function processEntry(recent: Entry[], today: string): Promise<EntryAnalysis> {
  const ctx = recent.map(e => `[${e.date}] ${e.text}`).join("\n\n");
  const raw = await glmChat(ENTRY_SYSTEM, `Recent entries:\n${ctx}\n\nToday's entry:\n${today}`);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}
```

### `src/services/nhs.ts`
NHS Service Search needs a free instant key (`developer.api.nhs.uk` → Service Search API). Live lookup with a hardcoded fallback so the demo never depends on a flaky external call.
```ts
type NhsService = { name: string; phone?: string; email?: string };

const FALLBACK: NhsService[] = [
  { name: "Camden & Islington Talking Therapies (iCope)", phone: "020 3317 6670", email: "candi.talkingtherapies@nhs.net" },
];

export async function findTalkingTherapies(postcode: string): Promise<NhsService> {
  const key = process.env.NHS_SERVICE_SEARCH_KEY;
  if (!key) return FALLBACK[0];
  try {
    const res = await fetch(
      "https://api.nhs.uk/service-search/search-postcode-or-place?api-version=2",
      { method: "POST",
        headers: { "subscription-key": key, "Content-Type": "application/json" },
        // confirm exact body shape in the NHS docs; filter to mental-health trusts
        body: JSON.stringify({ filter: "OrganisationTypeID eq 'MHT'", top: 1, postcode }) });
    if (!res.ok) return FALLBACK[0];
    const j = await res.json();
    const s = j?.value?.[0];
    return s ? { name: s.OrganisationName, phone: s.Phone, email: s.Email } : FALLBACK[0];
  } catch { return FALLBACK[0]; }
}
```

### `src/lib/recipients.ts` — allowlist (security: prevents open relay)
```ts
export type Recipient = { key: string; label: string; email: string };
const RECIPIENTS: Recipient[] = [
  { key: "ucl-counselling", label: "UCL Student Psychological & Counselling Services", email: "spcs-info@ucl.ac.uk" },
  { key: "ucl-mh-society",  label: "UCL Mental Health Society",                        email: "su.mental.health.society@ucl.ac.uk" },
  { key: "candi-icope",     label: "Camden & Islington Talking Therapies (iCope)",     email: "candi.talkingtherapies@nhs.net" },
];
export const recipientList = () => RECIPIENTS.map(({ key, label }) => ({ key, label }));
export const resolveRecipient = (key: string) => RECIPIENTS.find(r => r.key === key) ?? null;
```

### `src/services/pdf.ts`
```ts
import puppeteer from "puppeteer";
import { marked } from "marked";

export async function briefToPdf(briefMarkdown: string, name: string): Promise<Buffer> {
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;padding:40px;color:#1a1a1a;line-height:1.55}
    h1{font-size:20px} h2{border-bottom:1px solid #eee;padding-bottom:4px;margin-top:22px;font-size:15px}
    blockquote{color:#555;border-left:3px solid #ddd;padding-left:12px;margin-left:0}
    </style><h1>${name} — Self-Prepared Summary</h1>${marked.parse(briefMarkdown)}`;
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();
  return pdf as Buffer;
}
```

### `src/services/email.ts` — Ethereal by default (NEVER hits real inboxes)
```ts
import nodemailer from "nodemailer";

async function transport() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! } });
  }
  const t = await nodemailer.createTestAccount();           // demo: fake inbox + preview URL
  return nodemailer.createTransport({ host: "smtp.ethereal.email", port: 587, auth: { user: t.user, pass: t.pass } });
}

export async function emailBrief(to: string, name: string, pdf: Buffer) {
  const tx = await transport();
  const info = await tx.sendMail({
    from: '"Throughline" <noreply@throughline.app>',
    to, subject: `Mental health summary shared by ${name}`,
    text: `${name} has chosen to share a self-prepared mental-health summary ahead of seeking support. PDF attached.`,
    attachments: [{ filename: "throughline-brief.pdf", content: pdf }],
  });
  return { previewUrl: nodemailer.getTestMessageUrl(info) || undefined };  // open this on stage
}
```

### `src/routes/brief.ts`
```ts
import { Router } from "express";
import { generateBrief } from "../services/ai";
import { briefToPdf } from "../services/pdf";
import { emailBrief } from "../services/email";
import { resolveRecipient } from "../lib/recipients";

export const briefRouter = Router();

briefRouter.post("/generate", async (req, res) => {
  const { entries } = req.body;
  if (!Array.isArray(entries) || entries.length === 0) return res.status(400).json({ error: "entries required" });
  try { res.json({ briefMarkdown: await generateBrief(entries) }); }
  catch { res.status(502).json({ error: "brief generation failed" }); }
});

briefRouter.post("/send", async (req, res) => {
  const { briefMarkdown, recipientKey, patientName, consentTimestamp } = req.body;
  if (!briefMarkdown || !recipientKey || !patientName || !consentTimestamp)
    return res.status(400).json({ error: "missing fields" });
  const recipient = resolveRecipient(recipientKey);
  if (!recipient) return res.status(400).json({ error: "unknown recipient" });
  try {
    const pdf = await briefToPdf(briefMarkdown, patientName);
    const { previewUrl } = await emailBrief(recipient.email, patientName, pdf);
    res.json({ success: true, recipient: recipient.label, previewUrl });
  } catch { res.status(502).json({ error: "send failed" }); }
});
```

### `src/index.ts` (export `app` so tests can import without binding a port)
```ts
import express from "express";
import cors from "cors";
import { briefRouter } from "./routes/brief";

export const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api/brief", briefRouter);

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`server on :${port}`));
}
```

---

## Frontend

### `src/services/storage.ts`
```ts
import * as SQLite from "expo-sqlite";
import type { Entry } from "../lib/types";

const db = SQLite.openDatabaseSync("throughline.db");
db.execSync(`CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, promptShown TEXT, text TEXT NOT NULL,
  riskLevel TEXT, themes TEXT, createdAt INTEGER );`);

export function addEntry(e: Entry) {
  db.runSync(`INSERT OR REPLACE INTO entries VALUES (?,?,?,?,?,?,?)`,
    [e.id, e.date, e.promptShown, e.text, e.riskLevel ?? "none", JSON.stringify(e.themes ?? []), e.createdAt]);
}
export function getEntries(): Entry[] {
  return db.getAllSync<any>(`SELECT * FROM entries ORDER BY date ASC`)
           .map(r => ({ ...r, themes: JSON.parse(r.themes || "[]") }));
}
```

### `src/hooks/useBriefSender.ts`
```ts
import { useState } from "react";
import { generateBriefApi, sendBriefApi } from "../services/api";
import type { Entry } from "../lib/types";

type Status = "idle" | "generating" | "review" | "sending" | "success" | "error";

export function useBriefSender() {
  const [status, setStatus] = useState<Status>("idle");
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState<{ recipient: string; previewUrl?: string } | null>(null);

  async function generate(entries: Entry[]) {
    setStatus("generating");
    try { setBrief(await generateBriefApi(entries)); setStatus("review"); } catch { setStatus("error"); }
  }
  async function send(recipientKey: string, patientName: string) {
    setStatus("sending");
    try {
      setResult(await sendBriefApi({ briefMarkdown: brief, recipientKey, patientName, consentTimestamp: new Date().toISOString() }));
      setStatus("success");
    } catch { setStatus("error"); }
  }
  return { status, brief, result, generate, send };
}
```

### `src/services/api.ts`
```ts
import type { Entry } from "../lib/types";
const BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function generateBriefApi(entries: Entry[]): Promise<string> {
  const r = await fetch(`${BASE}/api/brief/generate`, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries }) });
  if (!r.ok) throw new Error("generate failed");
  return (await r.json()).briefMarkdown;
}
export async function sendBriefApi(p: { briefMarkdown: string; recipientKey: string; patientName: string; consentTimestamp: string }) {
  const r = await fetch(`${BASE}/api/brief/send`, { method: "POST",
    headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
  if (!r.ok) throw new Error("send failed");
  return r.json();
}
```

Screens (`app/*.tsx`) own their layout/markup inline. `brief.tsx` drives `useBriefSender`: button → `generate()` → render the returned markdown for review → recipient picker (from `recipients.ts`) + consent checkbox → `send()` → success state showing the recipient and, in demo mode, the Ethereal preview link.

---

## Testing (this is a graded dimension — wire it from the start)

**Backend** — `ts-jest` + `supertest`, all network mocked:
```ts
// __tests__/ai.test.ts
import { generateBrief } from "../src/services/ai";
beforeEach(() => { (global as any).fetch = jest.fn(async () => ({
  ok: true, json: async () => ({ choices: [{ message: { content: "## Summary\nlow mood" } }] }) })); });
test("generateBrief returns model content", async () => {
  const out = await generateBrief([{ id:"1", date:"2026-05-15", text:"bad day", createdAt:0 } as any]);
  expect(out).toContain("Summary"); expect(fetch).toHaveBeenCalled();
});
```
```ts
// __tests__/sendBrief.route.test.ts
import request from "supertest";
import { app } from "../src/index";
jest.mock("../src/services/ai", () => ({ generateBrief: async () => "## Summary\nok" }));
test("generate returns markdown", async () => {
  const r = await request(app).post("/api/brief/generate").send({ entries: [{ date:"x", text:"y" }] });
  expect(r.status).toBe(200); expect(r.body.briefMarkdown).toContain("Summary");
});
test("empty entries rejected", async () => {
  const r = await request(app).post("/api/brief/generate").send({ entries: [] });
  expect(r.status).toBe(400);
});
```

**Frontend** — `jest-expo` + `@testing-library/react-native`:
```ts
// __tests__/useBriefSender.test.tsx
import { renderHook, act } from "@testing-library/react-native";
import { useBriefSender } from "../src/hooks/useBriefSender";
jest.mock("../src/services/api", () => ({
  generateBriefApi: async () => "## Summary\nok",
  sendBriefApi: async () => ({ recipient: "UCL", previewUrl: "http://x" }) }));
test("generate → review with brief", async () => {
  const { result } = renderHook(() => useBriefSender());
  await act(async () => { await result.current.generate([{ date:"x", text:"y" } as any]); });
  expect(result.current.status).toBe("review");
  expect(result.current.brief).toContain("Summary");
});
```

Run: `yarn test` in each folder.

---

## Setup

**Backend**
```bash
mkdir server && cd server && yarn init -y
yarn add express cors marked puppeteer nodemailer
yarn add -D typescript ts-node @types/express @types/node @types/cors @types/nodemailer \
            jest ts-jest @types/jest supertest @types/supertest
npx tsc --init
# package.json scripts: "dev": "ts-node src/index.ts", "test": "jest"
# jest.config.js: { preset: "ts-jest", testEnvironment: "node" }
cp .env.example .env   # fill GLM_API_KEY
```

**Frontend**
```bash
cd .. && yarn create expo-app mobile -t expo-template-blank-typescript
cd mobile
yarn add expo-router expo-sqlite expo-print expo-mail-composer expo-sharing
yarn add -D jest jest-expo @testing-library/react-native @types/jest
# package.json: "main": "expo-router/entry", "test": "jest", "jest": { "preset": "jest-expo" }
# app.json: add a "scheme" for expo-router
# .env: EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:3000   (not localhost on a physical device)
```

### `server/.env.example`
```
PORT=3000
GLM_API_KEY=your-zai-key
GLM_BASE_URL=https://api.z.ai/api/paas/v4/chat/completions   # coding key? use .../api/coding/paas/v4/chat/completions
GLM_MODEL=glm-5.1
# ANTHROPIC_API_KEY=          # only if you uncomment Claude in ai.ts
# NHS_SERVICE_SEARCH_KEY=     # free, instant at developer.api.nhs.uk; omit → hardcoded fallback
# --- leave SMTP_* unset for the safe Ethereal demo inbox. Set ALL to send for real: ---
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
```

---

## Build order (brief-first — do not reorder)

1. **Backend `ai.ts` + `prompts.ts` + `/api/brief/generate`.** Hit it with the seed entries via curl. Tune until the brief is clinical-grade. *Nothing else matters until this is sharp.*
2. **Frontend `brief.tsx` generate path** — display the returned markdown. Now you have the demo's money shot end-to-end.
3. `pdf.ts` + `email.ts` + `/api/brief/send` + the review/consent/send UI. Open the Ethereal preview to prove delivery.
4. `storage.ts` + `index.tsx` (Today) + `useEntries` + Call 1 (`processEntry`) for the continuity prompt.
5. `timeline.tsx`, `support.tsx` (signposting + crisis card driven by `risk_level`).
6. Polish Today, load the 14 seed entries as the demo account, rehearse the 3-minute run.

---

## Safety / demo notes (these are also rubric points)

- **Never point SMTP at a real NHS/uni inbox during the build.** Ethereal default = a preview link you show on screen. Real send only with permission, ideally to your own address for the demo.
- **Allowlist stays.** The app sends a `recipientKey`, never a raw address — don't "simplify" this away.
- **Crisis path:** if `risk_level === "crisis"`, `support.tsx` shows the crisis line immediately and the brief-send flow should warn, not silently email. AI escalates to humans; it never counsels. Say this out loud in Q&A.
- **Privacy line:** entries live on-device (`expo-sqlite`); they transit a stateless backend only on explicit consent and are never stored server-side. That's your answer to "so it goes to a server?"
