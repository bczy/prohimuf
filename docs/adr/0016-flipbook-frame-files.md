# 0016 — Enemy sprite flipbook as separate frame files

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The enemy sprites (base cops and their variants, riot/CRS, motorcycle cop,
delivery civilian, bonus figure) are static single-frame PNGs. The
Prohibition (Atari ST, 1987) shooting-gallery reads as a **poster, not a
diorama** (see `docs/art-direction.md` §1), and period sprites of that era
sell life with a tiny 2-frame flip, not smooth animation. We want that
minimal flip — a hostile that shifts weight or recoils after firing — without
leaving the flat 2D fanzine/pixel identity, and without breaking the existing
generation → cutout → CI pipeline or the ADR-0013 pre-keyed-skip idempotency
guarantee.

Prior state: `scripts/gen-enemy-types.mjs` carried a hardcoded `ASSETS` array
and an inline `PIXEL_STYLE` const; there was one file per enemy and no notion
of a frame. The committed frame-1 PNGs are accepted art that must never be
silently regenerated.

## Decision

Add a **frame-based flipbook** to the enemy set, expressed as **separate PNG
files** with an `_f<N>` suffix (`enemy_shooting_2_f2.png` = cop variant 2,
shooting, frame 2). The `_f` prefix sits **after** the legacy variant suffix
and disambiguates the frame index from that suffix.

The manifest gains a top-level `enemies` block in
`src/game/levels/levelArt.json` — the single source of truth consumed by
**both** the generator script and the render layer:

- `style` (verbatim shared tail), `fps: 6`, `size {256,256}`;
- `types` keyed by the exact base filename, each `{ seed, prompt, frames }`;
- `frames[0] === ""` is the committed frame-1 PNG (accepted art, never a delta
  clause); `frames[i>0]` is a short pose-delta clause for the extra frame file.

`scripts/gen-enemy-types.mjs` reads this block (mirroring how
`gen-vehicle-sprites.mjs` reads `vehicles`), iterates types × frames, and
generates only missing files. Extra frames use a two-tier strategy: **kontext
img2img** from the committed frame 1 as the primary consistency lock, with a
**matched flux pair** (frame 1 + frame 2 from the pinned seed) as fallback.

### Alternatives rejected

- **Spline / 3D animated model** — the R3F Spline bridge is unmaintained,
  Spline is a GUI-only tool incompatible with the scripted CI pipeline, its
  GLTF export drops animation tracks, and a 3D look violates the "poster, not a
  diorama" art bible. Off-identity and off-pipeline.
- **Sprite sheets (all frames in one PNG)** — the per-PNG chroma-key and
  integrity gates (`cutout-enemies.mjs`, `check-sprite-integrity.mjs`) operate
  on whole images; a sheet breaks them. It also breaks ADR-0013's
  pre-keyed-skip idempotency (a sheet mixing keyed and unkeyed frames has no
  single corner-ground answer), and shared-texture UV mutation across frames
  is a footgun. Separate files keep every existing gate and the skip guarantee
  intact.
- **Skeletal 2D (bone rig / Spine-style)** — off-style for xerox pixel art and
  off the cahier-des-charges (Prohibition had no such thing); adds a runtime
  dependency for motion the aesthetic explicitly does not want.

## Consequences

- **Fallback chain keeps sprites visible:** the render layer resolves
  frame-N → frame-1 → global fallback, so a missing `_f<N>` file degrades to a
  static (still correct) sprite rather than a hole.
- **Frame counts are a manifest-only change:** adding or removing a flip frame
  is an edit to `frames` in `levelArt.json` — no code change in the generator
  or the renderer.
- **Pipeline unchanged:** the new `_f<N>` files match the existing
  `enemy_*.png` glob, so `cutout-enemies.mjs` keys them and
  `.github/workflows/gen-sprites.yml` commits them with no structural change.
  Committed frame-1 files stay pre-keyed and skipped (ADR-0013).
- **Consistency risk on the fallback path:** when kontext is unavailable the
  matched-pair fallback overwrites the accepted frame 1; that pair is routed
  through the human art gate in the PR before it can land.

## Amendment (2026-07-14) — per-frame `muzzle` anchors

Shooting entries in the `enemies` manifest block carry an OPTIONAL `muzzle`
array, index-aligned with `frames` (element i anchors frame i+1):
`"muzzle": [ { "x": 0.829, "y": 0.251 }, null ]` — normalized [0..1] texture
coordinates from the PNG top-left, `null` = no anchor for that frame. They are
MEASUREMENTS of the committed pixels (baked flash-core centroid), written by
`scripts/measure-muzzle-anchors.mjs` (re-run by `gen-sprites.yml` after any
regeneration) and consumed by `muzzleFor()` in
`src/render/scene/enemyTextures.ts` to place the additive muzzle glow;
`EnemySprite` keys the anchor to the frame the texture cache ACTUALLY resolved
(frame-N → frame-1 → fixed-offset fallback), mirroring the fallback chain
above. See `docs/asset-pipeline.md` § Enemy muzzle-flash anchors.
