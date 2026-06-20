import { memo, useEffect, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import { getLevelArt, levelLayerUrl, facadePanelUrl } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";

// Fallback solid colours shown until (or instead of) the generated art loads,
// so the game still renders during local dev before any AI assets exist.
const FALLBACK = {
  sky: "#0b0a1e",
  facade: "#2a2840",
  street: "#14121f",
} as const;

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
 * facade panels laid side by side (each its own image, world-locked so they
 * tile seamlessly), with the street band repeated behind them.
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
  const offsetX = (p: number): number => (p - (panels - 1) / 2) * panelW;

  useEffect(() => {
    const loader = new TextureLoader();
    const assign = (ref: Mesh | null, texture: Texture): void => {
      if (ref === null) return;
      applyPixelFilter(texture);
      const mat = ref.material as MeshBasicMaterial;
      mat.map = texture;
      mat.color.set("#ffffff");
      mat.needsUpdate = true;
    };

    loader.load(
      levelLayerUrl(art.id, "sky"),
      (t) => {
        assign(skyRef.current, t);
      },
      undefined,
      () => undefined,
    );

    for (let p = 0; p < panels; p++) {
      loader.load(
        facadePanelUrl(art.id, p),
        (t) => {
          assign(facadeRefs.current[p] ?? null, t);
        },
        undefined,
        // A missing panel (not generated yet) falls back to the first facade.
        () => {
          loader.load(
            facadePanelUrl(art.id, 0),
            (t) => {
              assign(facadeRefs.current[p] ?? null, t);
            },
            undefined,
            () => undefined,
          );
        },
      );
      loader.load(
        levelLayerUrl(art.id, "street"),
        (t) => {
          assign(streetRefs.current[p] ?? null, t);
        },
        undefined,
        () => undefined,
      );
    }
  }, [art.id, panels]);

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

      {/* Facade — N distinct panels side by side, world-locked */}
      {panelIdx.map((p) => (
        <mesh
          key={`facade-${String(p)}`}
          ref={(m) => {
            facadeRefs.current[p] = m;
          }}
          position={[offsetX(p), 0, -1]}
        >
          <planeGeometry args={[panelW, facadeH]} />
          <meshBasicMaterial color={FALLBACK.facade} />
        </mesh>
      ))}
    </>
  );
});
