import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader, AdditiveBlending } from "three";
import type { Texture, CanvasTexture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { DeliveryPhase, VehicleType } from "@game/types/delivery";
import { applyPixelFilter } from "./pixelArt";
import { buildNeonSilhouette, getVehicleNeonHex } from "./vehicleNeon";
import type { HudDelivery } from "@render/ui/HUD";

// World height of the vehicle sprite; width follows the fixed side-on aspect.
const VEHICLE_H = 2.4;
const VEHICLE_ASPECT = 2.0;
// Sits on the courier street lane, just in front of the couriers (z 0.7).
const VEHICLE_Z = 0.72;
// World-space rim thickness added on every side (loi du glow, ADR-0006). A fixed
// fraction of the vehicle height so the rim stays proportional at any zoom.
const NEON_RIM_MARGIN = 0.06 * VEHICLE_H; // tune at review

// Lazily-loaded, cached vehicle textures keyed by type. Only ever one vehicle on
// screen, but the archetype changes per level, so cache all three by path.
const loader = new TextureLoader();
const cache = new Map<VehicleType, Texture>();
const requested = new Set<VehicleType>();
// Neon rim silhouettes baked in the load callback, keyed like the texture cache.
const silhouetteCache = new Map<VehicleType, CanvasTexture>();

function getVehicleTexture(type: VehicleType): Texture | null {
  const cached = cache.get(type);
  if (cached !== undefined) return cached;
  if (!requested.has(type)) {
    requested.add(type);
    loader.load(
      `${import.meta.env.BASE_URL}assets/vehicles/${type}.png`,
      (t) => {
        cache.set(type, applyPixelFilter(t));
        // Bake the neon rim silhouette from the same loaded image (ADR-0006).
        const source: unknown = t.image;
        if (source instanceof HTMLImageElement) {
          silhouetteCache.set(type, buildNeonSilhouette(source, getVehicleNeonHex(type)));
        }
      },
      undefined,
      () => undefined,
    );
  }
  return null;
}

function getVehicleSilhouette(type: VehicleType): CanvasTexture | null {
  return silhouetteCache.get(type) ?? null;
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /**
   * Surfaces delivery HUD state (phase + integrity) to the DOM HUD. Fired only
   * when the phase or the rounded integrity actually changes — never per frame.
   */
  onHudChange?: ((delivery: HudDelivery) => void) | undefined;
}

/**
 * The delivery vehicle rolling on the street lane (core loop `Livrer`). Pooled
 * single mesh driven each frame from `GameState.deliveryVehicle` (world space,
 * same axes as bullets / crosshair), mirroring `CourierSprite`'s pattern — no
 * per-frame React re-render. Visible only while the vehicle is on stage
 * (`phase !== "IDLE" && phase !== "GONE"`); flipped to face its travel direction.
 */
export function DeliveryVehicleSprite({ stateRef, onHudChange }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const rimRef = useRef<Mesh>(null);
  const facingRef = useRef<1 | -1>(1);
  const lastPhaseRef = useRef<DeliveryPhase | null>(null);
  const lastIntegrityRef = useRef<number>(-1);

  useFrame(() => {
    const mesh = meshRef.current;
    const rim = rimRef.current;
    if (mesh === null) return;

    const vehicle = stateRef.current.deliveryVehicle;
    if (vehicle === null) {
      mesh.visible = false;
      if (rim !== null) rim.visible = false;
      return;
    }

    // Surface phase / integrity to the HUD only when they change (bounded), so
    // the DOM HUD gauge updates without a per-frame React re-render.
    const roundedIntegrity = Math.round(vehicle.integrity);
    if (vehicle.phase !== lastPhaseRef.current || roundedIntegrity !== lastIntegrityRef.current) {
      lastPhaseRef.current = vehicle.phase;
      lastIntegrityRef.current = roundedIntegrity;
      onHudChange?.({
        phase: vehicle.phase,
        integrity: vehicle.integrity,
        integrityMax: vehicle.integrityMax,
      });
    }

    const onStage = vehicle.phase !== "IDLE" && vehicle.phase !== "GONE";
    mesh.visible = onStage;
    if (!onStage) {
      if (rim !== null) rim.visible = false;
      return;
    }

    // Face the way the vehicle is travelling: infer from horizontal movement,
    // holding the last facing while it is parked to deliver.
    const prevX = mesh.position.x;
    const dx = vehicle.position.x - prevX;
    if (dx > 1e-4) facingRef.current = 1;
    else if (dx < -1e-4) facingRef.current = -1;

    mesh.position.set(vehicle.position.x, vehicle.position.y, VEHICLE_Z);
    mesh.scale.set(facingRef.current * VEHICLE_ASPECT * VEHICLE_H, VEHICLE_H, 1);

    const tex = getVehicleTexture(vehicle.vehicleType);
    const mat = mesh.material as MeshBasicMaterial;
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    // Neon rim (loi du glow, ADR-0006): a scaled additive silhouette drawn
    // behind the sprite. World-unit margin added per-axis so the rim thickness
    // is uniform on all four sides despite the 2:1 aspect. Baked async, so it
    // only shows once its silhouette is ready.
    if (rim !== null) {
      const silhouette = getVehicleSilhouette(vehicle.vehicleType);
      rim.visible = onStage && silhouette !== null;
      if (silhouette !== null) {
        const rimMat = rim.material as MeshBasicMaterial;
        if (rimMat.map !== silhouette) {
          rimMat.map = silhouette;
          rimMat.needsUpdate = true;
        }
        const worldW = VEHICLE_ASPECT * VEHICLE_H;
        const worldH = VEHICLE_H;
        rim.position.set(vehicle.position.x, vehicle.position.y, VEHICLE_Z - 0.01);
        rim.scale.set(
          facingRef.current * (worldW + 2 * NEON_RIM_MARGIN),
          worldH + 2 * NEON_RIM_MARGIN,
          1,
        );
      }
    }
  });

  return (
    <>
      <mesh ref={rimRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} blending={AdditiveBlending} />
      </mesh>
      <mesh ref={meshRef} renderOrder={7} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
