import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameLoop } from "@hooks/useGameLoop";
import { FACADE_01 } from "@game/maps/facade01";
import type { HudData } from "@render/ui/HUD";
import { FacadeBackground } from "./FacadeBackground";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";
import { useMouse } from "@hooks/useMouse";

// Facade total width in world units: 20 cols × 2 units = 40
// Viewport shows ~18 units → scroll range = 40 - 18 = 22
const FACADE_WORLD_WIDTH = FACADE_01.width * 2;
export const VIEW_WIDTH = 18;
const SCROLL_RANGE = FACADE_WORLD_WIDTH - VIEW_WIDTH;
const SCROLL_MIN = -(SCROLL_RANGE / 2);
const SCROLL_MAX = SCROLL_RANGE / 2;

// Edge scroll: trigger zone is 15% of screen width on each side
const EDGE_ZONE = 0.15;
// Scroll speed in world units per second
const SCROLL_SPEED = 8;

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function GameScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useGameLoop(FACADE_01, canvasRef, onHudUpdate);
  const mouseRef = useMouse(canvasRef);
  const { camera } = useThree();

  useFrame((_state, delta) => {
    const mouseX = mouseRef.current.x;
    let scrollDir = 0;
    if (mouseX < EDGE_ZONE) scrollDir = -1;
    else if (mouseX > 1 - EDGE_ZONE) scrollDir = 1;

    if (scrollDir !== 0) {
      camera.position.x = Math.max(
        SCROLL_MIN,
        Math.min(SCROLL_MAX, camera.position.x + scrollDir * SCROLL_SPEED * delta),
      );
    }
  });

  return (
    <>
      <FacadeBackground map={FACADE_01} />
      {FACADE_01.slots.map((slot) => (
        <EnemySprite
          key={`${String(slot.col)}-${String(slot.row)}`}
          stateRef={stateRef}
          slotIndex={slot.col + slot.row * FACADE_01.width}
          screenPosition={slot.screenPosition}
        />
      ))}
      <BulletSprite stateRef={stateRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} />
    </>
  );
}
