# 0046 — Per-level tronçon-sequence backdrop mode (Rue Belliard décor v2)

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
single slow-parallax sky. Art direction has validated a remake
(`docs/art-direction/prompt-drafts/level-belliard-decor-v2.md`): the facade becomes **3
distinct, variable-width, transparent-background "tronçon" images** (2–3 faubourg buildings
each, a gap beat — sky sliver / mur-pignon / passage — at each end), meant to tile
side-by-side over a **separate parallax sky that shows through both the above-roofline area
and the thin between-building sky slivers** (real transparency, not a crossfade). Each
tronçon bakes its own far-side trottoir band into its bottom ~20–25 %.

This retires three assumptions welded into the current render + gameplay coupling:

- **Same image × N, fixed pitch.** `LevelBackdrop` loads `facade` once and repeats it across
  `PANELS = 4` panels of width `panelW = WORLD_HEIGHT * FACADE_ASPECT` (the shared manifest
  facade aspect). Distinct tronçons of variable width break both the single-image and the
  fixed-pitch assumption.
- **Edge-feather crossfade.** The left-edge alpha ramp (`featherLeftTexture`, `BLEND`) exists
  to hide the seam between two copies of the same opaque image. With transparent tronçons the
  seam is a **real sky-sliver gap** the parallax sky must show through — feathering it would
  fade a building into transparency over the gap, wrong. The tronçon mode must **not** feather.
- **The window-alignment spawn harness (ADR-0028) is load-bearing for belliard.** Belliard is
  a **fully playable level** (`enemiesToWin: 10`, `timeSeconds: 90`, courier street, hostage
  QTE, scripted delivery). Cops pop from **art-derived window zones** (`windowZones.generated.json`,
  belliard = 4 panels × 18 zones) that also position the code-drawn `ForegroundFrames` ironwork;
  `GameScene.tsx` remaps every slot through `applyFacadeStretchX(slot.x, panelW, PANELS)` off
  the fixed panel pitch and a single facade's 7-window grid. Distinct varied buildings retire
  the "exactly 7 identical windows per panel" spine; re-deriving those zones from the new art
  **moves where cops pop and where the player aims** — a gameplay change, not a visual one.

Forces:

- **Boundary law.** `src/game` holds no React/Three; `src/render` holds no game rules;
  `src/hooks` is the only bridge. The backdrop is pure rendering; the spawn grid is game data.
- **Do not regress the three shipped single-facade levels.** stalingrad and vitry (and belliard
  until flipped) must stay byte-for-byte on the existing path — their spawn harness untouched.
- **Smallest correct slice.** The brief asks for a visible, non-regressing parallax Belliard
  street. Coupling the visual swap to a gameplay-affecting spawn-grid re-derivation would drag
  in a playtest re-gate and a QTE cross-section re-check — larger than needed to get the street
  on screen.

## Decision

**1. Introduce a per-level backdrop _mode_ to the level-art contract.** `LevelArt` gains an
optional discriminated `backdrop` descriptor:

- absent / `{ mode: "single-facade" }` → **today's path, unchanged** (stalingrad, vitry, and
  any level that does not opt in). Byte-for-byte identical: same `facade.png × PANELS`, same
  feather, same sky.
- `{ mode: "troncon-sequence", tiles: [{ file, aspect }, …] }` → the new render path.

**2. Tronçon-sequence render path (`dev-r3f-render`, in `LevelBackdrop.tsx`).** Given the
ordered `tiles`, lay each as its **own world-locked plane** at its **native width**
`WORLD_HEIGHT * aspect` (height fixed at `WORLD_HEIGHT`), butted left-to-right and **repeated
in sequence order** to cover the full street width, starting at `-fullW/2`. **No left-edge
feather** — the transparent PNGs let the parallax sky (unchanged `sky` layer, `parallax.sky`)
show through the above-roofline area **and** the between-building slivers. The `street`/road
band and the near-foreground (ADR-0045) are unchanged. This path is additive; the single-facade
path is left intact.

**3. Freeze belliard's spawn harness in this slice (the deferral).** Flipping belliard's
backdrop to `troncon-sequence` is a **visual-only** change here. `PANELS`, `panelW`, `fullW`,
the window zones (`windowZones.generated.json`), enemy slots, `ForegroundFrames` ironwork, the
`applyFacadeStretchX` remap, the hostage QTE anchor and the delivery stop are **untouched** —
belliard's gameplay stays byte-for-byte. The backdrop renders independently to fill the same
`fullW`.

