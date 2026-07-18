# 0046 — Tronçon-sequence backdrop mode + variable-width gameplay grid (Rue Belliard décor v2)

- **Status:** Proposed
- **Date:** 2026-07-18
- **Number:** provisional — allocated pending `producer` (Marion) confirmation in
  `docs/handoffs/story-foreground-parallax.md` (next free after ADR-0045 on this branch;
  `origin/main` is at 0044, this branch added 0045; if Marion assigns a different number
  this file is renamed and the index row updated).

## Context

Rue Belliard's backdrop today is one repeating `facade.png` laid as **N = 4 identical
fixed-width panels** by `LevelBackdrop.tsx`, with the left edge of every panel after the
first alpha-feathered (`facadeLayout.ts` `BLEND = 0.08`) to crossfade the seams, over a
single slow-parallax sky. Art direction validated a remake
(`docs/art-direction/prompt-drafts/level-belliard-decor-v2.md`): the facade becomes **3
distinct, variable-width, transparent-background "tronçon" images** (2–3 faubourg buildings
each, a gap beat — sky sliver / mur-pignon / passage — at each end), tiling side-by-side over
a **separate parallax sky that shows through both the above-roofline area and the thin
between-building sky slivers** (real transparency, not a crossfade). Each tronçon bakes its
own far-side trottoir band. The finalized keyed PNGs land as
`public/assets/levels/belliard/troncon-a|b|c.png`, aspects **A 1.499, B 1.626, C 1.750**
(height fixed at `WORLD_HEIGHT`).

