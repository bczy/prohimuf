/**
 * Near-foreground décor silhouettes (ADR-0047) — pure Canvas2D, no React/Three.
 * Mirrors `foregroundArt.ts`: deterministic B&W silhouettes (dark fill + a GREY
 * moon-reflection rim + a soft drop shadow), shareable with offline preview.
 *
 * Glow law (art condition C1, binding): everything here is GREY / black-and-white.
 * ZERO glow, zero decorative neon, no coloured rim — grey is décor. The only
 * highlight is a cool grey rim (reflected moonlight) or a translucent grey glass
 * pane, never a colour. The interactive delivery vehicle keeps its render-side
 * neon rim; these props do not, which keeps them read as non-interactive.
 *
 * All props are recognizable Parisian street furniture, drawn with their BASE at
 * the bottom of the canvas (they stand on the pavement) and read via grey accents
 * — never dark-on-dark detail (the earlier abstract blobs failed to read at game
 * size). NearForeground.tsx anchors each base on the street line and scales it to
 * stay below the window row (non-occlusion).
 */

import type { LensAnchor, NearForegroundKind, SignalLenses } from "@game/levels/levelArt";
import type { SignalState } from "./trafficSignal";

// Grey palette — same register as foregroundArt.ts (IRON / HILIGHT / SHADOW),
// but strictly monochrome: no coloured rim anywhere (C1).
const BODY = "rgba(11,9,17,0.97)"; // dark silhouette fill
const RIM = "rgba(168,172,198,0.5)"; // cool grey moon-reflection rim (NOT neon)
const RIM_SOFT = "rgba(158,162,186,0.26)";
const SHADOW = "rgba(0,0,0,0.45)"; // soft drop/ground shadow
const GLASS = "rgba(168,172,196,0.36)"; // translucent grey glass (screen / pane)
const FIGURE_DEAD = "rgba(64,64,76,0.9)"; // dead pedestrian pictogram (grey, unlit)

const TAU = Math.PI * 2;

/** Drawn silhouette footprint per kind: aspect = w/h, heightFrac = natural plane
 *  height as a fraction of the facade height (scaled down to fit the band). */
export interface NearKindSpec {
  readonly aspect: number;
  readonly heightFrac: number;
}

export const NEAR_KIND_SPECS = {
  parkingMeter: { aspect: 0.5, heightFrac: 0.24 },
  lamppost: { aspect: 0.5, heightFrac: 0.62 },
  wallaceFountain: { aspect: 0.55, heightFrac: 0.32 },
  trafficLight: { aspect: 0.44, heightFrac: 1.44 },
  bollard: { aspect: 0.6, heightFrac: 0.13 },
  scooter: { aspect: 1.5, heightFrac: 0.18 },
  bench: { aspect: 1.7, heightFrac: 0.17 },
  streetSign: { aspect: 0.75, heightFrac: 0.4 },
} as const satisfies Record<NearForegroundKind, NearKindSpec>;

/** Soft ground shadow ellipse under a prop, drawn first so the body sits on it. */
function groundShadow(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  g.fillStyle = SHADOW;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fill();
}

/** Ground shadow across the base of the canvas. */
function baseShadow(g: CanvasRenderingContext2D, w: number, h: number, rx = 0.4): void {
  groundShadow(g, w * 0.5, h * 0.965, w * rx, h * 0.03);
}

/** Trace a rounded-rectangle path (no fill/stroke). Corner radius is clamped. */
function roundRectPath(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  bh: number,
  r: number,
): void {
  const rr = Math.min(r, bw / 2, bh / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + bw - rr, y);
  g.quadraticCurveTo(x + bw, y, x + bw, y + rr);
  g.lineTo(x + bw, y + bh - rr);
  g.quadraticCurveTo(x + bw, y + bh, x + bw - rr, y + bh);
  g.lineTo(x + rr, y + bh);
  g.quadraticCurveTo(x, y + bh, x, y + bh - rr);
  g.lineTo(x, y + rr);
  g.quadraticCurveTo(x, y, x + rr, y);
  g.closePath();
}

/**
 * Horodateur (Parisian parking pay-station): thin mast + a bulky CANTED head with
 * a slanted solar cap (the strongest grey accent) and a glass screen. Rectangular
 * head, never round; mast clearly thinner than the head (else it reads as a bollard).
 */
