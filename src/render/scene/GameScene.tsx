import type { JSX } from "react";
import { useGameLoop } from "@hooks/useGameLoop";
import { FACADE_01 } from "@game/maps/facade01";
import type { HudData } from "@render/ui/HUD";
import { FacadeBackground } from "./FacadeBackground";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { BulletSprite } from "./BulletSprite";

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function GameScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useGameLoop(FACADE_01, canvasRef, onHudUpdate);

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
      <CrosshairSprite stateRef={stateRef} />
    </>
  );
}
