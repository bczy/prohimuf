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
   centres and recomputes `cx`. `detectOpenings()` writes this measured `w` and the frame
   **centre = geometric MIDPOINT of the run bounds, `(x0+x1)/2`** — NOT the warm centroid
   `cx`, which an asymmetric glow biases off-centre (a `cx`-centred frame would overhang
   bare wall while the per-edge `MISALIGN` check still reads 0). `cx` is retained only for
   the ordering / min-pitch de-dup inside `detectColumns()`. When the width clamp saturates
   (floor or ceiling), a one-line `console.warn` surfaces it so the "measurement" is never
   silent (e.g. vitry's modal width sits exactly on the `0.55·openingW` floor).
2. **Fallback (answers PM's open question).** Dark/unlit windows are _never_ zoned by
   design, so every zoned opening sits on a lit warm run and has real bounds. `openingW` is
   therefore demoted to a **fallback seed only**: used for the clamp band above, and as the
   width when a run degenerates (zero warm mass / `x1-x0 < minRunW·W` after split/merge) —
   then `w = openingW` centred on `cx`. It is no longer the primary width source.
3. **New `MISALIGN` defect in `measure()`, per EDGE.** Zones and openings share one
   construction order (row-major, `x` ascending), so `measure()` pairs them **1:1 by index**
   (`zones[i] ↔ openings[i]`) — no greedy nearest-centre match, which could mis-pair when a
   frame drifts. The check is **per-edge** (`misaligned()` in `scripts/lib/alignment.mjs`):
   compute each frame's left (`x − w/2`) and right (`x + w/2`) edge and flag when
   `|Δleft| > τ_align` **or** `|Δright| > τ_align` (reasons `left` / `right` / `left+right`),
   with `τ_align = 0.012` (normalized ≈ 15 px on 1280). Per-edge, not centre+width, is what
   actually gates the railing: an asymmetric glow can move a centroid without moving either
   measured edge. Non-finite inputs return `nan` (never a silent `null`); a per-panel
   zone/opening count mismatch is its own `MISALIGN(count)` defect. `measure()` takes the
   applied **per-panel** zone arrays (`zonesByPanel`); `--check` runs the pass over **all 4**
   committed panels, `--fix` over the 4 identical `panelZones`. Every `MISALIGN` line is
   prefixed `panel N:` like the other defect classes.
4. **No correction step — aligned by construction.** `zonesFromOpenings()` builds each
   frame's `x`/`w` straight from the openings and the overflow shrink loop only touches
   `h`/`y`, so `--fix` frames are already edge-aligned; the old MISALIGN snap branch is
   removed. `MISALIGN` is therefore a **`--check`-time gate against drifted committed data**,
   not a `--fix` knob.
5. **Boundary / fidelity note.** The change is confined to `scripts/align-windows.mjs` plus
   the regenerated `src/game/levels/windowZones.generated.json` **data**. `zone.w`/`zone.x`
   are already consumed by the railing drawer, so `src/render` and `src/game` code are
   untouched and the game↔render contract is unchanged. **The v0 "belliard reproduced
   byte-for-byte" promise is intentionally broken for `x`/`w`** — that is the whole point of
   this amendment; belliard's zone `x`/`w` now carry measured edges. Row count and floor
   split (5-5-7 / 17 per panel) are unaffected. **`h` and `y` are NOT fully unaffected** (an
   earlier draft claimed so): a narrower measured `w` tightens `zhMaxW` in
   `zonesFromOpenings()` (`zhMaxW = (w + 2τ − 2·MARGIN)/c`), so some sprites legitimately
   shrink and re-seat (`y = o.y − b·zh`). That is intended — the sprite is sized to fit the
   real, measured opening, not a fixed-width guess.

**Lane.** Single `dev-tooling-assets` lane: amend the harness, run `--fix` to regenerate
`windowZones.generated.json` (all three levels, 0 defects incl. `MISALIGN`), update
`SCRIPTS.md`/`HARNESS.md`. Orchestrator runs verify (`rtk tsc`/`vitest`/`lint` + the
`--check` gate + a belliard `verify`-skill screenshot). Test expectation: the edge
comparison is a pure helper (`misaligned(zone, opening, τ) → "left"|"right"|"left+right"|
"nan"|null`) in `scripts/lib/alignment.mjs`, unit-tested for the tolerance boundary only —
just-inside pass / just-outside fail on **both** the left and right edges, negative offsets,
the non-finite guard, and the strict-`>` contract (a delta exactly `== τ` passes). Do not
over-engineer — detection stays integration-tested via the `--check` gate, not unit-mocked.

## Amendment 2026-07-17 (Iteration 2) — hysteresis expansion, valley split + `UNDERCOVER`/`OVERCOVER`

**Problem.** Iteration 1's `MISALIGN` gates the applied frame against the **detected**
opening, so any detection MIS-measurement converges green while visually wrong. Two such
classes shipped on belliard's DOUBLE (two-pane) french windows: (a) a dim second pane fell
below `colThresh`, the run measured **one pane**, the width clamped to the floor, and the
midpoint frame centred on that single pane (half-covered window); (b) two adjacent windows +
the wall between them merged into one run that `n = round(w/(splitPitch·W))` rounded to 1, so
pitch-split left it whole and the frame straddled both windows and the wall. `MISALIGN`
cannot catch either — the zone equals the mis-measured opening.

**Decision (scripts-only; no `src/render`/`src/game`).**

1. **Hysteresis run expansion** in `detectColumns()`: high-threshold runs
   (`thr = bandH·colThresh`) are grown outward while `sm >= HYST_LOW·thr`
   (`HYST_LOW = 0.45`, `cfg.hystLow`), bounded by the neighbour's original edge, a hard cap
   of `splitPitch·W` per window, and a density-minimum split if two expanded runs meet — BEFORE
   twin-merge, so a dim pane rejoins its bright twin by expansion or the existing twin-merge.
2. **Valley split** in `detectColumns()` (after twin-merge, before pitch-split): a run holding
   two+ density peaks separated by a valley `< VALLEY_FRAC·min(peakL,peakR)`
   (`VALLEY_FRAC = 0.4`, `cfg.valleyFrac`) splits at that valley, recursively — but only when
   each sub-run is `>= minRunW·W` AND the sub-run midpoints are `>= minPitch·W` apart (the
   mullion guard: two panes of ONE french window are close and stay merged; two windows split).
   Pitch-split remains as a fallback.
3. **`UNDERCOVER` / `OVERCOVER` — detection-INDEPENDENT gates measured from the ART**
   (`scripts/lib/coverage.mjs`), so a half-covered or wall-straddling window can never converge
   green again. Per frame edge, sample warm density (rectangular sampler `warmRect`, not the
   0.03×0.05 point sampler the WALL check keeps) in an **exterior** strip just outside the edge
   (`UNDERCOVER` when `>= UNDERCOVER_DENS = 0.28` ⇒ the window continues past the edge) and an
   **interior** strip just inside it (`OVERCOVER` when `< OVERCOVER_DENS = 0.07` ⇒ the edge sits
   on wall). Exterior strips are bounded by neighbouring frames in the same row so they never
   read an adjacent window. `OVERCOVER` is **suppressed at the floor width** (a railing pinned
   at its minimum size legitimately overhangs a sub-floor window — by-design, never a straddle,
   which is always well above floor width). The math is two pure helpers — `coverStrips`
   (rectangle geometry incl. neighbour bounding) and `coverDefects` (verdict from precomputed
   strip densities) — unit-tested in `scripts/lib/__tests__/coverage.test.mjs`; the pixel
   sampling stays impure in the harness. Wired into `measure()` for both `--fix` and `--check`.
4. **Correction path = post-detection COVERAGE AUDIT (design choice).** Because
   `zonesFromOpenings()` builds each frame's x/w straight from the opening, an
   UNDERCOVER/OVERCOVER means the **opening** is mis-measured, so a zone-side nudge in the
   fixLevel() loop has nothing to push against — the fix belongs on the opening, BEFORE zones
   exist. `auditCoverage()` (run inside `detectOpenings()`, so both `--fix` and `--check` see
   the same corrected openings) re-derives a flagged window's bounds directly off the art in the
   opening's own vertical band (`deriveWindowBounds`, trim-to-warm: union the lit runs the frame
   overlaps, dropping edge-wall / pulling in a dim adjacent pane), accepting the change ONLY when
   it strictly reduces that opening's defect count (never worsens, always terminates; neighbour
   strip bounds are frozen from the initial detection to stop cascade/oscillation). Because the
   audit and the `measure()` gate read the same y-band with the same thresholds and the same
   floor suppression, a corrected opening satisfies the gate by construction.

