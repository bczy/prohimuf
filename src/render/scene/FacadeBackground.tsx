import { memo } from "react";
import type { JSX } from "react";
import type { FacadeMap } from "@game/types/map";

const FACADE_COLOR = "#1a0a2e";
const WINDOW_COLOR = "#2a1a1a";
const WINDOW_W = 1.2;
const WINDOW_H = 0.8;

interface Props {
  map: FacadeMap;
}

export const FacadeBackground = memo(function FacadeBackground({ map }: Props): JSX.Element {
  const bgWidth = map.width * 2 + 2;
  const bgHeight = map.height * 1.5 + 2;

  return (
    <>
      {/* Background wall */}
      <mesh position={[0, 0, -0.5]}>
        <planeGeometry args={[bgWidth, bgHeight]} />
        <meshBasicMaterial color={FACADE_COLOR} />
      </mesh>
      {/* Window slots (dark, enemies light them up) */}
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
