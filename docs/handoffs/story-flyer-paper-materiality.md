# Handoffs — Flyer paper materiality: occlusion-shadow exception & breakpoint-dependent roving axis (ADR-0049)

Encodes the design, reference validation, and render-lane tech plan for realistic 1990s
rave-flyer visual materiality: xerox grain, guillotine edge, worn glued-paper occlusion
shadow, and a breakpoint-dependent roving shadow axis (≥640px viewport). Scope: A5 desktop
format unified max-width 280px (design gate amendment); tape/corner treatment deferred post-MVP.

## 1. INTAKE — pm (John) — 2026-07-19

- claim: story opening + scope framing — flyer materiality visual layer (texture, edge,
  shadow) as a conscious design extension beyond the Prohibition Atari ST base.
- release: story scope + AC mapping + PM stage handoff.

## 2. DESIGN LOOP — lead-art + ux-designer — 2026-07-19

### 2bis.1. Lead-art reference hunt — graphic-references (archive) — 2026-07-19

- claim: establish visual reference boards for 1990s French teknival xerox aesthetics,
  worn tape, glued-paper overlays, and occlusion shadows.
- release: `docs/art-references/flyer-materiality-hunt.md` (4-direction board: authentic
  teknival/indieground scans, torn-tape photo refs, glued-paper texture study).
- Checked against scope: conscious documentation of a Prohibition-not extension; paper
  materiality is a justified aesthetic layer, not core loop.
- VERDICT: PASS — reference hunt (lead-art)

### 2bis.2. UX flyer-wall format + design gate — ux-designer (Tony) + lead-game-designer (Karim)

- claim: UX spec for flyer-wall layout (responsive breakpoints, max-width unified at 280px
  desktop post-amendment), accessibility (reduced-motion safe shadow, contrast), and design
  gate verdict on materiality spec.
- release: `docs/game-design/ux/spec-flyer-wall-format.md` (A1–A8: breakpoint constraints,
  280px max-width, edge + shadow rendering, accessible shadow motion).
  `docs/game-design/spec-flyer-materiality.md` (design spec: grain, edge, occlusion shadow,
  tape—tape deferred post-MVP per design gate amendment).
- Amendment (design gate, Karim): max-width tightened to 280px unified across breakpoints
  (simplifies DOM, unifies shadow axis for ≥640px). Tape/corner detail deferred; shadow is
  gating constraint (breakpoint-dependent roving axis).
- VERDICT: PASS-WITH-AMENDMENT — design gate (lead-game-designer)
  - Amendment: max-width 280px unified, tape visual deferred post-MVP.

## 3. HOW — senior-architect (Winston) — 2026-07-19

- claim: freeze the render-layer contract (DOM restructure, drop-shadow exception to
  clip-path rule, breakpoint-dependent roving axis tokens, deterministic geometry helpers).
- release: FROZEN `src/render/**` contract + tech plan + lane assignment.

### Frozen contract — render restructure + CSS

**DOM shape:**

- `.flyer > .paper` (new wrapper for ::before pseudo-element shadow injection);
- clip-path on `.paper` (not `.flyer`), drop-shadow filter on `.paper::before` (exception:
  cannot live inside clip-path, must be injected via pseudo-element);
- content + existing children move INTO `.paper`; `.flyer` becomes the clip+shadow container.

**Shadow tokens (deterministic per breakpoint, asserted in unit tests):**

- Desktop (≥640px): roving axis at Δx=−0.08rem, Δy=+0.12rem (worn-tape tilt);
- Mobile (<640px): axis roving to Δx=−0.04rem, Δy=+0.08rem (lighter, stabler visual on small screens).
- Shadow blur: 0.24rem, spread: 0 (hard edge for xerox-ish edge worn look);
- Color: `rgba(0,0,0,0.35)` (semi-transparent black, occlusion not total).
- Reduced-motion: shadow held at the desktop angle (no sway animation), blur → 0.12rem
  (softer standby, motion eliminated).

**Pure geometry helpers (unit-tested):**

- `computeShadowOffset(viewportWidth: number): { x: number; y: number }` —
  returns Δx/Δy in `rem` units, breakpoint-aware.
- `applyShadowToken(element, config: ShadowConfig): void` — applies computed offset +
  blur/color via CSS custom properties (token-driven).

**Layout constants (in `src/render/ui/tokens.ts`):**

- `FLYER_DESKTOP_SHADOW_X_REM`, `FLYER_DESKTOP_SHADOW_Y_REM` (roving desktop offset);
- `FLYER_MOBILE_SHADOW_X_REM`, `FLYER_MOBILE_SHADOW_Y_REM` (roving mobile offset);
- `FLYER_SHADOW_BLUR_REM`, `FLYER_SHADOW_COLOR` (shared blur/color across breakpoints).

### Lane assignment — render lane only

| Lane               | Owns (writes)                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-r3f-render** | `src/render/ui/Flyer.tsx` (DOM restructure), `src/render/ui/tokens.ts` (shadow tokens), `src/render/scene/__tests__/` (geometry + screenshot gate) |

No game-logic involvement; pure render-layer CSS + DOM shape. No shared-file contention.

### ADR impact

**ADR-0049** — "Flyer occlusion-shadow exception & breakpoint-dependent roving axis" (Proposed).
Amends ADR-0021 (print-token system) and ADR-0046 (render CSS Modules + tokens bridge) by
extending the token contract to include shadow geometry. Reverses an earlier clip-path +
filter-stacking refusal: drop-shadow inside clip-path does not work (clip applies BEFORE
filter); solution is a pseudo-element outside the clip. Tokens remain centralized; the
exception is documented and bounded to `.paper::before`.

- VERDICT: **CONTRACT FROZEN.** dev-r3f-render → implement against frozen contract above.
  ADR-0049 to be drafted by tech-writer.

## 4. REFERENCE GATE — lead-art + Bertrand verdict — 2026-07-19

- claim: Bertrand's one-line approval on the reference board (graphic-references work,
  teknival xerox scans, tape samples, glued-paper study).
- release: Signed-off reference board, move to next cycle.
- VERDICT: PASS — Bertrand approval round 1 (reference hunt)

## 5. DEV — dev-r3f-render (Amelia) — IN FLIGHT

- claim: implement the render + token side against the FROZEN contract (§3 above).
- scope: Flyer.tsx DOM restructure, tokens.ts shadow constants, unit tests for
  `computeShadowOffset` + screenshot gate (visual proof at 640px+ and mobile breakpoints).
- NEEDS: ADR number allocated (producer to provide), handoff log opened (producer to write),
  then dev lane starts build.

---

## Audit trail

| Commit  | Author             | Message                                                                                                    | Stage                   |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------- |
| 2227937 | pm                 | docs(pm): story — flyer paper materiality, A5 desktop format, realistic tape                               | 1. INTAKE               |
| fae1a7a | lead-art           | docs(art): §2bis.2 flyer materiality — grain, guillotine edge, occlusion shadow, A5 format, realistic tape | 2bis.2 (design)         |
| 84e4dbd | graphic-references | docs(art): reference hunt board — 90s rave flyer materiality (4 directions)                                | 2bis.1 (reference hunt) |
| 76b0728 | ux-designer        | docs(design): UX flyer-wall format spec + art refs folded into §2bis.2 (prettier pass)                     | 2bis.2 (UX)             |
| 25216f2 | lead-game-designer | docs(design): design gate PASS — max-width unified at 280px, pile re-tuning deferred                       | 2bis.2 (design gate)    |
