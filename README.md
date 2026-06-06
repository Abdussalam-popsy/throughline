# Throughline

Turns weeks of private journaling into a one-page brief a GP / university service can read in 30 seconds.
**The product is the brief, not the journal. The demo leads with the brief.**

Stack: **Expo (React Native + TypeScript)** mobile app + **Express (TypeScript)** API. AI on **Z.AI GLM** (Claude wired but commented).

## Layout

```
throughline/
├─ mobile/    # Expo app — expo-router tabs: Today / Timeline / Brief / Support
└─ server/    # Express API — POST /api/brief/generate (+ /send, build-order step 3)
```

## Run it

**Backend**
```bash
cd server
npm install
# paste your Z.AI key into .env  (GLM_API_KEY=...)
npm run dev          # -> server on :3000
npm test             # ts-jest + supertest
```

**Mobile**
```bash
cd mobile
npm install --legacy-peer-deps
npm run ios          # iOS Simulator hits the backend at localhost:3000
npm test             # jest-expo + @testing-library/react-native
```

> On a physical device instead of the simulator, set `EXPO_PUBLIC_API_URL=http://<your-LAN-ip>:3000` in `mobile/.env` (localhost won't reach your Mac from a phone).

## Three-call model architecture

```
Call 1 — ENTRY_SYSTEM   POST /api/entry/process   reflect + risk + themes + domain (fails safe to "elevated")
Call 2 — ROUTE_SYSTEM    POST /api/brief/route      propose a destination category + brief format
Call 3 — BRIEF_SYSTEM    POST /api/brief/generate   recipient-aware one-pager (destination + date templated)
```

Cross-cutting safety rules are baked into the prompts: translator-not-clinician, grounded in the
user's words, conservative on risk, no method/means content, model escalates / app decides, no
auto-send, and fail-safe parsing (bad JSON or missing `risk_level` → `elevated` + support shown).

## Status (build order)

- [x] **1 — Backend brief pipeline** (`ai.ts`, `prompts.ts`, `POST /api/brief/generate`)
- [x] **2 — Frontend brief screen** generate path (renders the returned Markdown)
- [x] **Merged spec** — three-call architecture, emoji triage → breathing → write flow,
      `domain` detection, institutional `resources.ts` + `ResourceCard`, always-on `CrisisCard`
- [ ] 3 — `pdf.ts` + `email.ts` + `POST /api/brief/send` + review/consent/send UI
- [ ] 5 — Timeline mood thread + NHS/university signposting
- [ ] 6 — Polish + rehearse the 3-minute demo

## Safety notes

- Email defaults to **Ethereal** (a fake inbox + preview link) — never a real NHS/uni address.
- The app sends a `recipientKey`, never a raw email; the backend resolves it against an **allowlist** (prevents open relay).
- Entries live on-device (`expo-sqlite`); they transit a stateless backend only on explicit consent and are never stored server-side.

## Toolchain notes

- Installs use **npm** (the local `yarn` 1.22 silently no-ops in this environment); behaviour is identical.
- Mobile test stack is pinned to the **jest-29 / RTL-13** line to stay coherent with `jest-expo@56` and React 19.2 (`react-test-renderer` pinned to `19.2.3`).
- The `GroundingActivity` breathing animation uses React Native's built-in **`Animated`** API instead of Reanimated — same box-breathing behaviour, no extra babel-plugin setup to break the Expo build.