**Rationale.** `MISALIGN` gates **zone-vs-detection**; `UNDERCOVER`/`OVERCOVER` gate
**detection-vs-art** — the missing axis that let a green-but-wrong frame ship.

**Outcome.** Floor-clamp warnings: **stalingrad 5→3, vitry 12→9** (dropped as intended);
**belliard 2→4** (ROSE — honestly reported): the two original belliard clamps were narrow lit
windows all along, and the audit's shrink of over-extended frames onto their true (narrow) lit
windows plus the over-merge split produced two more genuinely sub-floor windows, each now framed
at the minimum railing width. A floor clamp is **informational, not a defect** — it means a lit
window is narrower than the seed and framed at the minimum size. Ceiling clamps stay ~0 (the one
belliard straddle was under the ceiling anyway; it is now trimmed/split). Detection counts:
**belliard 17→18** (5-5-7 → 5-6-7 — one over-merged pair became two windows), **stalingrad 12**
(3-5-4, unchanged), **vitry 36→38**. `--fix` converges to **0 defects** across all seven classes
(OVERFLOW/COUNT/EMPTY/WALL/MISALIGN/UNDERCOVER/OVERCOVER) on all three levels; `--check` exits 0.
The clearly-double belliard windows (row1 x0.70/x0.82, row2 x0.24) now span **both** panes; the
narrow single-pane windows (row1 x0.28/x0.54) are genuine single lit panes in the art (peak
luminance ≈115 vs shadowed facade ≈55–75, no dim twin), correctly framed at minimum width. The
v0 "belliard byte-for-byte" promise is (again, intentionally) further relaxed for x/w — that is
the point. **Known residual:** belliard row0's central lit group (`w1`) is 2–3 warm blobs
separated by thin mullions closer than `minPitch`; it is framed as one tight railing over the lit
extent (no wall overhang, all gates pass) rather than split — reliably splitting it would risk
over-splitting real double-pane windows elsewhere.

