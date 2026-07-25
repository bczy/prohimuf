import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, RingGeometry } from "three";
import type { Mesh, MeshBasicMaterial, OrthographicCamera, Texture } from "three";
import type { GameState } from "@game/types/gameState";
import {
  BOSS_DECOR_CATCH_HALF_H,
  BOSS_DECOR_CATCH_HALF_W,
  BOSS_PARRY_POINT,
  BOSS_SHIELD_POINT,
  BOSS_VITAL_CATCH_RADIUS,
  BOSS_VITAL_WANDER_CENTRE,
  BOSS_WANDER_CENTRE,
  bossShieldPointLive,
  isBossQteActive,
  phaseIndexAt,
  PHASE_BREAK_SECONDS,
  RING_HIT_RADIUS,
} from "@game/systems/bossQteSystem";
import { detectMobile } from "@utils/platform";
import { resolveEnemyTexture, getSilhouetteFor } from "./enemyTextures";
import type { ResolvedEnemyTexture } from "./enemyTextures";
import { getBossPoseTexture, getBossDecorTexture } from "./bossTextures";
import type { BossPose } from "./bossTextures";
import { createSmokeField } from "./smokeParticles";
import { AURA_HIDDEN, createEntityAura } from "@render/effects/entityAura";
import { clamp01, lerpHex, ringZoneColour, ringZoneEmphasis } from "./hostageCue";
import type { HudBossQte } from "@render/ui/HUD";

// The boss QTE tableau — "le Commandant" (ADR-0051, differentiation pack ADR-0052). A
// cinematic duel drawn at the STATIC `qte.anchor` the camera zooms onto and holds. This
// is the RENDER of the pure `bossQteSystem` state: it reads state and maps it to poses /
// ring colour / telegraph forms / screen washes — it decides no rule (boundary law).
//
// ADR-0052 adds five differentiation LEVERS, all rendered here as procedural / placeholder
// visuals (no new art assets this story — architect call, §7 art-lane deferral):
//   L1 points faibles multiples — a second (limb) ring in phases 2+, form-not-colour read.
//   L3 parade — a form-distinct parry telegraph at the raised sidearm + stagger/whiff reads.
//   L2 décor interactif — a placeholder prop with a real dégradé glow-halo while armed + a
//      drifting particle SMOKE FIELD (`smokeParticles.ts`, Bertrand order §17).
//   L4 renfort — frame-edge silhouette pressure (motion only, no shootable body).
//   L5 coup de grâce — a FINISHER read distinct from the passive QTE_RESULT_HOLD breather,
//      « LIVRE LE SON » prompt, one ceremonial click cue. B&W + acid-neon only (no warm wash).
// Every animated read carries its `prefers-reduced-motion` branch (UX D2.7/D3.1).
//
// The canon Commandant poses (`assets/boss/commander_*.png`, ADR-0053) are wired in via the
// `bossTextures` loader: the CURRENT boss state maps to a pose (see the `bossPose` decode at the
// boss draw), resolved through that cache. The riot-cop sprite (`enemy_riot`) is kept ONLY as a
// graceful fallback — until a given PNG has loaded (or if one is missing) `resolveBossTexture`
// degrades to the cop rather than drawing nothing. The SHIELD-COVER prop art
// (shield_cover_raised/lowered) is still PENDING generation, so `resolveShieldCoverTexture` stays a
// wired-ready null (the prop keeps its grey placeholder) — a pure data swap at that seam later.

// The commander plane — a SQUARE plane (the fallback sprite is figure-centred), a touch
// larger than the captor (2.0) for his dominant stature.
const BOSS_W = 2.2;
const BOSS_H = 2.2;
const BOSS_Z = 0.5;

// The reticle RING that FRAMES a wandering weak-point (spatial-colour model, reused from the
// hostage duel). The drawn ring IS the scored catch zone (aim-honesty — "click inside the drawn
// ring = hit" must stay literally true). AMENDMENT A1 §4 (gated 2026-07-20) makes the two L1 rings
// carry DIFFERENT catch radii: the VITAL ring (A) is tighter — drawn at `BOSS_VITAL_CATCH_RADIUS`
// (0.11, tightened by A1-R2) so a fixed head-camp can't answer the whole vital path; the value
// flows from the imported constant, so drawn == catch tracks any re-tune. The LIMB ring (B), the parry
// glyph, the décor prop and the phase-1 single ring all keep `RING_HIT_RADIUS` (0.30). The two
// rings also read apart by ANATOMY POSITION (head vs torso) + EMPHASIS brightness, never colour
// alone.
const RING_Z = 0.55;
const RING_INNER = 0.78;
// A BOLDER stroke on the VITAL ring only (§21 do-anyway): its tiny 0.11 drawn radius needs a
// heavier annulus to stay perceivable at the boss zoom. Inner hole narrows (0.78 → 0.55) while
// `RING_OUTER` stays 1.0, so the drawn OUTER edge = catch radius (0.11) aim-honesty is inviolate.
// Applied to the vital ring's own geometry ONLY (live + split-preview); the limb ring keeps 0.78.
const RING_INNER_VITAL = 0.55;
const RING_OUTER = 1.0;
const RING_SEGMENTS = 40;
const RING_OPACITY_MAX = 0.5;

// The screen-level phase-break PULSE (ADR-0051 D5, UX §2.1): a brief, one-shot, non-diegetic
// wash at the ONSET of every phase break. Cool white, disjoint from the alarm-red LOST strobe,
// the green WON tint, and the monochrome FINISHER treatment so each event reads as itself.
const PULSE_Z = 5;
const PULSE_MS = 500;
const PULSE_PEAK = 0.5;
const PULSE_COLOUR = "#eaf6ff";

// Per-hit reaction (UX D1.2): a brief recoil + whiten when a ring chip lands. Keyed off
// `bossHp` DROPPING — a miss / off-ring (0-damage) shot never fires it.
const HIT_MS = 160;
const HIT_RECOIL = 0.16;

// Per-phase posture escalation (UX D1.1) — PROVISIONAL on the fallback sprite (distinct
// posture sprites deferred to the Niveau-Final story). A modest ordered stand-in: the
// commander hunches progressively lower each phase.
const POSTURE_HUNCH_STEP = 0.09;

// The re-arming "brace" during a phase break (UX D2.4). Under motion a single dip-and-rise;
// under reduced motion a held braced-lower posture (a static step, never a strobe).
const BRACE_DIP = 0.2;
const BRACE_STATIC = 0.12;

// Reinforcing tints (colour is never the sole channel — pose/motion/ring/marker carry the
// reads; tint only reinforces).
const SHIELDED_TINT = "#9fb8cc";
const TELL_TINT = "#ffd27a";
const EXPOSED_TINT = "#ff6a4d";
const BREAK_TINT = "#bfe3ff";
const WON_TINT = "#7dffb0";
const ALARM = "#ff1e2d";
const WHITE = "#ffffff";

