# Story — Flyer Paper Materiality & Desktop A5 Format

**Status:** Draft — ready for design/architect triage
**Source:** Bertrand feedback, 2026-07-19 (verbatim FR in handoff log)
**Surface:** `src/render/ui/menu/LevelFlyer.tsx`, `LevelFlyer.module.css`, `FlyerWall.tsx`,
`FlyerWall.module.css`, `src/render/ui/print/TapeCorner.tsx` — NIVEAUX menu only.

## Cahier des charges test

Prohibition Atari ST had no menu screen of this kind — the fanzine/flyer skin is an
already-documented conscious extension (ADR-0021, ADR-0046, `docs/art-direction.md`
§2bis). This story does **not** reopen that decision; it fixes an execution gap against
the already-agreed "photocopied fanzine" direction: the flyer currently reads as "a
colored square," not a rave flyer. Presentation-only polish of a gated surface. No game
logic, no `src/game` changes.

## WHAT

**(a) Paper materiality (shape/object, all devices).** Give each flyer physical paper
presence: grain/texture, a non-perfect edge (rough-cut or torn look), subtle drop shadow
lifting it off the backing (`STOCK.shell`). Applies to the flyer's shape/surface only —
copy, stamps, marker circle, tape corner, layout stay untouched. Inspiration is open
(CSS clip-path torn edge, SVG filter grain, background noise texture, layered shadow) —
proposal comes back through the design loop, not prescribed here.

**(b) Desktop format.** Flyers must read as half-A4 portrait sheets (A5 ratio ≈
148:210 ≈ 0.705 width/height), not full-width horizontal bands. Applies to the
`.wall`/`.slot` sizing in the default (non-short-landscape) flex-column layout;
mobile-portrait single-column and the existing short-landscape 280px rack (ADR-0024)
are separate breakpoints and must keep working.

**(c) Tape realism (`src/render/ui/print/TapeCorner.tsx`, mid-flight add,
2026-07-19).** The tape-pin strips on the focused/pulled flyer currently read as flat
crossed strokes, not adhesive tape. Rework the visual treatment so each pin reads as a
real strip of translucent masking tape sitting on top of the flyer stock: visible
translucency (the fluo stock color must show through, tinted, not just a flat opaque
rotated rectangle), and irregular/non-rectangular strip ends (torn/uneven edge on the
short sides) rather than a clean-cut rectangle. Same zero-glow constraint; same
deterministic-per-corner treatment (`CORNER_STYLE`), no runtime randomness.

## Scope guard

- No change to `src/game/**`.
- No change to flyer copy, stamps, roving-focus logic, or unlock logic.
- Zero-glow rule holds (ADR-0021/§2bis): grain/torn-edge/shadow are hand-made
  artifacts, not light/glow effects.
- This is a `render/ui` presentational change; single-lane unless the chosen technique
  needs a new shared primitive in `src/render/ui/print` (then flag to senior-architect).

## Acceptance criteria

1. **Materiality — visible, deterministic.** Each flyer shows a paper texture/grain and
   a non-rectangular/non-perfect edge (not a plain 4-corner rectangle) plus a subtle
   shadow, on mobile portrait, short-landscape rack, and desktop. No `Math.random` at
   render time — any per-flyer variation uses the existing deterministic index arrays
   (pattern of `FLYER_REST_ROTATION_DEG`/`FLYER_JITTER_PX`) or a static/CSS-only effect.
2. **Desktop A5 format.** On desktop (non-short-landscape) each flyer's rendered box
   approximates A5 portrait ratio (0.705 ± 0.05) and does not stretch full-width; wall
   layout adapts (e.g. capped max-width + centered, or grid) so flyers read as a stack
   of half-sheets, not bands.
3. **Mobile portrait & short-landscape unaffected in structure.** Existing single-column
   portrait stack and the 280px scroll-snap rack (ADR-0024) keep their current
   breakpoint behavior; only the per-flyer materiality is added.
4. **Content untouched.** No copy, stamp, marker-circle, tape-corner, or info-row change;
   diff stays inside shape/surface (background/texture/edge/shadow) and sizing.
5. **Perf.** No added texture asset over ~50KB per stock color; prefer CSS-only
   (gradients/filters/clip-path) or a single small shared SVG/texture reused across all
   flyers. No runtime cost added to `useFrame`/game loop (this is DOM/CSS, not R3F).
6. **Accessibility.** Contrast of text against each `STOCK.*` color is not degraded by
   the new texture/overlay (recheck against existing WCAG pass). `prefers-reduced-motion`
   still respected (no new motion is introduced by this story; if a shadow/texture
   requires an entrance transition, it must be forced off under reduced-motion, matching
   the existing `.muf-anim` pattern).
7. **Tests.** `rtk tsc` + `rtk lint` clean; any new deterministic helper (e.g. an edge
   path generator) gets a Vitest unit test if it lives outside a pure CSS solution.
8. **Tape realism.** Each `TapeCorner` pin visibly shows the underlying flyer stock
   color tinted through it (true alpha translucency over the actual per-flyer `STOCK.*`
   background, not just the fixed manila-ish inline rgba currently hardcoded) with
   irregular/torn short-edge ends (not a plain rectangle); still zero-glow (no
   drop-shadow-as-light, no gradient simulating a light source); still fully
   deterministic per corner (`CORNER_STYLE`/`corners` prop only, no `Math.random`).

## Out of scope

Flyer copy/stamps, roving focus, unlock logic, tutorial/locked-state visuals beyond what
inherits automatically from the shared shape change, any change to `STOCK` hex values,
any change to when/where `TapeCorner` appears (still pulled/focused-flyer only).

## Suggested next step

Route through the design loop (`game-designer`/`ux-designer` for the shape/texture
direction — visual, not gameplay) before dev-r3f-render implements, per COLLABORATION.md
stage flow: this touches visual craft/AD compliance, not pure mechanics, so a light
`ux-designer` + `lead-game-designer` pass on the proposed technique is enough; no
`narrative-designer` needed (no copy/fiction change).