function drawParkingMeter(g: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.5;
  const gy = h * 0.95;
  const mw = Math.max(2, w * 0.14);
  const ht = h * 0.36;
  const hb = h * 0.72;
  const hh = w * 0.28;
  const ln = w * 0.06;
  baseShadow(g, w, h, 0.34);
  g.fillStyle = BODY;
  g.fillRect(cx - mw / 2, hb, mw, gy - hb);
  g.fillStyle = RIM;
  g.fillRect(cx - mw / 2, hb, Math.max(1, mw * 0.5), gy - hb);
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(cx - hh + ln, ht);
  g.lineTo(cx + hh + ln, ht);
  g.lineTo(cx + hh, hb);
  g.lineTo(cx - hh, hb);
  g.closePath();
  g.fill();
  g.fillStyle = RIM;
  g.beginPath();
  g.moveTo(cx - hh + ln, ht);
  g.lineTo(cx + hh + ln, ht);
  g.lineTo(cx + hh + ln, ht + h * 0.05);
  g.lineTo(cx - hh + ln, ht + h * 0.05);
  g.closePath();
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1, w * 0.03);
  g.beginPath();
  g.moveTo(cx - hh + ln, ht);
  g.lineTo(cx - hh, hb);
  g.stroke();
  g.fillStyle = GLASS;
  g.fillRect(cx - hh * 0.7 + ln * 0.4, ht + h * 0.09, hh * 1.2, h * 0.11);
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1.5, h * 0.011);
  for (let i = 0; i < 3; i++) {
    const sy = ht + h * 0.24 + i * h * 0.03;
    g.beginPath();
    g.moveTo(cx - w * 0.12, sy);
    g.lineTo(cx + w * 0.1, sy);
    g.stroke();
  }
}

/**
 * Standing réverbère col-de-cygne (cast-iron street lamp): fluted base, tapered
 * shaft, an S-arm near the top curving out to a faceted lantern. Reads via grey
 * rims on the shaft/base left edge and the arm crest, plus grey glass facets.
 */
function drawLamppost(g: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.54;
  const pt = h * 0.3;
  const bt = h * 0.84;
  const gy = h * 0.97;
  const ph = Math.max(1.5, w * 0.045);
  baseShadow(g, w, h, 0.3);
  const bm = bt + (gy - bt) * 0.45;
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(cx - w * 0.24, gy);
  g.lineTo(cx - w * 0.17, bm);
  g.lineTo(cx - ph * 1.6, bt);
  g.lineTo(cx + ph * 1.6, bt);
  g.lineTo(cx + w * 0.17, bm);
  g.lineTo(cx + w * 0.24, gy);
  g.closePath();
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1, w * 0.03);
  g.beginPath();
  g.moveTo(cx - w * 0.24, gy);
  g.lineTo(cx - ph * 1.6, bt);
  g.stroke();
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(cx - ph * 1.4, bt);
  g.lineTo(cx - ph, pt);
  g.lineTo(cx + ph, pt);
  g.lineTo(cx + ph * 1.4, bt);
  g.closePath();
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1, ph * 0.7);
  g.beginPath();
  g.moveTo(cx - ph * 1.1, bt);
  g.lineTo(cx - ph * 0.7, pt);
  g.stroke();
  const aw = Math.max(2, w * 0.05);
  const cy = h * 0.12;
  const hx = cx - w * 0.28;
  const hy = h * 0.19;
  g.lineCap = "round";
  g.strokeStyle = BODY;
  g.lineWidth = aw;
  g.beginPath();
  g.moveTo(cx, pt);
  g.quadraticCurveTo(cx - w * 0.04, cy, cx - w * 0.16, cy);
  g.quadraticCurveTo(hx + w * 0.05, cy, hx, hy);
  g.stroke();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1, aw * 0.4);
  g.beginPath();
  g.moveTo(cx, pt);
  g.quadraticCurveTo(cx - w * 0.04, cy - aw * 0.35, cx - w * 0.16, cy - aw * 0.35);
  g.stroke();
  g.strokeStyle = BODY;
  g.lineWidth = Math.max(1.5, aw * 0.5);
  g.beginPath();
  g.arc(cx - w * 0.07, cy + h * 0.03, w * 0.04, Math.PI * 0.1, Math.PI * 1.7);
  g.stroke();
  const lt = hy;
  const lb = hy + h * 0.15;
  const lth = w * 0.1;
  const lbh = w * 0.03;
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(hx - lth, lt);
  g.lineTo(hx + lth, lt);
  g.lineTo(hx + lbh, lb);
  g.lineTo(hx - lbh, lb);
  g.closePath();
  g.fill();
  g.fillStyle = GLASS;
  g.fillRect(hx - lth * 0.7, lt + h * 0.01, lth * 1.4, lb - lt - h * 0.03);
  g.strokeStyle = RIM;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(hx - lth, lt);
  g.lineTo(hx, lt - h * 0.04);
  g.lineTo(hx + lth, lt);
  g.stroke();
}

