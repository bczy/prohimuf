import { useRef, useMemo, useLayoutEffect } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture } from "three";
import type { Mesh, MeshBasicMaterial, Camera, OrthographicCamera } from "three";
import type { GameState } from "@game/types/gameState";
import { crosshairToWorld } from "@game/systems/crosshairSystem";
import { CRT_OVERLAY_LAYER } from "@render/effects/crtLayers";

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
  /** When the CRT pass is active, the crosshair moves to CRT_OVERLAY_LAYER so it
   *  is excluded from the composite and drawn flat/sharp above it (P4). */
  crtEnabled?: boolean;
}

export function CrosshairSprite({ stateRef, cameraRef, crtEnabled = false }: Props): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const texture = useMemo(() => makeCrosshairTexture(), []);
  const { size } = useThree();

  // Park the crosshair on the overlay layer while CRT is on (so the world pass,
  // which renders layer 0, skips it), and back on layer 0 when off (so the
  // untouched auto-render draws it as before).
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    mesh.layers.set(crtEnabled ? CRT_OVERLAY_LAYER : 0);
  }, [crtEnabled]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (mesh === null) return;
    const mat = mesh.material as MeshBasicMaterial;
    if (mat.map === null) {
      mat.map = texture;
      mat.needsUpdate = true;
    }
    const ortho = cameraRef as OrthographicCamera;
    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;
    const { crosshair } = stateRef.current;
    const world = crosshairToWorld(
      crosshair,
      cameraRef.position.x,
      cameraRef.position.y,
      viewW,
      viewH,
    );
    mesh.position.x = world.x;
    mesh.position.y = world.y;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 1]} renderOrder={16384}>
      <planeGeometry args={[0.9, 0.9]} />
      <meshBasicMaterial transparent depthWrite={false} />
    </mesh>
  );
}
