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

// Light color variants per window [base, center glow, halo color, halo outer]
const LIGHT_VARIANTS: [string, string, string, string][] = [
  ["#c84000", "rgba(255,200,80,1)", "rgba(255,120,20,0.6)", "rgba(255,100,0,0.12)"], // orange chaud
  ["#a03000", "rgba(255,140,40,1)", "rgba(200,60,0,0.6)", "rgba(200,80,0,0.1)"], // rouge-orange
  ["#904800", "rgba(255,220,60,1)", "rgba(180,120,0,0.6)", "rgba(220,140,0,0.1)"], // jaune ambré
  ["#182840", "rgba(160,210,255,1)", "rgba(60,130,220,0.6)", "rgba(40,80,200,0.08)"], // TV froide
  ["#803020", "rgba(255,160,60,1)", "rgba(180,60,20,0.6)", "rgba(180,60,0,0.1)"], // ambre sombre
  ["#001a10", "rgba(80,255,140,1)", "rgba(20,200,80,0.6)", "rgba(0,180,60,0.08)"], // néon vert
  ["#1a0030", "rgba(220,120,255,1)", "rgba(160,40,220,0.65)", "rgba(120,0,200,0.1)"], // néon violet
  ["#0d1a30", "rgba(100,180,255,1)", "rgba(30,100,200,0.55)", "rgba(20,60,180,0.07)"], // bleu froid bureau
  ["#200800", "rgba(255,80,40,1)", "rgba(200,20,0,0.65)", "rgba(160,0,0,0.1)"], // rouge sang
  ["#1a1500", "rgba(255,240,100,1)", "rgba(200,180,10,0.55)", "rgba(180,160,0,0.08)"], // jaune fluo
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
        // Antenne TV — 25% de chance
        if (seededRand(seed * 5) > 0.75) {
          const ax = tx + Math.floor(seededRand(seed * 41) * (PX - 8)) + 4;
          ctx.fillStyle = "#666680";
          ctx.fillRect(ax, ty + 4, 2, PX - 16);
          ctx.fillRect(ax - 6, ty + 8, 14, 2);
          ctx.fillRect(ax - 4, ty + 14, 10, 1);
        }
        // Cheminée — 20% de chance
        if (seededRand(seed * 13) > 0.8) {
          const cx2 = tx + Math.floor(seededRand(seed * 37) * (PX - 14)) + 7;
          ctx.fillStyle = "#38304a";
          ctx.fillRect(cx2, ty + PX * 0.2, 14, PX * 0.55);
          ctx.fillStyle = "#28203a";
          ctx.fillRect(cx2 - 2, ty + PX * 0.2, 18, 5);
          // Fumée légère
          ctx.fillStyle = "rgba(180,180,200,0.07)";
          ctx.fillRect(cx2, ty, 14, PX * 0.25);
        }
        return;
      }

      // ── BALCONY ──
      if (tileType === "BALCONY") {
        // Dalle de balcon en bas de la tile
        ctx.fillStyle = "#35304a";
        ctx.fillRect(tx - 4, ty + PX - 10, PX + 8, 10);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(tx - 4, ty + PX - 10, PX + 8, 2);
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(tx - 4, ty + PX - 1, PX + 8, 2);
        // Balustrade en fer forgé — barreaux
        const barCount = 5;
        const barSpacing = PX / (barCount + 1);
        ctx.fillStyle = "#4a4560";
        for (let b = 1; b <= barCount; b++) {
          const bx = tx + Math.floor(b * barSpacing);
          ctx.fillRect(bx, ty + PX * 0.45, 2, PX * 0.45);
        }
        // Rail horizontal
        ctx.fillStyle = "#55507a";
        ctx.fillRect(tx, ty + PX * 0.45, PX, 3);
        // Plante ou linge — 40% de chance
        const balV = seededRand(seed * 19);
        if (balV > 0.6) {
          // Pot de plante
          ctx.fillStyle = "#6a3820";
          ctx.fillRect(tx + PX * 0.6, ty + PX * 0.35, 10, 8);
          ctx.fillStyle = "#1a5010";
          ctx.fillRect(tx + PX * 0.58, ty + PX * 0.2, 14, 18);
        } else if (balV > 0.4) {
          // Linge
          const lx = tx + Math.floor(seededRand(seed * 29) * PX * 0.5) + PX * 0.1;
          ctx.fillStyle = `rgba(${String(Math.floor(seededRand(seed) * 200 + 55))},${String(Math.floor(seededRand(seed * 3) * 200 + 55))},${String(Math.floor(seededRand(seed * 7) * 200 + 55))},0.6)`;
          ctx.fillRect(lx, ty + PX * 0.48, 18, 12);
        }
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
          const darkV = seed % 5;
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
          } else if (darkV === 2) {
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
          } else if (darkV === 3) {
            // Rideau tiré — tissu froissé
            ctx.fillStyle = "#0a0814";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            const folds = 3 + Math.floor(seededRand(seed * 11) * 3);
            for (let f = 0; f < folds; f++) {
              const fx = tx + margin + Math.floor((f / folds) * pw);
              const fw = Math.floor(pw / folds);
              const bright = seededRand(seed * (f + 17)) * 0.06;
              ctx.fillStyle = `rgba(60,50,80,${String(bright)})`;
              ctx.fillRect(fx, ty + margin, fw * 0.5, ph);
            }
          } else {
            // Néon vert de rue — reflet dans la vitre
            ctx.fillStyle = "#030808";
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
            const neonGrad = ctx.createLinearGradient(
              tx + margin,
              ty + margin + ph,
              tx + margin + pw,
              ty + margin,
            );
            neonGrad.addColorStop(0, "rgba(0,80,30,0.18)");
            neonGrad.addColorStop(0.5, "rgba(0,40,15,0.06)");
            neonGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = neonGrad;
            ctx.fillRect(tx + margin, ty + margin, pw, ph);
          }
          // Croisillon visible même dans le noir
          ctx.fillStyle = "rgba(60,55,80,0.6)";
          ctx.fillRect(cx - 1, ty + margin, 2, ph);
          ctx.fillRect(tx + margin, cy2 - 1, pw, 2);
        }
        return;
      }

      // ── WALL : détails procéduraux ──
      const wallV = seededRand(seed * 11);
      if (wallV > 0.72) {
        // Tache d'humidité
        const stainW = 6 + Math.floor(seededRand(seed) * 16);
        const stainH2 = 12 + Math.floor(seededRand(seed * 13) * 28);
        const sx = tx + Math.floor(seededRand(seed * 3) * (PX - stainW));
        const sy = ty + Math.floor(seededRand(seed * 7) * (PX - stainH2));
        ctx.fillStyle = "rgba(0,0,0,0.1)";
        ctx.fillRect(sx, sy, stainW, stainH2);
      } else if (wallV > 0.52) {
        // Affiche arrachée — rectangles irréguliers colorés
        const pw2 = 14 + Math.floor(seededRand(seed * 23) * (PX - 20));
        const ph2 = 10 + Math.floor(seededRand(seed * 29) * (PX - 16));
        const px2 = tx + Math.floor(seededRand(seed * 31) * (PX - pw2));
        const py2 = ty + Math.floor(seededRand(seed * 37) * (PX - ph2));
        // Fond de l'affiche (couleur fanzine — rouge, jaune, cyan)
        const posterPick = seed % 4;
        const posterColor =
          posterPick === 1
            ? "rgba(200,160,0,0.3)"
            : posterPick === 2
              ? "rgba(0,100,140,0.3)"
              : posterPick === 3
                ? "rgba(80,0,120,0.28)"
                : "rgba(180,20,20,0.35)";
        ctx.fillStyle = posterColor;
        ctx.fillRect(px2, py2, pw2, ph2);
        // Arrachure — triangle de coin manquant
        if (seededRand(seed * 43) > 0.5) {
          ctx.fillStyle = "rgba(0,0,0,0.3)";
          ctx.beginPath();
          ctx.moveTo(px2 + pw2 * 0.6, py2);
          ctx.lineTo(px2 + pw2, py2);
          ctx.lineTo(px2 + pw2, py2 + ph2 * 0.5);
          ctx.closePath();
          ctx.fill();
        }
        // Lignes de texte simulées
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(px2 + 3, py2 + 4, pw2 * 0.7, 2);
        ctx.fillRect(px2 + 3, py2 + 8, pw2 * 0.5, 2);
      } else if (wallV > 0.38) {
        // Tuyau vertical
        const px3 = tx + Math.floor(seededRand(seed * 53) * (PX - 8));
        ctx.fillStyle = "#2a2838";
        ctx.fillRect(px3, ty, 6, PX);
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(px3, ty, 2, PX);
        // Collier de fixation
        ctx.fillStyle = "#3a3850";
        ctx.fillRect(px3 - 2, ty + PX * 0.4, 10, 5);
      } else if (wallV > 0.26) {
        // Graffiti — ligne de lettres stylisées
        const gy = ty + Math.floor(seededRand(seed * 61) * (PX - 12));
        const graffPick = seed % 4;
        const graffColor =
          graffPick === 1
            ? "rgba(40,160,60,0.35)"
            : graffPick === 2
              ? "rgba(200,200,0,0.35)"
              : graffPick === 3
                ? "rgba(40,100,200,0.35)"
                : "rgba(200,40,40,0.4)";
        ctx.fillStyle = graffColor;
        const gw = 20 + Math.floor(seededRand(seed * 67) * 30);
        ctx.fillRect(tx + Math.floor(seededRand(seed * 71) * (PX - gw)), gy, gw, 7);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(tx + Math.floor(seededRand(seed * 71) * (PX - gw)) + 1, gy + 1, gw - 2, 2);
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
