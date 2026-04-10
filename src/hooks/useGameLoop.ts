import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { createInitialState, tickGameState } from "@game/systems/stateMachine";
import { useKeyboard } from "@hooks/useKeyboard";
import { useMouse } from "@hooks/useMouse";
import type { GameState } from "@game/types/gameState";
import type { FacadeMap } from "@game/types/map";
import type { HudData } from "@render/ui/HUD";

const MAX_DELTA = 0.1;

export function useGameLoop(
  facade: FacadeMap,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onHudUpdate: (data: HudData) => void,
): React.RefObject<GameState> {
  const keyboardRef = useKeyboard();
  const mouseRef = useMouse(canvasRef);
  const gameStateRef = useRef<GameState>(createInitialState(facade));

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, MAX_DELTA);
    const prev = gameStateRef.current;
    const mouse = mouseRef.current;

    if (
      (prev.phase === "GAME_OVER" || prev.phase === "LEVEL_COMPLETE") &&
      (mouse.fire || keyboardRef.current.restart)
    ) {
      gameStateRef.current = createInitialState(facade);
      return;
    }

    const next = tickGameState(prev, mouse.fire, mouse.x, mouse.y, safeDelta, facade);
    gameStateRef.current = next;

    if (
      next.score !== prev.score ||
      next.lives !== prev.lives ||
      Math.floor(next.timeRemaining) !== Math.floor(prev.timeRemaining) ||
      next.phase !== prev.phase ||
      next.wave !== prev.wave
    ) {
      onHudUpdate({
        score: next.score,
        lives: next.lives,
        timeRemaining: next.timeRemaining,
        phase: next.phase,
        wave: next.wave,
      });
    }
  });

  return gameStateRef;
}