**4. Gate condition on the deferral (non-negotiable).** The freeze is only correct if the
frozen ironwork + cop pops still read as windows over the new art. At the **composite gate**,
validate at the play camera that the frozen railing/cop rows still land on the tronçons' painted
window band (the v2 prompt places "clean upper floors carrying regular rows of tall shuttered
french windows" — the same upper-mid band as the current grid at y ≈ 0.19–0.48). **If they
clash** (double-windows, railings on blank wall), the window re-derivation is **not** deferrable
and this stops being a fix-lane visual slice — it escalates to the full pipeline as a
gameplay change. Doubt ⇒ full pipeline.

**5. Asset contract (`dev-tooling-assets`).** The 3 validated tronçon PNGs land under
`public/assets/levels/belliard/` at the sizes pinned in the v2 draft §0 (A `1536×1024`,
B `1920×1024`, C `1792×1024`; height fixed 1024, variable width). **Variable width is declared
as `aspect` (= w/h) per tile in the `backdrop.tiles` list in `levelArt.json`** — not inferred
at load, so the world footprint is deterministic offline. Generation bypasses two off-register
clauses of `gen-level-art.mjs` (the pixel-art manifest `style` and the fused-terrace
`continuity` suffix — v2 §0). Keying is a **region-mask cut** (above rooflines + inside sky
slivers only), **not** a global near-black chroma-key, so the deep-night grimy walls are not
eaten (sprite-hole-audit failure mode; v2 §6.4).

## Consequences

**Positive**

- A visible, non-regressing parallax Belliard street ships in the smallest slice: a pure
  rendering capability plus an art swap, gameplay frozen and re-gate-free.
- The other levels are provably untouched (single-facade mode is the default path).
- The backdrop mode is a clean seam for future levels that want a distinct-building street.

**Negative / deferred (explicitly out of scope — follow-up story)**

- **Window-zone re-derivation from the tronçon art** (`gen-window-zones.mjs` snap), **retiring
  the 7-identical-windows-per-panel spine** (v2 §6.2), and any **enemy-grid pitch retune** — a
  `dev-tooling-assets` + `dev-gameplay` change gated by a `game-designer` playtest.
- **Variable-width _gameplay_ grid** (enemy slots following tronçon boundaries instead of the
  fixed 4-panel pitch) — deferred; the spawn grid stays on its own coordinate system this slice.
- **QTE `street` cross-section reconciliation** (v2 §6.3): the ×2.4 hostage-QTE zoom reads the
  overhead `street` patch; with the baked far-trottoir + the near-trottoir `street`-layer tweak,
  confirm the band still reads. Deferred with the street-layer §4 iteration.
- **Companion `street`-layer near-trottoir tweak** (v2 §4) is a separate `level-street.md`
  iteration (seed re-pin) — not folded into this PR.

**Risk register**

- Deferral risk: frozen grid vs new painted windows (mitigated by the §4 composite gate above).
- Total-width mismatch: the tronçon sequence must cover `fullW` by repetition; the tiling math
  is unit-tested render-side so couriers/camera-pan/QTE span the same world width they do today.

## Alternatives considered

- **Couple the visual swap to the spawn-grid re-derivation in one PR.** Rejected as the first
  slice: pulls in a playtest re-gate + QTE re-check for a change whose goal is to get the street
  on screen. Sequenced as the follow-up instead.
- **Bake the full both-side road cross-section into each tronçon.** Rejected upstream (v2 §5):
  overloads FLUX and duplicates the `street` layer. Far-trottoir in the tronçon, near-trottoir
  on the `street` layer.
- **Keep the feather / crossfade for the tronçon seams.** Rejected: the seam is now a real
  transparent sky gap the parallax sky shows through; feathering would dissolve buildings.
- **Make `PANELS`/`panelW` per-level to model variable tronçon widths in gameplay now.**
  Deferred: it reworks the load-bearing ADR-0028 harness and every `fullW`-keyed consumer —
  out of the smallest slice.

## References

- `docs/art-direction/prompt-drafts/level-belliard-decor-v2.md` (§0 transparency ruling, §3
  sky, §4 near-trottoir, §6 open integration questions)
- ADR-0028 (window-alignment harness), ADR-0004 (per-level roster), ADR-0045 (near-foreground
  parallax layer)
- `src/render/scene/LevelBackdrop.tsx`, `src/render/scene/facadeLayout.ts`,
  `src/render/scene/GameScene.tsx`, `src/game/levels/levelArt.ts`,
  `src/game/levels/levelArt.json`, `src/game/levels/windowZones.generated.json`
