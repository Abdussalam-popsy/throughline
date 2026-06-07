# Throughline — Design Brief

> A document for handing to a design tool (Figma, v0, Lovable, etc.) or a designer.
> It describes **what the app is**, **how it should feel**, and the **exact tokens, components, screens, and flows** already built so a redesign or hi-fi mockup stays faithful to the product.

---

## 1. The product in one line

**Throughline turns weeks of private journaling into a one-page brief a GP or university service can read in 30 seconds.**

The journal is the on-ramp; **the brief is the product**. Any design should lead with the brief and treat journaling as the gentle, low-friction habit that feeds it.

**Who it's for:** students and young adults carrying something heavy who struggle to explain it in a 10-minute appointment. The app does the explaining for them, in their own words, only when they choose to share.

**Core promise:** *"Not a diagnosis — a starting point you choose to share."* Entries live on-device; nothing leaves without explicit consent.

---

## 2. Tone & design principles

The emotional register is the whole product. Get this wrong and the rest doesn't matter.

1. **Calm, never clinical.** Soft sage-green and off-white, generous whitespace, rounded corners. It should feel like a quiet room, not a medical form.
2. **Low-pressure.** Copy invites ("Write or speak as much or as little as you like"), never demands. No streak counters, no guilt, no gamification.
3. **Safety is always one tap away.** Crisis support is hardcoded and never hidden behind AI output — it must read as reassuring, not alarming.
4. **The user's words are sacred.** The app reflects and organises what they wrote; it never puts words in their mouth. Tags and stressors are model-chosen but shown as quiet, factual chips.
5. **Trustworthy by design.** Consent, on-device storage, and "you choose to share" are surfaced, not buried.

**Avoid:** hospital blues, red alerts everywhere, dense text, dashboards, charts that look like analytics, anything that feels like surveillance or scoring.

### Validated design decisions

These choices have been checked against mental-health and adolescent/Gen-Z UX research — treat them as **locked**, not open to restyling:

| Decision | Status | Why it holds |
|---|---|---|
| Sage green `#2f6f5e` | **Keep** | Best-validated hue for mental health; differentiates from competitors |
| Off-white `#f7faf9` | **Keep** | Avoids clinical white; reinforces the safe-space feeling |
| Dark slate `#1d2b27` | **Keep** | Green undertone ties the palette together; softer than pure black |
| Flat, no shadows | **Keep** | Lowers cognitive load (validated in adolescent UX research) |
| 16px radius + generous whitespace | **Keep** | Signals emotional safety; matches Gen-Z preference research |
| **Brief screen typography** | **Refine** | Needs a stronger document hierarchy to signal credibility to clinicians — see §5.3 |

The single open item is the Brief screen: it must stay calm for the user *and* read as a credible, scannable clinical document. That tension is resolved in §5.3.

---

## 3. Design tokens

These are pulled directly from the current build — use them as the source of truth.

### Color

| Token | Hex | Use |
|---|---|---|
| `bg/app` | `#f7faf9` | App background (off-white green tint) |
| `bg/surface` | `#ffffff` | Cards, inputs, tab bar |
| `brand/primary` | `#2f6f5e` | Primary green — CTAs, kickers, active tab, links |
| `brand/primaryPressed` | `#255647` | Pressed state of primary buttons |
| `brand/tintSurface` | `#eef5f2` | Soft green fill — chips, mic button, resource card, secondary button |
| `brand/tintBorder` | `#cfe4dc` / `#d4e5de` | Borders on tinted surfaces |
| `accent/circle` | `#bfe0d6` | Breathing circle fill |
| `text/strong` | `#1d2b27` | Headings |
| `text/body` | `#2b3733` | Body copy |
| `text/muted` | `#52605b` | Secondary copy / hints |
| `text/faint` | `#7b8884` | Footnotes, metadata, inactive |
| `text/placeholder` | `#9aa5a1` | Input placeholder, inactive tab |
| `border/hairline` | `#eceeed` | Card borders, dividers |
| `risk/none` | `#7fae9f` | Timeline dot — calm |
| `risk/elevated` | `#e0a13c` | Timeline dot — elevated; amber |
| `risk/crisis` | `#b4453a` | Timeline dot + crisis text |
| `crisis/bg` | `#fbeeec` → `#fbe4e0` (prominent) | Crisis card background |
| `crisis/border` | `#f0cfc9` → `#b4453a` (prominent) | Crisis card border |
| `crisis/title` | `#9c352b` | Crisis card heading |
| `error` | `#b4453a` / `#b3261e` | Inline error text |

