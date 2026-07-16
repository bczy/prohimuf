# 0028 — Rendered-scene window-alignment harness for belliard

- **Status:** Accepted
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