/**
 * Fontaine Wallace: a small cast-iron drinking fountain — four slender caryatid
 * columns under a domed cap. Grey rims on the dome and columns.
 */
function drawWallaceFountain(g: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.5;
  const gy = h * 0.95;
  const base = h * 0.8;
  const top = h * 0.2;
  baseShadow(g, w, h, 0.32);
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(cx - w * 0.16, gy);
  g.lineTo(cx - w * 0.1, base);
  g.lineTo(cx + w * 0.1, base);
  g.lineTo(cx + w * 0.16, gy);
  g.closePath();
  g.fill();
  for (const dx of [-0.09, -0.03, 0.03, 0.09]) {
    g.fillStyle = BODY;
    g.fillRect(cx + w * dx - w * 0.012, top + h * 0.08, w * 0.024, base - top - h * 0.08);
    g.fillStyle = RIM_SOFT;
    g.fillRect(cx + w * dx - w * 0.012, top + h * 0.08, w * 0.01, base - top - h * 0.08);
  }
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(cx - w * 0.15, top + h * 0.09);
  g.quadraticCurveTo(cx, top - h * 0.04, cx + w * 0.15, top + h * 0.09);
  g.lineTo(cx + w * 0.13, top + h * 0.12);
  g.lineTo(cx - w * 0.13, top + h * 0.12);
  g.closePath();
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx - w * 0.14, top + h * 0.09);
  g.quadraticCurveTo(cx, top - h * 0.03, cx + w * 0.14, top + h * 0.09);
  g.stroke();
  g.fillStyle = RIM;
  g.beginPath();
  g.arc(cx, top - h * 0.03, w * 0.02, 0, TAU);
  g.fill();
}

// Signal light colours (art exception, Bertrand-directed): the feu tricolore is the
// one near-foreground prop whose lit lens carries COLOUR + a soft halo — a traffic
// light with no colour is not a traffic light. Everything else stays grey (C1). Lit
// tones read against the fanzine palette; the halo sells "this lamp is on".
const SIGNAL_LIT = ["#ff3446", "#ffb02a", "#3bf06e"] as const; // red, amber, green
const SIGNAL_HALO = [
  "rgba(255,60,74,0.5)",
  "rgba(255,180,60,0.5)",
  "rgba(80,240,130,0.5)",
] as const;
const LENS_OFF = "rgba(18,17,26,0.96)"; // unlit lens: near-black, dead

/** Fill a soft radial halo (lit → transparent) around a point — the "lamp is on" glow. */
function lensHalo(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  colour: string,
): void {
  const grad = g.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  grad.addColorStop(0, colour);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(cx, cy, r, 0, TAU);
  g.fill();
}

/**
 * One DEAD signal lamp in PROFILE — a vertical ellipse (a round lens foreshortened
 * by the ~90° turn) painted near-black with a grey rim. The housing art is always
 * unlit and colourless (art law C1); the lit colour + halo lives on the separate
 * render-side overlay ({@link drawSignalLenses}).
 */
function drawDeadLens(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  g.fillStyle = "rgba(3,3,7,1)";
  g.beginPath();
  g.ellipse(cx, cy, rx * 1.22, ry * 1.15, 0, 0, TAU);
  g.fill();
  g.fillStyle = LENS_OFF;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1, rx * 0.22);
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.stroke();
}