// L3 parry (parade) — reinforcing tints for a beat carried by the parry MARKER's distinct FORM
// (a diamond guard glyph vs. the open shoot ring) and by the boss's raised-weapon pose. Steel
// wind-up warming to an alarm-amber when the parry window is live; a cold "reeling" cue during
// the stagger; a heavier alarm on a whiffed charged shot.
const PARRY_WINDUP_TINT = "#8fd0e0";
const PARRY_OPEN_TINT = "#ffb454";
const STAGGER_TINT = "#c9f0ff";
const WHIFF_TINT = "#ff3b30";
const PARRY_Z = 0.56;
// A filled diamond guard glyph sized off the parry catch radius (RING_HIT_RADIUS). The rotated
// diamond sits WITHIN that catch zone (drawn ⊂ catch — its corners fall short of the hit radius),
// so no drawn pixel lies outside a scored click; parry vs. shoot still reads by FORM.
const PARRY_SIZE = RING_HIT_RADIUS * 1.15;
const PARRY_WHIFF_MS = 220;
// Phase-3 parry windows and the smoke veil are the SAME condition by construction (shard §12/§15):
// the tinted glyph washed out against the veil + the boss shoulder art. Fix (gated stage-5): a
// paper-white value-contrast halo (house value language) drawn just behind the glyph, both ABOVE
// the smoke veil's renderOrder so the tell survives — while an opacity envelope tied to the smoke
// keeps it "degraded, never removed" (the 2-C discipline). The diamond FORM stays distinct from
// the open shoot ring.
const PARRY_HALO_SIZE = PARRY_SIZE * 1.4;
const PARRY_HALO_TINT = "#ffffff";
const PARRY_SMOKE_DEGRADE = 0.4; // at full smoke the glyph dims to 0.6× — a legibility floor, present

// L2 décor — a procedural PLACEHOLDER prop (no FLUX asset this story). The prop stays a DIM GREY
// placeholder at all times (B&W layer); the "armed / shootable" read is a separate acid GLOW-HALO
// with a genuine radial DÉGRADÉ (alpha falls monotonically to 0 at the rim — « un halo est un
// dégradé, jamais un aplat », composite-gate §2.1 fix). The lime never becomes a flat fill.
const DECOR_Z = 0.45;
// AMENDMENT A2 §2 (gated 2026-07-20): the drawn prop plane IS the scored catch zone — the SHIELDED
// décor branch scores an anchor-relative AABB of half-extents `BOSS_DECOR_CATCH_HALF_W/H`, so every
// drawn pixel is clickable and nothing beyond it (drawn == catch, glow 2.2 is an attention cue, not
// the catch). Derived from the game-side source of truth so the two stay locked structurally and
// track any future catch re-tune — exactly as the vital ring draws at `BOSS_VITAL_CATCH_RADIUS`.
// Today 2×0.40 × 2×0.525 == 0.80 × 1.05: identical output, zero pixel change (art-preserving).
const DECOR_W = 2 * BOSS_DECOR_CATCH_HALF_W;
const DECOR_H = 2 * BOSS_DECOR_CATCH_HALF_H;
const DECOR_INERT_TINT = "#6b7580";
const DECOR_ARMED_TINT = "#c6ff5a"; // acid glow = interactive (bible's glow law) — HALO only, dégradé
const DECOR_GLOW_Z = 0.44; // just behind the prop, so the halo dégradé wraps it
const DECOR_GLOW_SIZE = 1.5; // the halo reaches past the prop (dégradé) but stays contained at the boss zoom

// L2 smoke — a real drifting PARTICLE FIELD (`smokeParticles.ts`), Bertrand direct order §17
// (supersedes the gpu 4-quad-veil constraint; Ben re-verdicts in parallel). Device-tiered count
// (like CRT lite), one CC0 texture fetch, desaturated NORMAL blend, world layer 0 (rides the CRT
// pass for free — no new RT/pass), renderOrder below the parry halo/glyph. Reduced-motion freezes
// it to a scattered static arrangement. The count caps are the self-imposed bounds pending Ben.
const SMOKE_MAX_DESKTOP = 64;
const SMOKE_MAX_MOBILE = 32;
// Veil envelope ramp RATE (per second), applied via frame-rate-independent exponential smoothing
// (`1 - exp(-k·dt)`) so the veil ramps in at the same wall-clock feel at any fps — the gating
// capture runs at ~2 fps, where a fixed per-frame lerp would take tens of seconds. k reproduces the
// prior 0.06-per-frame feel at 60 fps: 1 - exp(-k/60) == 0.06 ⇒ k = -60·ln(0.94) ≈ 3.7.
const SMOKE_FADE_K = 3.7;

// L4 renfort — frame-edge silhouette PRESSURE (a lost CRS section, "pas ses hommes"). Motion
// only, NO shootable body, NO travelling bullet. Reuses the shipped `enemy_riot` silhouette,
// dark/desaturated, hugging the frame edges partially off-screen. Under reduced motion the sway
// is dropped for a held presence read (never a strobe).
const RENFORT_QUADS = 4;
const RENFORT_Z = 0.3; // behind the tableau actors — background chaos at the edges
const RENFORT_TINT = "#2f353b";
const RENFORT_PEAK_ALPHA = 0.55;
// Edge-pressure envelope ramp RATE (per second), same exponential smoothing as SMOKE_FADE_K.
// k reproduces the prior 0.08-per-frame feel at 60 fps: 1 - exp(-k/60) == 0.08 ⇒ k = -60·ln(0.92) ≈ 5.0.
const RENFORT_FADE_K = 5.0;

// L6 shield-break (cran de sûreté) — a SEPARATE riot-shield COVER PROP the Commandant hunkers
// behind (spec-boss-shield-break-tempo-shot §6-A/6-C, spec-boss-belliard-fiction §2). Canon lead-art
// ruling: the Commandant is bare-headed with NOTHING shootable on his body — so the shield is a
// standalone object beside him, NOT armour. Two mutually-exclusive reads driven by
// `bossShieldPointLive(qte)`: RAISED/intact (SHIELDED, un-shootable) ↔ LOWERED/vulnerable (phase-2+
// normal EXPOSED window, presenting the FIXED hit point on its low, street-side edge). It rides in
// FRONT of the boss (higher z than his plane — he shelters behind it) but under the rings.
//
// The canon prop art is NOT generated yet: levelArt.json `boss.types.shield_cover_raised` /
// `shield_cover_lowered` are `pending:true` with EMPTY prompts (skipped by gen-boss-sprites.mjs). So
// the prop is a procedural DIM-GREY placeholder rectangle (B&W layer, value only), a touch of tilt on
// the lowered read to sell "dropped". Swapping in the real textures is a ONE-SPOT change at the
// `resolveShieldCoverTexture` seam below (mirrors the `resolveBossTexture` fallback swap).
const SHIELD_PROP_Z = 0.6; // in front of the boss — he crouches BEHIND the cover
const SHIELD_PROP_X = 0.45; // boss's screen-right, aligned with BOSS_SHIELD_POINT.x (0.4)
const SHIELD_RAISED_Y = 0.1;
const SHIELD_RAISED_W = 0.72;
const SHIELD_RAISED_H = 1.55; // stood upright as cover — hides the boss's low body/right side
const SHIELD_LOWERED_Y = -0.42;
const SHIELD_LOWERED_W = 0.8;
const SHIELD_LOWERED_H = 0.62; // dropped low — only the exposed street-side edge remains
const SHIELD_LOWERED_TILT = -0.18; // radians — a slight cant to read "knocked down to fire"
// The FIXED hit-point MARKER — a target-LOCK reticle (fixed crosshair-in-circle), categorically
// distinct in FORM from the two WANDERING ring annuli (lever 1) and the parry DIAMOND (lever 3): it
// is the fixed, "easy" vertex of the vital/limb/shield triangle. Drawn at EXACTLY `RING_HIT_RADIUS`
// (the plane spans 2·RING_HIT_RADIUS, the reticle's outer circle sits on the rim) so drawn == catch —
// the aim-honesty invariant, mirroring how the rings are drawn.
const SHIELD_MARKER_Z = 0.62; // above the prop + rings so the lock reads on the lowered edge
const SHIELD_MARKER_TINT = "#4fd6ff"; // electric-cyan lock — not vital-green nor limb-yellow

