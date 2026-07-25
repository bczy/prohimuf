# Story — Enemy bullet: 3D projectile, generated model, and fractional damage

Branch: `claude/claudecreate-3d-bullet-visualization-another-one` · PR #130 ·
opened 2026-07-23, reprised 2026-07-25

Bertrand asked to make enemy return fire read as a real, threatening projectile
instead of a flat direction-less disc falling straight down, then — after
playtesting — to soften the damage it deals. Run as a **single-lane Copilot CLI
session**, not a crew fan-out: the whole diff sits in the `dev-gameplay` /
`dev-r3f-render` / `dev-tooling-assets` seam and no design, art or dependency
decision was opened. The stage-6 merge gate is the **CI panel**
(`code-review-panel.yml`, ADR-0063), never a self-simulated one.

## 1. BUILD — directional fire + 3D projectile + generated model (ADR-0065)

- Aim: enemy bullets are aimed at the camera-centred player instead of
  `velocity.x = 0`. The aim is a pure function, `aimBulletVelocity` in
  `bulletSystem`, so both axes reach the target together (`tickBullets` never
  re-steers after spawn).
- Geometry: `BulletSprite` draws a cylinder body + sphere cap oriented per frame
  by a quaternion mapping local +Y onto the velocity, with a distance-driven
  scale ramp as the depth cue.
- Generated asset: `scripts/gen-bullet-3d.mjs` + `.github/workflows/gen-bullet-3d.yml`
  fetch a textured GLB from Pollinations `hyper3d-rodin` (the only listed 3D model
  taking a bare text prompt — `trellis-2-*` are image-to-3D). `bulletModel.ts`
  async-loads it via `GLTFLoader` from the already-installed `three` package (no
  `@react-three/drei` added); a missing/404 GLB leaves every slot on the
  procedural mesh forever, so the fallback path is exercised on every build.
- `model-viewer.html` was added to calibrate `MODEL_SCALE` against the real
  generated bbox rather than by eye.

## 2. CONSOLIDATION — absorbing PR #129

PR #129 (`claude/create-3d-bullet-visualization`) had been opened on the same
subject and reached a full tested implementation, including an ADR that also
claimed the number 0064. Rather than merge the two branches (its
`stateMachine`/`BulletSprite` are a regression against this branch — no GLB, aim
at the world origin instead of the camera offset), the two pieces it had and
this branch lacked were ported deliberately:

- `enemyFireSystem.ts` — aim jitter. `aimBulletVelocity` points exactly at the
  player, so every shot was a guaranteed hit unless the player panned away. The
  aim point is now offset inside a disc, sampled with inverse-CDF on the radius
  (√u, no centre clumping) from a splitmix32 RNG seeded on `(bulletId, enemyId)`:
  deterministic under Vitest, independent of frame timing, decorrelated between
  two windows firing on the same tick. No `Math.random` in the pure layer.
- Player-hit channel — `playerHitEvents` on the tick, drained by `useGameLoop`
  onto a `PlayerHitChannel` mirroring `ImpactChannel`, rendered by
  `PlayerHitEffects` as a red flash + camera shake (shake suppressed under
  `reducedMotion`; the flash is a colour cue, so it stays).

`spawnEnemyBullet` was deliberately NOT ported — `aimBulletVelocity` already
covers it and aims correctly. PR #129 closed as superseded.

## 3. BUILD — fractional lives (ADR-0066)

Playtest feedback: three rounds ended a run, and a base cop was exactly as lethal
as an armoured riot cop.

- `lives` moves on a quarter-heart lattice; every subtraction goes through
  `snapLives` so repeated 0.25 hits land exactly on 0 instead of leaving a
  floating-point residue that keeps a "dead" player alive.
- `Archetype.bulletDamage` (0.25 normal / 0.5 biker / 1.0 riot, 0 for
  non-shooters) is copied onto `Bullet.damage` at spawn, so the damage survives
  the shooter's death. `damage` is **required**, not optional: TypeScript then
  forces every future spawn site to state a value. That flagged 8 existing test
  literals — the intended cost.
- Shooting a civilian courier still costs a whole heart: that is a fault, not
  damage.
- A 0.4 s invulnerability window swallows the instant double-tap. Bullets
  arriving while it is open are still absorbed (so they cannot hit again next
  tick) but cost nothing.
- HUD: `splitHearts` (pure render-side derivation, tested next to `livesColor`)
  returns `{ full, partial }`; the partial heart is a solid ♥ clipped to `--fill`
  over a faint one, ratio inline as a CSS custom property per ADR-0046. At
  integral health no partial node is emitted, so a full bar is still exactly
  `♥♥♥` and the e2e HUD gate is untouched.

## 4. ADR renumbering

PR #132 (`bczy-cuddly-succotash`) merged first and took 0064 for the Copilot
crew-orchestration decision. This lane's two ADRs shifted up — enemy bullet
0064 → **0065**, fractional lives 0065 → **0066** — and every in-code
`ADR-0064` reference on this branch (all of which belonged to the bullet
decision) moved with them. The `ADR-0064` mention in `docs/handoffs/fixes.md` is
main's and was left alone. Index regenerated with `gen-adr-index.mjs --write`.

## Verification

`yarn typecheck` + `yarn test` (1083, 82 files) + `yarn lint` + `yarn build` all
green locally after each step. E2E, art render and the 4-reviewer panel run in
CI on the PR.

## Follow-ups (out of this story)

- `public/assets/models/bullet.glb` is 1.3 MB of binary in git; each
  re-generation adds as much again to history. Worth a decision on where
  generated 3D assets live before a second model lands.
- The damage table is a first pass. It is data in one place (`ARCHETYPES`), so
  re-tuning after playtest needs no structural change.
- Player shots remain hitscan (ADR-0040), so the generated model is only ever
  seen on enemy fire.