> The palette is **one warm green + warm off-whites + a single muted clay-red reserved for crisis/risk.** Red appears *only* in a safety context — never for ordinary errors of emphasis elsewhere.

### Typography

System font (San Francisco / Roboto). Weight and size do the work, not typeface.

| Style | Size | Weight | Notes |
|---|---|---|---|
| Kicker / eyebrow | 12 | 700 | UPPERCASE, letter-spacing ~1.2, `brand/primary` |
| H1 (screen title) | 24 | 800 | `text/strong`, line-height ~30 |
| H1 (activity) | 22 | 800 | Centered on grounding screen |
| Sub / lede | 15 | 400–600 | `text/muted`, line-height ~21 |
| Body | 14–16 | 400 | `text/body` |
| Prompt text | 17 | 400 | The reflective "something to sit with" |
| Hint / footnote | 13 | 400 | `text/faint`, sometimes italic |
| Chip / tag label | 11–12 | 600–700 | letter-spacing on tags |
| Button label | 16 | 700 | White on primary |

**Brief-document hierarchy** (the one place that reads as a clinical document, not chat):

| Style | Size | Weight | Notes |
|---|---|---|---|
| Doc title | 20 | 800 | Top of the rendered brief, `text/strong` |
| Doc meta line | 12 | 600 | `text/faint` — date generated · entry count · "Not a diagnosis" |
| Section label | 13 | 700 | UPPERCASE, letter-spacing ~1, `brand/primary`, with a hairline rule under it |
| Section body | 15 | 400 | `text/body`, line-height ~22 |
| Quoted entry | 15 | 400 italic | Left 3px border `#cdd8d4`, soft fill `#f1f5f4`, `text/muted` — the user's own words |

### Shape & spacing

- **Radius:** cards/inputs `14–16`, buttons `14`, chips/pills `999`, mic button `22` (circle), breathing circle `100`.
- **Screen padding:** `20` horizontal, `48` bottom.
- **Card padding:** `18–20`.
- **Borders:** 1px hairline (`#eceeed`) on surfaces; 2px clay-red on prominent crisis card.
- **No shadows in the current build** — depth comes from hairline borders on white over the tinted background. A redesign may add very soft shadows but keep it subtle.

---

## 4. Navigation & flow

Bottom tab bar, 4 tabs (expo-router), in this fixed order. White bar, hairline top border. Active tint `#2f6f5e`, inactive `#9aa5a1`. Header bar matches the app background. There is **no onboarding, auth, or modal stack** — the four tabs are the entire surface; everything else is in-screen state.

| Order | Route | Title | Role in the flow |
|---|---|---|---|
| 1 | `index` | **Today** | Capture — the multi-stage journaling flow that *produces* entries |
| 2 | `timeline` | **Timeline** | Review — every entry, risk-dotted and stressor-tagged |
| 3 | `brief` | **Brief** | Output (the hero) — generates the one-pager *from* those entries |
| 4 | `support` | **Support** | Always-on — crisis lines, reachable from any tab at any time |

**How the tabs connect (the real application flow).** The tabs aren't independent — they form a pipeline driven by on-device entries (`expo-sqlite`):

```
Today (write an entry) ──saves──▶ on-device store
                                      │
                  ┌───────────────────┼───────────────────┐
                  ▼                                         ▼
            Timeline (reads entries on focus)       Brief (reads entries on focus,
                                                     generates the one-pager)
Support ── independent, always available ───────────────────────────────────────
```

