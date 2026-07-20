import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, TextureLoader, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial, Group } from "three";
import type { GameState } from "@game/types/gameState";
import type { WindowSlot } from "@game/types/map";
import type { SpecialWeaponKind } from "@game/types/weapon";
// LOOT_STREET_Y is a PURE game constant (single source of truth, lootSystem) read by both
// the resolver and this render lane (ADR-0053 D2/D5) — imported, NEVER re-declared here.
import { LOOT_STREET_Y } from "@game/systems/lootSystem";
import { weaponGlyph } from "@render/ui/hud/derivations";
import { applyPixelFilter } from "./pixelArt";
import levelArt from "@game/levels/levelArt.json";

/**
 * Armament crate (ADR-0052 D5 → superseded on placement by ADR-0053) — the LOOT entity,
 * now a static street object on the sidewalk (not a window occupant). It renders in three
 * composited render-side layers, grouped so the whole crate drops-and-settles on APPEAR:
 *   1. a green neon rim-glow (additive) with a baked shadowBlur falloff — "ce qui brille
 *      est interactif" (R3), the falloff technique lead-art cleared at stage-5;
 *   2. the crate BODY — a wooden-crate FLUX sprite (`levelArt.loot`) loaded async and
 *      swapped in on success, with a code-drawn plank box as the SYNCHRONOUS fallback so
 *      the dev lane never blocks on the CI render farm (ADR-0049 idiom); one body asset
 *      serves all three weapons;
 *   3. the A/B/C weapon glyph, composited render-side over the crate face (D8/W1 —
 *      glyph-before-fire lives on the crate, re-hueable, not baked into the FLUX asset).
 *
 * Position: mounted at `(slot.screenPosition.x, LOOT_STREET_Y)` — x still keyed by
 * `loot.slotIndex` (the deterministic seed's x-carrier, D1), y decoupled to the fixed
 * street constant. The plane size is a FIXED crate world-size (decoupled from `slot.size`,
 * D5); AC-D8 crop-clearance is a verify/composite-gate item, `LOOT_STREET_Y` the knob.
 * There is only ever ONE crate (`GameState.loot` is a single crate | null). Reads state
 * only — holds no rule.
 */

const NEON = "#78FF3C"; // acid-green interactive rim (art-advisor rec, ADR-0053 P4; was #ffe600)
const BODY = "#141020"; // dark plank body (fallback only) so the glyph + rim read over it
const SLAT = "#3a3350"; // muted plank/brace lines — inert object detail (fallback only)

// Fixed crate world-size on the sidewalk (verify-tunable, AC-D8). Squat 4:3 box matching
// the FLUX sprite (256×192); centred at LOOT_STREET_Y (= the resolver hit-point). If the
// crate clips the 16:9 cover-crop bottom, the knob is LOOT_STREET_Y (game side), raised at
// the composite gate — the render size stays fixed here.
const CRATE_WORLD_W = 1.65;
const CRATE_WORLD_H = 1.25;
const RIM_SCALE = 1.18; // rim-glow plane a touch larger than the body so the glow spills out

// Drop-and-settle APPEAR (ADR-0053 D5, render-only feel): the crate falls from just above
// its rest point and eases down over ~LOOT_APPEARING_DURATION. Timed by a render
// accumulator (does not read a game duration). Pre-despawn: the rim blinks over the last
// BLINK_WINDOW seconds of VISIBLE as a leaving telegraph (read off `loot.timer`).
const APPEAR_SECONDS = 0.45;
const DROP_HEIGHT = 2.2;
const BLINK_WINDOW = 0.8;