/**
 * A French 3-aspect vehicle signal head seen in PROFILE (turned ~90° — the signal
 * faces the road, so we see its side, not its face). The housing is a tall box from
 * `faceX` (road side, left) to `rightX` (mast side); the three lenses sit on the
 * front panel as foreshortened ellipses (rouge/orange/vert top→bottom), each under a
 * curved HOOD/visor jutting toward the road. All lenses are DEAD here — the lit
 * lamp is painted by the overlay ({@link drawSignalLenses}).
 */
function drawSignalHeadProfile(
  g: CanvasRenderingContext2D,
  faceX: number,
  rightX: number,
  topY: number,
  bh: number,
): void {
  const hw = rightX - faceX;
  // Housing (side of the box).
  roundRectPath(g, faceX, topY, hw, bh, hw * 0.12);
  g.fillStyle = "rgba(20,20,30,0.96)";
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1.5, hw * 0.05);
  g.stroke();
  // Front lamp panel (darker) on the road side.
  roundRectPath(g, faceX + hw * 0.05, topY + bh * 0.02, hw * 0.5, bh - bh * 0.04, hw * 0.1);
  g.fillStyle = "rgba(6,6,12,0.98)";
  g.fill();
  const lampCx = faceX + hw * 0.29;
  const rx = hw * 0.16;
  const ry = bh * 0.084;
  for (let i = 0; i < 3; i++) {
    const cy = topY + bh * (0.19 + i * 0.305);
    // Hood/visor jutting toward the road (left) over the lamp.
    g.fillStyle = BODY;
    g.beginPath();
    g.moveTo(faceX + hw * 0.12, cy - ry * 1.6);
    g.quadraticCurveTo(faceX - hw * 0.34, cy - ry * 1.9, faceX - hw * 0.3, cy - ry * 0.1);
    g.lineTo(faceX + hw * 0.12, cy - ry * 0.5);
    g.closePath();
    g.fill();
    g.strokeStyle = RIM;
    g.lineWidth = Math.max(1, hw * 0.035);
    g.beginPath();
    g.moveTo(faceX + hw * 0.12, cy - ry * 1.6);
    g.quadraticCurveTo(faceX - hw * 0.34, cy - ry * 1.9, faceX - hw * 0.3, cy - ry * 0.1);
    g.stroke();
    drawDeadLens(g, lampCx, cy, rx, ry);
  }
}

/** The red "standing man" pictogram, filled in the current fillStyle, inside a window. */
function drawStandFigure(g: CanvasRenderingContext2D, cx: number, y: number, s: number): void {
  const hr = s * 0.1;
  const headY = y + s * 0.22;
  g.beginPath();
  g.arc(cx, headY, hr, 0, TAU);
  g.fill();
  // Torso.
  g.beginPath();
  g.moveTo(cx - s * 0.1, headY + hr * 0.7);
  g.lineTo(cx + s * 0.1, headY + hr * 0.7);
  g.lineTo(cx + s * 0.085, y + s * 0.6);
  g.lineTo(cx - s * 0.085, y + s * 0.6);
  g.closePath();
  g.fill();
  // Legs together.
  g.fillRect(cx - s * 0.085, y + s * 0.58, s * 0.06, s * 0.3);
  g.fillRect(cx + s * 0.025, y + s * 0.58, s * 0.06, s * 0.3);
  // Arms down at the sides.
  g.fillRect(cx - s * 0.15, headY + hr * 0.8, s * 0.045, s * 0.32);
  g.fillRect(cx + s * 0.105, headY + hr * 0.8, s * 0.045, s * 0.32);
}

/** The green "walking man" pictogram, filled in the current fillStyle, inside a window. */
function drawWalkFigure(g: CanvasRenderingContext2D, cx: number, y: number, s: number): void {
  const colour = g.fillStyle;
  const hr = s * 0.1;
  const headY = y + s * 0.2;
  g.beginPath();
  g.arc(cx + s * 0.02, headY, hr, 0, TAU);
  g.fill();
  // Leaning torso.
  g.beginPath();
  g.moveTo(cx - s * 0.05, headY + hr * 0.6);
  g.lineTo(cx + s * 0.12, headY + hr * 0.6);
  g.lineTo(cx + s * 0.05, y + s * 0.58);
  g.lineTo(cx - s * 0.11, y + s * 0.58);
  g.closePath();
  g.fill();
  g.strokeStyle = colour;
  g.lineCap = "round";
  // Striding legs.
  g.lineWidth = s * 0.075;
  g.beginPath();
  g.moveTo(cx - s * 0.03, y + s * 0.54);
  g.lineTo(cx - s * 0.17, y + s * 0.87);
  g.stroke();
  g.beginPath();
  g.moveTo(cx + s * 0.02, y + s * 0.54);
  g.lineTo(cx + s * 0.17, y + s * 0.87);
  g.stroke();
  // Swinging arms.
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.moveTo(cx + s * 0.03, headY + hr * 1.3);
  g.lineTo(cx - s * 0.12, y + s * 0.44);
  g.stroke();
  g.beginPath();
  g.moveTo(cx + s * 0.07, headY + hr * 1.3);
  g.lineTo(cx + s * 0.2, y + s * 0.5);
  g.stroke();
}

