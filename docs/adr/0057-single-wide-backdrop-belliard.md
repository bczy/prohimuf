# 0057 — Single-wide backdrop mode (belliard décor image unique)

- **Status:** Accepted
- **Date:** 2026-07-21
- **Number:** 0057, allocated by `producer` (Marion) at story opening (recorded in
  `docs/handoffs/story-belliard-decor-single-image.md`), re-checked at merge.
- **Amends:** ADR-0048 (tronçon-sequence backdrop mode) — see Decision §5.

## Context

Rue Belliard's décor was planned as four variable-width tronçons (sequence `a, c, b, c`) per
ADR-0048, tiling side-by-side with a separate parallax sky showing through rooflines and
inter-building gaps. That mode shipped, but carried real cost: transparent-overdraw perf,
per-tronçon window-zone detection, a black sky-gap void that forced the hostage-QTE anchor to
troncon-b's centre (`x = 9.9`) to dodge it at the ×2.4 zoom (PR #76 regression), and a
four-layer draw (sky + street + ground + facade tiles) plus code-drawn balcony ironwork.

Art direction has since validated a single wide-format image as a simpler, fully-opaque
replacement: **`street-wide.png` with sky, faubourg buildings, and street/ground all baked
into one frame**, rendered as a single world-locked plane.

