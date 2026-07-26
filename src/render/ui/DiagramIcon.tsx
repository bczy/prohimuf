import type { CSSProperties, JSX } from "react";
import type { DiagramKind } from "@game/systems/narrativeSystem";
import { ringZoneColour } from "@render/scene/hostageCue";

/**
 * Animated MECHANIC diagrams for the tutorial (sibling of `GestureIcon`, which teaches control
 * gestures). A diagram teaches a game RULE, so it is not device-forked. The animated overlay
 * (ring / crosshair / flash) is code-drawn; the actors are the REAL in-game sprites, so the panel
 * reads as a snippet of the actual duel — no new asset generation.
 *
 * `hostage-ring` teaches the hostage-QTE spatial-colour reticle: a ring sweeps the captor and
 * changes colour by the anatomy under its centre — RED off-body (wasted), YELLOW on the torso or
 * a shoulder (partial — the `"limb"` zone of `ringZoneAt`, whose bands cover torso + both
 * shoulders), GREEN on the head (lethal) — so the lesson is "aligne, attends le vert, tire". The
 * three hues are pulled from `ringZoneColour` (the SAME map the in-game ring uses) so the tutorial
 * shows the true colours. The captor (`enemy_hostage.png`) and hostage (`hostage/girl.png`) sprites
 * sit on a dark "screen" inset (so the acid hues read on the light newsprint panel); the RING is
 * the one lit element (`la loi du glow`). `prefers-reduced-motion` freezes the ring on its
 * GREEN-on-the-head payoff frame (the panel text and the `diagramAlt` carry the full rule).
 *
 * Reduced-motion contract (AC9): `.di-anim` only kills the animation, so what stays on screen is
 * each element's PRESENTATION ATTRIBUTES. Every diagram therefore encodes ONE legible frozen frame
 * in those attributes — a single state of any two-state pair, never both overprinted, never an
 * `opacity="0"` actor that carries the lesson. A keyframe set that pins opacity at both 0% and 100%
 * fully overrides them, so the frozen frame costs the animated frame nothing.
 */

const BODY = "#0b0916"; // the dark "screen" inset ground
const CROSS = "#f2f2f2"; // the player's aim reticle — neutral, never a zone hue
const INK = "#e6e2f4";
const ACCENT = "#7fffd4";
const WARN = "#ffcf5a";

// The REAL in-game sprites (chroma-keyed cutouts): the captor holding the hostage as a
// shield, exactly as the QTE tableau draws them. BASE_URL-prefixed like every asset path.
const CAPTOR_SRC = `${import.meta.env.BASE_URL}assets/enemy_hostage.png`;
const GIRL_SRC = `${import.meta.env.BASE_URL}assets/hostage/girl.png`;
const BELLIARD_FACADE_SRC = `${import.meta.env.BASE_URL}assets/levels/belliard/facade.png`;
// The Commandant is the BOSS identity, not a riot trooper: the boss-finale panel draws the shipped
// `boss/commander_shielded.png` pose so the figure the tutorial announces is the figure the player
// meets at expiry.
const COMMANDANT_SRC = `${import.meta.env.BASE_URL}assets/boss/commander_shielded.png`;

// The true in-game reticle hues (single source of truth: the render-side colour map).
const GREEN = ringZoneColour("vital"); // head → lethal
const YELLOW = ringZoneColour("limb"); // "limb" zone = torso + shoulders → partial
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
  66%  { transform: translate(-28px,4px); stroke: ${RED};    }
  93%  { transform: translate(-28px,4px); stroke: ${RED};    }
  100% { transform: translate(0,0);        stroke: ${GREEN};  }
}
@keyframes di-flash {
  0%   { opacity: 0; transform: scale(.5); }
  6%   { opacity: .9; transform: scale(1); }
  22%  { opacity: 0; transform: scale(1.35); }
  100% { opacity: 0; transform: scale(1.35); }
}

.di-sr-bullet { animation: di-sr-bullet 1.6s linear infinite; transform-box: fill-box; transform-origin: center; }
.di-sr-warning { animation: di-sr-warning 1.6s ease-out infinite; transform-box: fill-box; transform-origin: center; }
@keyframes di-sr-bullet {
  0%   { transform: translateX(28px); opacity: 0; }
  12%  { opacity: 1; }
  88%  { opacity: 1; }
  100% { transform: translateX(-28px); opacity: 0; }
}
@keyframes di-sr-warning {
  0%   { opacity: 0; transform: scale(.5); }
  22%  { opacity: .8; transform: scale(1); }
  60%  { opacity: 0; transform: scale(1.28); }
  100% { opacity: 0; transform: scale(1.28); }
}