function makeCanvas(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  return { canvas, ctx };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── Body: FLUX sprite with a code-drawn plank-box fallback (ADR-0053 D5 / ADR-0049) ──
const spriteLoader = new TextureLoader();
// undefined = not yet attempted; null = failed/404 (keep the fallback for the session);
// Texture = the loaded FLUX crate.
let spriteTex: Texture | null | undefined;
let spritePending = false;
let bodyFallbackTex: Texture | null | undefined;

// The wooden-crate FLUX body when it has loaded, else null (→ caller uses the fallback).
// Kicks the async load once; a 404 (asset not generated yet) poisons `spriteTex = null`
// so the drawn fallback stays for the session — never blocks the dev lane.
function getCrateSprite(): Texture | null {
  if (spriteTex !== undefined) return spriteTex;
  if (spritePending || typeof document === "undefined") return null;
  spritePending = true;
  const url = `${import.meta.env.BASE_URL}${levelArt.loot.types.crate.asset}`;
  spriteLoader.load(
    url,
    (t) => {
      spritePending = false;
      spriteTex = applyPixelFilter(t);
    },
    undefined,
    () => {
      spritePending = false;
      spriteTex = null;
    },
  );
  return null;
}

// Synchronous drawn plank crate (body only — NO glyph, NO rim; those are separate layers).
function getCrateBodyFallback(): Texture | null {
  if (bodyFallbackTex !== undefined) return bodyFallbackTex;
  const made = makeCanvas(256, 192);
  if (made === null) {
    bodyFallbackTex = null;
    return null;
  }
  const { ctx, canvas } = made;
  const x = 16;
  const y = 20;
  const w = 224;
  const h = 152;
  roundRectPath(ctx, x, y, w, h, 10);
  ctx.fillStyle = BODY;
  ctx.fill();
  // Plank boards + corner battens + lid rail + one diagonal cross-brace (inert detail).
  ctx.strokeStyle = SLAT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x, y + 34); // lid rail
  ctx.lineTo(x + w, y + 34);
  ctx.moveTo(x, y + 92); // mid board seam
  ctx.lineTo(x + w, y + 92);
  ctx.moveTo(x + 26, y); // left batten
  ctx.lineTo(x + 26, y + h);
  ctx.moveTo(x + w - 26, y); // right batten
  ctx.lineTo(x + w - 26, y + h);
  ctx.moveTo(x + 26, y + h); // diagonal brace
  ctx.lineTo(x + w - 26, y + 34);
  ctx.stroke();
  bodyFallbackTex = new CanvasTexture(canvas);
  return bodyFallbackTex;
}

// ── Glyph: render-side A/B/C stencil on the crate face (per weapon), transparent ground ──
const glyphTextures: Partial<Record<SpecialWeaponKind, Texture | null>> = {};
function getGlyphTexture(weapon: SpecialWeaponKind): Texture | null {
  const cached = glyphTextures[weapon];
  if (cached !== undefined) return cached;
  const made = makeCanvas(256, 192);
  if (made === null) {
    glyphTextures[weapon] = null;
    return null;
  }
  const { ctx, canvas } = made;
  ctx.font = "bold 118px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const glyph = weaponGlyph(weapon);
  // High-contrast stencil: a dark keyline under the acid-green fill so it reads on the
  // planks (and on the FLUX B&W crate) before the collecting shot (D8/W1).
  ctx.lineWidth = 12;
  ctx.strokeStyle = BODY;
  ctx.strokeText(glyph, 128, 104);
  ctx.fillStyle = NEON;
  ctx.fillText(glyph, 128, 104);
  const tex = new CanvasTexture(canvas);
  glyphTextures[weapon] = tex;
  return tex;
}

// ── Rim glow: green box-halo with a baked shadowBlur falloff (the lead-art-cleared
// technique, re-hued). Additive; behind the body so the body occludes the core and only
// the monotonic outward falloff reads — blooms cleanly over the dark street. ──
let rimTexture: Texture | null | undefined;
function getRimTexture(): Texture | null {
  if (rimTexture !== undefined) return rimTexture;
  const made = makeCanvas(256, 192);
  if (made === null) {
    rimTexture = null;
    return null;
  }
  const { ctx, canvas } = made;
  roundRectPath(ctx, 40, 34, 176, 124, 12); // box footprint ≈ the crate, margin for the tail
  ctx.fillStyle = NEON;
  ctx.shadowColor = NEON;
  for (const blur of [30, 18, 10]) {
    ctx.shadowBlur = blur;
    ctx.fill();
  }
  rimTexture = new CanvasTexture(canvas);
  return rimTexture;
}

// EaseOutCubic — the drop settles fast then eases onto the pavement.
const easeOut = (t: number): number => 1 - (1 - t) ** 3;

