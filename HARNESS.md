# Level-art harness

> **Poster** — a one-page visual of this harness lives at
> [`docs/diagrams/harness-level-art-infographic.html`](docs/diagrams/harness-level-art-infographic.html),
> part of the muf harness infographic series (window-alignment, dynamic-verify,
> shared-lib), emitted by `docs/diagrams/build-harness-infographics.py` and kept
> fresh in CI by `scripts/check-harness-infographics.mjs`.

How to develop the image-based levels (Style B pixel art). Levels are
**data-driven**: sky / facade / street are big AI-generated images composited
as parallaxing layers, and gameplay (enemy windows) still comes from the tile
maps.

## Single source of truth

`src/game/levels/levelArt.json` defines every level's art:

```jsonc
{
  "style":  "global pixel-art style suffix sent to the image model",
  "sizes":  { "sky": {…}, "facade": {…}, "street": {…} },
  "levels": [
    {
      "id": "belliard",
      "name": "Rue Belliard",            // must match the gameplay level name
      "label": "Rue Belliard, Paris 18e, 1998",
      "parallax": { "sky": 0.88, "facade": 0.0, "street": 0.04 },
      "prompts":  { "sky": "…", "facade": "…", "street": "…" }
    }
  ]
}
```

Both the app (rendering) and `scripts/gen-level-art.mjs` (generation) read this
file, so **adding a level is one entry here** (plus a matching gameplay level /
tile map for the enemy slots).

`parallax` factor `k` places a layer at `camera.x * k`: `0` is world-locked
(the facade), `→1` is pinned to the view (far sky drifts slowest).

## Generating the art

```bash
node scripts/gen-level-art.mjs          # generate only missing layers
node scripts/gen-level-art.mjs --force  # regenerate everything
```

Images are fetched from pollinations.ai and written to
`public/assets/levels/<id>/{sky,facade,street}.png`. Network egress is usually
blocked in the dev sandbox, so generation normally happens in CI (below).

## The render farm (GitHub Actions)

`.github/workflows/preview.yml` is the iteration loop — it has a real Chromium
with WebGL, which the local sandbox does not:

1. generate missing level art (AI),
2. `yarn build`,
3. drive the built game headless and screenshot the **menu + every level**
   (3840×2160, after a 15 s wait so cops appear),
4. stitch a `screenshots/overview.png` contact sheet,
5. commit `public/assets/levels/` + `screenshots/` back to the branch.

Trigger it by pushing to the branch, or from the Actions tab via
**Run workflow → regenerate = true** to roll fresh art variants.

## Aligning cop windows to the art

Enemy cops render in per-panel **window zones**
(`src/game/levels/windowZones.generated.json`). Because the AI facades are not a
clean grid, a fixed grid of zones makes cops overflow their windows or sit on bare
wall. Two tools keep the zones honest:

- `scripts/gen-window-zones.mjs` — snaps a level's grid onto each panel's warm
  window light (all levels).
- `scripts/align-windows.mjs` — **detect-and-correct harness for any level**
  (`belliard`, `stalingrad`, `vitry`; ids as args, default all): detects the real
  lit windows from each facade art — `belliard` keeps its equal-thirds floors,
  every other level uses **run-based** floor detection over `windowGrid.top/bottom`
  (robust to any floor count) — then drives the live production render
  (`__MUF_ZONES__` / `__MUF_SLOT_RECTS__`) to place one non-overflowing cop per
  window, looping until 0 defects, with proof overlays. It writes only the target
  level's key of `windowZones.generated.json`. `--check` is a CI gate (measure
  only, exit non-zero on any defect). `yarn align` / `yarn align:check` run all
  levels; `yarn align:belliard[:check]` scope to belliard. See `scripts/SCRIPTS.md`.

## Local dev

`yarn dev` works without any art: `LevelBackdrop` falls back to flat colours
when the PNGs are missing. Pull the branch after a CI run to get the committed
art locally.
