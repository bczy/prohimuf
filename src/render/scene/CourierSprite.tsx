import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { getEnemyTexture } from "./enemyTextures";

// Couriers never overlap by much; a small reusable pool is plenty.
const MAX_COURIERS = 4;
// World height of the cyclist sprite (bike + rider).
const COURIER_H = 2.6;

interface Props {
  stateRef: React.RefObject<GameState>;
}

/**
 * Renders the street couriers (livreurs): the civilian cyclist sprite riding
 * along the road, flipped to face its travel direction. Driven each frame from
 * the game state's `couriers` (world positions), like BulletSprite's pool.
 */
export function CourierSprite({ stateRef }: Props): JSX.Element {
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: MAX_COURIERS }, () => null));
  const aspect = ARCHETYPES.civilian.aspect;

  useFrame(() => {
    const couriers = stateRef.current.couriers;
    for (let i = 0; i < MAX_COURIERS; i++) {
      const mesh = meshRefs.current[i] ?? null;
      if (mesh === null) continue;
      const courier = couriers[i];
      if (courier === undefined) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      mesh.position.set(courier.x, courier.y, 0.7);
      // Flip horizontally so the rider faces the way it's travelling.
      mesh.scale.set(courier.dir * aspect, 1, 1);

      const tex = getEnemyTexture("civilian", 1, false);
      const mat = mesh.material as MeshBasicMaterial;
      if (tex !== null && mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
      mat.color.set(ARCHETYPES.civilian.tint);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_COURIERS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          renderOrder={6}
          visible={false}
        >
          <planeGeometry args={[COURIER_H, COURIER_H]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
