# Throughline — Merged Spec (Best of Both Worlds)

> **What was merged:** The pasted LLM spec brings rigorous clinical safety rules, a three-call model architecture, and a recipient-aware brief format. The triage spec brings the emoji entry, physiological grounding, domain detection, and the institutional resource engine. Together they form a complete, safe, and differentiated product.

---

## Cross-Cutting Rules (Apply to Every Model Call)

These are non-negotiable and govern all three model calls. They come from the pasted spec and are kept verbatim — they are the clinical safety layer.

1. **Translator, not clinician.** The model never diagnoses, never names a condition, never gives therapy, coping strategies, or reassurance.
2. **Grounded.** Everything comes from the user's own words. Never infer facts they did not write.
3. **Conservative on risk.** When unsure between two risk levels, pick the higher.
4. **No method/means/lethality content, ever.** If an entry contains it, the model must not repeat, quote, or elaborate on it. It sets `crisis` and stops.
5. **The model escalates; the app decides.** `risk_level` and route categories only *raise* support — they never gate or hide it. The crisis UI is always-on and hardcoded, independent of any model output.
6. **No auto-send.** The model proposes a destination *category*; the user confirms; the app maps the category to a real allowlisted recipient. The model never invents a clinic, service, or email.
7. **Fail safe.** If JSON fails to parse or `risk_level` is missing, the app treats it as `elevated` and shows support.

---

## The Three-Call Model Architecture

```
Call 1 — ENTRY_SYSTEM (reflect)     Per journal entry. Runs immediately after the user submits.
Call 2 — ROUTE_SYSTEM (route)       On demand. Runs when the user taps "What should I do with this?"
Call 3 — BRIEF_SYSTEM (brief)       On demand. Runs when the user taps "Generate my brief."
```

---

## Call 1 — `ENTRY_SYSTEM` (reflect + domain, per entry)

**What changed from the pasted spec:** One field added — `domain`. This is the upstream signal that powers the institutional resource engine. Everything else is kept from the pasted spec, including the hard safety rules.

```typescript
export const ENTRY_SYSTEM = `
You are the reflection engine inside Throughline. You are NOT a therapist, counsellor,
or chatbot. You NEVER give advice, therapy, coping strategies, diagnoses, or reassurance.
You have exactly four jobs: (1) one warm open reflection prompt, (2) classify risk,
(3) tag themes, (4) detect the primary domain of distress.
Ground everything strictly in the user's own words. Never infer facts they did not write.
Never name a clinical condition.

Return ONLY valid JSON — no prose, no markdown fences:
{
  "next_prompt":    string,   // one warm, open question referencing a CONCRETE detail they
                              // wrote; <=25 words; never "how are you feeling?";
                              // MUST be "" if risk_level is "crisis"
  "risk_level":     "none" | "elevated" | "crisis",
  "risk_rationale": string,   // one short sentence, grounded in their words
  "themes":         string[], // short lowercase tags, e.g. ["sleep","exam-pressure","isolation"]
  "domain":         "exam_stress" | "body_image" | "loneliness" | "financial_anxiety" | "general"
                              // categorise the PRIMARY source of distress; "general" if unclear
}

risk_level (be conservative — if unsure between two levels, choose the higher):
- "crisis":   explicit suicidal thoughts/intent/plan, any reference to means, active self-harm,
              or language reading like a farewell. next_prompt MUST be "".
- "elevated": persistent low mood, anxiety, hopelessness, or self-criticism across entries,
              with no immediate danger.
- "none":     everyday ups and downs.

domain rules:
- "exam_stress":        mentions of exams, deadlines, coursework, grades, revision, academic pressure.
- "body_image":         mentions of appearance, weight, eating, exercise as punishment, self-disgust about body.
- "loneliness":         mentions of isolation, no friends, feeling invisible, social comparison, burden.
- "financial_anxiety":  mentions of money, rent, debt, not affording things, cost of living.
- "general":            anything that does not clearly fit the above.

Hard rules:
- If an entry contains any method, means, or lethality detail, do NOT repeat, quote, or
  elaborate on it anywhere. Set risk_level "crisis" and leave next_prompt "".
- Never output anything that validates, justifies, encourages, or romanticises self-harm
  or suicide.
- If domain is "body_image", never output diet, fitness, exercise, or weight content anywhere.
- You do not decide what happens next. Your only output is this JSON.
`.trim();
```

---

## Call 2 — `ROUTE_SYSTEM` (where the brief goes, and in what shape)

**Unchanged from the pasted spec.** This is the routing intelligence that maps accumulated themes and risk to a destination category. The `domain` field from Call 1 feeds into this call as context.

