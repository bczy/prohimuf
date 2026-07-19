# Handoffs — Flyer paper materiality: occlusion-shadow exception & breakpoint-dependent roving axis (ADR-0049)

Encodes the design, reference validation, and render-lane tech plan for realistic 1990s
rave-flyer visual materiality: xerox grain, guillotine edge, worn glued-paper occlusion
shadow, realistic tape corners, and a breakpoint-dependent roving-focus axis (≥640px
viewport). Scope: A5 desktop format unified max-width 280px (design gate amendment);
dense-pile overlap re-tuning deferred to a future spec.

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
- release: `docs/game-design/ux/flyer-wall-format.md` (PASSED: A5 target-not-clip,
  ≥640px wrap grid + roving-axis flip, narrow cap, short-landscape rack ratio-waived) +
  `docs/art-direction.md` §2bis.2 (grain, guillotine edge, occlusion shadow, dog-ear/crease,
  A5 format, realistic tape).
- Amendment (design gate, Karim): max-width reconciled to ONE number — 280px
  (`FLYER_MAX_WIDTH_PX`); dense-pile overlap/rotation re-tuning deferred (contradicts the
  gated wrap-grid + existing-index-array AC) to a future dedicated pile-tuning spec.
- VERDICT: PASS-WITH-AMENDMENT — design gate (lead-game-designer)
  - Amendment: max-width 280px unified, dense-pile re-tuning deferred.

## 3. HOW — senior-architect (Winston) — 2026-07-19

- claim: freeze the render-layer contract (DOM restructure, drop-shadow exception to
  clip-path rule, breakpoint-dependent roving axis tokens, deterministic geometry helpers).
- release: FROZEN `src/render/**` contract + tech plan + lane assignment.

### Frozen contract — render restructure + CSS

**DOM shape (`src/render/ui/menu/LevelFlyer.tsx`):**

- `.flyer` (role=button, transform/pull/tilt, `position:relative`, NOT clipped) wraps:
  `.paper` (clip-path `var(--flyer-clip)`, stock background, grain/streak/crease overlays,
  content, `filter: drop-shadow(1px 3px 6px rgba(20,18,16,.35))`), a `.cutLine` inline SVG
  polygon sharing the clip vertices (crushed-fibre line), and `TapeCorner` as an UNCLIPPED
  SIBLING of `.paper` (tape bridges the cut edge; clip-path would erase box-shadow and
  clip the tape — hence drop-shadow on the clipped element).

**Layout (`FlyerWall.module.css` + `LevelFlyer.module.css`):** A5 `aspect-ratio:148/210`
target-not-clip, `max-width: var(--flyer-max-width)` (280px); desktop
`(min-width:640px) and (min-height:481px)` → row wrap + center + gap 24px; narrow <640
centered column; short-landscape rack untouched.

**Roving axis:** keyboard-focus axis flips vertical→horizontal at ≥640px via a new
SSR-safe `useMediaQuery` hook in `src/render/ui/print/`.

**New deterministic tokens (`src/render/ui/print/tokens.ts`, indexed, no Math.random):**
`FLYER_MAX_WIDTH_PX` (→ `--flyer-max-width` via `applyPrintTokens.ts`), `FLYER_EDGE_SEED`,
`FLYER_EDGE_MAX_DEV_PX`, `FLYER_DOG_EAR_CORNER`, `FLYER_CREASE_ANGLE_DEG`,
`FLYER_WEATHERED_INDICES`, `TAPE_WIDTH_PX`, `TAPE_FRAY_SEED`.

**Pure geometry helpers (unit-tested):** `flyerEdgePolygon(i)` (clipPath + svgPoints,
amplitude ≤ `FLYER_EDGE_MAX_DEV_PX`), `dogEarCorner(i)`, `tapeStripPath(corner)` (fray at
strip tips only).

### Lane assignment — render lane only

| Lane               | Owns (writes)                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **dev-r3f-render** | `src/render/ui/menu/*` (flyer restructure + layout), `src/render/ui/print/*` (TapeCorner, tokens, useMediaQuery) + tests |

No game-logic involvement; pure render-layer CSS + DOM shape. No shared-file contention.

### ADR impact

**ADR-0049** — "Flyer occlusion-shadow exception & breakpoint-dependent roving axis" (Proposed).
Amends ADR-0021 (print-token system) and ADR-0046 (render CSS Modules + tokens bridge):
the §2bis box-shadow ban gets a bounded ink-black occlusion exception shipped as
`filter: drop-shadow` on the clipped `.paper` (clip-path erases box-shadow; drop-shadow
follows the cut silhouette), and the flyer wall's roving-focus axis becomes
breakpoint-dependent (≥640px horizontal).

