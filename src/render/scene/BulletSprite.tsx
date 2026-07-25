import { useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import type { GameState } from "@game/types/gameState";

const MAX_BULLETS = 20;

// Renders enemy return fire only. Player shots are instant hitscan (ADR-0040)
// and never enter state.bullets, so every bullet here is an enemy projectile.
//
// The bullet is a 3D projectile — a small cylinder body with a sphere cap —
// oriented per frame from its velocity so the body always points along its
// actual flight direction (not just a flat, direction-less disc). The group's
// uniform scale still grows as the bullet closes on the camera (depth cue).

const BODY_LENGTH = 0.28;
const BODY_RADIUS = 0.06;
const CAP_RADIUS = 0.08;

const ENEMY_BULLET_COLOR = "#ff4444";
const ENEMY_BULLET_EMISSIVE = "#ff2222";
const ENEMY_BULLET_EMISSIVE_INTENSITY = 0.7;

// The cylinderGeometry's principal axis in Three is +Y; FORWARD is the local
// axis we rotate FROM — per frame we compute the quaternion mapping it onto
// the bullet's velocity direction.
const FORWARD = new Vector3(0, 1, 0);

interface Props {
  stateRef: React.RefObject<GameState>;
}

export function BulletSprite({ stateRef }: Props): JSX.Element {
  const groupRefs = useRef<(Group | null)[]>(Array.from({ length: MAX_BULLETS }, () => null));
  const camera = useThree((state) => state.camera);
  // Scratch objects allocated once — hot path runs 60fps × MAX_BULLETS.
  const scratch = useMemo(
    () => ({
      dir: new Vector3(),
      quat: new Quaternion(),
    }),
    [],
  );

  useFrame(() => {
    const bullets = stateRef.current.bullets;
    for (let i = 0; i < MAX_BULLETS; i++) {
      const group = groupRefs.current[i] ?? null;
      if (group === null) continue;
      const bullet = bullets[i];
      if (bullet === undefined) {
        group.visible = false;
        continue;
      }
      group.visible = true;
      group.position.x = bullet.position.x;
      group.position.y = bullet.position.y;
      group.position.z = 0.5; // slightly in front so it's always visible

      // Orient body along velocity. Bullets live in the 2D game plane, so the
      // velocity is (vx, vy, 0); the mesh rotates around Z only.
      // `setFromUnitVectors` handles the zero-velocity degenerate case
      // gracefully (identity quaternion).
      const vx = bullet.velocity.x;
      const vy = bullet.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0) {
        scratch.dir.set(vx / speed, vy / speed, 0);
        scratch.quat.setFromUnitVectors(FORWARD, scratch.dir);
        group.quaternion.copy(scratch.quat);
      }

      // Scale grows as bullet travels toward camera for 3D depth feel.
      const dx = bullet.position.x - camera.position.x;
      const dy = bullet.position.y - camera.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, Math.min(1, 1 - dist / 8));
      const s = 0.6 + t * 1.4;
      group.scale.setScalar(s);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Body — cylinder along local +Y, offset so its centre is the group origin. */}
          <mesh>
            <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_LENGTH, 10]} />
            <meshStandardMaterial
              color={ENEMY_BULLET_COLOR}
              emissive={ENEMY_BULLET_EMISSIVE}
              emissiveIntensity={ENEMY_BULLET_EMISSIVE_INTENSITY}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Cap — sphere at the leading (velocity-forward) end. */}
          <mesh position={[0, BODY_LENGTH / 2, 0]}>
            <sphereGeometry args={[CAP_RADIUS, 12, 8]} />
            <meshStandardMaterial
              color={ENEMY_BULLET_COLOR}
              emissive={ENEMY_BULLET_EMISSIVE}
              emissiveIntensity={ENEMY_BULLET_EMISSIVE_INTENSITY}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
