import type { JSX } from "react";

/**
 * The single ink stamp printed on each flyer, code-drawn as SVG — no sprite, no asset
 * generation (GestureIcon doctrine, ADR-0020).
 *
 * NOT "each crew's stamp": two of the five sheets have no crew to sign them. The tutorial
 * is unsigned by design (`SANS SYSTÈME · AVANT LE SON`) and carries the smiley, which
 * belongs to everyone; the finale is signed by the three systems at once and carries the
 * invader, which is the CITY signing — L'Éden is a venue, and the narrative bible files it
 * as a Lieu, never a collectif (narrative gate, PR #145). The two sheets without a system
 * carry the two marks without an owner, which is the symmetry to preserve if this table
 * ever grows.
 *
 * SVG rather than a canvas or a PNG for three reasons that all matter here: it stays
 * crisp at any device-pixel ratio and any flyer width, it inherits the sheet's ink
 * through `currentColor` (so nothing re-declares a hex — art-direction's single-source
 * rule), and it costs no network request.
 *
 * One ink, flat shapes, zero gradients. That is period accuracy, not taste: a second
 * colour doubled the print bill, so 1998 rave flyers are stencils, rub-down lettering
 * and photocopied line art. It also lands exactly on the menu's own doctrine — state is
 * hand-work, never light (`zéro glow`), so these are inert décor and never signal
 * anything the player must read.
 *
 * Ported from the parked R3F spike (`claude/spike-r3f-flyers`), where the same five
 * motifs were rasterised onto canvas textures.
 */

export type MotifKind = "spiral" | "smiley" | "rings" | "plumb" | "invader";

/** WHERE the stamp landed on the sheet — vertically. `hero` prints it above the masthead
 *  (the sheet whose front IS the image, type pushed under it), `mid` between the difficulty
 *  row and the slogan, `body` after the info lines. Horizontally every emblem stays CENTRED:
 *  a stamp that wandered sideways fought the flyer's centred masthead and left ragged white
 *  on one flank, so the variety lives on the vertical axis. */
export type MotifSlot = "hero" | "mid" | "body";

export interface FlyerEmblem {
  /** The sheet's mark — a crew's signature where a crew signs, an unowned motif where none
   *  does (see the header). UNIQUE across the wall either way: repeating one turns a
   *  signature into wallpaper, and the deck's earlier shared-motif doctrine is superseded. */
  kind: MotifKind;
  slot: MotifSlot;
  /** Per-sheet vertical nudge in px, so two sheets sharing a slot still don't line up. */
  offsetY: number;
  /** Deliberately UNEVEN across sheets: five crews printing on five machines never land the
   *  same stamp at the same size, and a uniform size is the tell that gives away a template.
   *  Bounded by what the sheet hosts — punched detail inside a mark closes up below ~70px,
   *  and past ~100 it crowds the info block on a narrow column. */
  sizePx: number;
  /** A stamp banged on by hand is never square to the sheet (cf. FLYER_REST_ROTATION_DEG). */
  tiltDeg: number;
  /** feTurbulence seed — explicit, since the filter is deterministic only with one, and
   *  varied so no two emblems break up the same way. */
  wearSeed: number;
}

/**
 * The complete emblem spec per level — ONE table, not one per attribute. Five parallel maps
 * keyed by the same id is how NADIR 94 shipped with no emblem at all: every attribute needs
 * an entry in its own map, and a forgotten one degrades to a silent fallback instead of a
 * compile error. Here a level is either fully specified or absent, and `FlyerEmblem` makes
 * a half-filled entry a type error. Every value is indexed by id and fixed — never
 * Math.random — so the wall is identical on every render.
 *
 * A level absent from this map simply shows no motif: decoration must never turn a new
 * level into a broken slot.
 */
