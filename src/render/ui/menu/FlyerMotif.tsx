import type { JSX } from "react";

/**
 * The single ink stamp each crew printed on its flyer, code-drawn as SVG — no sprite,
 * no asset generation (GestureIcon doctrine, ADR-0020).
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

export type MotifKind = "spiral" | "smiley" | "rings" | "halftone" | "invader";

/**
 * Which crew stamped what. Deliberately UNIQUE across the wall: the spiral belongs to
 * SPIRALE 23 (Belliard) and nowhere else — repeating a crew's signature on every sheet
 * would turn an emblem into wallpaper. Keyed by level id; a level absent from this map
 * simply shows no motif, which is why the type is a partial record rather than an
 * exhaustive one (a new level must not fail the build over decoration).
 */
export const MOTIF_BY_LEVEL_ID: Readonly<Partial<Record<string, MotifKind>>> = {
  tutorial: "smiley",
  belliard: "spiral",
  stalingrad: "rings",
  vitry: "halftone",
  "niveau-final": "invader",
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

/** Concentric rings — the hypnotic target of the period's psy flyers. */
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
 * Coarse halftone lozenge — a photo screened down to dots so a copier could reproduce
 * it at all. Dot RADIUS carries the tone, which is exactly how a halftone works; the
 * grid is deliberately coarse, like a cheap repro shop's screen.
 */
function HalftonePath(): JSX.Element {
  const dots: JSX.Element[] = [];
  const step = 9;
  for (let y = step / 2; y < 100; y += step) {
    for (let x = step / 2; x < 100; x += step) {
      const u = x / 100;
      const v = y / 100;
      // A smooth blob thresholded into dot size — deterministic, no Math.random.
      const field =
        0.55 + 0.45 * Math.sin(u * 5.1) * Math.cos(v * 4.3) + 0.25 * Math.sin((u + v) * 9);
      const r = Math.max(0, Math.min(1, field)) * step * 0.52;
      if (r < 0.5) continue;
      dots.push(
        <circle key={`${String(x)}-${String(y)}`} cx={x} cy={y} r={r} fill="currentColor" />,
      );
    }
  }
  return <>{dots}</>;
}

/**
 * Space Invader. Not an anachronism — the arcade sprite was already 20 years old in
 * 1998 — and the ideal cheap-print motif: a grid of solid squares is the simplest thing
 * a stencil or a photocopier can hold.
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
  halftone: HalftonePath,
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
  className?: string;
}

export function FlyerMotif({
  kind,
  size,
  tiltDeg = 0,
  instanceId,
  wearSeed = 1,
  className,
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
      className={className}
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
