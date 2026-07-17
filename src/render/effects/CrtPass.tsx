import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Camera,
  LinearFilter,
  Mesh,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
} from "three";
import type { Texture } from "three";
import { deriveCrtParams } from "./crtParams";
import type { CrtTier } from "./crtParams";
import { CRT_OVERLAY_LAYER } from "./crtLayers";
import { BLUR_FRAG, BRIGHT_FRAG, COMPOSITE_FRAG, FULLSCREEN_VERT } from "./crtShaders";

// Strength of the additive neon halo in the composite. Not a per-tier param
// (§8 keeps the look identical across tiers); kept local to the pass. Tuned down
// from 0.9 → the un-bloomed frame stays pixel-sharp; only lit cores gain a halo.
const BLOOM_STRENGTH = 0.45;
// Soft-knee width above the saturation gate — rejects near-neutral pixels cleanly.
const SATURATION_KNEE = 0.15;
// Scanline spacing in CSS pixels — multiplied by devicePixelRatio before it
// reaches the shader so the visible line pitch is display-independent. 4 gives
// the chunky late-90s tube read Bertrand asked for (3 was still too discreet).
const SCANLINE_PERIOD_CSS = 4;
// Soft-knee width above the brightness gate — feathers the mid-tone → glow cutoff.
const BRIGHTNESS_KNEE = 0.2;
// Upper bound for the accumulated frame clock (G). The luminance breathe is
// sin(uTime * 3.0), period 2π/3 s, so wrapping at an integer multiple of that
// period keeps the modulo phase-continuous for the breathe; the grain is noise, so
// its reset is imperceptible. K = 900 ⇒ ≈ 31 min, well inside the 60–3600 s band.
const FLICKER_TIME_WRAP = ((2 * Math.PI) / 3) * 900;

/**
 * Hand-rolled fullscreen CRT composite (ADR-0031). Mounted only when the `crt`
 * pref is ON; when absent the pipeline auto-renders untouched (AC3). Takes over
 * the frame via a positive-priority useFrame (disables R3F's internal render) and
 * runs a four-pass graph — world→sceneRT, saturation×brightness bright-pass, half/quarter-res
 * separable blur, composite to screen — then draws the crosshair overlay layer
 * flat and unprocessed above it (P4). Colour path (§8): the intermediate targets
 * are 8-bit LINEAR (RGBA8/UnsignedByte) and the composite does the single
 * linear→sRGB encode. This is NOT byte-identical to the direct 8-bit-sRGB
 * pipeline: storing linear light in 8 bits quantizes the dark tones, so deep
 * shadows can band slightly versus the non-CRT path. A HalfFloat intermediate
 * would remove that and is the planned follow-up (ADR-0031 pre-authorizes it
 * behind the SwiftShader gate). No HDR is otherwise needed for a 1–2px halo.
 */
