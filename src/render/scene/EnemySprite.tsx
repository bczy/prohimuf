import { useRef, useEffect } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";

interface Props {
  stateRef: React.RefObject<GameState>;
  slotIndex: number;
  screenPosition: Vec2;
}

export function EnemySprite({ stateRef, slotIndex, screenPosition }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const idleTextureRef = useRef<Texture | null>(null);
  const shootTextureRef = useRef<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}assets/enemy_sprite.png`,
      (t) => {
        idleTextureRef.current = t;
      },
      undefined,
      () => undefined,
    );
    loader.load(
      `${import.meta.env.BASE_URL}assets/enemy_shooting.png`,
      (t) => {
        shootTextureRef.current = t;
      },
      undefined,
      () => undefined,
    );
  }, []);

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
    const tex = enemy.state === "SHOOTING" ? shootTextureRef.current : idleTextureRef.current;
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
  });

  return (
    <mesh ref={meshRef} position={[screenPosition.x, screenPosition.y, 0]} visible={false}>
      <planeGeometry args={[0.9, 0.65]} />
      <meshBasicMaterial color="#ff3030" transparent />
    </mesh>
  );
}
