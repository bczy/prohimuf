/**
 * The enemy neon rim shader (ADR-0025) — the codebase's first `ShaderMaterial`.
 *
 * ADR-0011 chose a CPU-baked additive silhouette for the vehicle rim and
 * explicitly deferred the 1-tap `ShaderMaterial` variant "until a live-hue
 * requirement actually exists". It now does: the enemy rim recolours every frame
 * from a heat ramp (green→orange→red as the enemy lingers). Re-baking the
 * silhouette per frame per colour would be wasteful, so we bake the SHAPE once in
 * white and let this shader multiply it by a live `uColor` uniform — recolour for
 * free. It samples the baked silhouette alpha ONCE (no multi-tap edge detect, no
 * derivatives, no loops) so it stays safe on the SwiftShader e2e publish gate.
 */
import { ShaderMaterial, AdditiveBlending, Color } from "three";
import type { Texture, IUniform } from "three";

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Single texture tap: RGB = live heat colour scaled by intensity, alpha = the
// baked gradient halo. AdditiveBlending turns the gradient alpha into a glow.
const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec4 t = texture2D(uMap, vUv);
    gl_FragColor = vec4(uColor * uIntensity, t.a * uOpacity);
  }
`;

/** Typed uniform handles so callers mutate them without index-signature churn. */
export interface EnemyRimUniforms {
  readonly uMap: IUniform<Texture | null>;
  readonly uColor: IUniform<Color>;
  readonly uOpacity: IUniform<number>;
  readonly uIntensity: IUniform<number>;
}

export interface EnemyRimMaterial {
  readonly material: ShaderMaterial;
  readonly uniforms: EnemyRimUniforms;
}

/**
 * Fresh rim material (one per {@link EnemySprite} instance). `uColor` is updated
 * per frame from the heat ramp; `uMap` is swapped to the current flipbook frame's
 * baked white silhouette. `uIntensity` is the brightness lever (bump it if the
 * rim needs to read stronger — one knob, not a palette fork). Returns the shared
 * uniforms object alongside the material so the caller has typed, non-optional
 * access.
 */
export function createEnemyRimMaterial(): EnemyRimMaterial {
  const uMap: IUniform<Texture | null> = { value: null };
  const uColor: IUniform<Color> = { value: new Color(1, 1, 1) };
  const uOpacity: IUniform<number> = { value: 1 };
  const uIntensity: IUniform<number> = { value: 1 };
  const material = new ShaderMaterial({
    // Object literal satisfies the constructor's `{ [k: string]: IUniform }`;
    // the returned handles alias the same uniform objects for typed access.
    uniforms: { uMap, uColor, uOpacity, uIntensity },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  return { material, uniforms: { uMap, uColor, uOpacity, uIntensity } };
}