interface Props {
  stateRef: React.RefObject<GameState>;
  /** Merged window slots — the crate reads its world-X from `slot.screenPosition.x` only. */
  slots: readonly WindowSlot[];
}

export function LootCrate({ stateRef, slots }: Props): JSX.Element {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Mesh>(null);
  const glyphRef = useRef<Mesh>(null);
  const rimRef = useRef<Mesh>(null);
  const appearTimerRef = useRef(0);
  const prevStateRef = useRef<string>("HIDDEN");

  useFrame((_state, delta) => {
    const group = groupRef.current;
    if (group === null) return;

    const loot = stateRef.current.loot;
    if (loot === null || loot.state === "HIDDEN") {
      group.visible = false;
      prevStateRef.current = loot?.state ?? "HIDDEN";
      return;
    }
    const slot = slots[loot.slotIndex];
    if (slot === undefined) {
      group.visible = false;
      return;
    }

    if (prevStateRef.current !== "APPEARING" && loot.state === "APPEARING") {
      appearTimerRef.current = 0;
    }
    prevStateRef.current = loot.state;
    group.visible = true;

    // X from the deterministic slot; Y fixed at the sidewalk (drop-settle offset on APPEAR).
    let dropY = 0;
    if (loot.state === "APPEARING") {
      appearTimerRef.current = Math.min(appearTimerRef.current + delta, APPEAR_SECONDS);
      const t = appearTimerRef.current / APPEAR_SECONDS;
      dropY = DROP_HEIGHT * (1 - easeOut(t)); // falls from +DROP_HEIGHT to 0
    }
    group.position.set(slot.screenPosition.x, LOOT_STREET_Y + dropY, 0);

    // Body: FLUX sprite when it has loaded, else the drawn plank fallback (never blocks).
    const body = bodyRef.current;
    if (body !== null) {
      const mat = body.material as MeshBasicMaterial;
      const tex = getCrateSprite() ?? getCrateBodyFallback();
      if (tex !== null && mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    }
    // Glyph for this crate's weapon (composited on the crate face).
    const glyphMesh = glyphRef.current;
    if (glyphMesh !== null) {
      const gmat = glyphMesh.material as MeshBasicMaterial;
      const gtex = getGlyphTexture(loot.weapon);
      if (gtex !== null && gmat.map !== gtex) {
        gmat.map = gtex;
        gmat.needsUpdate = true;
      }
    }
    // Rim glow: a gentle breathing pulse, then a fast leaving-blink over the last
    // BLINK_WINDOW seconds of VISIBLE (ADR-0053 D5 pre-despawn telegraph).
    const rim = rimRef.current;
    if (rim !== null) {
      const rmat = rim.material as MeshBasicMaterial;
      const now = performance.now();
      if (loot.state === "VISIBLE" && loot.timer < BLINK_WINDOW) {
        rmat.opacity = Math.sin(now * 0.03) > 0 ? 0.95 : 0.15; // ~fast blink
      } else {
        rmat.opacity = 0.7 + Math.sin(now * 0.005) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Rim glow behind the body (z=-0.02): additive green with the baked shadowBlur
          falloff; the body occludes the core, the outward falloff reads as the rim. */}
      <mesh ref={rimRef} position={[0, 0, -0.02]} renderOrder={4}>
        <planeGeometry args={[CRATE_WORLD_W * RIM_SCALE, CRATE_WORLD_H * RIM_SCALE]} />
        <meshBasicMaterial
          map={getRimTexture()}
          transparent
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* Crate body (FLUX sprite | drawn plank fallback). depthWrite off like every other
          transparent quad so it never punches holes in the backdrop. */}
      <mesh ref={bodyRef} position={[0, 0, 0]} renderOrder={4}>
        <planeGeometry args={[CRATE_WORLD_W, CRATE_WORLD_H]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      {/* A/B/C glyph composited on the crate face (z=+0.02, drawn over the body). */}
      <mesh ref={glyphRef} position={[0, 0, 0.02]} renderOrder={4}>
        <planeGeometry args={[CRATE_WORLD_W, CRATE_WORLD_H]} />
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
    </group>
  );
}
