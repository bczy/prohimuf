import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";
import { archetype } from "@game/types/enemyTypes";
import {
  resolveEnemyTexture,
  frameCountFor,
  enemyAnimFps,
  muzzleFor,
  getSilhouetteFor,
} from "./enemyTextures";
import { flipbookFrame } from "./flipbook";
import { recoilTransform, type RecoilParams } from "./deform";
import { createEnemyRimMaterial, rimZoomCompensation } from "./enemyRimMaterial";
import { heatColor, heatProgress } from "./neonHeatColor";

// Enemy plane height as a fraction of the window opening — a standing figure is
// taller than the window it occupies; at the old 0.8× the cops read as
// miniatures lost in the frame. Shared with GameScene's harness slot-rect
// mirror so the alignment harness always tests the layout actually rendered.
export const ENEMY_PLANE_SCALE = 1.3;
// Upward offset (fraction of planeH) seating the FEET at the sill/balcony line
// the original 0.8×-plane tuning produced (railing crosses the legs):
// old feet = y − 0.8·0.28·h − 0.8·h/2 = y − 0.624·h ⇒ lift = 0.65 − 0.624 = 0.026·h
// = 0.02·planeH.
export const ENEMY_BODY_LIFT = 0.02;

// SPIKE (animation-2d-pipeline): procedural recoil deformation, additive over the
// baked flipbook. Flip to false to disable the whole-plane kick and fall back to
// the pure flipbook baseline (no regression).
const DEFORM_RECOIL_ENABLED = true as boolean;
// One-shot kick in world units, tuned on the pre-ENEMY_PLANE_SCALE window plane
// (planeH≈1); on today's taller plane the same world-unit kick reads slightly
// softer, which is accepted.
const RECOIL: RecoilParams = {
  duration: 0.22,
  kick: 0.06,
  lift: 0.05,
  tilt: 0.09,
  squash: 0.07,
};

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
  /** Base (max) orthographic zoom; keeps the neon rim a fixed on-screen width. */
  baseZoom: number;
}

