import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { getEnemyTexture } from "./enemyTextures";

// Lazily-built radial glow used for muzzle flash / hit burst (additive blend).
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
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,224,160,0.85)");
  grad.addColorStop(1, "rgba(255,170,70,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}

interface Props {
  stateRef: React.RefObject<GameState>;
  slotIndex: number;
  screenPosition: Vec2;
  /** World-space window size; the cop is sized to stand in it. */
  size?: Vec2 | undefined;
}

export function EnemySprite({ stateRef, slotIndex, screenPosition, size }: Props): JSX.Element {
  // Size the cop to roughly fit the window opening (head near the top, legs
  // behind the railing), portrait aspect. Fallback for grid-only levels.
  const planeH = size !== undefined ? size.y * 0.8 : 1.3;
  const planeW = size !== undefined ? planeH * 0.5 : 0.8;
  // Drop the sprite below the window centre so the feet rest at the sill/balcony
  // and the railing crosses the legs (instead of the cop floating mid-window).
  const bodyY = screenPosition.y - planeH * 0.28;
  const muzzleX = planeW * 0.45;
  const muzzleY = planeH * 0.12;
  const meshRef = useRef<Mesh>(null);
  const flashRef = useRef<Mesh>(null);
  // Track APPEARING phase start for unfold animation
  const unfoldTimerRef = useRef(0);
  const prevStateRef = useRef<string>("HIDDEN");

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (mesh === null) return;

    const enemy = stateRef.current.enemies.find((e) => e.slotIndex === slotIndex);
    if (enemy === undefined || enemy.state === "HIDDEN" || enemy.state === "DEAD") {
      mesh.visible = false;
      if (flashRef.current !== null) flashRef.current.visible = false;
      prevStateRef.current = enemy?.state ?? "HIDDEN";
      return;
    }

    const archetype = ARCHETYPES[enemy.kind];

    // Reset unfold timer when entering APPEARING
    if (prevStateRef.current !== "APPEARING" && enemy.state === "APPEARING") {
      unfoldTimerRef.current = 0;
    }
    prevStateRef.current = enemy.state;

    mesh.visible = true;
    mesh.position.x = screenPosition.x;
    mesh.position.y = bodyY;

    // Paper Mario unfold: scale Y 0 → 1 over APPEARING phase (~0.3s)
    if (enemy.state === "APPEARING") {
      unfoldTimerRef.current = Math.min(unfoldTimerRef.current + delta, 0.3);
      const t = unfoldTimerRef.current / 0.3;
      mesh.scale.y = t;
      mesh.scale.x = 1 + (1 - t) * 0.3; // slight squash on X as it unfolds
    } else {
      mesh.scale.set(1, 1, 1);
    }

    // Texture for this kind/variant/state (shared cache; new-type sprites fall
    // back to the normal cop until they exist).
    const variant = (slotIndex % archetype.variants) + 1;
    const shooting = enemy.state === "SHOOTING";
    const tex = getEnemyTexture(enemy.kind, variant, shooting);
    const mat = mesh.material as MeshBasicMaterial;
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    // Per-kind neon tint (multiplied over the sprite); white flash on hit.
    mat.color.set(enemy.state === "HIT" ? "#ffffff" : archetype.tint);

    // Muzzle flash at the gun while shooting; bright impact burst on hit.
    const flash = flashRef.current;
    if (flash !== null) {
      const fmat = flash.material as MeshBasicMaterial;
      if (enemy.state === "SHOOTING") {
        flash.visible = true;
        flash.position.set(screenPosition.x + muzzleX, bodyY + muzzleY, 0.6);
        const pulse = 0.7 + Math.sin(performance.now() * 0.04) * 0.25;
        flash.scale.setScalar(pulse);
        fmat.color.set("#ffd27a");
        fmat.opacity = 0.95;
      } else if (enemy.state === "HIT") {
        flash.visible = true;
        flash.position.set(screenPosition.x, bodyY + 0.1, 0.6);
        flash.scale.setScalar(1.6);
        fmat.color.set("#ffffff");
        fmat.opacity = 1;
      } else {
        flash.visible = false;
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} position={[screenPosition.x, bodyY, 0]} visible={false}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial color="#ff3030" transparent />
      </mesh>
      <mesh ref={flashRef} position={[screenPosition.x, bodyY, 0.6]} visible={false}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial
          map={getGlowTexture()}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
