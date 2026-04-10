import { memo, useEffect, useRef } from "react";
import type { JSX } from "react";
import { TextureLoader } from "three";
import type { Texture, MeshBasicMaterial } from "three";
import type { Mesh } from "three";
import type { FacadeMap } from "@game/types/map";

const FACADE_COLOR = "#4a2f7a";
const WINDOW_W = 1.2;
const WINDOW_H = 0.8;
const WINDOW_COLOR = "#1a0f2e";

interface Props {
  map: FacadeMap;
}

export const FacadeBackground = memo(function FacadeBackground({ map }: Props): JSX.Element {
  const bgMeshRef = useRef<Mesh>(null);
  const bgWidth = map.width * 2 + 2;
  const bgHeight = map.height * 1.5 + 2;

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}assets/facade_bg.png`,
      (texture: Texture) => {
        const mesh = bgMeshRef.current;
        if (mesh === null) return;
        const mat = mesh.material as MeshBasicMaterial;
        mat.map = texture;
        mat.needsUpdate = true;
      },
      undefined,
      // on error: keep solid color fallback, no crash
      () => undefined,
    );
  }, []);

  return (
    <>
      {/* Background wall — solid color fallback, texture applied async */}
      <mesh ref={bgMeshRef} position={[0, 0, -0.5]}>
        <planeGeometry args={[bgWidth, bgHeight]} />
        <meshBasicMaterial color={FACADE_COLOR} />
      </mesh>
      {/* Window slots */}
      {map.slots.map((slot) => (
        <mesh
          key={`${String(slot.col)}-${String(slot.row)}`}
          position={[slot.screenPosition.x, slot.screenPosition.y, -0.2]}
        >
          <planeGeometry args={[WINDOW_W, WINDOW_H]} />
          <meshBasicMaterial color={WINDOW_COLOR} />
        </mesh>
      ))}
    </>
  );
});
