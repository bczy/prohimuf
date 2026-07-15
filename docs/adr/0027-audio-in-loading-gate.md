# 0027 — Audio in the level loading gate

- **Status:** Accepted
- **Date:** 2026-07-15

## Context

ADR-0022 D6 put audio out of scope for the loading gate v1, noting a future
Howler-warmed group. The loading progress bar therefore counted only images, so
sound (music + SFX) was fetched lazily during play. We now want BGM + SFX warmed
for **level** loaders (menu/tutorial unchanged), so the bar reflects the real
"time to playable".

## Decision

- `assetManifest.ts` gains `audioAssetPaths()` — base-relative strings mirroring
  `audioSystem.ts`, no Howler / `import.meta` import, so the module stays pure — and
  includes them only in the per-level manifest (not `menu`/`tutorial`).
- Only the **committed** audio is listed: the 3 BGM tiers (`bgm_loop`,
  `bgm_tension`, `bgm_danger`) + `shoot.wav`. `audioSystem.ts` also references
  `hit`/`death`/`win` SFX whose `.mp3` files are **not committed** (a pre-existing
  gap — they 404 at play time too); they are excluded so the loader never fetches a
  404 (which would trip the e2e same-origin guard). Add them here once the files land.
- `warmAssets.ts` routes `assets/audio/*` through a `new Howl({preload:true})`
  warmer that settles on load **and** error, with a 10 s timeout fallback so a
  no-audio-device / headless browser can never stall the gate. No `play()`.
- The manifest test's `ASSET_RE` widens to allow `mp3|wav`.

## Consequences

- Level loading bars reflect audio; menu/tutorial are byte-unchanged.
- No autoplay risk (preload only); a failed/blocked audio load counts as settled.
- Realizes ADR-0022's stated extension behind the same hook — ADR-0022 D6 is
  superseded on this point.
- Surfaces (but does not fix) the missing `hit`/`death`/`win` SFX files — a separate
  asset-generation task.
