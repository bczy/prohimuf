import { memo, useEffect, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { TextureLoader } from "three";
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

interface Props {
  levelId: string | undefined;
  /** Building/street width in world units (the facade plane width). */
  facadeW: number;
  /** Street height in world units (the facade plane height). */
  facadeH: number;
}

/**
 * Renders a level as stacked, parallaxing image layers (sky / facade / street)
 * instead of procedural tiles. Each layer is a textured plane; horizontal
 * parallax is driven by the camera so far layers drift slower than the facade.
 */
export const LevelBackdrop = memo(function LevelBackdrop({
  levelId,
  facadeW,
  facadeH,
}: Props): JSX.Element {
  const art = getLevelArt(levelId);

  const skyRef = useRef<Mesh>(null);
  const facadeRef = useRef<Mesh>(null);
  const streetRef = useRef<Mesh>(null);
  const { camera } = useThree();

  // Load the three layer textures; keep the fallback colour on error.
  useEffect(() => {
    const loader = new TextureLoader();
    const targets: { ref: React.RefObject<Mesh | null>; layer: "sky" | "facade" | "street" }[] = [
      { ref: skyRef, layer: "sky" },
      { ref: facadeRef, layer: "facade" },
      { ref: streetRef, layer: "street" },
    ];
    for (const { ref, layer } of targets) {
      loader.load(
        levelLayerUrl(art.id, layer),
        (texture: Texture) => {
          applyPixelFilter(texture);
          const mesh = ref.current;
          if (mesh === null) return;
          const mat = mesh.material as MeshBasicMaterial;
          mat.map = texture;
          mat.color.set("#ffffff");
          mat.needsUpdate = true;
        },
        undefined,
        () => undefined,
      );
    }
  }, [art.id]);

  // Horizontal parallax: a layer with factor k sits at camera.x * k, so k=0
  // is world-locked (the facade) and k→1 is pinned to the view (far sky).
  useFrame(() => {
    const cx = camera.position.x;
    if (skyRef.current) skyRef.current.position.x = cx * art.parallax.sky;
    if (facadeRef.current) facadeRef.current.position.x = cx * art.parallax.facade;
    if (streetRef.current) streetRef.current.position.x = cx * art.parallax.street;
  });

  const skyW = facadeW * 1.8;
  const skyH = facadeH * 1.4;
  const streetW = facadeW * 1.8;
  const streetH = facadeH * 0.9;

  return (
    <>
      {/* Sky — farthest, drifts slowest */}
      <mesh ref={skyRef} position={[0, facadeH * 0.32, -3]}>
        <planeGeometry args={[skyW, skyH]} />
        <meshBasicMaterial color={FALLBACK.sky} />
      </mesh>

      {/* Facade — world-locked, the main backdrop */}
      <mesh ref={facadeRef} position={[0, 0, -1]}>
        <planeGeometry args={[facadeW, facadeH]} />
        <meshBasicMaterial color={FALLBACK.facade} />
      </mesh>

      {/* Street — foreground ground, slight parallax */}
      <mesh ref={streetRef} position={[0, -facadeH * 0.62, -0.6]}>
        <planeGeometry args={[streetW, streetH]} />
        <meshBasicMaterial color={FALLBACK.street} />
      </mesh>
    </>
  );
});
