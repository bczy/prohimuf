import type { JSX } from "react";
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Group, MeshBasicMaterial } from "three";
import { getBackdropLayout, getNearForeground } from "@game/levels/levelArt";
import type { NearForegroundObject } from "@game/levels/levelArt";
import { deriveNearParallaxFactor, nearForegroundBandTop } from "./nearParallax";
import { NEAR_KIND_SPECS, type NearKindSpec } from "./nearForegroundArt";
import {
  getNearForegroundTexture,
  getTrafficLightOverlayTexture,
  updateTrafficLightSignal,
} from "./nearForegroundTextures";
import { DEFAULT_SIGNAL, signalKey, trafficSignalPhase } from "./trafficSignal";

// The flat facade art has a single pavement at the bottom, so BOTH rows stand on
// the same ground line (facade-normalized, y-down) — any vertical offset floats a
// prop in mid-shopfront. Props are anchored on the ground line and grown up to —
// never past — the band top, so short props stand on the pavement and none reaches
// a window row (non-occlusion). Depth
// comes purely from the far row's smaller scale + slower parallax + being drawn
// behind. Tall "pole" props (lamppost, traffic light, sign) live in the NEAR row
// where they are big and their base reads; the FAR row carries only low, chunky,
// self-grounding props (bollard, bench, Wallace, scooter) that never float small.
// Near row anchored ON the ground texture's bottom pavement (Bertrand-directed,
// 2026-07-20): the v6 ground puts the near kerb at ~1.215 of facadeH, so prop
// feet sit on the pavement band (1.215–1.284) and masts run up across the road.
// The line is now tied to the visible pavement, identical on all devices — the
// earlier mobile-only extra drop is gone.
const NEAR_STREET_LINE = 1.27;
const FAR_STREET_LINE = 0.93;
const MOBILE_NEAR_LINE_DROP = 0;
// Perspective scaling per row: the NEAR row is zoomed up (close to the camera,
// in-your-face), the FAR row shrunk (back of the road). Both stay capped at the
// band top (non-occlusion), so a zoomed near prop fills the band without ever
// crossing a window row. The far row also drifts slower than the near row.
const NEAR_SCALE = 1.3;
const FAR_SCALE = 0.72;
// Absolute height cap (world units): even on levels whose windows sit high (a tall
// street→window band), props stay a believable size — a short readable pole
// instead of a floor-to-window mast whose dark shaft vanishes and reads as floating.
const MAX_PROP_WORLD_H = 4.5;
// The far (back-of-road) row drifts only a little faster than the facade, the near
// row much faster — so the two rows clearly separate in depth as the camera pans.
const FAR_PARALLAX_RATIO = 0.18;
// Feu tricolore height as a fraction of the facade height (ADR-0047 amendment,
// Bertrand-directed). The traffic light is the one prop that DELIBERATELY breaks
// the non-occlusion band: it rises well into the window rows for a dominant, close
// signal, accepting that it may briefly mask a cop behind it as the camera pans.
// It is still drawn BELOW the courier (6) / delivery van (7) — the "Livrer" targets
// it must never mask (finding #8) — so only static cop windows can fall behind it.
const TRAFFIC_LIGHT_H_FRAC = 0.8;

// Conservative extra downward drop of the near kerb on mobile (facade-normalized,
// y-down). ADR-0003 defines no world-space HUD/thumb reserve, and these props are
// world-anchored meshes whose on-screen position depends on the live zoom/pan, so
// no exact mapping is available render-side. This margin keeps the band lower than
// the desktop line as a safety buffer — the real check is on-device at VERIFY.
const MOBILE_BAND_DROP = 0.05;

interface Props {
  levelId: string | undefined;
  isMobile: boolean;
  /** Width of a single facade panel in world units. */
  facadeW: number;
  /** Facade height in world units. */
  facadeH: number;
  /** Number of facade panels laid side by side. */
  panels: number;
  /**
   * Effective reduced motion (ADR-0054 §3): the shared union signal (prefs toggle OR
   * live OS query), owned once by `useReducedMotionRoot` in App and threaded through
   * GameScene — the ONE authority. Freezes the parallax drift + traffic-light cycle,
   * so this layer honours the in-app MOUVEMENT RÉDUIT toggle, not just the OS query.
   */
  reducedMotion: boolean;
}

interface RowProps {
  objects: readonly { obj: NearForegroundObject; index: number }[];
  streetWorldY: number;
  maxH: number;
  rowScale: number;
  fullW: number;
  facadeH: number;
  renderOrder: number;
  z: number;
}

