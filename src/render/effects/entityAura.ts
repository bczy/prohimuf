import {
  AdditiveBlending,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  SRGBColorSpace,
} from "three";
import { energyGlowColor } from "./energyGlow";
import { getRadialGlowTexture } from "./radialGlowTexture";

/**
 * Per-entity soft shadow + energy glow, as an imperative pair of quads.
 *
 * Two layers, both driven from ONE `update()` the host calls inside the useFrame
 * it already runs (so the aura can never lag the sprite it belongs to by a frame,
 * which a sibling component's own useFrame would risk depending on subscription
 * order):
 *  - a SOFT SHADOW: the radial sprite squashed into a low ellipse under the
 *    entity's feet, NormalBlending and near-black — it grounds the flat 2D sprite
 *    on the street instead of letting it float;
 *  - an ENERGY GLOW: the same sprite, additive, tinted by
 *    {@link energyGlowColor} and sized LARGER than the entity so the opaque sprite
 *    occludes the core and only the outward falloff reads as a rim. That is the
 *    "pronounced but legible" contract — a glow drawn at the sprite's own size
 *    would wash the silhouette out (the same reasoning as the ADR-0025 enemy rim).
 *
 * The whole thing lives on layer 0, so it rides the CRT composite's world pass and
 * the ADR-0031 bloom halos the saturated core for free — no new pass.
 */

/** Glow diameter as a multiple of the entity's sprite size (>1 ⇒ it spills out). */
const GLOW_SCALE = 1.55;
/** Additive peak of the glow. Pronounced, but the core is hidden by the sprite. */
const GLOW_OPACITY = 0.55;
/** Shadow footprint: near the sprite's width, and a flat ellipse in height. */
const SHADOW_W_SCALE = 0.9;
const SHADOW_H_SCALE = 0.2;
/** How far the shadow's centre sits below the sprite's centre, in sprite heights. */
const SHADOW_DROP = 0.46;
const SHADOW_OPACITY = 0.45;
const SHADOW_COLOUR = "#07070a";

export interface EntityAuraOptions {
  /** Shared with the host sprite so the aura sorts inside the same band. */
  readonly renderOrder: number;
  /** Glow z — pass slightly BEHIND the sprite so the body occludes the core. */
  readonly glowZ: number;
  /** Shadow z — behind the glow; it is ground, not light. */
  readonly shadowZ: number;
}

export interface EntityAuraFrame {
  readonly visible: boolean;
  /** Entity centre, world units. */
  readonly x: number;
  readonly y: number;
  /** Entity sprite size, world units — the aura is derived from it. */
  readonly width: number;
  readonly height: number;
  /** `GameState.energy` (0..100): the glow hue, green → yellow → red. */
  readonly energy: number;
}

/**
 * Frame that hides an aura. Only `visible` is read when it is false, so the rest
 * is filler — shared so every host's "hide" path is literally the same call.
 */
export const AURA_HIDDEN: EntityAuraFrame = {
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  energy: 0,
};

export interface EntityAura {
  /** Mount with `<primitive object={aura.group} />`. */
  readonly group: Group;
  update(frame: EntityAuraFrame): void;
  dispose(): void;
}

/**
 * Build one aura. Geometry is per-aura (a unit plane, scaled per frame) and the
 * two materials are private, so hosts can hold several without sharing state.
 * Returns a hidden aura: nothing is drawn until the first `update()` with
 * `visible: true`, so a host that never activates costs one hidden group.
 */
export function createEntityAura(opts: EntityAuraOptions): EntityAura {
  const group = new Group();
  group.visible = false;

  const geometry = new PlaneGeometry(1, 1);
  const map = getRadialGlowTexture();

  const shadowMat = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    opacity: SHADOW_OPACITY,
  });
  shadowMat.color.set(SHADOW_COLOUR);
  if (map !== null) shadowMat.map = map;

  const glowMat = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    opacity: GLOW_OPACITY,
  });
  if (map !== null) glowMat.map = map;

  const shadow = new Mesh(geometry, shadowMat);
  shadow.renderOrder = opts.renderOrder;
  const glow = new Mesh(geometry, glowMat);
  glow.renderOrder = opts.renderOrder;
  group.add(shadow, glow);

  const update = (frame: EntityAuraFrame): void => {
    group.visible = frame.visible;
    if (!frame.visible) return;

    shadow.position.set(frame.x, frame.y - frame.height * SHADOW_DROP, opts.shadowZ);
    shadow.scale.set(frame.width * SHADOW_W_SCALE, frame.height * SHADOW_H_SCALE, 1);

    glow.position.set(frame.x, frame.y, opts.glowZ);
    glow.scale.set(frame.width * GLOW_SCALE, frame.height * GLOW_SCALE, 1);
    // The ramp's channels come from sRGB hex, so they are declared as sRGB here:
    // three then converts to its linear working space exactly as `color.set("#…")`
    // would. Without the explicit space the values would be read as already-linear
    // and the aura would render lighter and flatter than the authored anchors.
    const [r, g, b] = energyGlowColor(frame.energy);
    glowMat.color.setRGB(r, g, b, SRGBColorSpace);
  };

  const dispose = (): void => {
    geometry.dispose();
    shadowMat.dispose();
    glowMat.dispose();
  };

  return { group, update, dispose };
}
