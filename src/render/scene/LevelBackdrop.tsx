import { memo, useEffect, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TextureLoader, CanvasTexture } from "three";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import { getLevelArt, levelLayerUrl } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";

// Fallback solid colours shown until (or instead of) the generated art loads,
// so the game still renders during local dev before any AI assets exist.
const FALLBACK = {
  sky: "#0b0a1e",
  facade: "#2a2840",
  street: "#14121f",
} as const;

// Adjacent facade panels overlap by this fraction of a panel, and the front
// panel's left edge is alpha-feathered, so the seam between two facades
// crossfades away instead of showing a hard vertical line.
const BLEND = 0.08;

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
  /** Width of a single facade panel in world units. */
  panelW: number;
  /** Facade height in world units. */
  facadeH: number;
  /** Number of facade panels placed side by side. */
  panels: number;
}

/**
 * Renders a level as a wide street: one parallaxing sky behind N distinct
 * facade panels laid side by side (each its own image, world-locked). Panels
 * overlap slightly and crossfade at the edges so the joins are invisible.
 */
export const LevelBackdrop = memo(function LevelBackdrop({
  levelId,
  panelW,
  facadeH,
  panels,
}: Props): JSX.Element {
  const art = getLevelArt(levelId);

  const skyRef = useRef<Mesh>(null);
  const facadeRefs = useRef<(Mesh | null)[]>([]);
  const streetRefs = useRef<(Mesh | null)[]>([]);
  const { camera } = useThree();

  const fullW = panelW * panels;
  const panelDrawW = panelW * (1 + BLEND); // widened so neighbours overlap
  const featherFrac = BLEND / (1 + BLEND); // overlap as a fraction of the draw width
  const offsetX = (p: number): number => (p - (panels - 1) / 2) * panelW;

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
    // Facade panels: feather the left edge of every panel after the first so it
    // crossfades over its neighbour.
    const assignFacade = (ref: Mesh | null, texture: Texture, p: number): void => {
      if (ref === null) return;
      const mat = ref.material as MeshBasicMaterial;
      const image = texture.image as HTMLImageElement | undefined;
      const tex =
        p > 0 && image !== undefined
          ? (featherLeftTexture(image, featherFrac) ?? applyPixelFilter(texture))
          : applyPixelFilter(texture);
      mat.map = tex;
      mat.color.set("#ffffff");
      mat.transparent = true;
      mat.needsUpdate = true;
    };

    loader.load(
      levelLayerUrl(art.id, "sky"),
      (t) => {
        assignPlain(skyRef.current, t);
      },
      undefined,
      () => undefined,
    );

    for (let p = 0; p < panels; p++) {
      // All panels share the SAME facade image so the (single) window-zone grid
      // — used for cop spawns and the foreground ironwork — lines up on every
      // panel. A Haussmann terrace is repetitive, so the repeat reads naturally;
      // the left-edge feather still crossfades each seam.
      loader.load(
        levelLayerUrl(art.id, "facade"),
        (t) => {
          assignFacade(facadeRefs.current[p] ?? null, t, p);
        },
        undefined,
        () => undefined,
      );
      loader.load(
        levelLayerUrl(art.id, "street"),
        (t) => {
          assignPlain(streetRefs.current[p] ?? null, t);
        },
        undefined,
        () => undefined,
      );
    }
  }, [art.id, panels, featherFrac]);

  // Only the sky parallaxes; facade/street panels are world-locked so they tile.
  useFrame(() => {
    if (skyRef.current) skyRef.current.position.x = camera.position.x * art.parallax.sky;
  });

  const panelIdx = Array.from({ length: panels }, (_, p) => p);

  return (
    <>
      {/* Sky — one wide plane, farthest, drifts slowest */}
      <mesh ref={skyRef} position={[0, facadeH * 0.32, -3]}>
        <planeGeometry args={[fullW * 1.3, facadeH * 1.4]} />
        <meshBasicMaterial color={FALLBACK.sky} />
      </mesh>

      {/* Street band — repeated behind the facade (only shows in gaps) */}
      {panelIdx.map((p) => (
        <mesh
          key={`street-${String(p)}`}
          ref={(m) => {
            streetRefs.current[p] = m;
          }}
          position={[offsetX(p), -facadeH * 0.62, -2]}
        >
          <planeGeometry args={[panelW * 1.02, facadeH * 0.9]} />
          <meshBasicMaterial color={FALLBACK.street} />
        </mesh>
      ))}

      {/* Facade — N panels side by side; overlap + left-edge crossfade hides the
          joins. Drawn front-to-back by renderOrder so the feather blends. */}
      {panelIdx.map((p) => (
        <mesh
          key={`facade-${String(p)}`}
          ref={(m) => {
            facadeRefs.current[p] = m;
          }}
          position={[offsetX(p), 0, -1]}
          renderOrder={p}
        >
          <planeGeometry args={[panelDrawW, facadeH]} />
          <meshBasicMaterial color={FALLBACK.facade} transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
});
