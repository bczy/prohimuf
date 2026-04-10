import { useRef, useEffect, useCallback } from "react";
import { createAudioSystem } from "@game/systems/audioSystem";
import type { AudioSystem } from "@game/systems/audioSystem";

export interface UseAudioReturn {
  playBgm: () => void;
  stopBgm: () => void;
  setTension: (level: number) => void;
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void;
}

export function useAudio(): UseAudioReturn {
  const audioRef = useRef<AudioSystem | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.dispose();
    };
  }, []);

  // Lazy-init on first call — satisfies browser autoplay policy (must be
  // triggered from a user gesture, not at component mount time)
  const playBgm = useCallback((): void => {
    audioRef.current ??= createAudioSystem();
    audioRef.current.playBgm();
  }, []);

  const stopBgm = useCallback((): void => {
    audioRef.current?.stopBgm();
  }, []);

  const setTension = useCallback((level: number): void => {
    audioRef.current?.setTension(level);
  }, []);

  const playSfx = useCallback((name: "shoot" | "hit" | "death" | "win"): void => {
    audioRef.current?.playSfx(name);
  }, []);

  return { playBgm, stopBgm, setTension, playSfx };
}
