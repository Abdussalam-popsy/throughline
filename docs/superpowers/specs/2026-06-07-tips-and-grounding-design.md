# Tips + per-domain grounding — design

**Date:** 2026-06-07
**Status:** approved-pending-review

## Goal

Wire the curated `server/data/resources.json` (tips) and `server/data/grounding.json`
(grounding techniques) into the entry flow, so that after a user writes an entry they
get a domain-relevant **tip** and can optionally request a domain-matched **grounding
technique**. The pre-write breather for high-distress emojis stays as-is.

The brief is still the product; this makes the journaling on-ramp more supportive in the
moment without adding friction to the write path.

## Flow

```
pick emoji
  ├─ 😊 😐 😔 (low/med) ─────────────► write box
  └─ 😢 😡 🆘 (high distress) ──► breather (box-breathing animation) ──► write box
                                   (🆘 pins CrisisCard above the breather)

write → submit
  ├─ crisis risk  ──► CrisisCard only (no tip, no grounding)
  └─ non-crisis   ──► POST /support { domain, riskLevel } → { tip, grounding }
                       "Entry saved"
                       + next_prompt ("SOMETHING TO SIT WITH")
                       + TipCard (support.tip, auto-shown)       [Show another] [Read more →]
                       + button: "Want a grounding technique?"
                            └─ reveal support.grounding ──► GroundingTechniqueCard
                       + "New entry"
```

- **Pre-write is unchanged from today's behavior**: all three high-distress emojis
  (😢 😡 🆘) route to the existing `GroundingActivity` box-breathing animation, then the
  write box. There is **no** pre-write tip/grounding choice card. 🆘 still sets the crisis
  flag and pins `CrisisCard prominent` above the breather.
- The tip/grounding support lives **only post-submit**, and only for non-crisis entries.

## Data sources (already present)

- `server/data/resources.json` — 368 tips, each `{ domain, tip, source, read_more }`.
  Domains include the server's 5 (`exam_stress`, `body_image`, `loneliness`,
  `financial_anxiety`, `general`) plus others and the sensitive `crisis` / `self_harm`.
- `server/data/grounding.json` — 15 techniques, each
  `{ id, title, duration_seconds, duration_label, description, type, interaction,
  logs_as, best_for: [domain...] }`. `best_for` is the domain→technique mapping.

## Server changes

### Types (`server/src/lib/types.ts`)
- **Remove** `Resource`. **Add**:
  ```ts
  export interface Tip { domain: string; tip: string; source: string; readMore?: string }
  export interface Grounding {
    id: string; title: string; durationLabel: string; description: string; type: string;
  }
  ```
- `ProcessEntryResponse` becomes `{ analysis: EntryAnalysis; tip: Tip | null }`
  (was `resource: Resource | null`). `tip`/`grounding` are no longer returned by
  `/process` — they come from a dedicated support endpoint (below).
- Add request/response shapes for the support endpoint:
  ```ts
  export interface SupportRequest { domain: string; riskLevel?: RiskLevel }
  export interface SupportResponse { tip: Tip | null; grounding: Grounding | null }
  ```

### `server/src/services/resources.ts` (rewrite)
- Load `resources.json` once at module init (`fs.readFileSync` + `JSON.parse`, resolved
  relative to the data dir). Map each raw record `read_more` → `readMore`.
- `getTipForDomain(domain: string): Tip` — random tip among that domain's records.
  **Always returns a valid tip**: an unknown domain, or a sensitive bucket
  (`crisis` / `self_harm`, which must never be surfaced as a casual tip), falls back to a
  random `general` tip. The server is the single source of content; callers never get
  `null` here. (Crisis *suppression* is decided at the route by `riskLevel`, not here.)
- Delete `RESOURCE_DB` and `getResourceForDomain`.

### `server/src/services/grounding.ts` (new)
- Load `grounding.json` once at module init. Map snake_case → the `Grounding` shape
  (`duration_label` → `durationLabel`; keep `id`, `title`, `description`, `type`).
- `getGroundingForDomain(domain: string): Grounding` — random technique among those whose
  `best_for` includes `domain`. **Always returns a valid technique**: falls back to a
  random `general`-matched technique when nothing else matches.

### Routes (`server/src/routes/entry.ts`)
- `POST /process` → returns `{ analysis }` only (no tip/resource). Analysis is the entry
  reflection + risk; the support content is fetched separately so the server owns its
  assembly in one place.
- **`POST /support`** → `{ tip, grounding }`. Body `{ domain, riskLevel? }`. The server
  assembles the whole support bundle: `tip = getTipForDomain(domain)` and
  `grounding = getGroundingForDomain(domain)`. When `riskLevel === "crisis"` **both are
  `null`** (crisis result is CrisisCard-only). Missing/invalid `domain` → treated as
  `general`. This is the one endpoint that decides "what is sent to the result screen."
- **`GET /tip?domain=<domain>`** → `{ tip: Tip }`. Drives the TipCard "Show another"
  re-roll (random each call); same `general` fallback. (Grounding has no re-roll this pass.)

