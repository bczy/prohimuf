# 0013 — Enclosed-island pass in the shared sprite keyer

- **Status:** Accepted
- **Date:** 2026-07-12

## Context

The delivery courier sprite (`public/assets/enemy_civilian.png`, the "livreur en
vélo") rendered with white speckle inside the silhouette: the bike-frame
triangle, the arm/torso gap and the wheel interiors stayed opaque white instead
of transparent.

Root cause: `scripts/cutout-enemies.mjs` — the single shared keyer, also used by
`gen-vehicle-sprites.mjs` via `import { cutout }` — cleared the background with a
4-corner flood-fill only. A flood seeded from the image edges can reach ground
CONNECTED to an edge, but never ground fully ENCLOSED by the subject. Those
land-locked enclaves survived as blobs.

Two traps constrained the fix:

1. A global white colour key was out — the courier's helmet and jacket are
   legitimately near-white and would be eaten.
2. `gen-enemy-types.mjs` prompts a **pure black** ground (FLUX ignored it and
   returned white for this asset, but future regens may honour it), so a
   white-hardcoded pass would silently miss enclaves on a black-ground regen.

A standalone `retouch-sprites.mjs` was considered and rejected: it would fork the
keying logic and rot, the exact anti-pattern ADR-0011 warns against. The defect
is the general weakness of a corner flood, so it belongs in the keyer that owns
the flood.

## Decision

Add an **enclosed-island pass** to `scripts/cutout-enemies.mjs`, running after
the edge flood-fill, keyed to the same corner-sampled ground colour (never a
hardcoded colour). It labels connected components of a loose ground-colour mask
and clears a component only when **both** guards hold:

- **Topology (principal, ground-agnostic guard):** the component touches neither
  the image border nor an already-transparent pixel. A pale-but-legitimate
  subject region (helmet, jacket) reaches the exterior — directly or bridged
  through the loose mask — so it reads `touchTransparent` and is spared; only
  truly land-locked ground qualifies.
- **Colour (keyed to the sampled ground):** a wide `LOOSE_BAND` builds the
  connectivity mask (so dark subject detail — frame tubes, spokes, arms — breaks
  enclaves off into isolated components), and a tight `TIGHT_BAND` on the
  component mean clears only components that really are the flat ground.

Because it is corner-adaptive, the pass keys white (this asset), black (a future
prompted regen) and the vehicles' magenta alike.

Ground sampling now ignores transparent corners. On a raw generation all four
corners are opaque ground → fully corner-adaptive. On an **already-keyed**
committed sprite the PNG encoder has zeroed the RGB under every transparent
pixel, so the corners report `(0,0,0)` and are skipped, leaving `nGround === 0`.

`nGround === 0` means the sprite is pre-keyed: its exterior is already gone and
re-keying it against a _guessed_ ground would punch legitimate bright interior
subject (helmet/visor highlights, a muzzle-flash core). The two invocation modes
therefore diverge here, and this split is the safety guarantee of the change:

- **Explicit single-file CLI arg** (`node scripts/cutout-enemies.mjs <path>`) —
  `lightFallback` is on. When `nGround === 0` the reference falls back to white
  (every committed sprite in this project was generated on a light ground). This
  IS the deterministic in-place retouch used to fix `enemy_civilian.png`.
- **No-args batch mode** (the CI path, and the `cutout` import used by
  `gen-vehicle-sprites.mjs`) — `lightFallback` is off. A pre-keyed sprite
  (`nGround === 0`) is **skipped with a log**, never re-keyed. Only freshly
  generated sprites (opaque corners → `nGround > 0`) are keyed, corner-adaptive.

This matters because CI's chroma-key step runs `cutout-enemies.mjs` with **no
args over the whole committed `enemy_*.png` set** while the generation step
creates only _missing_ files — so every already-committed sprite reaches the
keyer pre-keyed. Without the batch skip, the white fallback + enclosed-island
pass would clear enclosed bright subject in those sprites and the workflow's
`git add -f && commit && push` would land the damage silently. The batch skip
restores the historical no-op on pre-keyed files (verified: re-running the CI
batch over all 12 committed sprites is byte-identical).

The pass is purely additive (it can only clear pixels the flood should have
reached), so alpha stays binary and the operation is idempotent: a re-run of the
single-file retouch finds the enclaves already transparent and clears 0 px.

## Consequences

- `enemy_civilian.png` retouched in place: opaque 22215 → 19580 (−2635, the
  enclosed-island area), visible pure-white 939 → 149 (the residual is the
  legitimate helmet/jacket highlight), semi-transparent 0 → 0 (binary alpha
  preserved), edge fringe 22 → 22 (silhouette border untouched). Re-run is
  byte-identical.
- Every enemy AND vehicle sprite inherits the hardened keyer through the shared
  `cutout` import, at root cause — a future CI cutout/reprocess cannot
  reintroduce enclosed islands.
- **Scope limit (deliberate):** only `enemy_civilian.png` is rewritten in this
  change. An AC6 sweep showed the pre-keyed **white-fallback** retouch is unsafe
  on other committed sprites — it would punch the white truck body
  (`vehicles/truck.png`) and the muzzle-flash highlight (`enemy_biker_shooting.png`),
  which are legitimate bright subject, not enclosed ground. Those sprites are
  left untouched; their light regions are subject, not the enclosed-island
  defect. They are protected on the CI path by the **batch skip** above: they are
  pre-keyed (`nGround === 0`), so the no-args batch never re-keys them. (A raw
  truck generation is separately safe — it has magenta corners, so the tight band
  keys magenta enclaves, never the white body.) Broadening the retouch to any
  other sprite is a separate, per-sprite visually-gated story that must run the
  single-file CLI path with human review.
- The band thresholds (`LOOSE_BAND=55`, `TIGHT_BAND=20`) are calibrated on this
  asset and documented at the constants; a perfectly-neutral, fully-enclosed
  legitimate subject region would be a theoretical risk, but the topology guard
  bounds it and none exists in the current set.