```typescript
export const ROUTE_SYSTEM = `
You suggest WHERE a student's brief could go and in WHAT format. You give no medical
advice and you decide nothing — you propose options the user will confirm.

Input: recent themes, the latest risk_level, and (optional) a self-described concern
(e.g. "exam anxiety").

Return ONLY valid JSON:
{
  "primary_destination": "crisis" | "wellbeing_team" | "gp_or_talking_therapies"
                         | "trusted_contact" | "not_yet",
  "brief_format":        "extenuating_circumstances" | "clinical_intake" | "plain_share" | "none",
  "rationale":           string,  // one plain sentence, phrased as an option, no clinical language
  "confidence":          "low" | "medium" | "high"
}

Routing rules (apply in order, stop at first match):
1. risk_level == "crisis"                                    -> "crisis", "none". STOP.
2. coursework/exam/deadline impact                           -> "wellbeing_team", "extenuating_circumstances".
3. persistent low mood / anxiety / hopelessness              -> "gp_or_talking_therapies", "clinical_intake".
4. user explicitly wants to tell a specific person           -> "trusted_contact", "plain_share".
5. not enough signal yet                                     -> "not_yet", "none".

Hard rules:
- Output a destination CATEGORY only. The app maps it to a real, allowlisted recipient.
  Never invent a clinic, service, or email address.
- If entries suggest disordered eating or body-image distress, route to
  "gp_or_talking_therapies" and NEVER suggest diet, fitness, exercise, or weight content.
- Phrase rationale as an option ("you could share this with..."), never as instruction
  or diagnosis.
- When unsure, prefer the safer / more-supported destination and lower confidence.
`.trim();
```

---

## Call 3 — `BRIEF_SYSTEM` (generate the one-pager, recipient-aware)

**Unchanged from the pasted spec.** The brief is recipient-aware, includes the `extenuating_circumstances` format for academic impact, and the `gp_or_talking_therapies` format for clinical intake.

```typescript
export const BRIEF_SYSTEM = `
You generate a one-page brief a STUDENT has chosen to share with a specific recipient.
It is built FROM their own journal entries, in their own words, to save the recipient
time. It is NOT a diagnosis and contains NO clinical conclusions. You surface patterns
and areas to explore; you never label conditions.

Recipient/context: {{destination}}   // wellbeing_team | gp_or_talking_therapies
                                      // | trusted_contact | extenuating_circumstances
Generated date: {{generated_date}}

Output Markdown, skimmable in under 30 seconds.

Common sections (always):
## Summary           - one neutral factual line.
## Timeline          - when it started and the trajectory (improving/worsening/steady),
                       from the dates only.
## Recurring themes  - each with rough frequency, e.g. "Sleep difficulty - 6 of 13 entries".
## Functioning signals - ONLY if the user mentioned them (sleep, appetite, attendance,
                       concentration, withdrawal). Never inferred.
## In their words    - 2-3 short verbatim quotes that carry signal. NEVER quote anything
                       describing method or self-harm specifics.

If destination == extenuating_circumstances, also add:
## Impact on study   - dated, factual links between the above and coursework/exams/
                       attendance, in their words.
## Period affected   - the date range.

If destination == gp_or_talking_therapies, also add:
## Onset & duration
## What they have tried   - only if mentioned.

Common footer (always):
## Areas to discuss  - 2-4 items phrased as questions/areas. NEVER diagnoses or
                       condition names.
---
*Prepared by the student from personal, dated journal entries via Throughline on
{{generated_date}}. Entries are contemporaneous. Not a clinical assessment.*

Hard rules:
- Never diagnose, never name a condition, never invent details, plain language only.
- Quote verbatim only where it adds signal; otherwise paraphrase.
- If entries contain crisis or method/means content, do NOT reproduce the specifics.
  Replace the relevant section with exactly one line:
  "Entries in this period contain language indicating possible risk to safety -
   please prioritise."
`.trim();
```

---

## Frontend Architecture (New Additions from Triage Spec)

### Updated Entry Flow (`app/index.tsx`)

The entry screen now has two stages before the write box.

**Stage 1 — Emoji Triage**
```
Header: "How are you feeling right now?"
Emoji row: 😊  😐  😔  😢  😡  🆘

Logic:
  😊 😐 😔  →  WriteEntry (direct)
  😢 😡 🆘  →  GroundingActivity → WriteEntry
  🆘         →  GroundingActivity + crisis card becomes prominent (hardcoded, always visible)
```

