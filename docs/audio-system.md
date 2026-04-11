# Audio System — muf

## Overview

Audio is handled by `src/game/systems/audioSystem.ts` via **Howler.js**. The system is created once and wired into React via the `useAudio` hook.

---

## AudioSystem Interface

```ts
interface AudioSystem {
  playBgm(): void; // Start background music (tier 0 — calm)
  stopBgm(): void; // Fade out all BGM tracks
  setTension(level: number): void; // 0.0–1.0 → crossfade between tiers
  playSfx(name: "shoot" | "hit" | "death" | "win"): void;
  dispose(): void; // Howler.stop() + unload()
}
```

---

## BGM Tension System

Three parallel BGM tracks, each looping at volume 0. `setTension` crossfades between them:

| Tier | File              | Tension range      |
| ---- | ----------------- | ------------------ |
| 0    | `bgm_loop.mp3`    | 0.0 – 0.4 (calm)   |
| 1    | `bgm_tension.mp3` | 0.4 – 0.7 (tense)  |
| 2    | `bgm_danger.mp3`  | 0.7 – 1.0 (danger) |

**Volume** scales with tension: `volume = 0.4 + tension × 0.35` (range 0.4–0.75)  
**Playback rate** scales with tension: `rate = 0.95 + tension × 0.1` (range 0.95–1.05)  
**Crossfade duration:** 800ms

Tension is computed from time remaining: `tension = 1 - timeRemaining / 90` and updated every frame via `useEffect` in `App.tsx`.

---

## SFX

SFX are lazy-loaded and cached on first use:

| Name    | File        | Trigger                  |
| ------- | ----------- | ------------------------ |
| `shoot` | `shoot.wav` | Player fires (shoot SFX) |
| `hit`   | `hit.mp3`   | Enemy hit                |
| `death` | `death.mp3` | Enemy killed             |
| `win`   | `win.mp3`   | Level complete           |

Files expected at `public/assets/audio/<file>`. `shoot.wav` is wired to the fire input event (Sprint 3 bugfix).

---

## React Integration (`useAudio`)

`src/hooks/useAudio.ts` creates the AudioSystem once via `useRef` and exposes stable callbacks via `useCallback`. The hook handles `dispose()` on unmount.

```ts
const { playBgm, stopBgm, setTension, playSfx } = useAudio();
```

---

## Asset Paths

All audio files use `import.meta.env.BASE_URL` prefix for Vite compatibility in sub-path deployments:

```ts
const BASE = import.meta.env.BASE_URL;
`${BASE}assets/audio/bgm_loop.mp3`;
```
