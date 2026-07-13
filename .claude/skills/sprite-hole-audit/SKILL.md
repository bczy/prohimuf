---
name: sprite-hole-audit
description: Audit and SOLIDIFY cutout sprites left porous by chroma-key (dark clothing eaten by the near-black key, leaving see-through legs/torso). Use when enemy_*.png or other keyed sprites are see-through inside the silhouette, or to gate that every figure ships fully solid.
---

# Sprite solidify audit & fill

## The defect

The cutout pipeline (`scripts/cutout-enemies.mjs`) chroma-keys a near-black ground to
transparency. Where a figure wears DARK clothing (black trousers, a boot, a belt) — or
where a bust sprite is cut at the waist — the keyer eats body pixels and leaves the figure
**POROUS**: see-through gaps in legs/torso, speckles, a leg opening a window to the sky.
On opaque white the lie hides; it only surfaces once alpha is punched. Composite over
magenta and you see magenta bleeding through the body.

The porosity is reachable through BOTH fully-enclosed transparency AND border-connected
transparency (a gap that opens to the outside, or a waist-cut torso void draining through
the bottom edge). Filling only enclosed voids is insufficient — Bertrand's mandate is
**"everything solid"**: the figure body ships opaque, no see-through.

## Tool

`scripts/fill-sprite-holes.mjs` — surgical two-pass SOLIDIFY, deterministic, idempotent.

Requires `@napi-rs/canvas` (not vendored locally):

```
npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2
```

### Audit (report-only CI gate)

```
node scripts/fill-sprite-holes.mjs --check   # per-file would-fill count, exit 1 if any > 0
```

### Fix (solidify every enemy_*.png in place, or explicit files)

```
node scripts/fill-sprite-holes.mjs
node scripts/fill-sprite-holes.mjs public/assets/enemy_civilian.png
ASSET_DIR=some/dir node scripts/fill-sprite-holes.mjs   # override target dir
```

### Algorithm (per file)

- **PASS A — solidify.** `opaque = alpha>=16` plus a **selective** bottom-row seal (sealed
  only in columns where the figure is frame-cut — opaque within 2px of the bottom edge, a
  bust sprite — never the whole x-extent, which would annex the background between spread
  legs / under feet); `solid = binary_fill_holes(binary_closing(sealed, DISK r=10))` (a **disk** SE,
  not a diamond, bridges keyed-out gaps); keep the largest connected component; erode by
  **DISK r=1** (anti-halo). Fill every transparent px inside `solid` with the dark-clothing
  tone = median RGB of the opaque pixels below the figure's median luminance.
- **PASS B — mop-up.** Re-run the enclosed-region fill (border flood; each leftover
  enclosed region gets its opaque-boundary-mean colour).

Both passes only turn transparent pixels (`alpha < 16`) opaque. A built-in self-check
aborts the write if any previously-opaque pixel (`alpha >= 16`) would change — so it can
never reshape the figure, only fill it. Re-running fills 0 px (this IS the `--check`
condition: `--check` runs the detection and exits 1 if either pass would fill anything).

## Cardinal rule (Bertrand)

Surgical fill only. Never change a character's shape. Only transparent pixels may become
opaque; every previously-opaque pixel stays byte-identical; success = every figure fully
solid (zero px would fill on a re-run).

## Visual evidence

Composite before (from `git show HEAD:public/assets/<f> > orig.png`) and after over a
magenta background at 2x (python3 + PIL, `Image.alpha_composite`, `resize(..., NEAREST)`),
then eyeball: figure fully solid, silhouette + opaque art untouched, fill tone plausible
(dark clothing reads as flat dark). A spoked wheel whose gaps get closed becomes a SOLID
disc — that is the mandated "everything solid" outcome, not a bug, but flag it for the
art-direction taste gate.