.di-wc-link-1 { animation: di-wc-link-1 2.1s ease-out infinite; }
.di-wc-link-2 { animation: di-wc-link-2 2.1s ease-out infinite; }
.di-wc-link-3 { animation: di-wc-link-3 2.1s ease-out infinite; }
@keyframes di-wc-link-1 { 0%,7%{opacity:.25} 28%,58%{opacity:1} 100%{opacity:.25} }
@keyframes di-wc-link-2 { 0%,36%{opacity:.25} 58%,80%{opacity:1} 100%{opacity:.25} }
/* link-3 closes the loop back down to .25 (like links 1-2) instead of ending lit — otherwise the
   restart snaps 1 → .25 and the chain pops every cycle. */
@keyframes di-wc-link-3 { 0%,63%{opacity:.25} 80%,92%{opacity:1} 100%{opacity:.25} }

.di-th-marker { animation: di-th-marker 3.2s ease-in-out infinite; }
@keyframes di-th-marker {
  0%,16%   { transform: translateY(0); opacity: 1; }
  21%,36%  { transform: translateY(16px); opacity: 1; }
  41%,56%  { transform: translateY(32px); opacity: 1; }
  61%,76%  { transform: translateY(48px); opacity: .75; }
  81%,96%  { transform: translateY(64px); opacity: .55; }
  100%     { transform: translateY(0); opacity: 1; }
}

.di-bf-before { animation: di-bf-before 3.2s step-end infinite; }
.di-bf-after  { animation: di-bf-after 3.2s step-end infinite; }
/* The two timer readouts are painted at the SAME anchor (x=33,y=68, same size, same
   textAnchor), so unlike the chrono box and the quota bar — where the .25/.32 residual
   correctly reads as "dimmed = deprecated" — they must not both be on screen at once: the
   residual would ghost "00:05" through "00:00" in amber-on-ink for the whole cycle. Their
   own keyframe pair drives the hidden phase to a hard 0. Same 3.2s/step-end timing and the
   same 38%/46% switch as the -before/-after pair, so the two states still flip together. */
.di-bf-timer-before { animation: di-bf-timer-before 3.2s step-end infinite; }
.di-bf-timer-after  { animation: di-bf-timer-after 3.2s step-end infinite; }
.di-bf-arrow  { animation: di-bf-arrow 3.2s ease-in-out infinite; }
.di-bf-flow   { animation: di-bf-flow 3.2s ease-in-out infinite; }
@keyframes di-bf-before { 0%,38%{opacity:1} 46%,100%{opacity:.25} }
@keyframes di-bf-after  { 0%,38%{opacity:.32} 46%,100%{opacity:1} }
@keyframes di-bf-timer-before { 0%,38%{opacity:1} 46%,100%{opacity:0} }
@keyframes di-bf-timer-after  { 0%,38%{opacity:0} 46%,100%{opacity:1} }
@keyframes di-bf-arrow  { 0%,38%{opacity:.25; transform:translateX(0)} 46%,84%{opacity:1; transform:translateX(4px)} 100%{opacity:.25; transform:translateX(0)} }
@keyframes di-bf-flow   { 0%,38%{stroke-dashoffset:18; opacity:.3} 46%,84%{stroke-dashoffset:0; opacity:.95} 100%{stroke-dashoffset:-18; opacity:.3} }

