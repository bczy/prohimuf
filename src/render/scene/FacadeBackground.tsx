import { memo } from "react";
import type { JSX } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { FacadeMap } from "@game/types/map";

const WINDOW_W = 1.2;
const WINDOW_H = 0.8;
const WINDOW_COLOR = "#2a1a1a";

interface Props {
  map: FacadeMap;
}

export const FacadeBackground = memo(function FacadeBackground({ map }: Props): JSX.Element {
  const bgTexture = useLoader(TextureLoader, "/assets/facade_bg.png");

  const bgWidth = map.width * 2 + 2;
  const bgHeight = map.height * 1.5 + 2;

  return (
    <>
      {/* Background wall with texture */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[bgWidth, bgHeight]} />
        <meshBasicMaterial map={bgTexture} />
      </mesh>
      {/* Window slots (dark frames — enemies light them up) */}
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