**Stage 2a — GroundingActivity (`src/components/GroundingActivity.tsx`)**
- Expanding/contracting circle (Reanimated)
- Box breathing: 4s in, 4s hold, 4s out, 4s hold
- "I'm ready to write" button activates after 2 full cycles (~32 seconds)
- Skip link available — never force the user to stay

**Stage 2b — WriteEntry (existing, updated)**
- After submission, calls `processEntry` API
- If `risk_level === "crisis"` → crisis card becomes full-screen, no resource shown
- If `risk_level !== "crisis"` and `domain !== "general"` → show `ResourceCard`

### New Component — `ResourceCard.tsx`
```typescript
type ResourceCardProps = {
  title: string;
  source: string;
  snippet: string;
  url?: string;
};
```
Displayed below the entry confirmation. Dismissible. Links open in-app browser. Never shown if `risk_level === "crisis"`.

---

## New Backend Service — `src/services/resources.ts`

Maps the `domain` field from Call 1 to a verified institutional resource. Static in the hackathon; expandable to a database in v2.

```typescript
export type Resource = {
  domain: string;
  title: string;
  source: string;
  snippet: string;
  url?: string;
};

const RESOURCE_DB: Resource[] = [
  {
    domain: "exam_stress",
    title: "Managing Exam Anxiety",
    source: "Imperial College London Wellbeing",
    snippet: "Break revision into 25-minute blocks with 5-minute breaks. Stop all screens 1 hour before sleep.",
    url: "https://www.imperial.ac.uk/student-support-zone/your-health/mental-health/"
  },
  {
    domain: "body_image",
    title: "Body Image Support",
    source: "NHS Every Mind Matters",
    snippet: "Speak to your GP if body image thoughts are affecting your daily life. Beat Studentline: 0808 801 0811.",
    url: "https://www.nhs.uk/every-mind-matters/"
    // NOTE: No diet, fitness, exercise, or weight content per hard rules above
  },
  {
    domain: "loneliness",
    title: "Connecting When It Feels Hard",
    source: "University of Edinburgh Social PrescribED",
    snippet: "Shared activities (a club, a class) are often easier than unstructured socialising. No performance required.",
    url: "https://www.ed.ac.uk/students/health-wellbeing/wellbeing-services"
  },
  {
    domain: "financial_anxiety",
    title: "Financial Stress and Mental Health",
    source: "Money and Mental Health Policy Institute",
    snippet: "Your university's hardship fund may be available — most students don't know they qualify. Ask your student services.",
    url: "https://www.moneyandmentalhealth.org"
  }
];

export function getResourceForDomain(domain: string): Resource | null {
  if (domain === "general") return null;
  return RESOURCE_DB.find(r => r.domain === domain) ?? null;
}
```

---

## App-Side Responsibilities (Unchanged from Pasted Spec)

These are not pushed into the model. They are hardcoded app behaviours.

- **Crisis card is always visible and hardcoded** — Samaritans 116 123, SHOUT text 85258, 999, Papyrus. A `risk_level` of `crisis` makes it *more prominent*; it is never the *only* time it appears.
- **Consent gate on every send** — the `recipientKey` + `consentTimestamp` flow. The model's `primary_destination` only pre-selects the picker; the user confirms.
- **Provenance** — store entry `createdAt` immutably. The "contemporaneous and dated" footer is the evidence differentiator for extenuating-circumstances panels. Entries must not be silently back-dated.
- **Entries stay on-device; the backend stays stateless.** The model sees only the entries needed for the current call.
- **ResourceCard is never shown when `risk_level === "crisis"`** — the crisis card takes full priority.

---

## What Each Spec Contributed

| Feature | Source |
| :--- | :--- |
| Three-call model architecture (reflect → route → brief) | Pasted spec |
| Clinical safety hard rules (no method/means, no diagnosis, fail safe) | Pasted spec |
| Recipient-aware brief format (extenuating_circumstances / clinical_intake) | Pasted spec |
| Routing logic with confidence levels | Pasted spec |
| App-side responsibilities (crisis card, consent gate, provenance) | Pasted spec |
| Emoji triage entry | Triage spec |
| GroundingActivity (breathing exercise before writing) | Triage spec |
| `domain` field in Call 1 output | Triage spec |
| `resources.ts` — institutional knowledge base | Triage spec |
| `ResourceCard` component | Triage spec |
| Body-image hard rule (no fitness/diet content) | **Merged** — triage spec domain + pasted spec routing rule |

---

## The One-Line Pitch (Unchanged)

> **"You pick an emoji. We figure out what you need — a breathing exercise, a university resource, or a crisis line. Then we help you write it down so your doctor finally understands."**
