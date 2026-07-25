// GLSL sources for the CRT composite (ADR-0031). Four passes, all derivative-free
// (no dFdx/dFdy) so the graph compiles+renders on SwiftShader — the publish gate
// (ADR-0025). Colour management: intermediate render targets hold LINEAR values
// (three writes LinearSRGBColorSpace to non-XR targets in r0.175), so bright-pass
// and blur work in linear and the composite does the single linear→sRGB encode
// itself, replicating three's sRGBTransferOETF exactly. Note this is NOT byte-
// identical to the direct 8-bit-sRGB pipeline: the intermediate RTs store 8-bit
// LINEAR, which quantizes the dark tones, so pass-through pixels can band slightly
// in deep shadows versus the non-CRT path (§8 constraint / P2). A HalfFloat
// intermediate would remove the banding and is the planned follow-up — ADR-0031
// pre-authorizes it behind the SwiftShader gate.

// Fullscreen triangle. ShaderMaterial injects `position`/`uv`; we output clip
// space straight from position so no projection/view matrices are needed.
export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// Bright-pass, keyed on SATURATION × BRIGHTNESS — a pixel must be BOTH saturated
// AND bright to bloom. Saturation alone (the old key) blooms the colored level
// backdrops: rue Belliard's blue facade + orange windows are ~all saturated, so a
// blurred copy of nearly the whole frame gets added back → global vaseline haze.
// Adding a brightness gate (HSV value, i.e. the max channel, in linear light)
// rejects the mid-tone facade walls and dim windows and keeps only genuinely
// glowing highlights — lit window cores, neon rims. White paper/linework stays
// rejected by the saturation gate (chroma ≈ 0), so P3 (paper never blooms) holds.
export const BRIGHT_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform float uThreshold;      // saturation gate
uniform float uKnee;           // saturation soft-knee width
uniform float uBrightness;     // brightness gate (HSV value / max channel)
uniform float uBrightnessKnee; // brightness soft-knee width
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  float mx = max(max(c.r, c.g), c.b);          // HSV value / brightness
  float mn = min(min(c.r, c.g), c.b);
  float chroma = mx - mn;
  float sat = chroma / max(mx, 1e-4);          // HSV saturation; safe on black
  float satKey = smoothstep(uThreshold, uThreshold + uKnee, sat);
  float brightKey = smoothstep(uBrightness, uBrightness + uBrightnessKnee, mx);
  float key = satKey * brightKey;              // must be saturated AND bright
  gl_FragColor = vec4(c * key, 1.0);           // hue preserved, gated
}
`;

// Separable 9-tap blur (weights sum to 1). Run once per axis via uDir; radius is
// carried in uDir (texel step × radius). Small radius ⇒ a 1–2px halo, not a mip
// pyramid.
export const BLUR_FRAG = /* glsl */ `
uniform sampler2D tInput;
uniform vec2 uDir; // per-tap step along one axis, in UV space
varying vec2 vUv;
void main() {
  vec3 sum = vec3(0.0);
  sum += texture2D(tInput, vUv + uDir * -4.0).rgb * 0.05;
  sum += texture2D(tInput, vUv + uDir * -3.0).rgb * 0.09;
  sum += texture2D(tInput, vUv + uDir * -2.0).rgb * 0.12;
  sum += texture2D(tInput, vUv + uDir * -1.0).rgb * 0.15;
  sum += texture2D(tInput, vUv).rgb              * 0.18;
  sum += texture2D(tInput, vUv + uDir *  1.0).rgb * 0.15;
  sum += texture2D(tInput, vUv + uDir *  2.0).rgb * 0.12;
  sum += texture2D(tInput, vUv + uDir *  3.0).rgb * 0.09;
  sum += texture2D(tInput, vUv + uDir *  4.0).rgb * 0.05;
  gl_FragColor = vec4(sum, 1.0);
}
`;

// Composite → screen. Adds the neon halo (linear add), then scanlines, feathered
// vignette, slow luminance breathe (flicker) and fine grain — all subtle (§8.2).
// Encodes linear→sRGB with three's exact OETF so untouched pixels are byte-equal
// to the canvas' own output; grain/flicker are driven by uTime (frozen under
// reduced motion, so a static uTime yields a static, strobe-free frame).
export const COMPOSITE_FRAG = /* glsl */ `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBloomStrength;
uniform float uScanlineDarkening;
uniform float uScanlinePeriod; // device px per comb line (CSS-locked: N CSS px × dpr)
uniform float uScanlineScroll; // VHS travel offset, device px (0 = static comb)
uniform float uVignette;
uniform float uGrain;
uniform float uFlicker;
varying vec2 vUv;

// three.js sRGBTransferOETF, replicated verbatim (build r0.175) so the round-trip
// through the composite is byte-identical to three's own canvas encode.
vec3 encodeSRGB(vec3 c) {
  vec3 lo = c * 12.92;
  vec3 hi = pow(c, vec3(0.41666)) * 1.055 - 0.055;
  return mix(hi, lo, vec3(lessThanEqual(c, vec3(0.0031308))));
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  vec3 scene = texture2D(tScene, vUv).rgb; // linear
  vec3 bloom = texture2D(tBloom, vUv).rgb; // linear

  // 1–2px hue-preserving neon halo — colored light adds in linear (loi du glow).
  vec3 col = scene + bloom * uBloomStrength;

  // Scanlines: horizontal luminance comb (the "télé cathodique" tell). Period is
  // fed in DEVICE px but derived from CSS px × devicePixelRatio, so the line
  // spacing a viewer sees is identical on 1x and retina/4K displays — a fixed
  // device period melts into invisibility at dpr ≥ 2. The squared profile narrows
  // the trough into a crisp dark line and leaves the rows between at full
  // brightness (readability), instead of a soft sinusoid that averages flat.
  // VHS travel: SUBTRACTING the offset shifts the comb toward larger y, and
  // gl_FragCoord.y grows upward, so a growing offset makes the scan climb — « le
  // scan remonte ». The offset is wrapped on the period host-side, so this stays
  // exactly the old static comb whenever uScanlineScroll is 0 (toggle OFF,
  // reduced motion, paused): byte-identical, no branch.
  float phase =
    0.5 - 0.5 * cos((gl_FragCoord.y - uScanlineScroll) * (6.28318531 / uScanlinePeriod));
  float line = phase * phase;
  col *= 1.0 - uScanlineDarkening * line;

  // Vignette: feathered corner darkening, no hard ring (corner ≈ uVignette).
  float r = length(vUv - 0.5) * 1.41421356;
  col *= 1.0 - uVignette * smoothstep(0.5, 1.0, r);

  // Slow luminance breathe — sub-perceptual, never rhythmic enough to strobe.
  col *= 1.0 + uFlicker * sin(uTime * 3.0);

  // Fine animated toner speckle.
  float g = hash(vUv * uResolution + uTime);
  col += (g - 0.5) * uGrain;

  gl_FragColor = vec4(encodeSRGB(clamp(col, 0.0, 1.0)), 1.0);
}
`;