@media (prefers-reduced-motion: reduce) {
  .di-anim { animation: none !important; }
}
/* Second trigger (ADR-0054 §3): the in-app MOUVEMENT RÉDUIT toggle strengthens the OS block above. */
:root[data-reduced-motion="true"] .di-anim { animation: none !important; }
`;

/** The hostage-QTE colour-ring diagram. */
function HostageRingIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      style={ICON_SVG_STYLE}
      aria-hidden="true"
      data-diagram-kind="hostage-ring"
    >
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

      {/* Captor — the REAL in-game sprite (enemy_hostage.png), holding the hostage as a shield. */}
      <image
        href={CAPTOR_SRC}
        x="20"
        y="4"
        width="80"
        height="80"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />
      {/* Hostage — the REAL girl sprite, held front-right-lower over the captor (his shield). */}
      <image
        href={GIRL_SRC}
        x="52"
        y="40"
        width="54"
        height="54"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />

      {/* Player aim reticle — a fixed, neutral crosshair low on the tableau (never a zone hue). */}
      <g stroke={CROSS} strokeWidth="1.6" fill="none" opacity="0.9">
        <circle cx="60" cy="62" r="8" />
        <line x1="60" y1="51" x2="60" y2="58" />
        <line x1="60" y1="66" x2="60" y2="73" />
        <line x1="49" y1="62" x2="56" y2="62" />
        <line x1="64" y1="62" x2="71" y2="62" />
        <circle cx="60" cy="62" r="1.4" fill={CROSS} stroke="none" />
      </g>

      {/* Shot-flash on the GREEN (head) beat — the payoff. Base opacity 0 (reduced-motion: stays off). */}
      <circle
        className="di-anim di-flash"
        cx="60"
        cy="24"
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
        cy="24"
        r="13"
        fill="none"
        stroke={GREEN}
        strokeWidth="3.4"
      />
    </svg>
  );
}

function ShotReadPlayerVsEnemyBulletIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      style={ICON_SVG_STYLE}
      aria-hidden="true"
      data-diagram-kind="shot-read-player-vs-enemy-bullet"
    >
      <style>{DIAGRAM_STYLES}</style>
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
      <circle cx="28" cy="70" r="12" fill="none" stroke={INK} strokeWidth="1.8" />
      <line x1="28" y1="56" x2="28" y2="64" stroke={INK} strokeWidth="1.6" />
      <line x1="28" y1="76" x2="28" y2="84" stroke={INK} strokeWidth="1.6" />
      <line x1="14" y1="70" x2="22" y2="70" stroke={INK} strokeWidth="1.6" />
      <line x1="34" y1="70" x2="42" y2="70" stroke={INK} strokeWidth="1.6" />
      <path
        d="M84 76 l10 0 l0 -26 l-10 0 l0 8 l-9 5 l9 5 z"
        fill="none"
        stroke={INK}
        strokeWidth="2"
      />
      <line
        x1="39"
        y1="68"
        x2="82"
        y2="62"
        stroke={ACCENT}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Enemy round in flight + the danger ring closing on the player. The base attributes ARE
          the reduced-motion frozen frame (`.di-anim` kills the animation, presentation attributes
          then apply): the round sits mid-course at the travel midpoint (the animation swings it
          ±28px around that same midpoint, so the moving frame is byte-identical to before) and the
          ring is frozen on its `scale(1)/opacity .8` payoff beat. Motion off, the lesson "leurs
          balles voyagent — esquive" still has a picture. */}
      <circle className="di-anim di-sr-bullet" cx="68" cy="63" r="3.2" fill={WARN} opacity="1" />
      <circle
        className="di-anim di-sr-warning"
        cx="28"
        cy="70"
        r="20"
        fill="none"
        stroke={WARN}
        strokeWidth="1.8"
        opacity="0.8"
      />
    </svg>
  );
}

function WeaponCrateLoopIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      style={ICON_SVG_STYLE}
      aria-hidden="true"
      data-diagram-kind="weapon-crate-loop"
    >
      <style>{DIAGRAM_STYLES}</style>
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
      <rect x="18" y="58" width="28" height="28" rx="3" fill="none" stroke={INK} strokeWidth="2" />
      <line x1="18" y1="69" x2="46" y2="69" stroke={INK} strokeWidth="1.4" />
      <line x1="32" y1="58" x2="32" y2="86" stroke={INK} strokeWidth="1.4" />
      <rect x="68" y="30" width="28" height="10" rx="2" fill="none" stroke={INK} strokeWidth="2" />
      <line x1="76" y1="30" x2="76" y2="22" stroke={INK} strokeWidth="1.6" />
      <line x1="62" y1="86" x2="96" y2="86" stroke={INK} strokeWidth="2" />
      <path
        d="M70 80 C74 74 84 74 88 80 C92 86 102 86 106 80"
        fill="none"
        stroke={INK}
        strokeWidth="1.6"
      />
      <line
        x1="46"
        y1="63"
        x2="68"
        y2="39"
        stroke={ACCENT}
        strokeWidth="2.2"
        strokeLinecap="round"
        className="di-anim di-wc-link-1"
      />
      <line
        x1="82"
        y1="40"
        x2="82"
        y2="76"
        stroke={ACCENT}
        strokeWidth="2.2"
        strokeLinecap="round"
        className="di-anim di-wc-link-2"
      />
      <line
        x1="62"
        y1="86"
        x2="40"
        y2="82"
        stroke={ACCENT}
        strokeWidth="2.2"
        strokeLinecap="round"
        className="di-anim di-wc-link-3"
      />
    </svg>
  );
}

function ThreatHierarchyLadderIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      style={ICON_SVG_STYLE}
      aria-hidden="true"
      data-diagram-kind="threat-hierarchy-ladder"
    >
      <style>{DIAGRAM_STYLES}</style>
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
      <line x1="22" y1="30" x2="22" y2="94" stroke={INK} strokeWidth="1.6" opacity="0.7" />
      <rect x="26" y="22" width="72" height="10" rx="2" fill={WARN} fillOpacity="0.5" />
      <rect x="26" y="38" width="58" height="10" rx="2" fill={INK} fillOpacity="0.6" />
      <rect x="26" y="54" width="44" height="10" rx="2" fill={INK} fillOpacity="0.5" />
      <rect x="26" y="70" width="30" height="10" rx="2" fill={INK} fillOpacity="0.4" />
      <rect x="26" y="86" width="20" height="10" rx="2" fill={INK} fillOpacity="0.28" />
      <rect
        className="di-anim di-th-marker"
        x="14"
        y="24"
        width="6"
        height="6"
        rx="1.5"
        fill={ACCENT}
      />
    </svg>
  );
}

function BossFinaleSwitchIcon(): JSX.Element {
  return (
    <svg
      viewBox="0 0 120 120"
      style={ICON_SVG_STYLE}
      aria-hidden="true"
      data-diagram-kind="boss-finale-switch"
    >
      <style>{DIAGRAM_STYLES}</style>
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
      <rect
        x="14"
        y="16"
        width="92"
        height="28"
        rx="3"
        fill="#100d20"
        stroke="#1b172a"
        strokeWidth="1.4"
      />
      <image
        href={BELLIARD_FACADE_SRC}
        x="14"
        y="16"
        width="92"
        height="28"
        preserveAspectRatio="xMidYMid slice"
        style={{ imageRendering: "pixelated", opacity: 0.7 }}
      />
      <rect
        className="di-anim di-bf-after"
        x="80"
        y="22"
        width="20"
        height="18"
        rx="2.5"
        fill="none"
        stroke={WARN}
        strokeWidth="1.5"
      />
      <image
        className="di-anim di-bf-after"
        href={COMMANDANT_SRC}
        x="77"
        y="21"
        width="24"
        height="24"
        preserveAspectRatio="xMidYMid meet"
        style={{ imageRendering: "pixelated" }}
      />
      {/* BEFORE state (chrono still running). Its base attributes ARE the reduced-motion frozen
          frame, and that frame is the AFTER beat — the one the panel teaches: the chrono box and
          the quota bar stay at the .25 the animation dims them to, while the "00:05" digits go to
          a hard 0 so they never overprint the WARN "00:00" painted at the same x=33,y=68. The two
          digit nodes carry `di-bf-timer-*` rather than the group's `di-bf-*` for the same reason
          under motion ON: their hidden phase reaches a hard 0, the box/bar keep the .25 residual.
          Either way the animation fully overrides these presentation attributes — every
          `di-bf-*` keyframe set pins opacity at both 0% and 100%. */}
      <g
        className="di-anim di-bf-before"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.25"
      >
        <rect x="16" y="55" width="34" height="16" rx="3" fill="none" />
        <line x1="22" y1="62" x2="44" y2="62" />
      </g>
      <text
        className="di-anim di-bf-timer-before"
        x="33"
        y="68"
        fill={INK}
        fontSize="7.6"
        textAnchor="middle"
        fontFamily="monospace"
        opacity="0"
      >
        00:05
      </text>
      <text
        className="di-anim di-bf-timer-after"
        x="33"
        y="68"
        fill={WARN}
        fontSize="7.6"
        textAnchor="middle"
        fontFamily="monospace"
      >
        00:00
      </text>
      <g
        className="di-anim di-bf-before"
        stroke={INK}
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.25"
      >
        <rect x="16" y="78" width="34" height="12" rx="2.5" />
        <line x1="21" y1="84" x2="45" y2="84" />
      </g>
      <g
        className="di-anim di-bf-after"
        stroke={WARN}
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.94"
      >
        <line x1="18" y1="80" x2="48" y2="88" />
        <line x1="48" y1="80" x2="18" y2="88" />
      </g>
      <path
        className="di-anim di-bf-flow"
        d="M54 64 C63 61 70 55 76 45"
        fill="none"
        stroke={WARN}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="6 6"
      />
      <g
        className="di-anim di-bf-arrow"
        fill="none"
        stroke={WARN}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="56" y1="62" x2="72" y2="50" />
        <path d="M67 49 l5 1 l-1 5" />
      </g>
      <g className="di-anim di-bf-after" opacity="0.95">
        <circle cx="92" cy="58" r="8.5" fill="none" stroke={WARN} strokeWidth="1.7" />
        <text x="92" y="61" fill={WARN} fontSize="9" textAnchor="middle" fontWeight="700">
          !
        </text>
      </g>
    </svg>
  );
}

const DIAGRAMS: Record<DiagramKind, () => JSX.Element> = {
  "shot-read-player-vs-enemy-bullet": ShotReadPlayerVsEnemyBulletIcon,
  "weapon-crate-loop": WeaponCrateLoopIcon,
  "threat-hierarchy-ladder": ThreatHierarchyLadderIcon,
  "boss-finale-switch": BossFinaleSwitchIcon,
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