/**
 * Feu piéton in PROFILE: a small 2-aspect box (standing man top, walking man below)
 * seen from the side, on the road-facing front panel. Both pictograms are DEAD grey
 * here (art law C1) — the lit colour + halo is painted by the overlay
 * ({@link drawSignalLenses}). The pictogram is horizontally foreshortened (the turn)
 * so it hints the figure without pretending to be a full face-on symbol.
 */
function drawPedestrianHeadProfile(
  g: CanvasRenderingContext2D,
  faceX: number,
  rightX: number,
  topY: number,
  bh: number,
): void {
  const hw = rightX - faceX;
  roundRectPath(g, faceX, topY, hw, bh, hw * 0.1);
  g.fillStyle = "rgba(20,20,30,0.96)";
  g.fill();
  g.strokeStyle = RIM;
  g.lineWidth = Math.max(1.5, hw * 0.05);
  g.stroke();
  // Road-side front panel.
  roundRectPath(g, faceX + hw * 0.05, topY + bh * 0.03, hw * 0.52, bh - bh * 0.06, hw * 0.08);
  g.fillStyle = "rgba(6,6,12,0.98)";
  g.fill();

  const winH = bh * 0.42;
  const gap = bh * 0.06;
  const wcx = faceX + hw * 0.3;
  const ww = hw * 0.36;
  const drawAspect = (winY: number, kind: "stand" | "walk"): void => {
    roundRectPath(g, wcx - ww / 2, winY, ww, winH, ww * 0.22);
    g.fillStyle = "rgba(3,3,7,1)";
    g.fill();
    // Dead grey pictogram — no colour, no halo (the overlay carries the lit figure).
    g.fillStyle = FIGURE_DEAD;
    // Foreshorten the pictogram horizontally about the window centre.
    g.save();
    g.translate(wcx, 0);
    g.scale(0.52, 1);
    g.translate(-wcx, 0);
    if (kind === "stand") drawStandFigure(g, wcx, winY, winH);
    else drawWalkFigure(g, wcx, winY, winH);
    g.restore();
    g.strokeStyle = RIM_SOFT;
    g.lineWidth = Math.max(1, hw * 0.03);
    roundRectPath(g, wcx - ww / 2, winY, ww, winH, ww * 0.22);
    g.stroke();
  };
  drawAspect(topY + bh * 0.04, "stand");
  drawAspect(topY + bh * 0.04 + winH + gap, "walk");
}

/**
 * Feu tricolore parisien, animated, seen in PROFILE (ADR-0047): the whole signal is
 * turned ~90° — it stands on the pavement facing the road, so we see it from the
 * side. A slim vertical mast on the mast side, a 3-aspect vehicle head up top and a
 * feu piéton lower down, both cantilevered toward the road on short brackets, lenses
 * as foreshortened ellipses under hoods. `state` selects the lit lamps; the two
 * heads are interlocked (see {@link trafficSignalPhase}). The housing is DEAD grey
 * (art law C1); the lit lamp colour + halo is a render-side overlay
 * ({@link drawSignalLenses}) painted on a co-located plane.
 */
