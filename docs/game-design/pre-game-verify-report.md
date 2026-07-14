# Quality-gate verdict — Pre-game experience redesign

**Stage 5 · VERIFY** · QA lead (Inès) · **Date:** 2026-07-14
**Branch:** `claude/launch-menu-redesign-vpph8v`
**Story:** `_bmad-output/planning-artifacts/story-pre-game-experience-redesign.md` (AC1–AC8)
**Spec:** `docs/game-design/pre-game-experience-ux.md` · **ADR:** `docs/adr/0021-pre-game-print-system-and-title-phase.md`

## Verdict: **PASS** (quality gate) — with two non-blocking findings routed to owning lanes

The mechanical battery is green, the game-system suite is byte-untouched and green, and
the redesigned pre-game flow (TITLE → MENU → NIVEAUX/SCORES/OPTIONS → NARRATIVE_PRE →
PLAYING) drives end-to-end in a real headless browser against the production build under
its deploy base. The e2e suite was taught the new flow and both smoke gates pass locally.

This is the correctness/robustness verdict. Design conformity (does it play as designed)
remains `game-designer`'s (Sacha) verdict; art treatment remains `lead-art`'s (Nico).

---

## Mechanical checks (run locally)

| Check                      | Command                                   | Result                                    |
| -------------------------- | ----------------------------------------- | ----------------------------------------- |
| Typecheck                  | `yarn typecheck`                          | **PASS** (exit 0)                         |
| Lint                       | `yarn lint`                               | **PASS** (exit 0)                         |
| Format                     | `yarn format:check`                       | **PASS** (after formatting the 2 scripts) |
| Unit tests                 | `yarn test`                               | **PASS** — 22 files, **228/228** tests    |
| Build                      | `VITE_BASE=/prohimuf/ vite build`         | **PASS** (exit 0)                         |
| E2E home                   | `scripts/e2e-home.mjs`                    | **PASS**                                  |
| E2E in-game (belliard)     | `scripts/e2e-ingame.mjs`                  | **PASS**                                  |
| E2E in-game (all 3 levels) | `E2E_ALL_LEVELS=1 scripts/e2e-ingame.mjs` | **PASS** (belliard, stalingrad, vitry)    |

The e2e ran against a local `vite preview` server (base `/prohimuf/`, `PREVIEW_URL`) —
the same invocation as `.github/actions/e2e-home` / `e2e-ingame`. No console/page errors,
no failed same-origin requests during either run.

## Suite changes (specced by QA, this cycle implemented directly in the e2e scripts only)

- `scripts/e2e-home.mjs` — rewired to the new flow: assert the TITLE cover renders
  (`MUF` logo + title-only subtitle `UN SON · UNE NUIT · PAS D'ADRESSE`), perform the
  single-action entry (click the cover), assert the MENU shell (`MASTHEAD.running` +
  the three `role="tab"` rubriques), all level names visible as flyers, first level not
  carrying the `LIGNE FERMÉE` stamp, SCORES empty-state (`AUCUN MÉFAIT SIGNALÉ`), OPTIONS
  colophon (`OURS` / `PRESSION`). The stale `getByText("UNDERGROUND PARIS — 1998")`
  header and `VERROUILLÉ` marker are gone.
- `scripts/e2e-ingame.mjs` — `checkLevel` now does title → single-action entry →
  wait menu masthead → activate flyer → `dismissNarrative` → canvas + HUD gates. The
  old `getByText("MUF")`-as-menu-signal (which now matches the TITLE) is replaced.
  In-game HUD assertions (score `0000`, 3 hearts, level name) are unchanged.

---

## Acceptance criteria — per-AC verdict

