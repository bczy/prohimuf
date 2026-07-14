import type { CSSProperties, JSX } from "react";
import type { GestureKind } from "@game/systems/narrativeSystem";

/**
 * Code-drawn, animated gesture icons for the tutorial control panels (ADR-0019).
 *
 * Every pixel lives here in the render layer — no sprite, no asset generation. Each icon is
 * fanzine B&W line art (inert décor) plus exactly ONE acid-neon element that glows (the part
 * the player acts with — `la loi du glow`), every glow a radial/linear alpha-falloff gradient
 * that reaches 0 at its margin (`un halo est un dégradé, jamais un aplat`, art-direction §2).
 * Animations follow `docs/game-design/tutorial-visual-gestures.md` §1. `prefers-reduced-motion`
 * freezes each icon on its readable base frame (see the media query in GESTURE_STYLES).
 *
 * The `Record<GestureKind, …>` is exhaustive over the closed `GestureKind` union: every value
 * resolves to an icon (a fifth `GestureKind` fails the render build until its icon exists), so no
 * unknown value can reach here through the type. The absent-gesture (text-only) case is the
 * caller's `gesture !== undefined` gate — never a broken slot (ADR-0019).
 */

const NEON = "#ffe600";
const INK = "#ededed";
const BODY = "#0b0916";

/**
 * Hand silhouettes for the two mobile icons, each ONE continuous fill path (fist + extended
 * finger(s) traced as a single outline) so nothing reads as a stray "paperclip" shape. V4 photo
 * pose (side-view arched tap): the forearm exits the TOP-RIGHT corner, the back-of-hand arches
 * over the knuckles, and the extended finger(s) descend diagonally down-left to touch the glass at
 * their tips in the lower-left third (two tips ≈(38,84) and ≈(28,95); one-finger index tip
 * ≈(34,87)). Draw with fill=BODY + INK stroke, matching the mouse icon's line-art weight.
 */
// Back-of-hand, index + middle extended, descending down-left to touch tips at lower-left; curled
// fingers scallop under the palm, thumb tucked, wrist off the top-right corner (two-finger tap).
const HAND_TWO_FINGER =
  "M120 12 C110 17 100 24 93 30 C86 35 80 33 74 35 C67 38 62 45 58 53 " +
  "C51 61 43 73 39 82 C37 85 35 87 34 89 C33 90 32 88 31 90 C29 94 26 96 27 94 " +
  "C30 89 46 80 58 78 C64 84 66 90 72 88 C77 86 79 90 84 87 C88 84 90 78 91 70 " +
  "C99 54 110 42 120 34 Z";
// Same arched hand with ONLY the index extended, the others curled into scallops under the palm (swipe).
const HAND_ONE_FINGER =
  "M120 12 C110 17 100 24 93 30 C86 35 80 33 74 35 C67 38 62 45 58 53 " +
  "C52 62 44 75 39 83 C36 87 33 89 33 87 C34 90 37 89 41 86 C44 83 47 80 50 77 " +
  "C55 73 60 76 65 82 C70 87 75 87 80 84 C86 81 90 76 91 70 " +
  "C99 54 110 42 120 34 Z";

const ICON_SVG_STYLE: CSSProperties = {
  height: "min(240px, 34vh)",
  width: "min(240px, 34vh)",
  maxHeight: "100%",
  maxWidth: "100%",
  display: "block",
};

/**
 * All keyframes + animation classes for the four icons, plus the reduced-motion freeze.
 * Rendered once inside whichever single icon is on screen (one panel shows at a time).
 */