function drawTrafficLight(g: CanvasRenderingContext2D, w: number, h: number): void {
  const gy = h * 0.965;
  const poleX = w * 0.66;
  const pw = Math.max(3, w * 0.085);
  baseShadow(g, w, h, 0.26);

  // Vehicle head geometry (road side = left, mast side = right).
  const vTop = h * 0.012;
  const vBh = h * 0.44;
  const vFace = w * 0.14;
  const vRight = w * 0.6;
  // Pedestrian head geometry, lower down with a long bare-mast gap.
  const pTop = vTop + vBh + h * 0.14;
  const pBh = h * 0.2;
  const pFace = w * 0.22;
  const pRight = w * 0.58;

  // Mast (behind the heads), from just below the vehicle-head top to the pavement.
  const poleTop = vTop + vBh * 0.14;
  g.fillStyle = BODY;
  g.fillRect(poleX - pw / 2, poleTop, pw, gy - poleTop);
  g.fillStyle = RIM;
  g.fillRect(poleX - pw / 2, poleTop, Math.max(1, pw * 0.45), gy - poleTop);

  // Cantilever brackets from the mast to each head.
  g.fillStyle = BODY;
  g.fillRect(vRight - w * 0.02, vTop + vBh * 0.42, poleX - (vRight - w * 0.02) + pw / 2, vBh * 0.1);
  g.fillRect(pRight - w * 0.02, pTop + pBh * 0.4, poleX - (pRight - w * 0.02) + pw / 2, pBh * 0.12);

  drawSignalHeadProfile(g, vFace, vRight, vTop, vBh);
  drawPedestrianHeadProfile(g, pFace, pRight, pTop, pBh);

  // Splayed foot under the mast.
  g.fillStyle = BODY;
  g.fillRect(poleX - w * 0.13, gy - h * 0.015, w * 0.26, h * 0.022);
  g.fillStyle = RIM;
  g.fillRect(poleX - w * 0.13, gy - h * 0.015, w * 0.26, Math.max(1, h * 0.006));
}

/** Potelet / bitte de trottoir: a short bollard with a domed cap. */
function drawBollard(g: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.5;
  const gy = h * 0.95;
  const top = h * 0.5;
  const pw = w * 0.5;
  baseShadow(g, w, h, 0.4);
  g.fillStyle = BODY;
  g.fillRect(cx - pw / 2, top, pw, gy - top);
  g.beginPath();
  g.arc(cx, top, pw / 2, Math.PI, 0);
  g.fill();
  g.fillStyle = RIM;
  g.fillRect(cx - pw / 2, top, pw * 0.32, gy - top);
  g.beginPath();
  g.arc(cx - pw * 0.15, top, pw * 0.16, Math.PI, 0);
  g.fill();
}

/** Scooter / mobylette parked side-on, with a top-box. */
function drawScooter(g: CanvasRenderingContext2D, w: number, h: number): void {
  const gy = h * 0.84;
  // Wheel radius bounded by the space under the ground line: the scooter canvas
  // is wider than tall (aspect 1.5), so a width-proportional radius (w*0.12)
  // would rasterize the wheel bottoms past the canvas edge (flat-bottomed
  // wheels, no ground contact).
  const wr = Math.min(w * 0.12, h - gy - Math.max(3, w * 0.03));
  baseShadow(g, w, h, 0.42);
  g.strokeStyle = BODY;
  g.lineWidth = Math.max(3, w * 0.03);
  g.lineCap = "round";
  g.beginPath();
  g.arc(w * 0.28, gy, wr, 0, TAU);
  g.moveTo(w * 0.72 + wr, gy);
  g.arc(w * 0.72, gy, wr, 0, TAU);
  g.stroke();
  g.lineWidth = Math.max(4, w * 0.045);
  g.beginPath();
  g.moveTo(w * 0.28, gy);
  g.lineTo(w * 0.5, gy - h * 0.02);
  g.lineTo(w * 0.66, gy - h * 0.02);
  g.stroke();
  g.fillStyle = BODY;
  g.beginPath();
  g.moveTo(w * 0.6, gy - h * 0.02);
  g.lineTo(w * 0.65, gy - h * 0.34);
  g.lineTo(w * 0.77, gy - h * 0.34);
  g.lineTo(w * 0.8, gy - h * 0.02);
  g.closePath();
  g.fill();
  g.fillStyle = BODY;
  g.fillRect(w * 0.34, gy - h * 0.24, w * 0.24, h * 0.08);
  g.fillRect(w * 0.3, gy - h * 0.42, w * 0.14, h * 0.18);
  g.strokeStyle = RIM;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(w * 0.65, gy - h * 0.34);
  g.lineTo(w * 0.77, gy - h * 0.34);
  g.stroke();
  g.strokeStyle = BODY;
  g.lineWidth = Math.max(2, w * 0.02);
  g.beginPath();
  g.moveTo(w * 0.71, gy - h * 0.32);
  g.lineTo(w * 0.82, gy - h * 0.4);
  g.stroke();
}

