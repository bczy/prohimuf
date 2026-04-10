import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { TopdownState } from "@game/types/topdownState";

const COLOR_DEFAULT = "#39ff14";
const COLOR_CARGO = "#ffe600";

interface Props {
  stateRef: React.RefObject<TopdownState>;
}

export function PlayerSprite({ stateRef }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;

    const { player } = stateRef.current;
    mesh.position.x = player.position.x;
    mesh.position.y = player.position.y;

    const mat = mesh.material as MeshBasicMaterial;
    const color = player.hasCargo ? COLOR_CARGO : COLOR_DEFAULT;
    mat.color.set(color);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
      <circleGeometry args={[0.35, 12]} />
      <meshBasicMaterial color={COLOR_DEFAULT} />
    </mesh>
  );
}