// L5 finisher (coup de grâce) — a ceremonial post-combat beat (boss at 0 HP). Kept STRICTLY inside
// the B&W + acid-neon identity (composite-gate colour-law fix — the old sepia wash added a warm
// R−B cast to world pixels, off the cold-xerox look). The treatment is now MONOCHROME on the world:
// a brief WHITE inverted flash at onset + a held BLACK vignette value-crush that focuses the frame
// on the downed boss. Colour lives ONLY on the acid-neon « LIVRE LE SON » prompt (the game's neon
// language). Distinct from the cool-white pulse / green WON / red LOST and from the passive
// QTE_RESULT_HOLD breather (the prompt's presence = "this beat wants input", UX D3.2). Resolves on
// ANY `fire` (game 5-B) → the whole frame is the click zone (44px floor trivially met, UX D3.6/A10).
const FINISHER_ONSET_MS = 600;
const FINISHER_FLASH_PEAK = 0.5; // white inverted flash at onset (a VALUE, no hue)
const FINISHER_VIGNETTE_PEAK = 0.5; // black edge value-crush held for the beat (a VALUE, no hue)
const FINISHER_KNEEL = 0.35; // the commander drops to a defeated posture
const FINISHER_DEFEAT_TINT = "#7d8791"; // desaturated, down-but-not-finished
const FINISHER_PROMPT_TEXT = "LIVRE LE SON"; // canonical copy (NOT "ACHEVER" — narrative §3.3)
const FINISHER_PROMPT_TINT = "#39ff14"; // acid-neon green (the only colour allowed on the B&W world)
const FINISHER_PROMPT_DY = 1.25; // below the boss, in the tableau (diegetic, not a HUD chip)
const FINISHER_PROMPT_W = 2.0;
const FINISHER_PROMPT_H = 0.5;
const FINISHER_PROMPT_Z = 0.8;

// Poses that read as "gun up / mid-action" — used to pick the riot cop's SHOOTING frame when we
// fall back (so the fallback silhouette still roughly matches the beat).
const FIRING_POSES: ReadonlySet<BossPose> = new Set<BossPose>([
  "exposed",
  "weakpoint",
  "parry_windup",
]);

/**
 * State→pose→texture indirection (mirrors HostageQteSprite's texture seam). The CURRENT boss state
 * is decoded to a canon `BossPose` by the caller (the `bossPose` block); this resolves that pose to
 * the real `commander_<pose>.png` via the `bossTextures` cache, and gracefully falls back to the
 * riot cop (shooting frame for a gun-up pose, idle otherwise) while the PNG is still loading or if
 * it is missing — the figure is never invisible.
 */
function resolveBossTexture(pose: BossPose): ResolvedEnemyTexture | null {
  const canon = getBossPoseTexture(pose);
  if (canon !== null) return { texture: canon, frame: null };
  return resolveEnemyTexture("riot", 1, FIRING_POSES.has(pose), 1);
}

/** The idle riot-cop silhouette reused for the L4 frame-edge renfort pressure (motion only). */
function resolveRenfortTexture(): ResolvedEnemyTexture | null {
  return resolveEnemyTexture("riot", 1, false, 1);
}

/**
 * A soft radial GLOW-HALO baked once (white core, alpha falling MONOTONICALLY to 0 at the rim).
 * Tinted at runtime (acid for the armed décor prop). This is the genuine dégradé the composite gate
 * §2.1 requires — a halo, never an aplat. `null` under SSR / test (no 2D canvas).
 */
function buildRadialGlowTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)"); // → 0 at the rim (measurable falloff)
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/**
 * A monochrome VIGNETTE baked once: fully clear at the centre, ramping to opaque BLACK at the edges
 * (alpha rising monotonically outward). Used as the finisher's value-crush — a VALUE change only,
 * no hue on world pixels (composite-gate colour-law fix). `null` under SSR / test.
 */
function buildVignetteTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, size, size);
  const g = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.2,
    size / 2,
    size / 2,
    size * 0.72,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

/**
 * The « LIVRE LE SON » finisher prompt baked into a CanvasTexture (a stamp-style caption). The
 * prompt is REINFORCEMENT only (UX D3.3): the wash + click-cue pulse + defeated pose carry
 * "input expected now" without reading the text. `null` under SSR / test (no 2D canvas).
 */
function buildPromptTexture(text: string): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const w = 512;
  const h = 128;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, w, h);
  ctx.font = "700 64px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(text, w / 2, h / 2 + 4);
  return new CanvasTexture(canvas);
}

/**
 * The FIXED shield-point target-LOCK reticle baked once (white, tinted at runtime). A crosshair-in-
 * circle: the outer circle's OUTER edge sits at the canvas rim so, on a plane spanning
 * 2·RING_HIT_RADIUS, the drawn circle == the scored catch disc (aim honesty — drawn == catch). The
 * static centre cross + dot is the "locked, non-wandering" read that sets it apart from the two
 * wandering ring annuli. `null` under SSR / test (no 2D canvas).
 */
function buildShieldReticleTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, size, size);
  const c = size / 2;
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  // Outer circle — outer edge on the canvas rim ⇒ drawn radius == catch radius (aim honesty).
  const lw = 6;
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.arc(c, c, c - lw / 2, 0, Math.PI * 2);
  ctx.stroke();
  // Fixed crosshair — the static "lock" that distinguishes it from the wandering ring annuli.
  ctx.lineWidth = 4;
  const arm = size * 0.16;
  ctx.beginPath();
  ctx.moveTo(c - arm, c);
  ctx.lineTo(c + arm, c);
  ctx.moveTo(c, c - arm);
  ctx.lineTo(c, c + arm);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(c, c, 5, 0, Math.PI * 2);
  ctx.fill();
  return new CanvasTexture(canvas);
}

/**
 * Shield COVER-PROP texture seam (mirrors `resolveBossTexture`): the canon `shield_cover_raised` /
 * `shield_cover_lowered` art is NOT generated yet (levelArt.json `boss.types.shield_cover_*` are
 * `pending:true`, empty prompt, skipped by gen-boss-sprites.mjs), so this returns `null` and the prop
 * renders as the procedural grey placeholder below. Landing the real art is a pure data swap HERE:
 * return the raised/lowered texture keyed off `lowered`.
 */
function resolveShieldCoverTexture(_lowered: boolean): Texture | null {
  return null;
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /**
   * Surfaces the boss QTE's HUD-relevant slice (bossHp / bossHpMax / phaseCount) to the DOM HP
   * bar. Fired only when those fields change (never per frame); `null` when the QTE is
   * inactive/absent, so the bar renders null (no orphan HUD).
   */
  onBossQte?: ((qte: HudBossQte | null) => void) | undefined;
  /**
   * Effective reduced motion (ADR-0054 §3): the shared union signal (prefs toggle OR
   * live OS query), owned once by `useReducedMotionRoot` in App and threaded through
   * GameScene — the ONE authority. Degrades the phase-break pulse and re-arm brace to
   * a steady, non-strobing step, honouring the in-app toggle as well as the OS query.
   */
  reducedMotion: boolean;
}

// The HUD-relevant slice, or null when inactive. Used both to emit and to detect change without
// a per-frame React re-render.
function hudSliceKey(slice: HudBossQte | null): string {
  if (slice === null) return "none";
  return `${String(slice.bossHp)}:${String(slice.bossHpMax)}:${String(slice.phaseCount)}`;
}

/** Apply a texture to a mesh's basic material only when it actually changed. */
function applyTexture(mesh: Mesh, tex: Texture | null): void {
  const mat = mesh.material as MeshBasicMaterial;
  if (tex !== null && mat.map !== tex) {
    mat.map = tex;
    mat.needsUpdate = true;
  }
}

