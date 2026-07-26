import { CanvasTexture } from "three";
import type { Texture } from "three";

/**
 * Shared white radial-gradient sprite (opaque core → transparent edge), built once
 * per session and reused by every additive glow quad added for the street-graphics
 * effects (acid neon signage, entity energy auras).
 *
 * White on purpose: consumers tint it through `material.color`, so ONE texture
 * serves every hue instead of one canvas per colour. Under `AdditiveBlending` the
 * result is `color × alpha` — a true dégradé (loi du glow), never an aplat.
 *
 * The core plateau (opaque out to 22% of the radius) is what makes the centre
 * clear the CRT bright-pass gate (`bloomThreshold` × `bloomBrightness`, see
 * `crtParams.ts`): a pure falloff-from-the-first-texel gradient peaks on a single
 * texel and is averaged away by the half/quarter-res bright pass.
 *
 * Returns `null` in a DOM-free environment (unit tests / SSR); callers already
 * treat a null map as "no glow", mirroring `ImpactEffects`' texture getters.
 */
let glowTexture: Texture | null = null;

export function getRadialGlowTexture(): Texture | null {
  if (glowTexture !== null) return glowTexture;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.22, "rgba(255,255,255,1)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.38)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTexture = new CanvasTexture(c);
  return glowTexture;
}
