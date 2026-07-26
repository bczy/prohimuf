import { Group, Mesh, MeshBasicMaterial, NormalBlending, PlaneGeometry } from "three";
import { createEnemyRimMaterial } from "@render/scene/enemyRimMaterial";
import type { EnemyRim } from "@render/scene/enemyTextures";
import { energyGlowColor } from "./energyGlow";
import { getRadialGlowTexture } from "./radialGlowTexture";

/**
 * Per-entity contact shadow + energy RIM, driven from ONE `update()` the host calls
 * inside the useFrame it already runs (so the aura can never lag its sprite by a
 * frame, which a sibling component's own useFrame would risk depending on
 * subscription order).
 *
 *  - CONTACT SHADOW: the radial sprite squashed into a low ellipse under the
 *    entity's feet, NormalBlending and neutral ink-black. It REMOVES light and
 *    stops the cut-out figure floating — a paste-up casts a shadow. Cleared at the
 *    art gate (2026-07-25, verdict 3b PASS, proposed bible rule G4). Untouched.
 *  - ENERGY RIM: the entity's own silhouette, re-coloured by {@link energyGlowColor}.
 *
 * The rim REPLACES the first cut's additive disc, which the composite gate FAILED:
 * a disc behind a narrow figure is only occluded where the figure is, so its core
 * escaped above the head, between the legs and below the feet, pooling onto the
 * road as a green ellipse with no source, clipping the pavement to v=1.00 (an
 * aplat — §2.1) and tinting a B&W shutter to s=0.33. Measured: 7.73 % of the world
 * area in one contiguous 430×454 px block, versus 1.77 % for an entire Belliard
 * street. A silhouette rim is structurally incapable of any of that — it exists
 * only in the band `marginPx` outward from the sprite's own alpha edge, so the
 * falloff is back to neutral before it reaches the ground or the décor.
 *
 * The machinery is the ADR-0025 enemy rim's, reused verbatim: `getSilhouetteFor`
 * bakes the shape ONCE in white with a quadratic outward alpha falloff
 * (`applyHaloFalloff`), and `createEnemyRimMaterial`'s 1-tap shader multiplies it by
 * a live colour — so re-colouring per frame is free and no per-frame bake happens.
 * Layer 0, so it rides the CRT composite's world pass; no new pass, no new target.
 */

/**
 * Rim brightness. Deliberately BELOW the ADR-0025 hostile rim's 1.0: that rim is an
 * interaction signal (« your window to shoot is closing ») and must stay the loudest
 * rim on screen. This one is an ambient state read layered on entities that already
 * carry their own stance tint.
 */
const RIM_INTENSITY = 0.9;
/** Additive alpha scale on top of the baked falloff. */
const RIM_OPACITY = 0.85;

/** Shadow footprint: near the sprite's width, and a flat ellipse in height. */
const SHADOW_W_SCALE = 0.9;
const SHADOW_H_SCALE = 0.2;
/** How far the shadow's centre sits below the sprite's centre, in sprite heights. */
const SHADOW_DROP = 0.46;
const SHADOW_OPACITY = 0.45;
const SHADOW_COLOUR = "#07070a";

export interface EntityAuraOptions {
  /** Sorting band. Pass one BELOW the host sprite's so the rim can never draw over
   *  the body it traces — the interior of the silhouette is opaque in the bake. */
  readonly renderOrder: number;
  /** Rim z — pass BEHIND the sprite, so the body covers the silhouette's interior
   *  and only the outward margin shows. */
  readonly rimZ: number;
  /** Shadow z — behind the rim; it is ground, not light. */
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
  /** `GameState.energy` (0..100): the rim hue, green → amber → red. */
  readonly energy: number;
  /**
   * The entity's baked silhouette (`getSilhouetteFor(currentTexture)`), or `null`
   * when none is available yet — an async sprite still loading, or a procedurally
   * drawn `CanvasTexture` (the bake needs an `HTMLImageElement`). Null hides the
   * RIM only; the contact shadow still draws, so the entity never floats.
   */
  readonly silhouette: EnemyRim | null;
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
  silhouette: null,
};

export interface EntityAura {
  /** Mount with `<primitive object={aura.group} />`. */
  readonly group: Group;
  update(frame: EntityAuraFrame): void;
  dispose(): void;
}

/**
 * Build one aura. Geometry is per-aura (a unit plane, scaled per frame) and the
 * materials are private, so hosts can hold several without sharing state. Returns a
 * hidden aura: nothing draws until the first `update()` with `visible: true`.
 */
export function createEntityAura(opts: EntityAuraOptions): EntityAura {
  const group = new Group();
  group.visible = false;

  const geometry = new PlaneGeometry(1, 1);

  const shadowMat = new MeshBasicMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    opacity: SHADOW_OPACITY,
  });
  shadowMat.color.set(SHADOW_COLOUR);
  const shadowMap = getRadialGlowTexture();
  if (shadowMap !== null) shadowMat.map = shadowMap;

  const rim = createEnemyRimMaterial();
  rim.uniforms.uIntensity.value = RIM_INTENSITY;
  rim.uniforms.uOpacity.value = RIM_OPACITY;

  const shadowMesh = new Mesh(geometry, shadowMat);
  shadowMesh.renderOrder = opts.renderOrder;
  const rimMesh = new Mesh(geometry, rim.material);
  rimMesh.renderOrder = opts.renderOrder;
  rimMesh.visible = false;
  group.add(shadowMesh, rimMesh);

  const update = (frame: EntityAuraFrame): void => {
    group.visible = frame.visible;
    if (!frame.visible) return;

    shadowMesh.position.set(frame.x, frame.y - frame.height * SHADOW_DROP, opts.shadowZ);
    shadowMesh.scale.set(frame.width * SHADOW_W_SCALE, frame.height * SHADOW_H_SCALE, 1);

    const silhouette = frame.silhouette;
    rimMesh.visible = silhouette !== null;
    if (silhouette === null) return;

    rim.uniforms.uMap.value = silhouette.texture;
    // The bake pads the source by `marginPx` on every side, so the padded texture
    // covers a slightly larger area than the sprite. Grow the plane by exactly that
    // ratio and the baked falloff band lands OUTSIDE the sprite's own footprint —
    // the rim is `marginPx` wide and nothing beyond it is ever touched.
    const padX = silhouette.srcW > 0 ? (2 * silhouette.marginPx) / silhouette.srcW : 0;
    const padY = silhouette.srcH > 0 ? (2 * silhouette.marginPx) / silhouette.srcH : 0;
    rimMesh.position.set(frame.x, frame.y, opts.rimZ);
    rimMesh.scale.set(frame.width * (1 + padX), frame.height * (1 + padY), 1);

    // The ramp's channels come from sRGB hex; the shader multiplies this colour
    // straight into the fragment, exactly like the ADR-0025 rim, so the uniform is
    // written raw (no colour-space conversion) — same path, same look.
    const [r, g, b] = energyGlowColor(frame.energy);
    const col = rim.uniforms.uColor.value;
    col.r = r;
    col.g = g;
    col.b = b;
  };

  const dispose = (): void => {
    geometry.dispose();
    shadowMat.dispose();
    rim.material.dispose();
  };

  return { group, update, dispose };
}
