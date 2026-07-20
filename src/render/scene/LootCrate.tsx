import { useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { WindowSlot } from "@game/types/map";
import type { SpecialWeaponKind } from "@game/types/weapon";
import { weaponGlyph } from "@render/ui/hud/derivations";

/**
 * Armament crate (ADR-0052 D5 / weapons spec §5.1) — the LOOT entity in its window
 * slot. V1 is a code-drawn glyph PLACEHOLDER, no FLUX sprite (pm ruling #4): a
 * non-human OBJECT silhouette (a boxy crate, never a human), neon-outlined so it
 * reads as interactive ("ce qui brille est interactif", R3), carrying the weapon
 * glyph (A/B/C) legibly BEFORE the collecting shot (R2/W1). Drawn onto a CanvasTexture
 * mapped on a plane — the same code-drawn, asset-free idiom as GestureIcon/DiagramIcon
 * and EnemySprite's glow, kept inside the render lane.
 *
 * There is only ever ONE crate (`GameState.loot` is a single crate | null), so this
 * mounts once and seats itself in `loot.slotIndex`. It shares the window channel with
 * enemies but never co-locates (one entity per slot, §5.3). Reads state only — holds
 * no rule (the crate is resolvable/equips purely in `src/game`).
 */

const NEON = "#ffe600"; // interactive glow ink (matches the tutorial-icon vocabulary)
const BODY = "#141020"; // dark crate body so the neon outline + glyph pop over the scene
const SLAT = "#3a3350"; // muted plank/brace lines — inert object detail

// Crate plane as a fraction of the window opening height; a squat box a touch smaller
// than a standing figure, centred in the opening (an object sitting in the window).
const CRATE_PLANE_SCALE = 0.92;
const APPEAR_SECONDS = 0.3; // unfold to match the enemy pop-up cadence (§5.2)

// Cache one crate texture per special weapon (A/B/C glyph baked in) + the radial glow.
const crateTextures: Partial<Record<SpecialWeaponKind, Texture | null>> = {};
let glowTexture: Texture | null | undefined;

function makeCanvas(
  size: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  return { canvas, ctx };
}

// Draw a boxy ammo crate (non-human) with a neon outline and the big weapon glyph.
function getCrateTexture(weapon: SpecialWeaponKind): Texture | null {
  const cached = crateTextures[weapon];
  if (cached !== undefined) return cached;
  const made = makeCanvas(128);
  if (made === null) {
    crateTextures[weapon] = null;
    return null;
  }
  const { canvas, ctx } = made;

  // Crate body — a rounded rectangle, clearly an object.
  const x = 16;
  const y = 24;
  const w = 96;
  const h = 88;
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = BODY;
  ctx.fill();

  // Inert plank/brace detail — a lid band across the top and a diagonal cross-brace.
  ctx.strokeStyle = SLAT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 20);
  ctx.lineTo(x + w, y + 20);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + 20);
  ctx.moveTo(x + w, y + h);
  ctx.lineTo(x, y + 20);
  ctx.stroke();

  // Neon outline — the "interactive" glow read (R3).
  ctx.strokeStyle = NEON;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();

  // Weapon glyph (A/B/C) — the READ-before-fire (R2/W1), dominant and legible.
  ctx.font = "bold 60px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const glyph = weaponGlyph(weapon);
  ctx.lineWidth = 6;
  ctx.strokeStyle = BODY; // dark keyline so the glyph stays legible over the braces
  ctx.strokeText(glyph, 64, 74);
  ctx.fillStyle = NEON;
  ctx.fillText(glyph, 64, 74);

  const tex = new CanvasTexture(canvas);
  crateTextures[weapon] = tex;
  return tex;
}

// Soft radial glow (additive) behind the crate — the pulsing "interactive" halo.
function getGlowTexture(): Texture | null {
  if (glowTexture !== undefined) return glowTexture;
  const made = makeCanvas(64);
  if (made === null) {
    glowTexture = null;
    return null;
  }
  const { canvas, ctx } = made;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,230,0,0.7)");
  grad.addColorStop(0.5, "rgba(255,230,0,0.28)");
  grad.addColorStop(1, "rgba(255,230,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(canvas);
  return glowTexture;
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /** The merged window slots — the crate seats itself in `loot.slotIndex`. */
  slots: readonly WindowSlot[];
}

export function LootCrate({ stateRef, slots }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const appearTimerRef = useRef(0);
  const prevStateRef = useRef<string>("HIDDEN");

  const glow = useMemo(() => getGlowTexture(), []);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const glowMesh = glowRef.current;

    const loot = stateRef.current.loot;
    if (loot === null || loot.state === "HIDDEN") {
      mesh.visible = false;
      if (glowMesh !== null) glowMesh.visible = false;
      prevStateRef.current = loot?.state ?? "HIDDEN";
      return;
    }

    const slot = slots[loot.slotIndex];
    if (slot?.size === undefined) {
      mesh.visible = false;
      if (glowMesh !== null) glowMesh.visible = false;
      return;
    }

    if (prevStateRef.current !== "APPEARING" && loot.state === "APPEARING") {
      appearTimerRef.current = 0;
    }
    prevStateRef.current = loot.state;

    const planeH = slot.size.y * CRATE_PLANE_SCALE;
    const cx = slot.screenPosition.x;
    const cy = slot.screenPosition.y;

    // Bind the crate texture for this crate's weapon (A/B/C baked in).
    const mat = mesh.material as MeshBasicMaterial;
    const tex = getCrateTexture(loot.weapon);
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    mesh.visible = true;
    mesh.position.set(cx, cy, 0);

    // Paper-Mario unfold on APPEARING (scale Y 0→1), full box while VISIBLE.
    if (loot.state === "APPEARING") {
      appearTimerRef.current = Math.min(appearTimerRef.current + delta, APPEAR_SECONDS);
      const t = appearTimerRef.current / APPEAR_SECONDS;
      mesh.scale.set(planeH, planeH * t, 1);
    } else {
      mesh.scale.set(planeH, planeH, 1);
    }

    // Pulsing interactive halo while VISIBLE (R3) — off during APPEARING/HIDDEN.
    if (glowMesh !== null) {
      const gmat = glowMesh.material as MeshBasicMaterial;
      if (loot.state === "VISIBLE") {
        glowMesh.visible = true;
        glowMesh.position.set(cx, cy, -0.02);
        const pulse = 0.55 + Math.sin(performance.now() * 0.005) * 0.25;
        glowMesh.scale.setScalar(planeH * 1.5);
        gmat.opacity = pulse;
      } else {
        glowMesh.visible = false;
      }
    }
  });

  return (
    <>
      {/* Glow halo behind the crate (renderOrder 4 like the window occupants; nudged
          to z=-0.02 so the opaque backdrop stays behind it and the crate draws on top). */}
      <mesh ref={glowRef} visible={false} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent blending={AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* The crate plane. depthWrite off like every other transparent quad (see
          EnemySprite) so its transparent pixels don't punch holes in the backdrop. */}
      <mesh ref={meshRef} visible={false} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
    </>
  );
}
