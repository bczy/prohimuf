/**
 * Dessin de la ferronnerie de premier plan (grilles devant les flics) — code
 * Canvas2D pur, sans React ni Three. Partagé par le composant `ForegroundFrames`
 * et les scripts de preview hors-ligne (Node + node-canvas).
 *
 * Styles selon l'architecture du niveau :
 *  - `haussmann` : garde-corps en fonte ouvragé (rails, barreaux à pointe de
 *    lance, volutes) — la façade haussmannienne de la rue Belliard ;
 *  - `plain` : simples barreaux métalliques droits (fenêtres et balcons nus) —
 *    le tissu mixte de Stalingrad ;
 *  - `hlm` : parapet de balcon en béton + main courante tubulaire — la tour HLM
 *    des années 1970 de Vitry ;
 *  - `artdeco` : garde-corps géométrique (rails, montants espacés, rangée de
 *    losanges) — registre Art déco des années 30 ;
 *  - `croix` : barreaux croisés en X entre deux lisses — grille en croix de
 *    Saint-André.
 *
 * `artdeco` et `croix` ne sont pas déclarés par niveau : ils servent à VARIER la
 * ferronnerie bâtiment par bâtiment sur les tronçons multi-immeubles (voir
 * {@link drawForegroundIronworkPerBuilding}), en gardant le même registre fer
 * forgé noir que `haussmann`/`plain`.
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

/** Rail horizontal en fonte avec ombre + reflet. `so` = décalage d'ombre (px). */
function drawRail(
  g: CanvasRenderingContext2D,
  railLeft: number,
  railW: number,
  y: number,
  h: number,
  so: number,
): void {
  g.fillStyle = SHADOW;
  g.fillRect(railLeft, y + so, railW, h);
  g.fillStyle = IRON;
  g.fillRect(railLeft, y, railW, h);
  g.fillStyle = HILIGHT;
  g.fillRect(railLeft, y, railW, Math.max(1, h * 0.35));
}

/** Arc/volute en fonte avec ombre + reflet → relief. `so` = décalage d'ombre (px). */
function ironCurve(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  width: number,
  so: number,
): void {
  g.lineCap = "round";
  g.strokeStyle = SHADOW;
  g.lineWidth = width + 1.5;
  g.beginPath();
  g.arc(cx + so, cy + so, r, a0, a1);
  g.stroke();
  g.strokeStyle = IRON;
  g.lineWidth = width;
  g.beginPath();
  g.arc(cx, cy, r, a0, a1);
  g.stroke();
  g.strokeStyle = HILIGHT;
  g.lineWidth = Math.max(1, width * 0.45);
  g.beginPath();
  g.arc(cx, cy - so, r, a0, a1);
  g.stroke();
}

/**
 * Trait droit en fonte (polyligne) avec ombre + reflet → relief, même registre
 * que {@link ironCurve} mais pour les motifs anguleux (chevrons, losanges,
 * croix). `pts` en espace image (px) ; `closed` ferme le contour. `so` = décalage
 * d'ombre (px).
 */
