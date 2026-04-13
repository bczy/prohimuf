import type { JSX } from "react";
import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import { tileMapToFacade } from "@game/systems/tileMapSystem";
import { LEVEL_LAYOUTS, DEFAULT_LAYOUT } from "@game/maps/levelMaps";
import type { HudData } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import { TiledFacade } from "./TiledFacade";
import { StreetBackground } from "./StreetBackground";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";
import { useMouse } from "@hooks/useMouse";

// Edge zones and speed
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
  const layout = (levelId !== undefined ? LEVEL_LAYOUTS[levelId] : undefined) ?? DEFAULT_LAYOUT;

  // Build per-building facades and compute their world x offsets
  const { buildingLayouts, mergedFacade, facadeW, facadeH } = useMemo(() => {
    const layouts: { offsetX: number; facade: ReturnType<typeof tileMapToFacade> }[] = [];
    let cursorX = 0;
    for (const map of layout.buildings) {
      const buildingW = map.cols * map.tileW;
      const centerX = cursorX + buildingW / 2;
      layouts.push({
        offsetX: centerX,
        facade: tileMapToFacade(map, centerX, layout.streetHeight),
      });
      cursorX += buildingW + layout.gap;
    }
    // Re-centre the entire street around x=0
    const totalW = cursorX - layout.gap;
    const streetCenterX = totalW / 2;
    const centeredLayouts = layouts.map((l) => ({
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

    const allSlots = centeredLayouts.flatMap((l) => l.facade.slots);
    const maxCols = Math.max(...layout.buildings.map((m) => m.cols));
    const merged = {
      width: maxCols,
      height: layout.streetHeight,
      slots: allSlots,
    };

    return {
      buildingLayouts: centeredLayouts,
      mergedFacade: merged,
      facadeW: totalW,
      facadeH: layout.streetHeight,
    };
  }, [layout]);

  const stateRef = useGameLoop(mergedFacade, canvasRef, onHudUpdate, playSfx, levelParams, paused);
  const mouseRef = useMouse(canvasRef);
  const { camera, size } = useThree();

  useFrame((_state, delta) => {
    const { x: mouseX, y: mouseY } = mouseRef.current;
    const ortho = camera as OrthographicCamera;

    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;

    const hScrollMin = -(facadeW - viewW) / 2;
    const hScrollMax = (facadeW - viewW) / 2;
    const ROAD_EXTRA = 4;
    const totalSceneH = facadeH + ROAD_EXTRA;
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
      <StreetBackground width={facadeW} height={facadeH * 2} groundY={-facadeH / 2} />
      {buildingLayouts.map((bl, i) => {
        const map = layout.buildings[i];
        if (map === undefined) return null;
        return (
          <TiledFacade
            key={i}
            map={map}
            worldOffsetX={bl.offsetX}
            streetHeight={layout.streetHeight}
          />
        );
      })}
      {mergedFacade.slots.map((slot, idx) => (
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
