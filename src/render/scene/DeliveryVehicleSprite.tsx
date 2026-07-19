import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader, AdditiveBlending } from "three";
import type { Texture, CanvasTexture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { DeliveryPhase, VehicleType } from "@game/types/delivery";
import { isQteActive } from "@game/systems/qteSystem";
import { applyPixelFilter } from "./pixelArt";
import { buildNeonSilhouette, computeHaloMarginPx, getVehicleNeonHex } from "./vehicleNeon";
import { vehicleAssetPath } from "@game/systems/assetManifest";
import type { HudDelivery } from "@render/ui/HUD";
import levelArt from "@game/levels/levelArt.json";

// World height of the vehicle sprite; width follows each type's DECLARED art
// aspect (levelArt `vehicles.types.<type>.size`) so non-2:1 art (the 256×160
// moto) is never stretched onto a fixed-ratio plane. Same direct manifest
// indexing precedent as artSign below.
const VEHICLE_H = 2.4;
function vehicleAspect(type: VehicleType): number {
  const s = levelArt.vehicles.types[type].size;
  return s.width / s.height;
}
// Sits on the courier street lane, just in front of the couriers (z 0.7).
const VEHICLE_Z = 0.72;

// The direction the committed source art faces, per vehicle type (art-gate
// registration knob in levelArt.json `vehicles.types.<type>.facing`). FLUX won't
// obey orientation prompts, so we mirror in code: art that already looks right
// needs no flip when travelling right (+1); left-facing art must be mirrored
// (-1); any other value falls back to right-facing (the prior, courier-style
// convention). Closed VehicleType union ⇒ direct manifest indexing, like
// getVehicleNeonHex (vehicleNeon.ts).
function artSign(type: VehicleType): 1 | -1 {
  return levelArt.vehicles.types[type].facing === "left" ? -1 : 1;
}

// Lazily-loaded, cached vehicle textures keyed by type. Only ever one vehicle on
// screen, but the archetype changes per level, so cache all three by path.
const loader = new TextureLoader();
const cache = new Map<VehicleType, Texture>();
// In-flight loads keyed by type, so a preload and a render request for the same
// vehicle share one load (and one silhouette bake). Doubles as the "already
// requested" guard the previous `requested` set provided.
const inflight = new Map<VehicleType, Promise<void>>();
// Types whose load 404'd/errored, so the per-frame `getVehicleTexture` never
// re-issues the request (it runs every frame while the vehicle is on stage).
// Mirrors the `failed` sets in enemyTextures.ts / courierTextures.ts.
const failed = new Set<VehicleType>();

/**
 * A baked neon rim plus the geometry needed to scale it so the padded glow
 * texture lands exactly over the sprite. `srcW`/`srcH` are the un-padded source
 * pixel dims; `marginPx` is the per-side padding the bake used. Vehicle canvases
 * are 2:1 with equal world-per-pixel, so scaling by `(1 + 2·marginPx/src)` per
 * axis reproduces the same absolute world margin on all four sides.
 */
interface NeonRim {
  texture: CanvasTexture;
  srcW: number;
  srcH: number;
  marginPx: number;
}
// Neon rims baked in the load callback, keyed like the texture cache.
const silhouetteCache = new Map<VehicleType, NeonRim>();

// Drive the texture load (and its silhouette bake) for a vehicle type exactly
// once, returning a promise that ALWAYS resolves once the load settles (success
// or 404) so the asset preloader can gate on it. Both the per-frame renderer and
// the preloader funnel through here, so the neon-rim cache warms either way.
function loadVehicle(type: VehicleType): Promise<void> {
  if (cache.has(type) || failed.has(type)) return Promise.resolve();
  const existing = inflight.get(type);
  if (existing !== undefined) return existing;
  const p = new Promise<void>((resolve) => {
    loader.load(
      `${import.meta.env.BASE_URL}${vehicleAssetPath(type)}`,
      (t) => {
        cache.set(type, applyPixelFilter(t));
        // Bake the neon rim silhouette from the same loaded image (ADR-0011).
        const source: unknown = t.image;
        if (source instanceof HTMLImageElement) {
          const srcW = source.naturalWidth;
          const srcH = source.naturalHeight;
          silhouetteCache.set(type, {
            texture: buildNeonSilhouette(source, getVehicleNeonHex(type)),
            srcW,
            srcH,
            marginPx: computeHaloMarginPx(srcW, srcH),
          });
        }
        inflight.delete(type);
        resolve();
      },
      undefined,
      () => {
        failed.add(type);
        inflight.delete(type);
        resolve();
      },
    );
  });
  inflight.set(type, p);
  return p;
}

function getVehicleTexture(type: VehicleType): Texture | null {
  const cached = cache.get(type);
  if (cached !== undefined) return cached;
  void loadVehicle(type);
  return null;
}

function getVehicleSilhouette(type: VehicleType): NeonRim | null {
  return silhouetteCache.get(type) ?? null;
}

// Preload a vehicle (texture + neon-rim silhouette) ahead of the scene mounting,
// resolving the full URL back to its VehicleType so the existing per-type caches
// warm. Unknown URLs settle immediately. ALWAYS resolves.
export function preloadVehicle(url: string): Promise<void> {
  for (const type of Object.keys(levelArt.vehicles.types) as VehicleType[]) {
    if (url.endsWith(vehicleAssetPath(type))) return loadVehicle(type);
  }
  return Promise.resolve();
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

    // The hostage QTE freezes the vehicle mid-street (stateMachine early-returns
    // while it holds the scene) rather than moving it off-stage first, so it can
    // freeze right in front of the zoomed-in tableau and squat the frame. Hide
    // the street layer for the cinematic's duration — it resumes exactly where
    // it froze once the QTE clears.
    const onStage =
      vehicle.phase !== "IDLE" && vehicle.phase !== "GONE" && !isQteActive(stateRef.current.qte);
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

    // Combine travel direction with the art's own facing so a left-drawn sprite
    // reads correctly whichever way it rolls (bug fix: car/truck art faces left).
    const flipX = facingRef.current * artSign(vehicle.vehicleType);

    mesh.position.set(vehicle.position.x, vehicle.position.y, VEHICLE_Z);
    mesh.scale.set(flipX * vehicleAspect(vehicle.vehicleType) * VEHICLE_H, VEHICLE_H, 1);

    const tex = getVehicleTexture(vehicle.vehicleType);
    const mat = mesh.material as MeshBasicMaterial;
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    // Neon rim (loi du glow, ADR-0011): a scaled additive glow drawn behind the
    // sprite. The rim texture is padded by `marginPx` on every side and carries
    // its alpha-gradient falloff baked in; scaling by `(1 + 2·marginPx/src)` per
    // axis makes the padded gradient zone coincide exactly with an equal world
    // margin on all four sides (equal world-per-pixel on the 2:1 canvas). Baked
    // async, so it only shows once its silhouette is ready.
    if (rim !== null) {
      const neon = getVehicleSilhouette(vehicle.vehicleType);
      // onStage is provably true here (early-returns above) — visibility only
      // hinges on the async silhouette bake having landed.
      rim.visible = neon !== null;
      if (neon !== null) {
        const rimMat = rim.material as MeshBasicMaterial;
        if (rimMat.map !== neon.texture) {
          rimMat.map = neon.texture;
          rimMat.needsUpdate = true;
        }
        const worldW = vehicleAspect(vehicle.vehicleType) * VEHICLE_H;
        const worldH = VEHICLE_H;
        const padX = neon.srcW > 0 ? (2 * neon.marginPx) / neon.srcW : 0;
        const padY = neon.srcH > 0 ? (2 * neon.marginPx) / neon.srcH : 0;
        rim.position.set(vehicle.position.x, vehicle.position.y, VEHICLE_Z - 0.01);
        rim.scale.set(flipX * worldW * (1 + padX), worldH * (1 + padY), 1);
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
