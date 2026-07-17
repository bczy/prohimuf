# Story: Harness — per-window measured edges so foreground railings frame the real windows

**Owner:** PM (John) · **Type:** Fidelity fix (existing harness) · **Date:** 2026-07-17
**Reporter:** Bertrand · **Scope guard:** No new gameplay. Tightens ADR-0028 window-alignment harness only.

## Context

ADR-0028 (`scripts/align-windows.mjs`) fixed sprite *overflow* — sprites no longer spill
outside their zone. But the code-drawn foreground railings ("barrières" / garde-corps,
painted on `zone.w` by `src/render/scene/foregroundArt.ts`) are still horizontally
misaligned on **belliard**: the railing frame sits visibly left or right of the real lit
windows. The harness converges "green" while railings stand on bare wall.

## Problem statement

1. `detectColumns()` returns only window **centres** (warm-light centroid, biasable). Each
   opening then gets a **fixed** per-level `cfg.openingW`. So `zone.x` can be off-centre and
   `zone.w` never matches the painted window's real width.
2. `measure()` only scores OVERFLOW (sprite-box containment), COUNT, EMPTY, WALL. A
   horizontally offset railing frame is **not a defect today**, so the optimiser converges
   with railings misaligned.

Net: the harness measures the wrong thing. It must measure each opening's real horizontal
extent and treat frame-vs-opening offset as a first-class defect.

## Acceptance criteria

1. **Measured per-window edges.** Detection returns, per opening, a measured left edge and
   width (`x` + `w`) derived from the painted window's actual lit extent — not a fixed
   `cfg.openingW`. `openingW` is removed or demoted to a fallback seed only, documented as such.
2. **New defect class: `MISALIGN`.** `measure()` gains a defect for horizontal offset between
   the zone/railing frame (`zone.x`..`zone.x+zone.w`) and the measured painted opening, scored
   against an explicit numeric tolerance (e.g. left-edge and right-edge deltas each ≤ N px,
   N a named constant). Centre-offset AND width-mismatch both trip it.
3. **Zero defects, all levels.** The fix loop converges to **0 total defects — including
   `MISALIGN` — on belliard, stalingrad, and vitry**. Prior defect classes (OVERFLOW, COUNT,
   EMPTY, WALL) remain at 0. No level regresses.
4. **`--check` gate covers `MISALIGN`.** Running the harness in `--check` mode fails (non-zero
   exit) if any level carries a `MISALIGN` defect, exactly as it does for existing classes.
5. **Regenerated data ships + visual proof.** Updated `windowZones.generated.json` is committed;
   the harness proof/overlay artifacts show each railing frame bounding its window, and an
   in-game screenshot (via `verify` skill) on belliard shows railings framing the lit windows
   — no bare-wall railings, no left/right shift.
6. **Quality green.** `rtk tsc` + `rtk vitest` + `rtk lint` all pass. New detection/measure
   logic in `scripts/` (or any `src/game` pure helper it grows) has unit coverage for the
   `MISALIGN` tolerance boundary (just-inside pass, just-outside fail).
7. **Docs updated.** `SCRIPTS.md` / `HARNESS.md` describe measured per-window edges and the
   `MISALIGN` defect + tolerance; ADR-0028 is amended (or a new superseding ADR added) recording
   the move from fixed-width to measured-edge alignment.

## Out of scope

Detection algorithm may change internally, but no change to gameplay, level roster, art assets,
or the render contract beyond consuming the corrected `zone.x`/`zone.w`.

## Hand-off

Boundary-affecting (touches `scripts/` measurement + consumed by `src/render`): route to
`senior-architect` for lane assignment before dev. Log in `docs/agent-handoffs.md`.
