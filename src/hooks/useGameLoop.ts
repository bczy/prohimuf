import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { createInitialState, tickGameState } from "@game/systems/stateMachine";
import type { LevelParams } from "@game/systems/stateMachine";
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
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void,
  levelParams?: LevelParams,
  paused = false,
): React.RefObject<GameState> {
  const keyboardRef = useKeyboard();
  const mouseRef = useMouse(canvasRef);
  const gameStateRef = useRef<GameState>(createInitialState(facade, levelParams));
  const { camera, size } = useThree();

  useFrame((_state, delta) => {
    if (paused) return;
    const safeDelta = Math.min(delta, MAX_DELTA);
    const prev = gameStateRef.current;
    const mouse = mouseRef.current;
    const ortho = camera as OrthographicCamera;
    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;

    const hasPendingShot = mouse.pendingShots > 0;

    if (
      (prev.phase === "GAME_OVER" || prev.phase === "LEVEL_COMPLETE") &&
      (hasPendingShot || keyboardRef.current.restart)
    ) {
      mouseRef.current.pendingShots = 0;
      gameStateRef.current = createInitialState(facade, levelParams);
      return;
    }

    const didFire = hasPendingShot;
    mouseRef.current.pendingShots = Math.max(0, mouse.pendingShots - 1);
    if (didFire) playSfx("shoot");

    const next = tickGameState(
      prev,
      didFire,
      mouse.x,
      mouse.y,
      safeDelta,
      facade,
      camera.position.x,
      viewW,
      viewH,
      levelParams?.enemiesToWin,
    );
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
