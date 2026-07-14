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
 * finger(s) traced as a single outline) so nothing reads as a stray "paperclip" shape. Fingers
 * point up; the wrist runs off the bottom edge so the hand dominates the frame. Fingertips sit
 * near y≈31 (index tip x≈52 for one-finger, midpoint x≈59 for two). Draw with fill=BODY +
 * INK stroke, matching the mouse icon's line-art weight.
 */
// Back-of-hand, index + middle extended PARALLEL side by side (thin separation, no V-spread),
// ring/pinky/thumb folded into a tall palm/fist (two-finger tap).
const HAND_TWO_FINGER =
  "M42 120 L39 98 C37 90 36 84 38 78 C32 77 30 72 33 67 C35 63 39 61 44 59 " +
  "L47 47 L48 33 A5 5 0 0 1 58 33 L58 44 C59 47 59 47 60 44 L60 33 " +
  "A5 5 0 0 1 70 33 L71 49 C79 48 86 52 86 62 C87 79 85 95 81 106 L79 120 Z";
// Same fist with ONLY the index extended, the other fingers folded into the knuckle mass (swipe).
const HAND_ONE_FINGER =
  "M42 120 L39 98 C37 90 36 84 38 78 C32 77 30 72 33 67 C35 63 39 62 43 60 " +
  "L46 46 L47 34 A6 6 0 0 1 59 34 L60 54 C68 53 78 55 84 58 C87 62 87 66 86 70 " +
  "C87 82 85 96 81 106 L79 120 Z";

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