export function CrtPass({
  tier,
  paused = false,
}: {
  tier: CrtTier;
  paused?: boolean;
}): JSX.Element | null {
  const { size } = useThree();
  // Live device-pixel-ratio (P?/D): subscribing to viewport.dpr makes the RT-size
  // effect re-run on a dpr change that arrives without a CSS resize, so the render
  // targets and the CSS-locked scanline period track the real drawing buffer.
  const dpr = useThree((s) => s.viewport.dpr);

  // Render-side reduced-motion detection (P6): freezes the animated grain/flicker
  // (a display concern, not a pref field). Reacts to live OS-setting changes.
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (): void => {
      setReducedMotion(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const params = useMemo(() => deriveCrtParams(tier, reducedMotion), [tier, reducedMotion]);

  // Offscreen targets. sceneRT keeps a depth buffer so depth-tested draws behave
  // exactly as on the canvas; the bright/blur chain is colour-only. RGBA8/byte.
  const rts = useMemo(() => {
    const opts = {
      format: RGBAFormat,
      type: UnsignedByteType,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    } as const;
    return {
      scene: new WebGLRenderTarget(1, 1, { ...opts, depthBuffer: true }),
      bright: new WebGLRenderTarget(1, 1, { ...opts, depthBuffer: false }),
      blurTmp: new WebGLRenderTarget(1, 1, { ...opts, depthBuffer: false }),
      blur: new WebGLRenderTarget(1, 1, { ...opts, depthBuffer: false }),
    };
  }, []);

  // One fullscreen triangle reused across passes; the material is swapped per pass.
  const quad = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute(
      "position",
      new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    geom.setAttribute("uv", new BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    const mesh = new Mesh(geom);
    mesh.frustumCulled = false;
    const scene = new Scene();
    scene.add(mesh);
    return { geom, mesh, scene, camera: new Camera() };
  }, []);

  // Uniform objects are held with concrete types (not read back off the
  // ShaderMaterial's string-indexed `uniforms` record, which is `T | undefined`
  // under noUncheckedIndexedAccess). The materials share these exact references.
  const brightU = useMemo(
    () => ({
      tScene: { value: null as Texture | null },
      uThreshold: { value: 0 },
      uKnee: { value: SATURATION_KNEE },
      uBrightness: { value: 0 },
      uBrightnessKnee: { value: BRIGHTNESS_KNEE },
    }),
    [],
  );
  const blurU = useMemo(
    () => ({
      tInput: { value: null as Texture | null },
      uDir: { value: new Vector2() },
    }),
    [],
  );
  const compositeU = useMemo(
    () => ({
      tScene: { value: null as Texture | null },
      tBloom: { value: null as Texture | null },
      uResolution: { value: new Vector2(1, 1) },
      uScanlinePeriod: { value: SCANLINE_PERIOD_CSS },
      uTime: { value: 0 },
      uBloomStrength: { value: BLOOM_STRENGTH },
      uScanlineDarkening: { value: 0 },
      uVignette: { value: 0 },
      uGrain: { value: 0 },
      uFlicker: { value: 0 },
    }),
    [],
  );

  const brightMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: BRIGHT_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: brightU,
      }),
    [brightU],
  );

  const blurMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: BLUR_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: blurU,
      }),
    [blurU],
  );

  const compositeMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: FULLSCREEN_VERT,
        fragmentShader: COMPOSITE_FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: compositeU,
      }),
    [compositeU],
  );

  // Push static/tier params into the uniforms whenever they change.
  useEffect(() => {
    brightU.uThreshold.value = params.bloomThreshold;
    brightU.uBrightness.value = params.bloomBrightness;
    compositeU.uScanlineDarkening.value = params.scanlineDarkening;
    compositeU.uVignette.value = params.vignetteStrength;
    compositeU.uGrain.value = params.grainOpacity;
    compositeU.uFlicker.value = params.flickerAmplitude;
  }, [params, brightU, compositeU]);

  // Shared RT-resize: sceneRT at full drawing-buffer resolution, the bright/blur
  // chain scaled by resScale, and the CSS-locked scanline period rescaled by dpr.
  // Used both by the resize effect and the first-frame safety check (H) so the two
  // can never drift apart.
  const resizeTargets = useCallback(
    (w: number, h: number, ratio: number) => {
      const bw = Math.max(1, Math.floor(w * params.resScale));
      const bh = Math.max(1, Math.floor(h * params.resScale));
      rts.scene.setSize(w, h);
      rts.bright.setSize(bw, bh);
      rts.blurTmp.setSize(bw, bh);
      rts.blur.setSize(bw, bh);
      compositeU.uResolution.value.set(w, h);
      compositeU.uScanlinePeriod.value = SCANLINE_PERIOD_CSS * ratio;
    },
    [params.resScale, rts, compositeU],
  );

  // Resize targets to the drawing buffer (full for sceneRT, scaled for the chain).
  // Keyed on the live dpr so a device-pixel-ratio change without a CSS resize still
  // re-sizes the RTs and the scanline period (D).
  useEffect(() => {
    const w = Math.max(1, Math.floor(size.width * dpr));
    const h = Math.max(1, Math.floor(size.height * dpr));
    resizeTargets(w, h, dpr);
  }, [size.width, size.height, dpr, resizeTargets]);

  // Dispose GPU resources on unmount (toggle OFF / scene teardown).
  useEffect(() => {
    return () => {
      rts.scene.dispose();
      rts.bright.dispose();
      rts.blurTmp.dispose();
      rts.blur.dispose();
      quad.geom.dispose();
      brightMat.dispose();
      blurMat.dispose();
      compositeMat.dispose();
    };
  }, [rts, quad, brightMat, blurMat, compositeMat]);

  const timeRef = useRef(0);
  // Scratch vector for reading the renderer's drawing-buffer size in-frame (H).
  const drawBufferSize = useMemo(() => new Vector2(), []);

  // Priority 1 ⇒ takes over rendering. Runs after all default-priority useFrames
  // (camera scroll, gameplay meshes, crosshair position), so state is settled.
  useFrame((state, delta) => {
    // Freeze the animated grain/flicker clock under reduced motion (P6) or while
    // paused (F). The wrap keeps the accumulator bounded at an exact multiple of
    // the flicker period so the modulo never introduces a breathe phase jump (G).
    if (!reducedMotion && !paused) {
      timeRef.current = (timeRef.current + delta) % FLICKER_TIME_WRAP;
    }
    const renderer = state.gl;
    const worldScene = state.scene;
    const camera = state.camera;

    // First-frame / late-resize safety (H): if the RTs don't match the current
    // drawing buffer (e.g. the effect has not run yet on frame 0), resize now with
    // the same helper so the first composited frame is at the correct resolution.
    renderer.getDrawingBufferSize(drawBufferSize);
    const dbw = Math.max(1, Math.floor(drawBufferSize.x));
    const dbh = Math.max(1, Math.floor(drawBufferSize.y));
    if (rts.scene.width !== dbw || rts.scene.height !== dbh) {
      resizeTargets(dbw, dbh, dpr);
    }

    const prevTarget = renderer.getRenderTarget();
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = true;

    // Save the camera's layer mask so the two explicit-layer passes below (world =
    // layer 0, overlay = CRT_OVERLAY_LAYER) restore it exactly afterwards, rather
    // than assuming the frame began on layer 0 or hard-resetting to it (L).
    const savedLayerMask = camera.layers.mask;

    // 1. World (layer 0) → sceneRT. The crosshair lives on CRT_OVERLAY_LAYER, which
    //    the world pass excludes so it is kept out of the composite.
    camera.layers.set(0);
    renderer.setRenderTarget(rts.scene);
    renderer.render(worldScene, camera);

    // 2. Saturation×brightness bright-pass → bright (scaled res).
    quad.mesh.material = brightMat;
    brightU.tScene.value = rts.scene.texture;
    renderer.setRenderTarget(rts.bright);
    renderer.render(quad.scene, quad.camera);

    // 3. Separable blur: H (bright → blurTmp) then V (blurTmp → blur).
    const radius = params.bloomRadiusPx;
    quad.mesh.material = blurMat;
    blurU.tInput.value = rts.bright.texture;
    blurU.uDir.value.set(radius / rts.bright.width, 0);
    renderer.setRenderTarget(rts.blurTmp);
    renderer.render(quad.scene, quad.camera);

    blurU.tInput.value = rts.blurTmp.texture;
    blurU.uDir.value.set(0, radius / rts.blur.height);
    renderer.setRenderTarget(rts.blur);
    renderer.render(quad.scene, quad.camera);

    // 4. Composite → screen.
    quad.mesh.material = compositeMat;
    compositeU.tScene.value = rts.scene.texture;
    compositeU.tBloom.value = rts.blur.texture;
    compositeU.uTime.value = timeRef.current;
    renderer.setRenderTarget(null);
    renderer.render(quad.scene, quad.camera);

    // 5. Crosshair overlay: draw the overlay layer flat, above the composite, with
    //    no clear — pixel-sharp, aim 1:1 (P4). Restore the camera layer mask after.
    renderer.autoClear = false;
    camera.layers.set(CRT_OVERLAY_LAYER);
    renderer.render(worldScene, camera);
    camera.layers.mask = savedLayerMask;

    renderer.autoClear = prevAutoClear;
    renderer.setRenderTarget(prevTarget);
  }, 1);

  return null;
}
