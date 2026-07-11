# 0011 — Render-side emissive neon rim for vehicles (decouple from baked art)

- **Status:** Accepted
- **Date:** 2026-07-11

## Context

The art direction's first law — _la loi du glow_ (`docs/art-direction.md` §2.1): every
interactive object carries a luminous neon rim in its assigned accent hue
(orange `#FF8C14`, cyan `#28F0FF`, magenta `#FF3CDC`, green `#78FF3C`). For the delivery
vehicles we tried to **bake** that rim into the generated sprite: the FLUX prompt assembled
`opening → prompt → neonPhrase{neon}/{hex} → style`, where `neonPhrase` asked for a
"crisp {neon} acid neon rim light … tracing only the outer edge".

FLUX (Pollinations `flux`, a schnell-class distilled model — no negative prompts, no LoRA)
could not honour "rim only". Across **three generation batches** the neon token bled from
the edge into the body: the whole vehicle flooded with the accent colour, destroying the
B&W xerox base and breaking _family consistency_ (§2.2 — one off-family asset fails the
set). Root cause diagnosed by the art crew: **the neon token itself** in the vehicle prompt.
There is no prompt-only fix — the model has no mechanism (negative prompt / mask / weight
syntax) to confine the colour, and every extra "only the outer edge" clause spent attention
budget in the weakest tail zone (§3.3) without confining the flood.

Crew verdict (logged in `docs/agent-handoffs.md`): stop fighting the model. Bertrand
approved **decoupling** — generate vehicles as pure B&W xerox (no neon token in the
prompt at all), and move _la loi du glow_ to the render layer as a runtime emissive rim,
hue driven from data.

Constraints that shape the technique:

- The e2e render gate (`scripts/e2e-ingame.mjs`) boots the real R3F scene on **software
  GL (SwiftShader)** and blocks the gh-pages publish if it fails. Shader complexity and
  full-screen passes are a real risk there — this is a hard publish blocker.
- Only ever **one vehicle on screen** at a time; it is a flat, centred sprite plane
  (`DeliveryVehicleSprite`), placed in world units under an orthographic camera.
- Boundary law (CLAUDE.md, ADR context): `src/game` holds the rules and imports no
  React/Three; `src/render` renders state and holds no rules. The vehicle's `vehicleType`
  already flows through `GameState.deliveryVehicle`; the rim must **not** add a rendering
  concern to game logic.

## Decision

**Generate vehicles pure B&W; draw the neon rim at runtime in `src/render`.**

Rim technique — options weighed for _this_ codebase:

| Approach                                                       | Draws              | SwiftShader risk                                                                | Verdict                 |
| -------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------------- | ----------------------- |
| Post-processing outline (`EffectComposer`/selection outline)   | full-screen passes | high (worst on software GL) + new dep                                           | **Rejected**            |
| Custom edge-detect `ShaderMaterial` (multi-tap alpha sampling) | 1                  | medium (custom GLSL, precision/derivative quirks on SwiftShader) for one sprite | **Rejected** — overkill |
| Scaled tinted silhouette copy behind the sprite                | 1 extra            | none (stock materials)                                                          | **Chosen**              |

**Chosen:** a second plane drawn **behind** the vehicle, textured with a **CPU-baked neon
silhouette** of the vehicle's own sprite (every opaque pixel → the solid assigned hue, alpha
taken from the source texture), rendered with `AdditiveBlending`, scaled out by a uniform
**world-space** margin so it reads as a uniform-thickness glowing edge.

Why this shape:

- **Zero new GL surface.** Stock `MeshBasicMaterial` + `CanvasTexture` + `AdditiveBlending`
  — all already exercised by `EnemySprite` (its glow flash) on the SwiftShader gate. No
  custom GLSL, no post-processing, so the render gate cannot regress on shader grounds.
- **Reuses the codebase's own pattern.** The CPU canvas-texture bake mirrors
  `src/render/scene/pixelArt.ts` (`applyPixelFilter` / `makePixelCanvasTexture`).
- **Baking from the true alpha channel** (not an RGB multiply) gives a _solid_ rim; a plain
  tinted `map` would multiply the neon against B&W ink and leave the rim patchy/black on
  linework.
- **The flood is solved by construction.** Painter order: silhouette (renderOrder 6,
  additive) draws first; the opaque B&W front sprite (renderOrder 7) draws over it. Where the
  body is opaque it fully covers the glow → body stays pure B&W; only the scaled-out margin
  (front alpha 0, silhouette alpha > 0) shows neon → a clean rim. It is structurally
  impossible for the body to flood.

