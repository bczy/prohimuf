import { memo, useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";
import type { TileMap, TileType } from "@game/types/tileMap";

function makeNormalMap(diffuseCanvas: HTMLCanvasElement): CanvasTexture {
  const W = diffuseCanvas.width;
  const H = diffuseCanvas.height;
  const srcCtx = diffuseCanvas.getContext("2d");
  const src = srcCtx?.getImageData(0, 0, W, H);
  const sd = src?.data ?? new Uint8ClampedArray(W * H * 4);

  // Luminance from RGB
  const lum = (i: number) =>
    0.299 * (sd[i] ?? 0) + 0.587 * (sd[i + 1] ?? 0) + 0.114 * (sd[i + 2] ?? 0);

  const normal = document.createElement("canvas");
  normal.width = W;
  normal.height = H;
  const nctx = normal.getContext("2d");
  if (nctx === null) return new CanvasTexture(normal);
  const dst = nctx.createImageData(W, H);
  const dd = dst.data;

  const strength = 10.0; // bump intensity — plus élevé = joints de pierre plus marqués

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;
      const tl = lum(((y - 1 + H) % H) * W * 4 + ((x - 1 + W) % W) * 4);
      const t = lum(((y - 1 + H) % H) * W * 4 + x * 4);
      const tr = lum(((y - 1 + H) % H) * W * 4 + ((x + 1) % W) * 4);
      const l = lum(y * W * 4 + ((x - 1 + W) % W) * 4);
      const r = lum(y * W * 4 + ((x + 1) % W) * 4);
      const bl = lum(((y + 1) % H) * W * 4 + ((x - 1 + W) % W) * 4);
      const b = lum(((y + 1) % H) * W * 4 + x * 4);
      const br = lum(((y + 1) % H) * W * 4 + ((x + 1) % W) * 4);

      // Sobel
      const dx = (tr + 2 * r + br - tl - 2 * l - bl) / 255;
      const dy = (bl + 2 * b + br - tl - 2 * t - tr) / 255;

      // Normalise to [0,255]
      const nx = -dx * strength;
      const ny = -dy * strength;
      const len = Math.sqrt(nx * nx + ny * ny + 1);
      dd[idx] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      dd[idx + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      dd[idx + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      dd[idx + 3] = 255;
    }
  }

  nctx.putImageData(dst, 0, 0);
  return new CanvasTexture(normal);
}

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

function makeFacadeCanvas(map: TileMap): HTMLCanvasElement {
  const PX = 80; // pixels per tile — plus grand = plus de détail
  const W = map.cols * PX;
  const H = map.rows * PX;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return canvas;

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

      // ── SHOP : vitrine commerciale ──
      if (tileType === "SHOP") {
        // Grande baie vitrée
        const sw = PX - 8;
        const sh = PX - 14;
        const sx2 = tx + 4;
        const sy2 = ty + 6;
        // Cadre métal sombre
        ctx.fillStyle = "#282030";
        ctx.fillRect(sx2 - 3, sy2 - 3, sw + 6, sh + 6);
        // Vitrine — couleur selon seed
        const shopPick = seed % 4;
        if (shopPick === 0) {
          // Boucherie — néon rouge
          ctx.fillStyle = "#0c0508";
          ctx.fillRect(sx2, sy2, sw, sh);
          const shopGrad = ctx.createLinearGradient(sx2, sy2, sx2, sy2 + sh);
          shopGrad.addColorStop(0, "rgba(200,20,20,0.25)");
          shopGrad.addColorStop(1, "rgba(80,0,0,0.05)");
          ctx.fillStyle = shopGrad;
          ctx.fillRect(sx2, sy2, sw, sh);
          // Enseigne néon
          ctx.fillStyle = "rgba(255,60,60,0.7)";
          ctx.fillRect(sx2 + 6, sy2 + 4, sw - 12, 3);
        } else if (shopPick === 1) {
          // Tabac — jaune
          ctx.fillStyle = "#080604";
          ctx.fillRect(sx2, sy2, sw, sh);
          ctx.fillStyle = "rgba(220,180,0,0.3)";
          ctx.fillRect(sx2, sy2, sw, sh);
          // Losange tabac
          ctx.fillStyle = "rgba(220,180,0,0.6)";
          const mid = sx2 + sw / 2;
          ctx.beginPath();
          ctx.moveTo(mid, sy2 + 4);
          ctx.lineTo(mid + 8, sy2 + 10);
          ctx.lineTo(mid, sy2 + 16);
          ctx.lineTo(mid - 8, sy2 + 10);
          ctx.closePath();
          ctx.fill();
        } else if (shopPick === 2) {
          // Bar — enseigne bleue
          ctx.fillStyle = "#04080c";
          ctx.fillRect(sx2, sy2, sw, sh);
          const barGrad = ctx.createLinearGradient(sx2, sy2, sx2 + sw, sy2);
          barGrad.addColorStop(0, "rgba(20,60,160,0.2)");
          barGrad.addColorStop(0.5, "rgba(60,120,220,0.35)");
          barGrad.addColorStop(1, "rgba(20,60,160,0.2)");
          ctx.fillStyle = barGrad;
          ctx.fillRect(sx2, sy2, sw, sh);
          // Néon "BAR"
          ctx.fillStyle = "rgba(80,160,255,0.8)";
          ctx.fillRect(sx2 + 8, sy2 + 5, 6, 3);
          ctx.fillRect(sx2 + 16, sy2 + 5, 6, 3);
          ctx.fillRect(sx2 + 24, sy2 + 5, 6, 3);
        } else {
          // Pharmacie — croix verte
          ctx.fillStyle = "#040806";
          ctx.fillRect(sx2, sy2, sw, sh);
          ctx.fillStyle = "rgba(0,200,80,0.5)";
          const cx3 = sx2 + sw / 2;
          ctx.fillRect(cx3 - 2, sy2 + 4, 4, 12);
          ctx.fillRect(cx3 - 6, sy2 + 8, 12, 4);
        }
        // Reflet sur la vitrine
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(sx2, sy2, sw * 0.3, sh);
        // Panneau au-dessus
        ctx.fillStyle = "#1a1828";
        ctx.fillRect(tx, ty, PX, 6);
        return;
      }

      // ── FIRE_ESCAPE : escalier métallique ──
      if (tileType === "FIRE_ESCAPE") {
        // Fond mur normal (déjà dessiné) + structure métallique
        // Montants verticaux
        ctx.fillStyle = "#1a1828";
        ctx.fillRect(tx + PX * 0.2, ty, 3, PX);
        ctx.fillRect(tx + PX * 0.75, ty, 3, PX);
        // Reflet
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(tx + PX * 0.2, ty, 1, PX);
        ctx.fillRect(tx + PX * 0.75, ty, 1, PX);
        // Palier horizontal au centre
        ctx.fillStyle = "#252338";
        ctx.fillRect(tx + PX * 0.15, ty + PX * 0.45, PX * 0.65, 5);
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(tx + PX * 0.15, ty + PX * 0.45 + 5, PX * 0.65, 2);
        // Barreau diagonal — escalier
        ctx.fillStyle = "#1e1c30";
        for (let step = 0; step < 4; step++) {
          const sy3 = ty + PX * 0.05 + step * PX * 0.1;
          ctx.fillRect(tx + PX * 0.2, sy3, PX * 0.55, 2);
        }
        // Rouille / oxydation
        ctx.fillStyle = "rgba(120,50,10,0.12)";
        ctx.fillRect(tx + PX * 0.2, ty + PX * 0.6, 3, PX * 0.3);
        return;
      }

      // ── ARCH : arcade décorative haussmannienne ──
      if (tileType === "ARCH") {
        // Pilastre gauche et droit
        ctx.fillStyle = "#484660";
        ctx.fillRect(tx, ty, 10, PX);
        ctx.fillRect(tx + PX - 10, ty, 10, PX);
        // Reflet pilastre
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(tx, ty, 3, PX);
        ctx.fillRect(tx + PX - 10, ty, 3, PX);
        // Arc en plein cintre
        ctx.fillStyle = "#3a3850";
        ctx.beginPath();
        ctx.ellipse(tx + PX / 2, ty + PX * 0.45, PX * 0.35, PX * 0.35, 0, Math.PI, 0);
        ctx.fill();
        // Clé de voûte
        ctx.fillStyle = "#555370";
        ctx.fillRect(tx + PX / 2 - 5, ty + PX * 0.08, 10, 8);
        // Ombre portée de l'arcade
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(tx + 10, ty + PX * 0.45, PX - 20, PX * 0.55);
        // Moulure corniche
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(tx, ty + PX * 0.8, PX, 3);
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

  return canvas;
}

interface Props {
  map: TileMap;
  /** World x position of the building centre (default 0) */
  worldOffsetX?: number;
  /** Total street height in rows — building is bottom-aligned within this height */
  streetHeight?: number;
}

// Depth constants (world units)
const CORNICE_DEPTH = 0.22; // how far cornices stick out from the facade
const CORNICE_H = 0.12; // height of each cornice band
const BASE_DEPTH = 0.35; // soubassement sticks out more
const BASE_H = 0.18;
const FACADE_Z = 0; // facade plane z
const SIDE_SHADOW_W = 0.15; // width of the right-edge shadow strip

export const TiledFacade = memo(function TiledFacade({
  map,
  worldOffsetX = 0,
  streetHeight,
}: Props): JSX.Element {
  const facadeW = map.cols * map.tileW;
  const facadeH = map.rows * map.tileH;
  const yOffset = streetHeight !== undefined ? -((streetHeight - map.rows) * map.tileH) / 2 : 0;

  // Absolute world coords of the mesh centre
  const cx = worldOffsetX;
  const cy = yOffset;

  // Building base Y (bottom edge of building in world space)
  const baseY = cy - facadeH / 2;

  const { diffuse, normal } = useMemo(() => {
    const diffuseCanvas = makeFacadeCanvas(map);
    return {
      diffuse: new CanvasTexture(diffuseCanvas),
      normal: makeNormalMap(diffuseCanvas),
    };
  }, [map]);

  // Cornice positions: one per floor boundary (every tileH rows)
  // Skip row 0 (top of building) — only interior joints
  const cornices = useMemo(() => {
    const result: number[] = [];
    for (let row = 1; row < map.rows; row++) {
      // y in world space: top of building minus row*tileH, offset to mesh centre
      const worldY = cy + facadeH / 2 - row * map.tileH;
      result.push(worldY);
    }
    return result;
  }, [map, cy, facadeH]);

  return (
    <>
      {/* Main facade plane */}
      <mesh position={[cx, cy, FACADE_Z]}>
        <planeGeometry args={[facadeW, facadeH]} />
        <meshStandardMaterial
          map={diffuse}
          normalMap={normal}
          normalScale={[2.5, 2.5]}
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>

      {/* Corniches inter-étages — horizontal bands that stick out */}
      {cornices.map((worldY, i) => (
        <mesh key={i} position={[cx, worldY, FACADE_Z + CORNICE_DEPTH / 2]} castShadow>
          <boxGeometry args={[facadeW, CORNICE_H, CORNICE_DEPTH]} />
          <meshStandardMaterial color="#38354e" roughness={0.7} metalness={0.05} />
        </mesh>
      ))}

      {/* Soubassement — heavier base that sticks out more */}
      <mesh position={[cx, baseY + BASE_H / 2, FACADE_Z + BASE_DEPTH / 2]} castShadow>
        <boxGeometry args={[facadeW, BASE_H, BASE_DEPTH]} />
        <meshStandardMaterial color="#28253a" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Right-edge shadow — thin dark strip simulating depth on the right side */}
      <mesh position={[cx + facadeW / 2 + SIDE_SHADOW_W / 2, cy, FACADE_Z - 0.1]}>
        <planeGeometry args={[SIDE_SHADOW_W, facadeH]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>

      {/* Top-edge dark band — sky meets rooftop */}
      <mesh position={[cx, cy + facadeH / 2 + 0.05, FACADE_Z - 0.1]}>
        <planeGeometry args={[facadeW, 0.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </>
  );
});
