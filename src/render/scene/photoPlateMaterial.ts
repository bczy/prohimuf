import { Color, ShaderMaterial, Vector2 } from "three";
import type { Texture } from "three";
import type { CoverWindows } from "@game/types/photoQte";
import { STOCK } from "@render/ui/print/tokens";

/**
 * The telephoto plate's material: the authored plate, cropped by UV, plus the headlight
 * sweep — the ONE visual allowed to project the sound cover (D-J / R3-2 / N-1).
 *
 * `lead-art` ruling (`docs/art-direction/gates/photo-qte-resolution-and-sweep-ruling.md`):
 * the sweep is **a luminance remap inside the plate's own fragment shader**, not an
 * additive quad and not baked into the plate.
 *   - baked ⇒ a static tell is not a tell;
 *   - additive quad ⇒ blows the blended-coverage budget AND breaks the glow law ("what
 *     glows is interactive") by lighting décor;
 *   - a quad "scoped to the passage mouth" ⇒ at the widest framing that rectangle exceeds
 *     the screen, so the scoped quad is full-screen exactly when the budget is tightest.
 *
 * So the band **burns the toner toward the paper white** instead of adding a blended
 * layer: zero extra draw call, zero added blended coverage, no second program — and it is
 * the truthful render, because a photocopier does not glow, it burns out.
 *
 * The burn is a **moving threshold on the halftone**: the screen dots SHRINK toward the
 * band's core, so the falloff is a dithered ramp, never a flat wash (form constraint of the
 * same ruling).
 *
 * Determinism: the band's position comes from `uSweepPhase`, which the bridge feeds from
 * the tick's `sceneClock`. **Never a wall clock** — `state.clock.elapsedTime` does not stop
 * on `paused`, does not freeze inside the frozen-scene block, and would make
 * `[ RECOMMENCER ]` non-reproducible on the only signal the player reads (D-J, F11/AC10).
 */

/** Half-width of the band in UV space — a soft-edged sweep, not a hard bar. */
export const SWEEP_HALF_WIDTH = 0.28;

/** Halftone grid density across the drawn frame (dots per UV unit). */
export const SWEEP_HALFTONE_GRID = 150;

/**
 * The band's centre in UV x for a sweep phase. The phase is a normalised 0..1 ramp from
 * the tick; the band travels from just off the left edge to just off the right one, so it
 * enters and leaves the frame instead of popping in at the border.
 */
export function sweepBandCentre(phase: number): number {
  if (!Number.isFinite(phase)) return -SWEEP_HALF_WIDTH;
  const clamped = Math.max(0, Math.min(1, phase));
  return -SWEEP_HALF_WIDTH + clamped * (1 + 2 * SWEEP_HALF_WIDTH);
}

/**
 * The band's normalised 0..1 travel at `sceneClock`, from the authored cover generator.
 *
 * Lane A did not project a `sweepPhase` on `PhotoSceneView` (the seam this lane asked for),
 * so the ramp is derived here from the two values the render already receives — the tick's
 * `sceneClock` and the authored `CoverWindows`. This states NO rule: WHETHER the band is
 * drawn is entirely `PhotoSceneView.headlightsLit` (the game's call, D-J/R3-2); this is only
 * WHERE it sits inside a window the game already opened. It stays a pure function of the
 * tick's own clock, so `[ RECOMMENCER ]` replays the sweep frame-identically (F11/AC10).
 */
export function sweepPhaseAt(cover: CoverWindows, sceneClock: number): number {
  if (!Number.isFinite(sceneClock) || !(cover.periodSeconds > 0) || !(cover.coverSeconds > 0)) {
    return 0;
  }
  const since = sceneClock - cover.firstOpenAt;
  if (since < 0) return 0;
  const intoWindow = since % cover.periodSeconds;
  return Math.max(0, Math.min(1, intoWindow / cover.coverSeconds));
}

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform sampler2D uMap;
uniform vec2 uOffset;
uniform vec2 uRepeat;
uniform float uHasMap;
uniform float uTint;
uniform float uSweep;       // 0 = no cover, 1 = the packet is passing
uniform float uSweepCentre; // band centre in UV x, from the tick's sceneClock
uniform float uHalfWidth;
uniform float uGrid;
uniform vec3 uPaper;

varying vec2 vUv;

void main() {
  vec2 uv = uOffset + vUv * uRepeat;
  vec3 plate = uHasMap > 0.5 ? texture2D(uMap, uv).rgb : uPaper * 0.5;
  plate *= uTint;

  // Soft-edged band, 1 at its core and 0 outside it.
  float band = 1.0 - smoothstep(0.0, uHalfWidth, abs(vUv.x - uSweepCentre));
  band *= uSweep;

  // Moving threshold on the halftone: the dots shrink toward the core of the band, so the
  // plate burns out to paper through a DITHERED ramp rather than a flat wash.
  vec2 cell = fract(vUv * uGrid) - 0.5;
  float dotRadius = length(cell) * 2.0;
  float keep = step(dotRadius, 1.0 - band * 0.92);
  vec3 burnt = mix(uPaper, plate, keep);

  gl_FragColor = vec4(mix(plate, burnt, band), 1.0);
}
`;

/** Uniform names the render writes each frame — named once so the writers cannot drift. */
export interface PlateUniforms {
  uMap: { value: Texture | null };
  uOffset: { value: Vector2 };
  uRepeat: { value: Vector2 };
  uHasMap: { value: number };
  uTint: { value: number };
  uSweep: { value: number };
  uSweepCentre: { value: number };
  uHalfWidth: { value: number };
  uGrid: { value: number };
  uPaper: { value: Color };
}

/** Builds the plate material. One program, one opaque draw, no blending. */
export function createPlateMaterial(): ShaderMaterial & { uniforms: PlateUniforms } {
  const material = new ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms: {
      uMap: { value: null },
      uOffset: { value: new Vector2(0, 0) },
      uRepeat: { value: new Vector2(1, 1) },
      uHasMap: { value: 0 },
      uTint: { value: 1 },
      uSweep: { value: 0 },
      uSweepCentre: { value: -SWEEP_HALF_WIDTH },
      uHalfWidth: { value: SWEEP_HALF_WIDTH },
      uGrid: { value: SWEEP_HALFTONE_GRID },
      uPaper: { value: new Color(STOCK.newsprint) },
    },
    depthTest: false,
    depthWrite: false,
    transparent: false,
  });
  return material as ShaderMaterial & { uniforms: PlateUniforms };
}

/** The fragment source, exposed so the no-wall-clock rule is assertable in a unit test. */
export const PLATE_FRAGMENT_SHADER = FRAGMENT_SHADER;
