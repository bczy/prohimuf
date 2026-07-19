import type { JSX } from "react";
import type { GestureKind } from "@game/systems/narrativeSystem";
import styles from "./GestureIcon.module.css";

/**
 * Code-drawn, animated gesture icons for the tutorial control panels (ADR-0020).
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
 * caller's `gesture !== undefined` gate — never a broken slot (ADR-0020).
 */

const NEON = "#ffe600";
const INK = "#ededed";
const BODY = "#0b0916";

/**
 * Hand silhouettes for the two mobile icons — v5 iStock touch-pictogram vocabulary. Each is ONE
 * continuous THIN outline (fill=none, INK stroke 2.4, round caps/joins): the extended finger(s)
 * point straight UP with their tips near the top edge, the unused fingers read as curled
 * knuckle-bumps, a soft thumb lobe, and a short wrist at the bottom. The outline draws its own
 * curled knuckles, so there are NO interior crease sub-paths. Neon (#ffe600) contact indicators
 * live as SEPARATE paths in each icon (tap rings / swipe tip-circle), never on the hand itself.
 * Fingertip anchors: two-finger tips ≈(45,23) and ≈(63,17); one-finger index tip ≈(50,19).
 */
// Index + middle extended straight up (tips top-centre), remaining fingers curled as knuckle-bumps,
// soft thumb lobe on the left, short wrist at the bottom (two-finger tap).
const HAND_TWO_FINGER =
  "M40 28 C40 22 50 21 51 27 L52 46 C52 50 58 50 58 46 L58 24 C58 17 68 16 69 23 " +
  "L70 52 C73 47 80 47 81 55 C83 51 90 52 91 60 C95 71 93 93 84 105 C78 110 61 110 55 105 " +
  "C50 104 40 99 37 91 C34 84 35 78 39 74 C42 71 45 72 46 74 L40 28 Z";