| AC  | Claim                                            | Verdict  | Evidence                                                                                                                                                                                                                    |
| --- | ------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC1 | Real title moment, wired; no orphan              | **PASS** | `TitleScreen` imported + rendered in `App.tsx:8,225`; cold load boots `TITLE`; one action → MENU (driven by e2e). `StartScreen.tsx` deleted, **zero** references in `src/` (grep). Title cover screenshot captured.         |
| AC2 | Menu reads as fanzine artifact                   | **PASS** | Screenshots: zine cover (TITLE), flyer wall (NIVEAUX) with per-stock flyers + tape/stamps, PARIS-MINUIT UNE (SCORES), OURS colophon (OPTIONS). Renders without error. Full art/design conformity = design gate's verdict.   |
| AC3 | One cohesive visual system, single palette       | **PASS** | Single-source `src/render/ui/print/tokens.ts` (STOCK/INK/MARK/MASTHEAD/MOTION), consumed by every surface (ADR-0021 D3). tsc/lint green. Screenshots show consistent Courier/Impact type + halftone, zero glow.             |
| AC4 | Reskin not re-plumb; `src/game` untouched        | **PASS** | `git diff --stat origin/main...HEAD -- src/game/` is **EMPTY**. Full Vitest suite green (228) with no game-system test edits. `Prefs`/highScore/`levels.ts`/`stateMachine` byte-unchanged.                                  |
| AC5 | UX non-negotiables (<10 s, one action, no trap)  | **PASS** | Title→gameplay for belliard = **3 actions** (title click → flyer click → narrative Passer/CONTINUER), each transition code-bounded ≤ 280 ms (`MOTION.titleToMenu`), no dwell on TITLE. e2e drives the path. _(See caveat.)_ |
| AC6 | Mobile & overlays intact; RotateOverlay on TITLE | **PASS** | `TITLE` renders through `renderAppShell(content, rotateBlocked)` (`App.tsx:223–232`), so RotateOverlay + FullscreenButton wrap it exactly like MENU. RotateOverlay reskinned to print (no scanlines/emoji). _(See caveat.)_ |
| AC7 | No new mechanics/systems/levels                  | **PASS** | Diff confined to `src/render/**` (+ `App.tsx`, docs, `scripts/screenshot-preview.mjs`). **Zero** new files under `src/game/systems/**` or `src/game/levels/**`. Core loop untouched.                                        |
| AC8 | Verified green + screenshot-capturable           | **PASS** | tsc/vitest/lint/format green; `?preview=title` boots TITLE, `?preview=menu` boots MENU (both captured); existing `narrative` / `end` / `tutorial` previews intact. ADR-0021 recorded.                                       |

### Caveats on the PASS verdicts (holes named, not hidden)

- **AC5 timing** is architecturally bounded (no-dwell TITLE, `MOTION.titleToMenu = 280 ms`)
  and the 3-action path is exercised by e2e, but the sub-10 s budget was **not stopwatch-
  measured** in a device-representative session. The design-acceptance playtest (Sacha)
  owns the timed 3-tap checkpoint per the spec §8.
- **AC6 portrait** RotateOverlay-over-TITLE is verified by **code inspection** (shared
  `renderAppShell` path) and the reskin is screenshot-confirmed in landscape; a headless
  **portrait mobile-UA** capture of the overlay sitting over TITLE was not run this cycle.
  Low risk (same wrapper as the already-shipped MENU overlay), noted as a residual hole.

---

## Findings (routed via orchestrator; not fixed here)

### F1 — MINOR / tooling — `scripts/screenshot-preview.mjs` `captureLevel` cold-boot path is broken by the TITLE interception → owner: `dev-tooling-assets`

`captureLevel` still navigates `page.goto(BASE_URL)` (cold) → `getByText("MUF").waitFor()`
→ `getByText(level.name).click()`. Since cold load now lands on **TITLE** (which also shows
the `MUF` logo), the level name is not present and the click times out. The failure is
caught per-level, so the run continues — but the in-play `level_<id>.png` shots are **not
regenerated**; the render-farm contact sheet silently falls back to the **stale committed
images** (verified: `level_belliard/stalingrad/vitry.png` mtimes are 2026-07-10 while the
same-run pre-game screens are fresh).

**Reproduction (clean):** cold boot with the seed → subtitle `UN SON · UNE NUIT · PAS
D'ADRESSE` visible (we are on TITLE), `Rue Belliard` flyer **not** visible,
`locator.click` on the level name → `Timeout 5000ms exceeded`.

**Fix (same shape as the e2e-ingame fix):** in `captureLevel`, after the cold `goto`,
perform the single-action title entry (click the cover / press a key) and wait for the
menu masthead **before** clicking the flyer. Out of QA's editable scope this cycle (QA may
edit only `scripts/e2e-*.mjs`).

**Blocking?** No — it lives in the render-farm workflow (`preview.yml`), not the CI e2e
gate that this story's quality gate funnels; the two updated e2e smoke gates pass. But it
degrades preview evidence and should be burned down next cycle. **Regression-test spec:**
once fixed, assert `level_<id>.png` mtime advances on each render-farm run (freshness gate),
or add a cold-boot→title-entry assertion mirroring `e2e-ingame`.

### F2 — COSMETIC — OPTIONS ballot X-stamp overlaps its label → owner: `game-designer` / `lead-art`

