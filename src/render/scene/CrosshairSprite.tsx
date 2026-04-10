import { useRef, useMemo } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture } from "three";
import type { Mesh, MeshBasicMaterial, Camera } from "three";
import type { GameState } from "@game/types/gameState";
import { crosshairToWorld } from "@game/systems/crosshairSystem";

function makeCrosshairTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new CanvasTexture(canvas);

  const cx = size / 2;
  const cy = size / 2;
  const color = "#39ff14";
  const glow = "rgba(57,255,20,0.25)";

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.strokeStyle = glow;
  ctx.lineWidth = 8;
  ctx.stroke();

  // Main circle
  ctx.beginPath();
  ctx.arc(cx, cy, 36, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, 16, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Cross hairs — 4 gaps around center
  const gap = 20;
  const len = 16;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  // top
  ctx.beginPath();
  ctx.moveTo(cx, cy - gap);
  ctx.lineTo(cx, cy - gap - len);
  ctx.stroke();
  // bottom
  ctx.beginPath();
  ctx.moveTo(cx, cy + gap);
  ctx.lineTo(cx, cy + gap + len);
  ctx.stroke();
  // left
  ctx.beginPath();
  ctx.moveTo(cx - gap, cy);
  ctx.lineTo(cx - gap - len, cy);
  ctx.stroke();
  // right
  ctx.beginPath();
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + gap + len, cy);
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  return new CanvasTexture(canvas);
}

interface Props {
  stateRef: React.RefObject<GameState>;
  cameraRef: Camera;
}

export function CrosshairSprite({ stateRef, cameraRef }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const texture = useMemo(() => makeCrosshairTexture(), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const mat = mesh.material as MeshBasicMaterial;
    if (mat.map === null) {
      mat.map = texture;
      mat.needsUpdate = true;
    }
    const { crosshair } = stateRef.current;
    const local = crosshairToWorld(crosshair);
    mesh.position.x = local.x + cameraRef.position.x;
    mesh.position.y = local.y;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  );
}
