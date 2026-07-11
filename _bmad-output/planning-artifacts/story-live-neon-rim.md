# Story: Live neon rim on delivery vehicles

**Type:** Render-side visual signal (loi du glow) — decouples neon from FLUX generation ·
**Status:** ready-for-arch (awaiting lane assignment + ADR from `senior-architect`)
**Date:** 2026-07-11 · **PM:** John · **Branch:** `claude/art-pipeline-graphist`
**Depends on:** vehicle sprites shipping as pure B&W xerox (see Dependency) ·
**Relates to:** `story-vehicle-delivery.md` (the `Livrer` beat this decorates)

## Why (product value)

Three FLUX batches could not paint on-direction vehicles: the **`neon` token in the
generation prompt itself makes FLUX flood the whole vehicle body** (orange truck, magenta
moto, fused-cyan car — logged in the batch-3 asset gate). The root cause is the token, not
the wording, so no further prompt tweak fixes it.

Bertrand approved the crew's fix: **DECOUPLE.** Vehicles are generated as pure B&W xerox
sprites with **no neon token**, and the *loi du glow* — «ce qui brille est interactif» —
moves to the **renderer**: an emissive neon rim drawn by `src/render` around the sprite
(alpha-edge based), hue taken from `levelArt.json`'s per-type `neon` field.

Product value:

- **Interactive-readability at game size.** At the real in-game scale the vehicle must read
  as *the thing to protect*. A live rim keyed off the sprite edge is a stronger, cleaner
  «what glows is interactive» signal than a baked glow that survived downscale by luck.
- **Family consistency guaranteed by construction.** One shader, three hues. The three
  vehicles cannot drift apart the way three independent FLUX rolls did — consistency (bible
  §2.2) becomes structural, not a taste gamble per batch.
- **Opens live states.** A render-side rim can respond as a real signal: **pulse** during
  the delivery window, **flicker** on damage. Those are follow-ups (see Out of scope) but
  this story is the enabling substrate — a baked glow can never do this.
- **Serves the core loop directly.** The rim marks the `Livrer` vehicle the player is
  protecting in `Récupérer → Livrer → Éviter`. It adds no new verb, input, or rule.

## Cahier des charges test — verdict: CONSCIOUS DOCUMENTED EXTENSION (already established)

- *Did Prohibition Atari ST have glow?* **No.** So per PROJECT_GUIDELINES this must be a
  conscious, documented, justified extension — and **it already is**: the *loi du glow*
  («ce qui brille est interactif, ce qui est gris est décor») is codified in the bible
  (§5 / PROJECT_GUIDELINES §5 Identité Visuelle). This story does **not** introduce a new
  scope item; it changes *where* an already-approved signal is produced (renderer instead of
  baked sprite). Net scope surface is unchanged; fidelity to the loi du glow improves.
- No change to the core loop, victory condition, inputs, or the delivery state machine.

## Dependency (coordinated in parallel — architect assigns)

- **Sprites must be pure B&W xerox** for the rim to key cleanly. The generation prompts in
  `src/game/levels/levelArt.json` still carry the neon token (`neonPhrase`, and
  `style`'s "black and white except the neon"). The decouple removes the neon token from
  generation so vehicles render as flat B&W on black — this is the sibling art-pipeline
  change on the same branch. The reverted (shipped) set is on disk meanwhile; this story
  accepts whichever B&W set is current as long as AC1 holds.
- **Hue source of truth.** The per-type hue name lives in `levelArt.json.vehicles.types.*.neon`
  (`orange`/`cyan`/`magenta`). The name→color mapping currently lives ONLY in
  `scripts/gen-vehicle-sprites.mjs` (`NEON_HEX`: orange `#FF8C14`, cyan `#28F0FF`, magenta
  `#FF3CDC`). The renderer must resolve the **same** hue→color — do not fork a second
  palette. Where that single source lives is an **architect call (likely an ADR + a shared
  map the render lane reads)**; flagging the DRY risk here, not prescribing the fix.

## What — Acceptance Criteria

- **AC1 — B&W sprites load.** The delivery vehicle sprites load and render as pure
  black-and-white xerox (no baked neon flood on the body). The renderer consumes the
  existing `assets/vehicles/{vehicleType}.png` convention unchanged.
- **AC2 — rim renders in the type's hue.** `src/render` draws an emissive neon rim around
  the sprite, alpha-edge based, in the color resolved from that vehicle's
  `levelArt.json` `neon` field (truck→orange, car→cyan, moto→magenta). Same hue→color as
  generation used — no forked palette.
- **AC3 — rim visible at game size.** In the actual delivery beat, at real in-game scale,
  the rim is clearly visible and reads the vehicle as interactive (loi du glow holds after
  downscale — verified on screen, not only at authoring size).
- **AC4 — zero game-logic changes.** No edit under `src/game/**`. The rim is pure render;
  it reads `GameState.deliveryVehicle` (already propagated) and holds **no game rule**. The
  boundary law (game imports no Three, render holds no rules, hooks are the only bridge)
  stays intact.
- **AC5 — e2e-delivery still green.** The delivery-loop e2e (`scripts/e2e-delivery.mjs`)
  passes unchanged — the visual change does not break the delivery smoke.
- **AC6 — art gates green.** The mechanical art gates pass on whatever sprite set ships
  (`scripts/check-sprite-style.mjs`, `scripts/check-art-prompts.mjs`), and the lead-art
  ASSET gate PASSes the B&W-body + live-rim result per `docs/art-direction.md`.
- **AC7 — verified before done.** `rtk tsc` + `rtk vitest` + `rtk lint` clean; rim confirmed
  in the browser at game size. ADR added if the change alters the render contract or
  introduces the shared hue map (per CLAUDE.md ADR rule).

## Out of scope (explicit — follow-ups)

- **Pulse animation** on the delivery window — follow-up (this story only enables it).
- **Flicker animation** on vehicle damage/integrity loss — follow-up.
- **Rim on enemies / other sprites** — follow-up (this story is vehicles only).
- Any change to the delivery state machine, victory condition, inputs, or the `neon` field
  schema. No new sprite regeneration direction beyond removing the neon token (art pipeline
  owns that on the sibling change).

---

*Architect (`senior-architect`) owns: lane partition, the boundary-clean render approach for
the alpha-edge rim, the single hue→color source-of-truth decision, and whether this needs a
new ADR. Devs implement only assigned, scoped lanes.*
