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

## OUTSTANDING

- P2 (extract 9 HUD widgets + shared primitives + HTML catalog) and P3 (Figma + Code Connect,
  blocked on Bertrand creating the file + sharing editor access). Merge ordering: #94 then #95.
