import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, RepeatWrapping } from "three";
import type { Mesh, MeshBasicMaterial, OrthographicCamera, Texture } from "three";
import type { GameState } from "@game/types/gameState";
import {
  BOSS_PARRY_POINT,
  BOSS_VITAL_CATCH_RADIUS,
  BOSS_WANDER_CENTRE,
  isBossQteActive,
  phaseIndexAt,
  PHASE_BREAK_SECONDS,
  RING_HIT_RADIUS,
} from "@game/systems/bossQteSystem";
import { resolveEnemyTexture } from "./enemyTextures";
import type { ResolvedEnemyTexture } from "./enemyTextures";
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
//   L2 décor interactif — a placeholder prop mesh that glows only while armed + a smoke veil.
//   L4 renfort — frame-edge silhouette pressure (motion only, no shootable body).
//   L5 coup de grâce — a FINISHER read distinct from the passive QTE_RESULT_HOLD breather,
//      « LIVRE LE SON » prompt, one ceremonial click cue.
// Every animated read carries its `prefers-reduced-motion` branch (UX D2.7/D3.1).
//
// V1 runs on the COP FALLBACK sprite (`enemy_riot`): the FLUX generator has not yet produced
// the canon Commandant / defeated / raised-weapon poses (ADR-0052 §7 art-lane deferral to the
// Niveau-Final story), so every state resolves to the riot cop until the real art lands —
// swapping it in is then a pure data change at the `resolveBossTexture` seam.

// The commander plane — a SQUARE plane (the fallback sprite is figure-centred), a touch
// larger than the captor (2.0) for his dominant stature.
const BOSS_W = 2.2;
const BOSS_H = 2.2;
const BOSS_Z = 0.5;

// The reticle RING that FRAMES a wandering weak-point (spatial-colour model, reused from the
// hostage duel). The drawn ring IS the scored catch zone (aim-honesty — "click inside the drawn
// ring = hit" must stay literally true). AMENDMENT A1 §4 (gated 2026-07-20) makes the two L1 rings
// carry DIFFERENT catch radii: the VITAL ring (A) is tighter — drawn at `BOSS_VITAL_CATCH_RADIUS`
// (0.18) so a fixed head-camp can't answer the whole vital path; the LIMB ring (B), the parry
// glyph, the décor prop and the phase-1 single ring all keep `RING_HIT_RADIUS` (0.30). The two
// rings also read apart by ANATOMY POSITION (head vs torso) + EMPHASIS brightness, never colour
// alone.
const RING_Z = 0.55;
const RING_INNER = 0.78;
const RING_OUTER = 1.0;
const RING_SEGMENTS = 40;
const RING_OPACITY_MAX = 0.5;

// The screen-level phase-break PULSE (ADR-0051 D5, UX §2.1): a brief, one-shot, non-diegetic
// wash at the ONSET of every phase break. Cool white, disjoint from the alarm-red LOST strobe,
// the green WON tint, and the sepia FINISHER wash so each event reads as itself.
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
const PARRY_SIZE = RING_HIT_RADIUS * 1.15; // the catch zone footprint, drawn as a filled guard
const PARRY_WHIFF_MS = 220;

// L2 décor — a procedural PLACEHOLDER prop (no FLUX asset this story). It sits in the tableau
// dim/inert and GLOWS only during its armed, shootable window ("ce qui brille est interactif").
const DECOR_Z = 0.45;
const DECOR_W = 0.8;
const DECOR_H = 1.05;
const DECOR_INERT_TINT = "#6b7580";
const DECOR_ARMED_TINT = "#c6ff5a"; // acid glow = interactive (bible's glow law)

// L2 smoke veil — under the gpu-specialist BINDING bounds (shard §8): ≤6 alpha-blended quads,
// world-space layer 0, MeshBasicMaterial-class (one texture fetch + tint, UV scroll + opacity
// envelope, NO per-pixel noise), desaturated NORMAL blend (never additive), reduced-motion holds
// static. Drawn IN FRONT of the boss/rings (renderOrder 10) at a capped opacity so the telegraph
// stays grayscale-legible through it (degraded, never removed — UX D1.1/D1.2).
const SMOKE_QUADS = 4; // ≤6 ceiling; 4 layers already read as "smoke covers the duel"
const SMOKE_Z = 0.7;
const SMOKE_SIZE = 3.0;
const SMOKE_COLOUR = "#9a9a9a"; // desaturated haze, never bright (would trip the CRT bloom gate)
const SMOKE_PEAK_ALPHA = 0.42; // ≤ ~0.5–0.6 guidance; keeps the ring/pose perceptible
const SMOKE_FADE = 0.06; // per-frame envelope lerp toward the smokeActive target