- **Today → store:** a saved entry is written to the device, tagged with risk level and a model-chosen stressor.
- **Store → Timeline & Brief:** both re-read the store **every time the tab regains focus** (`useFocusEffect`), so a new entry shows up without a restart and the Brief always reflects the latest entries. The Brief is disabled/empty until at least one entry exists.
- **Support** sits outside the pipeline — it depends on nothing and is never gated by app state or AI output.

**The Today stage machine** (in-screen state, not routes). Today is itself a flow of five stages:

```
triage ──┬─(😊/😐/😔)──────────────▶ write ─▶ submitting ─▶ result
         └─(😢/😡/🆘)─▶ grounding ─▶ write ─▶ submitting ─▶ result
```

- `triage` → `grounding` is **conditional**: only the heavier moods / SOS route through the breathing step; lighter moods skip straight to `write`.
- `submitting` is a distinct stage (spinner + "Saving and reflecting…") between `write` and `result` — design must account for it.
- `result` branches on risk: a crisis/SOS result shows the prominent Crisis card; otherwise the gentle "Entry saved" + optional prompt/resource. "New entry" returns to `triage`.

---

## 5. Screens & flows

### 5.1 Today — the journaling flow

A single screen that moves through stages. Each stage replaces the previous.

**Stage 1 — Triage**
- Kicker `TODAY`, H1 "How are you feeling right now?"
- A 3×2 grid of emoji tiles (white cards, ~30% width, square): 😊 😐 😔 😢 😡 🆘
- Hint: "Tap whichever is closest. We'll take it from there."
- Selecting 😢/😡/🆘 routes through **grounding** first; 😊/😐/😔 go straight to **write**. 🆘 also flags an SOS (crisis card shown).

**Stage 2 — Grounding** (only for heavier moods / SOS)
- If SOS: prominent **Crisis card** pinned at top.
- **Box-breathing animation**: a sage circle that scales 0.55→1 over 4s in / hold / out / hold. Phase label ("Breathe in", "Hold", "Breathe out"). Title "Let's take a moment first", sub "Follow the circle. There's no rush."
- After ~2 cycles (~32s) the primary button enables: "I'm ready to write" (disabled label "Keep breathing…"). A quiet "Skip for now" is always available.