export function EnemySprite({
  stateRef,
  slotIndex,
  screenPosition,
  size,
  baseZoom,
}: Props): JSX.Element {
  // Square base plane sized to the window height; per-kind width is applied via
  // scale.x each frame (the courier-on-a-bike is wider than the portrait cops),
  // since the occupant's kind changes every wave. Fallback for grid-only levels.
  const planeH = size !== undefined ? size.y * ENEMY_PLANE_SCALE : 2.1;
  // Feet anchored at the sill/balcony (see ENEMY_BODY_LIFT) so the railing still
  // crosses the legs; the taller plane rises through the window instead of
  // floating mid-frame.
  const bodyY = screenPosition.y + planeH * ENEMY_BODY_LIFT;
  const muzzleY = planeH * 0.12;
  const meshRef = useRef<Mesh>(null);
  const flashRef = useRef<Mesh>(null);
  const rimRef = useRef<Mesh>(null);
  // One rim shader per sprite instance; uniforms are mutated in useFrame.
  const rimMat = useMemo(() => createEnemyRimMaterial(), []);
  // R3F does not auto-dispose a material passed to <primitive object={…}>, so
  // release its GL program when the sprite unmounts (e.g. a game restart).
  useEffect(
    () => () => {
      rimMat.material.dispose();
    },
    [rimMat],
  );
  // Track APPEARING phase start for unfold animation
  const unfoldTimerRef = useRef(0);
  // Flipbook clock, reset on every state change so each state animates from
  // frame 1 (see getEnemyTexture / flipbookFrame).
  const animClockRef = useRef(0);
  const prevStateRef = useRef<string>("HIDDEN");

  useFrame((state, delta) => {
    const mesh = meshRef.current;
    if (mesh === null) return;

    const enemy = stateRef.current.enemies.find((e) => e.slotIndex === slotIndex);
    if (enemy === undefined || enemy.state === "HIDDEN" || enemy.state === "DEAD") {
      mesh.visible = false;
      if (flashRef.current !== null) flashRef.current.visible = false;
      if (rimRef.current !== null) rimRef.current.visible = false;
      prevStateRef.current = enemy?.state ?? "HIDDEN";
      return;
    }

    const arch = archetype(enemy.kind);

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
    const aspect = arch.aspect;
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
    const variant = (slotIndex % arch.variants) + 1;
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

    // Per-kind neon tint (multiplied over the sprite); white flash on hit. (The
    // hostage taker is no longer a window pop-up — it drives the cinematic QTE,
    // ADR-0030 — so no per-state tint override is needed here.)
    if (enemy.state === "HIT") {
      mat.color.set("#ffffff");
    } else {
      mat.color.set(arch.tint);
    }

    // Baked-in per-frame muzzle anchor (normalized tex coords), keyed to the frame
    // the texture ACTUALLY displays. Hoisted here so the recoil kick can read the
    // aim direction from it; the flash below reuses the same lookup.
    const muzzle =
      resolved !== null && resolved.frame !== null
        ? muzzleFor(enemy.kind, variant, resolved.frame)
        : null;

    // SPIKE recoil (animation-2d-pipeline): additive whole-plane kick while
    // SHOOTING, driven off the per-state anim clock (0 on entering SHOOTING → eased
    // idle→action→idle). Aim direction comes from the muzzle anchor side; the kick
    // is opposite. Applied to mesh.position/scale HERE so the rim block below (which
    // mirrors mesh.scale) and the flash block (which reuses recoilDX/DY) stay locked
    // to the body — no gap opens between body, neon rim and muzzle flash.
    let recoilDX = 0;
    let recoilDY = 0;
    if (DEFORM_RECOIL_ENABLED && enemy.state === "SHOOTING") {
      const aimDirX = muzzle !== null ? muzzle.x - 0.5 : 1;
      const kick = recoilTransform(animClockRef.current, aimDirX, RECOIL);
      recoilDX = kick.offsetX;
      recoilDY = kick.offsetY;
      mesh.position.x += recoilDX;
      mesh.position.y += recoilDY;
      mesh.rotation.z = kick.rotate;
      mesh.scale.y *= kick.scaleY;
    } else {
      mesh.rotation.z = 0;
    }

    // Neon heat rim (ADR-0025): a shader-recoloured silhouette drawn behind the
    // body. Hostiles only — the green→orange→red ramp warns the player their
    // window to shoot is closing; a red civilian would wrongly read "tire-moi".
    // Same renderOrder as the body but nudged behind it in z, so the opaque body
    // covers the interior glow and only the scaled-out margin shows as a rim.
    const rim = rimRef.current;
    if (rim !== null) {
      const neon = arch.shoots && resolved !== null ? getSilhouetteFor(resolved.texture) : null;
      rim.visible = neon !== null;
      if (neon !== null) {
        // Follow the body's recoil nudge AND tilt so the rim stays flush behind
        // it — mirror mesh.rotation.z (0 when not recoiling) or the rim detaches
        // from the body during the kick's tilt.
        rim.position.set(screenPosition.x + recoilDX, bodyY + recoilDY, -0.01);
        rim.rotation.z = mesh.rotation.z;
        rimMat.uniforms.uMap.value = neon.texture;
        const padX = neon.srcW > 0 ? (2 * neon.marginPx) / neon.srcW : 0;
        const padY = neon.srcH > 0 ? (2 * neon.marginPx) / neon.srcH : 0;
        // Fixed on-screen rim width (ADR-0026): grow the world margin as the
        // camera zooms out so the projected band stays constant instead of
        // fading to a hairline. 1 at base/desktop zoom → no regression there.
        const zoomComp = rimZoomCompensation(baseZoom, state.camera.zoom);
        // Mirror the body's per-frame scale (aspect + Paper-Mario unfold) so the
        // rim unfolds with it, then expand by the (zoom-compensated) padded-texture
        // ratio so the baked gradient band maps to a fixed on-screen margin.
        rim.scale.set(
          mesh.scale.x * (1 + padX * zoomComp),
          mesh.scale.y * (1 + padY * zoomComp),
          1,
        );
        const [r, g, b] = heatColor(heatProgress(enemy.state, enemy.timer, arch.visibleDuration));
        const col = rimMat.uniforms.uColor.value;
        col.r = r;
        col.g = g;
        col.b = b;
      }
    }

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
        // plane is a square planeH scaled by `aspect` on X. The recoil nudge
        // (recoilDX/DY) is added so the flash tracks the gun as it kicks back.
        const m = muzzle;
        if (m !== null) {
          flash.position.set(
            screenPosition.x + recoilDX + (m.x - 0.5) * planeH * aspect,
            bodyY + recoilDY + (0.5 - m.y) * planeH,
            0.6,
          );
        } else {
          // Fixed-offset fallback: only reachable when the anchor data or the
          // sprite itself is missing (regenerated asset without re-measured
          // anchors, or the global fallback figure).
          flash.position.set(
            screenPosition.x + recoilDX + planeH * aspect * 0.45,
            bodyY + recoilDY + muzzleY,
            0.6,
          );
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
      {/* Neon heat rim (ADR-0025): shares the enemy renderOrder (4) — one below
          it (3) would collide with backdrop panel 3 (PANELS=4) — and is nudged
          to z=-0.01 so the transparent z-sort draws it behind the body at z=0.
          The body's opaque pixels cover the interior glow; only the scaled-out
          margin shows. depthWrite off like every other transparent quad. */}
      <mesh
        ref={rimRef}
        position={[screenPosition.x, bodyY, -0.01]}
        visible={false}
        renderOrder={4}
      >
        <planeGeometry args={[planeH, planeH]} />
        <primitive object={rimMat.material} attach="material" />
      </mesh>
      {/* renderOrder 4: above every backdrop panel (renderOrder 0..PANELS-1,
          drawn with depthWrite off) and below the foreground ironwork (5) and
          the street actors — delivery van 5.2/5.25, courier 5.5, near prop row
          5.75 (see src/render/scene/streetDepth.ts). depthWrite must stay OFF like every other transparent
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
