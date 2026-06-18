import type { JSX } from "react";
import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import {
  computeLevelSlots,
  FACADE_ASPECT,
  getWindowZones,
  WORLD_HEIGHT,
} from "@game/levels/levelArt";
import type { HudData } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import { LevelBackdrop } from "./LevelBackdrop";
import { ForegroundFrames } from "./ForegroundFrames";
import { ForegroundImage } from "./ForegroundImage";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";
import { useMouse } from "@hooks/useMouse";

// Edge zones and speed (mouse-at-edge scrolling when the level is larger than the view)
const EDGE_ZONE = 0.12;
const SCROLL_SPEED = 6;

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void;
  levelParams?: LevelParams;
  levelId?: string;
  paused?: boolean;
}

export function GameScene({
  onHudUpdate,
  canvasRef,
  playSfx,
  levelParams,
  levelId,
  paused,
}: Props): JSX.Element {
  // The level is an image now: size the playfield from the facade art's native
  // aspect ratio, and place enemy windows from the level's hand-authored zones.
  const facadeH = WORLD_HEIGHT;
  const facadeW = WORLD_HEIGHT * FACADE_ASPECT;

  const zones = useMemo(() => getWindowZones(levelId), [levelId]);
  const mergedFacade = useMemo(() => {
    const slots = computeLevelSlots(levelId, facadeW, facadeH);
    return { width: slots.length, height: 1, slots };
  }, [facadeW, facadeH, levelId]);

  const stateRef = useGameLoop(mergedFacade, canvasRef, onHudUpdate, playSfx, levelParams, paused);
  const mouseRef = useMouse(canvasRef);
  const { camera, size } = useThree();

  // Frame the facade to *cover* the viewport (no background bars on the sides):
  // fill the wider axis, letting the other overflow a little — that overflow is
  // scrollable via the mouse edges. Centred at the origin.
  useEffect(() => {
    const ortho = camera as OrthographicCamera;
    ortho.zoom = Math.max(size.width / facadeW, size.height / facadeH);
    ortho.position.set(0, 0, 100);
    ortho.updateProjectionMatrix();
  }, [camera, size.height, size.width, facadeW, facadeH]);

  useFrame((_state, delta) => {
    const { x: mouseX, y: mouseY } = mouseRef.current;
    const ortho = camera as OrthographicCamera;

    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;
    const rangeX = Math.max(0, (facadeW - viewW) / 2);
    const rangeY = Math.max(0, (facadeH - viewH) / 2);

    let scrollX = 0;
    if (mouseX < EDGE_ZONE) scrollX = -1;
    else if (mouseX > 1 - EDGE_ZONE) scrollX = 1;
    if (scrollX !== 0 && rangeX > 0) {
      camera.position.x = Math.max(
        -rangeX,
        Math.min(rangeX, camera.position.x + scrollX * SCROLL_SPEED * delta),
      );
    }

    let scrollY = 0;
    if (mouseY < EDGE_ZONE) scrollY = 1;
    else if (mouseY > 1 - EDGE_ZONE) scrollY = -1;
    if (scrollY !== 0 && rangeY > 0) {
      camera.position.y = Math.max(
        -rangeY,
        Math.min(rangeY, camera.position.y + scrollY * SCROLL_SPEED * delta),
      );
    }
  });

  return (
    <>
      <LevelBackdrop levelId={levelId} facadeW={facadeW} facadeH={facadeH} />
      {mergedFacade.slots.map((slot, idx) => (
        <EnemySprite
          key={`slot-${String(idx)}`}
          stateRef={stateRef}
          slotIndex={idx}
          screenPosition={slot.screenPosition}
          size={slot.size}
        />
      ))}
      <ForegroundFrames zones={zones} facadeW={facadeW} facadeH={facadeH} />
      <ForegroundImage levelId={levelId} facadeW={facadeW} facadeH={facadeH} />
      <BulletSprite stateRef={stateRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} />
    </>
  );
}
