# 0030 — Hostage-taker cinematic QTE (freeze + progressive zoom + body-part shooting)

- **Status:** Accepted (partially superseded by
  [ADR-0031](./0031-hostage-qte-duel-porte-cochere.md) — the static frozen tableau, the
  `windowSeconds` clock, and the `PART_DAMAGE` body-part table + captor health bar are
  reworked into "Le duel de la porte cochère"; the freeze-the-rest-of-the-level mechanism,
  the scripted trigger, the "OTAGE" banner, the 2 s zoom, and the side-objective rule stay)
- **Date:** 2026-07-16
- **Supersedes:** [ADR-0006](./0006-directional-sprite-generation.md) (hostage portion; car
  portion withdrawn). Also replaces this ADR's own earlier (never-merged) double-hitbox
  window/street hostage design.
- **Related:** [ADR-0004](./0004-enemies-car-hostage-taker.md) (D5 the continuous `energy`
  stat — reused here), the scripted delivery beat (`src/game/systems/deliverySystem.ts` +
  `src/game/types/delivery.ts`) which this QTE is modelled on,
  [`enemy-bestiary.md`](../../_bmad-output/guidelines/enemy-bestiary.md) (§3 preneur d'otage),
  `src/game/systems/qteSystem.ts`, `src/game/types/hostageQte.ts`,
  `src/game/systems/stateMachine.ts`, `src/hooks/useGameLoop.ts`.

## Context

An earlier iteration of this ADR shipped (on this branch, unmerged) a **double-hitbox** hostage
taker: a window/street pop-up where the player aimed a narrow "kidnapper" head band (reward) vs.
the foreground hostage (penalty), one bullet = one outcome. Bertrand chose to **change the
feature** into a **cinematic QTE** (quick-time event): a dramatic, focused set-piece rather than a
brief pop-up.

The QTE: when it triggers, **the rest of the scene freezes**; the camera does a **progressive
zoom (2 s)** onto the captor while an **"OTAGE" warning** shows; then a **5 s window** opens to
shoot his **body parts** (head/torso/arms/legs — each more or less lethal). He has a **health bar**
(several hits). A **hostage — the daughter of a cartel-boss — must be saved**: hitting her drains a
lot of energy, and she dies (rescue failed) if her small health bar empties or the window expires
(he executes her).

Forces read from the code: `GameState` is a flat immutable record ticked by one pure
`tickGameState`; the only precedent for a scripted, timed, semi-cinematic beat is the vehicle
**delivery** (authored spec → nullable runtime sub-record → forward-only phase machine with an
integrity gauge + a `windowRemaining` countdown → a render sprite that also surfaces a HUD slice).
The camera is **orthographic**; `ortho.zoom` is a live scalar the whole viewport math already
derives from, so a zoom is a render-layer lerp. There was **no partial-freeze** — `paused` halts
the whole tick, which is too much (the QTE's own timers, aiming and shooting must stay live).

## Decision

### D1 — Replace the double-hitbox design; the QTE is the hostage feature

Remove the window/street double-hitbox hostage entirely (see §"Removed"). The hostage taker is no
longer an `Enemy`/window pop-up; it is a scripted QTE, authored per level as
`LevelConfig.hostageQte` (Belliard-first), modelled on the delivery beat.

### D2 — Pure QTE state & rules (`qteSystem.ts`, `types/hostageQte.ts`)

- `QteSpec` (authored): `triggerAtElapsedSeconds`, `captorHp`, `hostageHp`, `zoomSeconds`,
  `windowSeconds`, `bonusScore`, `bonusEnergy`, `anchor` (world point to zoom onto).
- `HostageQte` (runtime sub-record on `GameState`, nullable): forward-only phase machine
  `ZOOMING → ACTIVE → (WON | LOST) → DONE`, with `captorHp/captorHpMax`, `hostageHp/hostageHpMax`,
  `zoomRemaining`, `windowRemaining`, a brief `resultRemaining` hold, `anchor`, `warning`.
- `qteZoneAt(dx, dy)` classifies a shot (world offset from the captor anchor) into a body part
  (`head`/`torso`/`arm`/`legs`), the `hostage`, or `miss`. `PART_DAMAGE` sets per-part lethality
  (head one-shots; torso medium; limbs chip). `tickQte` advances the timers and resolves a shot:
  captor hp → 0 = **WON** (one-time `bonusScore`/`bonusEnergy`); a hostage hit penalises and chips
  her hp; hp 0 **or** window expiry = **LOST** (one-time timeout penalty). Terminal outcomes are
  charged exactly once. It fires **once per level** (the record persists through `DONE`).
- Magnitudes are game-designer defaults (tunable): captorHp 4, hostageHp 3, zoom 2 s, window 5 s,
  head/torso/arm/leg damage 4/2/1/1, success +8 score/+15 energy, hostage hit −3/−25,
  timeout −2/−15. Penalties/bonus reuse the ADR-0004 D5 `energy` stat.

### D3 — Partial freeze in `tickGameState`

A branch high in the tick (after the crosshair, before enemies): when the QTE is active
(`isQteActive`), only the crosshair, the two QTE timers and the player shot vs. the body-part
zones advance; the entire rest of the scene (enemies, waves, spawns, bullets, couriers, delivery,
the level clock) is carried through unchanged via `...state`. A QTE-less level (`qteSpec === null`)
skips the branch and stays byte-for-byte deterministic.

### D4 — Side objective, not a win target

A successful rescue is a **side objective**: it grants score/energy but **never advances the
kill quota** (`kills` is untouched). One QTE per level.

### D5 — Render-owned progressive zoom + freeze look

The zoom is driven in the sanctioned bridge (`useGameLoop`), which already mutates the camera:
lerp `ortho.zoom` and `camera.position` toward `qte.anchor` over `zoomSeconds`, gate the two
existing pans (mobile inertial + desktop edge-scroll) while active, and lerp back / restore base
exactly on `DONE`. The zoom/ease math is a pure, unit-tested helper. The captor is drawn by a new
`HostageQteSprite` (the `enemy_hostage` texture, cop fallback until art lands, rising-tension tint
from `hostageCue`). The HUD shows the captor health bar and the 5 s countdown (delivery-gauge
markup), a hostage-hp pip row, the "OTAGE" warning, and the WON/LOST result chip.

### D6 — Boundary law preserved

All QTE rules are pure `src/game` (unit-tested); the render/HUD hold no rules; the only game↔render
bridge stays `src/hooks/useGameLoop.ts`; `HUD.tsx` imports only view types.

## Removed

The dead double-hitbox path: `hostageSystem.ts` (+ test), the `HostageTaker` street type, the
`EnemyState "EXECUTES"` state and its `enemySystem` routing, the `bulletSystem` hostage branch, the
`stateMachine` window-EXECUTES + street-hostage integration and the `GameState`
`hostageTakers/hostageTimer/hostagesSpawned` fields, and `HostageTakerSprite.tsx`. **Kept:** the
`energy` stat, the `enemy_hostage` sprite (now the QTE captor; `ARCHETYPES.hostage_taker` stays a
weight-0 art descriptor, so `WEIGHTED`/`pickKind` are byte-identical), and `hostageCue.ts`.

## Consequences

**Positive**

- A dramatic, readable set-piece: the freeze + zoom focuses the player entirely on the precision
  decision; body-part lethality + a health bar make it a skill moment, not a coin-flip.
- Modelled on the proven delivery beat (nullable sub-record + `windowRemaining` + forward-only
  phase machine), so it slots into the existing architecture with one new pure system.
- Additive-and-optional (`qteSpec === null` ⇒ untouched, deterministic); window-spawn determinism
  preserved; the boundary law holds.

**Negative / costs**

- The camera has three `useFrame` writers (mobile pan, edge-scroll, the zoom driver): they must be
  gated on `isQteActive` and the base zoom/position restored exactly on DONE, or the view is left
  magnified. Highest-risk part.
- `GameState` grows (`qteSpec`, `qte`); every explicit `GameState` return in the tick must carry
  them (tsc enforces it).
- A conscious extension **beyond** Prohibition (Atari ST 1987): a zoom+timer QTE is a modern
  console-era mechanic. Explicitly requested by Bertrand; documented here and in the bestiary. A
  `lead-game-designer` sign-off on the tuning is warranted.

**Gotchas**

- The terminal WON/timeout outcome must be charged exactly once (guarded), and a same-tick
  kill-vs-timeout resolves to WON (the shot wins).
- The zoom bands are world offsets from `anchor`; zoom magnifies the screen but not world geometry,
  so the body-part bands hold at any zoom. Tune `anchor` + bands against the `enemy_hostage` art.
