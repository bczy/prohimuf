import { Howl, Howler } from "howler";

export interface AudioSystem {
  playBgm(): void;
  stopBgm(): void;
  setTension(level: number): void;
  playSfx(name: "shoot" | "hit" | "death" | "win"): void;
  dispose(): void;
}

export function createAudioSystem(): AudioSystem {
  const bgm = new Howl({
    src: ["/assets/audio/bgm_loop.mp3"],
    loop: true,
    volume: 0.4,
  });

  const sfxCache: Partial<Record<string, Howl>> = {};

  function getSfx(name: string): Howl {
    sfxCache[name] ??= new Howl({
      src: [`/assets/audio/${name}.mp3`],
      volume: 0.7,
    });
    return sfxCache[name];
  }

  return {
    playBgm(): void {
      if (!bgm.playing()) {
        bgm.play();
      }
    },

    stopBgm(): void {
      bgm.stop();
    },

    setTension(level: number): void {
      const clamped = Math.min(1, Math.max(0, level));
      const rate = 0.9 + clamped * 0.3;
      const volume = 0.4 + clamped * 0.4;
      bgm.rate(rate);
      bgm.volume(volume);
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