// L4 renfort — frame-edge silhouette PRESSURE (a lost CRS section, "pas ses hommes"). Motion
// only, NO shootable body, NO travelling bullet. Reuses the shipped `enemy_riot` silhouette,
// dark/desaturated, hugging the frame edges partially off-screen. Under reduced motion the sway
// is dropped for a held presence read (never a strobe).
const RENFORT_QUADS = 4;
const RENFORT_Z = 0.3; // behind the tableau actors — background chaos at the edges
const RENFORT_TINT = "#2f353b";
const RENFORT_PEAK_ALPHA = 0.55;
const RENFORT_FADE = 0.08;

// L5 finisher (coup de grâce) — a ceremonial post-combat beat (boss at 0 HP). Its wash colour is
// a desaturated SEPIA, deliberately disjoint from the cool-white phase-break pulse, the green WON
// tint and the alarm-red LOST strobe, so it reads as its own event. The « LIVRE LE SON » prompt +
// a pulsing click cue positively signal "this beat wants your input" — the distinction from the
// passive QTE_RESULT_HOLD breather (UX D3.2). Resolves on ANY `fire` (game 5-B), so the click
// zone is the full frame — the 44px touch floor is trivially met (UX D3.6/A10).
const FINISHER_WASH_COLOUR = "#d8c08f";
const FINISHER_WASH_PEAK = 0.44;
const FINISHER_ONSET_MS = 600;
const FINISHER_KNEEL = 0.35; // the commander drops to a defeated posture
const FINISHER_DEFEAT_TINT = "#7d8791"; // desaturated, down-but-not-finished
const FINISHER_PROMPT_TEXT = "LIVRE LE SON"; // canonical copy (NOT "ACHEVER" — narrative §3.3)
const FINISHER_PROMPT_DY = 1.25; // below the boss, in the tableau (diegetic, not a HUD chip)
const FINISHER_PROMPT_W = 2.0;
const FINISHER_PROMPT_H = 0.5;
const FINISHER_PROMPT_Z = 0.8;

/**
 * Stance→texture indirection (mirrors HostageQteSprite): the real Commandant poses ship later
 * via the CI art lane; until then every state resolves to the riot cop fallback, so landing the
 * real art is a pure data swap HERE. `firing` picks the shooting frame (gun raised + muzzle) for
 * the EXPOSED / parry window.
 */
function resolveBossTexture(firing: boolean): ResolvedEnemyTexture | null {
  return resolveEnemyTexture("riot", 1, firing, 1);
}

/** The idle riot-cop silhouette reused for the L4 frame-edge renfort pressure (motion only). */
function resolveRenfortTexture(): ResolvedEnemyTexture | null {
  return resolveEnemyTexture("riot", 1, false, 1);
}

/**
 * A procedural desaturated smoke texture baked ONCE into a CanvasTexture (soft grayscale blobs).
 * This is the "single texture fetch" the gpu verdict mandates — the cloudiness is baked into the
 * image, not computed per-pixel in a shader. `null` when no 2D canvas is available (SSR / test).
 */
function buildSmokeTexture(): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, size, size);
  // A handful of soft radial blobs tiled toward the edges so the texture wraps seamlessly.
  const blobs: [number, number, number][] = [
    [40, 46, 44],
    [92, 70, 52],
    [64, 100, 40],
    [16, 96, 34],
    [110, 24, 38],
  ];
  for (const [cx, cy, r] of blobs) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  return tex;
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

