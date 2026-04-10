import { memo, useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";
import type { TileMap, TileType } from "@game/types/tileMap";

const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

// Draw the entire facade as one canvas texture
function makeFacadeTexture(map: TileMap): CanvasTexture {
  const PX = 64; // pixels per tile
  const W = map.cols * PX;
  const H = map.rows * PX;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new CanvasTexture(canvas);

  // --- 1. Base wall fill — pierre haussmannienne nuit, gris-bleu froid ---
  ctx.fillStyle = "#2a2a35";
  ctx.fillRect(0, 0, W, H);

  // --- 2. Stone block pattern ---
  const blockH = 18;
  const blockW = 48;
  for (let py = 0; py < H; py += blockH) {
    const row = Math.floor(py / blockH);
    const offset = (row % 2) * (blockW / 2);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, py, W, 2);
    for (let px = offset; px < W; px += blockW) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(px, py, 2, blockH);
    }
  }

  // --- 3. Pixel grain over entire wall ---
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const seed = i * 0.0001;
    const noise = (seededRand(seed) - 0.5) * 22;
    const pr = data[i] ?? 0;
    const pg = data[i + 1] ?? 0;
    const pb = data[i + 2] ?? 0;
    data[i] = Math.max(0, Math.min(255, pr + noise));
    data[i + 1] = Math.max(0, Math.min(255, pg + noise * 0.85));
    data[i + 2] = Math.max(0, Math.min(255, pb + noise * 1.15));
  }
  ctx.putImageData(imgData, 0, 0);

  // --- 4. Horizontal scanlines (photocopied look) ---
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = "rgba(0,0,0,0.07)";
    ctx.fillRect(0, y, W, 1);
  }

  // --- 5. Draw each tile on top ---
  map.tiles.forEach((row, rowIdx) => {
    row.forEach((tileType, colIdx) => {
      const tx = colIdx * PX;
      const ty = rowIdx * PX;
      const seed = colIdx * 31 + rowIdx * 97;

      if (tileType === "ROOFTOP") {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(tx, ty, PX, PX);
        ctx.fillStyle = "#3a3a48";
        ctx.fillRect(tx, ty + PX - 6, PX, 6);
        return;
      }

      if (tileType === "DOOR") {
        // Double door
        ctx.fillStyle = "#0d0810";
        ctx.fillRect(tx + 6, ty, PX - 12, PX * 2 - 4);
        // Door frame
        ctx.strokeStyle = "#3a2040";
        ctx.lineWidth = 3;
        ctx.strokeRect(tx + 6, ty, PX - 12, PX * 2 - 4);
        // Door split
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(tx + PX / 2 - 1, ty, 2, PX * 2 - 4);
        // Interphone
        ctx.fillStyle = "#ffe600";
        ctx.fillRect(tx + PX - 14, ty + 8, 6, 4);
        return;
      }

      if (tileType === "BALCONY") {
        // Iron railing — thin horizontal bar + vertical pickets
        const railY = ty + PX - 10;
        ctx.fillStyle = "#111";
        ctx.fillRect(tx, railY, PX, 3); // top rail
        ctx.fillRect(tx, ty + PX - 3, PX, 3); // bottom rail
        // Pickets
        for (let px = tx + 6; px < tx + PX; px += 8) {
          ctx.fillStyle = "#1a1020";
          ctx.fillRect(px, railY, 2, 10);
        }
        return;
      }

      if (WINDOW_TYPES.has(tileType)) {
        const isLit = tileType === "WINDOW_LIT";
        const margin = 10;
        const pw = PX - margin * 2;
        const ph = PX - margin * 2 - 4;

        // Window recess (darker wall area)
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx + margin - 3, ty + margin - 3, pw + 6, ph + 6);

        // Stone surround / lintel
        ctx.fillStyle = "#383840";
        ctx.fillRect(tx + margin - 2, ty + margin - 2, pw + 4, ph + 4);

        if (isLit) {
          // Warm glow fill
          ctx.fillStyle = "#e05000";
          ctx.fillRect(tx + margin, ty + margin, pw, ph);
          // Bright center
          const grad = ctx.createRadialGradient(
            tx + PX / 2,
            ty + PX / 2,
            0,
            tx + PX / 2,
            ty + PX / 2,
            pw * 0.6,
          );
          grad.addColorStop(0, "rgba(255,220,120,0.9)");
          grad.addColorStop(1, "rgba(220,80,0,0.1)");
          ctx.fillStyle = grad;
          ctx.fillRect(tx + margin, ty + margin, pw, ph);
          // Window cross (frame)
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(tx + PX / 2 - 1, ty + margin, 2, ph);
          ctx.fillRect(tx + margin, ty + PX / 2 - 1, pw, 2);
        } else {
          // Dark void
          ctx.fillStyle = "#050308";
          ctx.fillRect(tx + margin, ty + margin, pw, ph);
          // Faint shutter lines
          ctx.fillStyle = "rgba(30,20,50,0.8)";
          for (let sy = ty + margin + 4; sy < ty + margin + ph; sy += 5) {
            ctx.fillRect(tx + margin, sy, pw, 2);
          }
        }

        // Occasional lighted window flicker mark
        if (isLit && seededRand(seed * 5) > 0.7) {
          ctx.fillStyle = "rgba(255,160,40,0.15)";
          ctx.fillRect(tx, ty, PX, PX);
        }
        return;
      }

      // WALL — add subtle variation patch
      if (seededRand(seed * 11) > 0.75) {
        const stainX = tx + Math.floor(seededRand(seed * 3) * (PX - 10));
        const stainY = ty + Math.floor(seededRand(seed * 7) * (PX - 20));
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(
          stainX,
          stainY,
          8 + Math.floor(seededRand(seed) * 12),
          16 + Math.floor(seededRand(seed * 13) * 20),
        );
      }
    });
  });

  return new CanvasTexture(canvas);
}

interface Props {
  map: TileMap;
}

export const TiledFacade = memo(function TiledFacade({ map }: Props): JSX.Element {
  const facadeW = map.cols * map.tileW;
  const facadeH = map.rows * map.tileH;

  const texture = useMemo(() => makeFacadeTexture(map), [map]);

  return (
    <mesh position={[0, 0, -0.5]}>
      <planeGeometry args={[facadeW, facadeH]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
});
