import { useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";

// Fraction of canvas height devoted to sky (rest is pavement)
const SKY_FRAC = 0.72;

interface Props {
  width: number;
  height: number;
  /** Ground line Y in world units — mesh is positioned so sky/pavement join lands here */
  groundY: number;
}

function makeStreetCanvas(w: number, h: number): HTMLCanvasElement {
  const PX = 80;
  const W = Math.max(1, Math.round(w * PX));
  const H = Math.max(1, Math.round(h * PX));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return canvas;

  // ── Ciel nocturne — dégradé du haut vers le bas ──
  const skyH = Math.round(H * SKY_FRAC);
  const sky = ctx.createLinearGradient(0, 0, 0, skyH);
  sky.addColorStop(0, "#080814");
  sky.addColorStop(0.5, "#0d1030");
  sky.addColorStop(1, "#1a1840");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, skyH);

  // Quelques étoiles
  const starCount = Math.floor(W * H * 0.00015);
  for (let i = 0; i < starCount; i++) {
    const sx = Math.floor((Math.sin(i * 127.1) * 0.5 + 0.5) * W);
    const sy = Math.floor((Math.sin(i * 311.7) * 0.5 + 0.5) * skyH * 0.85);
    const brightness = 0.3 + (Math.sin(i * 43.7) * 0.5 + 0.5) * 0.7;
    ctx.fillStyle = `rgba(255,255,255,${brightness.toFixed(2)})`;
    ctx.fillRect(sx, sy, 1, 1);
  }

  // ── Trottoir / rue ──
  const pavementY = skyH;
  const pavementH = H - skyH;

  // Sol béton
  const pavement = ctx.createLinearGradient(0, pavementY, 0, H);
  pavement.addColorStop(0, "#1e1c2a");
  pavement.addColorStop(0.3, "#181620");
  pavement.addColorStop(1, "#0e0c14");
  ctx.fillStyle = pavement;
  ctx.fillRect(0, pavementY, W, pavementH);

  // Jointures de dalles
  const slabW = 64;
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  for (let sx = 0; sx < W; sx += slabW) {
    ctx.fillRect(sx, pavementY, 1, pavementH);
  }
  const slabH = 32;
  for (let sy = pavementY; sy < H; sy += slabH) {
    ctx.fillRect(0, sy, W, 1);
  }

  // Reflet de néon sur le sol (lueur verte/rose depuis la rue)
  const neonReflect = ctx.createRadialGradient(W * 0.5, pavementY, 0, W * 0.5, pavementY, W * 0.6);
  neonReflect.addColorStop(0, "rgba(80,255,120,0.06)");
  neonReflect.addColorStop(0.5, "rgba(255,40,120,0.04)");
  neonReflect.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = neonReflect;
  ctx.fillRect(0, pavementY, W, pavementH);

  return canvas;
}

export function StreetBackground({ width, height, groundY }: Props): JSX.Element {
  const texture = useMemo(() => {
    const canvas = makeStreetCanvas(width, height);
    return new CanvasTexture(canvas);
  }, [width, height]);

  // The sky/pavement join is at SKY_FRAC of the canvas from the top.
  // In the mesh centred at meshY, that pixel is at meshY + height/2 - SKY_FRAC*height
  //   = meshY + height*(0.5 - SKY_FRAC)
  // We want that to equal groundY, so:
  //   meshY = groundY - height*(0.5 - SKY_FRAC)
  //         = groundY + height*(SKY_FRAC - 0.5)
  const meshY = groundY + height * (SKY_FRAC - 0.5);

  return (
    <mesh position={[0, meshY, -1]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}
