# Spec — Player shot: flat instant impact + wall mark (STORY-SHOT-FLAT-IMPACT)

**Feature:** the player's shot in the shooting-gallery phase.
**Author:** `game-designer` (Sacha) · **Date:** 2026-07-14
**Status:** DRAFT — pending `lead-game-designer` (Karim) design gate, then `senior-architect`.
**Story:** `_bmad-output/planning-artifacts/story-player-shot-flat-impact.md`
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges) — FAITHFUL FIX + RESTORATION,
no new verb. Core loop `Récupérer → Livrer → Éviter` untouched.
**Cahier des charges verdict:** Prohibition (Atari ST) is a crosshair shooting gallery with
instant impact at the aimed point, an impact flash, and marks left on the facade. The current
climbing projectile is the deviation. This spec **restores** fidelity; it adds no scope.

This is a design spec, not code. Values are gated here and transcribed into `src/game/**`
(hit resolution) and `src/render/effects/**` (explosion, tracer, wall marks) by the devs.
`src/game` stays pure (no Three); the decal set's ownership (game slice vs render-transient)
is an **architect call** (AC6) — this spec only fixes behaviour and numbers.

---

## 1. Shot resolution model — hitscan at fire time

**D1.1 — Instant resolution.** On a player fire event, the shot resolves **at the moment of
firing**. There is no player projectile in `state.bullets`, no per-tick advance, no upward
travel. The player shot is removed from the travelling-bullet path entirely.

**D1.2 — Impact point.** The impact world point is
`IMPACT_POINT = crosshairToWorld(crosshair, cameraOffsetX, cameraOffsetY, viewW, viewH)`
evaluated at fire time — the aiming source of truth (ADR-0002/0008), unchanged. This is the
single point the whole feature keys off: hit test, explosion (on a miss), and wall mark.

**D1.3 — Hit region ("on the target").** Keep the existing disc: an enemy is a hit candidate
iff `distance(IMPACT_POINT, slot.screenPosition) ≤ HIT_RADIUS` with **HIT_RADIUS = 0.8 world
units, unchanged.**
Rationale for keeping 0.8: (a) it is the value the player has already learned and the same
constant the HUD target-indicator dead-zone reasons about; (b) a window is ≈1.6 world units
wide, so a 0.8 radius ≈ one window half-width — you hit the window you aimed at, nothing
above it; (c) **the effective target shrinks sharply under this change** — today the climbing
bullet sweeps a vertical column and grazes anything above the aim within the radius, so a
tighter radius on top of removing that sweep would feel punishing. 0.8 keeps the target fair
while making "hit where you aim" true. A window-bounds (`slot.size`) rectangle was considered
and rejected: more code, per-level variance, and no felt benefit over the disc. Revisit only
if playtest shows the disc reads as too forgiving.

**D1.4 — Hittable states.** Unchanged from today: an enemy is eligible unless its state is
`DEAD`, `HIT`, or `HIDDEN`. `VISIBLE` / `SHOOTING` / `APPEARING` remain hittable.

**D1.5 — Overlap rule: nearest wins, one target per shot.** One shot = one bullet = **at most
one enemy hit**. If two live enemies fall inside HIT_RADIUS of the impact point, the shot hits
the **nearest** (smallest distance to `IMPACT_POINT`). Deterministic tie-break on exactly
equal distance: **lowest `slotIndex`**. This differs from today only in a degenerate
overlapping-slot case (windows are laid out spaced apart, so overlap is rare); "nearest wins"
is the faithful shooting-gallery rule — the barrel points at one target.

**D1.6 — Damage / reward.** The hit decrements the chosen enemy's `hp` by 1 (same as one
bullet landing today). Score/lives/time/`targetsDown` effects land **only when `hp` reaches
0**, using the exact same `ARCHETYPES[kind]` deltas as today (see §6). No reward math changes.

**D1.7 — Miss (empty wall).** If no live enemy is within HIT_RADIUS, the shot is a **miss**:
no `hp` change, no score/lives/time change. A miss still produces a wall mark (§4) and a small
wall puff (§3.3). Every shot leaves evidence on the facade.

---

## 2. Optional flat tracer — RECOMMENDATION: YES, static, minimal

**D2.1 — Decision: a single static muzzle-to-impact flash.** Draw one straight tracer segment
from a muzzle origin to `IMPACT_POINT`, rendered **at full length on its first frame** and
held for its whole (short) life, then gone. It is a still line, not a moving dot.
Rationale: pure hitscan with zero line-of-flight can read as "did the shot fire?"; a static
beam gives the shot an origin and a direction (the courier firing up at the facade) and adds
juice — while being structurally incapable of reintroducing the climbing bug, because it never
advances a position and never exists as a `Bullet`.

**D2.2 — Hard constraints (non-negotiable).**

- The tracer **does not resolve or gate the hit** — the hit is already resolved at fire time
  (§1). The tracer is cosmetic only.
- It **never climbs / never animates its endpoints.** Its geometry is fixed for its lifetime;
  it may only fade its opacity out.
