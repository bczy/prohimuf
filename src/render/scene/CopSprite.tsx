import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { TopdownState } from "@game/types/topdownState";

const COLOR_PATROLLING = "#ff2d9b";
const COLOR_ALERT = "#ff6600";

interface Props {
  stateRef: React.RefObject<TopdownState>;
  copIndex: number;
}

export function CopSprite({ stateRef, copIndex }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;

    const cop = stateRef.current.cops[copIndex];
    if (cop === undefined) {
      mesh.visible = false;
      return;
    }

    mesh.visible = true;
    mesh.position.x = cop.position.x;
    mesh.position.y = cop.position.y;

    const mat = mesh.material as MeshBasicMaterial;
    const color = cop.state === "ALERT" ? COLOR_ALERT : COLOR_PATROLLING;
    mat.color.set(color);
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0.5]} visible={false}>
      <boxGeometry args={[0.5, 0.5, 0]} />
      <meshBasicMaterial color={COLOR_PATROLLING} />
    </mesh>
  );
}