## Mobile changes

### Types (`mobile/src/lib/types.ts`)
- Mirror server: **remove** `Resource`, add `Tip` and `Grounding`.
  `ProcessEntryResult` becomes `{ analysis: EntryAnalysis }`.
  Add `SupportResult { tip: Tip | null; grounding: Grounding | null }`.

### API (`mobile/src/services/api.ts`)
- `processEntryApi` returns `{ analysis }`; failure path falls back to
  `{ analysis: <elevated/general> }`.
- **`fetchSupportApi(domain, riskLevel): Promise<SupportResult>`** — `POST /api/entry/support`.
  The frontend holds **no hardcoded tip/grounding content**. On a network error it returns
  `{ tip: null, grounding: null }`, and the result screen shows a small "couldn't load"
  note instead of fabricated content. All real content comes from the server.
- `fetchTipApi(domain): Promise<Tip | null>` — `GET /api/entry/tip?domain=`, for the
  "Show another" re-roll. On error returns `null` (card keeps the current tip).

### Components
- **`TipCard.tsx`** (new; replaces `ResourceCard` usage in the Today screen): tag
  "A TIP THAT MIGHT HELP", tip text, source, "Read more →" (opens `readMore`), and a
  **"Show another"** button that re-fetches via `fetchTipApi`. `ResourceCard` is removed
  (only the Today screen used it).
- **`GroundingTechniqueCard.tsx`** (new): renders the chosen technique's `title`,
  `durationLabel`, `description`, a per-`type` icon (emoji), and a **"Done"** button.
  When `type === "breathing"` it reuses the existing `GroundingActivity` animation instead
  of the static card. No AI illustration this pass (see Out of scope).

### Today screen (`mobile/app/index.tsx`)
- Pre-write stages unchanged (`triage` → `grounding` for high-distress → `write`).
- On submit, after `processEntryApi` resolves the analysis, the screen calls
  `fetchSupportApi(domain, analysis.risk_level)` (skipped for crisis) so the support bundle
  is in hand by the time the result renders. The grounding technique arrives in that same
  bundle and is simply revealed on the button tap — no extra round-trip.
- Result stage (non-crisis) renders: "Entry saved", `next_prompt` card, `TipCard`
  (seeded with `support.tip`), the "Want a grounding technique?" button (shown when
  `support.grounding` is present), and "New entry". If support failed to load, a small
  "couldn't load right now" line replaces the tip — never hardcoded content.
- Crisis result unchanged: `CrisisCard` only (no support call).

## Testing

- **Server**
  - `resources.test.ts` (rewrite): `getTipForDomain` returns a valid tip for a known domain;
    falls back to a `general` tip for an unknown domain and for `crisis`/`self_harm` (never
    returns sensitive-bucket content); tip shape has `tip`/`source`.
  - `grounding.test.ts` (new): `getGroundingForDomain` returns a technique whose `best_for`
    includes the domain; falls back to `general` for an unmatched domain (always valid).
  - `entry.route.test.ts` (update): `/process` returns `{ analysis }` (no `resource`/`tip`);
    `POST /support` returns `{ tip, grounding }` for a domain and **both `null` on crisis**;
    `GET /tip` returns a tip.
- **Mobile**
  - `api.test.ts` (update): `processEntryApi` returns `{ analysis }`; `fetchSupportApi`
    happy-path returns `{ tip, grounding }` and on fetch error returns
    `{ tip: null, grounding: null }` (no hardcoded content); `fetchTipApi` happy-path +
    error returns `null`.
- **Verify**: `cd mobile && npx tsc --noEmit` and `cd server && npx tsc --noEmit` clean;
  `npm test` green in both packages.

## Decisions

- Pre-write shows the breather only — no tip/grounding choice card. (Reverted from an
  earlier draft.)
- All three high-distress emojis (😢 😡 🆘) trigger the breather.
- Post-submit auto-shows the tip; grounding is opt-in behind a button.
- Tip and grounding are both chosen **randomly** among domain matches.
- Sensitive domains (`crisis`, `self_harm`) are never served as tips (general fallback).
- **The server owns what is sent to the frontend.** A single `POST /support` endpoint
  assembles the `{ tip, grounding }` bundle; the server always returns valid content
  (general fallback) so the frontend carries no hardcoded tips/techniques. `/process`
  returns analysis only; "Show another" re-rolls via `GET /tip`.

## Out of scope (follow-ups)

- **Fotor AI illustrations** for non-breathing techniques — user has a Fotor key; add an
  image-gen step (pre-generated & bundled per technique is the likely approach) in a later
  pass. The `GroundingTechniqueCard` leaves room for an image slot above the description.
- Distinct per-`interaction` UIs (guided step-through, soft-timer text box that
  `logs_as: "entry"`, off-app countdowns). This pass renders one descriptive card for all
  non-breathing types.
- Logging grounding completions (`logs_as`) into the timeline.
```
