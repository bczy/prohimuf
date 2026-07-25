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
  so it can never mask a "Livrer" target (finding #8 still holds). _(Superseded on
  2026-07-25 — see the amendment below: the near row moved to `renderOrder 5.75`, above
  the courier (5.5), so the near row, traffic light included, now draws IN FRONT of
  him.)_
- **Every other near/far prop is unchanged** — still strictly capped under `maxH`
  (the band ceiling); the non-occlusion test still guards them. Only `trafficLight`
  bypasses `maxH`, via its own `TRAFFIC_LIGHT_H_FRAC` allowance in `NearForeground`.

## Amendment — courier between the two prop rows, and in front of the van (Bertrand-directed, 2026-07-25)

Bertrand, reviewing the shipped street: _« le cycliste est en premier plan… il devrait
être dans la première et la seconde ligne de props »_. The livreur read as pasted on top
of the décor instead of riding **in** it, which flattened the differential parallax the
whole layer exists to sell. Reviewing the first pass the same day, he added: _« le
cycliste devrait être aussi devant le camion, là il passe derrière »_.

Two directives, one stack:

1. The courier sits **in depth between the two kerb rows** — drawn after the FAR row,
   before the NEAR row.
2. The courier is drawn **after the delivery vehicle** — the vélo passes in front of the
   camion, not behind it.

Together they **reverse finding #8 for the near row only** — the original rule that no
near-foreground prop may ever mask a "Livrer" target. Bertrand's explicit arbitration:
**depth ambiance over total target legibility**. The near row is the ONLY newly accepted
occlusion; nothing else in the scene gained the right to paint over a street actor.

**Assumed consequence — the near row now masks BOTH "Livrer" targets.** `vehicle <
courier < nearRow` admits no other arrangement: the van cannot be in front of the near
props while staying behind a courier that is itself behind them. So the delivery vehicle,
like the courier, may now be **partially masked by the near kerb row**. This is not a
side effect we discovered afterwards, it is the arbitration Bertrand made: both delivery
targets accept partial occlusion by the front prop row. In depth terms it reads straight
— the near props are the closest plane, the van is the street actor furthest from the
kerb, the cyclist rides between the two. What the van keeps: it is still a street
**actor**, so it stays in front of the FAR row (4) and in front of the facade-attached
ironwork (5); it is not a facade element.

Final street stack, single-sourced in `src/render/scene/streetDepth.ts` (`STREET_DEPTH`)
and guarded by `src/render/scene/__tests__/streetDepth.test.ts`:

| layer                     | renderOrder | z    | masks the courier?    | masks the van?        |
| ------------------------- | ----------- | ---- | --------------------- | --------------------- |
| far kerb row              | 4           | 0.60 | never                 | never                 |
| facade ironwork (ceiling) | 5           | 0.50 | **never** (see below) | **never** (see below) |
| delivery vehicle rim      | 5.2         | 0.61 | n/a                   | —                     |
| delivery vehicle          | 5.25        | 0.62 | n/a (now behind)      | —                     |
| **courier (vélo)**        | **5.5**     | 0.65 | —                     | n/a (now in front)    |
| near kerb row             | 5.75        | 0.70 | **may, partially**    | **may, partially**    |

What still holds, and why the numbering looks like this:

- The **far row never masks a street actor** — the guarantee of finding #8 survives for
  the row that sits behind both of them.
- **Both street actors still pass IN FRONT of the facade ironwork.**
  `ForegroundFrames` and `WindowGrilles` are balcony/grille overlays painted ON the facade at z 0.50, i.e.
  physically _behind_ every street actor, yet they own `renderOrder 5`. All these
  materials are `transparent` + `depthWrite:false` in one sort list, so renderOrder
  alone decides. A first cut of this amendment put the courier at 4.5 and thereby sent
  him **under** the ironwork: on `vitry` the opaque HLM balcony slab (`drawHlmZone`)
  lands at world y −4.17…−4.55 while couriers ride at `streetY` −4.8 with a 2.6-unit
  sprite, so a concrete rectangle painted straight across the rider's head and shoulders
  at every window column; `niveau-final`'s haussmann balustrade did the same. Every
  street-actor slot therefore stays **strictly above** `STREET_DEPTH.facadeOverlay` (5)
  and strictly below the near row: **5.2 / 5.25 / 5.5**, with the near row at 5.75. The
  layering test asserts this explicitly (`street ACTOR above the facade-attached
ironwork`), not merely that the slot is free — and the van is covered by the same
  assertion, since it moved into the same 5..6 window.
- The fractional slots **5.2 / 5.25 / 5.5 / 5.75** (same device as `ImpactEffects`'
  3.5 / 7.9 / 8.1) keep every street layer on a **distinct, unambiguous** `renderOrder`: with
  `depthWrite:false` transparent materials, equal renderOrders fall back to distance
  sorting, which is precisely the ambiguity we refuse. The test derives the "already
  claimed" set by scanning `src/render/**` for literal renderOrders, so a future module
  grabbing any of the four fails the build. Everything above 6 (hostage QTE 6..8, impact
  FX 7.9/8/8.1, crosshair 16384) is untouched: the whole street stack now fits between
  the facade overlays (5) and the QTE tableau (6). (`ForegroundImage` declares a renderOrder-6
  plane but is **not mounted anywhere** in the scene graph — `ForegroundFrames` and
  `WindowGrilles` are the only real facade overlays; earlier drafts of this ADR listed
  `ForegroundImage` as an occupant of 6, which was wrong.)
