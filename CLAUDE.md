# Throughline — agent guide

Turns weeks of private journaling into a one-page brief a GP / university service can
read in 30 seconds. **The brief is the product; journaling is the on-ramp.** See
`README.md` (build status), `DESIGN.md` (UI tokens/flows), and the Merged Spec for detail.

## Layout
- `mobile/` — Expo app (expo-router tabs: Today / Timeline / Brief / Support). On-device
  SQLite (`expo-sqlite`), voice dictation (`expo-speech-recognition`).
- `server/` — Express API. Three-call AI pipeline: `POST /api/entry/process` (reflect+risk),
  `/api/brief/route` (propose destination), `/api/brief/generate` (one-pager).

## Stack (bleeding edge — assume New Architecture)
Expo **56** · React Native **0.85.3** · React **19.2.3** · Hermes · Bridgeless + Fabric.
Crash stacks will show `RuntimeScheduler_Modern`, `jsinspector_modern`, `UIManagerBinding` — that's normal for this arch, not a clue.

## Verify before claiming done
- Types: `cd mobile && npx tsc --noEmit` and `cd server && npx tsc --noEmit` (both must be clean).
- Tests: `npm test` in each package (jest-expo / ts-jest).

## Environment quirk — sandbox cwd
Bash commands that need the repo cwd (anything with `cd`, `npx tsc`, `npm`) fail in-sandbox
with `zsh:1: operation not permitted: /tmp/claude-501/cwd-XXXX`. This is the sandbox blocking
the shell's cwd-tracking dir, **not** a real error. Don't burn turns retrying in-sandbox —
re-run with `dangerouslyDisableSandbox: true`. (Writes are already scoped to the repo by
`.claude/settings.json`.)

## AI backend state
All four model calls in `server/src/services/ai.ts` run on **Claude** (`claudeChat`,
`claude-sonnet-4-5`). The GLM (`glmChat`) calls are **commented out directly above each
replacement** as the restore path — keep them; don't delete. Every call needs
`ANTHROPIC_API_KEY` in `server/.env`. `glmChat` stays defined though unused.

## Debugging playbook — Hermes dev-inspector SIGSEGV (seen repeatedly)
**Signature:** `EXC_BAD_ACCESS` null deref; faulting thread `com.facebook.react.runtime.JavaScript`;
top frames `hermes::vm::CodeBlock::getSourceLocation` → `Debugger::runUntilValidPauseLocation`
→ `Debugger::runDebugger`.

**What it means:** the Hermes **dev JS-inspector** crashed while trying to *pause* the VM.
It is **dev-only** (the debugger isn't compiled into release builds) and is almost always
**triggered by an uncaught JS exception** being thrown while JS runs — the inspector tries
to pause-on-exception and segfaults.

**The native crash log never shows the JS error.** Read the frames *below* the Hermes ones
to find what JS was executing, then get the real error from the **Metro terminal**, not the
`.crash` file. Example: a stack going through `expo::EventEmitter::emitEvent` →
`SharedObject.emit` means a **native module emitted an event into a JS listener** — look at
that listener (e.g. `useVoiceInput.ts` for speech-recognition events).

**Fix pattern:** make the implicated handler unable to throw — optional-chain every field of
native/event payloads (`event?.results?.[0]?.transcript ?? ""`), don't assume arrays exist.
**Mitigations (keep dev mode):** don't leave a JS debugger frontend attached; turn off
"Pause on Caught Exceptions" in RN DevTools; reload (Cmd+R) after the fix. Dev menu = **Cmd+D**.

## Known gotchas
- **Domain type drift:** `server/src/lib/types.ts` `Domain` has 5 values; `mobile/src/lib/types.ts`
  and the `ENTRY_SYSTEM` prompt list 11. The server's `VALID_DOMAIN` coerces anything outside its
  5 to `general`. Keep this in mind before "fixing" one side.
- Treat any data crossing the JS↔native or app↔backend boundary as untrusted: guard it.
