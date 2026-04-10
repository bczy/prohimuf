import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { createTopdownInitialState, tickTopdown } from "@game/systems/topdownStateMachine";
import { useKeyboard } from "@hooks/useKeyboard";
import type { TopdownState } from "@game/types/topdownState";
import type { TopdownMap } from "@game/maps/topdown_test";
import type { TopdownHudData } from "@render/ui/HUD";

const MAX_DELTA = 0.1;

export function useTopdownLoop(
  map: TopdownMap,
  _canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onHudUpdate: (data: TopdownHudData) => void,
): React.RefObject<TopdownState> {
  const keyboardRef = useKeyboard();
  const gameStateRef = useRef<TopdownState>(createTopdownInitialState(map));

  useFrame((_state, delta) => {
    const safeDelta = Math.min(delta, MAX_DELTA);
    const prev = gameStateRef.current;

    const next = tickTopdown(prev, keyboardRef.current, safeDelta, map);
    gameStateRef.current = next;

    if (
      next.phase !== prev.phase ||
      next.delivery.cargoPickedUp !== prev.delivery.cargoPickedUp ||
      next.detectionLevel !== prev.detectionLevel
    ) {
      onHudUpdate({
        phase: next.phase,
        hasCargo: next.delivery.cargoPickedUp,
        detectionLevel: next.detectionLevel,
      });
    }
  });

  return gameStateRef;
}