## Amendment cycle 3 (2026-07-17) — render-side stretch parity + end-to-end SCREEN gate

**Problem — the harness was blind to a render-side divergence.** Iterations 1–2 verify
everything in **art-normalized space** (file pixels vs zone data) and are green, yet the
_rendered_ railings drift on screen: perfect at each panel centre, up to **~4% of panel
width** off toward the panel edges, both directions. Cause: `LevelBackdrop.tsx` draws each
facade panel plane at `panelDrawW = panelW·(1 + BLEND)` (`BLEND = 0.08`, the seam-crossfade
overlap), so an image point at panel-local `u` lands at world `offsetX(p) + (u−0.5)·panelW·
(1+BLEND)`. But `ForegroundFrames.tsx` draws the railing overlay on a plane of width exactly
`panelW`, and enemy slots map at exact `panelW` pitch (`tilePanelZones` +
`computeSlotsFromZones`, consumed at `GameScene.tsx:132`; the `__MUF_SLOT_RECTS__` inverse at
`GameScene.tsx:165` also assumes exact pitch). Divergence `= (u−0.5)·BLEND·panelW`, i.e.
`±0.04·panelW` at the edges. The ADR-0028 harness compares zone data to file pixels and never
looks at the composited frame, so it cannot see this class of bug ("data right, screen wrong").

**Decision A — render fix (lane `dev-r3f-render`, `src/render/**`only;`src/game` stays
pure and byte-identical).\*\*

