import type { CSSProperties, JSX } from "react";
import type { DiagramKind } from "@game/systems/narrativeSystem";
import { ringZoneColour } from "@render/scene/hostageCue";

/**
 * Code-drawn, animated MECHANIC diagrams for the tutorial (sibling of `GestureIcon`, which
 * teaches control gestures). A diagram teaches a game RULE, so it is not device-forked. Every
 * pixel lives in the render layer — no sprite, no asset generation.
 *
 * `hostage-ring` teaches the hostage-QTE spatial-colour reticle: a ring sweeps the captor and
 * changes colour by the anatomy under its centre — RED off-body (wasted), YELLOW on a limb
 * (partial), GREEN on the head (lethal) — so the lesson is "aligne, attends le vert, tire". The
 * three hues are pulled from `ringZoneColour` (the SAME map the in-game ring uses) so the tutorial
 * shows the true colours. The figures are inert B&W line art on a dark "screen" inset (so the acid
 * hues read on the light newsprint panel); the RING is the one lit element (`la loi du glow`).
 * `prefers-reduced-motion` freezes the ring on its GREEN-on-the-head payoff frame (the panel text
 * and the `diagramAlt` carry the full red/yellow/green rule without motion).
 */

const INK = "#ededed"; // light line art, on the dark inset
const BODY = "#0b0916"; // the dark "screen" inset ground
const CROSS = "#f2f2f2"; // the player's aim reticle — neutral, never a zone hue

// The true in-game reticle hues (single source of truth: the render-side colour map).
const GREEN = ringZoneColour("vital"); // head → lethal
const YELLOW = ringZoneColour("limb"); // limb → partial
const RED = ringZoneColour("off"); // off-body → wasted

const ICON_SVG_STYLE: CSSProperties = {
  height: "min(240px, 34vh)",
  width: "min(240px, 34vh)",
  maxHeight: "100%",
  maxWidth: "100%",
  display: "block",
};

// The ring rides three beats — head(green) → torso(yellow) → off(red) — translating from its
// base (the head) and recolouring in lockstep, so colour reads as a function of POSITION. On the
// green beat a shot-flash pulses (the payoff). Reduced motion freezes every element (base attrs =
// green-on-head). transform-box/origin let the SVG translate honour px deltas.
const DIAGRAM_STYLES = `
.di-anim { transform-box: fill-box; transform-origin: center; }
.di-ring  { animation: di-ring 5.4s ease-in-out infinite; }
.di-flash { animation: di-flash 5.4s ease-out infinite; }
@keyframes di-ring {
  0%   { transform: translate(0,0);        stroke: ${GREEN};  }
  26%  { transform: translate(0,0);        stroke: ${GREEN};  }
  33%  { transform: translate(-2px,20px);  stroke: ${YELLOW}; }
  59%  { transform: translate(-2px,20px);  stroke: ${YELLOW}; }
  66%  { transform: translate(-28px,12px); stroke: ${RED};    }
  93%  { transform: translate(-28px,12px); stroke: ${RED};    }
  100% { transform: translate(0,0);        stroke: ${GREEN};  }
}
@keyframes di-flash {
  0%   { opacity: 0; transform: scale(.5); }
  6%   { opacity: .9; transform: scale(1); }
  22%  { opacity: 0; transform: scale(1.35); }
  100% { opacity: 0; transform: scale(1.35); }
}
@media (prefers-reduced-motion: reduce) {
  .di-anim { animation: none !important; }
}
`;

/** The hostage-QTE colour-ring diagram (the only `DiagramKind` today). */
function HostageRingIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{DIAGRAM_STYLES}</style>
      {/* Dark "screen" inset — lets the acid ring hues read on the light newsprint panel. */}
      <rect
        x="8"
        y="10"
        width="104"
        height="100"
        rx="6"
        fill={BODY}
        stroke="#141210"
        strokeWidth="2"
      />

      {/* Captor — schematic hooded figure, inert light line art (never glows). */}
      <g fill="none" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        {/* hood + head */}
        <path d="M51 40 C51 28 69 28 69 40 L67 50 C64 55 56 55 53 50 Z" />
        {/* shoulders + torso down into the inset */}
        <path d="M47 52 C44 60 44 78 46 96 L74 96 C76 80 76 62 73 52" />
        {/* the gun arm reaching out (reads as "armed") */}
        <path d="M50 60 L36 56" />
      </g>
      {/* Hostage — a small kneeling shield held front-right (inert line art). */}
      <g
        fill="none"
        stroke={INK}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      >
        <circle cx="78" cy="72" r="6" />
        <path d="M71 80 C70 88 72 94 74 98 L86 98 C86 90 86 82 84 78" />
      </g>

      {/* Player aim reticle — a fixed, neutral crosshair low on the tableau (never a zone hue). */}
      <g stroke={CROSS} strokeWidth="1.6" fill="none" opacity="0.9">
        <circle cx="60" cy="70" r="8" />
        <line x1="60" y1="59" x2="60" y2="66" />
        <line x1="60" y1="74" x2="60" y2="81" />
        <line x1="49" y1="70" x2="56" y2="70" />
        <line x1="64" y1="70" x2="71" y2="70" />
        <circle cx="60" cy="70" r="1.4" fill={CROSS} stroke="none" />
      </g>

      {/* Shot-flash on the GREEN (head) beat — the payoff. Base opacity 0 (reduced-motion: stays off). */}
      <circle
        className="di-anim di-flash"
        cx="60"
        cy="36"
        r="18"
        fill="none"
        stroke={GREEN}
        strokeWidth="2"
        opacity="0"
      />

      {/* The wandering reticle RING — the one lit element. Base = GREEN on the head (also the
          reduced-motion frozen frame); the animation sweeps it to the limb (yellow) and off (red). */}
      <circle
        className="di-anim di-ring"
        cx="60"
        cy="36"
        r="13"
        fill="none"
        stroke={GREEN}
        strokeWidth="3.4"
      />
    </svg>
  );
}

const DIAGRAMS: Record<DiagramKind, () => JSX.Element> = {
  "hostage-ring": HostageRingIcon,
};

/**
 * Renders the animated code-drawn diagram for `kind`. The `DIAGRAMS` map is exhaustive over the
 * closed `DiagramKind` union (a new value fails the build until its diagram exists), so every value
 * draws — never a broken slot. The caller owns the accessible slot (`role="img"` + label); the SVG
 * itself is `aria-hidden`.
 */
export function DiagramIcon({ kind }: { readonly kind: DiagramKind }): JSX.Element {
  const Diagram = DIAGRAMS[kind];
  return <Diagram />;
}