export const FLYER_EMBLEMS: Readonly<Partial<Record<string, FlyerEmblem>>> = {
  tutorial: { kind: "smiley", slot: "mid", offsetY: 14, sizePx: 76, tiltDeg: -4, wearSeed: 7 },
  belliard: { kind: "spiral", slot: "body", offsetY: -6, sizePx: 96, tiltDeg: 3, wearSeed: 21 },
  stalingrad: { kind: "rings", slot: "mid", offsetY: -10, sizePx: 84, tiltDeg: -2, wearSeed: 13 },
  // The one sheet that leads with its image: NADIR 94's plumb bob hangs across the top and
  // the lettering starts below it.
  vitry: { kind: "plumb", slot: "hero", offsetY: 0, sizePx: 100, tiltDeg: 5, wearSeed: 34 },
  "niveau-final": {
    kind: "invader",
    slot: "body",
    offsetY: 18,
    sizePx: 88,
    tiltDeg: -3,
    wearSeed: 3,
  },
};

/** Archimedean spiral — Spiral Tribe's emblem, and literally SPIRALE 23's namesake. */
function SpiralPath(): JSX.Element {
  const pts: string[] = [];
  const turns = 3.2;
  const max = turns * Math.PI * 2;
  for (let a = 0; a <= max; a += 0.09) {
    const r = (a / max) * 46;
    pts.push(`${(50 + Math.cos(a) * r).toFixed(2)},${(50 + Math.sin(a) * r).toFixed(2)}`);
  }
  return (
    <polyline
      points={pts.join(" ")}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** Acid-house smiley: a disc, two eyes and an arc — the decade's cheapest icon. */
function SmileyPath(): JSX.Element {
  return (
    <>
      {/* The face is punched out of the disc via even-odd fill, so the eyes and mouth
          are holes in the ink rather than a second colour painted on top. */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={
          "M50 4a46 46 0 1 0 .1 0z" +
          "M34 34a5 9 0 1 1 .1 0z" +
          "M66 34a5 9 0 1 1 .1 0z" +
          "M26 56a1 1 0 0 0 48 0a1 1 0 0 0-9 0a1 1 0 0 1-30 0a1 1 0 0 0-9 0z"
        }
      />
    </>
  );
}

/**
 * Concentric rings — the canal's WAVE, not a psy target. KANAL SYSTEM carries the canal in
 * its name and in its shipped zoneLine (`BORDS DU CANAL · 19e`), so the mark points at the
 * crew's own ground rather than at a generic period motif. Both gates landed on this anchor
 * independently (lead-art and narrative, PR #145).
 */
function RingsPath(): JSX.Element {
  const rings = [8, 16, 24, 32, 40, 47];
  return (
    <>
      {rings.map((r) => (
        <circle key={r} cx={50} cy={50} r={r} fill="none" stroke="currentColor" strokeWidth={5} />
      ))}
    </>
  );
}

/** NADIR 94's plumb bob — see the reasoning in the body. */
function PlumbPath(): JSX.Element {
  // NADIR 94's mark: a plumb bob — the lowest point, literally, which is what a nadir is.
  // Solid ink like the other four (lead-art, PR #145: the halftone field it replaces read as
  // a texture, not a mark, and was the one tonal wash in a set of solid inks). A builder's
  // tool is also period-plain: a crew stencilling a squat announcement had one to hand.
  return (
    <>
      {/* Suspension bar and line kept as their own paths: overlapping them with the
          even-odd bob below would punch notches where the shapes meet. */}
      <path fill="currentColor" d="M30 6h40v9H30z" />
      <path fill="currentColor" d="M46 15h8v21h-8z" />
      {/* The bob, with its sighting hole PUNCHED rather than painted — same stencil logic
          as the smiley's eyes, and it keeps the mass readable at reading distance. */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={"M50 36 74 50 50 96 26 50Z" + "M50 52a8 8 0 1 1 .1 0z"}
      />
    </>
  );
}

/**
 * Space Invader — and the anchor is Paris, not the arcade. Invader was tiling the city's
 * walls from 1998: same city, same year, same gesture as the player's. Defending it as
 * "the sprite was already 20 years old" would justify the motif on any wall after 1978,
 * which is an absence of anachronism rather than a reason (lead-art, PR #145).
 *
 * It is also the ideal cheap-print motif: a grid of solid squares is the simplest thing a
 * stencil or a photocopier can hold.
 */
const INVADER_ROWS: readonly string[] = [
  "..X.....X..",
  "...X...X...",
  "..XXXXXXX..",
  ".XX.XXX.XX.",
  "XXXXXXXXXXX",
  "X.XXXXXXX.X",
  "X.X.....X.X",
  "...XX.XX...",
];

function InvaderPath(): JSX.Element {
  const cols = INVADER_ROWS[0]?.length ?? 11;
  const rows = INVADER_ROWS.length;
  const px = 100 / cols;
  const py = (100 / rows) * 0.82;
  const top = (100 - py * rows) / 2;
  const cells: JSX.Element[] = [];
  INVADER_ROWS.forEach((row, ry) => {
    // Indexed rather than spread/split: the rows are pure ASCII, and the lint rule that
    // forbids splitting a string is right in general — it just has nothing to protect here.
    for (let rx = 0; rx < row.length; rx++) {
      if (row[rx] !== "X") continue;
      cells.push(
        <rect
          key={`${String(rx)}-${String(ry)}`}
          x={rx * px}
          y={top + ry * py}
          // Overlap by a hair so the blocks weld into one silhouette instead of showing
          // seams — the way ink spreads on cheap stock.
          width={px + 0.4}
          height={py + 0.4}
          fill="currentColor"
        />,
      );
    }
  });
  return <>{cells}</>;
}

const MOTIF_SHAPES: Record<MotifKind, () => JSX.Element> = {
  spiral: SpiralPath,
  smiley: SmileyPath,
  rings: RingsPath,
  plumb: PlumbPath,
  invader: InvaderPath,
};

interface FlyerMotifProps {
  kind: MotifKind;
  /** Rendered size in px (square). */
  size: number;
  /** Deterministic zine tilt, degrees — never Math.random (flyer-wall doctrine). */
  tiltDeg?: number;
  /** Distinguishes this instance's filter ids; two motifs on a page must not collide. */
  instanceId: string;
  /** Turbulence seed — vary it per sheet so no two share the same ink breakup. */
  wearSeed?: number;
}

export function FlyerMotif({
  kind,
  size,
  tiltDeg = 0,
  instanceId,
  wearSeed = 1,
}: FlyerMotifProps): JSX.Element {
  const Shape = MOTIF_SHAPES[kind];
  const filterId = `muf-motif-wear-${instanceId}`;
  return (
    <svg
      // Decorative only: it carries no information the player needs, and every flyer
      // already states its crew and difficulty in text. Hidden from assistive tech so
      // it never adds noise to the roving-focus reading of the wall.
      aria-hidden={true}
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ transform: tiltDeg === 0 ? undefined : `rotate(${String(tiltDeg)}deg)` }}
    >
      <defs>
        {/*
          Tired print. A perfectly clean vector edge is the one thing a 1998 photocopier
          could never produce, and it is what made these read as UI icons rather than ink.
          Turbulence displaces the outline by a pixel or so, which breaks the geometric
          perfection the way toner does on cheap stock: edges wobble, thin strokes thin
          out further, dots lose their roundness.

          `seed` is explicit and per-sheet — feTurbulence is only deterministic if you fix
          it, and the flyer wall forbids anything that reshuffles between renders.
        */}
        <filter id={filterId} x="-12%" y="-12%" width="124%" height="124%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.055"
            numOctaves={2}
            seed={wearSeed}
            result="grain"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="grain"
            scale={2.1}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      {/*
        Misregistration ghost: a second, fainter pull of the same plate a hair off
        register — the cheap two-pass artefact. Drawn UNDER the real ink and slightly
        offset, so it reads as a printing fault rather than as a drop shadow (a shadow
        would imply light, which the menu's zéro-glow rule forbids).
      */}
      <g transform="translate(0.9 0.7)" opacity={0.28} filter={`url(#${filterId})`}>
        <Shape />
      </g>
      <g filter={`url(#${filterId})`}>
        <Shape />
      </g>
    </svg>
  );
}
