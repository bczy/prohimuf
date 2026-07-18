import { memo, useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TextureLoader, CanvasTexture, RepeatWrapping } from "three";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import { getBackdropLayout, getLevelArt, levelLayerUrl, WORLD_HEIGHT } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { BLEND, backdropPanes } from "./facadeLayout";

// Fallback solid colours shown until (or instead of) the generated art loads,
// so the game still renders during local dev before any AI assets exist.
const FALLBACK = {
  sky: "#0b0a1e",
  facade: "#2a2840",
  street: "#14121f",
} as const;

/** Public URL of a backdrop tile image (respects Vite base path). `levelLayerUrl`
 *  only knows the fixed {@link LayerName}s; tronçon tiles are arbitrary basenames
 *  under the same `assets/levels/<id>/` folder (ADR-0046). For a single-facade
 *  pane (`file === "facade"`) this resolves to the exact same URL as
 *  `levelLayerUrl(id, "facade")`. */
function tileUrl(id: string, file: string): string {
  return `${import.meta.env.BASE_URL}assets/levels/${id}/${file}.png`;
}

// Copy an image to a canvas and ramp its left-edge alpha from 0→1 over `frac`
// of the width, returning a pixel-filtered texture (null in non-DOM contexts).
function featherLeftTexture(img: HTMLImageElement, frac: number): Texture | null {
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = img.width;
  cv.height = img.height;
  const g = cv.getContext("2d");
  if (g === null) return null;
  g.drawImage(img, 0, 0);
  const fw = Math.max(1, Math.round(cv.width * frac));
  const strip = g.getImageData(0, 0, fw, cv.height);
  const d = strip.data;
  for (let x = 0; x < fw; x++) {
    const a = x / fw;
    for (let y = 0; y < cv.height; y++) {
      const idx = (y * fw + x) * 4 + 3;
      d[idx] = Math.round((d[idx] ?? 0) * a);
    }
  }
  g.putImageData(strip, 0, 0);
  return applyPixelFilter(new CanvasTexture(cv));
}

interface Props {
  levelId: string | undefined;
  /** Facade height in world units. */
  facadeH: number;
}

/**
 * Renders a level as a wide street over one parallaxing sky (ADR-0046). The
 * backdrop composition is driven by {@link getBackdropLayout}:
 *
 * - `single-facade` (stalingrad, vitry): N equal-width panels all loading the
 *   same `facade.png`, each drawn `1+BLEND` wide and its left edge alpha-feathered
 *   so the seams crossfade invisibly (the classic path, unchanged).
 * - `troncon-sequence` (belliard): one world-locked plane PER tile at its native
 *   width, loading a distinct transparent tronçon PNG — NO feather, so the
 *   parallax sky shows through the rooflines and between-building gaps as real
 *   transparency. The street band still shows through the transparent gaps.
 *
 * Only the sky parallaxes; facade/street planes are world-locked so the enemy
 * slots and railings (placed off the same layout in `GameScene`) stay aligned.
 */
