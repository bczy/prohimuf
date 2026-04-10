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
const VIEW_WIDTH = 18;
const SCROLL_RANGE = FACADE_WORLD_WIDTH - VIEW_WIDTH;
const SCROLL_MIN = -(SCROLL_RANGE / 2);

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function GameScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useGameLoop(FACADE_01, canvasRef, onHudUpdate);
  const mouseRef = useMouse(canvasRef);
  const { camera } = useThree();

  useFrame(() => {
    // Scroll camera X based on mouse X (0→1 maps to SCROLL_MIN→SCROLL_MAX)
    const targetX = SCROLL_MIN + mouseRef.current.x * SCROLL_RANGE;
    // Smooth lerp
    camera.position.x += (targetX - camera.position.x) * 0.08;
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
