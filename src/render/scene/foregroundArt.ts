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
const CONCRETE = "rgba(52,52,64,0.95)";
const CONCRETE_EDGE = "rgba(150,152,170,0.30)";

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

/**
 * Simples barreaux métalliques (Stalingrad) : même gabarit de rail que le
 * Haussmann (le flic se lit bien derrière la grille), mais uniquement un rail
 * haut et un rail bas, des barreaux droits un peu plus épais, à sommet plat
 * (sans pointe de lance) et sans volute.
 */
function drawPlainZone(
  g: CanvasRenderingContext2D,
  geo: ZoneGeometry,
  lw: number,
  texW: number,
): void {
  const { railLeft, railW, railTop, railBottom } = geo;

  drawRail(g, railLeft, railW, railTop, lw * 1.5); // rail haut
  drawRail(g, railLeft, railW, railBottom - lw, lw); // rail bas

  const bars = Math.max(6, Math.round(railW / (texW * 0.018)));
  const bw = lw * 0.7; // un peu plus épais que les barreaux Haussmann
  for (let i = 0; i <= bars; i++) {
    const bx = railLeft + railW * (i / bars);
    g.fillStyle = IRON;
    g.fillRect(bx - bw / 2, railTop, bw, railBottom - railTop);
    g.fillStyle = HILIGHT;
    g.fillRect(bx - bw / 2, railTop, Math.max(1, bw * 0.34), railBottom - railTop);
  }
}

/**
 * Parapet de balcon en béton + main courante tubulaire (Vitry, HLM 1970) : dans
 * la moitié basse du gabarit (de midY à railBottom) une dalle de béton pleine et
 * opaque, surmontée d'une simple main courante métallique portée par quelques
 * fins montants verticaux (ni pointe, ni volute). La moitié haute reste ouverte,
 * donc le flic reste visible — seul le bas de son corps est masqué, comme avec
 * les garde-corps.
 */
function drawHlmZone(g: CanvasRenderingContext2D, geo: ZoneGeometry, lw: number): void {
  const { railLeft, railW, railTop, railBottom, midY } = geo;
  const slabTop = midY;
  const slabH = railBottom - midY;

  // Ombre décalée sous la dalle
  g.fillStyle = SHADOW;
  g.fillRect(railLeft, slabTop + 1, railW, slabH);
  // Dalle de béton pleine
  g.fillStyle = CONCRETE;
  g.fillRect(railLeft, slabTop, railW, slabH);
  // Liséré clair en arête haute (1px)
  g.fillStyle = CONCRETE_EDGE;
  g.fillRect(railLeft, slabTop, railW, 1);

  // Main courante tubulaire au-dessus de la dalle
  drawRail(g, railLeft, railW, railTop, lw * 1.2);

  // Quelques fins montants verticaux entre la main courante et la dalle
  const posts = 4; // ⇒ 5 montants, bords compris
  const pw = lw * 0.5;
  for (let i = 0; i <= posts; i++) {
    const px = railLeft + railW * (i / posts);
    g.fillStyle = IRON;
    g.fillRect(px - pw / 2, railTop, pw, slabTop - railTop);
    g.fillStyle = HILIGHT;
    g.fillRect(px - pw / 2, railTop, Math.max(1, pw * 0.34), slabTop - railTop);
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

    // Garde-corps en travers du bas de la fenêtre (devant le bas du flic).
    const railLeft = left - ww * 0.05;
    const railW = ww * 1.1;
    const railTop = cy + hh * 0.2;
    const railBottom = top + hh + hh * 0.22;
    const midY = (railTop + railBottom) / 2;
    const railRight = railLeft + railW;
    const geo: ZoneGeometry = { railLeft, railW, railTop, railBottom, midY, railRight };

    if (style === "plain") {
      drawPlainZone(g, geo, lw, texW);
    } else if (style === "hlm") {
      drawHlmZone(g, geo, lw);
    } else {
      drawHaussmannZone(g, geo, lw, texW, idx);
    }
  });
}