- It lives in `src/render/effects/**`, holds no game rule, reads no `Bullet`.

**D2.3 — Geometry.** Muzzle origin = `(IMPACT_POINT.x, MUZZLE_ORIGIN_Y)`, i.e. directly below
the aim at the bottom edge of the current view, so the flash reads as a shot fired upward from
street level. `TRACER_DURATION` and `TRACER_WIDTH` in §5. Colour is acid-neon per loi du glow
— an art call (`lead-art`), not specified here.

**D2.4 — Fallback.** If, at the art/composite gate, the static beam reads as travel or clutters
rapid fire, **drop it** — the impact explosion (§3) is sufficient feedback and is the required
element. The tracer is the enhanceable part; the instant impact is the contract.

---

## 3. Impact explosion

**D3.1 — One explosion per landed shot.** Every player shot spawns exactly **one** impact
effect. It is gated on the **shot landing**, not on a takedown — a non-lethal hit on a
multi-`hp` enemy still bursts (the floating score label stays takedown-gated, §6; the two are
independent).

**D3.2 — Hit vs wall read (required).** The player must distinguish hit from miss **at a
glance**. This is a read requirement, not a style call: a HIT connecting with a body plays the
**full explosion**; a MISS on empty wall plays a **smaller puff/spark** (§3.3). Size is keyed
on hit-vs-wall, not on kill. The visual language (fanzine B&W + acid neon) is `lead-art`'s.

**D3.3 — Timing and size.**

- Duration: `EXPLOSION_DURATION = 250 ms` (both hit and miss) — ≈15 frames at 60fps, enough to
  read as a flipbook burst, short enough not to smear under fast clicking.
- Hit size: `EXPLOSION_SIZE_HIT = 1.4 world units` (diameter) ≈ 1.05× the enemy sprite height
  (enemy plane ≈ 1.3 world) — the burst frames/engulfs the target.
- Miss size: `EXPLOSION_SIZE_MISS = 0.7 world units` (diameter) ≈ 0.5× the hit — a wall spark,
  clearly lesser.

**D3.4 — Position ("under the target").**

- On a **HIT**, the explosion anchors to the **base of the downed/struck target**, not to the
  raw click: centre = `(slot.screenPosition.x, slot.screenPosition.y − TARGET_BASE_DROP)` with
  `TARGET_BASE_DROP = 0.45 world units`. This drops the burst to the torso/sill so it blooms up
  over the body and does not cap the head — Bertrand's "under the target". Because a hit is
  within 0.8 of the slot centre, this is always within ~1 unit of the click, so it still reads
  as "there".
- On a **MISS**, the puff anchors **exactly at `IMPACT_POINT`** — it is a wall strike, it
  belongs where the shot struck.

---

## 4. Wall marks (persistent facade decals)

**D4.1 — On hits AND misses.** Every landed player shot leaves one impact mark on the facade
at **`IMPACT_POINT`** (the struck point — decoupled from the explosion anchor, which on a hit
snaps to the target base per D3.4). Rationale: the round strikes the facade whether or not a
body was in the window; marking both is faithful (the original pockmarks the building) and
gives the player a persistent record of their fire.

**D4.2 — Cap = 16, FIFO eviction.** At most `WALL_MARK_CAP = 16` live marks. Adding the 17th
evicts the **oldest** (first-in-first-out). Justification (band 12–24): 16 reads as sustained
pockmarking — a mental 4×4 — and comfortably absorbs a burst of misses within a wave before
recycling, without saturating the facade into visual noise that competes with enemies and the
crosshair. It is also trivially cheap (16 static quads). 12 recycles too visibly during a
sustained miss streak; 24 starts to clutter the B&W facade and dilute the read of live
targets. 16 is the middle that holds both.

**D4.3 — Lifetime.** Marks **persist for the level** — no time decay, no fade-out; they are
removed only by the FIFO cap (D4.2) or a **level restart / new level** (i.e. cleared in
`createInitialState`). A restart starts on a clean facade.

**D4.4 — Cosmetic only.** Marks carry **no** game rule: they do not block, do not count, do
not affect hit tests or scoring. Dim B&W xerox scuffs — **they do not glow** (loi du glow §5:
only interactive things glow; a spent mark is inert). `WALL_MARK_SIZE = 0.35 world units`
(diameter) — small scuffs, an art call for exact look.

**D4.5 — Ownership (flag, not a decision).** Because marks are cosmetic and rule-free, they
can live as render-transient state (`src/render/effects/**`) rather than in `GameState`,
keeping `GameState` rule-only. This is deferred to `senior-architect` per AC6 — the design
only requires that (a) the impact point and hit/miss classification are produced by the pure
game logic, and (b) the decal set is bounded (D4.2) and level-scoped (D4.3).

---

## 5. Tuning table (all magic numbers)

