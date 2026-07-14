# Story: Fix enemy muzzle-flash alignment + background-blob halos

**Type:** Bug fix (render + assets) — no new verb, input, or rule · **PM:** John · **Date:** 2026-07-14
**Scope guard:** PROJECT_GUIDELINES §5 (loi du glow) · standing constraint from commit `81a26ad` (figures stay solid; fill only, shapes untouched)
**Relates to:** `story-halo-alpha-composite-gate.md`, `scripts/fill-sprite-holes.mjs`

## Why (product value)

The `Éviter` beat depends on reading *who is shooting at you*. Today two artifacts break that read: the additive muzzle glow lands off-barrel (fixed right-offset vs. sprites that aim left/vary), and near-black background blobs — made fully opaque by the solidify pass — render as dark rectangles around enemies. Both degrade the "what glows is interactive / what's grey is decor" signal at game size. No gameplay change; pure fidelity fix.

## Cahier des charges test — verdict: FAITHFUL FIX (no scope change)

*Did Prohibition Atari ST have enemies shooting with a visible muzzle flash at the gun?* **Yes.** We are restoring that faithfully — correct flash position and clean silhouettes. No new feature, no schema-visible verb; the `muzzle` anchor is asset metadata, not a game rule.

## Lanes (architect owns final partition)

- **Lane A — dev-r3f-render:** `EnemySprite.tsx` consumes a per-sprite `muzzle` anchor (normalized) from the `levelArt.json` manifest; **fallback to the current fixed offset when no anchor** so nothing regresses.
- **Lane C — dev-tooling-assets:** script detects the baked muzzle-flash centroid (bright warm pixels) per shooting sprite/frame, writes normalized anchors into `src/game/levels/levelArt.json`. Documented + re-runnable.
- **Lane B — game-graphist:** scripted, documented retouch of `public/assets/enemy_*.png` removing dark background blobs **outside** the silhouette only.

## Acceptance Criteria

- **AC1 (muzzle anchored):** For every shooting sprite (incl. left-aimers `enemy_shooting_2`, `enemy_biker_shooting`), the code glow sits on the barrel/baked flash — verified on screen at game scale, not authoring size.
- **AC2 (fallback safe):** Sprites without a `muzzle` anchor render exactly as today (fixed offset). No enemy loses its glow.
- **AC3 (anchors data-only):** Anchors are normalized `[0..1]` metadata in `levelArt.json`; the detection script is deterministic and re-runnable, documented in `HARNESS.md`.
- **AC4 (blobs gone):** No dark background rectangle/blob reads around any `enemy_*.png` in game; silhouettes read clean on the facade.
- **AC5 (no porosity — hard line):** Figures stay fully solid — **zero transparency holes INSIDE any silhouette**. `scripts/fill-sprite-holes.mjs --check` passes on the full set. The retouch is documented (before/after, method).
- **AC6 (boundary law):** No new rule in `render`; `src/game` imports no Three; `EnemySprite` reads manifest data only. No change to enemy state machine, victory condition, or inputs.
- **AC7 (verified):** `rtk tsc` + `rtk vitest` + `rtk lint` clean; both fixes confirmed in-browser via `/verify`. ADR only if the manifest render contract changes.

## Out of scope

Enemy roster/behavior changes, new sprites, animated/pulsing muzzle flash, rim on enemies, any `src/game` logic edit, touching non-enemy sprites.