/** Banc public: cast-iron slatted bench, side-on. */
function drawBench(g: CanvasRenderingContext2D, w: number, h: number): void {
  const gy = h * 0.95;
  const seat = gy - h * 0.36;
  const back = gy - h * 0.78;
  baseShadow(g, w, h, 0.42);
  g.strokeStyle = BODY;
  g.lineWidth = Math.max(3, w * 0.03);
  g.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const yy = back + (i * (seat - back)) / 3;
    g.beginPath();
    g.moveTo(w * 0.16, yy);
    g.lineTo(w * 0.84, yy);
    g.stroke();
  }
  for (let i = 0; i < 3; i++) {
    const yy = seat + i * h * 0.05;
    g.beginPath();
    g.moveTo(w * 0.16, yy);
    g.lineTo(w * 0.84, yy);
    g.stroke();
  }
  g.lineWidth = Math.max(3, w * 0.035);
  g.beginPath();
  g.moveTo(w * 0.24, back);
  g.lineTo(w * 0.24, gy);
  g.moveTo(w * 0.76, back);
  g.lineTo(w * 0.76, gy);
  g.stroke();
  g.strokeStyle = RIM;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(w * 0.16, back);
  g.lineTo(w * 0.84, back);
  g.stroke();
}

/** Panneau de rue: a street sign plate on a thin post. */
function drawStreetSign(g: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w * 0.5;
  const gy = h * 0.95;
  const pt = h * 0.4;
  const pw = Math.max(2, w * 0.055);
  baseShadow(g, w, h, 0.28);
  g.fillStyle = BODY;
  g.fillRect(cx - pw / 2, pt, pw, gy - pt);
  g.fillStyle = RIM;
  g.fillRect(cx - pw / 2, pt, Math.max(1, pw * 0.5), gy - pt);
  // Splayed foot so the thin pole reads as planted on the pavement.
  g.fillStyle = BODY;
  g.fillRect(cx - w * 0.09, gy - h * 0.02, w * 0.18, h * 0.03);
  g.fillStyle = RIM;
  g.fillRect(cx - w * 0.09, gy - h * 0.02, w * 0.18, Math.max(1, h * 0.007));
  const x = cx - w * 0.34;
  const y = h * 0.14;
  const ww = w * 0.68;
  const hh = h * 0.2;
  g.fillStyle = BODY;
  g.fillRect(x, y, ww, hh);
  g.fillStyle = GLASS;
  g.fillRect(x + w * 0.025, y + h * 0.025, ww - w * 0.05, hh - h * 0.05);
  g.strokeStyle = RIM;
  g.lineWidth = 2;
  g.strokeRect(x, y, ww, hh);
  g.strokeStyle = RIM;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(x + ww * 0.14, y + hh * 0.55);
  g.lineTo(x + ww * 0.7, y + hh * 0.55);
  g.stroke();
}

/**
 * Draw a near-foreground silhouette of `kind` filling the (texW × texH) canvas,
 * y-down, base at the bottom. Clears first, like {@link drawForegroundIronwork}.
 * Deterministic and signal-independent for every kind: the traffic-light housing
 * is now DEAD grey, and its animated lit lens is a separate overlay
 * ({@link drawSignalLenses}).
 */
export function drawNearForegroundObject(
  g: CanvasRenderingContext2D,
  kind: NearForegroundKind,
  texW: number,
  texH: number,
): void {
  g.clearRect(0, 0, texW, texH);
  switch (kind) {
    case "parkingMeter":
      drawParkingMeter(g, texW, texH);
      return;
    case "lamppost":
      drawLamppost(g, texW, texH);
      return;
    case "wallaceFountain":
      drawWallaceFountain(g, texW, texH);
      return;
    case "trafficLight":
      drawTrafficLight(g, texW, texH);
      return;
    case "bollard":
      drawBollard(g, texW, texH);
      return;
    case "scooter":
      drawScooter(g, texW, texH);
      return;
    case "bench":
      drawBench(g, texW, texH);
      return;
    case "streetSign":
      drawStreetSign(g, texW, texH);
      return;
  }
}

