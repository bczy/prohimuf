import { useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import type { GameState } from "@game/types/gameState";

const MAX_BULLETS = 20;

// ADR-0064 D3 — enemy bullet is a 3D projectile: a small cylinder body with a
// sphere cap, both lit + emissive so they read against the fanzine B&W facade.
// The group's quaternion is set per frame from the bullet's velocity so the
// body always points along its flight vector, and the group's uniform scale
// grows as the bullet closes on the player (primary "coming at us" cue).

const BODY_LENGTH = 0.28;
const BODY_RADIUS = 0.06;
const CAP_RADIUS = 0.08;

// Copper brass + warm emissive glow. Colours are close to the muzzle-flash
// palette already used on enemy sprites — a hot round on approach.
const BULLET_COLOR = "#c07a3a";
const BULLET_EMISSIVE = "#ff5522";
const BULLET_EMISSIVE_INTENSITY = 0.7;

// Scale-by-distance: closer = bigger (immersion cue). At the player (dist ≈ 0)
// the bullet reads big enough to be unmissable; at spawn (dist ≈ 6-8 world
// units) it stays visible without dominating the frame.
const SCALE_BASE = 0.8;
const SCALE_K = 0.35;
const SCALE_MIN = 0.8;
const SCALE_MAX = 2.4;

// The cylinderGeometry's principal axis in Three is +Y; we want the body to
// point along the flight direction. `FORWARD` is the local axis we rotate FROM;
// per-frame we compute the quaternion mapping FORWARD → velocity.
const FORWARD = new Vector3(0, 1, 0);

interface Props {
  stateRef: React.RefObject<GameState>;
}

// Renders enemy return fire only. Player shots are instant hitscan (ADR-0040)
// and never enter state.bullets, so every bullet here is an enemy projectile.
export function BulletSprite({ stateRef }: Props): JSX.Element {
  const groupRefs = useRef<(Group | null)[]>(Array.from({ length: MAX_BULLETS }, () => null));
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

      // Orient body along velocity. Bullet lives in the 2D game plane, so the
      // velocity is (vx, vy, 0); the mesh rotates around Z only. `setFromUnitVectors`
      // handles the zero-velocity degenerate case gracefully (identity quaternion).
      const vx = bullet.velocity.x;
      const vy = bullet.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0) {
        scratch.dir.set(vx / speed, vy / speed, 0);
        scratch.quat.setFromUnitVectors(FORWARD, scratch.dir);
        group.quaternion.copy(scratch.quat);
      }

      // Scale by distance to player (player is conceptually at origin — see
      // PLAYER_HIT_RADIUS in stateMachine). Closer bullet ⇒ bigger.
      const dist = Math.sqrt(
        bullet.position.x * bullet.position.x + bullet.position.y * bullet.position.y,
      );
      // Nearer bullet (dist small) ⇒ larger scale. Linear ramp clamped to a fair band.
      const raw = SCALE_BASE + SCALE_K * (8 - dist);
      const s = raw < SCALE_MIN ? SCALE_MIN : raw > SCALE_MAX ? SCALE_MAX : raw;
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
              color={BULLET_COLOR}
              emissive={BULLET_EMISSIVE}
              emissiveIntensity={BULLET_EMISSIVE_INTENSITY}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Cap — sphere at the leading (velocity-forward) end. */}
          <mesh position={[0, BODY_LENGTH / 2, 0]}>
            <sphereGeometry args={[CAP_RADIUS, 12, 8]} />
            <meshStandardMaterial
              color={BULLET_COLOR}
              emissive={BULLET_EMISSIVE}
              emissiveIntensity={BULLET_EMISSIVE_INTENSITY}
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