| Constant              | Value | Unit           | Meaning / rationale                                                    |
| --------------------- | ----- | -------------- | ---------------------------------------------------------------------- |
| `HIT_RADIUS`          | 0.8   | world (radius) | Hit disc around slot centre. **Unchanged** — fair target (§1.3).       |
| `EXPLOSION_DURATION`  | 250   | ms             | Impact burst life, hit and miss (§3.3).                                |
| `EXPLOSION_SIZE_HIT`  | 1.4   | world (diam)   | ≈1.05× enemy sprite height; frames the target (§3.3).                  |
| `EXPLOSION_SIZE_MISS` | 0.7   | world (diam)   | ≈0.5× hit; lesser wall spark, distinct hit/miss read (§3.2–3.3).       |
| `TARGET_BASE_DROP`    | 0.45  | world          | Hit explosion drop below slot centre → "under the target" (§3.4).      |
| `TRACER_DURATION`     | 50    | ms             | Static muzzle-to-impact flash life (§2). Fades opacity only.           |
| `TRACER_WIDTH`        | 0.06  | world          | Thin beam — a crack, not a bar (§2).                                   |
| `MUZZLE_ORIGIN_Y`     | −6    | world          | Bottom edge of view (≈ −VIEW_H/2); tracer fired up from street (§2.3). |
| `WALL_MARK_CAP`       | 16    | count          | Max live facade marks; FIFO evict (§4.2).                              |
| `WALL_MARK_SIZE`      | 0.35  | world (diam)   | Small inert B&W scuff; does not glow (§4.4).                           |

No projectile speed for the player shot — it is hitscan (there is no travel).

---

## 6. What does NOT change

- **Scoring / lives / time / target math.** `ARCHETYPES[kind]` `scoreDelta` / `livesDelta` /
  `timeDelta` / `countsAsTarget`, `targetsDown`, `kills`, and the victory gate
  (`kills >= enemiesToWin`) are **byte-identical**. Same takedown → same reward. Existing
  `src/game` hit/score tests stay green; only trajectory / aim-point assertions change.
- **Takedown floating feedback** (`+score` / `+Ns` / `-1 ♥`) stays **takedown-gated** (fires
  only when `hp` reaches 0), anchored to the slot as today. It is independent of the
  shot-gated explosion (§3.1).
- **Enemy behaviour.** State machine, spawn logic, waves, roster, `hp`, timers — untouched.
- **Enemy return fire.** `fromPlayer === false` bullets remain a **travelling** projectile
  (`velocity.y = −20`, `tickBullets`, `OUT_OF_BOUNDS` cull) and stay in `state.bullets`; the
  `BulletSprite` render path for enemy bullets is unchanged. Only the **player** branch leaves
  the bullet path. The visible enemy-bullet telegraph is deliberate and preserved.
- **Crosshair, mouse/touch input, camera pan, aiming SoT.** `crosshairToWorld` and the
  crosshair sprite are consumed as-is; movement, buffering, mobile tap-to-shoot (ADR-0015) are
  untouched.
- **`HIT_RADIUS = 0.8`** itself — the value is kept (§1.3).

---

## 7. Acceptance criteria (playtest, for the VERIFY stage)

Mapped to the story's AC1–AC7; `game-designer` playtests the built feature vs these before the
architect's integration review.

- **A1 (AC1) — no upward travel.** Firing produces no rising player projectile; nothing climbs
  through/past the aimed point. (`src/game`: no player `Bullet` enters `state.bullets`.)
- **A2 (AC2) — hit where you aim.** Aim-on-enemy (within 0.8 of a live slot) ⇒ that enemy is
  hit; aim-off, **including an enemy directly above the aim point**, ⇒ no hit. Two overlapping
  candidates ⇒ the nearer is hit, tie → lowest `slotIndex` (D1.5).
- **A3 (AC3) — impact effect.** Every landed shot shows one burst (250 ms): full at the target
  base on a hit, small puff at the impact point on a miss; hit vs miss distinguishable at a
  glance (D3.2).
- **A4 (AC4) — bounded persistent marks.** Marks appear on hits and misses, persist through the
  level, and never exceed 16 (17th evicts the oldest); cleared on restart. Fire >16 shots and
  assert the count caps.
- **A5 (AC5) — reward unchanged.** A takedown yields the identical score/lives/time/target
  deltas as before; enemy behaviour and return fire unchanged.
- **A6 (AC6) — boundaries.** Hit resolution + impact-point derivation are pure `src/game`;
  explosion, tracer, wall marks render in `src/render/effects`; hooks remain the only bridge.

---

## 8. Hand-offs

- `lead-game-designer` (Karim): design gate — flat-shot feel, the 0.8 hit region, hit/miss
  read, "under the target" anchor, cap = 16, tracer YES-but-droppable.
- `lead-art` (Nico): owns the explosion + wall-mark + tracer **visuals** (fanzine B&W + acid
  neon, loi du glow §5) and can veto/tune the tracer at the composite gate; this spec fixes
  behaviour and the read requirement (hit vs miss distinct; marks inert/non-glowing), not style.
- `senior-architect` (Winston): decal-set ownership (D4.5), lane partition, ADR call.

_Log the design-gate verdict in `docs/agent-handoffs.md` under `story-instant-hit-player-shot`._