1. **Shared render-layer constant module** `src/render/scene/facadeLayout.ts` exports
   `BLEND = 0.08` and `FACADE_DRAW_SCALE = 1 + BLEND`. `LevelBackdrop` imports `BLEND` from it
   (removing its local copy — single source of truth for the intra-panel stretch).
2. **Railings.** `ForegroundFrames`' plane width becomes `facadeW · FACADE_DRAW_SCALE` (the
   multiply lives inside `ForegroundFrames`, so `GameScene` keeps passing `facadeW = panelW`
   and the per-panel `<group position={[offsetX(p),0,0]}>` is unchanged). The overlay texture
   (zone → texture-x) is untouched; the plane simply scales `1+BLEND` about `offsetX(p)`,
   exactly as the facade image does. Railings now track the facade pixel-for-pixel.
3. **Enemy slots.** `computeSlotsFromZones` / `tilePanelZones` (`src/game`) stay **byte-
   identical**. The stretch is a pure render-side remap: `facadeLayout.ts` also exports
   `applyFacadeStretchX(exactWorldX, panelW, panels, scale)` and its exact inverse
   `invertFacadeStretchX`. In `GameScene`, each slot's `screenPosition.x` from
   `computeSlotsFromZones` is passed through `applyFacadeStretchX` — recover `globalXNorm =
x/fullW + 0.5`, `p = floor(globalXNorm·P)`, `u = globalXNorm·P − p`, return
   `(p−(P−1)/2)·panelW + (u−0.5)·panelW·FACADE_DRAW_SCALE`. **Only `x` moves; sprite width
   (`planeH·aspect`) is untouched** — we realign the slot centre with the stretched window,
   we do not stretch the sprite art. The remap helper lives in the render util (not inline in
   `GameScene`) so the SCREEN hook and the slot remap share one code path.
4. **Harness space stays art-normalized.** `__MUF_SLOT_RECTS__` reads post-remap (stretched)
   world x, so it first calls `invertFacadeStretchX` to recover the exact pitch, then runs the
   existing inverse unchanged → panel/local are reported in art-normalized coords exactly as
   before. Iterations 1–2 gates keep passing untouched.

**Edge effect (assessed, accepted).** With the wider overlay planes, adjacent panels' overlays
now overlap by 8% in world space (like the facade planes). The seam overlap maps to texture
`u ∈ [0.926, 1.0]` on panel `p` and `u ∈ [0, 0.074]` on panel `p+1`. Against the committed zone
ranges (`belliard` right-edge ≤ 0.855 / left-edge ≥ 0.0; `stalingrad` 0.112–0.758; `vitry`
0.036–0.863), **at most one side carries railing content in any overlap band**, so there is no
meaningful double-draw or misregistration today. Since both overlays carry the same crossfaded
facade content, this needs **no edge suppression now**. Tracked risk (below) if future zones
populate both edge bands.

**Decision B — end-to-end SCREEN gate (lane `dev-tooling-assets`, `scripts/**` only).\*\* Close
the "data right, screen wrong" blind spot with a production-mapped projection, not duplicated
math:

1. **`__MUF_PROJECT__(panel, x, y)` dev hook** registered in `GameScene` (inert in production,
   same precedent as the other `__MUF_*` hooks). It projects an art-normalized facade point to
   CSS pixels through the **production path**: world x via `applyFacadeStretchX` (the same
   render helper), world y `= (0.5−y)·facadeH`, then `camera.project()` + canvas `size`. No math
   beyond calling the shared helper + the live camera.
2. **`align-windows.mjs` SCREEN pass** (both `--fix` and `--check`): screenshot the viewport;
   for each visible opening, project its left/right edges via `__MUF_PROJECT__`, then reuse
   `scripts/lib/coverage.mjs` pure logic (`coverStrips` / `coverDefects`) in **screen-pixel
   space** — warm-pixel density in an interior strip just inside each edge vs an exterior strip
   just outside — and push `SCREEN_MISALIGN` defects.
