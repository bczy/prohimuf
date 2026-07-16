# 0029 — Retire the legacy `enemy_civilian.png` courier sprite

- **Status:** Accepted
- **Date:** 2026-07-16

## Context

The street courier (livreur) used to be drawn from a single-frame sprite,
`public/assets/enemy_civilian.png` — the same "livreur en vélo" art the civilian
enemy archetype pointed at. After the courier art gates (ADR-0017), the courier
now renders in-game from the committed **rider flipbook**
(`public/assets/courier/rider.png` + `rider_f2..f6.png`), a complete cyclist whose
wheels roll across six frames.

Two things still pointed at the retired sprite:

- The **tutorial** bestiary panel illustrated the "don't shoot the livreur" lesson
  with `assets/enemy_civilian.png` — the OLD art, inconsistent with what the player
  sees in the street.
- `CourierSprite.tsx` kept a **pre-art fallback** that drew
  `getEnemyTexture("civilian", …)` on a `bike` mesh until `courierArtReady()`, and
  `assetManifest.ts` preloaded the civilian sprite to feed that fallback. Since the
  rider frames are committed and preloaded, the fallback was effectively dead — but
  it kept `enemy_civilian.png` load-bearing.

The sprite was also the single calibrated target of the CI **sprite-integrity gate**
(`scripts/check-sprite-integrity.mjs`, wired into `gen-sprites.yml`) and of
`scripts/retouch-sprites.mjs` (ADR-0013/0014).

## Decision

Retire `enemy_civilian.png` and sweep every reference:

- **Tutorial** now illustrates the courier panel with the shipped rider flipbook
  frame 1 (reusing the existing `MUF_RIDER_IMAGE` constant), keeping the diegetic
  civilian alt text.
- **`CourierSprite.tsx`** drops the pre-art fallback branch and the whole `bike`
  mesh/pool/refs (the bike layer was already retired from the composite); when the
  rider frames are not yet ready it simply hides the rider plane for the frame or two
  before `courierArtReady()` flips.
- **`assetManifest.ts`** no longer pushes `civilian` into the enemy manifest as a
  courier fallback; the rider frames are already preloaded via the courier section.
- **`levelArt.json`** drops the `enemies.enemy_civilian` entry so the CI render farm
  won't regenerate the deleted file.
- **`public/assets/enemy_civilian.png`** is deleted.
- The `civilian` **gameplay archetype stays** (weight 0, shoot-penalty reused by the
  courier). Its `spriteBase: "enemy_civilian"` field is retained (structurally
  required) with a comment; no preload/load path builds an `enemy_civilian` path
  anymore.
- The CI **sprite-integrity gate step** (scoped to `enemy_civilian.png`) is removed
  from `gen-sprites.yml`. `check-sprite-integrity.mjs` and `retouch-sprites.mjs` are
  kept as generic infrastructure with a note that their calibration target was
  retired; re-wiring the gate needs a new calibrated target (a separate story).

## Consequences

- The tutorial and the in-game street now show the same courier art.
- One fewer committed asset; nothing 404s (the tutorial manifest resolves to the
  committed rider frame, which the loader already warms).
- The CI render farm no longer regenerates the retired sprite, and the gen-sprites
  job no longer fails on a missing gate target.
- The sprite-integrity gate is temporarily un-wired: a regeneration can no longer be
  auto-checked for keying-debris/topology regressions until it is re-scoped to a live
  target. The script itself remains available for local/standalone runs.
- Consistency tests were updated: `civilian` is excluded from the expected
  `levelArt.json` enemy-key set (its art is retired), so a re-added `enemy_civilian`
  key would now be flagged as an orphan.
