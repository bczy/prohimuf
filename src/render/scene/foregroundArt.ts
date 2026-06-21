/**
 * Dessin de la ferronnerie de premier plan (grilles devant les flics) — code
 * Canvas2D pur, sans React ni Three. Partagé par le composant `ForegroundFrames`
 * et les scripts de preview hors-ligne (Node + node-canvas).
 *
 * Fonte parisienne : barreaux et volutes en métal sombre rehaussés d'un liséré
 * clair (reflet) et d'une ombre décalée — le relief vient de ce contraste.
 */

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
 * Dessine, pour chaque zone, un garde-corps en fonte ouvragé : rails
 * haut/médian/bas, fins barreaux à pointe de lance, et une rangée de volutes
 * décoratives (rinceaux / cœurs / cercles selon la zone) au centre.
 * Dessine en espace image (texW × texH), aligné sur les zones des fenêtres.
 */
export function drawForegroundIronwork(
  g: CanvasRenderingContext2D,
  zones: readonly IronZone[],
  texW: number,
  texH: number,
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

    // Rails horizontaux (haut / médian / bas) avec ombre + reflet
    const rail = (y: number, h: number) => {
      g.fillStyle = SHADOW;
      g.fillRect(railLeft, y + 1, railW, h);
      g.fillStyle = IRON;
      g.fillRect(railLeft, y, railW, h);
      g.fillStyle = HILIGHT;
      g.fillRect(railLeft, y, railW, Math.max(1, h * 0.35));
    };
    rail(railTop, lw * 1.5); // main courante
    rail(midY - lw * 0.4, lw * 0.9); // rail médian
    rail(railBottom - lw, lw); // rail bas

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
  });
}
