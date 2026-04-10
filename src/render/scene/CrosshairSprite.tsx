import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { GameState } from "@game/types/gameState";
import { crosshairToWorld } from "@game/systems/crosshairSystem";

const CROSSHAIR_COLOR = "#00ffff";
const VIEW_W = 20;
const VIEW_H = 12;

interface Props {
  stateRef: React.RefObject<GameState>;
}

export function CrosshairSprite({ stateRef }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const { crosshair } = stateRef.current;
    const world = crosshairToWorld(crosshair, VIEW_W, VIEW_H);
    mesh.position.x = world.x;
    mesh.position.y = world.y;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
      <ringGeometry args={[0.25, 0.35, 16]} />
      <meshBasicMaterial color={CROSSHAIR_COLOR} />
    </mesh>
  );
}
