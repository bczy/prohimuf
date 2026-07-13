import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import type { GameState } from "@game/types/gameState";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { getEnemyTexture } from "./enemyTextures";
import {
  courierArtReady,
  courierAnimFps,
  courierFrameCount,
  courierLayer,
  getCourierTexture,
} from "./courierTextures";
import { flipbookFrame } from "./flipbook";

// Couriers never overlap by much; a small reusable pool is plenty.
const MAX_COURIERS = 4;
// World height of the cyclist sprite (bike + rider); square flipbook cells.
const COURIER_H = 2.6;
// Depth of the two composite layers: bike under rider, rider still under the
// DeliveryVehicle sprite (VEHICLE_Z = 0.72 in DeliveryVehicleSprite.tsx).
const BIKE_Z = 0.7;
const RIDER_Z = 0.701;

interface Props {
  stateRef: React.RefObject<GameState>;
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
 * Renders the street couriers (livreurs) as a two-plane composite: a BIKE plane
 * (wheel-rotation flipbook, z 0.70) under a RIDER plane (pedalling flipbook,
 * z 0.701), both flipped to face travel direction. Driven each frame from the
 * game state's `couriers` (world positions), like BulletSprite's pool.
 *
 * Until BOTH layers' frame-1 art exists (generated later in CI), the composite
 * falls back to the legacy single civilian sprite on the bike plane so the game
 * is visually unchanged from before this feature.
 */
export function CourierSprite({ stateRef }: Props): JSX.Element {
  const bikeRefs = useRef<(Mesh | null)[]>(Array.from({ length: MAX_COURIERS }, () => null));
  const riderRefs = useRef<(Mesh | null)[]>(Array.from({ length: MAX_COURIERS }, () => null));
  // Shared flipbook clock, accumulated from frame deltas.
  const clock = useRef(0);

  useFrame((_, delta) => {
    clock.current += delta;
    const couriers = stateRef.current.couriers;
    const ready = courierArtReady();

    for (let i = 0; i < MAX_COURIERS; i++) {
      const bike = bikeRefs.current[i] ?? null;
      const rider = riderRefs.current[i] ?? null;
      if (bike === null || rider === null) continue;

      const courier = couriers[i];
      if (courier === undefined) {
        bike.visible = false;
        rider.visible = false;
        continue;
      }

      if (!ready) {
        // Pre-art: reproduce the legacy single civilian sprite exactly — the
        // bike plane carries the whole figure, the rider plane stays hidden.
        bike.visible = true;
        rider.visible = false;
        bike.position.set(courier.x, courier.y, BIKE_Z);
        bike.scale.set(courier.dir * ARCHETYPES.civilian.aspect, 1, 1);
        setMap(bike, getEnemyTexture("civilian", 1, false));
        // Civilian tint = gameplay "don't shoot" colour-code.
        (bike.material as MeshBasicMaterial).color.set(ARCHETYPES.civilian.tint);
        continue;
      }

      bike.visible = true;
      rider.visible = true;
      // id-derived phase (0.29 is a small irrational-ish offset) so couriers on
      // screen at once don't pedal/roll in lockstep; both layers of one courier
      // share this phase so wheels and legs stay in sync.
      const phase = courier.id * 0.29;
      updateLayer(bike, "bike", courier, phase, clock.current, BIKE_Z);
      updateLayer(rider, "rider", courier, phase, clock.current, RIDER_Z);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_COURIERS }, (_, i) => (
        <group key={i}>
          <mesh
            ref={(el) => {
              bikeRefs.current[i] = el;
            }}
            renderOrder={6}
            visible={false}
          >
            <planeGeometry args={[COURIER_H, COURIER_H]} />
            <meshBasicMaterial transparent depthWrite={false} />
          </mesh>
          <mesh
            ref={(el) => {
              riderRefs.current[i] = el;
            }}
            renderOrder={6}
            visible={false}
          >
            <planeGeometry args={[COURIER_H, COURIER_H]} />
            <meshBasicMaterial transparent depthWrite={false} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Position/scale/texture one composite layer for a courier. `entry.scale` and
// `entry.offsetY` are render-side registration knobs (world units) tuned at the
// art gate; square cells mean the plane aspect is 1.
function updateLayer(
  mesh: Mesh,
  layer: "bike" | "rider",
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
  mesh.position.set(courier.x, courier.y + entry.offsetY, z);
  mesh.scale.set(courier.dir * entry.scale, entry.scale, 1);
  setMap(mesh, getCourierTexture(layer, frame));
  // Civilian tint on BOTH layers = gameplay "don't shoot" colour-code.
  (mesh.material as MeshBasicMaterial).color.set(ARCHETYPES.civilian.tint);
}
