import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import { tileMapToFacade } from "@game/systems/tileMapSystem";
import { RUE_BELLIARD, BUILDING_GAP, STREET_HEIGHT } from "@game/maps/rue_belliard";
import type { HudData } from "@render/ui/HUD";
import { TiledFacade } from "./TiledFacade";
import { StreetBackground } from "./StreetBackground";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";
import { useMouse } from "@hooks/useMouse";

// Build per-building facades and compute their world x offsets
// Buildings are placed left-to-right, bottom-aligned to a common ground line
const buildingLayouts = (() => {
  const layouts: { offsetX: number; facade: ReturnType<typeof tileMapToFacade> }[] = [];
  let cursorX = 0;
  for (const map of RUE_BELLIARD) {
    const buildingW = map.cols * map.tileW;
    // Centre each building around its midpoint
    const centerX = cursorX + buildingW / 2;
    layouts.push({
      offsetX: centerX,
      facade: tileMapToFacade(map, centerX, STREET_HEIGHT),
    });
    cursorX += buildingW + BUILDING_GAP;
  }
  // Re-centre the entire street around x=0
  const totalW = cursorX - BUILDING_GAP;
  const streetCenterX = totalW / 2;
  return layouts.map((l) => ({
    offsetX: l.offsetX - streetCenterX,
    facade: {
      ...l.facade,
      slots: l.facade.slots.map((s) => ({
        ...s,
        screenPosition: {
          x: s.screenPosition.x - streetCenterX,
          y: s.screenPosition.y,
        },
      })),
    },
  }));
})();

// Merge all slots into one FacadeMap for the game loop (slot indices are contiguous)
const MERGED_FACADE = (() => {
  const allSlots = buildingLayouts.flatMap((l) => l.facade.slots);
  const maxCols = Math.max(...RUE_BELLIARD.map((m) => m.cols));
  return {
    width: maxCols,
    height: STREET_HEIGHT,
    slots: allSlots,
  };
})();

const FACADE_W = (() => {
  let w = 0;
  for (const map of RUE_BELLIARD) w += map.cols * map.tileW + BUILDING_GAP;
  return w;
})();

const FACADE_H = STREET_HEIGHT;

// Edge zones and speed
const EDGE_ZONE = 0.12;
const SCROLL_SPEED = 6;

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function GameScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useGameLoop(MERGED_FACADE, canvasRef, onHudUpdate);
  const mouseRef = useMouse(canvasRef);
  const { camera, size } = useThree();

  useFrame((_state, delta) => {
    const { x: mouseX, y: mouseY } = mouseRef.current;
    const ortho = camera as OrthographicCamera;

    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;

    const hScrollMin = -(FACADE_W - viewW) / 2;
    const hScrollMax = (FACADE_W - viewW) / 2;
    // Include 4 units of road below buildings in the scrollable zone
    const ROAD_EXTRA = 4;
    const totalSceneH = FACADE_H + ROAD_EXTRA;
    const vScrollMin = -(totalSceneH - viewH) / 2 - ROAD_EXTRA / 2;
    const vScrollMax = (totalSceneH - viewH) / 2 + ROAD_EXTRA / 2;

    let scrollX = 0;
    if (mouseX < EDGE_ZONE) scrollX = -1;
    else if (mouseX > 1 - EDGE_ZONE) scrollX = 1;

    if (scrollX !== 0) {
      camera.position.x = Math.max(
        hScrollMin,
        Math.min(hScrollMax, camera.position.x + scrollX * SCROLL_SPEED * delta),
      );
    }

    let scrollY = 0;
    if (mouseY < EDGE_ZONE) scrollY = 1;
    else if (mouseY > 1 - EDGE_ZONE) scrollY = -1;

    if (scrollY !== 0) {
      camera.position.y = Math.max(
        vScrollMin,
        Math.min(vScrollMax, camera.position.y + scrollY * SCROLL_SPEED * delta),
      );
    }
  });

  return (
    <>
      <StreetBackground width={FACADE_W} height={STREET_HEIGHT * 2} groundY={-FACADE_H / 2} />
      {buildingLayouts.map((layout, i) => {
        const map = RUE_BELLIARD[i];
        if (map === undefined) return null;
        return (
          <TiledFacade
            key={i}
            map={map}
            worldOffsetX={layout.offsetX}
            streetHeight={STREET_HEIGHT}
          />
        );
      })}
      {MERGED_FACADE.slots.map((slot, idx) => (
        <EnemySprite
          key={`slot-${String(idx)}`}
          stateRef={stateRef}
          slotIndex={idx}
          screenPosition={slot.screenPosition}
        />
      ))}
      <BulletSprite stateRef={stateRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} />
    </>
  );
}