/**
 * The boss QTE tableau (the static duel) plus the five ADR-0052 differentiation reads. Pooled
 * meshes in world / camera space. Visible only while the boss QTE holds the scene frozen
 * (`isBossQteActive`, extended to include the FINISHER beat).
 */
export function BossQteSprite({ stateRef, onBossQte, reducedMotion }: Props): JSX.Element {
  const bossRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null); // ring A (phase 1 single ring; phase 2+ = VITAL)
  const ringBRef = useRef<Mesh>(null); // ring B (phase 2+ = LIMB)
  const parryRef = useRef<Mesh>(null); // L3 parry marker (diamond guard glyph)
  const parryHaloRef = useRef<Mesh>(null); // L3 paper-white contrast halo (survives the smoke veil)
  const decorRef = useRef<Mesh>(null); // L2 décor placeholder prop (always dim grey)
  const decorGlowRef = useRef<Mesh>(null); // L2 armed dégradé glow-halo (acid, radial falloff)
  const shieldPropRef = useRef<Mesh>(null); // L6 shield COVER prop (raised↔lowered placeholder)
  const shieldMarkerRef = useRef<Mesh>(null); // L6 fixed hit-point lock reticle (drawn == catch)
  const pulseRef = useRef<Mesh>(null); // phase-break pulse
  const finisherFlashRef = useRef<Mesh>(null); // L5 white inverted onset flash (value)
  const finisherVignetteRef = useRef<Mesh>(null); // L5 black value-crush vignette (value)
  const finisherPromptRef = useRef<Mesh>(null); // L5 « LIVRE LE SON » (acid neon)
  const renfortRefs = useRef<(Mesh | null)[]>([]);

  const lastKeyRef = useRef<string>("none");
  const positionedRef = useRef(false);
  const prevHpRef = useRef<number | null>(null);
  const hitUntilRef = useRef(0);
  const wasBreakingRef = useRef(false);
  const pulseUntilRef = useRef(0);
  // L3 parry whiff detector (a charged window that closed without a stagger success).
  const wasParryOpenRef = useRef(false);
  const whiffUntilRef = useRef(0);
  // L2/L4 opacity envelopes (smoothly ramp the veil / edge pressure in and out).
  const smokeEnvRef = useRef(0);
  const renfortEnvRef = useRef(0);
  // L5 finisher onset (rising edge on entering the FINISHER phase).
  const wasFinisherRef = useRef(false);
  const finisherUntilRef = useRef(0);

  const { camera, size } = useThree();

  // Device tier for the particle count (like the CRT lite/full split) — decided once at mount.
  const smokeMax = useMemo(() => (detectMobile() ? SMOKE_MAX_MOBILE : SMOKE_MAX_DESKTOP), []);
  // The drifting smoke PARTICLE FIELD (own module). Added to the scene via <primitive>; positions
  // its billboards in world space each frame around the boss anchor.
  const smokeField = useMemo(() => createSmokeField(smokeMax), [smokeMax]);
  // Contact shadow + energy RIM around the Commandant. One band below the boss and
  // behind him in z, so his body covers the silhouette's interior and only the
  // outward margin shows — the ADR-0052 stance TINT stays the dominant read and the
  // rim is peripheral. Was an additive DISC in the first cut; the composite gate
  // measured it covering 7.73 % of the world area, pooling on the road and clipping
  // the pavement to white. A silhouette rim cannot do either (see entityAura.ts).
  const bossAura = useMemo(
    () => createEntityAura({ renderOrder: 5, rimZ: BOSS_Z - 0.02, shadowZ: BOSS_Z - 0.03 }),
    [],
  );

  // Ring A geometries: the normal annulus (phase-1 single ring + the neutral tell) and a
  // bolder-stroke vital annulus (§21) swapped onto ring A in its vital branches. Ring B (limb)
  // keeps the normal inner via its own declarative geometry.
  const ringGeoNormal = useMemo(() => new RingGeometry(RING_INNER, RING_OUTER, RING_SEGMENTS), []);
  const ringGeoVital = useMemo(
    () => new RingGeometry(RING_INNER_VITAL, RING_OUTER, RING_SEGMENTS),
    [],
  );

  // Baked textures (created once per mount; disposed on unmount). Guarded null under SSR / test.
  const glowTex = useMemo(() => buildRadialGlowTexture(), []);
  const vignetteTex = useMemo(() => buildVignetteTexture(), []);
  const promptTex = useMemo(() => buildPromptTexture(FINISHER_PROMPT_TEXT), []);
  const shieldReticleTex = useMemo(() => buildShieldReticleTexture(), []);
  useEffect(() => {
    return () => {
      glowTex?.dispose();
      vignetteTex?.dispose();
      promptTex?.dispose();
      shieldReticleTex?.dispose();
      smokeField.dispose();
      bossAura.dispose();
      ringGeoNormal.dispose();
      ringGeoVital.dispose();
    };
  }, [
    glowTex,
    vignetteTex,
    promptTex,
    shieldReticleTex,
    smokeField,
    bossAura,
    ringGeoNormal,
    ringGeoVital,
  ]);

  // Reduced motion (UX D3.1) now arrives via the `reducedMotion` prop — the shared
  // union signal from `useReducedMotionRoot` (App → GameScene), the ONE authority
  // (ADR-0054 §3) — degrading the phase-break pulse and re-arm brace to a steady,
  // non-strobing step. No private `matchMedia` poll: the in-app toggle reaches here too.

  useFrame((_, delta) => {
    const boss = bossRef.current;
    const ring = ringRef.current;
    const ringB = ringBRef.current;
    const parry = parryRef.current;
    const parryHalo = parryHaloRef.current;
    const decor = decorRef.current;
    const decorGlow = decorGlowRef.current;
    const shieldProp = shieldPropRef.current;
    const shieldMarker = shieldMarkerRef.current;
    const pulse = pulseRef.current;
    const finisherFlash = finisherFlashRef.current;
    const finisherVignette = finisherVignetteRef.current;
    const finisherPrompt = finisherPromptRef.current;
    if (
      boss === null ||
      ring === null ||
      ringB === null ||
      parry === null ||
      parryHalo === null ||
      decor === null ||
      decorGlow === null ||
      shieldProp === null ||
      shieldMarker === null ||
      pulse === null ||
      finisherFlash === null ||
      finisherVignette === null ||
      finisherPrompt === null
    ) {
      return;
    }

    const nowMs = performance.now();
    const state = stateRef.current;
    const qte = state.bossQte;
    const active = isBossQteActive(qte);

    // Surface the HUD slice only when a HP-relevant field changes (bounded).
    const slice: HudBossQte | null =
      active && qte !== null
        ? { bossHp: qte.bossHp, bossHpMax: qte.bossHpMax, phaseCount: qte.phaseCount }
        : null;
    const key = hudSliceKey(slice);
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      onBossQte?.(slice);
    }

    const hideExtras = (): void => {
      ringB.visible = false;
      parry.visible = false;
      parryHalo.visible = false;
      decor.visible = false;
      decorGlow.visible = false;
      shieldProp.visible = false;
      shieldMarker.visible = false;
      finisherFlash.visible = false;
      finisherVignette.visible = false;
      finisherPrompt.visible = false;
      smokeField.group.visible = false;
      bossAura.update(AURA_HIDDEN);
      for (const q of renfortRefs.current) if (q !== null) q.visible = false;
    };

    if (!active || qte === null) {
      boss.visible = false;
      ring.visible = false;
      pulse.visible = false;
      hideExtras();
      positionedRef.current = false;
      prevHpRef.current = null;
      hitUntilRef.current = 0;
      wasBreakingRef.current = false;
      pulseUntilRef.current = 0;
      wasParryOpenRef.current = false;
      whiffUntilRef.current = 0;
      smokeEnvRef.current = 0;
      renfortEnvRef.current = 0;
      wasFinisherRef.current = false;
      finisherUntilRef.current = 0;
      return;
    }

    // ── Static placement / scales (once per activation) ───────────────────────
    if (!positionedRef.current) {
      boss.scale.set(BOSS_W, BOSS_H, 1);
      // Ring A's radius switches by role (vital 0.11 vs. single/tell 0.30) so it is set per-frame
      // in each branch below; ring B is always the limb catch radius.
      ringB.scale.set(RING_HIT_RADIUS, RING_HIT_RADIUS, 1);
      parry.scale.set(PARRY_SIZE, PARRY_SIZE, 1);
      parryHalo.scale.set(PARRY_HALO_SIZE, PARRY_HALO_SIZE, 1);
      decor.scale.set(DECOR_W, DECOR_H, 1);
      decorGlow.scale.set(DECOR_GLOW_SIZE, DECOR_GLOW_SIZE, 1);
      // The shield marker spans 2·RING_HIT_RADIUS so the reticle's rim == the catch disc (drawn ==
      // catch). Fixed scale; the prop's scale switches per raised/lowered read below.
      shieldMarker.scale.set(RING_HIT_RADIUS * 2, RING_HIT_RADIUS * 2, 1);
      prevHpRef.current = qte.bossHp;
      positionedRef.current = true;
    }

    const breakActive = qte.phaseBreakRemaining > 0;
    const won = qte.phase === "WON";
    const lost = qte.phase === "LOST";
    const finisher = qte.phase === "FINISHER";
    // Phase is DERIVED from HP (no new game field — ADR-0051 D5).
    const phase = phaseIndexAt(qte.bossHp, qte.bossHpMax, qte.phaseCount);

    // L3 charged-window sub-states (decoded from the frozen runtime flags).
    const charged = qte.chargedWindow;
    const staggered = qte.staggerRemaining > 0;
    const exposedWindow = qte.phase === "ACTIVE" && qte.stance === "EXPOSED" && !breakActive;
    const shootWindow = exposedWindow && !charged; // a normal offensive window (rings)
    const parryOpen = exposedWindow && charged; // a live parry window (click the weapon)
    const parryWindup = qte.telegraphActive && qte.phase === "ACTIVE" && charged && !exposedWindow;

    // ── Per-hit reaction: rising edge on a bossHp DROP (a landed chip only) ────
    const prevHp = prevHpRef.current ?? qte.bossHp;
    if (qte.bossHp < prevHp) hitUntilRef.current = nowMs + HIT_MS;
    prevHpRef.current = qte.bossHp;
    const hitK = clamp01((hitUntilRef.current - nowMs) / HIT_MS);

    // ── Phase-break pulse: rising edge on entering a break ────────────────────
    if (breakActive && !wasBreakingRef.current) pulseUntilRef.current = nowMs + PULSE_MS;
    wasBreakingRef.current = breakActive;

    // ── L3 parry whiff: a live parry window closed without a stagger success ───
    // A SUCCESSFUL threshold-crossing parry takes the phase-break path, which zeroes
    // `staggerRemaining` — so `!staggered` alone can't tell a whiff from a break. Gate on
    // `phaseBreakRemaining <= 0` so the red WHIFF flash never plays over a phase break.
    if (
      wasParryOpenRef.current &&
      !parryOpen &&
      !staggered &&
      qte.phase === "ACTIVE" &&
      qte.phaseBreakRemaining <= 0
    ) {
      whiffUntilRef.current = nowMs + PARRY_WHIFF_MS;
    }
    wasParryOpenRef.current = parryOpen;
    const whiffK = clamp01((whiffUntilRef.current - nowMs) / PARRY_WHIFF_MS);

    // ── L5 finisher onset: rising edge on entering the FINISHER phase ──────────
    if (finisher && !wasFinisherRef.current) finisherUntilRef.current = nowMs + FINISHER_ONSET_MS;
    wasFinisherRef.current = finisher;

    // ── Commander pose (position + tint + stance texture) ─────────────────────
    let posX = qte.anchor.x;
    let posY = qte.anchor.y;
    posY -= phase * POSTURE_HUNCH_STEP; // provisional per-phase hunch
    if (breakActive) {
      if (reducedMotion) {
        posY -= BRACE_STATIC;
      } else {
        const p = clamp01(1 - qte.phaseBreakRemaining / PHASE_BREAK_SECONDS);
        posY -= BRACE_DIP * Math.sin(p * Math.PI);
      }
    }
    if (finisher) posY -= FINISHER_KNEEL; // the commander drops to a defeated posture
    if (!reducedMotion && hitK > 0) posX += HIT_RECOIL * hitK;
    boss.position.set(posX, posY, BOSS_Z);
    boss.visible = true;
    // ── Canon pose: decode the CURRENT boss state to a Commandant pose (bossTextures) ──
    // Priority top-down: the ceremonial FINISHER and the WON/defeated read override all; a reeling
    // beat (parry-stagger or a fresh hit chip) shows the struck pose; a live parry window OR its
    // telegraph wind-up raises the weapon (NOT the whole `charged` lull — `chargedWindow` is set for
    // the entire resting lull before a charged window, so gating on it would leak the coiled pose ~1.2–1.6 s
    // early; the windup pose tracks the tell exactly, like the tint layer); an offensive shoot window is
    // the dual weak-point frontal in phase 2+ or the single-ring firing pose in phase 1; every other beat
    // (SHIELDED wind-up, telegraph, phase break, LOST) holds the guarded shielded stance.
    let bossPose: BossPose = "shielded";
    if (finisher) bossPose = "finisher";
    else if (won) bossPose = "down";
    else if (staggered || hitK > 0) bossPose = "hit";
    else if (parryOpen || parryWindup) bossPose = "parry_windup";
    else if (shootWindow) bossPose = phase >= 1 ? "weakpoint" : "exposed";
    else if (exposedWindow) bossPose = "exposed";
    const bossTex = resolveBossTexture(bossPose);
    applyTexture(boss, bossTex?.texture ?? null);
    // Contact shadow + energy rim. Placed here, after the pose resolves, so the rim
    // traces the pose actually drawn; it tracks the live position (hunch, brace dip,
    // kneel, hit recoil), staying welded to the figure rather than to the anchor.
    // `getSilhouetteFor` caches per texture, so a pose swap is a lookup, not a bake.
    bossAura.update({
      visible: true,
      x: posX,
      y: posY,
      width: BOSS_W,
      height: BOSS_H,
      energy: state.energy,
      silhouette: bossTex === null ? null : getSilhouetteFor(bossTex.texture),
    });
    // Is the CANON pose art actually loaded (vs the grey riot-cop fallback)? The colour multiply
    // below is the state read for the FALLBACK sprite; over the true-colour canon art it would wash
    // the Commandant into a flat tint (the red EXPOSED aplat Bertrand caught), so on canon we keep
    // the sprite near-WHITE and let the POSES + dedicated cue meshes carry the state read.
    const bossCanon = getBossPoseTexture(bossPose) !== null;
    let tint = SHIELDED_TINT;
    if (breakActive) tint = BREAK_TINT;
    else if (parryOpen) tint = PARRY_OPEN_TINT;
    else if (parryWindup) tint = PARRY_WINDUP_TINT;
    else if (shootWindow) tint = EXPOSED_TINT;
    else if (qte.telegraphActive) tint = TELL_TINT;
    if (staggered) tint = STAGGER_TINT;
    if (whiffK > 0) tint = reducedMotion ? WHIFF_TINT : lerpHex(tint, WHIFF_TINT, whiffK);
    if (won) tint = WON_TINT;
    if (finisher) tint = FINISHER_DEFEAT_TINT;
    if (lost)
      tint = reducedMotion ? ALARM : lerpHex(ALARM, WHITE, (Math.sin(nowMs * 0.006) + 1) / 2);
    if (hitK > 0) tint = lerpHex(tint, WHITE, hitK);
    if (bossCanon) {
      // Canon art shows true; only the critical damage/alarm flashes bleed through, subtly.
      tint = WHITE;
      if (whiffK > 0) tint = lerpHex(WHITE, WHIFF_TINT, whiffK * 0.7);
      else if (lost)
        tint = reducedMotion
          ? lerpHex(WHITE, ALARM, 0.4)
          : lerpHex(WHITE, ALARM, 0.35 * ((Math.sin(nowMs * 0.006) + 1) / 2));
    }
    (boss.material as MeshBasicMaterial).color.set(tint);

    // ── L1 rings — the offensive read (a shoot window, or the two-ring preview at the split) ──
    // Phase 1: a single ring, colour-by-position (`ringZone`) — V1 EXACTLY.
    // Phase 2+: ring A = VITAL (head, fixed green, brighter emphasis), ring B = LIMB (torso,
    // fixed yellow, dimmer). "Which is which" reads from ANATOMY POSITION + brightness, not colour
    // alone (UX D4.1/D4.5). During the SHIELDED wind-up a faint tell ring rests at the neutral
    // centre. During the phase-1→2 break BOTH rings preview faintly — the "new pattern" cue that
    // marks the split distinctly from an ordinary phase break (UX D4.7).
    const twoRing = phase >= 1;
    const splitPreview = breakActive && phase === 1; // the phase-1→2 break introduces the split
    ring.visible = false;
    ringB.visible = false;
    if (shootWindow) {
      ring.visible = true;
      ring.position.set(
        qte.anchor.x + qte.targetOffset.x,
        qte.anchor.y + qte.targetOffset.y,
        RING_Z,
      );
      const ringMat = ring.material as MeshBasicMaterial;
      if (twoRing) {
        // VITAL ring drawn at the tighter catch radius (AMENDMENT A1 §4 — drawn = catch), with the
        // bolder vital stroke (§21) so the tiny ring stays perceivable.
        ring.geometry = ringGeoVital;
        ring.scale.set(BOSS_VITAL_CATCH_RADIUS, BOSS_VITAL_CATCH_RADIUS, 1);
        ringMat.color.set(ringZoneColour("vital"));
        ringMat.opacity = RING_OPACITY_MAX * (0.4 + 0.6 * ringZoneEmphasis("vital"));
        ringB.visible = true;
        ringB.position.set(
          qte.anchor.x + qte.targetOffsetB.x,
          qte.anchor.y + qte.targetOffsetB.y,
          RING_Z,
        );
        const ringBMat = ringB.material as MeshBasicMaterial;
        ringBMat.color.set(ringZoneColour("limb"));
        ringBMat.opacity = RING_OPACITY_MAX * (0.4 + 0.6 * ringZoneEmphasis("limb"));
      } else {
        // Phase-1 single ring — the V1 catch radius (unchanged by A1) + normal stroke.
        ring.geometry = ringGeoNormal;
        ring.scale.set(RING_HIT_RADIUS, RING_HIT_RADIUS, 1);
        ringMat.color.set(ringZoneColour(qte.ringZone));
        ringMat.opacity = RING_OPACITY_MAX * (0.4 + 0.6 * ringZoneEmphasis(qte.ringZone));
      }
    } else if (splitPreview) {
      // Faint dual-ring preview: "two openings now." Distinct from a plain phase break.
      const previewOpacity = reducedMotion
        ? 0.22
        : 0.15 + 0.1 * ((Math.sin(nowMs * 0.006) + 1) / 2);
      ring.visible = true;
      // Preview the vital ring at its true (tighter) catch radius + bolder vital stroke (§21).
      ring.geometry = ringGeoVital;
      ring.scale.set(BOSS_VITAL_CATCH_RADIUS, BOSS_VITAL_CATCH_RADIUS, 1);
      ring.position.set(
        qte.anchor.x + BOSS_VITAL_WANDER_CENTRE.x,
        qte.anchor.y + BOSS_VITAL_WANDER_CENTRE.y,
        RING_Z,
      );
      const ringMat = ring.material as MeshBasicMaterial;
      ringMat.color.set(ringZoneColour("vital"));
      ringMat.opacity = previewOpacity;
      ringB.visible = true;
      ringB.position.set(qte.anchor.x + BOSS_WANDER_CENTRE.x, qte.anchor.y + 0.25, RING_Z);
      const ringBMat = ringB.material as MeshBasicMaterial;
      ringBMat.color.set(ringZoneColour("limb"));
      ringBMat.opacity = previewOpacity;
    } else if (qte.telegraphActive && qte.phase === "ACTIVE" && !charged) {
      // The ordinary shoot wind-up tell — a faint neutral ring at the centre (not a scored catch
      // zone, so it keeps the baseline radius + normal stroke).
      ring.visible = true;
      ring.geometry = ringGeoNormal;
      ring.scale.set(RING_HIT_RADIUS, RING_HIT_RADIUS, 1);
      ring.position.set(
        qte.anchor.x + BOSS_WANDER_CENTRE.x,
        qte.anchor.y + BOSS_WANDER_CENTRE.y,
        RING_Z,
      );
      const ringMat = ring.material as MeshBasicMaterial;
      ringMat.color.set(TELL_TINT);
      ringMat.opacity = reducedMotion ? 0.22 : 0.15 + 0.12 * ((Math.sin(nowMs * 0.006) + 1) / 2);
    }

    // ── L3 parry marker — a FORM-distinct guard glyph at the raised sidearm (UX D2.1) ─────────
    // A filled diamond at `BOSS_PARRY_POINT` — categorically NOT the open shoot ring, so parry vs.
    // shoot reads by FORM in grayscale. Faint during the wind-up, solid/brighter when the parry
    // window is live ("click the weapon now"). Under reduced motion the pulse holds steady.
    // A paper-white halo behind the glyph (both drawn ABOVE the smoke veil, renderOrder 13/14)
    // gives value contrast so the tell survives the phase-3 smoke + boss shoulder art (shard §15);
    // a smoke-tied opacity envelope keeps it degraded-but-legible, never removed (2-C).
    parry.visible = false;
    parryHalo.visible = false;
    if (parryWindup || parryOpen) {
      const px = qte.anchor.x + BOSS_PARRY_POINT.x;
      const py = qte.anchor.y + BOSS_PARRY_POINT.y;
      const pulseK = reducedMotion ? 1 : 0.6 + 0.4 * ((Math.sin(nowMs * 0.012) + 1) / 2);
      // Degrade (never remove) under smoke, using the last-frame veil envelope so it fades in step.
      const smokeDegrade = 1 - PARRY_SMOKE_DEGRADE * clamp01(smokeEnvRef.current);
      const baseOpacity = (parryOpen ? 0.9 : 0.5) * pulseK * smokeDegrade;

      parryHalo.visible = true;
      parryHalo.position.set(px, py, PARRY_Z - 0.01); // just behind the glyph, above the veil
      const haloMat = parryHalo.material as MeshBasicMaterial;
      haloMat.color.set(PARRY_HALO_TINT);
      haloMat.opacity = baseOpacity; // the pale rim carries the value contrast

      parry.visible = true;
      parry.position.set(px, py, PARRY_Z);
      const parryMat = parry.material as MeshBasicMaterial;
      parryMat.color.set(parryOpen ? PARRY_OPEN_TINT : PARRY_WINDUP_TINT);
      parryMat.opacity = baseOpacity;
    }

    // ── L2 décor prop — a DIM GREY placeholder always; the "armed" read is a DÉGRADÉ glow-halo ──
    // The prop never becomes a flat lime aplat (composite-gate §2.1 fix). It stays a grey B&W
    // placeholder; when armed, a separate acid glow-HALO with a radial alpha falloff (→ 0 at the
    // rim) wraps it — a genuine dégradé (« un halo est un dégradé, jamais un aplat »).
    const decorProp = state.bossQteSpec?.decorProp ?? null;
    decor.visible = false;
    decorGlow.visible = false;
    if (decorProp !== null) {
      const dx = qte.anchor.x + decorProp.position.x;
      const dy = qte.anchor.y + decorProp.position.y;
      decor.visible = true;
      decor.position.set(dx, dy, DECOR_Z);
      const decorMat = decor.material as MeshBasicMaterial;
      const armed = qte.decorArmed && !qte.decorConsumed;
      // Prefer the canon décor art (the generated `speaker_wall` mur d'enceintes) — when it has
      // loaded, paint the prop true-colour; until then fall back to the dim grey placeholder box
      // (value only). The speaker wall is Belliard's interactive prop; a `decorProp.kind` key can
      // select lustre vs speaker_wall later (game-logic seam).
      const decorTex = getBossDecorTexture("speaker_wall");
      applyTexture(decor, decorTex);
      decorMat.color.set(decorTex !== null ? WHITE : DECOR_INERT_TINT);
      const placeholderOpacity = qte.decorConsumed ? 0.2 : armed ? 0.42 : 0.32;
      decorMat.opacity = decorTex !== null ? (qte.decorConsumed ? 0.4 : 1) : placeholderOpacity;
      if (armed && glowTex !== null) {
        decorGlow.visible = true;
        decorGlow.position.set(dx, dy, DECOR_GLOW_Z);
        const glowMat = decorGlow.material as MeshBasicMaterial;
        applyTexture(decorGlow, glowTex);
        glowMat.color.set(DECOR_ARMED_TINT);
        // Pulse the halo intensity (steady under reduced motion). The DÉGRADÉ is baked into the
        // texture's radial alpha, so the rim always falls to 0 — never a hard edge. Kept subtle so it
        // reads as "armed" without washing the scene at the boss zoom.
        glowMat.opacity = reducedMotion ? 0.5 : 0.3 + 0.22 * ((Math.sin(nowMs * 0.01) + 1) / 2);
      }
    }

    // ── L6 shield COVER prop — a SEPARATE object beside the boss, two reads (spec §6-A/6-C) ──────
    // The prop is his standalone cover (NOT armour — canon lead-art: bare-headed, nothing shootable
    // on his body). `bossShieldPointLive` drives the raised↔lowered swap; when live, the FIXED
    // hit-point lock reticle shows on the lowered edge. Gated on phase ≥ 1 (ACTIVE), mirroring the
    // two-ring gating — the triangle appears exactly when the two-ring choice does (§6-C onboarding).
    const shieldLive = bossShieldPointLive(qte);
    shieldProp.visible = false;
    shieldMarker.visible = false;
    if (qte.phase === "ACTIVE" && phase >= 1) {
      const shieldTex = resolveShieldCoverTexture(shieldLive);
      // Draw the cover prop ONLY once its canon art exists. Its `shield_cover_*` art is still
      // pending, and the grey placeholder slab read as a strange plate over the scene (Bertrand
      // playtest), so hide it until then — the fixed hit-point reticle below still carries the
      // "shoot here" read while the point is live.
      if (shieldTex !== null) {
        shieldProp.visible = true;
        applyTexture(shieldProp, shieldTex);
        const shieldMat = shieldProp.material as MeshBasicMaterial;
        shieldMat.color.set(WHITE);
        shieldMat.opacity = 1;
        if (shieldLive) {
          // LOWERED / vulnerable — dropped low, slightly canted, its exposed edge presenting the point.
          shieldProp.position.set(
            qte.anchor.x + SHIELD_PROP_X,
            qte.anchor.y + SHIELD_LOWERED_Y,
            SHIELD_PROP_Z,
          );
          shieldProp.scale.set(SHIELD_LOWERED_W, SHIELD_LOWERED_H, 1);
          shieldProp.rotation.z = SHIELD_LOWERED_TILT;
        } else {
          // RAISED / intact — stood upright as cover, un-shootable, no hit point.
          shieldProp.position.set(
            qte.anchor.x + SHIELD_PROP_X,
            qte.anchor.y + SHIELD_RAISED_Y,
            SHIELD_PROP_Z,
          );
          shieldProp.scale.set(SHIELD_RAISED_W, SHIELD_RAISED_H, 1);
          shieldProp.rotation.z = 0;
        }
      }
      // The FIXED hit-point lock reticle shows whenever the point is live (independent of the prop
      // art), at anchor + BOSS_SHIELD_POINT, drawn == catch radius.
      if (shieldLive) {
        shieldMarker.visible = true;
        shieldMarker.position.set(
          qte.anchor.x + BOSS_SHIELD_POINT.x,
          qte.anchor.y + BOSS_SHIELD_POINT.y,
          SHIELD_MARKER_Z,
        );
        if (shieldReticleTex !== null) applyTexture(shieldMarker, shieldReticleTex);
        const markerMat = shieldMarker.material as MeshBasicMaterial;
        markerMat.color.set(SHIELD_MARKER_TINT);
        // Steady under reduced motion; a gentle "lock" pulse otherwise (never a strobe).
        markerMat.opacity = reducedMotion ? 1 : 0.65 + 0.35 * ((Math.sin(nowMs * 0.01) + 1) / 2);
      }
    }

    // ── L2 smoke — a real drifting PARTICLE FIELD (Bertrand order §17) ──────────────────────────
    // Envelope ramps smoothly toward the smokeActive target (also feeds the parry-glyph degrade).
    // The field module owns spawn/drift/expand/fade + the reduced-motion static freeze; it hides
    // itself when the envelope is ~0.
    // Ramp the envelope toward the target only while the field is actually READY (texture loaded).
    // If the sprite 404s (or hasn't arrived yet) the veil is not on screen, so the target holds at 0
    // and the parry glyph never pays PARRY_SMOKE_DEGRADE for an absent veil (2-C: degraded only when
    // truly degrading). Frame-rate-independent exponential smoothing (see SMOKE_FADE_K).
    const smokeTarget = qte.smokeActive && smokeField.isReady() ? 1 : 0;
    smokeEnvRef.current +=
      (smokeTarget - smokeEnvRef.current) * (1 - Math.exp(-SMOKE_FADE_K * delta));
    smokeField.update(delta, {
      activeCount: smokeMax,
      reducedMotion,
      centreX: qte.anchor.x,
      centreY: qte.anchor.y + 0.2,
      envelope: smokeEnvRef.current,
    });

    // ── L4 renfort — frame-edge silhouette pressure (motion only, no shootable body) ───────────
    const renfortTarget = qte.renfortActive ? 1 : 0;
    renfortEnvRef.current +=
      (renfortTarget - renfortEnvRef.current) * (1 - Math.exp(-RENFORT_FADE_K * delta));
    const renfortEnv = renfortEnvRef.current;
    const cam = camera as OrthographicCamera;
    const halfW = size.width / cam.zoom / 2;
    const halfH = size.height / cam.zoom / 2;
    const renfortTex = renfortEnv > 0.02 ? (resolveRenfortTexture()?.texture ?? null) : null;
    for (let i = 0; i < renfortRefs.current.length; i++) {
      const q = renfortRefs.current[i];
      if (q === null || q === undefined) continue;
      if (renfortEnv < 0.02) {
        q.visible = false;
        continue;
      }
      q.visible = true;
      applyTexture(q, renfortTex);
      const onLeft = i % 2 === 0;
      const sway = reducedMotion ? 0 : 0.12 * halfW * Math.sin(nowMs * 0.0016 + i * 1.3);
      const edgeX = (onLeft ? -1 : 1) * halfW * 0.92 + (onLeft ? sway : -sway);
      const tier = Math.floor(i / 2); // stack a couple per side at different heights
      const edgeY = cam.position.y + (tier === 0 ? -0.15 : 0.35) * halfH;
      const h = halfH * 1.25;
      q.scale.set(h * 0.6, h, 1);
      q.position.set(cam.position.x + edgeX, edgeY, RENFORT_Z);
      const qMat = q.material as MeshBasicMaterial;
      qMat.color.set(RENFORT_TINT);
      qMat.opacity = RENFORT_PEAK_ALPHA * renfortEnv;
    }

    // ── Phase-break pulse — a screen-level, non-diegetic onset flash (ADR-0051 D5) ─────────────
    const pulseRemaining = pulseUntilRef.current - nowMs;
    const pulsing = pulseRemaining > 0 && !finisher;
    pulse.visible = pulsing;
    if (pulsing) {
      pulse.position.set(cam.position.x, cam.position.y, PULSE_Z);
      pulse.scale.set(halfW * 2, halfH * 2, 1);
      const k = clamp01(pulseRemaining / PULSE_MS);
      const pulseMat = pulse.material as MeshBasicMaterial;
      pulseMat.color.set(PULSE_COLOUR);
      pulseMat.opacity = reducedMotion ? PULSE_PEAK : PULSE_PEAK * k;
    }

    // ── L5 finisher — MONOCHROME on the world (no warm hue): a white inverted onset flash + a held
    //    black value-crush vignette, plus the acid-neon « LIVRE LE SON » prompt. The prompt's
    //    presence distinguishes this ACTIVE beat from the passive QTE_RESULT_HOLD breather (UX D3.2).
    //    Resolves on ANY fire → the whole frame is the click zone (44px floor met, UX D3.6). ───────
    finisherFlash.visible = false;
    finisherVignette.visible = false;
    finisherPrompt.visible = false;
    if (finisher) {
      const onsetRemaining = finisherUntilRef.current - nowMs;
      const flashK = reducedMotion ? 0.4 : clamp01(onsetRemaining / FINISHER_ONSET_MS);

      // White inverted flash at onset (a VALUE, fades out; a low steady step under reduced motion).
      finisherFlash.visible = true;
      finisherFlash.position.set(cam.position.x, cam.position.y, PULSE_Z);
      finisherFlash.scale.set(halfW * 2, halfH * 2, 1);
      const flashMat = finisherFlash.material as MeshBasicMaterial;
      flashMat.color.set(WHITE);
      flashMat.opacity = FINISHER_FLASH_PEAK * flashK;

      // Black vignette value-crush, held for the beat — darkens the frame edges, focuses on the
      // downed boss. VALUE only (black), no hue on world pixels.
      if (vignetteTex !== null) {
        finisherVignette.visible = true;
        applyTexture(finisherVignette, vignetteTex);
        finisherVignette.position.set(cam.position.x, cam.position.y, PULSE_Z - 0.01);
        finisherVignette.scale.set(halfW * 2, halfH * 2, 1);
        const vignetteMat = finisherVignette.material as MeshBasicMaterial;
        vignetteMat.color.set("#000000");
        vignetteMat.opacity = FINISHER_VIGNETTE_PEAK;
      }

      // The prompt — diegetic, below the boss, ACID NEON (the only colour on the B&W world); a
      // pulse = "click now" (steady under reduced motion).
      if (promptTex !== null) {
        finisherPrompt.visible = true;
        applyTexture(finisherPrompt, promptTex);
        finisherPrompt.position.set(
          qte.anchor.x,
          qte.anchor.y - FINISHER_PROMPT_DY,
          FINISHER_PROMPT_Z,
        );
        const promptMat = finisherPrompt.material as MeshBasicMaterial;
        promptMat.color.set(FINISHER_PROMPT_TINT);
        promptMat.opacity = reducedMotion ? 1 : 0.65 + 0.35 * ((Math.sin(nowMs * 0.008) + 1) / 2);
      }
    }
  });

  return (
    <>
      {/* Draw order (by renderOrder): renfort edges (3) behind the tableau; décor glow-halo (4) +
          prop (5); boss (6); the shield COVER prop (7) in front of him; rings (8); the shield
          hit-point lock reticle (9); the smoke PARTICLE FIELD (10, set in the module) hazes the
          duel; the parry halo+glyph (13/14) draw ABOVE the smoke so the tell survives; the finisher
          prompt (12) reads over the haze; the phase-break pulse + finisher flash/vignette (20) wash
          over everything. */}
      {Array.from({ length: RENFORT_QUADS }, (_, i) => (
        <mesh
          key={`renfort-${String(i)}`}
          ref={(el) => {
            renfortRefs.current[i] = el;
          }}
          renderOrder={3}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={decorGlowRef} renderOrder={4} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={decorRef} renderOrder={5} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={bossRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {/* L6 shield COVER prop (7) rides in FRONT of the boss — he shelters behind it — but under the
          rings (8). Grey placeholder until the pending `shield_cover_*` art lands. */}
      <mesh ref={shieldPropRef} renderOrder={7} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {/* Ring A geometry is swapped between normal / bolder-vital in useFrame (§21), so it is
          supplied as a prop rather than a declarative child. Ring B (limb) keeps the normal inner. */}
      <mesh ref={ringRef} renderOrder={8} geometry={ringGeoNormal} visible={false}>
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={ringBRef} renderOrder={8} visible={false}>
        <ringGeometry args={[RING_INNER, RING_OUTER, RING_SEGMENTS]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {/* L6 fixed hit-point lock reticle (9) — a target-lock crosshair drawn at exactly
          RING_HIT_RADIUS (plane spans 2·radius) so drawn == catch; distinct in FORM from the two
          wandering ring annuli. */}
      <mesh ref={shieldMarkerRef} renderOrder={9} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {/* The drifting smoke particle field (renderOrder 10, set per-billboard in the module). */}
      <primitive object={smokeField.group} />
      {/* The Commandant's contact shadow + energy rim (renderOrder 5, under him). */}
      <primitive object={bossAura.group} />
      {/* The parry halo (13) + glyph (14) draw ABOVE the smoke so the tell survives phase-3 smoke;
          the paper-white halo gives value contrast against the smoke + shoulder art. */}
      <mesh ref={parryHaloRef} renderOrder={13} rotation={[0, 0, Math.PI / 4]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={parryRef} renderOrder={14} rotation={[0, 0, Math.PI / 4]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={finisherPromptRef} renderOrder={12} visible={false}>
        <planeGeometry args={[FINISHER_PROMPT_W, FINISHER_PROMPT_H]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={pulseRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={finisherVignetteRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={finisherFlashRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