3. **Thresholds (reuse, no new magic numbers).** Mirror the art-space coverage constants:
   `SCREEN_MISALIGN(under)` when exterior warm density `≥ UNDERCOVER_DENS = 0.28` (window
   continues past the edge on screen); `SCREEN_MISALIGN(over)` when interior warm density
   `< OVERCOVER_DENS = 0.07` (edge sits on wall on screen); floor-width openings are suppressed
   as in Iteration 2. Strip width `≈ 1.5%` of the projected panel width; per-edge, per-panel,
   prefixed `panel N:` like the other classes.

**Lane plan + file ownership (two parallel, non-overlapping lanes).**

- **Lane 1 `dev-r3f-render` — `src/render/**`only.** Owns **all** of`GameScene.tsx`for this
cycle: the slot remap, the`**MUF_SLOT_RECTS**`inverse update, **and** the`**MUF_PROJECT**`hook, plus new`src/render/scene/facadeLayout.ts`, `ForegroundFrames.tsx`, `LevelBackdrop.tsx`.
- **Lane 2 `dev-tooling-assets` — `scripts/**`only.** The SCREEN pass in`align-windows.mjs`,
screen-space reuse of `scripts/lib/coverage.mjs`, `SCRIPTS.md`/`HARNESS.md`. It only
**consumes** `**MUF_PROJECT**`— it never touches`GameScene`. **No file overlap.**
- **Sequencing.** The hook contract (`__MUF_PROJECT__` signature + thresholds) is fully
  specified here, so both lanes develop in parallel against it; Lane 2's SCREEN `--check`
  **integration verify runs after Lane 1's hook lands**.

**Verify sequence (art-space overlays are proven insufficient — real render is the evidence).**
`rtk tsc` + `rtk vitest` (unit tests for `applyFacadeStretchX`/`invertFacadeStretchX` round-trip
and the screen-strip helper boundaries) + `rtk lint` → rebuild → `align-windows.mjs --fix` all
levels (recalibration through the new SCREEN pass) → `--check` exits 0 across all classes incl.
`SCREEN_MISALIGN` → **zoomed per-window screen crops of the REAL composited render** as final
acceptance, at panel centre AND panel edges (where the 4% drift lived).

**Risks tracked.** (a) Every committed zone centre sits outside the 8% overlap sliver
(`u ∈ [0.044, 0.841]` across all levels; ambiguous band is `u < 0.037` / `u > 0.963`), so nominal
panel classification in `invertFacadeStretchX` is exact — but `belliard`'s `minCx = 0.044` has
only ~0.007 headroom; if a future level pushes a window centre past `u = 0.96`, add an explicit
panel index carried on the slot instead of geometric recovery. (b) Overlay double-draw is benign
only for current zone ranges; a level populating **both** edge bands (`u < 0.074` and `u > 0.926`)
would double-draw edge railings misregistered by up to `~0.04·panelW` — mitigation (left-feather
or clip the overlay to `[featherFrac, 1]`) is deferred until such a level exists.

## Addendum 2026-07-19 — `scripts/align-troncon.mjs`, a sibling harness for troncon-sequence zones

**Problem.** Belliard's backdrop is `troncon-sequence` mode (ADR-0048), not `single-facade`: the
enemy/railing zones for its three building images (`belliard/troncon-{a,b,c}` keys in
`windowZones.generated.json`, tiled on-screen `a,c,b,c`) are HAND-PLACED, not this harness's
output — `scripts/gen-window-zones.mjs`'s tronçon pass exists but is gated behind
`FORCE_TRONCON=1` because its blind detector output was previously rejected and the zones were
re-placed one by one. Those hand-placed zones traced the real window RECTANGLES directly, never
through this harness's FILL/`ENEMY_PLANE_SCALE` pre-shrink (`zonesFromOpenings`, above) — so on
render the sprite plane systematically overshot the sill by the missing shrink: cops floating
above/below the balcony line, some off the window bay horizontally, some rendering past their
railing's frame. `align-windows.mjs`'s own detection (`detectColumns`/`rowsThirds`/`rowsRuns`)
could not be pointed at this art as-is: it is a WARM-GLOW pixel test tuned for the lit-window
JPEG facades, and sampled directly off the tronçon PNGs, mean window luminance ≈ mean wall
luminance (warm-vs-cool even flips sign between tiles) — the wrong signal for this ink/wash
illustration style, where LOCAL DETAIL DENSITY (frame/mullion/ironwork ink vs flat plaster)
is what actually separates window from wall (measured: local luminance std-dev inside a
hand-placed zone averages 45–49 across all three tiles vs 26–39 in the gap between zones).