const GESTURE_STYLES = `
.gi-mc-press  { animation: gi-mc-press 1.2s ease-out infinite; }
.gi-mc-halo   { animation: gi-mc-halo 1.2s ease-out infinite; }
.gi-mc-ripple { animation: gi-mc-ripple 1.2s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes gi-mc-press { 0%{transform:translateY(0)} 8%{transform:translateY(2px)} 28%{transform:translateY(0)} 100%{transform:translateY(0)} }
@keyframes gi-mc-halo { 0%{opacity:.4} 8%{opacity:1} 35%{opacity:.4} 100%{opacity:.4} }
@keyframes gi-mc-ripple { 0%{opacity:0;transform:scale(.35)} 12%{opacity:.85} 29%{opacity:0;transform:scale(1.15)} 100%{opacity:0;transform:scale(1.15)} }

.gi-es-cursor { animation: gi-es-cursor 4.8s ease-in-out infinite; }
.gi-es-glow-r { animation: gi-es-glow-r 4.8s ease-out infinite; }
.gi-es-glow-l { animation: gi-es-glow-l 4.8s ease-out infinite; }
.gi-es-chev-r { animation: gi-es-chev-r 4.8s ease-out infinite; }
.gi-es-chev-l { animation: gi-es-chev-l 4.8s ease-out infinite; }
@keyframes gi-es-cursor { 0%{transform:translateX(0)} 12%{transform:translateX(38px)} 29%{transform:translateX(38px)} 33%{transform:translateX(0)} 50%{transform:translateX(0)} 62%{transform:translateX(-38px)} 79%{transform:translateX(-38px)} 83%{transform:translateX(0)} 100%{transform:translateX(0)} }
@keyframes gi-es-glow-r { 0%,12%{opacity:0} 16%{opacity:1} 29%{opacity:1} 34%{opacity:0} 100%{opacity:0} }
@keyframes gi-es-glow-l { 0%,62%{opacity:0} 66%{opacity:1} 79%{opacity:1} 84%{opacity:0} 100%{opacity:0} }
@keyframes gi-es-chev-r { 0%,12%{opacity:0;transform:translateX(0)} 16%{opacity:.9} 29%{opacity:.9;transform:translateX(9px)} 34%{opacity:0;transform:translateX(11px)} 100%{opacity:0} }
@keyframes gi-es-chev-l { 0%,62%{opacity:0;transform:translateX(0)} 66%{opacity:.9} 79%{opacity:.9;transform:translateX(-9px)} 84%{opacity:0;transform:translateX(-11px)} 100%{opacity:0} }

.gi-tt-lift   { animation: gi-tt-lift 1.4s ease-in-out infinite; }
.gi-tt-halo   { animation: gi-tt-halo 1.4s ease-out infinite; }
.gi-tt-ripple { animation: gi-tt-ripple 1.4s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes gi-tt-lift { 0%{transform:translateY(-3px)} 10%{transform:translateY(2px)} 24%{transform:translateY(2px)} 40%{transform:translateY(-3px)} 100%{transform:translateY(-3px)} }
@keyframes gi-tt-halo { 0%{opacity:.18} 10%{opacity:1} 24%{opacity:1} 40%{opacity:.18} 100%{opacity:.18} }
@keyframes gi-tt-ripple { 0%{opacity:0;transform:scale(.3)} 10%{opacity:0;transform:scale(.35)} 15%{opacity:.85;transform:scale(.55)} 34%{opacity:0;transform:scale(1.3)} 100%{opacity:0;transform:scale(1.3)} }

/* Swipe pan: ONE finger, FULL 4-direction cycle (right → down → left → up), 2.0s per
   direction / 8s loop (spec §1.4/§1.5). Each direction sweeps, the finger lifts mid-travel
   (shared -lift fade on the hand <use> + fingertip glow), and the motion trail keeps gliding
   to an eased stop (inertia). Groups outside their 25% window are held at opacity 0. */
.gi-sp-r       { animation: gi-sp-r 8s ease-out infinite; }
.gi-sp-r-lift  { animation: gi-sp-r-lift 8s ease-out infinite; }
.gi-sp-r-trail { animation: gi-sp-r-trail 8s ease-out infinite; }
.gi-sp-d       { animation: gi-sp-d 8s ease-out infinite; }
.gi-sp-d-lift  { animation: gi-sp-d-lift 8s ease-out infinite; }
.gi-sp-d-trail { animation: gi-sp-d-trail 8s ease-out infinite; }
.gi-sp-l       { animation: gi-sp-l 8s ease-out infinite; }
.gi-sp-l-lift  { animation: gi-sp-l-lift 8s ease-out infinite; }
.gi-sp-l-trail { animation: gi-sp-l-trail 8s ease-out infinite; }
.gi-sp-u       { animation: gi-sp-u 8s ease-out infinite; }
.gi-sp-u-lift  { animation: gi-sp-u-lift 8s ease-out infinite; }
.gi-sp-u-trail { animation: gi-sp-u-trail 8s ease-out infinite; }
@keyframes gi-sp-r { 0%{transform:translate(-34px,0);opacity:1} 6%{transform:translate(6px,0)} 15%{transform:translate(30px,0)} 23%{transform:translate(30px,0);opacity:1} 25%{transform:translate(30px,0);opacity:0} 100%{transform:translate(-34px,0);opacity:0} }
@keyframes gi-sp-r-lift { 0%{opacity:1} 8%{opacity:1} 12%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-r-trail { 0%{opacity:.9} 15%{opacity:.9} 20%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-d { 0%{transform:translate(0,-26px);opacity:0} 24%{transform:translate(0,-26px);opacity:0} 25%{transform:translate(0,-26px);opacity:1} 31%{transform:translate(0,4px)} 40%{transform:translate(0,20px)} 48%{transform:translate(0,20px);opacity:1} 50%{transform:translate(0,20px);opacity:0} 100%{transform:translate(0,20px);opacity:0} }
@keyframes gi-sp-d-lift { 0%,25%{opacity:1} 33%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-d-trail { 0%,25%{opacity:.9} 40%{opacity:.9} 45%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-l { 0%{transform:translate(34px,0);opacity:0} 49%{transform:translate(34px,0);opacity:0} 50%{transform:translate(34px,0);opacity:1} 56%{transform:translate(-6px,0)} 65%{transform:translate(-30px,0)} 73%{transform:translate(-30px,0);opacity:1} 75%{transform:translate(-30px,0);opacity:0} 100%{transform:translate(-30px,0);opacity:0} }
@keyframes gi-sp-l-lift { 0%,50%{opacity:1} 58%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-l-trail { 0%,50%{opacity:.9} 65%{opacity:.9} 70%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-u { 0%{transform:translate(0,20px);opacity:0} 74%{transform:translate(0,20px);opacity:0} 75%{transform:translate(0,20px);opacity:1} 81%{transform:translate(0,-2px)} 90%{transform:translate(0,-26px)} 98%{transform:translate(0,-26px);opacity:1} 100%{transform:translate(0,-26px);opacity:0} }
@keyframes gi-sp-u-lift { 0%,75%{opacity:1} 83%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-u-trail { 0%,75%{opacity:.9} 90%{opacity:.9} 95%{opacity:0} 100%{opacity:0} }

@media (prefers-reduced-motion: reduce) {
  .gi-anim { animation: none !important; }
}
`;