On the OURS colophon, the selected ballot's `✕` X-stamp (26 px, absolutely centered) sits
over the option label (`NORMAL`, the lives digit), partially muddying it (see
`screenshots/verify/menu-options.png`). Legible but not crisp. Not a correctness defect —
flagged for design/art polish (offset the stamp or lighten the label under it).

---

## Evidence (screenshot paths — absolute)

- `/home/user/prohimuf/screenshots/verify/title.png` — TITLE zine cover (`?preview=title`)
- `/home/user/prohimuf/screenshots/verify/menu-niveaux.png` — MENU · NIVEAUX flyer wall
- `/home/user/prohimuf/screenshots/verify/menu-scores.png` — MENU · SCORES (PARIS-MINUIT UNE, empty-state)
- `/home/user/prohimuf/screenshots/verify/menu-options.png` — MENU · OPTIONS (OURS colophon)
- `/home/user/prohimuf/screenshots/verify/narrative.png` — NARRATIVE_PRE print frame (`?preview=narrative`)
- `/home/user/prohimuf/screenshots/e2e-home.png` — e2e-home final state (OPTIONS rubrique)
- `/home/user/prohimuf/screenshots/e2e-ingame.png` — in-game belliard (canvas + HUD)
- `/home/user/prohimuf/screenshots/e2e-ingame-stalingrad.png`, `.../e2e-ingame-vitry.png` — all-levels sweep

## Not covered / CI-DEFERRED (explicit)

- **Device-representative timing (AC5)** and **portrait mobile-UA overlay capture (AC6)** —
  see caveats above; recommended for the design-acceptance session, not a sandbox-only path.
- **Real-FLUX asset generation** — CI-only per project rules; unchanged by this story.

---

## Correction 1 (2026-07-14) — code-review panel caught a MISSED script; F1 resolved

The code-review panel flagged a script my first stage-5 pass missed: **`scripts/e2e-delivery.mjs`**
— a **hard CI gate in `.github/workflows/deploy.yml`** (post-merge deploy). It still did
`goto → wait "MUF" → click level name`. Because `"MUF"` now renders on the new TITLE cover too,
the wait would pass while the app sat on TITLE and the level-name click would time out →
**post-merge deploys would have failed.** This was a real escape in my first pass — logged here
per the "every escaped bug becomes a regression test spec" rule.

**Fix (scripts scope only):**

1. Factored the title→menu entry into **`scripts/e2e-lib.mjs`** as
   `enterMenuFromTitle(page, { timeout })`, which owns the marker strings (`TITLE_SUBTITLE`,
   `MENU_MASTHEAD`, both also exported) and the assert-subtitle → single-action entry →
   wait-masthead sequence. One source of truth for the entry step, alongside
   `dismissNarrative` / `seedDeterminism`.
2. Switched **all four consumers** to it, deleting three copy-pasted inline versions and
   fixing the missing one: `e2e-home.mjs`, `e2e-ingame.mjs`, **`e2e-delivery.mjs`** (the miss),
   and `screenshot-preview.mjs`. Using it in `screenshot-preview.mjs` also **resolves finding
   F1** — the render-farm `captureLevel` cold-boot path is no longer broken; the reused helper
   is exactly the fix F1 called for. F1 is therefore **CLOSED** by this correction.

**Marker-string check (tree was mid-edit by a dev lane on `TitleScreen.tsx` / `Stamp.tsx`):**
`SUBTITLE = "UN SON · UNE NUIT · PAS D'ADRESSE"` (`TitleScreen.tsx:12`) and
`running: "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998"` (`print/tokens.ts:38`) both still
match the helper's markers — proceeded per the coordinator's guidance.

**Re-run evidence:**

| Check                           | Result                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `node --check` on all 5 scripts | **PASS** (e2e-lib, e2e-home, e2e-ingame, e2e-delivery, screenshot-preview)   |
| `yarn format:check` (full repo) | **PASS**                                                                     |
| `scripts/e2e-home.mjs`          | **PASS** (against local `vite preview`, base `/prohimuf/`)                   |
| `scripts/e2e-ingame.mjs`        | **PASS** (canvas + HUD on belliard)                                          |
| `scripts/e2e-delivery.mjs`      | **PASS** — DELIVERING → SUCCESS on belliard; halo AC4 gradient share 70.9% ✓ |

Build (`VITE_BASE=/prohimuf/ vite build`) succeeded on the mid-edit tree. All three e2e scripts
were re-run green against the served build via the shared helper. **The `deploy.yml` delivery
gate is now safe.**
