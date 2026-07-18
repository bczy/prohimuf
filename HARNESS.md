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
  (robust to any floor count) — measuring each window's **centre + width** from
  its warm run bounds. Column runs are refined by **hysteresis expansion** (a dim
  second pane below `colThresh` rejoins its bright twin down a LOW shoulder) and a
  **valley split** (two windows over-merged into one run split at the density valley
  between them, with a mullion guard so a real double-pane window stays whole). The
  centre is the geometric MIDPOINT of the bounds (not the glow-biased centroid);
  per-level `openingW` is only a fallback seed, and a floor-clamp warning (a lit
  window narrower than the seed, framed at the railing minimum) prints as info. The
  harness then drives the live production render (`__MUF_ZONES__` / `__MUF_SLOT_RECTS__`)
  to place one non-overflowing cop per window whose `zone.x`/`zone.w` frame the real
  opening for the foreground railing, looping until 0 defects, with proof overlays.
  Beyond OVERFLOW/COUNT/EMPTY/WALL it gates **MISALIGN** (the railing frame's left
  `x−w/2` and right `x+w/2` edges each off its measured opening edge beyond
  `ALIGN_TOL = 0.012`; reasons `left`/`right`/`left+right`/`nan`/`count`) and — the
  detection-INDEPENDENT axis measured from the ART — **UNDERCOVER** (an exterior strip
  just outside a frame edge still warm `≥ 0.28` ⇒ the lit window continues past the
  edge) and **OVERCOVER** (an interior strip just inside a frame edge dark `< 0.07` ⇒
  the edge sits on wall; suppressed at the floor width). MISALIGN gates
  **zone-vs-detection**, UNDERCOVER/OVERCOVER gate **detection-vs-art** — so a
  half-covered or wall-straddling window can no longer converge green. A post-detection
  **coverage audit** re-derives a flagged opening's bounds off the art before zones are
  built (the correction path). All are checked over **all 4** committed panels; pure
  per-edge / coverage helpers in `scripts/lib/{alignment,coverage}.mjs`, unit-tested.
  It writes only the target level's key of `windowZones.generated.json`. `--check` is a
  CI gate (measure only, exit non-zero on any defect). `yarn align` / `yarn align:check`
  run all levels; `yarn align:belliard[:check]` scope to belliard. See `scripts/SCRIPTS.md`.

## Ad-hoc reference-conditioned iteration (ADR-0044)

Outside the curated manifest loop above, `scripts/gen-from-reference.mjs`
covers a different need: "make this vehicle/enemy/backdrop look like _this_
reference I found" without authoring a `levelArt.json` entry. Drop a
reference image in `references/` (repo root, outside `public/`, so it never
ships in the deployed bundle — see `references/README.md`), commit and push
it, then run one `kontext` img2img generation conditioned on it:

```bash
node scripts/gen-from-reference.mjs --ref references/x.png --prompt "…" \
  --out public/assets/vehicles/moto.png --family vehicles --seed 12345
```

Real generation runs via `.github/workflows/gen-from-reference.yml` (manual
`workflow_dispatch`) — same no-network-in-sandbox rule as everything else
here. **kontext fidelity against an arbitrary reference is variable** (it
nudges style/pose, not a deterministic transform) — expect seed/prompt
iteration; no style gate, the human judges the output directly. See
`scripts/SCRIPTS.md` and ADR-0044 for the full contract.

## Local dev

`yarn dev` works without any art: `LevelBackdrop` falls back to flat colours
when the PNGs are missing. Pull the branch after a CI run to get the committed
art locally.
