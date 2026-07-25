import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import type { GameState } from "@game/types/gameState";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { isQteActive } from "@game/systems/qteSystem";
import {
  courierArtReady,
  courierAnimFps,
  courierFrameCount,
  courierLayer,
  getCourierTexture,
} from "./courierTextures";
import { flipbookFrame } from "./flipbook";
import { wheelAngle } from "./deform";
import { STREET_DEPTH } from "./streetDepth";

// SPIKE (animation-2d-pipeline): procedural courier motion, additive over the
// baked 6-frame flipbook. Flip to false to fall back to the pure flipbook baseline
// (no regression). DOWNSCOPED from a wheel sub-region UV rotation to a whole-plane
// bob/lean — see the spike finding: the rider's wheel spin is already baked across
// its frames, and isolating the wheel would need authored per-sprite wheel-centre
// anchors + a custom circular-mask shader (and would double up with the baked
// spin). The bob keeps the motion inside a clean affine whole-plane transform,
// which is what deform.ts models; wheelAngle drives its cadence phase.
const DEFORM_BOB_ENABLED = true as boolean;
// Pedal-cadence bob: ~1 cycle per baked wheel-ish loop. Small world-unit amplitude
// and a few degrees of lean so it reads as a living cyclist, not a bouncing decal.
const BOB_CADENCE = 2; // cycles per second
const BOB_AMP = 0.04; // world-unit vertical bob
const BOB_LEAN = 0.05; // radians of body lean at the extremes

// Couriers never overlap by much; a small reusable pool is plenty.
const MAX_COURIERS = 4;
// World height of the cyclist sprite; square flipbook cells.
const COURIER_H = 2.6;
// Depth of the rider sprite: BETWEEN the two near-foreground kerb rows
// (Bertrand-directed 2026-07-25, ADR-0047 amendment 4) — behind the near row
// (renderOrder 5.75, z 0.7), in front of the far row (renderOrder 4, z 0.6) and
// still under the DeliveryVehicle sprite (VEHICLE_Z = 0.72). The near props may
// therefore partially mask a passing livreur: depth ambiance wins over total
// target legibility. The courier stays ABOVE the facade-attached ironwork
// (renderOrder 5) — that art is physically behind him. See {@link STREET_DEPTH}.
const RIDER_Z = STREET_DEPTH.courier.z;

interface Props {
  stateRef: React.RefObject<GameState>;
  /** Freezes the wheel flipbook while the game loop is paused (Escape/rotate). */
  paused?: boolean | undefined;
}

// Apply a texture to a mesh's material only when it actually changed — swapping
// map/needsUpdate every frame would re-upload the texture needlessly.
function setMap(mesh: Mesh, tex: Texture | null): void {
  const mat = mesh.material as MeshBasicMaterial;
  if (tex !== null && mat.map !== tex) {
    mat.map = tex;
    mat.needsUpdate = true;
  }
}

/**
 * Renders the street couriers (livreurs). The RIDER layer is the complete
 * cyclist sprite (FLUX base + wheel rotation stamped across its 6 frames by
 * scripts/retouch-courier-spokes.mjs); the BIKE layer was retired from the
 * composite after the art gate picked the full-cyclist sprite (its validated
 * art stays committed as spare). Driven each frame from the game state's
 * `couriers` (world positions), like BulletSprite's pool.
 *
 * The rider frames are committed and preloaded, so on the happy path
 * courierArtReady() turns true within a frame or two and the pre-ready window
 * just hides the rider. If frame 1 ever FAILS to load (bad network after the
 * loading gate settles), the failure is session-poisoned (courierTextures) and
 * couriers stay hidden while gameplay still runs them — an accepted degraded
 * mode since the legacy enemy_civilian.png fallback was retired (ADR-0029).
 */
export function CourierSprite({ stateRef, paused = false }: Props): JSX.Element {
  const riderRefs = useRef<(Mesh | null)[]>(Array.from({ length: MAX_COURIERS }, () => null));
  // Shared flipbook clock, accumulated from frame deltas.
  const clock = useRef(0);

  useFrame((_, delta) => {
    // The hostage QTE freezes couriers mid-street (stateMachine early-returns
    // while it holds the scene) rather than moving them off-stage first, so a
    // courier can freeze right in front of the zoomed-in tableau and squat the
    // frame. Hide the street layer for the cinematic's duration — it resumes
    // exactly where it froze once the QTE clears.
    const qteActive = isQteActive(stateRef.current.qte);
    // Hold the flipbook with the game loop: useGameLoop freezes couriers on
    // pause and during the QTE, and at 48 fps a still-rolling clock reads as
    // wheels spinning in place (or pops to a new frame/bob pose on resume) on
    // a frozen street.
    if (!paused && !qteActive) clock.current += delta;
    const couriers = stateRef.current.couriers;
    const ready = courierArtReady();

    for (let i = 0; i < MAX_COURIERS; i++) {
      const rider = riderRefs.current[i] ?? null;
      if (rider === null) continue;

      const courier = couriers[i];
      if (courier === undefined || !ready || qteActive) {
        // No courier here, the rider frames haven't resolved yet (a frame or two
        // at most, since they are committed + preloaded), or the hostage QTE is
        // holding the scene: hide the plane.
        rider.visible = false;
        continue;
      }

      rider.visible = true;
      // id-derived phase (0.29 is a small irrational-ish offset) so couriers on
      // screen at once don't roll in lockstep.
      const phase = courier.id * 0.29;
      updateLayer(rider, "rider", courier, phase, clock.current, RIDER_Z);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_COURIERS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            riderRefs.current[i] = el;
          }}
          renderOrder={STREET_DEPTH.courier.order}
          visible={false}
        >
          <planeGeometry args={[COURIER_H, COURIER_H]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// Position/scale/texture the rider plane for a courier. `entry.scale` and
// `entry.offsetY` are render-side registration knobs (world units) tuned at the
// art gate; square cells mean the plane aspect is 1.
function updateLayer(
  mesh: Mesh,
  layer: "rider",
  courier: GameState["couriers"][number],
  phase: number,
  clock: number,
  z: number,
): void {
  const entry = courierLayer(layer);
  if (entry === null) {
    mesh.visible = false;
    return;
  }
  const frame = flipbookFrame(clock + phase, courierFrameCount(layer), courierAnimFps());
  // Whole-plane bob/lean (downscoped spike motion). `clock` is frozen on pause by
  // the caller, so the bob freezes with the street — no extra pause plumbing. A
  // frozen clock also yields a constant angle → identity-ish rest pose.
  let bobY = 0;
  let lean = 0;
  if (DEFORM_BOB_ENABLED) {
    const angle = wheelAngle(clock + phase, BOB_CADENCE);
    const s = Math.sin(angle);
    bobY = s * BOB_AMP;
    lean = s * BOB_LEAN;
  }
  mesh.position.set(courier.x, courier.y + entry.offsetY + bobY, z);
  mesh.scale.set(courier.dir * entry.scale, entry.scale, 1);
  // Scale by dir so the lean reads the same way relative to travel: the sprite is
  // mirrored via negative scale.x, which would otherwise flip the visual tilt for
  // left-bound couriers.
  mesh.rotation.z = courier.dir * lean;
  setMap(mesh, getCourierTexture(layer, frame));
  // Civilian tint = gameplay "don't shoot" colour-code.
  (mesh.material as MeshBasicMaterial).color.set(ARCHETYPES.civilian.tint);
}