Specifics:

- **File layout.** New render-only helper `src/render/scene/vehicleNeon.ts`:
  `getVehicleNeonHex(type)` (resolver) + `buildNeonSilhouette(image, hex)` (bake). The rim
  **mesh** lives inline in `DeliveryVehicleSprite.tsx` as a second `rimRef` mesh driven by
  the existing `useFrame` (YAGNI — one consumer; promote to `src/render/effects/NeonRim.tsx`
  only when a 3rd interactive object needs a runtime rim).
- **Data contract (no game-logic change).** `GameState.deliveryVehicle.vehicleType` already
  reaches the render layer. The neon **name** per type is authored data in
  `levelArt.json` `vehicles.types[*].neon` (unchanged single source for the _assignment_);
  the render layer imports that JSON as data and maps name → hex via a render-side constant
  anchored to `docs/art-direction.md` §2.1. The hue never enters `GameState`, `DeliverySpec`,
  `delivery.ts`, `deliverySystem.ts`, or the `levelArt.ts` loader — those are untouched.
- **Fallback.** Vehicle textures load async (`getVehicleTexture` returns `null` until ready).
  The silhouette is baked in the same load callback and cached per type; the rim mesh is
  hidden (`rim.visible = onStage && silhouetteTex !== null`). No texture → no rim (correct:
  there is no silhouette to trace), and the existing front-sprite behaviour is unchanged.
- **Thickness — world units, not screen-space.** The rim margin is a fixed fraction of the
  vehicle height (world units), applied per-axis so equal world margin `T` is added on all
  four sides regardless of the 2:1 aspect: `scale.x = facing·(worldW + 2T)`,
  `scale.y = worldH + 2T`. World-unit thickness keeps the rim **proportional to the vehicle
  at any camera zoom** (both are world-sized) — a screen-space band would balloon relative to
  the sprite when the ortho camera zooms out. Starting value `T ≈ 0.06·VEHICLE_H`; tuned at
  render review.

## Consequences

- **Family consistency by construction.** The rim is applied by one render code path from one
  hue table; every vehicle gets byte-identical rim treatment. An off-family rim is no longer
  possible — the failure mode that killed three batches cannot recur.
- **Live glow states become possible (follow-up).** Because the rim is runtime, its intensity
  can respond to `DeliveryPhase` — e.g. brighten during `DELIVERING`, pulse/flash on
  `FAILED`, all read from existing state, still no game-logic change. Opacity/intensity
  animation is free with the baked texture; per-frame **hue** changes would need either a
  re-bake or the 1-tap `ShaderMaterial` variant (recolours for free) — deferred until a
  live-hue requirement actually exists.
- **The art pipeline's neon gate flips for vehicles.** `check-sprite-style.mjs`'s neon check
  was a **lower** bound ("rim must exist, ≥ 0.75% of content in the hue band") — that would
  now fail every correct B&W sprite. It becomes an **upper-bound-only flood-kill** for
  vehicles (≤ ~15–20% of content in any saturated hue band → catches an accidental FLUX
  colour flood) with the lower bound removed (B&W mode expects near-zero hue). GROUND +
  SILHOUETTE checks are unchanged. `check-art-prompts.mjs` gains the inverse prompt rule for
  the vehicles set: **no** neon/glow token may appear in the assembled vehicle prompt.
- **SwiftShader / e2e intact.** No post-processing, no custom shader, no new dependency; the
  in-game render gate exercises only material types it already renders today.
- **Boundary intact.** Render reads `vehicleType` (already in `GameState`) + the neon name
  from `levelArt.json` data + the hex from a render constant. Game logic holds no rule about
  the rim; render holds no game rule. `delivery.ts`, `deliverySystem.ts`, `GameState`, and the
  `levelArt.ts` loader are not modified.
- **Gotchas.** (1) The centre-scaled silhouette gives uniform thickness for convex-ish
  outlines; deep concavities (the gap under the chassis between the wheels) are under-rimmed —
  acceptable for the outer-silhouette glow, and a dilation bake is the lever if review wants
  interior rim. (2) The neon hex is now pinned in three places — the bible §2.1, the
  generator's `NEON_HEX`, and the render constant — anchored to the bible as the human source
  of truth; a shared data file to unify them is a follow-up if a 4th copy appears. (3) One
  extra draw call and one small `CanvasTexture` per vehicle type (3 total) — negligible with a
  single vehicle on screen.