**Decision.** A new sibling driver, `scripts/align-troncon.mjs`, imports `detectOpenings`,
`LEVEL_CFG`, `writeOverlay`, `measure` from `align-windows.mjs` (same defect vocabulary,
same iterate-to-convergence pattern as `fixLevel()`) rather than forking them, and adds:

1. **An edge-density detector, not warm-glow**, wired through ONE small additive hook on
   `align-windows.mjs`: `LEVEL_CFG[id].buildMask(W, H, data)`, an optional factory returning a
   per-pixel `(x,y) → 0|1` predicate that REPLACES the pointwise `cfg.warm(r,g,b)` wrapper (both
   `detectOpenings`'s `warmAt` and its `warmRect` sampler now build off this shared predicate).
   Every existing `LEVEL_CFG` entry omits it, so belliard/stalingrad/vitry are byte-identical.
   `align-troncon.mjs` supplies `buildEdgeDensityMask` (a local-detail integral-image threshold,
   relative to each tile's own mean detail so one factor self-adjusts across tiles) as three
   INDEPENDENT `LEVEL_CFG` entries keyed `belliard/troncon-{a,b,c}` (own band/thresholds each —
   `facadeFile`/`detectOpenings` were also extended, additively, to resolve a namespaced
   `"level/file"` id to `public/assets/levels/<level>/<file>.png` and decode it via `pngjs`
   (real alpha) instead of `jpeg-js` — bare ids are unaffected, same shape `{width,height,data}`
   either decoder returns).
2. **Tile de-multiplexing needs NO inverse transform.** `window.__MUF_SLOT_RECTS__` already
   reports each rendered slot in TILE-LOCAL facade-normalized coords (`GameScene.tsx`'s `facade`
   `useMemo` builds `rects` per backdrop tile, `panel` = tile index 0..3, straight off `z` and
   `tile.width`/`facadeH` — never `tile.centreX`), and tronçon tiles draw at native width
   (`facadeDrawScale("troncon-sequence") === 1`, `stretchAboutCentre` is the identity) — so a
   WindowZone and its rendered slot rect already share one coordinate space. The only demuxing
   is PANEL INDEX → TRONÇON KEY, read off `levelArt.json`'s `backdrop.tiles` sequence at
   runtime (never hardcoded as `[a,c,b,c]`).
3. **troncon-c reconciliation.** Both on-screen instances apply the SAME zones array reference
   against the SAME tile width with no draw-scale stretch, so — per the point above — their
   rendered slot rects are IDENTICAL BY CONSTRUCTION; there is nothing to reconcile in STORAGE
   (one JSON key, as already true). The merge rule is scoped to the CORRECTION computation: the
   OVERFLOW-shrink loop measures panel 1 and panel 3 independently and UNIONS the flagged
   indices (correct if EITHER instance overflows, never intersect), and logs a `MISMATCH` if the
   two ever disagree (which the render contract above proves they should not — a disagreement
   would mean a render-contract regression, not a data problem).
4. **Conservative correction scope (explicit design choice, not full re-detection).** Per
   architect direction, this harness does not treat the edge-density detection as ground truth
   and overwrite the hand-placed data wholesale. It corrects two independent things:
   - **Height/vertical seating (always corrected — the dominant reported defect).** The
     committed x/y stay TRUSTED; a per-DETECTED-ROW hand-tuned constant table
     (`ROW_HEIGHTS`, the tronçon analogue of `LEVEL_CFG.openingH`) supplies the raw opening
     height (never read off the live committed `z.h`, which the FILL step below mutates —
     see the idempotency note); the FILL/`ENEMY_PLANE_SCALE` mapping is CALIBRATED off a live
     probe render every run (never hand-derived), exactly `fixLevel()`'s technique; the same
     shrink-and-recentre loop iterates to `OVERFLOW = 0`, the harness's convergence gate.
   - **Horizontal drift / grille framing (best-effort, bounded).** A committed zone's x/w is
     snapped to the nearest edge-density-detected opening only when close (within one
     opening-pitch) AND a plausible width match (0.5–2×) — high confidence only. Everything
     else keeps its committed x/w untouched. The snapped value feeds ONLY the `MISALIGN`/
     `WALL`/`COVER` AUDIT (informational, `--check`-time); the WRITTEN x/w is always the
     committed value, never the detector's guess — this art's detector is not trusted enough
     to relocate a window on its own say-so.
5. **Idempotency (found and fixed during development).** `windowZones.generated.json`'s `h`
   (and `y`, offset by a small fixed amount — `ENEMY_BODY_LIFT·ENEMY_PLANE_SCALE = 0.026`,
   `EnemySprite.tsx`) for an already-harness-fixed zone are RENDER-INPUT values (post-FILL-
   shrink), not raw opening measurements; re-reading `z.h`/`z.y` off the committed JSON as if
   still raw is circular on any re-run after a fix (`--check` right after a `--fix` regressed 26
   fresh OVERFLOW zones the first time this was tried). Fixed by never deriving `opening.h` from
   live committed data (the `ROW_HEIGHTS` table above) and by recovering `opening.y` with the
   EXACT (known-constant) inverse of the write-time offset — a no-op perturbation on
   never-processed data, exact on already-fixed data. Verified: `--fix` → `--check` → `--check`
   → `--fix` all converge to the SAME committed bytes (`md5sum` identical across repeat `--fix`
   runs).
6. **`writeOverlay` gained a `panel` parameter** (default `0`, every existing single-facade
   caller's reference panel — unaffected) so a tronçon call can pass its OWN tile's panel index
   (never 0 for troncon-b/troncon-c) instead of silently drawing a DIFFERENT tile's slot boxes.

**Outcome.** Baseline (committed, unfixed): 26 OVERFLOW / 164 rendered slots (troncon-a 0,
troncon-b 6, troncon-c 20) — confirming the vertical bug was pervasive, matching the bug report.
`--fix` converges in 4 iterations (110→50→20→0) to **0 OVERFLOW**, confirmed idempotent
(`--check` clean twice, repeat `--fix` byte-identical). Residual: 186 `MISALIGN`/`WALL(0)`/
`COVER` findings, entirely `MISALIGN`+`OVERCOVER`+`UNDERCOVER` (0 `WALL` — no zone sits on bare
art), i.e. the residual is imprecise FRAMING per the edge-density detector's own confidence
limits on this art style, never a zone on blank wall — an explicit, documented, non-gating
audit residual per point 4 above, not silently swept.

**Lane.** Single `dev-tooling-assets` lane (fix-lane per COLLABORATION.md — scripts + generated
data only, no design/dependency/boundary change, player-visible). `docs/handoffs/fixes.md` has
the one-line entry.

## References

- `scripts/align-troncon.mjs`, `scripts/align-windows.mjs` (`buildMask` hook, namespaced
  `facadeFile`/`detectOpenings`, `measure`'s `panels` param, `writeOverlay`'s `panel` param).
- ADR-0048 (troncon-sequence backdrop mode) — the tile geometry / a,c,b,c sequence this
  addendum demuxes; cross-linked from there too.
- `src/render/scene/GameScene.tsx` (`facade` `useMemo` — the tile-local slot-rect contract),
  `src/render/scene/facadeLayout.ts` (`facadeDrawScale`/`stretchAboutCentre`),
  `src/render/scene/EnemySprite.tsx` (`ENEMY_PLANE_SCALE`/`ENEMY_BODY_LIFT`).