/** Desktop — single LEFT click = one shot (§1.1). Left button + one ripple are the only glow. */
function MouseClickIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{GESTURE_STYLES}</style>
      <defs>
        <radialGradient id="gi-mc-halo-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={NEON} stopOpacity="0.85" />
          <stop offset="55%" stopColor={NEON} stopOpacity="0.3" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* cable + body + wheel: inert line art, never glows */}
      <path
        d="M60 30 C60 18 70 14 80 12"
        fill="none"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect
        x="40"
        y="30"
        width="40"
        height="62"
        rx="20"
        fill={BODY}
        stroke={INK}
        strokeWidth="2.5"
      />
      <line x1="60" y1="31" x2="60" y2="50" stroke={INK} strokeWidth="1.8" />
      <line x1="41" y1="50" x2="79" y2="50" stroke={INK} strokeWidth="1.4" opacity="0.55" />
      <rect x="57" y="37" width="6" height="12" rx="3" fill="none" stroke={INK} strokeWidth="1.4" />
      {/* single click-ripple, invisible at rest */}
      <circle
        className="gi-anim gi-mc-ripple"
        cx="60"
        cy="60"
        r="26"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="0"
      />
      {/* the only lit element: LEFT button (presses 2px, glow spikes) */}
      <g className="gi-anim gi-mc-press">
        <ellipse
          className="gi-anim gi-mc-halo"
          cx="50"
          cy="41"
          rx="19"
          ry="16"
          fill="url(#gi-mc-halo-grad)"
          opacity="0.4"
        />
        <path
          d="M59 31 H47 A17 17 0 0 0 41 43 V50 H59 Z"
          fill={NEON}
          fillOpacity="0.14"
          stroke={NEON}
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

