# Story: Player shot lands flat at the aimed point (impact + wall mark)

**Story ID:** STORY-SHOT-FLAT-IMPACT
**Type:** Bug fix + faithful restoration (game logic + render/effects; art for two new visuals) — no new verb, input, or rule
**PM:** John · **Date:** 2026-07-14 · **Status:** ready-for-design-gate
**Scope guard:** PROJECT_GUIDELINES §1 (cahier des charges), §4 (boundary law), §5 (loi du glow)
**Pipeline note:** FIRST feature through the full stage 0-9 pipeline — treat as the exemplar.
**Relates to:** `src/game/systems/bulletSystem.ts`, `src/game/systems/crosshairSystem.ts` (aiming SoT — ADR-0002/0008), `src/render/scene/BulletSprite.tsx`, `src/render/effects/`

## Why (product value)

The player shot is the core verb of the shooting-gallery phase (the `Éviter`/return-fire
beat's counterpart). Today it feels wrong and reads as a bug:

- The player bullet spawns at the crosshair and travels **upward** (`velocity.y = +20`),
  visibly climbing the screen until it leaves bounds.
- Hits resolve **along that rising path** (proximity `HIT_RADIUS 0.8` to the enemy slot each
  tick), so you can kill an enemy that sits *above* where you aimed, and the shot that
  "should" hit dead-centre instead sails past and up.

The player expects: I aim at the target, I click, the target is hit **there**, and I see
the impact. This story makes the shot land flat and instant at the aimed point, adds an
impact effect at the point of impact, and leaves a persistent mark on the facade — closing
the gap between intent and feedback.

## Cahier des charges test — verdict: FAITHFUL FIX + FAITHFUL RESTORATION (no scope expansion)

> "Est-ce que Prohibition Atari ST avait ça ?"

- **Flat / instant impact at the aimed point — YES.** Prohibition is crosshair-based with
  effectively instant impact at the aimed point. The current climbing projectile is the
  deviation; removing it *restores* fidelity. This is a **bug fix**, not a new feature.
- **Impact effect (puff/explosion) at the hit point — YES.** The original shows a short
  impact flash where the shot lands. Faithful. The muf visual identity (fanzine B&W + acid
  neon, loi du glow §5) governs its look — that is an art-direction call, not a scope call.
- **Persistent impact mark on the facade — YES.** The original leaves visible impact marks
  on the building. Faithful. Bounded count (see AC4) keeps it KISS/YAGNI.

No change to the core loop (`Récupérer → Livrer → Éviter`), victory condition, inputs,
scoring, enemy behaviour, or weapon model. Net scope surface unchanged; fidelity improves.

## Problem statement (verified in code)

`fireBullet()` (`bulletSystem.ts`) spawns the player bullet at `crosshairToWorld(...)` with
`velocity {x: 0, y: +BULLET_SPEED (20)}`. `tickBullets()` advances it each frame; the bullet
climbs and is culled at `OUT_OF_BOUNDS_Y`. `checkBulletHits()` resolves a hit whenever a
*travelling* player bullet comes within `HIT_RADIUS` of an enemy slot's `screenPosition`.
Consequences: (1) the shot visibly rises; (2) the aim point and the hit point diverge —
you can hit an enemy the crosshair was not on. Enemy return fire (`fromPlayer === false`,
`velocity.y = -20`) is a separate, deliberately visible projectile telegraph and is **not**
in scope here.

## Scope

### IN (this story)

1. **Flat / instant player shot** — the player shot resolves at the **crosshair world point
   at the moment of firing**; it does not climb the screen. No upward trajectory.
2. **Hit at the aimed point** — a hit registers only when the aimed point is on the target
   (centre of the aimed target), not because a projectile grazed an enemy above/along a path.
3. **Impact effect at the point of impact** — a short explosion/puff plays at the impact
   world point on every player shot that lands (fanzine + loi-du-glow styling; art gate owns
   the look).
4. **Persistent wall mark on the facade** — an impact decal remains on the facade at the
   impact point. **Bounded count is required** (oldest evicted past the cap — art/design set
   the number, suggest ~12-24). Marks are cosmetic only.

### OUT (explicitly not this story)

- **No weapon changes** — no fire rate, ammo, spread, damage, or new weapon.
- **No enemy behaviour changes** — enemy state machine, spawn logic, and return fire
  (`fromPlayer === false` projectiles) are untouched. Enemy bullets still travel as their
  visible telegraph.
- **No scoring changes** — `scoreDelta/livesDelta/timeDelta/targetsDown` and the victory
  condition are unchanged. Same points for the same takedown.
- No change to the crosshair, mouse input, camera pan, or the aiming source-of-truth
  contract beyond consuming `crosshairToWorld` as it already exists.
- No animated/pulsing decal, no decal on enemy sprites, no per-surface (window vs wall)
  material differentiation, no sound-design scope (SFX handled by its own lane if pulled in).

## Acceptance Criteria (testable)

- **AC1 — no upward travel.** The player shot never climbs the screen. Firing at a point
  does not produce a projectile that rises through/past the aimed point. Verified on screen
  via `/verify` and asserted in `src/game` unit tests (the player shot carries no positive-Y
  climb; it resolves at the aimed point).
- **AC2 — hit at the aimed centre.** A player shot registers a hit **iff** the crosshair
  world point at fire time lies on the target (within the target's hit region), i.e. you hit
  the centre of the target you aimed at — and you do **not** hit an enemy that is not under
  the crosshair. Unit-tested: aim-on-enemy ⇒ hit; aim-off (incl. an enemy directly above the
  aim point) ⇒ no hit on that enemy.
- **AC3 — impact effect at the impact point.** On every landed player shot, a short
  explosion/puff renders at the **impact world point** (the aimed point), then clears. Styled
  per the fanzine identity and loi du glow (§5). Confirmed on screen via `/verify`.
- **AC4 — persistent wall mark, bounded.** A player shot leaves an impact mark on the facade
  at the impact point that **persists** after the explosion clears. The number of live marks
  is **bounded** (cap enforced; past the cap the oldest is removed). Marks are cosmetic and
  carry no game rule. Confirmed on screen; the cap is asserted (no unbounded growth).
- **AC5 — scoring / behaviour unchanged.** A takedown yields exactly the same
  score/lives/time/target deltas as before this change; enemy behaviour and return fire are
  unchanged. Existing `src/game` unit tests for hit outcomes stay green (adjust only the
  trajectory/aim-point assertions that this story intentionally changes; the reward math is
  untouched).
- **AC6 — boundary law holds (§4).** Hit resolution + impact-point derivation live in
  `src/game` (pure, TDD, no React/Three). The explosion and the wall-mark decal render in
  `src/render` (`effects/`) and hold **no** game rule. Hooks remain the only bridge.
  Where the *decal set* is owned (transient render-only state vs. game state) is an
  **architect call** — flagged, not prescribed. `src/game` imports no Three.
- **AC7 — verified before done (DoD §9).** `rtk tsc` + `rtk vitest` + `rtk lint` clean; new
  `src/game` logic is unit-tested TDD-first; the flat shot, impact effect and persistent mark
  are all confirmed in-browser via `/verify`. An ADR is added if the change alters the
  game/render/hooks contract or introduces a new persistent-decal data structure.

## Open design questions (for the design + architect gates — not decided by PM)

1. **Tracer or none?** Instant resolution is required (AC1); whether a *brief flat* muzzle-
   to-target tracer/flash is drawn for readability is a design/art call. If drawn, it must
   not climb and must not change hit timing.
2. **Hit region shape** — reuse the existing `HIT_RADIUS`-style disc around the target
   centre, or the slot's window bounds? Design gate decides what "on the target" means for
   AC2 (must remain "you hit where you aim").
3. **Decal ownership + cap value** — architect owns where the bounded decal set lives; art
   owns the cap number and the mark's look.

## Mandatory gates (pipeline stages — none skippable)

- **Design gate — `lead-game-designer`** (after `game-designer` 3C/feel pass): confirms the
  flat-shot feel, the "hit where you aim" hit-region definition, and that the impact
  feedback reads. Signs the design gate before architecture.
- **Art gate — `lead-art`** (with `art-advisor`/`game-graphist`): owns the explosion effect
  and the wall-mark decal visuals — fanzine B&W + acid neon, loi du glow §5 — and the mark
  cap number. ASSET/composite gate on the runtime look at game scale.
- **Architect sign-off — `senior-architect`:** lane partition, the boundary-clean approach
  (game resolves the hit + impact point; render owns effect + decal), decal-ownership
  decision, and whether an ADR is required. Reviews before the merge panel.
- **QA gate — `qa-lead`:** test plan + regression (existing hit/score tests stay green),
  new `src/game` unit tests present and green, e2e smoke for the shooting phase unaffected,
  `game-designer` playtest vs spec, composite visual gate for the runtime effect.
- **Code-review panel (mandatory merge gate) — 4 reviewers in parallel:** `code-review`
  (high), `bmad-code-review`, `bmad-review-edge-case-hunter`, `security-review`; findings
  adversarially verified, triaged by `senior-architect`. No merge with an unresolved
  CONFIRMED blocking/major finding.
- **PM acceptance — John:** verifies AC1-AC7 met and scope-OUT respected before accept.

---

*Architect owns: lane partition, the game/render split for hit resolution vs. effect/decal
rendering, decal-set ownership, and the ADR call. Devs implement only assigned, scoped
lanes. Log every hand-off in `docs/agent-handoffs.md`.*
