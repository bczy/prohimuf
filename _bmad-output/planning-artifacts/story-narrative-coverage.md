# Story: Narrative System Coverage + `test:affected` DX

**Type:** Dev-quality hardening (no new gameplay) · **Scope guard:** core loop `Récupérer → Livrer → Éviter` untouched.

## Why
`src/game/systems/narrativeSystem.ts` is the only system with zero tests. It exports pure data
(`PRE_LEVEL_NARRATIVE`, `POST_LEVEL_NARRATIVE`), so a silent typo (missing level key, malformed scene
id, empty line) ships unnoticed. We lock the data contract with a test, and we add a `test:affected`
shortcut (codegraph) so contributors run only the tests their change impacts. Two independent lanes,
two independent PRs.

## Lane A — Gameplay: narrative data-integrity tests
New file only: `src/game/systems/__tests__/narrativeSystem.test.ts`. No source change.

**Acceptance criteria (A)**
- A1. `PRE_LEVEL_NARRATIVE` and `POST_LEVEL_NARRATIVE` expose the exact same set of level keys.
- A2. Every scene id matches its convention: PRE → `<level>_pre`, POST → `<level>_post`.
- A3. No scene has an empty `lines` array.
- A4. Every line has a non-empty (trimmed) `speaker` and a non-empty (trimmed) `text`.
- A5. Test file passes under the existing test runner; no other file is modified.

## Lane B — Tooling: `test:affected` script
Touches `package.json` (one script entry) + new file `scripts/test-affected.mjs`.

**Acceptance criteria (B)**
- B1. `package.json` gains a `"test:affected"` script invoking `node scripts/test-affected.mjs`.
- B2. `scripts/test-affected.mjs` resolves changed files (vs. git base), calls `codegraph affected`,
  and runs only the returned test files.
- B3. With no changed files (or no affected tests), it exits 0 with a clear "nothing to run" message.
- B4. Failures (codegraph missing, runner error) exit non-zero with a readable message.
- B5. No existing scripts altered; lane builds independently of Lane A.

## Out of scope
New narrative content/levels · gameplay/balance changes · CI wiring of `test:affected` ·
refactoring `narrativeSystem.ts` · touching any other system's tests · `rtk` adoption.