// One kerb line of props: each base anchored on `streetWorldY`, grown upward by
// its natural height but capped at `maxH` (non-occlusion), scaled by `rowScale`.
function Row({
  objects,
  streetWorldY,
  maxH,
  rowScale,
  fullW,
  facadeH,
  renderOrder,
  z,
}: RowProps): JSX.Element {
  // Async PNG swap visibility: the generated texture replaces the procedural one in
  // the shared cache AFTER mount (getNearForegroundTexture then returns a NEW object),
  // but `map={texture}` binds only on the render that mounted the mesh. Re-read per
  // frame and rebind imperatively when the cache entry changed — the same pattern as
  // EnemySprite. Keyed by the stable object index so a mobile-density re-split can't
  // misalign refs.
  const housingMats = useRef<Map<number, MeshBasicMaterial>>(new Map());
  useFrame(() => {
    for (const { obj, index } of objects) {
      const mat = housingMats.current.get(index);
      if (mat === undefined) continue;
      const tex = getNearForegroundTexture(obj.kind);
      if (tex !== null && mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    }
  });
  return (
    <>
      {objects.map(({ obj, index }) => {
        const texture = getNearForegroundTexture(obj.kind);
        if (texture === null) return null;
        const spec: NearKindSpec = NEAR_KIND_SPECS[obj.kind];
        const scale = (obj.scale ?? 1) * rowScale;
        // The feu tricolore (hero prop) deliberately breaks the non-occlusion band
        // (ADR-0047 amendment): it bypasses BOTH the band ceiling (`maxH`) and the
        // "believable size" cap, bounded only by its own generous world-height
        // allowance, so it can rise into the window rows. Every other prop stays
        // strictly under `maxH` — non-occlusion still holds for them by construction.
        const isTrafficLight = obj.kind === "trafficLight";
        const heightCap = isTrafficLight ? TRAFFIC_LIGHT_H_FRAC * facadeH : maxH;
        const believableCap = isTrafficLight ? Infinity : MAX_PROP_WORLD_H * rowScale;
        const planeH = Math.min(spec.heightFrac * facadeH * scale, heightCap, believableCap);
        const planeW = planeH * spec.aspect;
        const worldX = (obj.x - 0.5) * fullW;
        // Drop the plane by the texture's transparent under-feet strip so the visible
        // feet — not the empty pixels below them — land on the kerb line. Zero for
        // kinds whose sprite already reaches the texture bottom.
        const footPad = (spec.footPadFrac ?? 0) * planeH;
        const centerY = streetWorldY + planeH / 2 - footPad;
        // The feu tricolore adds a second co-located plane carrying the animated
        // lit-lens overlay, at z+0.001 so it sorts in FRONT of the dead-grey housing
        // within the SAME renderOrder — still below courier (6) / delivery van (7).
        const overlay = isTrafficLight ? getTrafficLightOverlayTexture() : null;
        return (
          <group key={`near-${obj.kind}-${String(index)}`}>
            <mesh position={[worldX, centerY, z]} renderOrder={renderOrder}>
              <planeGeometry args={[planeW, planeH]} />
              <meshBasicMaterial
                ref={(m) => {
                  if (m) housingMats.current.set(index, m);
                  else housingMats.current.delete(index);
                }}
                map={texture}
                transparent
                depthWrite={false}
              />
            </mesh>
            {overlay !== null && (
              <mesh position={[worldX, centerY, z + 0.001]} renderOrder={renderOrder}>
                <planeGeometry args={[planeW, planeH]} />
                <meshBasicMaterial map={overlay} transparent depthWrite={false} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}

/**
 * Near-foreground differential-parallax décor layer (ADR-0047): TWO kerb rows of
 * grey silhouette props — Parisian street furniture (horodateur, réverbère,
 * fontaine Wallace, feu tricolore, potelet, scooter, banc, panneau) lining both
 * edges of the road. The near row (front) is big and drifts fast; the far row (at
 * the facade base) is small and drifts slow, so the street reads with depth. Every
 * prop stands on its kerb line and is scaled to stay under
 * {@link nearForegroundBandTop} (strictly below every window row), so none can
 * reach a window/cop at any pan offset. Drawn at renderOrder 4/5 — above the facade
 * panels (0..3) but BELOW the courier (6) and delivery vehicle (7), which are
 * "Livrer" targets it must never mask (finding #8). Purely decorative: plain
 * meshes, never registered as targets. Textures come from the shared session cache
 * warmed by the loading gate ({@link getNearForegroundTexture}).
 */
export function NearForeground({
  levelId,
  isMobile,
  facadeW,
  facadeH,
  panels,
  reducedMotion,
}: Props): JSX.Element | null {
  const { camera } = useThree();
  const nearRef = useRef<Group>(null);
  const farRef = useRef<Group>(null);
  // Last signal aspect painted onto the shared traffic-light texture (avoids
  // repainting the canvas on frames where the phase has not changed).
  const lastSignalKey = useRef<string>("");

  // null ⇒ level opted out (Vitry) or unknown id: render nothing (core-owned).
  const layer = getNearForeground(levelId);
  const hasTrafficLight = layer?.objects.some((o) => o.kind === "trafficLight") ?? false;

  // Bottom-band top edge from the level's own window zones — read through
  // getBackdropLayout so it is the SAME source that places the cops in BOTH
  // modes (tronçon tiles carry per-tronçon zones; the legacy per-panel path
  // used here before ADR-0048 diverged on belliard and let props rise into
  // the lower cop windows). Zone y/h are image-normalized in every mode, which
  // is all nearForegroundBandTop reads.
  const bandTop = useMemo(
    () => nearForegroundBandTop(getBackdropLayout(levelId).tiles.flatMap((t) => t.zones)),
    [levelId],
  );

  // Reduced motion now arrives via the `reducedMotion` prop — the shared union signal
  // from `useReducedMotionRoot` (App → GameScene), the ONE authority (ADR-0054 §3) —
  // so no private `matchMedia` poll here; the in-app toggle reaches this layer too.

  // Parallax: each kerb row tracks the camera at its own factor (far = slower), like
  // the sky in LevelBackdrop. No per-frame allocation.
  useFrame((state) => {
    if (layer === null) return;
    const f = camera.position.x * deriveNearParallaxFactor(layer.factor, reducedMotion, isMobile);
    if (nearRef.current) nearRef.current.position.x = f;
    if (farRef.current) farRef.current.position.x = f * FAR_PARALLAX_RATIO;
    // Cycle the feu tricolore (vert → orange → rouge, pedestrian interlocked). Frozen
    // on the resting aspect under reduced-motion. Repaints only on a phase change.
    if (hasTrafficLight) {
      const signal = reducedMotion ? DEFAULT_SIGNAL : trafficSignalPhase(state.clock.elapsedTime);
      const key = signalKey(signal);
      if (key !== lastSignalKey.current) {
        lastSignalKey.current = key;
        updateTrafficLightSignal(signal);
      }
    }
  });

  if (layer === null) return null;

  const fullW = facadeW * panels;
  const nearLine = isMobile ? NEAR_STREET_LINE + MOBILE_NEAR_LINE_DROP : NEAR_STREET_LINE;
  const nearStreetWorldY = (0.5 - nearLine) * facadeH;
  const farStreetWorldY = (0.5 - FAR_STREET_LINE) * facadeH;
  // Non-occlusion ceiling below the windows. Mobile drops it lower (C3 buffer).
  const effectiveBandTop = isMobile ? bandTop + MOBILE_BAND_DROP : bandTop;
  const bandTopWorldY = (0.5 - effectiveBandTop) * facadeH;
  const nearMaxH = Math.max(0, bandTopWorldY - nearStreetWorldY);
  const farMaxH = Math.max(0, bandTopWorldY - farStreetWorldY);

  // Mobile density halved per row (drop every other on-screen instance by parity).
  const split = (row: "near" | "far"): { obj: NearForegroundObject; index: number }[] =>
    layer.objects
      .map((obj, index) => ({ obj, index }))
      .filter(({ obj }) => (obj.row ?? "near") === row)
      .filter((_, i) => !isMobile || i % 2 === 0);

  return (
    <>
      {/* Far kerb (back of the road): smaller, slower, drawn behind the near row. */}
      <group ref={farRef}>
        <Row
          objects={split("far")}
          streetWorldY={farStreetWorldY}
          maxH={farMaxH}
          rowScale={FAR_SCALE}
          fullW={fullW}
          facadeH={facadeH}
          renderOrder={4}
          z={0.6}
        />
      </group>
      {/* Near kerb (front): full size, full parallax, in front of the far row but
          still below the courier (6) and delivery van (7) — see finding #8. */}
      <group ref={nearRef}>
        <Row
          objects={split("near")}
          streetWorldY={nearStreetWorldY}
          maxH={nearMaxH}
          rowScale={NEAR_SCALE}
          fullW={fullW}
          facadeH={facadeH}
          renderOrder={5}
          z={0.7}
        />
      </group>
    </>
  );
}
