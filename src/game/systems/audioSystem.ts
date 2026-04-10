import { Howl, Howler } from "howler";

export interface AudioSystem {
  playBgm(): void;
  stopBgm(): void;
  setTension(level: number): void;
  playSfx(name: "shoot" | "hit" | "death" | "win"): void;
  dispose(): void;
}

// Three tension tiers:
//   0.0–0.4  → calm  (bgm_loop)
//   0.4–0.7  → tense (bgm_tension)
//   0.7–1.0  → danger (bgm_danger)
const BASE = import.meta.env.BASE_URL;

const BGM_TRACKS = [
  `${BASE}assets/audio/bgm_loop.mp3`, // tier 0 — calm
  `${BASE}assets/audio/bgm_tension.mp3`, // tier 1 — tense
  `${BASE}assets/audio/bgm_danger.mp3`, // tier 2 — danger
] as const;

const TENSION_THRESHOLDS = [0.4, 0.7] as const;

function getTier(level: number): number {
  if (level >= TENSION_THRESHOLDS[1]) return 2;
  if (level >= TENSION_THRESHOLDS[0]) return 1;
  return 0;
}

export function createAudioSystem(): AudioSystem {
  const bgms = BGM_TRACKS.map(
    (src) =>
      new Howl({
        src: [src],
        loop: true,
        volume: 0,
      }),
  );

  let currentTier = -1;
  const FADE_MS = 800;

  const sfxCache: Partial<Record<string, Howl>> = {};

  function getSfx(name: string): Howl {
    sfxCache[name] ??= new Howl({
      src: [`${BASE}assets/audio/${name}.mp3`],
      volume: 0.7,
    });
    return sfxCache[name];
  }

  function crossfadeTo(tier: number, targetVolume: number): void {
    if (tier === currentTier) return;

    // Fade out current tier
    if (currentTier >= 0) {
      const prev = bgms[currentTier];
      if (prev !== undefined) {
        prev.fade(prev.volume(), 0, FADE_MS);
        setTimeout(() => {
          prev.stop();
        }, FADE_MS);
      }
    }

    // Fade in new tier
    const next = bgms[tier];
    if (next !== undefined) {
      if (!next.playing()) next.play();
      next.fade(0, targetVolume, FADE_MS);
    }

    currentTier = tier;
  }

  return {
    playBgm(): void {
      if (currentTier === -1) {
        crossfadeTo(0, 0.5);
      }
    },

    stopBgm(): void {
      bgms.forEach((h) => {
        h.fade(h.volume(), 0, FADE_MS);
      });
      setTimeout(() => {
        bgms.forEach((h) => {
          h.stop();
        });
      }, FADE_MS);
      currentTier = -1;
    },

    setTension(level: number): void {
      const clamped = Math.min(1, Math.max(0, level));
      const tier = getTier(clamped);
      // Volume scales 0.4→0.75 with tension
      const volume = 0.4 + clamped * 0.35;
      crossfadeTo(tier, volume);
      // Also adjust rate on current track for subtle feel
      const current = bgms[currentTier >= 0 ? currentTier : 0];
      if (current !== undefined) {
        current.rate(0.95 + clamped * 0.1);
      }
    },

    playSfx(name: "shoot" | "hit" | "death" | "win"): void {
      getSfx(name).play();
    },

    dispose(): void {
      Howler.stop();
      Howler.unload();
    },
  };
}