- `RIDER_Z` moved 0.701 → **0.65**, between the two rows' z, so world depth agrees with
  paint order rather than contradicting it. Likewise `VEHICLE_Z` moved 0.72 → **0.62**,
  below the courier's 0.65: paint order and world depth tell the same story on both
  axes, which the test asserts on both (`order` AND `z`). `DeliveryVehicleSprite` lost
  its literal `renderOrder={6}` / `renderOrder={7}` and its hard-coded `VEHICLE_Z`, just
  like `ForegroundFrames` / `WindowGrilles` before it: everything now reads from
  `STREET_DEPTH`, so ceiling, rows and actors can no longer drift apart silently. The
  van's neon rim (ADR-0011) keeps exactly its former RELATIVE geometry — one slot below
  its body, z − 0.01 — so the additive halo still draws behind the sprite; only the
  absolute numbers moved.
- The **feu tricolore carve-out compounds with this**: it lives in the NEAR row, so the
  hero mast may now cross a passing livreur — and the van — as well as a static cop
  window. Accepted, same arbitration.
- **Known, pre-existing, out of scope:** the FAR row stays at `renderOrder 4`, below the
  facade overlays, so a deep balcony slab can still paint over a low far-row prop on
  `vitry`. Far-row props are décor, not "Livrer" targets; lifting the whole row over the
  overlays is a visible art call for Bertrand / senior-architect, not a silent fix here.

### Same-day addendum — the réverbère is raised to the band ceiling (Bertrand-directed, 2026-07-25)

Reviewing the same belliard frame, Bertrand: _« Essaie de réhausser ce lampadaire, il
devrait être plus haut »_. On the capture the lantern of the réverbère haussmannien sat
at the **cabin** height of the delivery truck — a dwarf lamp planted in front of a van,
when the art (fluted mast, col-de-cygne) implies a lantern well above vehicle roofs.

**Measured cause (belliard, `facadeH = 12`, near row `rowScale = 1.3`).** The binding
ceiling was **not** the non-occlusion band: the natural height `0.62 × 12 × 1.3 = 9.67`
was cut by the global "believable size" cap `MAX_PROP_WORLD_H × rowScale = 4.5 × 1.3 =
5.85`, well under the band ceiling `maxH = 8.26` (desktop) / `7.66` (mobile). Because the
plane keeps its aspect, that cap shrank the WHOLE sprite — mast _and_ lantern — so the
lantern head landed at world y −5.18…−3.93 against a van roof at −3.30.

**Fix — a per-kind cap, not a global raise.** `MAX_PROP_WORLD_H` (4.5) stays the default
for every other prop; `KIND_MAX_WORLD_H` (`nearForegroundArt.ts`) overrides it for
`lamppost` only, at **7.0** world-units pre-row-scale. That value is a _backstop_: on both
levels that carry lampposts the **non-occlusion band becomes the operative ceiling**, so
the raise buys exactly the room the band already allowed and not one unit more. The same
commit makes that band clamp exact — it now clamps the sprite's **visible top**
(`bandMaxH / (1 − footPadFrac)`) instead of the raw plane box, recovering the foot-pad
slack the old `planeH ≤ maxH` silently discarded. Sizing moved into the pure
`nearPropPlaneHeight()` so it is testable without an R3F scene.

**This is not a second derogation.** `trafficLight` remains the ONE prop allowed above the
band. The lamppost stays strictly inside it, i.e. the full `NEAR_BAND_MARGIN` (0.8 world
units) below the lowest window row, at every pan offset:

| level      | density | plane H (was → is) | visible top → lowest window bottom | lantern bottom vs van roof (−3.30) |
| ---------- | ------- | ------------------ | ---------------------------------- | ---------------------------------- |
| belliard   | desktop | 5.85 → **8.90**    | −1.15 → −0.18 = **0.97 u**         | −5.18 → **−3.07** (+0.23 above)    |
| belliard   | mobile  | 5.85 → **8.25**    | −1.74 → −0.18 = **1.56 u**         | −5.18 → **−3.51**                  |
| stalingrad | desktop | 5.85 → **8.81**    | −1.24 → −0.27 = **0.97 u**         | −5.18 → **−3.13** (+0.17 above)    |
| stalingrad | mobile  | 5.85 → **8.16**    | −1.83 → −0.27 = **1.57 u**         | −5.18 → **−3.58**                  |

(Lantern bounds from the committed `nearfg/lamppost.png` alpha profile: the head occupies
texture rows 10..120 of 512.) The prop stays anchored on the kerb — the raise is pure
upward growth, `footPadFrac` still lands the feet on the pavement band. Every other kind's
computed height is bit-identical before/after (all are natural- or default-cap-bound, none
was band-bound). Locked by
`src/render/scene/__tests__/nearForegroundSizing.test.ts`, which walks both levels × both
densities × both rows and asserts the band clearance, plus the lantern-above-the-roof
target that fails the moment the lamppost falls back to the global 4.5 cap.