**Stage 3 — Write**
- H1 "How has today been?", hint reassuring it stays on device.
- Large multiline text input (white, min-height 160), placeholder "Today I…".
- **Mic button** bottom-right inside the input (circle): idle 🎤 on soft green; active = filled green with a stop ■. Listening state shows a spinner + "Listening… tap the square to stop."
- Primary CTA "Save entry" (disabled until there's text).

**Stage 4 — Submitting**
- Centered spinner + "Saving and reflecting…".

**Stage 5 — Result**
- *If crisis/SOS:* full-width prominent Crisis card + a calm note ("Your entry is saved. Please reach out…").
- *Otherwise:* H1 "Entry saved", an optional **prompt card** (kicker "SOMETHING TO SIT WITH" + a reflective question), and an optional **Resource card**.
- "New entry" secondary link resets the flow.

### 5.2 Timeline

- Kicker `TIMELINE`, H1 "Your entries over time", note explaining stressors are auto-tagged.
- A vertical list of rows. Each row: a **colored risk dot** (calm/amber/clay-red) + date + 2-line entry preview + an optional **stressor chip** (pill, soft green).
- Empty state: "Nothing yet. Add an entry on the Today tab…".

### 5.3 Brief — the hero screen

This screen carries a dual audience and that tension drives its design: the **page around the card** stays calm and reassuring for the user; the **card itself** must read as a credible, scannable clinical document. The card is the only place in the app that adopts a stronger, document-grade typographic hierarchy (see Typography → Brief-document hierarchy).

**Page chrome (user-facing, calm):**
- Kicker `YOUR BRIEF`, H1 "A summary a clinician can read in 30 seconds".
- Sub: "Built from N of your own journal entries, in your own words. Not a diagnosis — a starting point you choose to share."
- **Empty state:** prompt to add entries first.
- **CTA** "Generate my brief" → loading "Reading your entries…".
- "↻ Regenerate from latest entries" secondary pill below the card.

**The brief card (document-grade, clinician-facing):** rendered Markdown inside a white card with a deliberate hierarchy so a busy clinician can scan it in 30 seconds:
1. **Doc title** + **meta line** (date generated · "from your last 6 weeks of entries" · "Not a clinical diagnosis") — gives the page provenance and credibility up front.
2. **Labelled sections**, each an uppercase green section label over a hairline rule, in a fixed, predictable order:
   - **Recurring themes** — what keeps coming up
   - **Recent pattern** — the trajectory over the period
   - **Recommended pathway** — the suggested next step / service
3. **Quoted journal lines** as evidence — italic, left-bordered, soft-filled — so claims are grounded in the user's own words, not the model's.
4. **Horizontal dividers** between sections to reinforce the scannable, document feel.

Credibility comes from *structure and consistency*, not from making it look medical — keep the sage palette, whitespace, and flat surfaces. Stronger hierarchy ≠ clinical coldness.

**Next step (planned):** footnote "review, pick who to share with, and consent before anything is sent." Leave room for a review → choose recipient → consent → send sequence after the card.

### 5.4 Support

- Kicker `SUPPORT`, H1 "You can reach out any time", reassuring sub ("you never need a reason 'serious enough'").
- A prominent **Crisis card**.
- Note that university/NHS signposting matched to entries is a future build step.

---

## 6. Components

| Component | Description | Key states |
|---|---|---|
| **Kicker** | Uppercase green eyebrow above each H1 | — |
| **Primary button** | Full-width green, white 700 label, radius 14 | default / pressed (`#255647`) / disabled (`#dbe5e1`) |
| **Secondary / link button** | Green text, no fill, or soft-green pill | default / pressed |
| **Emoji tile** | White square card in a wrap grid | default / pressed (green tint + border) |
| **Text input** | White multiline, hairline border, embedded mic | empty / typing / listening |
| **Mic button** | Circular, inside input | idle 🎤 / active filled green ■ |
| **Prompt card** | White card, kicker + reflective question | — |
| **Brief card** | White document card: doc title + meta line, uppercase green section labels over hairline rules (Recurring themes / Recent pattern / Recommended pathway), italic left-bordered quoted entries, dividers | rendered (post-generate) |
| **Resource card** | Soft-green card: tag "A RESOURCE THAT MIGHT HELP", title, source, snippet, "Open resource →", Dismiss | default / dismissed (removed) |
| **Crisis card** | Clay-red-tinted card with tappable phone/SMS lines (999, Samaritans 116 123, SHOUT 85258, Papyrus). | default / **prominent** (2px red border, stronger copy) |
| **Grounding activity** | Animated breathing circle + phase label + ready/skip | breathing / ready |
| **Timeline row** | Risk dot + date + preview + stressor chip | by risk level |
| **Stressor chip** | Rounded pill, soft green, 600 label | — |

---

## 7. Content & voice samples

Use these verbatim as the voice reference:

- "How are you feeling right now?" / "Tap whichever is closest. We'll take it from there."
- "Write or speak as much or as little as you like. It stays on your device."
- "Let's take a moment first." / "Follow the circle. There's no rush."
- "Not a diagnosis — a starting point you choose to share."
- "You don't have to handle this alone." / "You never need a reason 'serious enough' to use them."

Warm, plain, second-person, lowercase-friendly. Never clinical jargon. Never "patient", "diagnosis as fact", or anything that scores the user.

---

## 8. What a design tool should produce

If you're generating mockups from this brief, prioritise in this order:

1. **The Brief screen** (hero — the demo leads here): empty → generating → rendered one-pager.
2. **The Today flow**: triage grid, breathing moment, write-with-voice, gentle result.
3. **Timeline** with risk dots and stressor chips.
4. **Crisis card** in both default and prominent forms.
5. **Support** screen.

Keep every screen on the established palette and spacing. The redesign succeeds if a stressed 20-year-old opens it and feels **calmer**, and a busy clinician opens the brief and **gets it in 30 seconds**.
