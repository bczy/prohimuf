import type { JSX } from "react";
import { useEffect, useRef } from "react";
import { TextureLoader } from "three";
import type { Mesh, MeshBasicMaterial } from "three";
import { getLevelArt, levelLayerUrl } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";

interface Props {
  levelId: string | undefined;
  facadeW: number;
  facadeH: number;
}

/**
 * AI-generated foreground décor layer (chroma-keyed to transparency in CI),
 * composited in front of the cops. Stays hidden if the image is unavailable,
 * so the procedural railings underneath remain the fallback.
 */
export function ForegroundImage({ levelId, facadeW, facadeH }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const art = getLevelArt(levelId);

  useEffect(() => {
    const loader = new TextureLoader();
    let cancelled = false;
    loader.load(
      levelLayerUrl(art.id, "foreground"),
      (texture) => {
        applyPixelFilter(texture);
        const mesh = meshRef.current;
        if (mesh === null || cancelled) return;
        const mat = mesh.material as MeshBasicMaterial;
        mat.map = texture;
        mat.needsUpdate = true;
        mesh.visible = true;
      },
      undefined,
      () => undefined,
    );
    return () => {
      cancelled = true;
    };
  }, [art.id]);

  return (
    <mesh ref={meshRef} position={[0, 0, 0.65]} renderOrder={6} visible={false}>
      <planeGeometry args={[facadeW, facadeH]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  );
}
