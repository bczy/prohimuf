// Pure, Three-free derivation of the CRT composite's per-tier intensity constants
// (ADR-0031; art-direction §8.2). Co-located with a vitest spec, mirroring the
// markRing.ts precedent, so the two testable invariants — lite cost ≤ full, and
// reduced-motion zeroing the animated amplitudes — are locked in-PR without a
// live R3F scene. Everything qualitative (bloom look, hue preservation, halo
// falloff, no-strobe feel) is verify-skill screenshot territory (Gate 4, P1–P7).

export type CrtTier = "full" | "lite";

export interface CrtParams {
  /** Saturation/chroma gate above which a pixel MAY bloom (0..1). ANDed with
   *  bloomBrightness: a pixel must be both saturated AND bright to bloom. The
   *  saturation gate alone rejects white paper/linework (chroma ≈ 0) so P3 holds. */
  readonly bloomThreshold: number;
  /** Brightness gate (HSV value / max channel, linear light) above which a pixel
   *  MAY bloom (0..1). ANDed with bloomThreshold: rejects the mid-tone colored
   *  facades/dim windows that saturation alone would haze the whole frame with,
   *  keeping only lit window cores + neon. Raise it if the facade blooms. */
  readonly bloomBrightness: number;
  /** Separable-blur radius, in bright-pass texels — a 1–2 sprite-pixel halo. */
  readonly bloomRadiusPx: number;
  /** Max horizontal scanline darkening on the comb trough (0.55 = 55%: the
   *  load-bearing "télé cathodique" tell, owner-tuned to be legible even in a
   *  still — §8.2, revised 2026-07-16 / ADR-0031 amendment). */
  readonly scanlineDarkening: number;
  /** Corner vignette darkening (~10–15%, §8.2). */
  readonly vignetteStrength: number;
  /** Toner-grain opacity (fine, low; zeroed under reduced motion). */
  readonly grainOpacity: number;
  /** Slow luminance-breathe amplitude (single-digit %; zeroed under reduced
   *  motion). Never rhythmic/strobe (§8.4 constraint 5). */
  readonly flickerAmplitude: number;
  /** Bright-pass/blur render-target scale vs the full framebuffer (perf lever). */
  readonly resScale: number;
}

// Base constants shared by both tiers — the static look is identical desktop and
// mobile; only the perf levers (resScale, blur radius) differ. Bloom is gated on
// saturation × brightness so only lit window cores + neon bloom (not the mid-tone
// colored facades). Scanlines carry the load-bearing CRT tell (0.55 / 55% trough,
// owner-tuned legible — §8.2); vignette ~10–15%, bloom halo 1–2 sprite-px, flicker
// single-digit %, grain fine/low (0.03 ceiling).
const BASE = {
  bloomThreshold: 0.25,
  bloomBrightness: 0.55,
  // 0.55 / 0.03: tuned across playtests — Bertrand wants the CRT read unmistakable
  // (0.28 was invisible, 0.45 still too discreet), and grain above ~0.03
  // perceptually drowns the comb even when measurably present.
  scanlineDarkening: 0.55,
  vignetteStrength: 0.12,
  grainOpacity: 0.03,
  flickerAmplitude: 0.03,
} as const;

// Per-tier perf levers. Lite (mobile, ADR-0003) runs the bright/blur chain at
// quarter-res with a tighter radius so it is strictly cheaper than full — the
// invariant the spec asserts and the toggle is the escape hatch below even lite.
const TIER: Record<CrtTier, { resScale: number; bloomRadiusPx: number }> = {
  full: { resScale: 0.5, bloomRadiusPx: 2 },
  lite: { resScale: 0.25, bloomRadiusPx: 1.5 },
};

/**
 * Derive the CRT intensity constants for a quality tier, applying the
 * reduced-motion accessibility gate (art gate P6 / §8.4 constraint 5): a
 * `prefers-reduced-motion` viewer gets a fully static frame — both the animated
 * amplitudes (grain speckle + luminance breathe) are zeroed, leaving only the
 * static scanline/vignette/bloom.
 */
export function deriveCrtParams(tier: CrtTier, reducedMotion: boolean): CrtParams {
  const { resScale, bloomRadiusPx } = TIER[tier];
  return {
    bloomThreshold: BASE.bloomThreshold,
    bloomBrightness: BASE.bloomBrightness,
    bloomRadiusPx,
    scanlineDarkening: BASE.scanlineDarkening,
    vignetteStrength: BASE.vignetteStrength,
    grainOpacity: reducedMotion ? 0 : BASE.grainOpacity,
    flickerAmplitude: reducedMotion ? 0 : BASE.flickerAmplitude,
    resScale,
  };
}
