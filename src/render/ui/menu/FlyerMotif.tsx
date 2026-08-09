import type { JSX } from "react";

/**
 * The single ink stamp printed on each flyer, code-drawn as SVG — no sprite, no asset
 * generation (GestureIcon doctrine, ADR-0020).
 *
 * Five sheets, four marks: the tutorial carries none. Its gated copy is
 * `SANS SYSTÈME · AVANT LE SON` — an unsigned sheet takes no stamp, so it is simply absent
 * from the table below.
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
 * Ported from the parked R3F spike (`claude/spike-r3f-flyers`), where the motifs were
 * rasterised onto canvas textures.
 */

export type MotifKind = "spiral" | "rings" | "plumb" | "chandelier";

/** WHERE the stamp landed on the sheet — vertically. `hero` prints it above the masthead
 *  (the sheet whose front IS the image, type pushed under it), `mid` between the difficulty
 *  row and the slogan, `body` after the info lines. Horizontally every emblem stays CENTRED:
 *  a stamp that wandered sideways fought the flyer's centred masthead and left ragged white
 *  on one flank, so the variety lives on the vertical axis. */
export type MotifSlot = "hero" | "mid" | "body";

export interface FlyerEmblem {
  /** The sheet's mark. UNIQUE across the wall: repeating one turns a signature into
   *  wallpaper, and the deck's earlier shared-motif doctrine is superseded. */
  kind: MotifKind;
  slot: MotifSlot;
  /** Per-sheet vertical nudge in px, so two sheets sharing a slot still don't line up. */
  offsetY: number;
  /** Deliberately UNEVEN across sheets: crews printing on different machines never land the
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
  // `tutorial` is deliberately ABSENT: that sheet is unsigned (`SANS SYSTÈME · AVANT LE SON`).
  belliard: { kind: "spiral", slot: "body", offsetY: -6, sizePx: 96, tiltDeg: 3, wearSeed: 21 },
  stalingrad: { kind: "rings", slot: "mid", offsetY: -10, sizePx: 84, tiltDeg: -2, wearSeed: 13 },
  // The one sheet that leads with its image: NADIR 94's plumb bob hangs across the top and
  // the lettering starts below it.
  vitry: { kind: "plumb", slot: "hero", offsetY: 0, sizePx: 100, tiltDeg: 5, wearSeed: 34 },
  "niveau-final": {
    kind: "chandelier",
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

/**
 * NADIR 94's plumb bob — a weight on a line that points, by gravity alone, at the lowest
 * point, which is what a nadir is. Solid ink like the rest of the set (lead-art, PR #145).
 * A builder's tool is also period-plain: a crew stencilling a squat announcement had one
 * to hand.
 */
function PlumbPath(): JSX.Element {
  return (
    <>
      {/* Suspension bar and line kept as their own paths: overlapping them with the
          even-odd bob below would punch notches where the shapes meet. */}
      <path fill="currentColor" d="M30 6h40v9H30z" />
      <path fill="currentColor" d="M46 15h8v21h-8z" />
      {/* The bob, with its sighting hole PUNCHED rather than painted — a stencil cuts holes,
          it does not paint them, and it keeps the mass readable at reading distance. */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={"M50 36 74 50 50 96 26 50Z" + "M50 52a8 8 0 1 1 .1 0z"}
      />
    </>
  );
}

/**
 * L'Éden's chandelier, reduced to a mark. The hall's own fixture — parquet, balcony, "un
 * seul lustre lourd" still hanging — is the venue's emblem in
 * `docs/game-design/spec-niveau-final-fiction.md` §1.3: « le vieux monde suspendu
 * au-dessus de la fête ». The sheet is signed by the room, not by a crew.
 *
 * Reduced to a RADIATING PENDANT — a hub on a rod, its branches thrown out all round —
 * rather than to a tier with candles: a bowl under two bulbs reads as a face, and the one
 * face this set ever had was deliberately struck off it. Nothing here glows either (the
 * menu's zéro-glow rule); the rays are branches, not light. Radial symmetry is also what
 * survives a photocopier, where crystals would fill in.
 */
function ChandelierPath(): JSX.Element {
  // Five branches, thrown out and DOWN only: a fixture hangs, so nothing radiates upward
  // into the rod. Angles are degrees from the horizontal-right, sweeping through the
  // bottom — the same spread on both sides, which is what makes it read as one object.
  const arms = [15, 52, 90, 128, 165].map((deg) => {
    const a = (deg * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    return {
      deg,
      x1: (50 + cos * 14).toFixed(2),
      y1: (44 + sin * 14).toFixed(2),
      x2: (50 + cos * 38).toFixed(2),
      y2: (44 + sin * 38).toFixed(2),
      bx: 50 + cos * 42,
      by: 44 + sin * 42,
    };
  });
  return (
    <>
      {/* The suspension rod: it hangs from a ceiling the sheet does not show. */}
      <path fill="currentColor" d="M47 0h6v26h-6z" />
      {arms.map((arm) => (
        <g key={arm.deg}>
          <line
            x1={arm.x1}
            y1={arm.y1}
            x2={arm.x2}
            y2={arm.y2}
            stroke="currentColor"
            strokeWidth={6}
            strokeLinecap="round"
          />
          {/* Each branch ends in its bulb — a dot, never a halo: the menu forbids light. */}
          <circle cx={arm.bx.toFixed(2)} cy={arm.by.toFixed(2)} r={6} fill="currentColor" />
        </g>
      ))}
      {/* The hub, its centre PUNCHED with even-odd like the plumb bob's sighting hole —
          a stencil cuts holes rather than painting them, and the mass stays open at 88px. */}
      <path
        fillRule="evenodd"
        fill="currentColor"
        d={"M32 44a18 18 0 1 0 36 0a18 18 0 1 0-36 0Z" + "M42 44a8 8 0 1 0 16 0a8 8 0 1 0-16 0Z"}
      />
    </>
  );
}

const MOTIF_SHAPES: Record<MotifKind, () => JSX.Element> = {
  spiral: SpiralPath,
  rings: RingsPath,
  plumb: PlumbPath,
  chandelier: ChandelierPath,
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