/** Desktop — push cursor to an EDGE, view scrolls that way, both senses (§1.2). Edge band glows. */
function EdgeScrollIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{GESTURE_STYLES}</style>
      <defs>
        <linearGradient id="gi-es-gr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="55%" stopColor={NEON} stopOpacity="0.04" />
          <stop offset="80%" stopColor={NEON} stopOpacity="0.22" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="gi-es-gl" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="55%" stopColor={NEON} stopOpacity="0.04" />
          <stop offset="80%" stopColor={NEON} stopOpacity="0.22" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* framed mini-screen: inert */}
      <rect
        x="10"
        y="20"
        width="100"
        height="80"
        rx="5"
        fill={BODY}
        stroke={INK}
        strokeWidth="2.5"
      />
      {/* edge bands: bright at the edge, falloff INWARD to 0. Static values encode the readable
          reduced-motion base frame — RIGHT band lit, LEFT band off; animation overrides both. */}
      <rect
        className="gi-anim gi-es-glow-r"
        x="90"
        y="22"
        width="18"
        height="76"
        fill="url(#gi-es-gr)"
        opacity="1"
      />
      <rect
        className="gi-anim gi-es-glow-l"
        x="12"
        y="22"
        width="18"
        height="76"
        fill="url(#gi-es-gl)"
        opacity="0"
      />
      {/* chevrons marching outward with the pan */}
      <g className="gi-anim gi-es-chev-r" opacity="0">
        <path
          d="M92 52 l6 8 l-6 8"
          fill="none"
          stroke={NEON}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M100 52 l6 8 l-6 8"
          fill="none"
          stroke={NEON}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </g>
      <g className="gi-anim gi-es-chev-l" opacity="0">
        <path
          d="M28 52 l-6 8 l6 8"
          fill="none"
          stroke={NEON}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 52 l-6 8 l6 8"
          fill="none"
          stroke={NEON}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </g>
      {/* cursor pushed flat against the edge (inert arrow). Static transform parks it on the RIGHT
          edge for the readable reduced-motion base frame; the CSS animation overrides transform. */}
      <g className="gi-anim gi-es-cursor" transform="translate(38 0)">
        <path
          d="M60 48 v22 l5 -5 l4 8 l4 -2 l-4 -8 l7 0 z"
          fill={INK}
          stroke="#000"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/**
 * Mobile — ONE simultaneous two-finger tap = shoot, bullet from the midpoint (§1.3).
 * A stylized back-of-hand (index + middle extended, rest folded) traced as one silhouette; both
 * fingertips touch the glass and their neon halos flash in sync while a single ripple springs
 * from the midpoint between them. The phone frame is thin, low-contrast background context.
 */
function TwoFingerTapIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{GESTURE_STYLES}</style>
      <defs>
        <radialGradient id="gi-tt-halo-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={NEON} stopOpacity="0.9" />
          <stop offset="55%" stopColor={NEON} stopOpacity="0.3" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* phone frame: thin, low-contrast background context — never glows */}
      <rect
        x="20"
        y="10"
        width="80"
        height="104"
        rx="10"
        fill="none"
        stroke={INK}
        strokeWidth="1.4"
        opacity="0.28"
      />
      {/* single ripple from the midpoint between the two fingertips (lower-left contact) */}
      <circle
        className="gi-anim gi-tt-ripple"
        cx="33"
        cy="90"
        r="13"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="0"
      />
      {/* the hand dips to touch, lifts, long rest; both fingertip halos share ONE class → sync flash */}
      <g className="gi-anim gi-tt-lift">
        {/* single continuous silhouette (fist + two extended fingers) */}
        <path
          d={HAND_TWO_FINGER}
          fill={BODY}
          stroke={INK}
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* interior line-art detail: knuckle ridge + finger split crease + curled scallop creases */}
        <path
          d="M60 50 C70 46 80 42 91 36"
          fill="none"
          stroke={INK}
          strokeWidth="1.8"
          opacity="0.55"
          strokeLinecap="round"
        />
        <path
          d="M54 57 C48 66 42 76 36 84"
          fill="none"
          stroke={INK}
          strokeWidth="1.6"
          opacity="0.45"
          strokeLinecap="round"
        />
        <path
          d="M70 86 c1 -3 3 -4 4 -1"
          fill="none"
          stroke={INK}
          strokeWidth="1.6"
          opacity="0.45"
          strokeLinecap="round"
        />
        <path
          d="M81 87 c1 -3 3 -4 4 -1"
          fill="none"
          stroke={INK}
          strokeWidth="1.6"
          opacity="0.45"
          strokeLinecap="round"
        />
        {/* both fingertip halos — the only lit elements (r≤8: past ~9 the pair merges) */}
        <circle
          className="gi-anim gi-tt-halo"
          cx="38"
          cy="84"
          r="8"
          fill="url(#gi-tt-halo-grad)"
          opacity="0.85"
        />
        <circle
          className="gi-anim gi-tt-halo"
          cx="28"
          cy="95"
          r="8"
          fill="url(#gi-tt-halo-grad)"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}

/**
 * Mobile — ONE finger swipes to pan, trail keeps gliding (inertia) (§1.4).
 * Same hand vocabulary with ONLY the index extended; the hand sweeps across, the fingertip
 * trails an alpha-falloff motion trail (bright at tip → 0 at tail), the hand lifts mid-travel
 * and the trail glides to an eased stop (flick inertia). The FULL cycle sweeps all four
 * directions (right → down → left → up), 2.0s each (§1.4/§1.5). The hand silhouette is defined
 * ONCE in `<defs>` and `<use>`d per direction so the four-way cycle stays cheap (no duplication).
 */
function SwipePanIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{GESTURE_STYLES}</style>
      <defs>
        {/* one alpha-falloff motion trail per axis-sense: bright at the fingertip → 0 at the tail */}
        <linearGradient id="gi-sp-tr-r" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gi-sp-tr-l" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gi-sp-tr-d" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gi-sp-tr-u" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="gi-sp-tip-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={NEON} stopOpacity="1" />
          <stop offset="60%" stopColor={NEON} stopOpacity="0.35" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0" />
        </radialGradient>
        {/* the hand silhouette + interior line-art detail, defined ONCE, <use>d per direction */}
        <g id="gi-sp-hand">
          {/* single continuous silhouette (fist + one extended index) */}
          <path
            d={HAND_ONE_FINGER}
            fill={BODY}
            stroke={INK}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M60 50 C70 46 80 42 91 36"
            fill="none"
            stroke={INK}
            strokeWidth="1.8"
            opacity="0.55"
            strokeLinecap="round"
          />
          <path
            d="M54 56 C48 64 43 72 39 82"
            fill="none"
            stroke={INK}
            strokeWidth="1.6"
            opacity="0.45"
            strokeLinecap="round"
          />
          <path
            d="M63 80 c1 -3 3 -4 4 -1"
            fill="none"
            stroke={INK}
            strokeWidth="1.6"
            opacity="0.45"
            strokeLinecap="round"
          />
          <path
            d="M74 82 c1 -3 3 -4 4 -1"
            fill="none"
            stroke={INK}
            strokeWidth="1.6"
            opacity="0.45"
            strokeLinecap="round"
          />
        </g>
      </defs>
      {/* phone frame: thin, low-contrast background context — never glows */}
      <rect
        x="14"
        y="12"
        width="92"
        height="100"
        rx="10"
        fill="none"
        stroke={INK}
        strokeWidth="1.4"
        opacity="0.28"
      />
      {/* RIGHT sweep (also the readable reduced-motion base frame: this group stays visible) */}
      <g className="gi-anim gi-sp-r">
        <rect
          className="gi-anim gi-sp-r-trail"
          x="0"
          y="82"
          width="34"
          height="10"
          rx="5"
          fill="url(#gi-sp-tr-r)"
        />
        <use className="gi-anim gi-sp-r-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-r-lift"
          cx="34"
          cy="87"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* DOWN sweep */}
      <g className="gi-anim gi-sp-d" opacity="0">
        <rect
          className="gi-anim gi-sp-d-trail"
          x="29"
          y="53"
          width="10"
          height="34"
          rx="5"
          fill="url(#gi-sp-tr-d)"
        />
        <use className="gi-anim gi-sp-d-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-d-lift"
          cx="34"
          cy="87"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* LEFT sweep */}
      <g className="gi-anim gi-sp-l" opacity="0">
        <rect
          className="gi-anim gi-sp-l-trail"
          x="34"
          y="82"
          width="34"
          height="10"
          rx="5"
          fill="url(#gi-sp-tr-l)"
        />
        <use className="gi-anim gi-sp-l-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-l-lift"
          cx="34"
          cy="87"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* UP sweep */}
      <g className="gi-anim gi-sp-u" opacity="0">
        <rect
          className="gi-anim gi-sp-u-trail"
          x="29"
          y="87"
          width="10"
          height="34"
          rx="5"
          fill="url(#gi-sp-tr-u)"
        />
        <use className="gi-anim gi-sp-u-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-u-lift"
          cx="34"
          cy="87"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
    </svg>
  );
}

const ICONS: Record<GestureKind, () => JSX.Element> = {
  "mouse-click": MouseClickIcon,
  "edge-scroll": EdgeScrollIcon,
  "two-finger-tap": TwoFingerTapIcon,
  "swipe-pan": SwipePanIcon,
};

/**
 * Renders the animated code-drawn icon for `kind`. The `ICONS` map is exhaustive over
 * `GestureKind`, so every value resolves to an icon (a fifth value would fail the build) —
 * the "never a broken slot" guarantee (ADR-0019) is upheld at compile time here, and the
 * absent-gesture text-only fallback is handled by the caller's `gesture !== undefined` gate.
 * The caller owns the accessible slot (`role="img"` + label); the SVG itself is `aria-hidden`.
 */
export function GestureIcon({ kind }: { readonly kind: GestureKind }): JSX.Element {
  const Icon = ICONS[kind];
  return <Icon />;
}
