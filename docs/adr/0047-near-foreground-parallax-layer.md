# 0047 — Near-foreground differential-parallax décor layer

- **Status:** Proposed
- **Date:** 2026-07-17
- **Number:** provisional — allocated pending `producer` (Marion) confirmation in
  `docs/handoffs/story-foreground-parallax.md` (next free after ADR-0037; if Marion
  assigns a different number, this file is renamed and the index row updated).

## Context

muf's street currently has two depth strata: a slow-parallax sky and a world-locked
facade/street (`LevelBackdrop.tsx`). The design + UX lanes gated a **third, near stratum**
(`docs/game-design/spec-foreground-parallax.md`, `docs/game-design/near-foreground-parallax-ux.md`):
a very-near décor band that scrolls **faster** than the facade on pan, so a body/object
sits between the player and the wall ("you are in the crowd, not looking at a diorama").

Forces at play:

- **Engine convention (load-bearing).** `LevelBackdrop` draws a parallax layer as
  `mesh.x = camera.x * factor`, so apparent on-screen speed `S = |1 − factor|`. Sky uses
  `factor 0.88–0.92` (S≈0.1, far/slow); facade is `factor 0.0` (S=1, the reference plane).
  "Faster than the facade" (S > 1) therefore requires a **negative** engine factor — the
  brief's ">1" is inverted for this codebase.
- **Iron rule — non-occlusion.** The core loop is _shoot cops at windows_. The layer must
  never overlap an active window/cop slot or the crosshair, at any pan offset. Because a
  faster-than-facade object _slides across_ the facade as the camera pans, the constraint
  must hold across the whole sweep, not just at rest.
- **Boundary law.** Game logic (`src/game`) must not import React/Three; rendering
  (`src/render`) holds no game rules; `src/hooks` is the only bridge.
- **Existing precedents to reuse, not reinvent.** `foregroundArt.ts` already draws
  bottom/edge décor as pure, deterministic Canvas2D silhouettes shared with offline Node
  preview scripts; `deriveCrtParams(tier, reducedMotion)` already models a pure,
  unit-tested reduced-motion derivation whose live `matchMedia` read lives in the component
  (`CrtPass.tsx`).

Bertrand locked the object set (parked-car roofline — Twingo mk1 / AX; Vigipirate
ring-and-bag; ground bottles/cans/mégots — all in the **bottom band**) and the rendering
approach (discrete code-drawn silhouette objects, not a full-frame AI image).

## Decision

**1. Assets: code-drawn silhouettes, not AI sprites.** Add a pure Canvas2D module
`src/render/scene/nearForegroundArt.ts` (mirroring `foregroundArt.ts`) that draws each
object kind as a deterministic B&W silhouette + rim highlight. **No** `levelArt.json` image
slot, **no** CI render-farm / Pollinations dependency, **no** chroma-key cutout pass.
Rationale: same problem class and art register as the existing ironwork; deterministic
geometry makes the iron rule (non-occlusion) **provable in a unit test**, which an opaque AI
PNG's uncertain alpha extent cannot guarantee; these are fast-swimming background-of-attention
objects where flat silhouettes read better than baked texture under the CRT/fanzine style;
zero new infrastructure.

**2. Data (pure, `src/game`).** Extend the level-art data with an optional per-level
`nearForeground` layer: a negative engine `factor` plus a list of placed objects
(`kind` + normalized street-x + optional scale). **Opt-out = field absent** (Vitry omits it
entirely — its ~0.12 facade strip is a sliver at mobile zoom 1.7 and cannot hold a safe
band; UX D9.5). Belliard + Stalingrad carry the layer. Factor is clamped to `[-0.5, -0.1]` (widened from the originally gated `[-0.30, -0.15]` during the visual tuning passes Bertrand validated on the built layer — the shipped factors −0.34/−0.38 sit in the widened band)
(S 1.15–1.30) by the accessor; default target `-0.20` (S 1.20).

