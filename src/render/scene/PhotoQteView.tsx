import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, Mesh, OrthographicCamera, Texture } from "three";
import type { PhotoSceneView, PlateExtent } from "@render/ui/photo/photoSeam";
import { STOCK } from "@render/ui/print/tokens";
import { bracketSegments, drawnPlateRegion, plateUvRect, projectBox } from "./photoFraming";
import { createPlateMaterial, sweepBandCentre } from "./photoPlateMaterial";

/**
 * The photo set-piece's full-screen TELEPHOTO surface (techplan §6 Lane B).
 *
 * It draws the authored plate, cropped to the viewfinder the tick produced, and the
 * three-state AF brackets at the tick's single evaluated `subjectBox` (D-C). Everything
 * here is READ off `view`:
 *   - no containment test, no fill computation, no verdict, no device fork;
 *   - the sway is not applied here — it is already inside `view.viewfinder`;
 *   - reduced motion is already in the tick's numbers (spec §3.4). **The render must not
 *     add a second reduced-motion branch**, and there is none in this file;
 *   - **no screen shake, ever** (spec §6.1): shake is indistinguishable from sway and
 *     would corrupt the only signal the player reads.
 *
 * PERF (perf-budget §9-10, `gpu-specialist`):
 *   - the crop is two UNIFORM writes per frame (`map.offset` / `map.repeat`), never a
 *     per-frame `CanvasTexture` re-crop — the 236 MB/s cliff Ben named;
 *   - the plate is ONE opaque draw covering the frame, so it REDUCES blended coverage;
 *   - the headlight sweep (`headlightsLit`, the only visual allowed to encode the sound
 *     cover — D-J / R3-2 / N-1) is a luminance remap INSIDE the plate's own fragment
 *     shader (`photoPlateMaterial.ts`, `lead-art` ruling): the toner burns to paper
 *     through a moving halftone threshold. Zero extra draw call, zero added blended
 *     coverage, no second program — and no glow on décor;
 *   - nothing here assumes a plate RESOLUTION — the texture is whatever art delivers.
 *
 * The world behind this surface is fully occluded and must be switched off by the caller
 * (`visible={false}` on the world group) while the set-piece holds the scene: this
 * component covers the frame, it cannot silence the graph behind it.
 */

/** The plate's resting tint — the un-swept toner level. */
const PLATE_TINT = 0.82;

/** How far in front of the camera the surface sits (still inside the ortho frustum). */
const SURFACE_DEPTH = 10;

export function PhotoQteView({
  view,
  plate,
  plateTexture,
  sweepPhase,
}: {
  /** The tick's projection. `null` whenever the set-piece is not drawing (no surface). */
  view: PhotoSceneView | null;
  /** The plate's extent in scene units — authored data, threaded, never a constant here. */
  plate: PlateExtent;
  /** The loaded plate texture, or `null` while it warms (the surface then draws flat). */
  plateTexture: Texture | null;
  /**
   * The headlight sweep's normalised 0..1 travel, from the tick's `sceneClock`.
   *
   * SEAM ASK to lane A: project this on `PhotoSceneView` (a pure function of `sceneClock`
   * and `spec.cover`, beside `headlightsLit`). It is a PROP here, never a wall clock and
   * never a render-side timer: `state.clock.elapsedTime` does not stop on `paused`, does
   * not freeze inside the frozen-scene block, and would make `[ RECOMMENCER ]` irreproducible
   * on the only signal the player reads (D-J, F11/AC10).
   */
  sweepPhase: number;
}): JSX.Element | null {
  const { camera, size } = useThree();
  const groupRef = useRef<Group | null>(null);
  const plateRef = useRef<Mesh | null>(null);
  const viewRef = useRef<PhotoSceneView | null>(view);
  viewRef.current = view;
  const sweepRef = useRef(sweepPhase);
  sweepRef.current = sweepPhase;

  // One material for the surface's lifetime: the crop, the tint and the sweep are UNIFORM
  // writes, never a rebuilt texture or a swapped program.
  const material = useMemo(() => createPlateMaterial(), []);
  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  useEffect(() => {
    material.uniforms.uMap.value = plateTexture;
    material.uniforms.uHasMap.value = plateTexture === null ? 0 : 1;
  }, [material, plateTexture]);

  // The brackets are eight (or sixteen, when dashed) flat quads. Their COUNT changes with
  // the state, so they are drawn declaratively from the projected geometry rather than
  // mutated in place — a handful of quads, re-issued only when React re-renders.
  const brackets = useMemo(() => {
    if (view?.posture !== "RAISED") return [];
    const region = drawnPlateRegion(view, plate);
    return bracketSegments(projectBox(view.subjectBox, region), view.bracket);
  }, [view, plate]);

  useFrame(() => {
    const current = viewRef.current;
    const group = groupRef.current;
    if (current === null || group === null) return;

    // Sit on the camera so the surface fills the frame whatever the ortho pan/zoom is.
    const ortho = camera as OrthographicCamera;
    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;
    group.position.set(camera.position.x, camera.position.y, SURFACE_DEPTH);
    group.scale.set(viewW, viewH, 1);

    // The whole telephoto crop, in two uniform writes (never a texture rebuild).
    const uv = plateUvRect(drawnPlateRegion(current, plate), plate);
    material.uniforms.uOffset.value.set(uv.offsetX, uv.offsetY);
    material.uniforms.uRepeat.value.set(uv.repeatX, uv.repeatY);
    material.uniforms.uTint.value = PLATE_TINT;
    // The band exists only while the packet's headlights rake the passage mouth, and its
    // position is the tick's, never a render clock.
    material.uniforms.uSweep.value = current.headlightsLit ? 1 : 0;
    material.uniforms.uSweepCentre.value = sweepBandCentre(sweepRef.current);
  });

  if (view === null) return null;

  return (
    <group ref={groupRef} renderOrder={1000}>
      {/* The plate — one opaque, depth-test-free draw over the frozen world. */}
      <mesh ref={plateRef} renderOrder={1000} material={material}>
        <planeGeometry args={[1, 1]} />
      </mesh>

      {/* AF brackets — normalised frame space (y-DOWN) mapped onto the unit quad. */}
      {brackets.map((seg, i) => (
        <mesh
          key={`bracket-${String(i)}`}
          renderOrder={1001}
          position={[seg.x + seg.w / 2 - 0.5, 0.5 - (seg.y + seg.h / 2), 0.01]}
          scale={[seg.w, seg.h, 1]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color={STOCK.shell}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