// --- Feu tricolore lit-lens overlay (ADR-0049) ----------------------------
// The housing PNG (or procedural fallback) carries the DEAD grey lenses; this
// overlay paints ONLY the lit coloured lens + halo, on a transparent co-located
// plane driven by the pure trafficSignal clock. The one directed C1 exception.

// Fixed-fraction fallback anchors, seeded from the procedural housing geometry,
// used when the levelArt `lenses` block is absent or an anchor is malformed — so
// the overlay still lights up before the generated block lands. Order matches
// SignalLenses: vehicle red/amber/green, pedestrian stand/walk.
const FALLBACK_VEHICLE_LENSES: readonly LensAnchor[] = [
  { x: 0.29, y: 0.1, rx: 0.11, ry: 0.035 },
  { x: 0.29, y: 0.24, rx: 0.11, ry: 0.035 },
  { x: 0.29, y: 0.38, rx: 0.11, ry: 0.035 },
];
const FALLBACK_PED_LENSES: readonly LensAnchor[] = [
  { x: 0.34, y: 0.62, rx: 0.14, ry: 0.05 },
  { x: 0.34, y: 0.8, rx: 0.14, ry: 0.05 },
];

/** Resolve anchor `i`, degrading to the fixed-fraction fallback when the provided
 *  array is missing or the anchor is not fully finite (mirrors `muzzleFor`). */
function anchorAt(
  arr: readonly LensAnchor[] | undefined,
  i: number,
  fallback: readonly LensAnchor[],
): LensAnchor {
  const a = arr?.[i];
  if (
    a !== undefined &&
    [a.x, a.y, a.rx, a.ry].every((n) => Number.isFinite(n)) &&
    a.rx > 0 &&
    a.ry > 0
  ) {
    return a;
  }
  return fallback[i] ?? { x: 0.3, y: 0.3, rx: 0.1, ry: 0.04 };
}

/** Paint one lit, glowing coloured lens + halo at a normalized anchor. `colourIndex`
 *  selects the aspect colour (0 red, 1 amber, 2 green); the beam throws left toward
 *  the road the signal faces, mirroring the procedural housing. */
function litLens(
  g: CanvasRenderingContext2D,
  texW: number,
  texH: number,
  a: LensAnchor,
  colourIndex: number,
): void {
  const cx = a.x * texW;
  const cy = a.y * texH;
  const rx = a.rx * texW;
  const ry = a.ry * texH;
  lensHalo(g, cx - rx * 0.5, cy, rx * 3.6, SIGNAL_HALO[colourIndex] ?? "rgba(255,255,255,0.4)");
  g.fillStyle = SIGNAL_LIT[colourIndex] ?? "#ffffff";
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.beginPath();
  g.ellipse(cx - rx * 0.24, cy - ry * 0.3, rx * 0.42, ry * 0.42, 0, 0, TAU);
  g.fill();
}

/**
 * Paint ONLY the lit coloured lens + halo of the feu tricolore onto a TRANSPARENT
 * overlay canvas (the housing art carries the dead grey lenses). Clears first, then
 * lights exactly one vehicle aspect and one pedestrian aspect for `state`, at the
 * normalized `lenses` anchors. A null `lenses` block, short arrays or non-finite
 * anchors all degrade to the fixed-fraction fallback (never throws), so the overlay
 * lights up even before the levelArt block lands. The one directed C1 colour
 * exception — everything structural is grey.
 */
export function drawSignalLenses(
  g: CanvasRenderingContext2D,
  texW: number,
  texH: number,
  lenses: SignalLenses | null,
  state: SignalState,
): void {
  g.clearRect(0, 0, texW, texH);
  const vIndex = state.vehicle === "red" ? 0 : state.vehicle === "amber" ? 1 : 2;
  litLens(g, texW, texH, anchorAt(lenses?.vehicle, vIndex, FALLBACK_VEHICLE_LENSES), vIndex);
  // Pedestrian: stand (index 0) shows red, walk (index 1) shows green.
  const pLit = state.ped === "green" ? 1 : 0;
  litLens(g, texW, texH, anchorAt(lenses?.ped, pLit, FALLBACK_PED_LENSES), pLit === 1 ? 2 : 0);
}
