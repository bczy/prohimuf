import { useRef } from "react";
import type { JSX } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";

interface Props {
  stateRef: React.RefObject<GameState>;
  slotIndex: number;
  screenPosition: Vec2;
}

export function EnemySprite({ stateRef, slotIndex, screenPosition }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const idleTexture = useLoader(TextureLoader, "/assets/enemy_sprite.png");
  const shootTexture = useLoader(TextureLoader, "/assets/enemy_shooting.png");

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const enemy = stateRef.current.enemies.find((e) => e.slotIndex === slotIndex);
    if (enemy === undefined || enemy.state === "HIDDEN" || enemy.state === "DEAD") {
      mesh.visible = false;
      return;
    }
    mesh.visible = true;
    const mat = mesh.material as MeshBasicMaterial;
    mat.map = enemy.state === "SHOOTING" ? shootTexture : idleTexture;
    mat.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[screenPosition.x, screenPosition.y, 0]} visible={false}>
      <planeGeometry args={[0.9, 0.65]} />
      <meshBasicMaterial map={idleTexture} transparent />
    </mesh>
  );
}
