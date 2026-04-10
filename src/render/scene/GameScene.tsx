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

const FACADE_W = ACTIVE_MAP.cols * ACTIVE_MAP.tileW;
const FACADE_H = ACTIVE_MAP.rows * ACTIVE_MAP.tileH;

// Viewport in world units (will be refined by camera zoom, but approximated here)
const VIEW_W = 18;
const VIEW_H = 10; // approx — depends on aspect ratio

// Horizontal scroll
const H_SCROLL_MIN = -(FACADE_W - VIEW_W) / 2;
const H_SCROLL_MAX = (FACADE_W - VIEW_W) / 2;

// Vertical scroll: facade origin is at y=0 (centre), so top is +FACADE_H/2, bottom is -FACADE_H/2
const V_SCROLL_MIN = -(FACADE_H - VIEW_H) / 2; // camera y min (looking down toward street)
const V_SCROLL_MAX = (FACADE_H - VIEW_H) / 2; // camera y max (looking up toward roof)

// Edge zones and speed
const EDGE_ZONE = 0.12;
const SCROLL_SPEED = 6;

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function GameScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useGameLoop(ACTIVE_FACADE, canvasRef, onHudUpdate);
  const mouseRef = useMouse(canvasRef);
  const { camera } = useThree();

  useFrame((_state, delta) => {
    const { x: mouseX, y: mouseY } = mouseRef.current;

    // Horizontal scroll (left/right edges)
    let scrollX = 0;
    if (mouseX < EDGE_ZONE) scrollX = -1;
    else if (mouseX > 1 - EDGE_ZONE) scrollX = 1;

    if (scrollX !== 0) {
      camera.position.x = Math.max(
        H_SCROLL_MIN,
        Math.min(H_SCROLL_MAX, camera.position.x + scrollX * SCROLL_SPEED * delta),
      );
    }

    // Vertical scroll (top/bottom edges)
    let scrollY = 0;
    if (mouseY < EDGE_ZONE)
      scrollY = 1; // mouse at top → scroll up (positive y)
    else if (mouseY > 1 - EDGE_ZONE) scrollY = -1; // mouse at bottom → scroll down

    if (scrollY !== 0) {
      camera.position.y = Math.max(
        V_SCROLL_MIN,
        Math.min(V_SCROLL_MAX, camera.position.y + scrollY * SCROLL_SPEED * delta),
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