interface Props {
  stateRef: React.RefObject<GameState>;
  /**
   * Surfaces the boss QTE's HUD-relevant slice (bossHp / bossHpMax / phaseCount) to the DOM HP
   * bar. Fired only when those fields change (never per frame); `null` when the QTE is
   * inactive/absent, so the bar renders null (no orphan HUD).
   */
  onBossQte?: ((qte: HudBossQte | null) => void) | undefined;
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
export function BossQteSprite({ stateRef, onBossQte }: Props): JSX.Element {
  const bossRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null); // ring A (phase 1 single ring; phase 2+ = VITAL)
  const ringBRef = useRef<Mesh>(null); // ring B (phase 2+ = LIMB)
  const parryRef = useRef<Mesh>(null); // L3 parry marker (diamond guard glyph)
  const decorRef = useRef<Mesh>(null); // L2 décor placeholder prop
  const pulseRef = useRef<Mesh>(null); // phase-break pulse
  const finisherWashRef = useRef<Mesh>(null); // L5 ceremonial wash
  const finisherPromptRef = useRef<Mesh>(null); // L5 « LIVRE LE SON »
  const smokeRefs = useRef<(Mesh | null)[]>([]);
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

  // Baked textures (created once per mount; disposed on unmount). Guarded null under SSR / test.
  const smokeTex = useMemo(() => buildSmokeTexture(), []);
  const promptTex = useMemo(() => buildPromptTexture(FINISHER_PROMPT_TEXT), []);
  useEffect(() => {
    return () => {
      smokeTex?.dispose();
      promptTex?.dispose();
    };
  }, [smokeTex, promptTex]);

  // Render-side reduced-motion detection (UX D3.1) — mirrors HostageQteSprite / CrtPass.
  const reducedMotionRef = useRef(
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false,
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (): void => {
      reducedMotionRef.current = mq.matches;
    };
    onChange();
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);

