import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";
import type { GameState } from "@game/types/gameState";

const MAX_BULLETS = 20;
const ENEMY_BULLET_COLOR = "#ff4444";

interface Props {
  stateRef: React.RefObject<GameState>;
}

// Renders enemy return fire only. Player shots are instant hitscan (ADR-0040)
// and never enter state.bullets, so every bullet here is an enemy projectile.
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
      mesh.position.z = 0.5; // slightly in front so it's always visible
      // Scale grows as bullet travels toward camera for 3D depth feel
      const t = Math.max(0, 1 - bullet.position.y / 8);
      const s = 0.6 + t * 1.4;
      mesh.scale.set(s, s, s);
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
          <sphereGeometry args={[0.12, 12, 8]} />
          <meshBasicMaterial color={ENEMY_BULLET_COLOR} />
        </mesh>
      ))}
    </>
  );
}
