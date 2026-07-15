# 0025 — Live-hue enemy neon rim via a 1-tap ShaderMaterial

- **Status:** Accepted
- **Date:** 2026-07-15

## Context

Enemies read poorly against the busy fanzine facade ("on ne les voit pas assez"),
and the shooting-gallery loop gives the player no at-a-glance sense of how long a
pop-up has been exposed — i.e. how close its window to be shot is to closing.

The ask (Bertrand): a **bright neon rim hugging each enemy silhouette** whose
**colour animates over the enemy's exposure** — green when it surges up, lingering
through orange, to red as its visible window runs out. This doubles as feedback:
red = "shoot now, it is about to fire / leave". It must be done **with a shader**.

Prior state — ADR-0011 established the render-side neon rim for _vehicles_: a
CPU-baked silhouette (white/hue flood + `applyHaloFalloff` gradient alpha) drawn
behind the sprite with `AdditiveBlending`. That ADR weighed and **rejected** a
custom **multi-tap edge-detect `ShaderMaterial`** as overkill and risky on the
SwiftShader e2e publish gate (`scripts/e2e-ingame.mjs`), choosing stock materials.
But it explicitly left one door open (0011, "Consequences"): per-frame **hue**
changes "would need either a re-bake or the 1-tap `ShaderMaterial` variant
(recolours for free) — deferred until a live-hue requirement actually exists".

That requirement now exists. Re-baking a coloured silhouette every frame per
enemy (up to `PANELS = 4` on screen, each flipbook-animated) to chase the ramp
would be wasteful.

## Decision

Add the codebase's **first `THREE.ShaderMaterial`** — a deliberately trivial,
**1-tap** rim shader — as the sanctioned live-hue variant from ADR-0011.

- **Shape stays CPU-baked (unchanged, tested).** Reuse `buildNeonSilhouette` +
  `computeHaloMarginPx` + `applyHaloFalloff` from the vehicle rim, baking the
  silhouette in **white** (`buildNeonSilhouette(image, "#ffffff")`). The heavy
  work (chamfer distance transform → quadratic falloff → nearest/sRGB filter)
  remains in the DOM-free, unit-tested modules that already clear the SwiftShader
  gate. The rim is therefore still a **dégradé, never an aplat** (bible §2.1) by
  construction.
- **Colour is applied live by the shader.** The fragment does a single
  `texture2D(uMap, vUv)` and outputs `vec4(uColor * uIntensity, t.a * uOpacity)`.
  No multi-tap sampling, no derivatives, no loops — the exact "1-tap variant
  (recolours for free)" ADR-0011 deferred. `uColor` is pushed each frame from a
  pure heat ramp; recolouring costs nothing on the GPU.
- **Heat ramp** (`src/render/scene/neonHeatColor.ts`, pure + unit-tested):
  `heatProgress(state, timer, visibleDuration)` maps the enemy's CURRENT
  appearance to 0..1 (APPEARING → 0, VISIBLE → `1 − timer/visibleDuration`,
  SHOOTING/HIT → 1), and `heatColor(progress)` interpolates green `#78FF3C` →
  orange `#FF8C14` (held across a wide 0.35–0.70 plateau) → red `#FF3030`.
- **Hostiles only.** The rim is drawn only for archetypes with `shoots === true`
  (normal / riot / biker). Civilians / bonus get no rim: a red civilian would
  wrongly signal "tire-moi" — shooting a civilian costs a life and a point.

## Consequences

- **Boundary intact — zero game-logic change.** Progress is derived render-side
  from fields already on `Enemy` (`state`, `timer`) plus `ARCHETYPES[kind]`
  (`visibleDuration`, `shoots`). Nothing enters `src/game`. `EnemySprite` mutates
  uniforms imperatively in its existing `useFrame`; no new React re-renders.
- **Non-palette red is intentional.** Green and orange are bible §2.1 accents;
  the red `#FF3030` is a deliberate gameplay-urgency hue **outside** the four-hue
  neon palette, introduced as a "time's up" signal. Flagged for the lead-art
  Gate-4 verdict; it is the single ramp anchor that touches the bible.
- **SwiftShader risk contained.** One texture tap, stock varyings, additive blend,
  `depthWrite: false`. It introduces custom GLSL, so the in-game e2e render gate
  is now the guard that this shader compiles and renders on software GL — a hard
  publish blocker if it regresses. First integration verified on SwiftShader
  before merge (Gate-4 screenshots).
- **Render order.** `PANELS = 4` occupies renderOrder 0–3, so the rim cannot sit
  "just below" the enemy at 3. It shares the enemy renderOrder (4) and is nudged
  to `z = −0.01`; the transparent z-sort draws it behind the opaque body, which
  covers the interior glow so only the scaled-out margin shows (the same
  painter-order guarantee ADR-0011 gets from separate renderOrders).
- **Silhouette cache growth.** One small `CanvasTexture` per unique loaded enemy
  frame texture, baked lazily on first hostile request and held in a
  `WeakMap<Texture, …>` (GC-friendly). Non-hostile frames never bake.
- **Gotchas.** (1) Equal-world-margin alignment assumes `aspect ≈ srcW/srcH`; a
  mismatch makes the glow slightly thicker on one axis (same cosmetic limit
  ADR-0011 notes for vehicles) — tunable at Gate-4. (2) `ShaderMaterial` output is
  not auto-encoded by three's colour management; the ramp values are written raw
  to `uColor`, so exact hue fidelity is a Gate-4 tuning point (`uIntensity` is the
  brightness lever, kept separate from the palette). (3) Interior chroma-key holes
  would bake an inner glow, but the committed sprites are solidified by
  `scripts/fill-sprite-holes.mjs` and the opaque body covers the interior anyway.
- **Follow-up.** Second consumer of the neon-rim bake (after vehicles); still
  below ADR-0011's "promote to `src/render/effects/NeonRim.tsx` on the 3rd
  interactive object" threshold, so the shader/bake stay beside their consumer in
  `src/render/scene/`.

This extends ADR-0011 rather than superseding it: the vehicle rim keeps its
CPU-baked coloured silhouette; enemies take the deferred 1-tap shader path because
they, unlike the vehicle, need a per-frame hue.
