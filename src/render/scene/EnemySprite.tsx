import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";
import { ARCHETYPES } from "@game/types/enemyTypes";
import { resolveEnemyTexture, frameCountFor, enemyAnimFps, muzzleFor } from "./enemyTextures";
import { flipbookFrame } from "./flipbook";

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
  // Square base plane sized to the window height; per-kind width is applied via
  // scale.x each frame (the courier-on-a-bike is wider than the portrait cops),
  // since the occupant's kind changes every wave. Fallback for grid-only levels.
  const planeH = size !== undefined ? size.y * 0.8 : 1.3;
  // Drop the sprite below the window centre so the feet rest at the sill/balcony
  // and the railing crosses the legs (instead of the cop floating mid-window).
  const bodyY = screenPosition.y - planeH * 0.28;
  const muzzleY = planeH * 0.12;
  const meshRef = useRef<Mesh>(null);
  const flashRef = useRef<Mesh>(null);
  // Track APPEARING phase start for unfold animation
  const unfoldTimerRef = useRef(0);
  // Flipbook clock, reset on every state change so each state animates from
  // frame 1 (see getEnemyTexture / flipbookFrame).
  const animClockRef = useRef(0);
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

    const stateChanged = prevStateRef.current !== enemy.state;
    // Reset unfold timer when entering APPEARING
    if (prevStateRef.current !== "APPEARING" && enemy.state === "APPEARING") {
      unfoldTimerRef.current = 0;
    }
    // Restart the flipbook clock on any state change so each state's animation
    // plays from frame 1.
    if (stateChanged) animClockRef.current = 0;
    prevStateRef.current = enemy.state;

    mesh.visible = true;
    mesh.position.x = screenPosition.x;
    mesh.position.y = bodyY;

    // Per-kind width (square base plane scaled on X). Paper Mario unfold scales
    // Y 0 → 1 over the APPEARING phase (~0.3s), keeping the kind's width.
    const aspect = archetype.aspect;
    if (enemy.state === "APPEARING") {
      unfoldTimerRef.current = Math.min(unfoldTimerRef.current + delta, 0.3);
      const t = unfoldTimerRef.current / 0.3;
      mesh.scale.y = t;
      mesh.scale.x = aspect * (1 + (1 - t) * 0.3); // slight extra squash as it unfolds
    } else {
      mesh.scale.set(aspect, 1, 1);
    }

    // Texture for this kind/variant/state (shared cache; new-type sprites fall
    // back to the normal cop until they exist). The flipbook advances via the
    // per-state clock; HIT pins frame 1 since the white flash dominates and a
    // missing `_f2` frame degrades to frame 1 inside resolveEnemyTexture.
    const variant = (slotIndex % archetype.variants) + 1;
    const shooting = enemy.state === "SHOOTING";
    animClockRef.current += delta;
    const frame =
      enemy.state === "HIT"
        ? 1
        : flipbookFrame(
            animClockRef.current,
            frameCountFor(enemy.kind, variant, shooting),
            enemyAnimFps(),
          );
    const resolved = resolveEnemyTexture(enemy.kind, variant, shooting, frame);
    const mat = mesh.material as MeshBasicMaterial;
    if (resolved !== null && mat.map !== resolved.texture) {
      mat.map = resolved.texture;
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
        // Prefer the sprite's baked-in per-frame muzzle anchor (normalized
        // top-left tex coords) so the additive glow lands on the gun regardless
        // of which way this sprite aims. The anchor is a pixel position of a
        // specific image, so it is keyed to the frame the texture ACTUALLY
        // displays (resolved.frame) — while a `_f2` file is still loading the
        // frame-1 anchor is used, and the global fallback sprite (a different
        // figure) gets the legacy fixed right-side offset instead. The flash is
        // a world-space sibling centred on (screenPosition.x, bodyY); the body
        // plane is a square planeH scaled by `aspect` on X.
        const m =
          resolved !== null && resolved.frame !== null
            ? muzzleFor(enemy.kind, variant, resolved.frame)
            : null;
        if (m !== null) {
          flash.position.set(
            screenPosition.x + (m.x - 0.5) * planeH * aspect,
            bodyY + (0.5 - m.y) * planeH,
            0.6,
          );
        } else {
          // Fixed-offset fallback: only reachable when the anchor data or the
          // sprite itself is missing (regenerated asset without re-measured
          // anchors, or the global fallback figure).
          flash.position.set(screenPosition.x + planeH * aspect * 0.45, bodyY + muzzleY, 0.6);
        }
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
      {/* renderOrder 4: above every backdrop panel (renderOrder 0..PANELS-1,
          drawn with depthWrite off) and below the foreground ironwork (5) and
          courier (6). depthWrite must stay OFF like every other transparent
          quad in the scene — with the default depthWrite the sprite's
          transparent pixels write z=0 and punch a quad-sized hole in any
          backdrop panel drawn after it (panel p>=1), exposing the overlapped
          neighbour panel as a visible rectangle around the enemy. */}
      <mesh ref={meshRef} position={[screenPosition.x, bodyY, 0]} visible={false} renderOrder={4}>
        <planeGeometry args={[planeH, planeH]} />
        <meshBasicMaterial color="#ff3030" transparent depthWrite={false} />
      </mesh>
      <mesh
        ref={flashRef}
        position={[screenPosition.x, bodyY, 0.6]}
        visible={false}
        renderOrder={4}
      >
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
