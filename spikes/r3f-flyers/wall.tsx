import { createRoot } from "react-dom/client";
import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function seeded(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function hash1(n: number): number {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Smoothly interpolated 1-D value noise. Sums of `sin` — however many octaves — stay
 * PERIODIC, and the eye reads that instantly as a drawn curve rather than as damage.
 * Noise is aperiodic, which is the whole point for torn edges.
 */
function valueNoise1(x: number, seed: number): number {
  const i0 = Math.floor(x);
  const f = x - i0;
  const a = hash1(i0 + seed * 57.3);
  const b = hash1(i0 + 1 + seed * 57.3);
  const t = f * f * (3 - 2 * f); // smoothstep
  return a + (b - a) * t;
}

/** Two octaves of value noise — enough irregularity, no visible rhythm. */
function fbm1(x: number, seed: number): number {
  return 0.65 * valueNoise1(x, seed) + 0.35 * valueNoise1(x * 2.7, seed + 11);
}

interface FlyerSpec {
  color: string;
  /** Crew, set small and letter-spaced above the title (deck §2.2). */
  crew: string;
  title: string;
  slogan: string;
  dateLine: string;
  zoneLine: string;
  infoLine: string;
  /** The dense practical block — the thing that makes a real rave flyer read as one. */
  smallPrint: string[];
  code: string;
  badge: string;
  /** Which composition this crew's printer used — never the same twice in a row. */
  template: "classic" | "block" | "hand" | "minimal";
  /**
   * The sheet's one illustration. Deliberately UNIQUE across the wall: the spiral is
   * SPIRALE 23's emblem, so it belongs to their flyer and nowhere else — repeating it
   * would turn a crew's signature into wallpaper.
   */
  motif: "spiral" | "smiley" | "rings" | "halftone" | "invader" | "none";
  targetX: number;
  order: number;
  rest: number;
  /** Rip localised bites out of the right edge. */
  tear?: boolean;
  /** Slash a narrow slit up from the bottom edge (you see through it). */
  slit?: boolean;
}

// Copy taken from the shipped `PLAYABLE_COPY` in src/render/ui/menu/LevelFlyer.tsx, so
// this prototype is testing the real fiction, not lorem. The small print is written in
// the register of the period references (PAF in francs, navettes, Minitel 3615).
const FLYERS: FlyerSpec[] = [
  {
    color: "#ece7da", crew: "SANS SYSTÈME · AVANT LE SON", title: "REPÉRAGE",
    slogan: "TA PREMIÈRE — LIS TOUT", dateLine: "ICI, MAINTENANT", zoneLine: "PAS BESOIN D'APPELER",
    infoLine: "—", smallPrint: ["ON T'APPREND À ROULER.", "À RÉCUPÉRER. À LIVRER.", "À ESQUIVER.", "PRENDS TON TEMPS."],
    code: "3615 MUF", badge: "TUTORIEL", template: "minimal", motif: "smiley", targetX: -7.6, order: 0, rest: -2, tear: true,
  },
  {
    color: "#ff4fa3", crew: "SPIRALE 23", title: "BELLIARD",
    slogan: "LE SON MONTE PAR LES TOITS", dateLine: "SAM. → DIM. · 23H → ?", zoneLine: "QUELQUE PART DANS LE 19e",
    infoLine: "08 36 23 19 98",
    smallPrint: ["RV : SUR L'INFO-LINE", "NAVETTES : DÉPARTS 23H, 00H, 01H", "P.A.F. : 60 F · AFTER : 30 F", "AMBIANCE : ÇA ROULE", "NO DRUG. SECURITY FRIENDLY BUT FIRM."],
    code: "3615 MUF", badge: "FACILE", template: "classic", motif: "spiral", targetX: -3.8, order: 1, rest: 3, tear: true, slit: true,
  },
  {
    color: "#b7f32b", crew: "KANAL SYSTEM", title: "STALINGRAD",
    slogan: "UN ENTREPÔT · UN MUR DE SON", dateLine: "NUIT ENTIÈRE · 00H → AUBE", zoneLine: "BORDS DU CANAL · 19e",
    infoLine: "08 36 23 95 19",
    smallPrint: ["RV : SUR L'INFO-LINE", "SUIVRE LE FLÉCHAGE DEPUIS LE QUAI", "P.A.F. : 80 F · PARKING GARDÉ", "AMBIANCE : CHAUD", "NO DRUG. PAS DE VERRE."],
    code: "3615 MUF", badge: "NORMAL", template: "hand", motif: "rings", targetX: 0, order: 2, rest: -1.5, tear: true, slit: true,
  },
  {
    color: "#f5762a", crew: "NADIR 94", title: "VITRY",
    slogan: "AU PIED DES BARRES · SON MAXIMAL", dateLine: "JUSQU'AU LEVER DU JOUR", zoneLine: "VAL-DE-MARNE · 94 · TU CONNAIS ?",
    infoLine: "08 36 23 94 09",
    smallPrint: ["RV : SUR L'INFO-LINE", "A 12 KM DE PORTE D'ITALIE · N7", "P.A.F. : 80 F · AFTER : 40 F", "AMBIANCE : BRÛLANT", "NO DRUG. ON RANGE EN PARTANT."],
    code: "3615 MUF", badge: "DIFFICILE", template: "block", motif: "halftone", targetX: 3.8, order: 3, rest: 2, tear: true,
  },
  {
    color: "#9a9a9a", crew: "SPIRALE 23 · KANAL SYSTEM · NADIR 94", title: "L'ÉDEN",
    slogan: "LE DERNIER SON DU SIÈCLE", dateLine: "31 DÉC. 1999 → JUSQU'EN 2000", zoneLine: "L'ÉDEN · ANCIEN DANCING",
    infoLine: "08 36 · · · · ·",
    smallPrint: ["RV : INCONNU", "LIGNE MUETTE", "DATE À VENIR", "PAS ENCORE POUR TOI"],
    code: "LIGNE FERMÉE", badge: "LIGNE FERMÉE", template: "minimal", motif: "invader", targetX: 7.6, order: 4, rest: -2.5, tear: true,
  },
];

const ENTRY_RADIUS_X = 15, ENTRY_RADIUS_Y = 10;

function entryPoint(i: number, total: number): THREE.Vector3 {
  const baseDeg = -90 + (i * 360) / total;
  const jitterDeg = (seeded(i, 50) - 0.5) * (360 / total) * 0.4;
  const rad = ((baseDeg + jitterDeg) * Math.PI) / 180;
  // Entry also comes from DEPTH (z), not just the 2D screen plane — the flyers fly in
  // from behind/toward the camera, which is the whole point of doing this in 3D.
  const z = -6 - seeded(i, 51) * 5;
  return new THREE.Vector3(Math.cos(rad) * ENTRY_RADIUS_X, Math.sin(rad) * ENTRY_RADIUS_Y, z);
}

function bezier3(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number): THREE.Vector3 {
  const it = 1 - t;
  return new THREE.Vector3(
    it * it * p0.x + 2 * it * t * p1.x + t * t * p2.x,
    it * it * p0.y + 2 * it * t * p1.y + t * t * p2.y,
    it * it * p0.z + 2 * it * t * p1.z + t * t * p2.z,
  );
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const INK = "#161514";

/*
 * ─── Motifs ────────────────────────────────────────────────────────────────────
 * ONE ink, flat shapes, no gradients or soft edges. That is not a stylistic whim:
 * a second colour doubled the print bill, so the era's flyers are stencils, rub-down
 * lettering and photocopied line art. Anything that would have needed a real press
 * (soft shading, many colours) reads as anachronistic here.
 */

/** Spiral Tribe's emblem — and literally SPIRALE 23's namesake. */
function drawSpiral(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = r * 0.14;
  ctx.lineCap = "round";
  ctx.beginPath();
  const turns = 3.2;
  for (let a = 0; a <= turns * Math.PI * 2; a += 0.08) {
    const rr = (a / (turns * Math.PI * 2)) * r;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Acid-house smiley: two dots and an arc, the cheapest icon of the decade. */
function drawSmiley(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.34, cy - r * 0.22, r * 0.1, r * 0.19, 0, 0, Math.PI * 2);
  ctx.ellipse(cx + r * 0.34, cy - r * 0.22, r * 0.1, r * 0.19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = r * 0.15;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.06, r * 0.58, 0.28 * Math.PI, 0.72 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

/**
 * Space Invader. The perfect cheap-print motif and not an anachronism: the arcade
 * sprite was already 20 years old in 1998, and its pixel grid is literally a set of
 * solid squares — the cheapest thing a stencil or a photocopier can reproduce.
 */
const INVADER: readonly string[] = [
  "..X.....X..",
  "...X...X...",
  "..XXXXXXX..",
  ".XX.XXX.XX.",
  "XXXXXXXXXXX",
  "X.XXXXXXX.X",
  "X.X.....X.X",
  "...XX.XX...",
];

function drawInvader(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  const cols = INVADER[0].length;
  const rows = INVADER.length;
  const px = (r * 2) / cols;
  const x0 = cx - (cols * px) / 2;
  const y0 = cy - (rows * px) / 2;
  ctx.save();
  ctx.fillStyle = INK;
  for (let ry = 0; ry < rows; ry++) {
    for (let rx = 0; rx < cols; rx++) {
      if (INVADER[ry][rx] !== "X") continue;
      // Overlap each cell by a hair so the blocks weld instead of showing seams,
      // the way ink spreads on cheap stock.
      ctx.fillRect(x0 + rx * px, y0 + ry * px, px + 0.6, px + 0.6);
    }
  }
  ctx.restore();
}

/** Concentric rings — the hypnotic target of the yellow reference flyer. */
function drawRings(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.strokeStyle = INK;
  for (let k = 1; k * 0.11 <= 1; k++) {
    ctx.lineWidth = r * 0.055;
    ctx.beginPath();
    ctx.arc(cx, cy, r * k * 0.11, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Coarse halftone block — a photo reduced to dots so it could be photocopied at all.
 * Big visible dots, exactly the crude screen a cheap repro shop produced.
 */
function drawHalftoneBlock(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, i: number,
): void {
  ctx.save();
  ctx.fillStyle = INK;
  const step = 11;
  for (let py = y; py < y + h; py += step) {
    for (let px = x; px < x + w; px += step) {
      const u = (px - x) / w, v = (py - y) / h;
      // A soft blob shape, thresholded into dot SIZE — the halftone's whole trick.
      const field =
        0.55 +
        0.45 * Math.sin(u * 5 + i) * Math.cos(v * 4.2 - i) +
        0.25 * Math.sin((u + v) * 9);
      const rad = Math.max(0, Math.min(1, field)) * step * 0.62;
      if (rad < 0.6) continue;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * Flyer artwork. FOUR distinct templates, because a wall where every sheet shares one
 * layout reads as a UI grid, not as flyers collected from five different crews — the
 * reference book's pages are all different. Single dark ink on saturated stock; the
 * print defects go on after the type.
 */
function makeCardTexture(f: FlyerSpec, i: number): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 768; c.height = 1024; // 3:4, matching the card aspect so nothing is squashed
  const ctx = c.getContext("2d")!;
  const mid = c.width / 2;

  ctx.fillStyle = f.color;
  ctx.fillRect(0, 0, c.width, c.height);

  // Photocopy toner streaks.
  ctx.strokeStyle = "rgba(0,0,0,0.045)";
  ctx.lineWidth = 1;
  for (let y = -c.height; y < c.width + c.height; y += 7) {
    ctx.beginPath();
    ctx.moveTo(y, 0);
    ctx.lineTo(y + c.height, c.height);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  for (let s = 0; s < 7; s++) {
    ctx.fillRect(
      seeded(i, s) * c.width, seeded(i, s + 10) * c.height,
      2 + seeded(i, s + 20) * 4, 50 + seeded(i, s + 30) * 170,
    );
  }

  const centred = (text: string, y: number, font: string, spacing = 0) => {
    ctx.font = font;
    if (spacing === 0) {
      ctx.fillText(text, mid - ctx.measureText(text).width / 2, y);
      return;
    }
    const chars = [...text];
    const w = chars.reduce((a, ch) => a + ctx.measureText(ch).width + spacing, -spacing);
    let x = mid - w / 2;
    for (const ch of chars) {
      ctx.fillText(ch, x, y);
      x += ctx.measureText(ch).width + spacing;
    }
  };

  ctx.fillStyle = INK;

  /** Fit a display line to the sheet width, so long names never overflow. */
  const fitTitle = (text: string, max: number, margin: number) => {
    let size = max;
    ctx.font = `bold ${size}px monospace`;
    while (ctx.measureText(text).width > c.width - margin && size > 30) {
      size -= 3;
      ctx.font = `bold ${size}px monospace`;
    }
    return size;
  };

  const rule = (y: number, inset: number, weight = 3) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = weight;
    ctx.beginPath();
    ctx.moveTo(inset, y);
    ctx.lineTo(c.width - inset, y);
    ctx.stroke();
  };

  const stamp = (y: number, tilt: number) => {
    ctx.save();
    ctx.translate(mid, y);
    ctx.rotate(tilt);
    ctx.font = "bold 30px monospace";
    const bw = ctx.measureText(f.badge).width + 56;
    ctx.lineWidth = 5;
    ctx.strokeRect(-bw / 2, -34, bw, 62);
    ctx.fillText(f.badge, -bw / 2 + 28, 8);
    ctx.restore();
  };

  const smallPrintBlock = (top: number) => {
    rule(top, 140, 2);
    f.smallPrint.forEach((line, n) => {
      centred(line, top + 42 + n * 30, "19px monospace");
    });
  };

  const codeBox = (y: number) => {
    ctx.font = "bold 26px monospace";
    const cw = ctx.measureText(f.code).width + 34;
    ctx.lineWidth = 4;
    ctx.strokeRect(mid - cw / 2, y, cw, 46);
    centred(f.code, y + 32, "bold 26px monospace");
  };

  let titleSize = 0;
  let titleY = 0;

  /** The sheet's single illustration, whatever the layout puts it. */
  const motif = (cx: number, cy: number, r: number, alpha = 1) => {
    if (f.motif === "none") return;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (f.motif === "spiral") drawSpiral(ctx, cx, cy, r);
    else if (f.motif === "invader") drawInvader(ctx, cx, cy, r);
    else if (f.motif === "smiley") drawSmiley(ctx, cx, cy, r);
    else if (f.motif === "rings") drawRings(ctx, cx, cy, r);
    else drawHalftoneBlock(ctx, cx - r, cy - r * 0.8, r * 2, r * 1.6, i);
    ctx.restore();
  };

  if (f.template === "block") {
    // Big single-ink illustration up top, type pushed below it (the ERO TIKA page).
    motif(mid, 268, 288);
    centred(f.crew, 500, "bold 20px monospace", 4);
    titleSize = fitTitle(f.title, 96, 90);
    titleY = 588;
    centred(f.title, titleY, `bold ${titleSize}px monospace`);
    centred(f.slogan, 630, "bold 22px monospace");
    rule(664, 110);
    centred(f.dateLine, 706, "24px monospace");
    centred(f.zoneLine, 740, "24px monospace");
    centred(f.infoLine, 800, "bold 34px monospace");
    stamp(870, 0.03);
    codeBox(946);
  } else if (f.template === "hand") {
    // Everything crammed and centred, the motif sitting behind the type (Butterflies).
    centred(f.crew, 96, "bold 20px monospace", 4);
    titleSize = fitTitle(f.title, 104, 80);
    titleY = 196;
    centred(f.title, titleY, `bold ${titleSize}px monospace`);
    centred(f.slogan, 244, "bold 23px monospace");
    centred(f.dateLine, 300, "24px monospace");
    centred(f.zoneLine, 334, "24px monospace");
    // Motif and stamp must not overlap: the stamp is a READ (the difficulty), and
    // concentric rings running under it destroyed its legibility. Sized and placed so
    // the emblem clears the stamp band entirely.
    motif(mid, 442, 104);
    stamp(618, -0.05);
    centred("INFO-LINE", 676, "bold 20px monospace", 4);
    centred(f.infoLine, 720, "bold 36px monospace");
    smallPrintBlock(760);
    codeBox(946);
  } else if (f.template === "minimal") {
    // Mostly bare stock, one small centred type block and a big emblem (Better Days).
    motif(mid, 300, 150);
    centred(f.crew, 520, "bold 19px monospace", 3);
    titleSize = fitTitle(f.title, 78, 110);
    titleY = 600;
    centred(f.title, titleY, `bold ${titleSize}px monospace`);
    centred(f.slogan, 640, "20px monospace");
    centred(f.dateLine, 690, "22px monospace");
    centred(f.zoneLine, 722, "22px monospace");
    centred(f.infoLine, 786, "bold 32px monospace");
    stamp(858, 0.04);
    codeBox(940);
  } else {
    // "classic": crew / huge title / rule / date / stamp / info-line / dense foot.
    centred(f.crew, 92, "bold 21px monospace", f.crew.length > 26 ? 1 : 5);
    titleSize = fitTitle(f.title, 108, 90);
    titleY = 200;
    centred(f.title, titleY, `bold ${titleSize}px monospace`);
    centred(f.slogan, 252, "bold 24px monospace");
    rule(286, 90);
    centred(f.dateLine, 330, "26px monospace");
    centred(f.zoneLine, 366, "26px monospace");
    motif(mid, 458, 74);
    stamp(600, -0.035);
    centred("INFO-LINE", 660, "bold 22px monospace", 4);
    centred(f.infoLine, 704, "bold 40px monospace");
    smallPrintBlock(744);
    codeBox(946);
  }

  // Ink misregistration: a faint offset ghost of the title, like a bad second pass.
  ctx.globalAlpha = 0.16;
  centred(f.title, titleY + 2.5, `bold ${titleSize}px monospace`);
  ctx.globalAlpha = 1;

  // Wear along the pocket folds (see the reference sheets): the crease line rubs
  // darker and the ink lifts right on it. Drawn LAST so it ages the print too, not
  // just the stock — a fold that spared the lettering would read as a fake.
  const foldGrime = (x0: number, y0: number, x1: number, y1: number, span: number) => {
    const g = ctx.createLinearGradient(
      x0 - (y1 - y0 ? span : 0), y0 - (x1 - x0 ? span : 0),
      x0 + (y1 - y0 ? span : 0), y0 + (x1 - x0 ? span : 0),
    );
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.42, "rgba(0,0,0,0.09)");
    g.addColorStop(0.5, "rgba(0,0,0,0.16)");
    g.addColorStop(0.58, "rgba(0,0,0,0.09)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = span * 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  foldGrime(c.width / 2, 0, c.width / 2, c.height, 16); // vertical fold
  foldGrime(0, c.height / 2, c.width, c.height / 2, 14); // horizontal fold
  // Ink rubbed off along the very crease.
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(c.width / 2, 0);
  ctx.lineTo(c.width / 2, c.height);
  ctx.moveTo(0, c.height / 2);
  ctx.lineTo(c.width, c.height / 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

const W = 3.4, H = 4.53;

/** A crease: near-flat away from the line, breaking hard along it. */
function foldRidge(d: number, amp: number, sharp: number): number {
  return amp * Math.exp(-Math.abs(d) * sharp);
}

/**
 * Height field for a flyer that lived FOLDED IN QUARTERS in a pocket — the dominant
 * feature is the fold cross (one vertical + one horizontal crease through the middle),
 * with the four panels bowing slightly apart and fine crumple on top. Sharp creases,
 * not smooth bumps, are what read as paper. Deterministic per flyer index.
 */
function crumpleZ(x: number, y: number, i: number): number {
  let z = 0;

  // The two pocket folds. Their lines wander a little so the cross isn't machine-straight.
  const foldX = 0.03 * W * Math.sin(y * 1.6 + i * 2.1);
  const foldY = 0.03 * H * Math.sin(x * 1.9 - i * 1.4);
  z += foldRidge(x - foldX, 0.1, 5.2);
  z += foldRidge(y - foldY, 0.088, 4.6);

  // Each quarter panel domes gently away from the creases.
  z -= 0.045 * Math.cos((x / W) * Math.PI * 2) * Math.cos((y / H) * Math.PI * 2);

  // Two faint incidental creases so the sheet isn't perfectly symmetric.
  for (let k = 0; k < 2; k++) {
    const ang = seeded(i, 100 + k) * Math.PI;
    const off = (seeded(i, 110 + k) - 0.5) * 3.2;
    const d = x * Math.cos(ang) + y * Math.sin(ang) - off;
    const sign = seeded(i, 140 + k) > 0.5 ? 1 : -1;
    z += sign * foldRidge(d, 0.03 + seeded(i, 120 + k) * 0.025, 3.4);
  }

  // Fine fibre wrinkles.
  z += 0.012 * Math.sin(x * 7.3 + i * 1.7) * Math.cos(y * 6.1 - i * 2.3);
  z += 0.007 * Math.sin(x * 13.1 - y * 11.4 + i);
  return z;
}

// Dense grid: the tear/slit are made by DROPPING cells, so the cell size IS the
// resolution of their outline — a coarse grid gives the staircase look of a pixelated
// edge rather than a fibre one, and cannot represent a slit thinner than one cell.
const SEG_X = 128, SEG_Y = 170;

/** RIGHT | LEFT | TOP | BOTTOM. */
type Edge = 0 | 1 | 2 | 3;

interface Bite {
  edge: Edge;
  /** Where along that edge, as a fraction of its length, from the centre. */
  center: number;
  halfLen: number;
  /** Fraction of the sheet's width (side edges) or height (top/bottom). */
  depth: number;
  /** Per-bite tooth frequency + phase, so no two bites rhyme. */
  freq: number;
  phase: number;
}

/**
 * A seeded set of LOCALISED bites spread over all four edges. Localised, because a
 * sheet ragged down a whole side reads as manufactured deckle rather than damage; and
 * seeded per flyer with a per-bite frequency and phase, so no two sheets — and no two
 * bites — carry the same silhouette. Every value derives from the flyer index: no
 * Math.random, so a reload reproduces the exact same wall.
 */
function tearBites(i: number): Bite[] {
  const n = 3 + Math.floor(seeded(i, 200) * 3); // 3–5 bites per sheet
  const bites: Bite[] = [];
  for (let k = 0; k < n; k++) {
    bites.push({
      edge: Math.floor(seeded(i, 210 + k) * 4) as Edge,
      center: (seeded(i, 225 + k) - 0.5) * 0.8,
      halfLen: 0.05 + seeded(i, 240 + k) * 0.1,
      // Shallower than before: a deep bite turns the sheet into confetti rather than
      // a flyer that has been handled.
      depth: 0.012 + seeded(i, 255 + k) * 0.024,
      // Low frequency = a few broad jags. Higher rates produced the row of tiny
      // spikes that read as a saw blade instead of torn fibre.
      freq: 7 + seeded(i, 270 + k) * 9,
      phase: seeded(i, 285 + k) * 40,
    });
  }
  return bites;
}

/**
 * How far the given edge is eaten away at normalised position `s` along it.
 * A smooth envelope fades each bite into the intact edge; `abs(sin)` teeth on top give
 * the SHARP points of fibre giving way (a plain sine would scallop like scissors).
 */
function edgeInset(bites: Bite[], edge: Edge, s: number, along: number, i: number): number {
  let inset = 0;
  for (const b of bites) {
    if (b.edge !== edge) continue;
    const d = (s - b.center) / b.halfLen;
    if (Math.abs(d) >= 1) continue;
    const envelope = Math.pow(Math.cos((d * Math.PI) / 2), 1.5);
    // Aperiodic jag profile. `pow` biases it low so the edge mostly hugs the paper
    // and only occasionally bites deep — a flat 0.5-mean noise would read as fur.
    const jag = Math.pow(fbm1(along * b.freq + b.phase, i + b.edge), 1.5);
    inset = Math.max(inset, b.depth * envelope * (0.35 + 0.65 * jag));
  }
  return inset;
}

/**
 * A straight, narrow slash — one cell wide (the thinnest a dropped-face cut can be),
 * an eighth of the sheet long. Seeded so each flyer's cut sits somewhere different and
 * may come in from the bottom OR the top.
 */
function slitParams(i: number) {
  return {
    x: (seeded(i, 300) - 0.5) * 0.55 * W,
    len: 0.07 + seeded(i, 301) * 0.05,
    fromTop: seeded(i, 302) > 0.5,
  };
}

function isInSlit(x: number, y: number, i: number): boolean {
  const p = slitParams(i);
  const t = p.fromTop ? (H / 2 - y) / H : (y + H / 2) / H;
  if (t > p.len) return false;
  // The cut WANDERS along its length (noise, not a sine): a perfectly straight slit
  // reads as a scalpel, and paper does not tear in a straight line.
  const drift = (fbm1(t * 9 + i * 3, i + 41) - 0.5) * 0.07 * W;
  // Half a cell: the narrowest a dropped-face cut can be without closing up.
  return Math.abs(x - (p.x + drift)) < (W / SEG_X) * 0.5;
}

/**
 * A subdivided, displaced sheet — NOT an extruded slab. Real crumple geometry is what
 * lets the directional light rake across the folds and actually reveal them; a flat
 * plane (or a solid box) cannot. DoubleSide is mandatory here: unlike the closed
 * extrusion it replaced, a sheet would be invisible from behind mid-tumble.
 *
 * Built by hand rather than from `PlaneGeometry` for the two damage passes, which use
 * DIFFERENT techniques on purpose:
 *
 *  - the TEAR pulls boundary vertices back onto the tear curve. Dropping cells instead
 *    would quantise the silhouette to the grid — the staircase edge of the earlier pass.
 *    Clamping keeps the mesh whole and the outline exactly on the curve, at the cost of
 *    a little texture squeeze in the outer margin, where there is no lettering.
 *  - the SLIT must be a hole THROUGH the sheet, which no amount of vertex moving can
 *    produce, so it does drop faces. It is axis-aligned and one cell wide, so there is
 *    no staircase to see — and being a real hole, it shows the backdrop and punches
 *    through the cast shadow.
 */
function makeCrumpledGeometry(i: number, opts: { tear?: boolean; slit?: boolean }): THREE.BufferGeometry {
  const gx1 = SEG_X + 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  // Computed ONCE per sheet: rebuilding this per vertex would allocate ~10k arrays.
  const bites = opts.tear ? tearBites(i) : [];

  for (let iy = 0; iy <= SEG_Y; iy++) {
    for (let ix = 0; ix <= SEG_X; ix++) {
      const u = ix / SEG_X;
      const v = iy / SEG_Y;
      const x = (u - 0.5) * W;
      const y = H / 2 - v * H; // matches PlaneGeometry's winding, so the artwork stays upright
      let px = x;
      let py = y;
      if (opts.tear) {
        // Clamp inward on each of the four edges independently; at a corner both
        // clamps apply, which is exactly how a corner tears off.
        px = Math.min(px, W / 2 - edgeInset(bites, 0, y / H, y, i) * W);
        px = Math.max(px, -W / 2 + edgeInset(bites, 1, y / H, y, i) * W);
        py = Math.min(py, H / 2 - edgeInset(bites, 2, x / W, x, i) * H);
        py = Math.max(py, -H / 2 + edgeInset(bites, 3, x / W, x, i) * H);
      }
      // Fold/crumple height stays keyed to the UNDISPLACED position, so trimming an
      // edge never drags the fold cross out of register with the printed artwork.
      positions.push(px, py, crumpleZ(x, y, i));
      uvs.push(u, 1 - v);
    }
  }

  const indices: number[] = [];
  for (let iy = 0; iy < SEG_Y; iy++) {
    for (let ix = 0; ix < SEG_X; ix++) {
      const cx = ((ix + 0.5) / SEG_X - 0.5) * W;
      const cy = H / 2 - ((iy + 0.5) / SEG_Y) * H;
      if (opts.slit && isInSlit(cx, cy, i)) continue;

      const a = ix + gx1 * iy;
      const b = ix + gx1 * (iy + 1);
      const c = ix + 1 + gx1 * (iy + 1);
      const d = ix + 1 + gx1 * iy;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** Fine paper-fibre bump, shared by every card (one texture, not one per flyer). */
function makeFibreBump(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(c.width, c.height);
  for (let p = 0; p < c.width * c.height; p++) {
    const px = p % c.width, py = (p / c.width) | 0;
    // Directional fibre streaks + speckle — mid-grey base so bump reads both ways.
    const fibre = Math.sin(px * 0.9 + Math.sin(py * 0.12) * 6) * 10;
    const speck = (Math.sin(px * 12.9898 + py * 78.233) * 43758.5453 % 1) * 18;
    const val = 128 + fibre + speck;
    img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = val;
    img.data[p * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 4);
  return tex;
}


function Flyer({ f, i, bump }: { f: FlyerSpec; i: number; bump: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => makeCardTexture(f, i), [f, i]);
  const geometry = useMemo(
    () => makeCrumpledGeometry(i, { tear: f.tear, slit: f.slit }),
    [i, f.tear, f.slit],
  );
  const hoverTarget = useRef(0);
  const hoverAmt = useRef(0);

  const params = useMemo(() => {
    const start = entryPoint(i, FLYERS.length);
    const end = new THREE.Vector3(f.targetX, 0, i * 0.05);
    const dir = start.clone().setZ(0).normalize();
    const control = start.clone().add(end).multiplyScalar(0.5).add(dir.multiplyScalar(6));
    control.z = start.z * 0.5;
    const restRot = (f.rest * Math.PI) / 180;
    // 3D tumble: real paper spins on all three axes as it falls, then settles face-on.
    const spinX = (2 + seeded(i, 60) * 1.5) * (seeded(i, 61) > 0.5 ? 1 : -1);
    const spinY = (2.5 + seeded(i, 62) * 2) * (seeded(i, 63) > 0.5 ? 1 : -1);
    const spinZ = (0.6 + seeded(i, 64) * 0.8) * (seeded(i, 65) > 0.5 ? 1 : -1);
    const wobbleAmpX = 0.5 + seeded(i, 40) * 0.35;
    const wobbleFreq = 2.2 + seeded(i, 42) * 1.3;
    const wobblePhase = seeded(i, 43) * Math.PI * 2;
    const idleFreq = 0.3 + seeded(i, 44) * 0.22;
    const idlePhase = seeded(i, 45) * Math.PI * 2;
    return {
      start, control, end, restRot, spinX, spinY, spinZ,
      delay: f.order * 320,
      wobbleAmpX, wobbleFreq, wobblePhase, idleFreq, idlePhase,
    };
  }, [f, i]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime * 1000;
    const local = elapsed - params.delay;
    const DURATION = 2100;
    const tFull = local <= 0 ? 0 : local / DURATION;
    const t = Math.min(1, tFull);
    const eased = easeOutCubic(t);
    const pos = bezier3(params.start, params.control, params.end, eased);

    const decay = Math.exp(-2.6 * Math.max(0, tFull));
    const wobbleX = params.wobbleAmpX * decay * Math.sin(tFull * params.wobbleFreq * Math.PI * 2 + params.wobblePhase);

    const idleT = state.clock.elapsedTime;
    const idleRotZ = 0.022 * Math.sin(idleT * params.idleFreq * Math.PI * 2 + params.idlePhase);
    const idleRotY = 0.05 * Math.sin(idleT * params.idleFreq * Math.PI * 1.4 + params.idlePhase + 0.8);

    if (!group.current) return;

    // `delta` comes from useFrame — calling state.clock.getDelta() here would consume
    // the clock and corrupt elapsedTime for every other component in the same frame.
    hoverAmt.current += (hoverTarget.current - hoverAmt.current) * Math.min(1, delta * 12);
    const lift = 0.22 * hoverAmt.current;

    group.current.position.set(pos.x + wobbleX, pos.y + lift, pos.z + hoverAmt.current * 0.9);
    // Tumble decays into the resting pose: spin hard early, face-on by the landing.
    const spinLeft = 1 - eased;
    group.current.rotation.set(
      params.spinX * spinLeft,
      params.spinY * spinLeft + idleRotY,
      params.spinZ * spinLeft + params.restRot * eased + idleRotZ,
    );
    const scale = 1 + 0.05 * hoverAmt.current;
    group.current.scale.setScalar(scale);
    group.current.visible = local > -80;
  });

  return (
    <group ref={group}>
      <mesh
        geometry={geometry}
        castShadow
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          hoverTarget.current = 1;
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          hoverTarget.current = 0;
          document.body.style.cursor = "auto";
        }}
      >
        {/* DoubleSide is required now that the card is a SHEET, not a closed solid:
            mid-tumble the back faces the camera and would otherwise be culled away. */}
        <meshStandardMaterial
          map={texture}
          bumpMap={bump}
          bumpScale={0.6}
          roughness={0.92}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/** Subtle mouse parallax on the whole wall — real depth, only 3D can do this. */
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const rig = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame((_s, delta) => {
    if (!rig.current) return;
    const k = Math.min(1, delta * 3);
    rig.current.rotation.y += (pointer.x * 0.09 - rig.current.rotation.y) * k;
    rig.current.rotation.x += (-pointer.y * 0.06 - rig.current.rotation.x) * k;
  });
  return <group ref={rig}>{children}</group>;
}

function Scene() {
  const bump = useMemo(() => makeFibreBump(), []);
  return (
    <>
      {/* Backdrop sits CLOSE behind the cards so contact shadows stay tight and soft
          instead of the huge detached slab of the previous pass. */}
      <mesh position={[0, 0, -0.9]} receiveShadow>
        <planeGeometry args={[60, 34]} />
        <meshStandardMaterial color="#f2eee4" roughness={1} />
      </mesh>

      {/* Ambient pulled DOWN and the key light pushed up + raking (low z, high x/y):
          a flat fill would erase the creases entirely — the crumple only reads because
          one side of each fold catches the key and the other falls into shade. */}
      <ambientLight intensity={0.78} />
      <directionalLight
        position={[6, 7, 10]}
        intensity={1.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-normalBias={0.03}
      />
      <pointLight position={[-9, -4, 4]} intensity={12} color="#ff4fa3" distance={14} decay={2} />
      <pointLight position={[9, -5, 4]} intensity={10} color="#b7f32b" distance={14} decay={2} />

      <ParallaxRig>
        {FLYERS.map((f, i) => (
          <Flyer key={f.title} f={f} i={i} bump={bump} />
        ))}
      </ParallaxRig>
    </>
  );
}

function Page() {
  const [replayKey, setReplayKey] = useState(0);
  return (
    <div style={{ fontFamily: "monospace", background: "#d7d2c6", minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
          padding: "14px 20px",
          borderBottom: "2px solid #161514",
        }}
      >
        <span style={{ fontWeight: "bold", fontSize: 22 }}>MUF</span>
        <span style={{ fontSize: 11, opacity: 0.75, letterSpacing: "0.08em" }}>
          UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998 — R3F v5 : papier froissé (plis réels)
        </span>
      </header>
      <div style={{ width: "100%", height: "72vh" }}>
        <Canvas
          key={replayKey}
          shadows="soft"
          camera={{ fov: 42, position: [0, 0, 15], near: 0.1, far: 100 }}
          gl={{ alpha: true, antialias: true }}
          style={{ background: "#d7d2c6" }}
        >
          <Scene />
        </Canvas>
      </div>
      <p style={{ padding: "10px 20px", fontSize: 11 }}>
        Caméra perspective + parallaxe à la souris · les feuilles culbutent en 3D sur les 3 axes en
        arrivant de la profondeur · ombres douces · UV corrigées.{" "}
        <button onClick={() => { setReplayKey((k) => k + 1); }}>rejouer ↻</button>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Page />);
