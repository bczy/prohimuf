// Rendu hors-ligne d'une façade pour prévisualiser la ferronnerie sans navigateur.
// Réutilise le vrai code de dessin (src/render/scene/facadeCanvas.ts) via node-canvas,
// puis simule l'éclairage Three.js (diffuse × normal map) pour montrer le relief.
//
// Prérequis : npm i -D canvas   (node-canvas, non inclus dans les deps du jeu)
// Lancement  : node scripts/preview-facade.mjs   → /tmp/facade-{lit,flat,zoom}.png
import { createCanvas } from "canvas";
import { writeFileSync } from "node:fs";
import { makeFacadeCanvas, makeNormalCanvas } from "../src/render/scene/facadeCanvas.ts";

const factory = (w, h) => createCanvas(w, h);

// ── Carte de démonstration : tous les éléments à ferronnerie ────────────────
const COLS = 12;
const ROWS = 14;
const tiles = [];
for (let r = 0; r < ROWS; r++) {
  const row = [];
  for (let c = 0; c < COLS; c++) {
    let t = "WALL";
    if (r === 0) {
      t = "ROOFTOP";
    } else if (r === ROWS - 1) {
      t = c === 6 ? "DOOR" : c === 0 || c === COLS - 1 ? "ARCH" : "SHOP";
    } else if (c === 4) {
      t = "FIRE_ESCAPE";
    } else if (r % 3 === 2 && c % 2 === 1) {
      t = "BALCONY";
    } else {
      t = (r * 7 + c * 13) % 5 === 0 ? "WINDOW_LIT" : "WINDOW_DARK";
    }
    row.push(t);
  }
  tiles.push(row);
}
const map = { name: "preview", cols: COLS, rows: ROWS, tiles, tileW: 1, tileH: 1 };

// ── Pipeline identique à TiledFacade (pixelisation 16-bit) ──────────────────
function pixelate(canvas, block = 4, levels = 8) {
  const ctx = canvas.getContext("2d");
  const { width: W, height: H } = canvas;
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const step = 255 / (levels - 1);
  const post = (v) => Math.round(Math.round(v / step) * step);
  for (let by = 0; by < H; by += block) {
    for (let bx = 0; bx < W; bx += block) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        n = 0;
      const mY = Math.min(by + block, H);
      const mX = Math.min(bx + block, W);
      for (let y = by; y < mY; y++)
        for (let x = bx; x < mX; x++) {
          const i = (y * W + x) * 4;
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
          a += d[i + 3];
          n++;
        }
      const pr = post(r / n),
        pg = post(g / n),
        pb = post(b / n),
        pa = Math.round(a / n);
      for (let y = by; y < mY; y++)
        for (let x = bx; x < mX; x++) {
          const i = (y * W + x) * 4;
          d[i] = pr;
          d[i + 1] = pg;
          d[i + 2] = pb;
          d[i + 3] = pa;
        }
    }
  }
  ctx.putImageData(img, 0, 0);
}

// ── Éclairage simulé : diffuse × (ambient + N·L), N issu de la normal map ───
function renderLit(diffuse, normal, normalScale = 3.2) {
  const W = diffuse.width,
    H = diffuse.height;
  const dd = diffuse.getContext("2d").getImageData(0, 0, W, H).data;
  const nn = normal.getContext("2d").getImageData(0, 0, W, H).data;
  const out = factory(W, H);
  const octx = out.getContext("2d");
  const oi = octx.createImageData(W, H);
  const od = oi.data;
  let Lx = -0.5,
    Ly = -0.55,
    Lz = 0.67;
  const ll = Math.hypot(Lx, Ly, Lz);
  Lx /= ll;
  Ly /= ll;
  Lz /= ll;
  const ambient = 0.5;
  for (let i = 0; i < dd.length; i += 4) {
    let nx = (nn[i] / 255 - 0.5) * 2 * normalScale;
    let ny = (nn[i + 1] / 255 - 0.5) * 2 * normalScale;
    let nz = (nn[i + 2] / 255 - 0.5) * 2;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;
    let ndl = nx * Lx + ny * Ly + nz * Lz;
    if (ndl < 0) ndl = 0;
    const sh = ambient + (1 - ambient) * ndl;
    od[i] = Math.min(255, dd[i] * sh);
    od[i + 1] = Math.min(255, dd[i + 1] * sh);
    od[i + 2] = Math.min(255, dd[i + 2] * sh);
    od[i + 3] = 255;
  }
  octx.putImageData(oi, 0, 0);
  return out;
}

function scaledCrop(src, sx, sy, sw, sh, scale) {
  const out = factory(sw * scale, sh * scale);
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw * scale, sh * scale);
  return out;
}

// ── Rendu ───────────────────────────────────────────────────────────────────
const diffuse = makeFacadeCanvas(map, factory);
pixelate(diffuse, 4, 8);
const normal = makeNormalCanvas(diffuse, factory);
const lit = renderLit(diffuse, normal);

writeFileSync("/tmp/facade-lit.png", lit.toBuffer("image/png"));
writeFileSync("/tmp/facade-flat.png", diffuse.toBuffer("image/png"));

// Zoom 2× sur le rez-de-chaussée (porte cochère + balcons + grilles) — 8×8 tuiles
const PX = 80;
const crop = scaledCrop(lit, 2 * PX, 6 * PX, 8 * PX, 8 * PX, 2);
writeFileSync("/tmp/facade-zoom.png", crop.toBuffer("image/png"));

console.log("OK", diffuse.width + "x" + diffuse.height);