**Scope ruling (Bertrand, 2026-07-18):** the full integration ships in **this** PR (#76) —
backdrop **and** gameplay. Nothing is deferred. The earlier draft of this ADR proposed a
visual-only slice with a frozen spawn grid; that deferral is **overridden**. Belliard is a
**fully playable level** (`enemiesToWin: 10`, `timeSeconds: 90`, courier street, hostage QTE,
scripted delivery — `src/game/levels/levels.ts`), so this ADR now covers moving the load-bearing
spawn harness onto the new art.

This retires four assumptions welded into the current render + gameplay coupling:

- **Same image × N, fixed pitch.** `GameScene.tsx:134-136` derives `panelW = WORLD_HEIGHT *
FACADE_ASPECT` (shared manifest facade aspect) and `fullW = panelW * PANELS` with the global
  `PANELS = 4`. Variable-width tronçons break both the single-image and the fixed-pitch basis.
- **Equal-panel zone tiling.** `tilePanelZones` (`levelArt.ts:305`) maps a panel-local zone to
  global by `x = (p + z.x)/panels, w = z.w/panels` — hard-codes equal panel widths.
- **Per-panel feather-stretch remap.** `applyFacadeStretchX`/`invertFacadeStretchX`
  (`facadeLayout.ts`) exist ONLY to compensate the `FACADE_DRAW_SCALE = 1.08` overlap the
  feather needs. Tronçons draw at native width with **no** feather/stretch (the seam is a real
  transparent gap the sky shows through), so that remap must not apply to belliard.
- **Uniform 7-window grid.** `windowZones.generated.json` (belliard = 4 panels × 18 zones) and
  the manifest `windowGrid`/`windows` encode one repeating 7-window facade. The 3 tronçons have
  **their own irregular window positions per building** (different counts/heights) — cop-pop
  zones and the `ForegroundFrames` ironwork must be **re-derived from each tronçon image**.

Forces: the **boundary law** (`src/game` no React/Three; `src/render` no rules; `src/hooks` the
only bridge); **stalingrad and vitry must stay byte-for-byte** on the fixed path; **spawn
positions must be deterministic** (replay-safe); the change **moves where cops pop and where the
player aims**, so it needs a design/QA re-gate.

## Decision

**1. A per-level `BackdropLayout` becomes the single grid abstraction (game data).** Add a
derived `getBackdropLayout(levelId)` in `src/game/levels/levelArt.ts` (pure, no React/Three)
returning:

```
{ fullW, tiles: [ { width, centreX, drawScale, zones } … ] }   // tiles in fixed sequence order
```

where `width_i = WORLD_HEIGHT * aspect_i`, `centreX_i = -fullW/2 + Σ_{j<i} width_j + width_i/2`,
`fullW = Σ width_i`, and `zones` are that tile's window zones normalized within its own width.
This replaces the `panelW × PANELS` + `tilePanelZones` + `computeSlotsFromZones(_, fullW, _)`
pipeline with one world-space composition: a tile-local zone `(x,y,w,h)` → world
`screenPosition.x = centreX_i + (x−0.5)·width_i`, `y = (0.5−y)·facadeH`, `size.x = w·width_i`.

**2. Backdrop mode discriminates the two layouts; single-facade is reproduced exactly.**
`LevelArt` gains `backdrop`:

- absent / `{ mode: "single-facade" }` → `getBackdropLayout` emits **`PANELS` equal-width tiles**
  with `drawScale = FACADE_DRAW_SCALE (1.08)` and the level's repeated zones, computed to be
  **numerically identical** to today's slots (unit-tested byte-for-byte for stalingrad/vitry).
  The fixed path is a special case of the general one — one downstream consumer, provable
  non-regression.
- `{ mode: "troncon-sequence", tiles: [{ file, aspect }, …] }` → the variable-width tiles above,
  `drawScale = 1.0` (identity — no feather remap). The `tiles` array is the **fixed, explicit,
  deterministic** sequence (art/design freezes the validated shuffle into the manifest; it is
  NOT randomized at runtime, so spawn positions are stable). `fullW` derives from the sum.

**3. Render consumes the layout (`src/render`), no rules added.** `LevelBackdrop.tsx` branches
on mode: single-facade keeps its exact current path; troncon-sequence draws each tile as its own
world-locked plane at native `width`, butted at `centreX`, **no left-edge feather**, letting the
unchanged parallax `sky` show through rooflines and slivers, plus the `street`/road band and the
near-foreground (ADR-0045). `GameScene.tsx` reads slots from `getBackdropLayout` (drops the local
`panelW`/`PANELS` math); `ForegroundFrames` is placed per tile at `centreX_i` with `facadeW =
width_i` and that tile's zones (replacing the `(p−(PANELS−1)/2)·panelW` group placement). The
`applyFacadeStretchX` remap is applied with each tile's `drawScale`, so it is identity for
belliard and unchanged for the fixed levels.

**4. Window zones re-derived from the tronçon art (`scripts/gen-window-zones.mjs`).** The script
is reworked from "snap one `windowGrid` across 4 equal panels of `facade.png`" to **detect each
tronçon's real window openings** (per building, irregular count) in `troncon-a|b|c.png` and emit
per-tronçon normalized zones; `windowZones.generated.json` for belliard is keyed to the tile
sequence (per-tronçon zone sets, expanded to the sequence by `getBackdropLayout`). Alignment is
validated through the **layout-aware** dev harness (below). Cops therefore pop on real painted
windows and railings sit on real balconies.

**5. The ADR-0028 dev harness generalizes to the layout.** `__MUF_SLOT_RECTS__`,
`__MUF_PROJECT__`, `__MUF_ZONES__` (`GameScene.tsx`) drop `panelW = fullW/PANELS` +
`floor(globalXNorm·PANELS)` and instead locate a world-X's tile by cumulative offsets, reporting
tile index + tile-local coords. This keeps `gen-window-zones`' SCREEN validation pass working on
the variable layout (round-trip identity unit-tested).

**6. Near-side trottoir on the `street` layer (v2 §4).** The far-side trottoir is baked in each
tronçon; the near-side band is added to the `street`-layer prompt (`level-street.md`) as its own
single-clause iteration **with a seed re-pin**, generated in CI. The ×2.4 hostage-QTE zoom reads
the overhead `street` patch — with the baked far-trottoir + the new near-trottoir the QTE
cross-section is re-confirmed at the composite gate (v2 §6.3).

**Keying (v2 §6.4):** a **region-mask cut** (above rooflines + inside sky slivers only), NOT a
global near-black chroma-key, so the deep-night grimy walls survive (sprite-hole-audit risk).

## Consequences

**Positive**

- One world-space slot pipeline for both layouts; enemies, couriers, QTE and delivery "just
  work" off correct world slots (`EnemySprite`/`useGameLoop` unchanged).
- The fixed levels are provably untouched (single-facade is a special case, byte-identical test).
- Deterministic tile sequence keeps spawns replay-safe; variable widths are a clean seam for
  future distinct-building streets.
- Boundary law intact: tile geometry + zones are game data in `src/game`; the render only draws
  them; the generated zones are a build artifact.

**Negative / cost**

- Touches all four coupling sites in one PR (backdrop render, slot pipeline, harness, generator)
  plus a gameplay re-gate — a genuine cross-layer change (this ADR is the sign-off).
- `fullW` for belliard becomes `Σ tile widths` rather than the current `80`. If it deviates
  materially, spawn density / camera-pan range / `enemiesToWin` / `timeSeconds` shift — a
  `game-designer` tuning call. The validated sequence should sum near the current width to
  minimize retune.

## Risk register (biggest first)

1. **Window misalignment** — mis-detected zones ⇒ cops pop off-window / railings on blank wall.
   Verify: layout-aware SCREEN harness (`gen-window-zones` gate) + composite-gate screenshot +
   `game-designer` playtest.
2. **stalingrad/vitry regression** from unifying the slot pipeline. Verify: unit test that
   `getBackdropLayout` reproduces today's slots byte-for-byte for both fixed levels.
3. **Difficulty drift** from the changed `fullW`. Verify: `game-designer` playtest vs
   `spec-*`; tune `enemiesToWin`/`timeSeconds` if needed.
4. **Harness coordinate bug** (tile-by-offset lookup vs `floor(x·PANELS)`) breaks the generator.
   Verify: round-trip identity unit test on the layout apply/invert.
5. **QTE / delivery cross-section read** with the new trottoir baking. Verify: composite gate +
   `game-designer`.
6. **Transparent overdraw perf** (tronçon planes + sky through gaps + near-foreground). Verify:
   `gpu-specialist` frame-budget verdict.

## Alternatives considered

- **Visual-only slice, freeze the spawn grid, defer re-derivation** (the prior draft of this
  ADR). Overridden by Bertrand — full integration this PR.
- **Two divergent code paths (keep the fixed pipeline, bolt a separate variable one).** Rejected:
  two slot pipelines to keep in sync. Chose one general path with the fixed layout as a tested
  special case.
- **Runtime-shuffled tronçon order.** Rejected: non-deterministic spawns. The sequence is frozen
  in the manifest.
- **Keep feather/stretch for tronçon seams.** Rejected: the seam is a real transparent sky gap;
  feathering would dissolve buildings and occlude the parallax sky.
- **Make `PANELS`/`panelW` per-level but still equal-width.** Rejected: can't model variable
  tronçon widths; the layout abstraction is needed regardless.

## References

- `docs/art-direction/prompt-drafts/level-belliard-decor-v2.md` (§0 transparency, §3 sky, §4
  near-trottoir, §6 open questions)
- ADR-0028 (window-alignment harness), ADR-0004 (per-level roster), ADR-0045 (near-foreground)
- `src/render/scene/LevelBackdrop.tsx`, `src/render/scene/facadeLayout.ts`,
  `src/render/scene/ForegroundFrames.tsx`, `src/render/scene/GameScene.tsx`,
  `src/game/levels/levelArt.ts` (`tilePanelZones`, `computeSlotsFromZones`,
  `getLevelPanelZones`), `src/game/levels/levelArt.json`,
  `src/game/levels/windowZones.generated.json`, `src/game/levels/levels.ts`,
  `scripts/gen-window-zones.mjs`
