# 0028 — Rendered-scene window-alignment harness for belliard

- **Status:** Accepted — **amended 2026-07-17** (measured per-window edges + `MISALIGN` defect; see amendment below)
- **Date:** 2026-07-15

## Context

Belliard's enemy/railing slots come from `windowZones.generated.json`, produced by
snapping a fixed 7×3 grid to warm-window centroids (`scripts/gen-window-zones.mjs`).
The real `facade.png` has tall irregular French windows off that lattice, so slots
land on bare wall (empty windows / railings on nothing) and sprites overflow their
openings. We needed a gate whose success condition is "0 window defects on belliard,"
self-correcting, verified against the actually-rendered scene (not just the image).

## Decision

1. A `scripts/` harness (`align-belliard-windows.mjs`) detects windows from
   `facade.png` via a **warm-lit floor-row × column-density-peak** detector
   (variable count, replacing the fixed 21), then verifies against the **live
   headless renderer**: reusing the existing `__MUF_FREEZE_COPS__` (one static cop
   per slot), plus two new dev-only render hooks — `__MUF_ZONES__` /
   `__MUF_APPLY_ZONES__` (push candidate zones without a rebuild) and
   `__MUF_SLOT_RECTS__()` (read each sprite's rendered plane box in per-panel
   facade-normalized coords). All three globals are never set in production (same
   precedent as `__MUF_FREEZE_COPS__`).
2. It loop-corrects each zone's height/center until every sprite plane ⊆ its opening
   (+τ) and zones ↔ openings are 1:1, then overwrites the `belliard` key of
   `windowZones.generated.json` (4 identical panels — one `facade.png`). Note the
   render sizes the sprite from the zone **height** (`planeH = size.y·0.8`, width =
   `planeH·aspect`), so height/center are the correction knobs; the zone width only
   drives the railing.
3. `--check` gates (nonzero on any defect, no write); `--fix` corrects and writes.
   Belliard's slot count becomes data-driven (21→17/panel, rows 5/5/7).

## Consequences

- Fixes empty-window and overflow defects with a repeatable, CI-gateable check.
- Adds three dev-only `window.__MUF_*` hooks (inert in production).
- Belliard's simultaneous-cop density drops 21→17/panel (game-designer sign-off;
  mechanically safe — slot count was already dynamic, `spawnWave` caps at
  `slots.length`, `enemiesToWin` unaffected).
- `belliard.windows` in `levelArt.json` becomes dead fallback for belliard.
- Sprite width stays coupled to zone height in `EnemySprite` (known limitation;
  decoupling `size.x` deferred). `gen-window-zones.mjs` is unchanged (still serves the
  other levels' grid-snap).

## Amendment 2026-07-17 — measured per-window edges + `MISALIGN` defect

**Problem.** The v0 harness fixed sprite _overflow_ (height/centre) but left the
foreground railing (`drawForegroundIronwork`, drawn on `zone.x`/`zone.w`) horizontally
offset from the real windows on belliard: `detectColumns()` returns only warm centroids
and `detectOpenings()` stamps a fixed `cfg.openingW` on every opening, so per-window
`x`/`w` are never measured; and `measure()` has no horizontal-offset defect, so the loop
converges with railings on bare wall.

**Decision (scripts-only; no `src/render` or `src/game` change).**

1. **Measured edges in detection.** `detectColumns()` returns `{cx, x0, x1}` per window
   (normalized) instead of a bare centre. Per-opening `w = (x1 - x0)/W`, clamped to a sane
   band around the seed: `w ∈ [0.55·openingW, 1.6·openingW]`. When a wide run is
   pitch-split, each sub-window's `[x0,x1]` are the split segment's bounds and `cx` is the
   warm centroid _within that segment_ (already computed by the split loop — now returned,
   not discarded). The trailing min-pitch merge unions the bounds of the two collapsed
   centres and recomputes `cx`. `detectOpenings()` writes this measured `w` (and refined
   `x`) onto each opening.
2. **Fallback (answers PM's open question).** Dark/unlit windows are _never_ zoned by
   design, so every zoned opening sits on a lit warm run and has real bounds. `openingW` is
   therefore demoted to a **fallback seed only**: used for the clamp band above, and as the
   width when a run degenerates (zero warm mass / `x1-x0 < minRunW·W` after split/merge) —
   then `w = openingW` centred on `cx`. It is no longer the primary width source.
3. **New `MISALIGN` defect in `measure()`.** For each zone matched to its opening (nearest
   centre, same greedy match as slots), flag `MISALIGN` when `|zone.x − o.x| > τ_align`
   **or** `|zone.w − o.w| > τ_align`, with `τ_align = 0.012` (normalized ≈ 15 px on 1280).
   `measure()` gains the applied `zones` array as an argument (committed zones in `--check`,
   `panelZones` in `--fix`). Applies identically in the `--fix` loop and the `--check` gate.
4. **Correction (deterministic, 1 iteration).** On `MISALIGN`, set `zone.x = o.x`,
   `zone.w = o.w` from the measured opening. `zonesFromOpenings()` already propagates
   `o.x`/`o.w`, and the overflow shrink loop only touches `h`/`y` — so regenerated data is
   aligned by construction and `MISALIGN` re-checks to 0 without iterating.
5. **Boundary / fidelity note.** The change is confined to `scripts/align-windows.mjs` plus
   the regenerated `src/game/levels/windowZones.generated.json` **data**. `zone.w`/`zone.x`
   are already consumed by the railing drawer, so `src/render` and `src/game` code are
   untouched and the game↔render contract is unchanged. **The v0 "belliard reproduced
   byte-for-byte" promise is intentionally broken for `x`/`w`** — that is the whole point of
   this amendment; belliard's zone `x`/`w` now carry measured edges. Row count, floor split
   (5-5-7 / 17 per panel), `h` and `y` are unaffected.

**Lane.** Single `dev-tooling-assets` lane: amend the harness, run `--fix` to regenerate
`windowZones.generated.json` (all three levels, 0 defects incl. `MISALIGN`), update
`SCRIPTS.md`/`HARNESS.md`. Orchestrator runs verify (`rtk tsc`/`vitest`/`lint` + the
`--check` gate + a belliard `verify`-skill screenshot). Test expectation: extract the
edge comparison as a pure helper (e.g. `misaligned(zone, opening, τ) → boolean`) exported
from the harness and unit-test the tolerance boundary only (just-inside pass /
just-outside fail on both `x` and `w`). Do not over-engineer — detection stays integration-
tested via the `--check` gate, not unit-mocked.