.gi-sp-h       { animation: gi-sp-h 4s ease-out infinite; }
.gi-sp-h-hand  { animation: gi-sp-h-hand 4s ease-out infinite; }
.gi-sp-h-tip   { animation: gi-sp-h-tip 4s linear infinite; }
.gi-sp-h-trail { animation: gi-sp-h-trail 4s ease-out infinite; }
.gi-sp-v       { animation: gi-sp-v 4s ease-out infinite; }
.gi-sp-v-hand  { animation: gi-sp-v-hand 4s ease-out infinite; }
.gi-sp-v-tip   { animation: gi-sp-v-tip 4s linear infinite; }
.gi-sp-v-trail { animation: gi-sp-v-trail 4s ease-out infinite; }
@keyframes gi-sp-h-hand { 0%{opacity:1} 14%{opacity:1} 22%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-v-hand { 0%{opacity:0} 50%{opacity:1} 64%{opacity:1} 72%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-h { 0%{transform:translate(-34px,0);opacity:1} 12%{transform:translate(6px,0);opacity:1} 28%{transform:translate(30px,0);opacity:1} 46%{transform:translate(30px,0);opacity:1} 50%{transform:translate(30px,0);opacity:0} 98%{transform:translate(-34px,0);opacity:0} 100%{transform:translate(-34px,0);opacity:1} }
@keyframes gi-sp-h-tip { 0%{opacity:1} 10%{opacity:1} 15%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-h-trail { 0%{opacity:.95} 28%{opacity:.95} 40%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-v { 0%{transform:translate(0,-34px);opacity:0} 48%{transform:translate(0,-34px);opacity:0} 50%{transform:translate(0,-34px);opacity:1} 62%{transform:translate(0,6px);opacity:1} 78%{transform:translate(0,30px);opacity:1} 96%{transform:translate(0,30px);opacity:1} 100%{transform:translate(0,30px);opacity:0} }
@keyframes gi-sp-v-tip { 0%{opacity:0} 50%{opacity:1} 60%{opacity:1} 65%{opacity:0} 100%{opacity:0} }
@keyframes gi-sp-v-trail { 0%{opacity:0} 50%{opacity:.95} 78%{opacity:.95} 90%{opacity:0} 100%{opacity:0} }

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
      <path d="M60 30 C60 18 70 14 80 12" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <rect x="40" y="30" width="40" height="62" rx="20" fill={BODY} stroke={INK} strokeWidth="2.5" />
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
        <ellipse className="gi-anim gi-mc-halo" cx="50" cy="41" rx="19" ry="16" fill="url(#gi-mc-halo-grad)" opacity="0.4" />
        <path d="M59 31 H47 A17 17 0 0 0 41 43 V50 H59 Z" fill={NEON} fillOpacity="0.14" stroke={NEON} strokeWidth="2" />
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
      <rect x="10" y="20" width="100" height="80" rx="5" fill={BODY} stroke={INK} strokeWidth="2.5" />
      {/* edge bands: bright at the edge, falloff INWARD to 0 */}
      <rect className="gi-anim gi-es-glow-r" x="90" y="22" width="18" height="76" fill="url(#gi-es-gr)" opacity="0.4" />
      <rect className="gi-anim gi-es-glow-l" x="12" y="22" width="18" height="76" fill="url(#gi-es-gl)" opacity="0.4" />
      {/* chevrons marching outward with the pan */}
      <g className="gi-anim gi-es-chev-r" opacity="0">
        <path d="M92 52 l6 8 l-6 8" fill="none" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 52 l6 8 l-6 8" fill="none" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      </g>
      <g className="gi-anim gi-es-chev-l" opacity="0">
        <path d="M28 52 l-6 8 l6 8" fill="none" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 52 l-6 8 l6 8" fill="none" stroke={NEON} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      </g>
      {/* cursor pushed flat against the edge (inert arrow) */}
      <g className="gi-anim gi-es-cursor">
        <path d="M60 48 v22 l5 -5 l4 8 l4 -2 l-4 -8 l7 0 z" fill={INK} stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
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
      <rect x="20" y="10" width="80" height="104" rx="10" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.28" />
      {/* single ripple from the midpoint between the two fingertips */}
      <circle
        className="gi-anim gi-tt-ripple"
        cx="59"
        cy="32"
        r="13"
        fill="none"
        stroke={NEON}
        strokeWidth="2"
        opacity="0"
      />
      {/* the hand dips to touch, lifts, long rest; both fingertip halos share ONE class → sync flash */}
      <g className="gi-anim gi-tt-lift">
        {/* single continuous silhouette (fist + two extended fingers) */}
        <path d={HAND_TWO_FINGER} fill={BODY} stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {/* interior line-art detail: knuckle line + folded-finger tops + thumb crease */}
        <path d="M44 61 C56 57 72 58 84 63" fill="none" stroke={INK} strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />
        <path d="M78 55 C79 60 79 64 78 68" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        <path d="M34 69 C38 72 40 76 40 80" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        {/* both fingertip halos — the only lit elements */}
        <circle className="gi-anim gi-tt-halo" cx="53" cy="32" r="9.5" fill="url(#gi-tt-halo-grad)" opacity="0.85" />
        <circle className="gi-anim gi-tt-halo" cx="65" cy="32" r="9.5" fill="url(#gi-tt-halo-grad)" opacity="0.85" />
      </g>
    </svg>
  );
}

/**
 * Mobile — ONE finger swipes to pan, trail keeps gliding (inertia) (§1.4).
 * Same hand vocabulary with ONLY the index extended; the hand sweeps across, the fingertip
 * trails an alpha-falloff motion trail (bright at tip → 0 at tail), the hand lifts mid-travel
 * and the trail glides to an eased stop (flick inertia). Direction cycles horizontal → vertical.
 */
function SwipePanIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 120 120" style={ICON_SVG_STYLE} aria-hidden="true">
      <style>{GESTURE_STYLES}</style>
      <defs>
        <linearGradient id="gi-sp-trail-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="gi-sp-trail-v" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={NEON} stopOpacity="0" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="gi-sp-tip-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={NEON} stopOpacity="1" />
          <stop offset="60%" stopColor={NEON} stopOpacity="0.35" />
          <stop offset="100%" stopColor={NEON} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* phone frame: thin, low-contrast background context — never glows */}
      <rect x="14" y="12" width="92" height="100" rx="10" fill="none" stroke={INK} strokeWidth="1.4" opacity="0.28" />
      {/* horizontal sweep: hand lifts mid-travel; fingertip + motion trail keep gliding (inertia) */}
      <g className="gi-anim gi-sp-h">
        <g className="gi-anim gi-sp-h-hand">
          {/* single continuous silhouette (fist + one extended index) */}
          <path d={HAND_ONE_FINGER} fill={BODY} stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M47 55 C58 51 74 53 84 60" fill="none" stroke={INK} strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />
          <path d="M63 54 C64 58 64 61 63 64" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
          <path d="M72 55 C73 59 73 62 72 65" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
          <path d="M34 69 C38 72 40 76 40 80" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        </g>
        <rect className="gi-anim gi-sp-h-trail" x="19" y="26" width="34" height="10" rx="5" fill="url(#gi-sp-trail-h)" />
        <circle className="gi-anim gi-sp-h-tip" cx="53" cy="31" r="9" fill="url(#gi-sp-tip-grad)" />
      </g>
      {/* vertical sweep (second half of the cycle → conveys pan in the other axis) */}
      <g className="gi-anim gi-sp-v" opacity="0">
        <g className="gi-anim gi-sp-v-hand">
          <path d={HAND_ONE_FINGER} fill={BODY} stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M47 55 C58 51 74 53 84 60" fill="none" stroke={INK} strokeWidth="1.8" opacity="0.55" strokeLinecap="round" />
          <path d="M63 54 C64 58 64 61 63 64" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
          <path d="M72 55 C73 59 73 62 72 65" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
          <path d="M34 69 C38 72 40 76 40 80" fill="none" stroke={INK} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" />
        </g>
        <rect className="gi-anim gi-sp-v-trail" x="48" y="-3" width="10" height="34" rx="5" fill="url(#gi-sp-trail-v)" />
        <circle className="gi-anim gi-sp-v-tip" cx="53" cy="31" r="9" fill="url(#gi-sp-tip-grad)" />
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