**Aspect reconciliation (this ADR is authoritative).** The scaffold and the ADR-0048-era draft
cited `6656×1248` / aspect ≈`5.333`; that is a **stale draft figure**. The asset actually
committed (PR #122, branch `claude/belliard-decor-v3-clean`) is **`6418×1248`, aspect
`5.1426`** (`round(6418/1248, 4)`, matching the manifest's 4-decimal convention). This is the
number pinned in the frozen contract (`backdropLayout.test.ts`) and written to the manifest
(`levelArt.json` `"aspect": 5.1426`). Consequently **`fullW = WORLD_HEIGHT × 5.1426 = 12 ×
5.1426 ≈ 61.71`** world units — down from the tronçon-sequence `Σ tile widths ≈ 87.4`, i.e. the
world is **≈27% shorter**.

**Asset provenance (non-standard — document so a future regen does not mis-route).**
`street-wide.png` did **not** come through the standard Pollinations/FLUX `levelArt.json`
prompt-gate flow used for `troncon-a/b/c`. FLUX (and the free models generally) clamp output
aspect to ~2.67:1, which cannot yield a seamless ~5:1 street. It was produced via the **paid
`ideogram-v4-quality`** model (`scripts/gen-street-paid.mjs`, driven in CI by
`.github/workflows/gen-street-experiment.yml` using the `POLLINATIONS_TOKEN` GitHub secret,
seed 7111), then **mirror-stitched** into one seamless wide street by
`scripts/stitch-belliard-street.mjs` (tone-matched butt-join of the render and its mirror). A
future regeneration request must use this pipeline, not `gen-level-art.mjs`.

**Belliard's gameplay scope remains unchanged in intent:** `enemiesToWin: 10`,
`timeSeconds: 90`, courier street, hostage QTE, scripted delivery, near-foreground props
(ADR-0047) — but re-positioned for the ≈27%-narrower world (18 → 13 props). **Design gate**
(game-designer spec `spec-belliard-street-wide-repositioning.md`, PASS-with-corrections by
`lead-game-designer`) re-validated window pop zones, prop placement, and difficulty on the
narrower backdrop before dev lanes shipped.

**Render coupling:** `LevelBackdrop.tsx` / `GameScene.tsx` branch on `layout.mode` to dispatch
the backdrop strategy; the frozen cross-lane contract `backdropLayout.test.ts` (ADR-0048)
asserted belliard's 4-tile geometry byte-for-byte and had to be amended for the 1-tile layout.

**API change surface:** `BackdropLayout` type (from ADR-0048) remains the abstraction; the
single-wide mode is a third variant alongside `single-facade` and `troncon-sequence`.

## Decision

Ship a third backdrop mode, **`single-wide`**, and move belliard onto it. The
`BackdropLayout` abstraction (ADR-0048) is preserved; single-wide is one more discriminated
variant of it, so no boundary is redrawn — game data still describes the grid, render still
only draws it.

**1. `single-wide` is a one-tile layout in game data (`src/game`).** The `BackdropDescriptor`
union gains `{ mode: "single-wide"; file: string; aspect: number }` and `BackdropLayout["mode"]`
gains `"single-wide"`. A new pure builder `buildSingleWideLayout(id, file, aspect)` returns a
**single tile**: `{ file, width: WORLD_HEIGHT * aspect, centreX: 0, zones: getWindowZones(id) }`,
with `fullW = width`. `getBackdropLayout` branches single-wide **before** troncon-sequence; the
`single-facade` byte-for-byte parity block for stalingrad/vitry is untouched. For belliard,
`aspect` is the exact 4-decimal literal **`5.1426`** — the contract compares `tile.width` with
`===`, so the manifest MUST carry `"aspect": 5.1426` and `"file": "street-wide"` (not `5.333`,
not the full `6418/1248` quotient) or the layout fails to compose.

**2. Window zones are hand-authored, not detected.** A single continuous baked image has no
per-tronçon openings to demux, so the ADR-0028 edge-density detector is not run for belliard.
The three pop rows live directly in the manifest under `belliard.windows` (`WindowRows`:
`y_norm 0.24 / 0.35 / 0.47`, from design spec §1), consumed by `getWindowZones` →
`buildSingleWideLayout`. The dead `belliard/troncon-a|b|c` keys (114 hand-calibrated zones) are
purged from `windowZones.generated.json`; the bare Pass-1 `belliard` key stays (still emitted
by the generator, now simply unconsumed on belliard's render path).

**3. Render draws ONE opaque plane and stops drawing the separate layers (`src/render`).**
In `LevelBackdrop.tsx`, `single-wide` reuses the existing facade-pane mesh to draw
`street-wide.png` (draw-scale 1, feather OFF, world-locked, facade parallax 0). Because the
image already bakes ciel + immeubles + sol, the separate `sky.png`, `street.png`, and tiled
`ground.png` meshes are forced `visible={false}` **and their textures are never loaded**. The
differential-parallax sky stays **closed** in this mode — reopening it is a separate,
out-of-scope task and is deliberately not touched here.

**4. Code-drawn balcony ironwork (`ForegroundFrames`) is suppressed in single-wide
(`GameScene.tsx`).** The drawn décor already paints its own balconies and railings, so the
procedural `ForegroundFrames` overlay is gated off for `layout.mode === "single-wide"` (it
remains for single-facade and troncon-sequence). The 13 near-foreground props (ADR-0047)
continue to render from layout DATA — no hardcoded positions.

**5. This AMENDS ADR-0048; it does not supersede it.** `troncon-sequence` remains a **valid,
tested capability** of the `BackdropLayout` abstraction — the mode, its builder, its render
branch, and its detector all stay in the codebase and keep passing their tests. ADR-0048 is
amended only in that **belliard is no longer its user**; it now has zero live consumers. The
`backdropLayout.test.ts` freeze on the belliard contract (4-tile geometry) is **lifted for
belliard** and re-authored for the single-wide shape; the stalingrad/vitry `single-facade`
parity assertions are **left frozen and proven intact, byte-for-byte**.

**6. Warm only the baked image.** `levelLayerPaths("belliard")` warms **`street-wide.png`
alone** in single-wide (the sky/street/ground layers it used to preload are skipped, since
they are never drawn), asserted by `assetManifest.test.ts`.

**7. Gameplay re-fit absorbed by repositioning, tuning held.** The ≈27% shorter world
(`fullW ≈ 61.7`) is absorbed by re-placing enemies and props on normalized (0..1) coordinates
rather than by re-tuning the win condition: `enemiesToWin: 10` and `timeSeconds: 90` are held
UNCHANGED (the win is spawn-rate-bound, not width-bound — one variable at a time). The hostage
QTE anchor keeps `x = 9.9`, but its old "troncon-b centre / avoid the x=0 sky-gap void"
rationale is void on an opaque image, so the `levels.ts` comment is corrected. All of this was
gated by the design lane and verified in-game before Accepted.

## Consequences

**Positive**

- **Simpler, cheaper render for belliard.** One opaque plane replaces four transparent
  tronçon tiles + parallax sky + street + ground + procedural ironwork. No transparent
  overdraw, three fewer textures loaded, one draw for the whole backdrop.
- **No detector to babysit.** Hand-authored `windows` rows remove the per-tronçon
  edge-density detection, the `a,c,b,c` demux, and the troncon-c merge rule from belliard's
  critical path. What ships is what an author wrote and a designer gated.
- **The abstraction paid off.** Adding a whole new backdrop strategy was one more variant of
  `BackdropLayout`, not a new pipeline — the boundary law (`src/game` describes the grid,
  `src/render` draws it, no rules leak) held with zero special-casing in the render layer
  beyond a mode branch.
- **The QTE sky-gap void is gone for free.** The opaque image removes the black void the
  ×2.4 hostage zoom used to reveal, so `anchor.x` is now a pure design choice, not a
  workaround.
- **Fixed levels provably untouched.** The `single-facade` parity block is still frozen and
  green; stalingrad/vitry are byte-for-byte identical.

**Negative / cost**

- **A genuinely cross-layer change** (game data + render + tooling/manifest + a frozen
  cross-lane contract), which is why it needed this ADR and the A→B→C serialisation on the
  shared files (`backdropLayout.test.ts`, `levels.ts`, `LevelBackdrop.tsx`/`GameScene.tsx`).
- **`troncon-sequence` is now dead-code-adjacent:** a fully-tested mode with **no live
  user**. We keep it deliberately (it is a real capability and a clean seam for future
  distinct-building streets), but it must be exercised only by its unit tests until something
  adopts it. If it is still unused when we next revisit backdrops, retiring it is a candidate
  simplification.
- **Non-standard, non-reproducible-by-default asset.** `street-wide.png` depends on a paid
  model + a mirror-stitch script and a CI secret. A contributor who regenerates belliard art
  through the standard FLUX gate will get a wrong-aspect, seamed result. The provenance is
  documented here and in the `levelArt.json` `$comment` as the guard.
- **`aspect: 5.1426` is a hand-maintained magic literal.** It is pinned by exact-equality in
  the contract test; if the asset is ever re-exported at a different pixel size, three places
  must move together (the PNG, the manifest, the test). The contract test is the tripwire.
- **`windowGrid.top` was recalibrated (0.19 → 0.24) for data hygiene only.** The live
  near-foreground `maxH` clamp is derived from the `windows` rows (`nearForegroundBandTop`),
  not from `windowGrid` — which has no live consumer for belliard. The field is kept in sync
  to avoid a future reader chasing a dead lead, documented as such in the manifest.

## Alternatives considered

- **`troncon-1-tuile` — one buildings-only tile + separate ground band + empty parallax
  sky.** Rejected: semantically wrong for a fully-baked décor. It would re-introduce the very
  layer split (transparent buildings over a drawn sky/ground) that this asset exists to
  collapse, keeping the overdraw and the transparency-cut risk for no benefit.
- **`single-facade` with N repeated panels of the wide image.** Rejected: `single-facade`
  means "one facade tiled N times"; the wide street is a single continuous, non-repeating
  composition. Forcing it through the repeat-N path would tile-seam a seamless image and mis-map
  window zones. A distinct one-tile mode is the honest model.
- **Superseding ADR-0048 outright / deleting `troncon-sequence`.** Rejected: the mode is
  correct and tested, and variable-width distinct-building streets are a plausible future. We
  amend (belliard leaves) rather than supersede (capability removed) — see Decision §5.
- **Auto-detecting window zones on the baked image (extend the ADR-0028 detector).**
  Rejected: over-engineering. A continuous painted street has no crisp per-building opening
  grid to detect reliably; three hand-authored, design-gated rows are simpler and more
  predictable than a detector tuned against one bespoke image.
- **Re-tuning `enemiesToWin`/`timeSeconds` for the narrower world.** Rejected as the first
  lever: the win is spawn-rate-bound, not width-bound. Repositioning on normalized coordinates
  holds both constants (one variable at a time); tuning levers are named in the design spec
  only if VERIFY deviates.

## References

- ADR-0048 (backdrop layout abstraction, troncon-sequence mode)
- ADR-0047 (near-foreground props)
- Story spec: `docs/handoffs/story-belliard-decor-single-image.md` (§1–2 design read,
  repositioning spec §3–4)
- Design spec: `docs/game-design/spec-belliard-street-wide-repositioning.md` (windows §1,
  barrières props §2, difficulty §3, coherence §4, exclusion zones)
- Art asset: `public/assets/levels/belliard/street-wide.png` (**6418×1248, aspect 5.1426**;
  non-standard pipeline — see below and the manifest `$comment` for the regeneration guard)
- Asset pipeline (provenance): `scripts/gen-street-paid.mjs` (paid `ideogram-v4-quality` via
  `POLLINATIONS_TOKEN`, seed 7111), `scripts/stitch-belliard-street.mjs` (mirror butt-join),
  `.github/workflows/gen-street-experiment.yml`
- Render: `src/render/scene/LevelBackdrop.tsx` (single-wide draw branch, sky/street/ground
  skipped), `src/render/scene/GameScene.tsx` (`ForegroundFrames` suppressed in single-wide),
  `src/render/scene/ForegroundFrames.tsx`
- Game data: `src/game/levels/levelArt.ts` (`BackdropDescriptor` union +
  `buildSingleWideLayout`), `src/game/levels/levelArt.json` (belliard `single-wide` entry,
  `windows` rows, 13 props), `src/game/levels/windowZones.generated.json` (troncon keys purged),
  `src/game/levels/levels.ts` (hostage anchor comment), `src/game/systems/assetManifest.ts`
  (`levelLayerPaths` warms `street-wide.png` only)
- Contract: `src/game/levels/__tests__/backdropLayout.test.ts` (belliard freeze LIFTED,
  single-wide contract; stalingrad/vitry single-facade parity frozen),
  `src/game/systems/__tests__/assetManifest.test.ts`
