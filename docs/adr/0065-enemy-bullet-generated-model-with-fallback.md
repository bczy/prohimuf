# 0065 — Enemy bullet: generated textured GLB with procedural fallback

- **Status:** Proposed
- **Date:** 2026-07-25
- **Number:** 0065, renumbered from 0064 after the `bczy-cuddly-succotash`
  lane merged its own ADR-0064 (Copilot crew orchestration) into `main` first;
  checked against `origin/main`, the local files and `docs/adr/README.md`.

## Context

`BulletSprite.tsx` renders enemy return-fire projectiles (player shots are instant
hitscan, ADR-0040, and never enter `state.bullets`) as a code-drawn Three.js
primitive: a `cylinderGeometry` body + `sphereGeometry` cap, oriented per frame by
quaternion from the bullet's velocity, `meshStandardMaterial` with a flat colour +
emissive tint. Bertrand asked directly whether this is "a real 3D asset with a
texture" — it is not: no UV-mapped texture, no normal/roughness map, just a
coloured primitive. He requested a real generated model via Pollinations' 3D API
(`gen.pollinations.ai/3d`, `docs#tag/3d`).

Two constraints shape the decision:

1. **The 3D endpoint requires an API key with no anonymous tier** (401
   `UNAUTHORIZED` verified directly against the live endpoint), unlike the `flux`
   2D endpoint the rest of the asset pipeline uses, which is free anonymously and
   only optionally boosted by `POLLINATIONS_TOKEN`. Generation is therefore
   CI-only, same as every other `gen-*` pipeline, but the token is now _required_,
   not optional.
2. **No GLTF loader existed in the codebase.** Rather than adding `@react-three/
drei` as a new dependency, `three` (already a dependency, pinned `^0.175.0`)
   ships `GLTFLoader` under `three/examples/jsm/loaders/GLTFLoader.js` — verified
   importable directly. Using it avoids a new dependency for a single loader call,
   consistent with how `TextureLoader` (also from bare `three`) is already used
   directly in `enemyTextures.ts`/`nearForegroundTextures.ts`.

## Decision

1. **Generated-with-procedural-fallback (ADR-0049 idiom, applied to geometry
   instead of a texture).** `BulletSprite.tsx` keeps its code-drawn cylinder+cap
   mesh mounted permanently as the guaranteed fallback. A new module,
   `src/render/scene/bulletModel.ts`, async-loads `public/assets/models/bullet.glb` via
   `GLTFLoader` (singleton pending/failed/loaded guards — at most one load ever
   issued) and exposes the parsed root `Group` once ready. Each of `BulletSprite`'s
   20 bullet slots checks once per frame whether it has already swapped; the first
   frame a model is available it clones the shared `Group`, adds it as a plain
   child of the slot's existing transform group (inheriting the same per-frame
   position/orientation/scale, no separate transform logic), and hides its
   procedural sibling group. A missing/404 GLB (not yet generated in CI) leaves
   every slot on the procedural mesh forever — the render path is exercised on
   every build until the asset lands.
2. **No new runtime dependency.** `bulletModel.ts` imports `GLTFLoader` from
   `three/examples/jsm/loaders/GLTFLoader.js` (part of the already-installed
   `three` package), not `@react-three/drei`.
3. **Generation lane, CI-only.** `scripts/lib/pollinations.mjs` gains `gen3dUrl`
   (a third URL builder alongside `fluxUrl`/`kontextUrl`, different host —
   `gen.pollinations.ai` vs `image.pollinations.ai` — reusing the same
   `authHeaders`/`fetchImage`/`fetchWithRetry` helpers, which are already
   content-agnostic Buffer fetchers). `scripts/gen-bullet-3d.mjs` is a single-asset
   generator (prompt/seed as local constants, not a new `levelArt.json` block —
   there is no per-type family or shared style block to justify one for a single
   file) using the `hyper3d-rodin` model (the only listed model accepting a bare
   text prompt; `trellis-2-*` are image-to-3D and require a reference image).
   `.github/workflows/gen-bullet-3d.yml` follows the `gen-loot-sprites.yml`
   template exactly: dispatch-marker pattern (ADR-0009), `POLLINATIONS_TOKEN`
   required (not optional, per constraint 1), commit-and-push-with-retry, upload
   the GLB as an artifact if the push fails so a paid generation is never lost.
4. **Asset-manifest wiring.** `assetManifest.ts` gains `bulletModelPath()` →
   `"assets/models/bullet.glb"`, included in every level's `manifestFor` list.
   `warmAssets.ts` routes any `models/` path to `warmBulletModel`. Warming only
   kicks off the async load — it never blocks the loading gate, since
   `BulletSprite` already renders instantly via the procedural fallback.
5. **Aim jitter, so directional fire stays fair.** `aimBulletVelocity` points a
   bullet exactly at the camera-centred player-hit disc, which would make every
   enemy shot a guaranteed hit whenever the player holds still. A new pure
   module, `src/game/systems/enemyFireSystem.ts`, offsets the aim point by a
   uniform sample inside a disc of `AIM_JITTER_RADIUS` (1.2 world units, roughly
   the diameter of the hit disc) so a fair fraction of shots graze or miss. The
   sample uses inverse-CDF on the radius (√u) to avoid centre clumping, and the
   RNG is a splitmix32 seeded from `(bulletId, enemyId)` — deterministic under
   Vitest, independent of frame timing, and decorrelated between two windows
   firing on the same tick. No `Math.random` in the pure layer.
6. **Player-hit render channel.** `stateMachine` emits a transient
   `playerHitEvents: PlayerHitEvent[]` (the world point at which an enemy bullet
   crossed the hit disc) alongside the existing `impactEvents` — the mirror of
   the player→enemy channel, in the enemy→player direction. It is cosmetic-only:
   the `lives` rule is unchanged. `useGameLoop` drains it onto a
   `PlayerHitChannel` (same queue + `resetNonce` contract as `ImpactChannel`),
   and `PlayerHitEffects.tsx` turns it into a full-screen red flash plus a
   decaying camera shake. The shake is suppressed under `reducedMotion`; the
   flash stays, since it is a colour cue rather than a motion cue.

## Consequences

- The bullet keeps rendering correctly (coloured primitive, trajectory-oriented)
  on every branch/PR that hasn't run the generation workflow — no regression risk,
  no blocked merge waiting on a paid external call.
- `MODEL_SCALE` in `BulletSprite.tsx` was a placeholder (`1`) until the real GLB
  landed — a registration/tuning ritual identical to the vehicle `facing` /
  enemy `muzzle` anchors (ADR-0049 consequences). The first CI generation run
  produced a model whose tall axis is local +Y (same as `FORWARD`, so no extra
  rotation offset was needed) with an unscaled bounding box of
  ~0.517 × 1.888 × 0.518; `model-viewer.html`
  (`yarn dev` → `/model-viewer.html`, or `yarn build:model-viewer`) — a standalone
  dev-only Vite page that reuses `bulletModel.ts` to load the same GLB, shows the
  identical procedural fallback while missing, and reports the loaded model's
  bounding-box size — was used to read that size and calibrate `MODEL_SCALE` to
  `0.19` (`0.36` fallback height ÷ `1.888`).
- The 3D generation is a metered, keyed API call (unlike the free-tier `flux`
  pipeline) — it must only ever run in CI with the repo secret, never dispatched
  ad hoc from an agent sandbox.
- Two sources of truth for the bullet's look (procedural mesh + generated GLB)
  persist until the asset is generated and tuned — acceptable, same trade-off
  ADR-0049 already accepted for the near-foreground props.
