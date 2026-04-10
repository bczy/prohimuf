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
  ctx.fillStyle = "#3e3e50";
  ctx.fillRect(0, 0, W, H);

  // --- 2. Stone block pattern (subtle joints, not full-width lines) ---
  const blockH = 18;
  const blockW = 44;
  for (let py = 0; py < H; py += blockH) {
    const row = Math.floor(py / blockH);
    const offset = (row % 2) * (blockW / 2);
    // Horizontal joint — short segments per block, not full width
    for (let px = offset; px < W; px += blockW) {
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(px + 2, py, blockW - 4, 1);
    }
    // Vertical joints
    for (let px = offset; px < W; px += blockW) {
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(px, py + 1, 1, blockH - 2);
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

  // --- 5. Floor cornices between rows (horizontal ledge at each floor boundary) ---
  for (let rowIdx = 1; rowIdx < map.rows; rowIdx++) {
    const cy = rowIdx * PX;
    // Stone ledge — slightly lighter than wall
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, cy - 3, W, 3);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, cy, W, 2);
  }

  // --- 6. Draw each tile on top ---
  map.tiles.forEach((row, rowIdx) => {
    row.forEach((tileType, colIdx) => {
      const tx = colIdx * PX;
      const ty = rowIdx * PX;
      const seed = colIdx * 31 + rowIdx * 97;

      if (tileType === "ROOFTOP") {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(tx, ty, PX, PX);
        ctx.fillStyle = "#4a4a5a";
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

      if (WINDOW_TYPES.has(tileType)) {
        const isLit = tileType === "WINDOW_LIT";
        const margin = 10;
        const pw = PX - margin * 2;
        const ph = PX - margin * 2 - 4;

        // Window recess (darker wall area)
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx + margin - 3, ty + margin - 3, pw + 6, ph + 6);

        // Stone surround / lintel
        ctx.fillStyle = "#484858";
        ctx.fillRect(tx + margin - 2, ty + margin - 2, pw + 4, ph + 4);

        if (isLit) {
          // Varied light color per window: warm orange, yellow, amber, red-orange, cold white
          const lightVariants: [string, string, string][] = [
            ["#d04800", "rgba(255,210,100,0.9)", "rgba(210,70,0,0.1)"], // orange chaud
            ["#c03000", "rgba(255,160,60,0.9)", "rgba(180,40,0,0.1)"], // rouge-orange
            ["#b05000", "rgba(255,230,80,0.85)", "rgba(200,80,0,0.1)"], // jaune ambré
            ["#a04020", "rgba(255,180,80,0.9)", "rgba(160,50,0,0.1)"], // ambre profond
            ["#204060", "rgba(180,220,255,0.7)", "rgba(20,60,120,0.05)"], // lumière froide TV/écran
          ];
          const variant = lightVariants[seed % lightVariants.length] ?? [
            "#d04800",
            "rgba(255,210,100,0.9)",
            "rgba(210,70,0,0.1)",
          ];
          ctx.fillStyle = variant[0];
          ctx.fillRect(tx + margin, ty + margin, pw, ph);

          const grad = ctx.createRadialGradient(
            tx + PX / 2,
            ty + PX / 2,
            0,
            tx + PX / 2,
            ty + PX / 2,
            pw * 0.65,
          );
          grad.addColorStop(0, variant[1]);
          grad.addColorStop(1, variant[2]);
          ctx.fillStyle = grad;
          ctx.fillRect(tx + margin, ty + margin, pw, ph);

          // Window frame cross
          ctx.fillStyle = "rgba(0,0,0,0.45)";
          ctx.fillRect(tx + PX / 2 - 1, ty + margin, 2, ph);
          ctx.fillRect(tx + margin, ty + PX / 2 - 1, pw, 2);

          // Silhouette in some windows (person standing)
          if (seededRand(seed * 17) > 0.6) {
            ctx.fillStyle = "rgba(0,0,0,0.6)";
            const sx = tx + PX / 2 - 3 + Math.floor((seededRand(seed * 23) - 0.5) * 8);
            const headR = 3;
            // Head
            ctx.beginPath();
            ctx.arc(sx, ty + margin + 6, headR, 0, Math.PI * 2);
            ctx.fill();
            // Body
            ctx.fillRect(sx - 3, ty + margin + 9, 6, ph - 14);
          }
        } else {
          // Dark void — varied: some black, some with partial shutters
          const darkVariant = seed % 3;
          if (darkVariant === 0) {
            // Pure void
            ctx.fillStyle = "#020105";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
          } else if (darkVariant === 1) {
            // Half-closed shutters
            ctx.fillStyle = "#080510";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            ctx.fillStyle = "#1a1428";
            const shutterH = Math.floor(ph * (0.3 + seededRand(seed * 7) * 0.4));
            ctx.fillRect(tx + margin, ty + margin, pw, shutterH);
            // Shutter slats
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            for (let sy = ty + margin + 3; sy < ty + margin + shutterH; sy += 4) {
              ctx.fillRect(tx + margin, sy, pw, 1);
            }
          } else {
            // Faint blue night light inside (reflet ciel)
            ctx.fillStyle = "#060410";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            ctx.fillStyle = "rgba(40,40,80,0.4)";
            ctx.fillRect(tx + margin, ty + margin, pw, ph / 2);
          }
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
