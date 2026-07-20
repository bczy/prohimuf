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

// Crate plane as a fraction of the window opening height. The drawn box fills ~0.6 of
// the texture, the rest is the baked glow margin, so the plane is scaled up a little to
// keep the box itself a squat object seated in the opening.
const CRATE_PLANE_SCALE = 1.1;
const APPEAR_SECONDS = 0.3; // unfold to match the enemy pop-up cadence (§5.2)

// Cache one crate texture per special weapon (A/B/C glyph baked in) + the radial glow.
const crateTextures: Partial<Record<SpecialWeaponKind, Texture | null>> = {};
let haloTexture: Texture | null | undefined;

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

// Draw a boxy ammo crate (non-human) with a soft glowing neon rim + big weapon glyph.
// The rim is drawn with `shadowBlur` so a monotonic yellow alpha falloff is BAKED into
// the crate's own (alpha-composited) texture margin — it reads as a falloff over the
// crate edge on ANY background, bright facade included (stage-5 lead-art fix: a purely
// additive halo cannot survive a near-white facade — additive light clamps to white).
function getCrateTexture(weapon: SpecialWeaponKind): Texture | null {
  const cached = crateTextures[weapon];
  if (cached !== undefined) return cached;
  // 200px canvas: ~40px margins each side leave room for a WIDE blurred rim to fall to 0
  // — the falloff must survive a bright facade, where only this alpha-composited baked
  // rim contributes (an additive halo clamps to white over a bright background).
  const S = 200;
  const made = makeCanvas(S);
  if (made === null) {
    crateTextures[weapon] = null;
    return null;
  }
  const { canvas, ctx } = made;

  // Crate body — a rounded rectangle, centred, clearly an object.
  const x = 40;
  const y = 44;
  const w = 120;
  const h = 112;
  const r = 12;
  const box = (): void => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  box();
  ctx.fillStyle = BODY;
  ctx.fill();

  // Inert plank/brace detail — a lid band across the top and a diagonal cross-brace.
  ctx.strokeStyle = SLAT;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y + 22);
  ctx.lineTo(x + w, y + 22);
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w, y + 22);
  ctx.moveTo(x + w, y + h);
  ctx.lineTo(x, y + 22);
  ctx.stroke();

  // Glowing neon rim (R3, "ce qui brille est interactif"): blurred stroke passes bake a
  // WIDE monotonic alpha falloff into the texture margin (the "rim with a falloff, not a
  // flat stroke"), tapering from the bright edge out to 0; then a crisp thin stroke keeps
  // the box edge defined. Decreasing-blur passes pile a strong near-edge value with a
  // smooth tail — the enemy-neon-rim look, alpha-composited so it survives a bright bg.
  ctx.strokeStyle = NEON;
  ctx.shadowColor = NEON;
  for (const blur of [32, 20, 11]) {
    ctx.shadowBlur = blur;
    ctx.lineWidth = 4;
    box();
    ctx.stroke();
    box();
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.lineWidth = 4;
  box();
  ctx.stroke();

  // Weapon glyph (A/B/C) — the READ-before-fire (R2/W1), dominant and legible.
  ctx.font = "bold 64px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const glyph = weaponGlyph(weapon);
  ctx.lineWidth = 6;
  ctx.strokeStyle = BODY; // dark keyline so the glyph stays legible over the braces
  ctx.strokeText(glyph, S / 2, S / 2);
  ctx.fillStyle = NEON;
  ctx.fillText(glyph, S / 2, S / 2);

  const tex = new CanvasTexture(canvas);
  crateTextures[weapon] = tex;
  return tex;
}

// Box-shaped interactive halo (additive) behind the crate. Matches the enemy neon-rim
// technique (ADR-0025): the falloff is BAKED into the texture as a monotonic edge
// gradient, not a flat aplat — a filled neon box grown by `shadowBlur` so its alpha
// falls off smoothly to 0 outward from the box edge, drawn in decreasing-blur passes
// to pile up a strong near-edge value that survives the bright facade (additive) while
// still tapering to zero at the margin. The box FOOTPRINT is a touch larger than the
// crate's (below), so its solid core is occluded by the opaque crate body and only a
// hot neon rim + the outward falloff read — the enemy-rim look. (stage-5 lead-art fix:
// the prior centred radial halo read as a hard-edged aplat and died against the facade.)
function getCrateHaloTexture(): Texture | null {
  if (haloTexture !== undefined) return haloTexture;
  const size = 256;
  const made = makeCanvas(size);
  if (made === null) {
    haloTexture = null;
    return null;
  }
  const { canvas, ctx } = made;
  // Box footprint centred in the padded canvas, sized so a 1.6×-scaled halo plane lands
  // the box edges just outside the crate edges (a thin rim), with room for the blur tail.
  const bw = 100;
  const bh = 94;
  const r = 12;
  const bx = (size - bw) / 2;
  const by = (size - bh) / 2;
  const path = (): void => {
    ctx.beginPath();
    ctx.moveTo(bx + r, by);
    ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
    ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
    ctx.arcTo(bx, by + bh, bx, by, r);
    ctx.arcTo(bx, by, bx + bw, by, r);
    ctx.closePath();
  };
  ctx.fillStyle = NEON;
  ctx.shadowColor = NEON;
  for (const blur of [44, 28, 14]) {
    ctx.shadowBlur = blur;
    path();
    ctx.fill();
  }
  haloTexture = new CanvasTexture(canvas);
  return haloTexture;
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

  const halo = useMemo(() => getCrateHaloTexture(), []);

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

    // Pulsing interactive halo while VISIBLE (R3) — off during APPEARING/HIDDEN. Scaled
    // 1.6× the crate so the baked box-halo footprint hugs the crate edge; the opacity
    // breathes but stays high so the additive bloom survives the bright facade (the
    // baked edge gradient carries the monotonic falloff — stage-5 lead-art fix).
    if (glowMesh !== null) {
      const gmat = glowMesh.material as MeshBasicMaterial;
      if (loot.state === "VISIBLE") {
        glowMesh.visible = true;
        glowMesh.position.set(cx, cy, -0.02);
        const pulse = 0.85 + Math.sin(performance.now() * 0.005) * 0.15;
        glowMesh.scale.setScalar(planeH * 1.6);
        gmat.opacity = pulse;
      } else {
        glowMesh.visible = false;
      }
    }
  });

  return (
    <>
      {/* Box halo behind the crate (renderOrder 4 like the window occupants; nudged to
          z=-0.02 so it draws behind the opaque crate body — the solid core is occluded,
          only the hot rim + baked outward falloff read). */}
      <mesh ref={glowRef} visible={false} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={halo} transparent blending={AdditiveBlending} depthWrite={false} />
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
