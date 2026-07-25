# 0065 — Fractional lives: per-archetype bullet damage in quarter-heart steps

- **Status:** Proposed
- **Date:** 2026-07-25
- **Number:** 0065, checked against local files, `docs/adr/README.md` index and
  every remote branch (max `0064` found, claimed by this branch) — no `producer`
  lane allocation for this single-lane Copilot session.

## Context

Enemy return fire cost a flat **one heart per hit**, and a level starts with 3
hearts. Combined with ADR-0064's directional aim — which points every round at
the player rather than dropping it straight down — three connecting shots ended
a run, and there was no immunity window, so two windows resolving on adjacent
ticks removed two hearts in under a tenth of a second. The result read as
punishing rather than tense.

The damage was also **uniform**: a base cop, a biker and an armoured riot cop
all hit for the same amount, so the archetypes were distinguishable by sprite,
cadence and HP but not by threat. The `Archetype` table already carries every
other per-kind tuning value (`hp`, durations, `scoreDelta`, `weight`), so the
missing knob was conspicuous.

`lives` was typed `number` but treated as an integer throughout: the HUD
rendered it as `"♥".repeat(lives)`, and the e2e in-game gate asserts the exact
string `♥♥♥` at a 3-heart start.

## Decision

1. **Lives become fractional, on a quarter-heart lattice.** `lives` stays a
   plain `number` in hearts, but damage may now be any multiple of 0.25.
   Every subtraction goes through `snapLives` (`round(x / 0.25) * 0.25`) so a
   run of quarter-heart hits lands exactly on 0 instead of leaving a
   floating-point residue that would keep a "dead" player alive. The death gate
   (`newLives <= 0`) is unchanged.
2. **Damage is a per-archetype fact, carried on the bullet.** `Archetype` gains
   `bulletDamage`; `Bullet` gains `damage`, set at spawn from
   `ARCHETYPES[enemy.kind].bulletDamage`. Carrying it on the projectile rather
   than resolving it from the shooter at impact time means the damage survives
   the shooter's death — the round is already in flight, and its archetype is a
   spawn-time fact. `damage` is **required**, not optional: TypeScript then
   forces every future spawn site to state a value rather than silently
   inheriting a default.

   | Archetype | `bulletDamage` | Rounds to kill a 3-heart player |
   | --------- | -------------- | ------------------------------- |
   | `normal`  | 0.25           | 12                              |
   | `biker`   | 0.5            | 6                               |
   | `riot`    | 1.0            | 3                               |

   Non-shooters (`bonus`, `civilian`, `hostage_taker`) declare 0. Shooting a
   civilian courier still costs a **whole** heart (`livesDelta: -1`): that is a
   fault, not damage, and stays on the integer lattice.

3. **A short invulnerability window.** A hit sets `playerInvulnRemaining` to
   `PLAYER_INVULN_SECONDS` (0.4 s), ticked down by `delta`. Bullets entering the
   hit disc while the window is open — or after an earlier bullet already
   connected on the same tick — are still **absorbed** (added to
   `hitBulletIds`, so they cannot hit again next tick) but cost nothing and
   raise no `PlayerHitEvent`. The window is deliberately short: it exists to
   swallow the instant double-tap, not to grant breathing room. Damage
   magnitude, not immunity duration, is the fairness lever.
4. **The HUD renders a partial heart.** `splitHearts(lives)` (a render-side
   derivation, tested, alongside `livesColor`) returns `{ full, partial }`.
   `LivesReadout` draws `full` solid glyphs plus, when `partial > 0`, one
   composite glyph: a faint ♥ with a solid copy clipped to `partial` of its
   width laid over it. The ratio travels as an inline `--fill` CSS custom
   property and the styling stays in the CSS Module, per ADR-0046. At integral
   health no partial node is emitted, so a full bar is still exactly `♥♥♥` and
   the e2e HUD gate is untouched.

## Consequences

- The three shooting archetypes now read as distinct threats: a room of base
  cops is survivable attrition, a riot cop is a genuine emergency. Difficulty
  can be tuned per level through the roster weights alone, without touching the
  state machine.
- `GameState` gains `playerInvulnRemaining`, and `Bullet` gains a required
  `damage`. Both are pure-layer facts; no React/Three dependency is added and
  the game/render boundary is unchanged.
- The `lives` preference (1–5, `prefsSystem`) still seeds an **integer** heart
  count — the fraction only ever appears mid-level as damage accumulates.
- Making `Bullet.damage` required forced eight existing test literals to state a
  value. That is the intended cost: it is now impossible to spawn a bullet
  without deciding what it does.
- The starting values are a first pass. They are data in one table
  (`ARCHETYPES`), so re-tuning after playtesting needs no structural change.