- VERDICT: **CONTRACT FROZEN.** dev-r3f-render → implement against frozen contract above.
  ADR-0049 to be drafted by tech-writer.

## 4. REFERENCE GATE — lead-art + Bertrand verdict — 2026-07-19

- claim: Bertrand's one-line approval on the reference board (graphic-references work,
  teknival xerox scans, tape samples, glued-paper study).
- release: Signed-off reference board, move to next cycle.
- VERDICT: PASS — Bertrand approval round 1 (reference hunt)

## 5. DEV — dev-r3f-render (Amelia) — DELIVERED

- claim: implement the render + token side against the FROZEN contract (§3 above).
- scope: LevelFlyer/FlyerWall restructure + layout, TapeCorner redesign, print tokens +
  `useMediaQuery`, unit tests for `flyerEdgePolygon`/`dogEarCorner`/`tapeStripPath` +
  screenshot gate (visual proof at 640px+ and mobile breakpoints).
- ADR-0049 allocated (producer) and drafted (tech-writer):
  `docs/adr/0049-flyer-occlusion-shadow-exception.md`.
- release: implemented per frozen contract. Verify — `yarn typecheck` clean, `yarn test`
  693/693 pass (new `flyerGeometry.test.ts` 9 tests, `applyPrintTokens.test.ts` +2 assertions),
  `yarn lint` clean, `yarn format` applied. NO game-logic touched, copy/stamps/roving-order/
  unlock logic untouched, short-landscape inline rack block untouched.
- File List:
  - `src/render/ui/print/tokens.ts` (+FLYER_MAX_WIDTH_PX/EDGE_SEED/EDGE_MAX_DEV/DOG_EAR/
    CREASE_ANGLE/WEATHERED/TAPE_WIDTH/TAPE_FRAY_SEED; type-only Corner import)
  - `src/render/ui/print/flyerGeometry.ts` (NEW — flyerEdgePolygon/dogEarCorner/tapeStripPath)
  - `src/render/ui/print/useMediaQuery.ts` (NEW — SSR/jsdom-safe matchMedia hook)
  - `src/render/ui/print/index.ts` (barrel exports)
  - `src/render/ui/print/TapeCorner.tsx` + `TapeCorner.module.css` (translucent frayed strips)
  - `src/render/ui/applyPrintTokens.ts` (+`--flyer-max-width`)
  - `src/render/ui/menu/LevelFlyer.tsx` + `LevelFlyer.module.css` (.flyer/.paper split, overlays)
  - `src/render/ui/menu/FlyerWall.tsx` + `FlyerWall.module.css` (A5 wrap + roving axis flip)
  - `src/render/ui/print/__tests__/flyerGeometry.test.ts` (NEW)
  - `src/render/ui/__tests__/applyPrintTokens.test.ts` (extended)
- RISK flagged for screenshot gate: the plan applies `aspect-ratio:148/210` to `.flyer`/`.paper`
  unconditionally; in the short-landscape rack this makes each 280px flyer ~397px tall
  (content is ~264px), which visibly changes the rack vs `flyer-wall-format.md` §4/AC4
  ("ratio waived, rack pixel-unchanged"). Implemented as the plan specifies (no waiver);
  needs a rack screenshot check — if the taller flyers regress the rack, add a
  `@media SHORT_LANDSCAPE_MEDIA { .paper,.flyer { aspect-ratio:auto } }` waiver (architect call).

---

## Audit trail

| Commit  | Author             | Message                                                                                                    | Stage                   |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ----------------------- |
| 2227937 | pm                 | docs(pm): story — flyer paper materiality, A5 desktop format, realistic tape                               | 1. INTAKE               |
| fae1a7a | lead-art           | docs(art): §2bis.2 flyer materiality — grain, guillotine edge, occlusion shadow, A5 format, realistic tape | 2bis.2 (design)         |
| 84e4dbd | graphic-references | docs(art): reference hunt board — 90s rave flyer materiality (4 directions)                                | 2bis.1 (reference hunt) |
| 76b0728 | ux-designer        | docs(design): UX flyer-wall format spec + art refs folded into §2bis.2 (prettier pass)                     | 2bis.2 (UX)             |
| 25216f2 | lead-game-designer | docs(design): design gate PASS — max-width unified at 280px, pile re-tuning deferred                       | 2bis.2 (design gate)    |