export const LevelBackdrop = memo(function LevelBackdrop({ levelId, facadeH }: Props): JSX.Element {
  const art = getLevelArt(levelId);
  const layout = useMemo(() => getBackdropLayout(levelId), [levelId]);
  const panes = useMemo(() => backdropPanes(layout), [layout]);
  const fullW = layout.fullW;
  const featherFrac = BLEND / (1 + BLEND); // overlap as a fraction of the draw width

  // Tronçon backdrops decompose the ground into a SEPARATE continuous layer
  // (the tronçon PNGs are buildings-only, cut at the street line): one strip of
  // trottoir+road spanning the whole street so the road is unbroken under the
  // between-building sky gaps (ADR-0046). The tronçon art is cut at this fraction
  // of image height, so the ground layer's top sits at the matching world y.
  const isTroncon = layout.mode === "troncon-sequence";
  const STREET_LINE_FRAC = 0.864;
  const GROUND_TILE_W = WORLD_HEIGHT * 1.4992; // one ground.png = tronçon-a's native (pre-pad) width
  const groundTopY = facadeH * (0.5 - STREET_LINE_FRAC);
  const groundH = facadeH * 0.42;
  const groundY = isTroncon ? groundTopY - groundH / 2 : -facadeH * 0.62;
  const groundPlaneH = isTroncon ? groundH : facadeH * 0.9;

  const skyRef = useRef<Mesh>(null);
  const facadeRefs = useRef<(Mesh | null)[]>([]);
  const streetRef = useRef<Mesh>(null);
  const { camera } = useThree();

  useEffect(() => {
    const loader = new TextureLoader();
    const assignPlain = (ref: Mesh | null, texture: Texture): void => {
      if (ref === null) return;
      applyPixelFilter(texture);
      const mat = ref.material as MeshBasicMaterial;
      mat.map = texture;
      mat.color.set("#ffffff");
      mat.needsUpdate = true;
    };
    // Facade planes: feather the left edge only when the pane asks for it (the
    // interior single-facade panels), so those seams crossfade over their
    // neighbour. Tronçon tiles never feather — their seam is a transparent gap.
    const assignFacade = (ref: Mesh | null, texture: Texture, feather: boolean): void => {
      if (ref === null) return;
      const mat = ref.material as MeshBasicMaterial;
      const image = texture.image as HTMLImageElement | undefined;
      const tex =
        feather && image !== undefined
          ? (featherLeftTexture(image, featherFrac) ?? applyPixelFilter(texture))
          : applyPixelFilter(texture);
      mat.map = tex;
      mat.color.set("#ffffff");
      mat.transparent = true;
      mat.needsUpdate = true;
    };

    // Sky layer: single-facade loads its sky.png; tronçon mode leaves the sky
    // layer EMPTY (no image) on purpose — the mesh + parallax are kept so an
    // owner-supplied sky can be dropped in later, but nothing is drawn now, so
    // the between-building gaps and the area above the rooflines show through to
    // the canvas background (ADR-0046).
    if (!isTroncon) {
      loader.load(
        levelLayerUrl(art.id, "sky"),
        (t) => {
          assignPlain(skyRef.current, t);
        },
        undefined,
        () => undefined,
      );
    }

    panes.forEach((pane, i) => {
      loader.load(
        tileUrl(art.id, pane.file),
        (t) => {
          assignFacade(facadeRefs.current[i] ?? null, t, pane.feather);
        },
        undefined,
        () => undefined,
      );
    });
    // Street band texture, per mode. Tronçon: the continuous ground strip
    // (trottoir+road), tiled horizontally so the road reads unbroken under the
    // between-building sky gaps — NOT street.png, whose centred zebra crossing
    // (belliard's QTE overhead road) would peek through the gap at world x=0.
    // Single-facade: the classic per-level street.png backdrop art, exactly as
    // before ADR-0046 (stalingrad/vitry's street art is genuine backdrop, not a
    // QTE view — dropping it flattened their pavement band to a dark rectangle).
    if (isTroncon) {
      loader.load(
        tileUrl(art.id, "ground"),
        (t) => {
          const ref = streetRef.current;
          if (ref === null) return;
          t.wrapS = RepeatWrapping;
          t.repeat.set(Math.max(1, Math.round(fullW / GROUND_TILE_W)), 1);
          applyPixelFilter(t);
          const mat = ref.material as MeshBasicMaterial;
          mat.map = t;
          mat.color.set("#ffffff");
          mat.needsUpdate = true;
        },
        undefined,
        () => undefined,
      );
    } else {
      loader.load(
        levelLayerUrl(art.id, "street"),
        (t) => {
          assignPlain(streetRef.current, t);
        },
        undefined,
        () => undefined,
      );
    }
  }, [art.id, panes, featherFrac, isTroncon, fullW, GROUND_TILE_W]);

  // Only the sky parallaxes; facade/street planes are world-locked so they tile.
  useFrame(() => {
    if (skyRef.current) skyRef.current.position.x = camera.position.x * art.parallax.sky;
  });

  return (
    <>
      {/* Sky — one wide plane, farthest, drifts slowest. Single-facade shows its
          sky.png; tronçon mode keeps this layer but draws NOTHING (empty, owner
          fills it later), so the gaps and above-roofline show the canvas behind. */}
      <mesh ref={skyRef} position={[0, facadeH * 0.32, -3]} visible={!isTroncon}>
        <planeGeometry args={[fullW * 1.3, facadeH * 1.4]} />
        <meshBasicMaterial color={FALLBACK.sky} />
      </mesh>

      {/* Ground — ONE continuous plane behind the buildings spanning the whole
          street. Tronçon mode textures it with the tiled trottoir+road strip and
          anchors its top at the street line, so the road runs unbroken under the
          between-building sky gaps (the buildings-only tronçons are cut here).
          Single-facade keeps a plain dark band hidden behind its opaque panels. */}
      <mesh ref={streetRef} position={[0, groundY, -2]}>
        <planeGeometry args={[fullW * 1.02, groundPlaneH]} />
        <meshBasicMaterial color={FALLBACK.street} />
      </mesh>

      {/* Facade — one world-locked plane per tile at its native width. Single-
          facade panels are drawn 1+BLEND wide with a feathered left edge to hide
          the seam; tronçon tiles draw at native width, transparent, letting the
          sky show through. Drawn back-to-front by renderOrder. */}
      {panes.map((pane, i) => (
        <mesh
          key={`facade-${String(i)}`}
          ref={(m) => {
            facadeRefs.current[i] = m;
          }}
          position={[pane.centreX, 0, -1]}
          renderOrder={i}
        >
          <planeGeometry args={[pane.width * pane.drawScale, facadeH]} />
          <meshBasicMaterial color={FALLBACK.facade} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
});
