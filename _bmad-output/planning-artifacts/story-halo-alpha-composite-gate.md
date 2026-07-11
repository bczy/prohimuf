# Story: Halo alpha-gradient falloff + in-game composite gate

**Type:** Render-fidelity fix to an approved extension (ADR-0011) + pipeline hardening ·
**Status:** ready-for-arch (awaiting lane assignment + technique call from `senior-architect`)
**Date:** 2026-07-11 · **PM:** John · **Fixes:** ADR-0011 runtime neon rim reads as a sticker, not a glow
**Relates to:** `story-live-neon-rim.md`, `docs/adr/0011-render-side-neon-rim.md`

## Why (product value)

Bertrand play-tested the build and rejected the vehicle halo: **"no alpha transparency at
all, the render is disappointing."** He is right. Per ADR-0011, `buildNeonSilhouette`
(`src/render/scene/vehicleNeon.ts`) bakes a **binary-alpha** silhouette — every opaque
source pixel becomes the solid hue at the source alpha — and `DeliveryVehicleSprite.tsx`
draws it scaled +6 % behind the sprite with `AdditiveBlending`. The margin that peeks out
is therefore a **hard-edged opaque neon plate**: no gradient, no falloff, no glow. The
*loi du glow* signal («ce qui brille est interactif») is meant to read as light bleeding
off the vehicle; today it reads as a colored cardboard cutout. This kills the intended
interactive-readability payoff of ADR-0011.

Two failures ship together, and both must be closed:

1. **The artifact** — the halo has no falloff.
2. **The chain that let it ship** — nothing, mechanical or human, ever looked at the
   *composed in-game halo*. The neon rim exists **only at runtime**, so lead-art's ASSET
   gate judged the source PNGs "as pure B&W; the neon rim comes live in-game"
   (`docs/agent-handoffs.md`, story-sprite-prompt-workshop follow-up 7). The e2e gates
   (`scripts/e2e-ingame.mjs`, `scripts/e2e-delivery.mjs`) screenshot the real scene but
   only as pass/fail smoke tests — no one reviews those frames for art acceptance. A whole
   class of runtime-composed visuals therefore has **zero acceptance surface**.

## Bertrand's question, answered explicitly

*"Does lead-art actually review with the real assets delivered by the graphiste?"* —
**Yes for the delivered PNGs; no for the in-game composite.** Lead-art's ASSET gate
(COLLABORATION.md art flow) DOES review the real generated sprites the graphiste delivers,
per `docs/art-direction.md`. What it does **not** review is any visual that only exists
after runtime composition — the neon rim, glows, additive effects — because those are not
in the delivered file. That is the exact blind spot that let a falloff-less halo ship.
**This story closes that gap** with an explicit in-game composite gate (AC5/AC6).

## Cahier des charges test — verdict: FIX to an approved extension (no new scope)

- The neon rim is already the *conscious, documented, justified extension* accepted in
  ADR-0011 (approved by Bertrand). This story does **not** add a feature, verb, input, or
  rule — it fixes the *fidelity* of an approved signal and hardens the pipeline that gates
  it. Net gameplay scope surface: unchanged. Passes `PROJECT_GUIDELINES.md`.
- Core loop `Récupérer → Livrer → Éviter` untouched; the halo still just marks the
  `Livrer` vehicle.

## What — Acceptance Criteria

- **AC1 — RENDER FIX: real alpha-gradient falloff.** The vehicle halo renders with a
  smooth alpha gradient from the sprite edge outward — opaque/bright at the silhouette,
  fading to zero at the rim's outer margin — so it reads as a **glow, not a sticker**. The
  hard binary-alpha plate is gone. Same assigned hue per type (truck→orange, car→cyan,
  moto→magenta), same `AdditiveBlending`.
- **AC2 — `src/render` only; ADR-0011 boundary holds.** The fix lives entirely under
  `src/render/**` (the bake in `vehicleNeon.ts` and/or the rim mesh in
  `DeliveryVehicleSprite.tsx`). **Zero** edits under `src/game/**`. No new game rule, no
  change to `GameState`, `delivery.ts`, `deliverySystem.ts`, or the `levelArt.ts` loader.
  The boundary law stays intact.
- **AC3 — SwiftShader / e2e stays safe.** No post-processing pass and no new dependency
  that risks the software-GL render gate (ADR-0011 constraint). Stock materials + a
  CPU-baked falloff (or an equivalently gate-safe technique) — **architect decides the
  technique** (gradient bake, blur/dilation of the alpha, radial fade, or a 1-tap
  material). `scripts/e2e-ingame.mjs` and `scripts/e2e-delivery.mjs` stay green.
- **AC4 — MECHANICAL CHAIN FIX: a gate that fails a falloff-less halo.** A CI check
  **fails the build** if a runtime halo ships without alpha falloff. **Architect chooses
  the anchor and technique** — e.g. assert on the existing e2e delivery screenshot (sample
  the rim-margin band and require a monotonic alpha/intensity gradient, not a flat step),
  or a bake-level unit check on `buildNeonSilhouette` output (the outer margin must contain
  intermediate alpha values, not only {0, source-alpha}). Whichever anchor: it must go red
  today against the current binary-alpha bake and green after AC1. This gate is the
  regression lock — the exact failure Bertrand hit cannot silently return.
- **AC5 — PROCESS CHAIN FIX: an explicit in-game composite gate.** COLLABORATION.md and
  the art flow gain a named **"in-game composite gate"**: any change to a
  **runtime-composed visual** (rims, glows, additive effects, shader-driven looks — i.e.
  anything not fully present in the delivered PNG) requires a **lead-art verdict on real
  in-game screenshots** before it is accepted. The ASSET gate ("real delivered PNGs") is
  explicitly documented as **not sufficient** for these; the composite gate is the second,
  mandatory review surface. Documented so a future runtime effect cannot slip through the
  same crack.
- **AC6 — composite verdict recorded.** The lead-art in-game composite verdict for **this
  halo** (PASS on real delivery-scene screenshots showing the alpha falloff) is logged in
  `docs/agent-handoffs.md` using the standard gate-verdict line. This both accepts the fix
  and sets the precedent template for AC5.
- **AC7 — verified before done.** `rtk tsc` + `rtk vitest` + `rtk lint` clean; the glowing
  halo confirmed in the browser at real game size; the new mechanical gate confirmed red
  on the old bake / green on the new one. ADR-0011 updated (or an amending note added) to
  record that the rim carries an alpha-gradient falloff and is guarded by an in-game gate.

## Out of scope (explicit)

- **Pulse / flicker live-state animation** on the rim — still the ADR-0011 follow-ups.
- **Rim on enemies or other sprites** — vehicles only.
- **Any gameplay change** — delivery state machine, victory condition, inputs, `neon`
  schema all untouched.
- **A general screenshot-diff art-review harness** for every sprite — this story adds the
  composite gate *policy* + one targeted mechanical check for the halo, not a full visual
  regression suite (that would be its own story if wanted).

---

*Architect (`senior-architect`) owns: the boundary-clean falloff technique (AC1/AC3), the
mechanical gate anchor + method (AC4 — e2e screenshot assertion vs. bake-level check), lane
partition (`dev-r3f-render` for the render fix, `dev-tooling-assets` for the CI gate,
`lead-art` for the composite gate wording + verdict), and the ADR-0011 amendment. Devs and
gates implement only assigned, scoped lanes.*
