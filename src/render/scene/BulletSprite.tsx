import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";

const MAX_BULLETS = 20;
const PLAYER_BULLET_COLOR = "#ffff00";
const ENEMY_BULLET_COLOR = "#ff4444";

interface Props {
  stateRef: React.RefObject<GameState>;
}

export function BulletSprite({ stateRef }: Props): JSX.Element {
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: MAX_BULLETS }, () => null));

  useFrame(() => {
    const bullets = stateRef.current.bullets;
    for (let i = 0; i < MAX_BULLETS; i++) {
      const mesh = meshRefs.current[i] ?? null;
      if (mesh === null) continue;
      const bullet = bullets[i];
      if (bullet === undefined) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.x = bullet.position.x;
      mesh.position.y = bullet.position.y;
      const mat = mesh.material as MeshBasicMaterial;
      mat.color.set(bullet.fromPlayer ? PLAYER_BULLET_COLOR : ENEMY_BULLET_COLOR);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <circleGeometry args={[0.1, 8]} />
          <meshBasicMaterial color={PLAYER_BULLET_COLOR} />
        </mesh>
      ))}
    </>
  );
}