**3. Application + rendering (`src/render`).** A new `NearForeground.tsx` component places
each object as a transparent plane in the **bottom band** (top edge ≤ lowest-window-bottom +
0.06 facade-height, derived from the level's window zones), at `z ≈ 0.7`, `renderOrder 7`
(above the ironwork at renderOrder 5 / z 0.5, below the crosshair at renderOrder 16384).
The objects sit in a parent group whose x is repositioned every frame as
`group.position.x = camera.position.x * effectiveFactor`, exactly like the sky. The layer is
decorative, not hit-testable — the crosshair→world hit mapping is byte-unchanged.

**4. Reduced-motion clamp — mirror `deriveCrtParams`.** A pure, unit-tested function
`deriveNearParallaxFactor(factor, reducedMotion)` (in `src/render/scene/nearParallax.ts`)
returns `0` under reduced motion (layer tracks the facade, S = 1× — layer stays **visible**,
composition unchanged; UX D2), else the clamped factor. The OS signal is read **live** via
`matchMedia("(prefers-reduced-motion: reduce)")` with a change listener inside the component,
identical to `CrtPass.tsx` — no new pref field, same contract as every other muf motion.

**5. Mobile.** Density halved by the render layer (drop every other on-screen instance by
index parity); Vitry already opted out in data. Density target 3 on screen, hard cap 4
(desktop); ≈ half that on mobile.

## Consequences

Positive:

- Third depth stratum with **zero game-logic change** and **zero gameplay impact** while the
  iron rule holds — `src/game` gains only additive, optional data.
- Non-occlusion is verifiable by construction: band-confinement + deterministic geometry →
  a pure test asserts no object Y-extent enters the window rows ± margin at any pan offset.
- No new pipeline surface: no AI slot, no CI workflow, no cutout gate; the reduced-motion and
  Canvas2D-silhouette precedents are reused wholesale.
- Reduced-motion and mobile behaviours are unit-testable (`deriveNearParallaxFactor`,
  density parity) without a live R3F scene.

Negative / gotchas:

- Silhouettes are flat B&W; if a future art gate wants photographic near-foreground this ADR
  is superseded (the AI-slot path stays available as the alternative below).
- The clamp lives render-side (mirroring `deriveCrtParams`), not in `src/game`, even though it
  is pure — reduced-motion is an accessibility/display concern, not a game rule. This is a
  deliberate reading of the boundary law, consistent with the CRT precedent.
- Parallax feel couples to edge-scroll pan speed (`tuning.md`); the S value must be
  re-checked live at VERIFY (spec D2.3) — data default may move within the gated range.
- The layer adds ≤4 transparent quads + one group transform per frame; overdraw is a thin
  bottom strip only (see the GPU note handed to `gpu-specialist`).

## Alternatives considered

- **Full-frame AI foreground image** (new `levelArt.json` slot + render farm). Rejected:
  heavier infrastructure, non-deterministic, opaque alpha makes the iron rule unprovable, and
  a full-frame plane cannot be confined to the bottom band. Kept on record as the escape hatch
  if the art direction ever demands photographic near-foreground.
- **Dynamic "fade when a cop is behind"** (spec D1.4). Rejected upstream: couples render to
  game state, needs per-frame occlusion tests, worse feel than a layer that never occludes.
- **Reduced-motion = hide the layer.** Rejected (UX D2): changes the composition between
  modes; clamp-to-facade keeps identical framing and removes only the vestibular trigger.
- **Clamp function in `src/game`.** Rejected: reduced-motion is a display concern; the
  `deriveCrtParams` precedent places such derivations render-side.

## Amendment — animated feu tricolore (Bertrand-directed)

The `trafficLight` kind is a scoped exception to the "flat grey, zero glow" register
(C1): its lit lens carries **colour + a soft halo**, and it **animates** through a real
French carrefour cycle (véhicule vert → orange → rouge, with an interlocked feu piéton
below — piéton vert only during the vehicle-red window). A traffic light with no colour
and no cycle does not read as one. Housing, hoods, pole and every other prop stay grey.

It is drawn in **profile** (Bertrand-directed): the signal stands on the pavement
facing the road, so it is turned ~90° — a slim mast with the two heads cantilevered
toward the road, lenses as foreshortened ellipses under side-jutting hoods, rather than
a face-on view. This reads as real street furniture instead of a signal staring at the
player.

Mechanics, staying inside the ADR's constraints:

- Phase logic is a pure, unit-tested clock, `src/render/scene/trafficSignal.ts`
  (`trafficSignalPhase(t)`), driven off `state.clock.elapsedTime` in `NearForeground`.
- Animation reuses the **single shared texture** (all instances sync, like one
  controller): the traffic-light canvas is retained and **repainted in place only on a
  phase change** (`updateTrafficLightSignal`), not per frame — no per-frame allocation,
  the loader-warm path (`nearfg:trafficLight`) is unchanged.
- Under **reduced motion** the cycle freezes on the resting aspect (vehicle green /
  pedestrian red), consistent with D2.

### Non-occlusion carve-out for the traffic light (Bertrand-directed)

The original ADR confined **every** near prop below the lowest window row (the iron
rule), proven by construction. Bertrand has since chosen to make the feu tricolore a
**dominant, close hero prop**, explicitly accepting that it **breaks** that band: the
traffic light's world height is now `TRAFFIC_LIGHT_H_FRAC` (0.6) of the facade height —
it rises well into the window rows for a much larger signal with a long bare-mast gap
between the two heads.

Consequences of the carve-out, and what still holds:

- The traffic light **may partially mask a static cop window** it passes in front of as
  the camera pans. This is the accepted cost of the bigger signal — a conscious,
  documented relaxation of the iron rule, scoped to this ONE kind.
- It is still drawn at `renderOrder 5`, **below** the courier (6) and delivery van (7),
  so it can never mask a "Livrer" target (finding #8 still holds).
- **Every other near/far prop is unchanged** — still strictly capped under `maxH`
  (the band ceiling); the non-occlusion test still guards them. Only `trafficLight`
  bypasses `maxH`, via its own `TRAFFIC_LIGHT_H_FRAC` allowance in `NearForeground`.