function ironPath(
  g: CanvasRenderingContext2D,
  pts: readonly (readonly [number, number])[],
  width: number,
  so: number,
  closed = false,
): void {
  if (pts.length < 2) return;
  const trace = (dx: number, dy: number): void => {
    g.beginPath();
    pts.forEach(([x, y], i) => {
      if (i === 0) g.moveTo(x + dx, y + dy);
      else g.lineTo(x + dx, y + dy);
    });
    if (closed) g.closePath();
    g.stroke();
  };
  g.lineJoin = "round";
  g.lineCap = "round";
  g.strokeStyle = SHADOW;
  g.lineWidth = width + 1.5;
  trace(so, so);
  g.strokeStyle = IRON;
  g.lineWidth = width;
  trace(0, 0);
  g.strokeStyle = HILIGHT;
  g.lineWidth = Math.max(1, width * 0.45);
  trace(0, -so);
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
  so: number,
): void {
  const { railLeft, railW, railTop, railBottom, midY, railRight } = geo;

  // Rails horizontaux (haut / médian / bas) avec ombre + reflet
  drawRail(g, railLeft, railW, railTop, lw * 1.5, so); // main courante
  drawRail(g, railLeft, railW, midY - lw * 0.4, lw * 0.9, so); // rail médian
  drawRail(g, railLeft, railW, railBottom - lw, lw, so); // rail bas

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
      ironCurve(g, bx, sy, scrollR, Math.PI * 0.5, Math.PI * 1.5, lw * 0.7, so);
      ironCurve(g, bx + cw, sy, scrollR, -Math.PI * 0.5, Math.PI * 0.5, lw * 0.7, so);
    } else if (motif === 1) {
      // Cercles
      ironCurve(g, bx + cw * 0.5, sy, scrollR, 0, Math.PI * 2, lw * 0.6, so);
    } else {
      // S-scrolls (rinceaux)
      ironCurve(g, bx, sy - scrollR * 0.5, scrollR, Math.PI * 0.4, Math.PI * 1.4, lw * 0.7, so);
      ironCurve(
        g,
        bx + cw,
        sy + scrollR * 0.5,
        scrollR,
        -Math.PI * 0.6,
        Math.PI * 0.4,
        lw * 0.7,
        so,
      );
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
  so: number,
  sillOffset: number,
): void {
  const { left, top, ww, hh, cy } = box;
  const railLeft = left - ww * 0.02;
  const railW = ww * 1.04;
  const railTop = cy + hh * 0.18;
  // Descend jusque sous les pieds du sprite (ancrés à ~1.124·hh, cf. EnemySprite),
  // plus l'appui par niveau quand l'art a une allège haute sous le vitrage.
  const railBottom = top + hh * (1.14 + sillOffset);

  // Métal légèrement moins opaque que la fonte Haussmann : la grille se fond
  // dans la nuit comme les ferronneries peintes de la façade.
  g.globalAlpha = 0.85;

  drawRail(g, railLeft, railW, railTop, lw * 0.7, so); // main courante
  drawRail(g, railLeft, railW, railTop + (railBottom - railTop) * 0.2, lw * 0.35, so); // seconde lisse
  drawRail(g, railLeft, railW, railBottom - lw * 0.55, lw * 0.55, so); // lisse basse

  // Barreaux fins et serrés (≈ moitié du pas Haussmann, quart de l'épaisseur)
  const bars = Math.max(10, Math.round(railW / (texW * 0.0085)));
  const bw = Math.max(1.2, lw * 0.24);
  for (let i = 0; i <= bars; i++) {
    const bx = railLeft + railW * (i / bars);
    g.fillStyle = SHADOW;
    g.fillRect(bx - bw / 2 + so, railTop + so, bw, railBottom - railTop);
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
function drawHlmZone(
  g: CanvasRenderingContext2D,
  box: ZoneBox,
  lw: number,
  idx: number,
  so: number,
  nextWinTop: number,
  sillOffset: number,
): void {
  const { left, top, ww, hh } = box;
  const railLeft = left - ww * 0.03;
  const railW = ww * 1.06;
  const railTop = top + hh * 0.56; // la rambarde respire au-dessus de la dalle
  const slabTop = top + hh * 0.78;
  // Couvre les pieds du flic (ancrés à ~1.124·hh) mais s'arrête à la fenêtre de
  // la rangée du dessous quand les rangées générées sont serrées (Vitry). Le
  // knob d'appui par niveau descend la cible avant ce clamp.
  const slabBottom = Math.min(
    top + hh * (1.18 + sillOffset),
    Math.max(nextWinTop, top + hh * 1.13),
  );
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
    const dh = Math.min(slabH * (0.3 + 0.55 * zoneHash(idx, 29 + d)), slabH - capH);
    g.fillRect(dx, slabTop + capH, Math.max(1, lw * 0.3), dh);
  }

  // Main courante tubulaire fine au-dessus de la dalle
  drawRail(g, railLeft, railW, railTop, lw * 0.8, so);

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
 * Garde-corps Art déco : main courante et lisse basse, montants verticaux
 * espacés (registre géométrique, plus larges que `plain`) et une rangée de
 * losanges centrés — le vocabulaire anguleux des années 30. Gabarit calé sous
 * l'ouverture comme `plain`.
 */
function drawArtdecoZone(
  g: CanvasRenderingContext2D,
  box: ZoneBox,
  lw: number,
  texW: number,
  so: number,
  sillOffset: number,
): void {
  const { left, top, ww, hh, cy } = box;
  const railLeft = left - ww * 0.03;
  const railW = ww * 1.06;
  const railTop = cy + hh * 0.18;
  const railBottom = top + hh * (1.14 + sillOffset);
  const midY = (railTop + railBottom) / 2;

  g.globalAlpha = 0.88;

  drawRail(g, railLeft, railW, railTop, lw * 1.1, so); // main courante
  drawRail(g, railLeft, railW, railBottom - lw, lw, so); // lisse basse

  // Montants verticaux espacés (registre géométrique, plus larges que `plain`).
  const bays = Math.max(4, Math.round(railW / (texW * 0.026)));
  const pw = Math.max(1.6, lw * 0.5);
  for (let i = 0; i <= bays; i++) {
    const px = railLeft + railW * (i / bays);
    g.fillStyle = SHADOW;
    g.fillRect(px - pw / 2 + so, railTop + so, pw, railBottom - railTop);
    g.fillStyle = IRON;
    g.fillRect(px - pw / 2, railTop, pw, railBottom - railTop);
    g.fillStyle = HILIGHT;
    g.fillRect(px - pw / 2, railTop, Math.max(1, pw * 0.4), railBottom - railTop);
  }

  // Rangée de losanges centrés (motif Art déco), un par travée.
  const bw = railW / bays;
  const rh = Math.min((railBottom - railTop) * 0.34, bw * 0.42);
  for (let i = 0; i < bays; i++) {
    const dcx = railLeft + bw * (i + 0.5);
    ironPath(
      g,
      [
        [dcx, midY - rh],
        [dcx + bw * 0.32, midY],
        [dcx, midY + rh],
        [dcx - bw * 0.32, midY],
      ],
      lw * 0.6,
      so,
      true,
    );
  }

  g.globalAlpha = 1;
}

/**
 * Grille en croix de Saint-André : deux lisses (haute/basse), montants verticaux
 * aux limites de travée et une croix (deux diagonales) dans chaque travée — fer
 * forgé fin, même registre que `plain`. Gabarit calé sous l'ouverture.
 */
function drawCroixZone(
  g: CanvasRenderingContext2D,
  box: ZoneBox,
  lw: number,
  texW: number,
  so: number,
  sillOffset: number,
): void {
  const { left, top, ww, hh, cy } = box;
  const railLeft = left - ww * 0.03;
  const railW = ww * 1.06;
  const railTop = cy + hh * 0.2;
  const railBottom = top + hh * (1.14 + sillOffset);

  g.globalAlpha = 0.86;

  drawRail(g, railLeft, railW, railTop, lw * 0.9, so); // lisse haute
  drawRail(g, railLeft, railW, railBottom - lw * 0.7, lw * 0.7, so); // lisse basse

  const bays = Math.max(4, Math.round(railW / (texW * 0.03)));
  const bw = railW / bays;
  const pw = Math.max(1.3, lw * 0.34);
  for (let i = 0; i <= bays; i++) {
    const px = railLeft + bw * i;
    g.fillStyle = SHADOW;
    g.fillRect(px - pw / 2 + so, railTop + so, pw, railBottom - railTop);
    g.fillStyle = IRON;
    g.fillRect(px - pw / 2, railTop, pw, railBottom - railTop);
    g.fillStyle = HILIGHT;
    g.fillRect(px - pw / 2, railTop, Math.max(1, pw * 0.4), railBottom - railTop);
  }

  // Croix de Saint-André dans chaque travée (deux diagonales).
  for (let i = 0; i < bays; i++) {
    const x0 = railLeft + bw * i;
    const x1 = x0 + bw;
    ironPath(
      g,
      [
        [x0, railTop],
        [x1, railBottom],
      ],
      lw * 0.42,
      so,
    );
    ironPath(
      g,
      [
        [x1, railTop],
        [x0, railBottom],
      ],
      lw * 0.42,
      so,
    );
  }

  g.globalAlpha = 1;
}

/**
 * Palette de ferronneries en fer forgé noir permutée par bâtiment sur les
 * tronçons multi-immeubles. `hlm` (parapet béton) en est exclu : il romprait le
 * registre fonte de la rue. L'ordre place des styles voisins visuellement
 * distincts (fonte ouvragée → géométrique → croix → barreaux droits), si bien
 * que la permutation par rang donne toujours des voisins contrastés.
 */
const BUILDING_IRON_STYLES: readonly IronworkStyle[] = ["haussmann", "artdeco", "croix", "plain"];

/**
 * Style de ferronnerie d'un bâtiment donné, déterministe et stable d'un montage à
 * l'autre. Permutation pure : on part du style déclaré du niveau (index dans
 * {@link BUILDING_IRON_STYLES}, sinon 0), décalé par le tronçon PUIS par le rang
 * du bâtiment. Deux bâtiments consécutifs d'un même tronçon reçoivent donc
 * toujours des styles différents (rangs voisins → entrées voisines, distinctes),
 * et le décalage par tronçon fait varier une même image répétée.
 */
export function buildingIronStyle(
  levelStyle: IronworkStyle,
  tileIndex: number,
  buildingIndex: number,
): IronworkStyle {
  const n = BUILDING_IRON_STYLES.length;
  const base = Math.max(0, BUILDING_IRON_STYLES.indexOf(levelStyle));
  const i = (((base + tileIndex + buildingIndex) % n) + n) % n;
  return BUILDING_IRON_STYLES[i] ?? levelStyle;
}

/** Seuil de coupure en x (largeur de tuile normalisée) qui sépare deux bâtiments
 *  d'un même tronçon : un écart entre deux x-centres consécutifs supérieur à ce
 *  seuil ouvre un nouveau bâtiment. Calé au-dessus du pas régulier des fenêtres
 *  d'un immeuble haussmannien (≈0.06) et sous le vrai vide entre immeubles. */
const BUILDING_GAP = 0.09;

/**
 * Regroupe les zones d'une tuile en bâtiments par écart horizontal : les zones
 * sont triées par x, et un écart entre deux x-centres consécutifs supérieur à
 * `gap` (largeur de tuile normalisée) démarre un nouveau bâtiment. Renvoie, dans
 * l'ordre gauche→droite, des listes d'INDICES d'origine (dans `zones`) — l'indice
 * original est conservé pour que la variété de motif par zone (idx) reste stable.
 */
export function clusterZonesByBuilding(
  zones: readonly IronZone[],
  gap: number = BUILDING_GAP,
): number[][] {
  const order = zones.map((z, i) => ({ i, x: z.x })).sort((a, b) => a.x - b.x);
  const clusters: number[][] = [];
  let current: number[] = [];
  let prevX: number | null = null;
  for (const { i, x } of order) {
    if (prevX !== null && x - prevX > gap) {
      clusters.push(current);
      current = [];
    }
    current.push(i);
    prevX = x;
  }
  if (current.length > 0) clusters.push(current);
  return clusters;
}

/** Épaisseur de trait de dessin à la résolution `texW`. */
const drawLineWidth = (texW: number): number => Math.max(2, texW * 0.0045);
/** Décalage d'ombre (px) : 1 px à la résolution native de l'art (1280). */
const shadowOffset = (texW: number): number => Math.max(1, Math.round(texW / 1280));

/**
 * Dessine la ferronnerie d'UNE zone dans le style donné, en espace image. Ne
 * remet pas le canvas à zéro : partagé par le tracé uniforme
 * ({@link drawForegroundIronwork}) et le tracé par bâtiment
 * ({@link drawForegroundIronworkPerBuilding}). `zones` reste la liste complète
 * de la tuile (le style `hlm` y cherche la fenêtre du dessous).
 */
function drawZone(
  g: CanvasRenderingContext2D,
  z: IronZone,
  idx: number,
  zones: readonly IronZone[],
  texW: number,
  texH: number,
  style: IronworkStyle,
  sillOffset: number,
  lw: number,
  so: number,
): void {
  if (z.w <= 0 || z.h <= 0) return; // zone dégénérée : rien à dessiner
  const ww = z.w * texW;
  const hh = z.h * texH;
  const left = z.x * texW - ww / 2;
  const top = z.y * texH - hh / 2;
  const cy = z.y * texH;
  const box: ZoneBox = { left, top, ww, hh, cy };

  if (style === "plain") {
    drawPlainZone(g, box, lw, texW, so, sillOffset);
  } else if (style === "artdeco") {
    drawArtdecoZone(g, box, lw, texW, so, sillOffset);
  } else if (style === "croix") {
    drawCroixZone(g, box, lw, texW, so, sillOffset);
  } else if (style === "hlm") {
    // Fenêtre la plus proche EN DESSOUS qui chevauche horizontalement — la
    // dalle s'y arrête pour ne pas mordre sur l'art de l'étage inférieur.
    let nextWinTop = Number.POSITIVE_INFINITY;
    for (const o of zones) {
      if (o === z || o.w <= 0 || o.h <= 0) continue;
      const oTop = (o.y - o.h / 2) * texH;
      if (oTop <= cy) continue;
      if (Math.abs(o.x - z.x) * texW >= (ww + o.w * texW) / 2) continue;
      nextWinTop = Math.min(nextWinTop, oTop);
    }
    drawHlmZone(g, box, lw, idx, so, nextWinTop, sillOffset);
  } else {
    // Gabarit Haussmann historique (inchangé) : garde-corps en travers du
    // bas de la fenêtre (devant le bas du flic), avec débord latéral.
    const railLeft = left - ww * 0.05;
    const railW = ww * 1.1;
    const railTop = cy + hh * 0.2;
    const railBottom = top + hh + hh * (0.22 + sillOffset);
    const midY = (railTop + railBottom) / 2;
    const railRight = railLeft + railW;
    const geo: ZoneGeometry = { railLeft, railW, railTop, railBottom, midY, railRight };
    drawHaussmannZone(g, geo, lw, texW, idx, so);
  }
}

/**
 * Dessine, pour chaque zone, la ferronnerie de premier plan dans le style du
 * niveau (`haussmann` / `plain` / `hlm`). Dessine en espace image (texW × texH),
 * aligné sur les zones des fenêtres.
 *
 * Les zones (harness ADR-0028) encadrent l'OUVERTURE lumineuse, pas l'appui :
 * `sillOffset` (fraction de la hauteur de zone, par niveau, défaut 0) descend
 * la base de la ferronnerie jusqu'à la ligne de plancher quand l'art a une
 * allège haute sous le vitrage.
 */
export function drawForegroundIronwork(
  g: CanvasRenderingContext2D,
  zones: readonly IronZone[],
  texW: number,
  texH: number,
  style: IronworkStyle,
  sillOffset = 0,
): void {
  g.clearRect(0, 0, texW, texH);
  const lw = drawLineWidth(texW);
  const so = shadowOffset(texW);
  zones.forEach((z, idx) => {
    drawZone(g, z, idx, zones, texW, texH, style, sillOffset, lw, so);
  });
}

/**
 * Comme {@link drawForegroundIronwork}, mais VARIE le style bâtiment par
 * bâtiment : les zones de la tuile sont regroupées en immeubles par écart
 * horizontal ({@link clusterZonesByBuilding}) et chaque immeuble reçoit un style
 * de fer forgé déterministe ({@link buildingIronStyle}), stable d'un montage à
 * l'autre. `tileIndex` désaligne les tronçons entre eux (une même image répétée
 * ne porte donc pas deux fois les mêmes ferronneries). `levelStyle` sert de point
 * de départ de la permutation et de repli. La liste complète des zones est passée
 * au tracé pour que la recherche « fenêtre du dessous » reste correcte.
 */
/**
 * Largeur de garde-corps tracée, en fraction de la largeur de zone (tronçons
 * uniquement). Les zones calibrées à la main sur les tronçons encadrent
 * l'ouverture AVEC son encadrement (~35-50 % plus large que le vitrage peint) :
 * tracer la balustrade à pleine largeur de zone la faisait déborder sur le mur
 * — surtout à droite avec le léger biais de calage (retour Bertrand). Resserrée
 * autour du centre, elle retombe sur la baie peinte.
 */
const TRONCON_RAIL_W_SCALE = 0.74;

/**
 * Décalage vertical du garde-corps tracé, en fraction de la hauteur de zone
 * (tronçons uniquement). Les zones encadrent le vitrage ; l'art des tronçons
 * peint son balcon SOUS la fenêtre — la balustrade descend s'y poser au lieu
 * de flotter sur la vitre (retour Bertrand).
 */
const TRONCON_RAIL_Y_SHIFT = 0.45;

export function drawForegroundIronworkPerBuilding(
  g: CanvasRenderingContext2D,
  zones: readonly IronZone[],
  texW: number,
  texH: number,
  levelStyle: IronworkStyle,
  sillOffset: number,
  tileIndex: number,
): void {
  g.clearRect(0, 0, texW, texH);
  const lw = drawLineWidth(texW);
  const so = shadowOffset(texW);
  clusterZonesByBuilding(zones).forEach((indices, building) => {
    const style = buildingIronStyle(levelStyle, tileIndex, building);
    for (const idx of indices) {
      const z = zones[idx];
      if (z === undefined) continue;
      const nz = { ...z, w: z.w * TRONCON_RAIL_W_SCALE, y: z.y + z.h * TRONCON_RAIL_Y_SHIFT };
      drawZone(g, nz, idx, zones, texW, texH, style, sillOffset, lw, so);
    }
  });
}
