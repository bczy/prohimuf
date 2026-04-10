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

  audioRef.current ??= createAudioSystem();

  useEffect(() => {
    const audio = audioRef.current;
    if (audio === null) return;
    return () => {
      audio.dispose();
    };
  }, []);

  const playBgm = useCallback((): void => {
    audioRef.current?.playBgm();
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
