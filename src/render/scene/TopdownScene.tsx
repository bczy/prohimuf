import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { useTopdownLoop } from "@hooks/useTopdownLoop";
import { TOPDOWN_TEST } from "@game/maps/topdown_test";
import type { TopdownHudData } from "@render/ui/HUD";
import { PlayerSprite } from "./PlayerSprite";
import { CopSprite } from "./CopSprite";
import { DeliverySprite } from "./DeliverySprite";

interface Props {
  onHudUpdate: (data: TopdownHudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function TopdownScene({ onHudUpdate, canvasRef }: Props): JSX.Element {
  const stateRef = useTopdownLoop(TOPDOWN_TEST, canvasRef, onHudUpdate);

  useFrame(({ camera }) => {
    const { x, y } = stateRef.current.player.position;
    camera.position.x = x;
    camera.position.y = y;
  });

  return (
    <>
      <PlayerSprite stateRef={stateRef} />
      {TOPDOWN_TEST.copWaypoints.map((_, i) => (
        <CopSprite key={i} stateRef={stateRef} copIndex={i} />
      ))}
      <DeliverySprite stateRef={stateRef} map={TOPDOWN_TEST} />
    </>
  );
}
