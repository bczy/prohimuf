import { memo, useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";
import type { TileMap, TileType } from "@game/types/tileMap";

const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

const FALLBACK_VARIANT: [string, string, string, string] = [
  "#c84000",
  "rgba(255,200,80,1)",
  "rgba(255,120,20,0.6)",
  "rgba(255,100,0,0.12)",
];

function pickVariant(seed: number): [string, string, string, string] {
  return (
    LIGHT_VARIANTS[
      ((seed % LIGHT_VARIANTS.length) + LIGHT_VARIANTS.length) % LIGHT_VARIANTS.length
    ] ?? FALLBACK_VARIANT
  );
}

// Light color variants per window [base, center glow, halo color]
const LIGHT_VARIANTS: [string, string, string, string][] = [
  ["#c84000", "rgba(255,200,80,1)", "rgba(255,120,20,0.6)", "rgba(255,100,0,0.12)"], // orange chaud
  ["#a03000", "rgba(255,140,40,1)", "rgba(200,60,0,0.6)", "rgba(200,80,0,0.1)"], // rouge-orange
  ["#904800", "rgba(255,220,60,1)", "rgba(180,120,0,0.6)", "rgba(220,140,0,0.1)"], // jaune ambré
  ["#182840", "rgba(160,210,255,1)", "rgba(60,130,220,0.6)", "rgba(40,80,200,0.08)"], // TV froide
  ["#803020", "rgba(255,160,60,1)", "rgba(180,60,20,0.6)", "rgba(180,60,0,0.1)"], // ambre sombre
];

function makeFacadeTexture(map: TileMap): CanvasTexture {
  const PX = 80; // pixels per tile — plus grand = plus de détail
  const W = map.cols * PX;
  const H = map.rows * PX;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new CanvasTexture(canvas);

  // ── 1. Gradient de fond : plus sombre en haut (ciel), plus chaud en bas (rue) ──
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#2a2835");
  bgGrad.addColorStop(1, "#383548");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Blocs de pierre ──
  const blockH = 20;
  const blockW = 52;
  for (let py = 0; py < H; py += blockH) {
    const bRow = Math.floor(py / blockH);
    const offset = (bRow % 2) * (blockW / 2);
    for (let px = offset; px < W; px += blockW) {
      // Légère variation de teinte par bloc
      const bSeed = bRow * 137 + Math.floor(px / blockW) * 31;
      const lightness = (seededRand(bSeed) - 0.5) * 0.06;
      if (lightness > 0) {
        ctx.fillStyle = `rgba(255,255,255,${String(lightness)})`;
      } else {
        ctx.fillStyle = `rgba(0,0,0,${String(-lightness)})`;
      }
      ctx.fillRect(px + 1, py + 1, blockW - 2, blockH - 1);
      // Joint horizontal
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(px + 2, py, blockW - 4, 1);
      // Joint vertical
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(px, py + 1, 1, blockH - 1);
    }
  }

  // ── 3. Grain photocopié ──
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (seededRand(i * 0.0001) - 0.5) * 18;
    data[i] = Math.max(0, Math.min(255, (data[i] ?? 0) + noise));
    data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] ?? 0) + noise * 0.85));
    data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] ?? 0) + noise * 1.1));
  }
  ctx.putImageData(imgData, 0, 0);

  // ── 4. Scanlines ──
  for (let y = 0; y < H; y += 3) {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, y, W, 1);
  }

  // ── 5. Corniche entre étages ──
  for (let rowIdx = 1; rowIdx < map.rows; rowIdx++) {
    const cy = rowIdx * PX;
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.fillRect(0, cy - 4, W, 4);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(0, cy, W, 2);
  }

  // ── 6. PASS 1 : halos de lumière DERRIÈRE les fenêtres ──
  // Dessinés avant les détails pour que la lumière "baigne" le mur
  map.tiles.forEach((row, rowIdx) => {
    row.forEach((tileType, colIdx) => {
      if (tileType !== "WINDOW_LIT") return;
      const tx = colIdx * PX + PX / 2;
      const ty = rowIdx * PX + PX / 2;
      const seed = colIdx * 31 + rowIdx * 97;
      const variant = pickVariant(seed);

      // Grand halo diffus sur le mur environnant
      const halo = ctx.createRadialGradient(tx, ty, PX * 0.2, tx, ty, PX * 1.4);
      halo.addColorStop(0, variant[3]);
      halo.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(tx - PX * 1.4, ty - PX * 1.4, PX * 2.8, PX * 2.8);
    });
  });

  // ── 7. PASS 2 : détails par tile ──
  map.tiles.forEach((row, rowIdx) => {
    row.forEach((tileType, colIdx) => {
      const tx = colIdx * PX;
      const ty = rowIdx * PX;
      const seed = colIdx * 31 + rowIdx * 97;

      // ── ROOFTOP ──
      if (tileType === "ROOFTOP") {
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx, ty, PX, PX);
        // Rebord zinc
        ctx.fillStyle = "#50506a";
        ctx.fillRect(tx, ty + PX - 8, PX, 8);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(tx, ty + PX - 8, PX, 2);
        return;
      }

      // ── DOOR ──
      if (tileType === "DOOR") {
        const dw = PX - 16;
        const dh = PX * 2 - 6;
        const dx = tx + 8;
        const dy = ty;
        // Encadrement pierre
        ctx.fillStyle = "#404055";
        ctx.fillRect(dx - 4, dy - 4, dw + 8, dh + 4);
        // Fond porte
        ctx.fillStyle = "#0a0810";
        ctx.fillRect(dx, dy, dw, dh);
        // Séparation double battant
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(dx + dw / 2 - 1, dy, 2, dh);
        // Arc en haut
        ctx.fillStyle = "#404055";
        ctx.beginPath();
        ctx.ellipse(dx + dw / 2, dy + 2, dw / 2, 10, 0, Math.PI, 0);
        ctx.fill();
        // Interphone
        ctx.fillStyle = "#ffe600";
        ctx.fillRect(dx + dw - 10, dy + 10, 5, 3);
        // Légère lumière au sol devant la porte
        const doorLight = ctx.createRadialGradient(
          dx + dw / 2,
          dy + dh,
          0,
          dx + dw / 2,
          dy + dh,
          30,
        );
        doorLight.addColorStop(0, "rgba(255,200,80,0.15)");
        doorLight.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = doorLight;
        ctx.fillRect(dx - 20, dy + dh - 20, dw + 40, 40);
        return;
      }

      // ── FENÊTRES ──
      if (WINDOW_TYPES.has(tileType)) {
        const isLit = tileType === "WINDOW_LIT";
        const margin = 12;
        const pw = PX - margin * 2;
        const ph = PX - margin * 2 - 6;
        const cx = tx + PX / 2;
        const cy2 = ty + PX / 2;

        // Encadrement pierre (légèrement plus clair que le mur)
        ctx.fillStyle = "#4a4860";
        ctx.fillRect(tx + margin - 3, ty + margin - 3, pw + 6, ph + 6);

        // Appui de fenêtre en bas
        ctx.fillStyle = "#555570";
        ctx.fillRect(tx + margin - 4, ty + margin + ph + 3, pw + 8, 4);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx + margin - 4, ty + margin + ph + 7, pw + 8, 2);

        if (isLit) {
          const variant = pickVariant(seed);

          // Fond lumineux
          ctx.fillStyle = variant[0];
          ctx.fillRect(tx + margin, ty + margin, pw, ph);

          // Gradient radial — lumière centrale
          const innerGrad = ctx.createRadialGradient(cx, cy2, 0, cx, cy2, pw * 0.7);
          innerGrad.addColorStop(0, variant[1]);
          innerGrad.addColorStop(0.6, variant[2]);
          innerGrad.addColorStop(1, variant[0]);
          ctx.fillStyle = innerGrad;
          ctx.fillRect(tx + margin, ty + margin, pw, ph);

          // Croisillon de fenêtre
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(cx - 1, ty + margin, 2, ph);
          ctx.fillRect(tx + margin, cy2 - 1, pw, 2);

          // Reflet sur le bord supérieur du cadre
          ctx.fillStyle = "rgba(255,255,255,0.15)";
          ctx.fillRect(tx + margin - 3, ty + margin - 3, pw + 6, 2);

          // Silhouette — 35% de chance
          if (seededRand(seed * 17) > 0.65) {
            const sx = cx + Math.floor((seededRand(seed * 23) - 0.5) * pw * 0.4);
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            // Tête
            ctx.beginPath();
            ctx.arc(sx, ty + margin + 7, 4, 0, Math.PI * 2);
            ctx.fill();
            // Corps
            ctx.fillRect(sx - 4, ty + margin + 11, 8, ph - 16);
          }
        } else {
          const darkV = seed % 3;
          if (darkV === 0) {
            // Vide absolu
            ctx.fillStyle = "#020104";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
          } else if (darkV === 1) {
            // Volets bois mi-fermés
            ctx.fillStyle = "#0e0c18";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            const shutH = Math.floor(ph * (0.25 + seededRand(seed * 7) * 0.45));
            ctx.fillStyle = "#1e1a2c";
            ctx.fillRect(tx + margin, ty + margin, pw, shutH);
            for (let sy = ty + margin + 2; sy < ty + margin + shutH; sy += 5) {
              ctx.fillStyle = "rgba(0,0,0,0.45)";
              ctx.fillRect(tx + margin, sy, pw, 2);
              ctx.fillStyle = "rgba(255,255,255,0.03)";
              ctx.fillRect(tx + margin, sy + 2, pw, 1);
            }
          } else {
            // Reflet bleu nuit / ciel
            ctx.fillStyle = "#050410";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            const skyGrad = ctx.createLinearGradient(
              tx + margin,
              ty + margin,
              tx + margin,
              ty + margin + ph,
            );
            skyGrad.addColorStop(0, "rgba(30,40,80,0.5)");
            skyGrad.addColorStop(1, "rgba(5,5,15,0)");
            ctx.fillStyle = skyGrad;
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
          }
          // Croisillon visible même dans le noir
          ctx.fillStyle = "rgba(60,55,80,0.6)";
          ctx.fillRect(cx - 1, ty + margin, 2, ph);
          ctx.fillRect(tx + margin, cy2 - 1, pw, 2);
        }
        return;
      }

      // ── WALL : taches d'humidité et variation ──
      if (seededRand(seed * 11) > 0.72) {
        const stainW = 6 + Math.floor(seededRand(seed) * 16);
        const stainH2 = 12 + Math.floor(seededRand(seed * 13) * 28);
        const sx = tx + Math.floor(seededRand(seed * 3) * (PX - stainW));
        const sy = ty + Math.floor(seededRand(seed * 7) * (PX - stainH2));
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(sx, sy, stainW, stainH2);
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