  useFrame(() => {
    const boss = bossRef.current;
    const ring = ringRef.current;
    const ringB = ringBRef.current;
    const parry = parryRef.current;
    const decor = decorRef.current;
    const pulse = pulseRef.current;
    const finisherWash = finisherWashRef.current;
    const finisherPrompt = finisherPromptRef.current;
    if (
      boss === null ||
      ring === null ||
      ringB === null ||
      parry === null ||
      decor === null ||
      pulse === null ||
      finisherWash === null ||
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
      decor.visible = false;
      finisherWash.visible = false;
      finisherPrompt.visible = false;
      for (const q of smokeRefs.current) if (q !== null) q.visible = false;
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
      // Ring A's radius switches by role (vital 0.18 vs. single/tell 0.30) so it is set per-frame
      // in each branch below; ring B is always the limb catch radius.
      ringB.scale.set(RING_HIT_RADIUS, RING_HIT_RADIUS, 1);
      parry.scale.set(PARRY_SIZE, PARRY_SIZE, 1);
      decor.scale.set(DECOR_W, DECOR_H, 1);
      for (const q of smokeRefs.current) if (q !== null) q.scale.set(SMOKE_SIZE, SMOKE_SIZE, 1);
      prevHpRef.current = qte.bossHp;
      positionedRef.current = true;
    }

    const reducedMotion = reducedMotionRef.current;
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
    // The boss shows the raised-weapon frame for any EXPOSED window (shoot OR parry); ACTIVE and
    // FINISHER are distinct phases, so `exposedWindow` is already false during the finisher.
    const firing = exposedWindow;

    // ── Per-hit reaction: rising edge on a bossHp DROP (a landed chip only) ────
    const prevHp = prevHpRef.current ?? qte.bossHp;
    if (qte.bossHp < prevHp) hitUntilRef.current = nowMs + HIT_MS;
    prevHpRef.current = qte.bossHp;
    const hitK = clamp01((hitUntilRef.current - nowMs) / HIT_MS);

    // ── Phase-break pulse: rising edge on entering a break ────────────────────
    if (breakActive && !wasBreakingRef.current) pulseUntilRef.current = nowMs + PULSE_MS;
    wasBreakingRef.current = breakActive;

    // ── L3 parry whiff: a live parry window closed without a stagger success ───
    if (wasParryOpenRef.current && !parryOpen && !staggered && qte.phase === "ACTIVE") {
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
    applyTexture(boss, resolveBossTexture(firing)?.texture ?? null);
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
        ringMat.color.set(ringZoneColour(qte.ringZone));
        ringMat.opacity = RING_OPACITY_MAX * (0.4 + 0.6 * ringZoneEmphasis(qte.ringZone));
      }
    } else if (splitPreview) {
      // Faint dual-ring preview: "two openings now." Distinct from a plain phase break.
      const previewOpacity = reducedMotion
        ? 0.22
        : 0.15 + 0.1 * ((Math.sin(nowMs * 0.006) + 1) / 2);
      ring.visible = true;
      ring.position.set(qte.anchor.x + BOSS_WANDER_CENTRE.x, qte.anchor.y + 0.75, RING_Z);
      const ringMat = ring.material as MeshBasicMaterial;
      ringMat.color.set(ringZoneColour("vital"));
      ringMat.opacity = previewOpacity;
      ringB.visible = true;
      ringB.position.set(qte.anchor.x + BOSS_WANDER_CENTRE.x, qte.anchor.y + 0.25, RING_Z);
      const ringBMat = ringB.material as MeshBasicMaterial;
      ringBMat.color.set(ringZoneColour("limb"));
      ringBMat.opacity = previewOpacity;
    } else if (qte.telegraphActive && qte.phase === "ACTIVE" && !charged) {
      // The ordinary shoot wind-up tell — a faint ring at the neutral centre.
      ring.visible = true;
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
    parry.visible = false;
    if (parryWindup || parryOpen) {
      parry.visible = true;
      parry.position.set(
        qte.anchor.x + BOSS_PARRY_POINT.x,
        qte.anchor.y + BOSS_PARRY_POINT.y,
        PARRY_Z,
      );
      const parryMat = parry.material as MeshBasicMaterial;
      parryMat.color.set(parryOpen ? PARRY_OPEN_TINT : PARRY_WINDUP_TINT);
      const pulseK = reducedMotion ? 1 : 0.6 + 0.4 * ((Math.sin(nowMs * 0.012) + 1) / 2);
      parryMat.opacity = (parryOpen ? 0.9 : 0.5) * pulseK;
    }

    // ── L2 décor prop — a placeholder mesh that GLOWS only while armed ─────────────────────────
    const decorProp = state.bossQteSpec?.decorProp ?? null;
    decor.visible = false;
    if (decorProp !== null) {
      decor.visible = true;
      decor.position.set(
        qte.anchor.x + decorProp.position.x,
        qte.anchor.y + decorProp.position.y,
        DECOR_Z,
      );
      const decorMat = decor.material as MeshBasicMaterial;
      const armed = qte.decorArmed && !qte.decorConsumed;
      if (armed) {
        const glow = reducedMotion ? 0.85 : 0.6 + 0.4 * ((Math.sin(nowMs * 0.01) + 1) / 2);
        decorMat.color.set(DECOR_ARMED_TINT);
        decorMat.opacity = glow;
      } else {
        decorMat.color.set(DECOR_INERT_TINT);
        decorMat.opacity = qte.decorConsumed ? 0.25 : 0.55; // spent reads dimmer than inert-but-present
      }
    }

    // ── L2 smoke veil — ≤6 desaturated alpha quads, one baked texture, UV scroll + envelope ────
    // Envelope ramps smoothly toward the smokeActive target so the haze never pops. Under reduced
    // motion: no UV scroll, no drift, static opacity (gpu Q1 + UX §2.3, non-strobing).
    const smokeTarget = qte.smokeActive ? 1 : 0;
    smokeEnvRef.current += (smokeTarget - smokeEnvRef.current) * SMOKE_FADE;
    const smokeEnv = smokeEnvRef.current;
    if (smokeTex !== null && !reducedMotion) {
      smokeTex.offset.x = (nowMs * 0.00003) % 1;
      smokeTex.offset.y = (nowMs * 0.00002) % 1;
    }
    for (let i = 0; i < smokeRefs.current.length; i++) {
      const q = smokeRefs.current[i];
      if (q === null || q === undefined) continue;
      if (smokeEnv < 0.02) {
        q.visible = false;
        continue;
      }
      q.visible = true;
      const driftX = reducedMotion ? 0 : 0.18 * Math.sin(nowMs * 0.0005 + i * 1.7);
      const driftY = reducedMotion ? 0 : 0.1 * Math.sin(nowMs * 0.0004 + i * 2.3);
      const spreadX = (i - (SMOKE_QUADS - 1) / 2) * 0.6;
      q.position.set(qte.anchor.x + spreadX + driftX, qte.anchor.y + 0.4 + driftY, SMOKE_Z);
      const qMat = q.material as MeshBasicMaterial;
      qMat.color.set(SMOKE_COLOUR);
      qMat.opacity = SMOKE_PEAK_ALPHA * smokeEnv * (0.7 + 0.3 * (i % 2 === 0 ? 1 : 0.6));
    }

    // ── L4 renfort — frame-edge silhouette pressure (motion only, no shootable body) ───────────
    const renfortTarget = qte.renfortActive ? 1 : 0;
    renfortEnvRef.current += (renfortTarget - renfortEnvRef.current) * RENFORT_FADE;
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

    // ── L5 finisher — a ceremonial wash (distinct from the pulse/WON) + the « LIVRE LE SON »
    //    prompt + a click-cue pulse. The prompt's presence positively distinguishes this ACTIVE
    //    beat from the passive QTE_RESULT_HOLD breather (UX D3.2). Resolves on ANY fire → the
    //    whole frame is the click zone (44px floor trivially met, UX D3.6). ──────────────────────
    finisherWash.visible = false;
    finisherPrompt.visible = false;
    if (finisher) {
      // Ceremonial onset wash (one-shot fade; steady step under reduced motion).
      const onsetRemaining = finisherUntilRef.current - nowMs;
      finisherWash.visible = true;
      finisherWash.position.set(cam.position.x, cam.position.y, PULSE_Z);
      finisherWash.scale.set(halfW * 2, halfH * 2, 1);
      const washK = reducedMotion ? 1 : clamp01(onsetRemaining / FINISHER_ONSET_MS);
      const washMat = finisherWash.material as MeshBasicMaterial;
      washMat.color.set(FINISHER_WASH_COLOUR);
      // Hold a low steady sepia veil for the beat, brighter during the onset flash.
      washMat.opacity = FINISHER_WASH_PEAK * (0.35 + 0.65 * washK);

      // The prompt — diegetic, below the boss; a pulse = "click now" (steady under reduced motion).
      if (promptTex !== null) {
        finisherPrompt.visible = true;
        applyTexture(finisherPrompt, promptTex);
        finisherPrompt.position.set(
          qte.anchor.x,
          qte.anchor.y - FINISHER_PROMPT_DY,
          FINISHER_PROMPT_Z,
        );
        const promptMat = finisherPrompt.material as MeshBasicMaterial;
        promptMat.color.set(WHITE);
        promptMat.opacity = reducedMotion ? 1 : 0.65 + 0.35 * ((Math.sin(nowMs * 0.008) + 1) / 2);
      }
    }
  });

  return (
    <>
      {/* renderOrder 6 = the STREET-actor layer. Rings (8) sit on top; the parry glyph (9); the
          décor prop behind (4); the smoke veil (10) hazes the duel; renfort pressure (3) sits
          behind the tableau at the frame edges; the finisher prompt (12) reads over the haze;
          the phase-break pulse and finisher wash (20) wash over everything. */}
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
      <mesh ref={decorRef} renderOrder={4} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={bossRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} renderOrder={8} visible={false}>
        <ringGeometry args={[RING_INNER, RING_OUTER, RING_SEGMENTS]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={ringBRef} renderOrder={8} visible={false}>
        <ringGeometry args={[RING_INNER, RING_OUTER, RING_SEGMENTS]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={parryRef} renderOrder={9} rotation={[0, 0, Math.PI / 4]} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      {Array.from({ length: SMOKE_QUADS }, (_, i) => (
        <mesh
          key={`smoke-${String(i)}`}
          ref={(el) => {
            smokeRefs.current[i] = el;
          }}
          renderOrder={10}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={finisherPromptRef} renderOrder={12} visible={false}>
        <planeGeometry args={[FINISHER_PROMPT_W, FINISHER_PROMPT_H]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={pulseRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={finisherWashRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
