import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Group, Mesh, MeshBasicMaterial } from "three";
import { applyPixelFilter } from "./pixelArt";
import type { GameState } from "@game/types/gameState";
import type { Cargo, CargoStatus } from "@game/types/cargo";

// Acid-neon palette (guidelines: "ce qui brille est interactif").
const NEON_PICKUP = "#39ff14"; // acid green — go grab it
const NEON_DEPOT = "#ff2d9b"; // fuchsia — lit up once the cargo is in hand
const DECOR_GRAY = "#4a4a5a"; // dim decor: depot before you carry anything
const CRATE_DARK = "#0d0d12"; // fanzine near-black body

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

// Lazily-built pickup crate: a wrapped parcel drawn procedurally in Canvas2D so
// it reads as *cargo* at a glance without leaning on the FLUX asset pipeline.
// Fanzine near-black body, acid-green neon outline + packing straps + a sealed
// "?" tag. Self-coloured (the material stays white so the texture shows true),
// so — unlike the glow/depot — it is NOT tinted per frame.
let crateTexture: Texture | null = null;
function getCrateTexture(): Texture | null {
  if (crateTexture !== null) return crateTexture;
  if (typeof document === "undefined") return null;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  if (g === null) return null;

  const m = 18;
  const w = S - 2 * m;
  const h = S - 2 * m;
  const mid = S / 2;

  // Body: dark parcel with a bright neon border.
  g.fillStyle = CRATE_DARK;
  g.fillRect(m, m, w, h);
  g.lineJoin = "miter";
  g.lineCap = "butt";
  g.strokeStyle = NEON_PICKUP;
  g.lineWidth = 6;
  g.strokeRect(m + 3, m + 3, w - 6, h - 6);

  // Packing straps: a cross wrapping the parcel (string tied around the box).
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(m, mid);
  g.lineTo(m + w, mid);
  g.moveTo(mid, m);
  g.lineTo(mid, m + h);
  g.stroke();

  // Corner reinforcement brackets — the "shipping crate" tell.
  const bl = 16; // bracket leg length
  const inset = 12;
  const corners: readonly (readonly [number, number, number, number])[] = [
    [m + inset, m + inset, 1, 1],
    [m + w - inset, m + inset, -1, 1],
    [m + inset, m + h - inset, 1, -1],
    [m + w - inset, m + h - inset, -1, -1],
  ];
  g.lineWidth = 4;
  for (const [cx, cy, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(cx + sx * bl, cy);
    g.lineTo(cx, cy);
    g.lineTo(cx, cy + sy * bl);
    g.stroke();
  }

  // Central seal tag: a knot disc stamped with a "?" — mystery consignment.
  g.beginPath();
  g.arc(mid, mid, 15, 0, Math.PI * 2);
  g.fillStyle = CRATE_DARK;
  g.fill();
  g.lineWidth = 4;
  g.stroke();
  g.fillStyle = NEON_PICKUP;
  g.font = "bold 22px sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("?", mid, mid + 1);

  crateTexture = applyPixelFilter(new CanvasTexture(c));
  return crateTexture;
}

// Lazily-built depot drop-zone: a dashed target rectangle with corner ticks and
// a centre reticle. Drawn in pure white so the material colour can tint it —
// dim gray decor before you carry, acid fuchsia once armed. Simpler than the
// crate on purpose: a place to drop, not an object to grab.
let depotTexture: Texture | null = null;
function getDepotTexture(): Texture | null {
  if (depotTexture !== null) return depotTexture;
  if (typeof document === "undefined") return null;
  const S = 128;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d");
  if (g === null) return null;

  const m = 16;
  const w = S - 2 * m;
  const h = S - 2 * m;
  const mid = S / 2;
  g.strokeStyle = "#ffffff";

  // Dashed drop-zone rectangle.
  g.lineWidth = 5;
  g.setLineDash([12, 9]);
  g.strokeRect(m, m, w, h);
  g.setLineDash([]);

  // Solid corner ticks over the dashes to anchor the frame.
  const tl = 14;
  const corners: readonly (readonly [number, number, number, number])[] = [
    [m, m, 1, 1],
    [m + w, m, -1, 1],
    [m, m + h, 1, -1],
    [m + w, m + h, -1, -1],
  ];
  g.lineWidth = 6;
  for (const [cx, cy, sx, sy] of corners) {
    g.beginPath();
    g.moveTo(cx + sx * tl, cy);
    g.lineTo(cx, cy);
    g.lineTo(cx, cy + sy * tl);
    g.stroke();
  }

  // Centre reticle: cross + ring, "drop here".
  g.lineWidth = 4;
  const r = 10;
  g.beginPath();
  g.arc(mid, mid, r, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.moveTo(mid - r - 8, mid);
  g.lineTo(mid + r + 8, mid);
  g.moveTo(mid, mid - r - 8);
  g.lineTo(mid, mid + r + 8);
  g.stroke();

  depotTexture = applyPixelFilter(new CanvasTexture(c));
  return depotTexture;
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
 * Neon markers for the delivery loop. The pickup point shows a procedurally-drawn
 * cargo crate (visible while the cargo is `TO_PICKUP`); the depot shows a dashed
 * drop-zone target (lit fuchsia while `CARRYING`, dim decor before, gone once
 * `DELIVERED`). Both textures are Canvas2D — no PNG, no FLUX. Driven each frame
 * from the game-state ref, like CourierSprite; no per-frame React re-render.
 */
export function CargoMarkers({ stateRef, onStatusChange }: Props): JSX.Element {
  const pickupRef = useRef<Group>(null);
  const pickupGlowRef = useRef<Mesh>(null);
  const depotRef = useRef<Group>(null);
  const depotGlowRef = useRef<Mesh>(null);
  const depotTargetRef = useRef<Mesh>(null);
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

    // Pickup marker: only while the cargo is still on the ground. The crate is
    // self-coloured, so only its glow halo is tinted/pulsed; the group scale
    // gives the whole crate its "breathing" interactive pulse.
    const showPickup = cargo.status === "TO_PICKUP";
    pickup.visible = showPickup;
    if (showPickup) {
      pickup.position.set(cargo.pickup.x, cargo.pickup.y, MARKER_Z);
      pickup.scale.setScalar(pulse);
      paint(pickupGlowRef.current, NEON_PICKUP, 0.6 * pulse);
    }

    // Depot marker: hidden once delivered; dim gray decor until the cargo is in
    // hand, then it flares fuchsia to signal where to drop off.
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
      paint(depotTargetRef.current, carrying ? NEON_DEPOT : DECOR_GRAY, carrying ? 1 : 0.45);
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
        <mesh renderOrder={5}>
          <planeGeometry args={[1.5, 1.5]} />
          <meshBasicMaterial map={getCrateTexture()} transparent depthWrite={false} />
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
        <mesh ref={depotTargetRef} renderOrder={5}>
          <planeGeometry args={[1.7, 1.7]} />
          <meshBasicMaterial map={getDepotTexture()} transparent depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