// Same hand with ONLY the index extended straight up, the others curled into knuckle-bumps (swipe).
const HAND_ONE_FINGER =
  "M45 24 C45 18 56 18 56 24 L57 52 C60 47 67 47 68 55 C70 50 77 51 78 59 " +
  "C80 55 86 56 87 63 C91 73 90 93 82 105 C76 110 59 110 53 105 " +
  "C49 104 39 99 36 91 C33 84 34 78 38 74 C41 71 44 72 45 74 L45 24 Z";

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
@keyframes gi-sp-d { 0%{transform:translate(0,-2px);opacity:0} 24%{transform:translate(0,-2px);opacity:0} 25%{transform:translate(0,-2px);opacity:1} 31%{transform:translate(0,16px)} 40%{transform:translate(0,34px)} 48%{transform:translate(0,34px);opacity:1} 50%{transform:translate(0,34px);opacity:0} 100%{transform:translate(0,34px);opacity:0} }
@keyframes gi-sp-d-lift { 0%,25%{opacity:1} 33%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-d-trail { 0%,25%{opacity:.9} 40%{opacity:.9} 45%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-l { 0%{transform:translate(34px,0);opacity:0} 49%{transform:translate(34px,0);opacity:0} 50%{transform:translate(34px,0);opacity:1} 56%{transform:translate(-6px,0)} 65%{transform:translate(-30px,0)} 73%{transform:translate(-30px,0);opacity:1} 75%{transform:translate(-30px,0);opacity:0} 100%{transform:translate(-30px,0);opacity:0} }
@keyframes gi-sp-l-lift { 0%,50%{opacity:1} 58%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-l-trail { 0%,50%{opacity:.9} 65%{opacity:.9} 70%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-u { 0%{transform:translate(0,34px);opacity:0} 74%{transform:translate(0,34px);opacity:0} 75%{transform:translate(0,34px);opacity:1} 81%{transform:translate(0,16px)} 90%{transform:translate(0,-2px)} 98%{transform:translate(0,-2px);opacity:1} 100%{transform:translate(0,-2px);opacity:0} }
@keyframes gi-sp-u-lift { 0%,75%{opacity:1} 83%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-u-trail { 0%,75%{opacity:.9} 90%{opacity:.9} 95%{opacity:0} 100%{opacity:0} }

@media (prefers-reduced-motion: reduce) {
  .gi-anim { animation: none !important; }
}
`;

/** Desktop — single LEFT click = one shot (§1.1). Left button + one ripple are the only glow. */
function MouseClickIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className={styles.iconSvg} aria-hidden="true">
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
    <svg viewBox="0 0 120 120" className={styles.iconSvg} aria-hidden="true">
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
 * A thin outline hand (index + middle extended straight up, rest curled) with both fingertips at
 * the top; their neon halos flash in sync while three concentric neon rings pulse from the contact
 * midpoint (55,17) on the tap beat. Reduced motion freezes the three rings static (the reference's
 * resting look). The phone frame is thin, low-contrast background context.
 */
function TwoFingerTapIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className={styles.iconSvg} aria-hidden="true">
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
      {/* concentric contact rings from the fingertip midpoint — plain 2px neon strokes that pulse
          on the tap beat; static opacity=1 encodes the reduced-motion frozen frame (three rings) */}
      <circle
        className="gi-anim gi-tt-ripple"
        cx="55"
        cy="17"
        r="6"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="1"
      />
      <circle
        className="gi-anim gi-tt-ripple"
        cx="55"
        cy="17"
        r="10"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="1"
      />
      <circle
        className="gi-anim gi-tt-ripple"
        cx="55"
        cy="17"
        r="14"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="1"
      />
      {/* the hand dips to touch, lifts, long rest; both fingertip halos share ONE class → sync flash */}
      <g className="gi-anim gi-tt-lift">
        {/* single continuous outline (fist + two extended fingers), fill=none — draws its own knuckles */}
        <path
          d={HAND_TWO_FINGER}
          fill="none"
          stroke={INK}
          strokeWidth="2.4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* both fingertip halos — the only lit elements (r≤8: past ~9 the pair merges) */}
        <circle
          className="gi-anim gi-tt-halo"
          cx="45"
          cy="23"
          r="8"
          fill="url(#gi-tt-halo-grad)"
          opacity="0.85"
        />
        <circle
          className="gi-anim gi-tt-halo"
          cx="63"
          cy="17"
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
 * Same outline vocabulary with ONLY the index extended (tip at ≈(50,19)); the hand sweeps across,
 * the fingertip trails an alpha-falloff motion trail (bright at tip → 0 at tail), the hand lifts
 * mid-travel and the trail glides to an eased stop (flick inertia). The FULL cycle sweeps all four
 * directions (right → down → left → up), 2.0s each (§1.4/§1.5). A static neon contact ring marks
 * the touch point; the reduced-motion frozen frame swaps the animated trail for a direction arrow.
 * The hand outline is defined ONCE in `<defs>` and `<use>`d per direction (no duplication).
 */
function SwipePanIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" className={styles.iconSvg} aria-hidden="true">
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
        {/* the hand outline, defined ONCE, <use>d per direction — fill=none, draws its own knuckles */}
        <g id="gi-sp-hand">
          <path
            d={HAND_ONE_FINGER}
            fill="none"
            stroke={INK}
            strokeWidth="2.4"
            strokeLinejoin="round"
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
      {/* static neon contact mark at the fingertip touch point — plain 2px stroke (reference idiom) */}
      <circle cx="50" cy="20" r="7" fill="none" stroke={NEON} strokeWidth="2" />
      {/* left + right direction arrows flanking the contact ring (reference idiom: the ↔ tells
          "you can move this way"); always visible, and they carry the reduced-motion frame too */}
      <g stroke={NEON} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="61" y1="20" x2="78" y2="20" />
        <path d="M72 14 L78 20 L72 26" />
        <line x1="39" y1="20" x2="22" y2="20" />
        <path d="M28 14 L22 20 L28 26" />
      </g>
      {/* RIGHT sweep (also the readable reduced-motion base frame: this group stays visible) */}
      <g className="gi-anim gi-sp-r">
        <rect
          className="gi-anim gi-sp-r-trail"
          x="16"
          y="14"
          width="34"
          height="10"
          rx="5"
          fill="url(#gi-sp-tr-r)"
          opacity="0"
        />
        <use className="gi-anim gi-sp-r-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-r-lift"
          cx="50"
          cy="19"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* DOWN sweep */}
      <g className="gi-anim gi-sp-d" opacity="0">
        <rect
          className="gi-anim gi-sp-d-trail"
          x="45"
          y="-15"
          width="10"
          height="34"
          rx="5"
          fill="url(#gi-sp-tr-d)"
        />
        <use className="gi-anim gi-sp-d-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-d-lift"
          cx="50"
          cy="19"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* LEFT sweep */}
      <g className="gi-anim gi-sp-l" opacity="0">
        <rect
          className="gi-anim gi-sp-l-trail"
          x="50"
          y="14"
          width="34"
          height="10"
          rx="5"
          fill="url(#gi-sp-tr-l)"
        />
        <use className="gi-anim gi-sp-l-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-l-lift"
          cx="50"
          cy="19"
          r="9"
          fill="url(#gi-sp-tip-grad)"
        />
      </g>
      {/* UP sweep */}
      <g className="gi-anim gi-sp-u" opacity="0">
        <rect
          className="gi-anim gi-sp-u-trail"
          x="45"
          y="19"
          width="10"
          height="34"
          rx="5"
          fill="url(#gi-sp-tr-u)"
        />
        <use className="gi-anim gi-sp-u-lift" href="#gi-sp-hand" />
        <circle
          className="gi-anim gi-sp-u-lift"
          cx="50"
          cy="19"
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
 * the "never a broken slot" guarantee (ADR-0020) is upheld at compile time here, and the
 * absent-gesture text-only fallback is handled by the caller's `gesture !== undefined` gate.
 * The caller owns the accessible slot (`role="img"` + label); the SVG itself is `aria-hidden`.
 */
export function GestureIcon({ kind }: { readonly kind: GestureKind }): JSX.Element {
  const Icon = ICONS[kind];
  return <Icon />;
}
