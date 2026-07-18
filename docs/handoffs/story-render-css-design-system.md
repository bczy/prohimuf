# Story — render-layer CSS Modules design-system foundation (P1)

Move `src/render/ui` off inline `style={{…}}` onto a real styling system, and lay the
design-system foundation. ADR-0046. Branch `claude/render-css-design-system` (stacked on
#94 fonts), PR #95.

## 0/1. INTAKE — Bertrand → orchestrator — 2026-07-18

- claim: "trop de CSS inline dans le HUD … installe un skill/agent spécialisé … design
  system … Figma". Not acceptable as-is.
- release: scoped by `senior-architect` (CSS architecture) + `ux-designer` (design system +
  Figma). Consolidated phased plan; Bertrand chose **P1 complet**, **dedicated branch**,
  **Figma = yes (P3, blocked on editor access — MCP is read-only here)**.

## 3. TECH PLAN — senior-architect — 2026-07-18

- **CSS Modules** (`*.module.css`) + a `tokens.ts`→CSS-custom-property boot bridge
  (`applyPrintTokens.ts`), zero new dep; dynamic values stay inline as CSS vars; a `hud-css`
  **skill** (not an agent — `dev-r3f-render` already owns `src/render`). ADR-0046 (0046
  collision-checked). VERDICT: architecture PASS.

## 4. BUILD (P1) — dev-r3f-render — 2026-07-18

- `applyPrintTokens.ts` (bridge, unit-tested for full token coverage) + `base.css`
  (reduced-motion) wired in `main.tsx`; extended tokens (`FONT_SIZE`/`SPACE`/`KEYLINE_WIDTH`/
  `Z`); `HUD.tsx` → `HUD.module.css` (CSS Modules), **pixel-identical** (getComputedStyle
  byte-identical across the strip). tsc + 575 tests + lint + build green.

## HUD LEGIBILITY A+B — Bertrand + lead-art — 2026-07-18

- Bertrand: HUD text too small/illegible in-game. A (labels 9→11px, niveau 12→16px) + B
  (HUD strip → IBM Plex Mono, readouts 600). lead-art **PASS** (logged `fixes.md`); Plex
  accepted as the in-game instrument face; Rubik reserved for stamps. Bertrand chose "garder"
  (Plex readouts). Bible rule formalized (art-direction §Typographie).

## STAGE-6 REVIEW PANEL — 2026-07-18

- 4 reviewers in parallel on `git diff claude/game-font-design-c0gk2h...HEAD` (render-CSS
  delta only): code-review(high) · bmad-code-review · edge-case-hunter · security-review.
- **CONFIRMED MAJEUR (A+C): reduced-motion override was a no-op** — `applyPrintTokens` writes
  `--motion-*` inline on `:root`, outranking the `base.css` `@media` reset without
  `!important`. FIXED (added `!important`; commit 68c8cd6). Latent (no `var(--motion-*)`
  consumer wired yet) but it is ADR-0046 D4's stated a11y path.
- MINEUR (C+D): NaN energy/integrity → `NaN%` gauge width. FIXED (finite guards, 68c8cd6).
- NIT (A+B): `Z`/spacing/motion tokens injected but not all consumed yet. Triage: **keep** —
  deliberate design-system foundation, P2 (imminent) is the consumer, documented + test-pinned.
- Security: CLEAN (injection-free; IBM Plex woff2 legit + OFL-compliant). Boundary: CLEAN
  (style logic holds no game rule; no `src/game` import; ramp fns stay render-side TS).
  Single-source, strict-TS, FOUC, CSS-module override ordering all verified.
- VERDICT: **MERGE** — no unresolved CONFIRMED BLOQUANT/MAJEUR after fixes. Re-verified green.

## P2 STEP 1 — HUD widget extraction — dev-r3f-render — 2026-07-18

- `HUD.tsx` 515 → 97 lines; 9 widgets extracted to `src/render/ui/hud/` (each + co-located
  `*.module.css`); ramps → `hud/derivations.ts`; `cx()` → `hud/cx.ts`. Public `HudData/*`
  unchanged. PR #97 (branch `claude/render-css-p2-widgets`, off merged #95).
- Pixel-identity PASS: canvas diff 0px on the strip; overlays structurally lossless.
  tsc + 575 tests + lint + build + format:check green.

## P2 STEP 1 — STAGE-6 REVIEW PANEL — 2026-07-18

- 4 reviewers on `git diff origin/main...HEAD` (22 files): code-review(high) MERGE ·
  bmad-code-review MERGE · edge-case-hunter **zero findings, CONFIRMED lossless** ·
  security-review clean. Boundary CLEAN (derivations render-side, no `src/game` import);
  tokens single-source; strict TS.
- No CONFIRMED BLOQUANT/MAJEUR. NIT/MINEUR only, deferred to the shared-primitives step:
  (1) shared readout classes (`.item`/`.label`/`.value`/`.chip`/`.centerOverlay`) duplicated
  across co-located modules → collapse into a shared module / CSS `composes` when the shared
  primitives land; (2) relocate the `Hud*` types to `hud/types.ts` to drop the type-only import
  cycle (HUD.tsx re-exports for external consumers); (3) `.energyTrack` raw `1px` → `var(--keyline-width)`
  in a future token pass (pre-existing, carried verbatim).
- VERDICT: **MERGE**.

## P2 STEP 2 — CSS consolidation + type relocation + HTML catalog — dev-r3f-render — 2026-07-18

- `hud/shared.module.css` (widgets consume via CSS-Modules `composes`); `Hud*` types → `hud/types.ts`
  (`HUD.tsx` re-exports); offline HTML component catalog (`catalog.html` + `src/catalog/`, env-gated
  `BUILD_CATALOG=1` separate Vite entry, never in the game bundle). PR #98.

## P2 STEP 2 — STAGE-6 REVIEW PANEL — 2026-07-18

- 4 reviewers on `git diff origin/main...HEAD`: security CLEAN · code-review MERGE · bmad MERGE ·
  **edge-case-hunter: CONFIRMED BLOQUANT** — the `composes` refactor put `padding`/`border` on the
  shared `.chip`, which the set-piece stamp modifiers (`.chipOtage` 10×22/3px, `.chipVerdict`
  12×26/3px, `.chipMessage` 14×28/3px) override at equal specificity, so the winner depended on
  CSS emit order. In the bundle the shared base emitted after `.chipOtage`/`.chipVerdict` → it won →
  OTAGE + QTE verdict stamps collapsed to 6×12/2px (pixel regression the dev's strip-only verify missed).
- VERDICT: NO-MERGE → **fix applied** (dev-r3f-render): removed `padding`/`border` from shared `.chip`
  (kept `background`+`font-family`); declared the default explicitly on `.chipDelivering`/`.deliveryVerdict`.
  No property now lives in both base and modifier → order-independent, no `!important`. Verified via
  catalog `getComputedStyle`: every chip variant matches origin/main intent. tsc + 575 tests + lint +
  build + build:catalog + format:check green. HUD strip untouched.
- Non-blocking NITs deferred: `build:catalog` inline env-var (POSIX-only; `cross-env` not a dep, left);
  catalog bootstrap hex + HalftoneHero asset (catalog-only cosmetic).
- VERDICT after fix: **MERGE**.

## OUTSTANDING

- P3 Figma (Menu/Pause/End screens + Code Connect) blocked on the Figma Starter-plan MCP tool-call
  limit — deferred. Tokens + Composants + TITLE screen were built before the cap.

## MENU-SCREEN MIGRATION — dev-r3f-render — 2026-07-18

- All 10 pre-game/menu surfaces migrated inline → co-located CSS Modules (Title, MainMenu, Loading,
  End, Rotate, Narrative, Pause + menu/LevelFlyer, ScoresUne, OptionsColophon). Net −663. Shared
  primitives extracted to `src/render/ui/controls/`: `Overlay` (Pause+End) + `SelectableListItem`
  (Menu tabs / Scores éditions / Options ballots). Button/Toggle left local (single-use). `INK.mute`
  token added (auto-bridged). PR #102, branch `claude/render-css-menus`.
- Pixel-identity PASS per surface (headless byte-diff, animations frozen). tsc + 575 tests + lint +
  build + build:catalog + format:check green.

## MENU-SCREEN MIGRATION — STAGE-6 REVIEW PANEL — 2026-07-18

- 4 reviewers on `git diff origin/main...HEAD` (28 files): code-review MERGE · bmad MERGE ·
  edge-case-hunter clean · security clean. The #98 cascade lesson held — every `composes`/modifier
  pair verified **property-disjoint** (order-independent, no regression). Pixel-identity confirmed
  value-by-value across all 10 surfaces; boundary intact; strict TS.
- No CONFIRMED BLOQUANT/MAJEUR. Cosmetic NITs only (optional follow-ups): `Overlay` catalog specimen
  escapes its cell (dev-doc); size-token consistency (some literals where a `FONT_SIZE`/`SPACE` token
  exists — zero pixel impact, ADR mandate "no hex/font/motion" satisfied); `SelectableListItem`
  docstring imprecision; `OverlayProps.children` stricter than needed.
- VERDICT: **MERGE**.

## DONE

- Design-system render layer complete: fonts (ADR-0045) + CSS Modules + token→CSS-var bridge + HUD
  (migrated, legible, widgetised, consolidated) + all menu screens + HTML component catalog (ADR-0046).
- Figma « muf — Design System » (Tokens + Composants + TITLE) built to the Starter-plan cap; Figma
  Menu/Pause/End screens + Code Connect remain, blocked by that external limit.
