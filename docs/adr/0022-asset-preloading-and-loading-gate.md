# 0022 — Asset preloading with a progressive loading gate

- **Status:** Accepted
- **Date:** 2026-07-14

## Context

Committed sprites (enemies, courier, delivery vehicle) pop in as untextured
fallbacks/squares on the first frames of a scene because their module caches are
cold at mount; level backdrops appear after a visible network delay. There was no
point at which we could assert "this screen's art is ready." We want a loading
screen before the MENU's first render and before each level (tutorial included),
driven by a deterministic manifest, with failed loads counted so it can never hang.

Constraints: game logic must not import React/Three; rendering holds no rules; the
`?preview=` harness and the NARRATIVE_PRE→PLAYING sequencing must keep working.

## Decision

1. **Pure manifest (`src/game/systems/assetManifest.ts`).** A unit-tested module is
   the single source of truth for the base-relative asset paths a target
   (`"menu" | "tutorial" | <levelId>`) needs, and therefore the deterministic total.
   It derives from existing pure data (levels, ARCHETYPES, `levelArt.json`, narrative
   scenes). It contains no `import.meta.env` and no React/Three.
2. **Path-string derivation is pure game data.** The enemy/courier/vehicle URL
   builders move from the render sprite modules into the manifest; the render getters
   import them. Render keeps only the `BASE_URL` prefix and GPU upload/cache. This
   guarantees a warmed cache key equals the runtime getter's key (no drift).
3. **Generic bridge hook (`src/hooks/useAssetPreloader`).** Drives settled/total/done;
   a failed load resolves as settled (never rejects), so progress always reaches 100%.
4. **Render-side warmers fill the existing caches.** `warmAssets.ts` applies `BASE_URL`
   and routes each path to the module cache the runtime reads (enemy/courier/vehicle),
   or `Image().decode()` for CSS-background / `<img>` / on-mount-`TextureLoader` assets.
   No new shared texture cache.
5. **Loading gate, not a new AppPhase.** `App` renders `LoadingScreen` until the
   target manifest is 100% settled, then mounts the target. Level assets load at
   selection, before NARRATIVE_PRE. `?preview=` bypasses the gate. Already-loaded
   targets are remembered and skip instantly.
6. **Audio is out of scope for v1** — it causes no visual pop-in and Howler is already
   lazy. Future extension: an audio group warmed via Howler behind the same hook.

## Consequences

- No untextured-square pop-in for committed sprites; backdrops paint immediately.
- One deterministic, testable place defines "what a screen needs"; enemy/courier/
  vehicle URL logic gains unit coverage it never had.
- One accepted cross-layer move: render getters now import path builders from game
  (render→game, legal). Warmed keys and getter keys share one builder — no drift.
- New render→game dependency edge: `App`/getters import `assetManifest`; the parallel
  render lane's typecheck depends on the game lane's new module (a build-order note,
  not a file conflict).
- Slight first-navigation latency (bounded, deterministic manifest) traded for zero
  pop-in; failed loads never hang the gate.
