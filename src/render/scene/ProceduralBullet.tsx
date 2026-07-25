import type { JSX } from "react";
import {
  BULLET_BODY_LENGTH,
  BULLET_BODY_RADIUS,
  BULLET_CAP_RADIUS,
  BULLET_RENDER_ORDER,
} from "./bulletGeometry";

/**
 * The procedural bullet — a cylinder body with a sphere cap, built along the
 * local +Y axis of `bulletForwardAxis()` so a parent group's travel-direction
 * quaternion applies to it unchanged.
 *
 * It is the FALLBACK every bullet in the game falls back to while the shared GLB
 * is still loading (or if it 404s): the enemy's return fire, the player's own
 * shot and the QTE captor/accomplice round. Extracted here because those three
 * call sites were carrying byte-identical copies of this geometry — the exact
 * drift risk `bulletGeometry.ts` exists to prevent.
 *
 * Only the palette differs per shooter, so that is the only prop.
 */
export function ProceduralBullet({
  color,
  emissive,
  emissiveIntensity,
}: {
  readonly color: string;
  readonly emissive: string;
  readonly emissiveIntensity: number;
}): JSX.Element {
  return (
    <>
      {/* Body — cylinder along local +Y, centred on the group origin. */}
      <mesh renderOrder={BULLET_RENDER_ORDER}>
        <cylinderGeometry args={[BULLET_BODY_RADIUS, BULLET_BODY_RADIUS, BULLET_BODY_LENGTH, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      {/* Cap — sphere at the leading (travel-forward) end. */}
      <mesh position={[0, BULLET_BODY_LENGTH / 2, 0]} renderOrder={BULLET_RENDER_ORDER}>
        <sphereGeometry args={[BULLET_CAP_RADIUS, 12, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
    </>
  );
}
