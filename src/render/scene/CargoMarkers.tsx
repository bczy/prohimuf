import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending, DoubleSide } from "three";
import type { Texture, Group, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Cargo, CargoStatus } from "@game/types/cargo";

// Acid-neon palette (guidelines: "ce qui brille est interactif").
const NEON_PICKUP = "#39ff14"; // acid green — go grab it
const NEON_DEPOT = "#ff2d9b"; // fuchsia — lit up once the cargo is in hand
const DECOR_GRAY = "#4a4a5a"; // dim decor: depot before you carry anything

// In front of the street sprites, behind the crosshair (z = 1).
const MARKER_Z = 0.66;

// Lazily-built white radial glow, tinted per-marker via the material colour under
// additive blending (same approach as EnemySprite's muzzle burst).
let glowTexture: Texture | null = null;
function getGlowTexture(): Texture | null {
  if (glowTexture !== null) return glowTexture;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.35)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}

function paint(mesh: Mesh | null, color: string, opacity: number): void {
  if (mesh === null) return;
  const mat = mesh.material as MeshBasicMaterial;
  mat.color.set(color);
  mat.opacity = opacity;
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /** Fired only when the cargo status actually changes (drives the DOM HUD). */
  onStatusChange?: ((status: CargoStatus) => void) | undefined;
}

/**
 * Neon markers for the delivery loop: one at the pickup point (visible while the
 * cargo is `TO_PICKUP`), one at the depot (lit up while `CARRYING`, dim decor
 * before, gone once `DELIVERED`). Primitive R3F geometry — no PNG. Driven each
 * frame from the game-state ref, like CourierSprite; no per-frame React re-render.
 */
export function CargoMarkers({ stateRef, onStatusChange }: Props): JSX.Element {
  const pickupRef = useRef<Group>(null);
  const pickupGlowRef = useRef<Mesh>(null);
  const pickupRingRef = useRef<Mesh>(null);
  const depotRef = useRef<Group>(null);
  const depotGlowRef = useRef<Mesh>(null);
  const depotRingRef = useRef<Mesh>(null);
  const lastStatusRef = useRef<CargoStatus | null>(null);

  useFrame(() => {
    const pickup = pickupRef.current;
    const depot = depotRef.current;
    if (pickup === null || depot === null) return;

    // `GameState.cargo` is a required field (owned by the gameplay lane); read it
    // directly — this component only renders the state, never mutates it.
    const cargo: Cargo = stateRef.current.cargo;

    // Surface status transitions to the HUD (only on change; not per frame).
    if (cargo.status !== lastStatusRef.current) {
      lastStatusRef.current = cargo.status;
      onStatusChange?.(cargo.status);
    }

    const pulse = 0.85 + Math.sin(performance.now() * 0.006) * 0.15;

    // Pickup marker: only while the cargo is still on the ground.
    const showPickup = cargo.status === "TO_PICKUP";
    pickup.visible = showPickup;
    if (showPickup) {
      pickup.position.set(cargo.pickup.x, cargo.pickup.y, MARKER_Z);
      pickup.scale.setScalar(pulse);
      paint(pickupGlowRef.current, NEON_PICKUP, 0.6 * pulse);
      paint(pickupRingRef.current, NEON_PICKUP, 1);
    }

    // Depot marker: hidden once delivered; dim decor until the cargo is in hand,
    // then it flares to signal where to drop off.
    const showDepot = cargo.status !== "DELIVERED";
    depot.visible = showDepot;
    if (showDepot) {
      const carrying = cargo.status === "CARRYING";
      depot.position.set(cargo.depot.x, cargo.depot.y, MARKER_Z);
      depot.scale.setScalar(carrying ? pulse : 0.8);
      paint(
        depotGlowRef.current,
        carrying ? NEON_DEPOT : DECOR_GRAY,
        carrying ? 0.7 * pulse : 0.12,
      );
      paint(depotRingRef.current, carrying ? NEON_DEPOT : DECOR_GRAY, carrying ? 1 : 0.4);
    }
  });

  return (
    <>
      <group ref={pickupRef} visible={false}>
        <mesh ref={pickupGlowRef} position={[0, 0, -0.01]} renderOrder={4}>
          <planeGeometry args={[2.6, 2.6]} />
          <meshBasicMaterial
            map={getGlowTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={pickupRingRef} renderOrder={5}>
          <ringGeometry args={[0.62, 0.82, 40]} />
          <meshBasicMaterial transparent depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>

      <group ref={depotRef} visible={false}>
        <mesh ref={depotGlowRef} position={[0, 0, -0.01]} renderOrder={4}>
          <planeGeometry args={[2.6, 2.6]} />
          <meshBasicMaterial
            map={getGlowTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        <mesh ref={depotRingRef} renderOrder={5}>
          <ringGeometry args={[0.62, 0.82, 40]} />
          <meshBasicMaterial transparent depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </>
  );
}
