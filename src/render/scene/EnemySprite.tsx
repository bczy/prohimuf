import { useRef, useEffect } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { TextureLoader } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { Vec2 } from "@game/types/vector";

// Neon colors per state (guidelines: ce qui brille est interactif)
const NEON: Record<string, string> = {
  APPEARING: "#ff6600", // orange brûlé — dépliage
  VISIBLE: "#ff2020", // rouge vif — visible, danger
  SHOOTING: "#ff8800", // orange fluo — tire !
  HIT: "#ffffff", // blanc flash — touché
};

interface Props {
  stateRef: React.RefObject<GameState>;
  slotIndex: number;
  screenPosition: Vec2;
}

export function EnemySprite({ stateRef, slotIndex, screenPosition }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const idleTextureRef = useRef<Texture | null>(null);
  const shootTextureRef = useRef<Texture | null>(null);
  // Track APPEARING phase start for unfold animation
  const unfoldTimerRef = useRef(0);
  const prevStateRef = useRef<string>("HIDDEN");

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}assets/enemy_sprite.png`,
      (t) => {
        idleTextureRef.current = t;
      },
      undefined,
      () => undefined,
    );
    loader.load(
      `${import.meta.env.BASE_URL}assets/enemy_shooting.png`,
      (t) => {
        shootTextureRef.current = t;
      },
      undefined,
      () => undefined,
    );
  }, []);

  useFrame((_state, delta) => {
    const mesh = meshRef.current;
    if (mesh === null) return;

    const enemy = stateRef.current.enemies.find((e) => e.slotIndex === slotIndex);
    if (enemy === undefined || enemy.state === "HIDDEN" || enemy.state === "DEAD") {
      mesh.visible = false;
      prevStateRef.current = enemy?.state ?? "HIDDEN";
      return;
    }

    // Reset unfold timer when entering APPEARING
    if (prevStateRef.current !== "APPEARING" && enemy.state === "APPEARING") {
      unfoldTimerRef.current = 0;
    }
    prevStateRef.current = enemy.state;

    mesh.visible = true;
    mesh.position.x = screenPosition.x;
    mesh.position.y = screenPosition.y;

    // Paper Mario unfold: scale Y 0 → 1 over APPEARING phase (~0.3s)
    if (enemy.state === "APPEARING") {
      unfoldTimerRef.current = Math.min(unfoldTimerRef.current + delta, 0.3);
      const t = unfoldTimerRef.current / 0.3;
      mesh.scale.y = t;
      mesh.scale.x = 1 + (1 - t) * 0.3; // slight squash on X as it unfolds
    } else {
      mesh.scale.set(1, 1, 1);
    }

    // Texture swap
    const mat = mesh.material as MeshBasicMaterial;
    const tex = enemy.state === "SHOOTING" ? shootTextureRef.current : idleTextureRef.current;
    if (tex !== null && mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }

    // Neon color tint (emissive-like via color multiply on MeshBasicMaterial)
    const neonHex = NEON[enemy.state];
    if (neonHex !== undefined) {
      mat.color.set(neonHex);
    } else {
      mat.color.set("#ffffff");
    }
  });

  return (
    <mesh ref={meshRef} position={[screenPosition.x, screenPosition.y, 0]} visible={false}>
      <planeGeometry args={[0.9, 0.65]} />
      <meshBasicMaterial color="#ff3030" transparent />
    </mesh>
  );
}
