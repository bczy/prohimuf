/**
 * Dessin de la ferronnerie de premier plan (grilles devant les flics) — code
 * Canvas2D pur, sans React ni Three. Partagé par le composant `ForegroundFrames`
 * et les scripts de preview hors-ligne (Node + node-canvas).
 *
 * Trois styles selon l'architecture du niveau :
 *  - `haussmann` : garde-corps en fonte ouvragé (rails, barreaux à pointe de
 *    lance, volutes) — la façade haussmannienne de la rue Belliard ;
 *  - `plain` : simples barreaux métalliques droits (fenêtres et balcons nus) —
 *    le tissu mixte de Stalingrad ;
 *  - `hlm` : parapet de balcon en béton + main courante tubulaire — la tour HLM
 *    des années 1970 de Vitry.
 *
 * Fonte parisienne : barreaux et volutes en métal sombre rehaussés d'un liséré
 * clair (reflet) et d'une ombre décalée — le relief vient de ce contraste.
 */

import type { IronworkStyle } from "@game/levels/levelArt";

/** Une zone de fenêtre normalisée (0..1, y vers le bas) sur l'image de façade. */
export interface IronZone {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

const IRON = "rgba(9,7,18,0.92)";
const HILIGHT = "rgba(165,168,198,0.36)";
const SHADOW = "rgba(0,0,0,0.4)";
// Béton du parapet HLM : gris froid opaque, liséré clair en arête haute.
const CONCRETE = "rgba(34,36,48,0.96)";
const CONCRETE_EDGE = "rgba(140,144,168,0.55)";
const CONCRETE_LIGHT = "rgba(96,100,124,0.35)";
const CONCRETE_JOINT = "rgba(0,0,0,0.4)";
const CONCRETE_STAIN = "rgba(0,0,0,0.22)";

/** Géométrie du garde-corps d'une zone, en espace image (px). */
interface ZoneGeometry {
  readonly railLeft: number;
  readonly railW: number;
  readonly railTop: number;
  readonly railBottom: number;
  readonly midY: number;
  readonly railRight: number;
}

/** Rail horizontal en fonte avec ombre + reflet. */
function drawRail(
  g: CanvasRenderingContext2D,
  railLeft: number,
  railW: number,
  y: number,
  h: number,
): void {
  g.fillStyle = SHADOW;
  g.fillRect(railLeft, y + 1, railW, h);
  g.fillStyle = IRON;
  g.fillRect(railLeft, y, railW, h);
  g.fillStyle = HILIGHT;
  g.fillRect(railLeft, y, railW, Math.max(1, h * 0.35));
}

/** Arc/volute en fonte avec ombre + reflet → relief. */
function ironCurve(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  width: number,
): void {
  g.lineCap = "round";
  g.strokeStyle = SHADOW;
  g.lineWidth = width + 1.5;
  g.beginPath();
  g.arc(cx + 1, cy + 1, r, a0, a1);
  g.stroke();
  g.strokeStyle = IRON;
  g.lineWidth = width;
  g.beginPath();
  g.arc(cx, cy, r, a0, a1);
  g.stroke();
  g.strokeStyle = HILIGHT;
  g.lineWidth = Math.max(1, width * 0.45);
  g.beginPath();
  g.arc(cx, cy - 1, r, a0, a1);
  g.stroke();
}

/**
 * Garde-corps en fonte ouvragé (Haussmann) : rails haut/médian/bas, fins
 * barreaux à pointe de lance, et une rangée de volutes décoratives (rinceaux /
 * cœurs / cercles selon la zone) au centre.
 */
function drawHaussmannZone(
  g: CanvasRenderingContext2D,
  geo: ZoneGeometry,
  lw: number,
  texW: number,
  idx: number,
): void {
  const { railLeft, railW, railTop, railBottom, midY, railRight } = geo;

  // Rails horizontaux (haut / médian / bas) avec ombre + reflet
  drawRail(g, railLeft, railW, railTop, lw * 1.5); // main courante
  drawRail(g, railLeft, railW, midY - lw * 0.4, lw * 0.9); // rail médian
  drawRail(g, railLeft, railW, railBottom - lw, lw); // rail bas

  // Barreaux fins à pointe de lance
  const balusters = Math.max(6, Math.round(railW / (texW * 0.018)));
  const bw = lw * 0.5;
  for (let i = 0; i <= balusters; i++) {
    const bx = railLeft + railW * (i / balusters);
    g.fillStyle = IRON;
    g.fillRect(bx - bw / 2, railTop, bw, railBottom - railTop);
    g.fillRect(bx - bw * 0.4, railTop - lw * 1.1, bw * 0.8, lw * 1.1); // pointe de lance
    g.fillStyle = HILIGHT;
    g.fillRect(bx - bw / 2, railTop, Math.max(1, bw * 0.34), railBottom - railTop);
  }

  // Rangée de volutes décoratives entre le rail médian et le rail bas —
  // motif répété, type choisi par la zone pour varier les fenêtres.
  const scrollR = Math.min((railBottom - midY) * 0.5, railW / (balusters * 2));
  const cw = railW / balusters; // pas horizontal entre volutes
  const motif = idx % 3;
  for (let bx = railLeft + cw; bx < railRight - cw * 0.5; bx += cw * 2) {
    const sy = (midY + railBottom) / 2;
    if (motif === 0) {
      // Volutes en cœur (deux C affrontés)
      ironCurve(g, bx, sy, scrollR, Math.PI * 0.5, Math.PI * 1.5, lw * 0.7);
      ironCurve(g, bx + cw, sy, scrollR, -Math.PI * 0.5, Math.PI * 0.5, lw * 0.7);
    } else if (motif === 1) {
      // Cercles
      ironCurve(g, bx + cw * 0.5, sy, scrollR, 0, Math.PI * 2, lw * 0.6);
    } else {
      // S-scrolls (rinceaux)
      ironCurve(g, bx, sy - scrollR * 0.5, scrollR, Math.PI * 0.4, Math.PI * 1.4, lw * 0.7);
      ironCurve(g, bx + cw, sy + scrollR * 0.5, scrollR, -Math.PI * 0.6, Math.PI * 0.4, lw * 0.7);
    }
  }
}

/** Boîte brute d'une zone de fenêtre en espace image (px), avant gabarit. */
interface ZoneBox {
  readonly left: number;
  readonly top: number;
  readonly ww: number;
  readonly hh: number;
  readonly cy: number;
}

/** Petit hash déterministe par zone (variations sans Math.random). */
function zoneHash(idx: number, salt: number): number {
  const h = Math.sin(idx * 127.1 + salt * 311.7) * 43758.5453;
  return h - Math.floor(h);
}

/**
 * Simples barreaux métalliques (Stalingrad) : grille de protection fine au bas
 * de la fenêtre — double lisse haute, lisse basse, barreaux droits serrés et
 * minces à sommet plat (ni pointe de lance, ni volute). Gabarit resserré sur la
 * fenêtre (peu de débord) pour rester à la hauteur des ferronneries peintes
 * dans l'art de la façade.
 */
function drawPlainZone(
  g: CanvasRenderingContext2D,
  box: ZoneBox,
  lw: number,
  texW: number,
): void {
  const { left, top, ww, hh, cy } = box;
  const railLeft = left - ww * 0.02;
  const railW = ww * 1.04;
  const railTop = cy + hh * 0.18;
  const railBottom = top + hh + hh * 0.08;

  // Métal légèrement moins opaque que la fonte Haussmann : la grille se fond
  // dans la nuit comme les ferronneries peintes de la façade.
  g.globalAlpha = 0.85;

  drawRail(g, railLeft, railW, railTop, lw * 0.7); // main courante
  drawRail(g, railLeft, railW, railTop + lw * 1.9, lw * 0.35); // seconde lisse
  drawRail(g, railLeft, railW, railBottom - lw * 0.55, lw * 0.55); // lisse basse

  // Barreaux fins et serrés (≈ moitié du pas Haussmann, quart de l'épaisseur)
  const bars = Math.max(10, Math.round(railW / (texW * 0.0085)));
  const bw = Math.max(1.2, lw * 0.24);
  for (let i = 0; i <= bars; i++) {
    const bx = railLeft + railW * (i / bars);
    g.fillStyle = SHADOW;
    g.fillRect(bx - bw / 2 + 1, railTop + 1, bw, railBottom - railTop);
    g.fillStyle = IRON;
    g.fillRect(bx - bw / 2, railTop, bw, railBottom - railTop);
    g.fillStyle = HILIGHT;
    g.fillRect(bx - bw / 2, railTop, Math.max(1, bw * 0.4), railBottom - railTop);
  }

  g.globalAlpha = 1;
}

/**
 * Parapet de balcon en béton + main courante tubulaire (Vitry, HLM 1970) : une
 * dalle de béton courte et sombre calée sur l'appui de la fenêtre (elle ne pend
 * plus dessous), avec matière — arête d'acrotère claire, joints de panneaux,
 * coulures de pluie — surmontée d'une main courante fine sur montants. La
 * moitié haute reste ouverte, donc le flic reste visible.
 */
function drawHlmZone(g: CanvasRenderingContext2D, box: ZoneBox, lw: number, idx: number): void {
  const { left, top, ww, hh } = box;
  const railLeft = left - ww * 0.03;
  const railW = ww * 1.06;
  const railTop = top + hh * 0.56; // la rambarde respire au-dessus de la dalle
  const slabTop = top + hh * 0.78;
  const slabBottom = top + hh * 1.18; // couvre les pieds du flic (et son halo)
  const slabH = slabBottom - slabTop;

  // Ombre décalée sous la dalle
  g.fillStyle = SHADOW;
  g.fillRect(railLeft + 2, slabTop + 2, railW, slabH);
  // Dalle de béton pleine, sombre (palette nuit)
  g.fillStyle = CONCRETE;
  g.fillRect(railLeft, slabTop, railW, slabH);
  // Arête d'acrotère : couvertine claire sur toute la largeur
  const capH = Math.max(2, lw * 0.45);
  g.fillStyle = CONCRETE_EDGE;
  g.fillRect(railLeft, slabTop, railW, capH);
  // Face légèrement éclairée sous la couvertine, qui s'assombrit vers le bas
  g.fillStyle = CONCRETE_LIGHT;
  g.fillRect(railLeft, slabTop + capH, railW, slabH * 0.28);

  // Joints de panneaux préfabriqués (2 joints verticaux sombres)
  g.fillStyle = CONCRETE_JOINT;
  for (let j = 1; j <= 2; j++) {
    const jx = railLeft + (railW * j) / 3 + (zoneHash(idx, j) - 0.5) * lw * 2;
    g.fillRect(jx, slabTop + capH, Math.max(1, lw * 0.22), slabH - capH);
  }
  // Coulures de pluie sous la couvertine (déterministes par zone)
  g.fillStyle = CONCRETE_STAIN;
  const drips = 3 + Math.floor(zoneHash(idx, 7) * 3);
  for (let d = 0; d < drips; d++) {
    const dx = railLeft + railW * (0.08 + 0.84 * zoneHash(idx, 13 + d));
    const dh = slabH * (0.3 + 0.55 * zoneHash(idx, 29 + d));
    g.fillRect(dx, slabTop + capH, Math.max(1, lw * 0.3), dh);
  }

  // Main courante tubulaire fine au-dessus de la dalle
  drawRail(g, railLeft, railW, railTop, lw * 0.8);

  // Fins montants verticaux entre la main courante et la dalle
  const posts = 5;
  const pw = Math.max(1.5, lw * 0.32);
  for (let i = 0; i <= posts; i++) {
    const px = railLeft + railW * (i / posts);
    g.fillStyle = IRON;
    g.fillRect(px - pw / 2, railTop, pw, slabTop - railTop + capH);
    g.fillStyle = HILIGHT;
    g.fillRect(px - pw / 2, railTop, Math.max(1, pw * 0.4), slabTop - railTop);
  }
}

/**
 * Dessine, pour chaque zone, la ferronnerie de premier plan dans le style du
 * niveau (`haussmann` / `plain` / `hlm`). Dessine en espace image (texW × texH),
 * aligné sur les zones des fenêtres.
 */
export function drawForegroundIronwork(
  g: CanvasRenderingContext2D,
  zones: readonly IronZone[],
  texW: number,
  texH: number,
  style: IronworkStyle,
): void {
  g.clearRect(0, 0, texW, texH);
  const lw = Math.max(2, texW * 0.0045);

  zones.forEach((z, idx) => {
    const ww = z.w * texW;
    const hh = z.h * texH;
    const left = z.x * texW - ww / 2;
    const top = z.y * texH - hh / 2;
    const cy = z.y * texH;
    const box: ZoneBox = { left, top, ww, hh, cy };

    if (style === "plain") {
      drawPlainZone(g, box, lw, texW);
    } else if (style === "hlm") {
      drawHlmZone(g, box, lw, idx);
    } else {
      // Gabarit Haussmann historique (inchangé) : garde-corps en travers du
      // bas de la fenêtre (devant le bas du flic), avec débord latéral.
      const railLeft = left - ww * 0.05;
      const railW = ww * 1.1;
      const railTop = cy + hh * 0.2;
      const railBottom = top + hh + hh * 0.22;
      const midY = (railTop + railBottom) / 2;
      const railRight = railLeft + railW;
      const geo: ZoneGeometry = { railLeft, railW, railTop, railBottom, midY, railRight };
      drawHaussmannZone(g, geo, lw, texW, idx);
    }
  });
}
