# 0016 — Layered courier flipbook: strip-and-slice generation

- **Status:** Accepted
- **Date:** 2026-07-13

## Context

The street courier (livreur) needs to read as a figure _pedaling a bike_ as it
crosses the street, not a static cut-out. Two motions are involved and they have
**different natural periods**: the wheels rotate continuously (a 3-phase spoke
cycle reads as rolling) while the rider's legs run a 6-phase pedaling stride. A
single sprite cannot carry both without one motion looking wrong.

The enemy flipbook (ADR 0015) is the closest prior art, but its generation model
does not fit the courier:

- Enemy extra frames are generated **missing-only** via `kontext` img2img locked
  onto a **protected committed frame 1**. The courier has no such anchor — every
  cell is a distinct pose in one continuous cycle, so there is no "hero" frame to
  lock onto.
- FLUX at these sizes produces a _different character_ on every independent roll,
  so frames generated separately would not composite into one coherent cyclist.

We also want the two motions independently tunable and the whole thing to flow
through the existing black-ground chroma-key + prompt-lint + CI-commit pipeline
with no new runtime dependency.

## Decision

A **2-layer composite** courier, drawn as two stacked planes in
`src/render/scene/CourierSprite.tsx` — **bike under rider** (z-order fixed in
code) — each layer an independent flipbook driven by the shared `fps`.

Generation is **strip-and-slice**. Each layer is **one FLUX image**: a horizontal
strip of `frames.length` identical square cells (strip width = `size.width * N`,
always **derived**, never stored in the manifest), sliced on a **fixed grid** into
the per-frame PNGs by `scripts/gen-courier-sprites.mjs` (in memory, via
`@napi-rs/canvas`), then chroma-keyed per file with the same `cutout()` the
enemies use. Because two cells only match if they came from the **same
generation**, a layer is **atomic**: if any of its frame files is missing (or
`FORCE=1`), the whole strip regenerates and every frame is rewritten.

The manifest gains a top-level `courier` block in
`src/game/levels/levelArt.json` — the single source of truth consumed by **both**
the generator and the render layer:

- shared `opening` + `style`, `fps: 6`, `size {256,256}`;
- `layers` keyed `bike` / `rider`, each `{ asset, seed, prompt, frames, scale,
offsetY }`;
- **every** `frames[i]` is a **non-empty pose clause** (cell `i+1` of the strip);
  there is no protected `frames[0] === ""`.

The strip prompt is assembled as `opening` + `exactly ${N} cells, ` + `prompt` +
`, ` + `frames.map((c,i) => "cell "+(i+1)+": "+c).join("; ")` + `style`.

### Alternatives rejected

- **Per-frame `kontext` chain** (the enemy strategy) — there is no committed
  frame 1 to lock onto, and chaining 6 sequential img2img hops accumulates drift,
  so the character mutates across the cycle. Rejected.
- **Runtime sprite sheet** (all frames in one texture, UV-scrolled at render
  time) — already rejected for the enemy set in ADR 0015: it breaks the per-PNG
  chroma-key and integrity gates and the ADR-0013 pre-keyed-skip idempotency.
  Same objection here. (Strip-and-slice differs: the sheet exists only transiently
  in the generator and is sliced into ordinary per-frame PNGs before it ever
  touches the pipeline.)
- **A single merged 6-frame layer** (rider and bike drawn together) — the wheel
  and pedal cycles have different natural periods (3 vs 6 phases); merging forces
  one motion onto the other's period and one always reads wrong. The 2-layer split
  lets each run its own cycle. Rejected.

## Consequences

- **Atomic layer regen:** a layer's frames are all-or-nothing. A missing or
  `FORCE=1` frame regenerates the whole strip (loud `[regen-all]` log); the
  generator collects all sliced cell buffers before writing any file, so a failed
  fetch or slice never leaves a half-written strip.
- **Pre-art render fallback:** with no courier art on disk the renderer keeps the
  legacy single-frame civilian sprite (the `enemy_civilian` art), so `yarn dev`
  is never empty. Local procedural placeholders (`--placeholder`) are for
  composite testing only and are never committed.
- **Registration via the manifest:** `scale` / `offsetY` per layer are render-side
  registration knobs tuned at the art gate; z-order is fixed in code. Frame counts
  and layer prompts are a manifest-only change — no code edit in generator or
  renderer.
- **Separate CI workflow** (`.github/workflows/gen-courier-sprites.yml`): the
  atomic / no-protected-frame-1 semantics do not match `gen-sprites.yml`, and
  slicing hard-requires `@napi-rs/canvas` (installed before the generator, unlike
  the vehicle/enemy workflows). Prompt lint (`--set courier`) fails fast before any
  paid FLUX.
- **Scope-guard note:** a pedaling courier is a documented extension beyond the
  Prohibition (Atari ST, 1987) cahier des charges, explicitly requested by
  Bertrand as a **pipeline stress test** of the layered strip-and-slice generation
  path — not a claim of period fidelity.
