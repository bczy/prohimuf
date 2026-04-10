import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";

const COLORS: Record<string, string> = {
  APPEARING: "#884400",
  VISIBLE: "#ff3030",
  SHOOTING: "#ff8800",
  HIT: "#ffffff",
};

interface Props {
  stateRef: React.RefObject<GameState>;
  slotIndex: number;
  screenPosition: Vec2;
}

export function EnemySprite({ stateRef, slotIndex, screenPosition }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const enemy = stateRef.current.enemies.find((e) => e.slotIndex === slotIndex);
    if (enemy === undefined || enemy.state === "HIDDEN" || enemy.state === "DEAD") {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    mesh.position.x = screenPosition.x;
    mesh.position.y = screenPosition.y;
    const mat = mesh.material as MeshBasicMaterial;
    mat.color.set(COLORS[enemy.state] ?? "#ff3030");
  });

  return (
    <mesh ref={meshRef} position={[screenPosition.x, screenPosition.y, 0]} visible={false}>
      <planeGeometry args={[0.9, 0.65]} />
      <meshBasicMaterial color="#ff3030" />
    </mesh>
  );
}
