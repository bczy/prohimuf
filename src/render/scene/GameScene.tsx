import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGameLoop } from "@hooks/useGameLoop";
import { tileMapToFacade } from "@game/systems/tileMapSystem";
import { STALINGRAD_19 } from "@game/maps/stalingrad_19";
import type { HudData } from "@render/ui/HUD";
import { TiledFacade } from "./TiledFacade";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";
import { useMouse } from "@hooks/useMouse";

const ACTIVE_MAP = STALINGRAD_19;
const ACTIVE_FACADE = tileMapToFacade(ACTIVE_MAP);

// Facade total width in world units: cols × tileW
// Viewport shows ~18 units → scroll range = total - 18
const FACADE_WORLD_WIDTH = ACTIVE_MAP.cols * ACTIVE_MAP.tileW;
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
  const stateRef = useGameLoop(ACTIVE_FACADE, canvasRef, onHudUpdate);
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
      <TiledFacade map={ACTIVE_MAP} />
      {ACTIVE_FACADE.slots.map((slot) => (
        <EnemySprite
          key={`${String(slot.col)}-${String(slot.row)}`}
          stateRef={stateRef}
          slotIndex={slot.col + slot.row * ACTIVE_FACADE.width}
          screenPosition={slot.screenPosition}
        />
      ))}
      <BulletSprite stateRef={stateRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} />
    </>
  );
}
