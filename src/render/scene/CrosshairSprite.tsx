import { useRef, useEffect } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import { crosshairToWorld } from "@game/systems/crosshairSystem";

const CROSSHAIR_COLOR = "#00ffff";
const VIEW_W = 20;
const VIEW_H = 12;

interface Props {
  stateRef: React.RefObject<GameState>;
}

export function CrosshairSprite({ stateRef }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const textureRef = useRef<Texture | null>(null);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}assets/crosshair.png`,
      (t) => {
        textureRef.current = t;
        const mesh = meshRef.current;
        if (mesh === null) return;
        const mat = mesh.material as MeshBasicMaterial;
        mat.map = t;
        mat.needsUpdate = true;
      },
      undefined,
      () => undefined,
    );
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const { crosshair } = stateRef.current;
    const world = crosshairToWorld(crosshair, VIEW_W, VIEW_H);
    mesh.position.x = world.x;
    mesh.position.y = world.y;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
      <planeGeometry args={[0.6, 0.6]} />
      <meshBasicMaterial color={CROSSHAIR_COLOR} transparent />
    </mesh>
  );
}
