import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial, OrthographicCamera } from "three";
import type { GameState } from "@game/types/gameState";
import {
  BOSS_WANDER_CENTRE,
  isBossQteActive,
  phaseIndexAt,
  PHASE_BREAK_SECONDS,
  RING_HIT_RADIUS,
} from "@game/systems/bossQteSystem";
import { resolveEnemyTexture } from "./enemyTextures";
import type { ResolvedEnemyTexture } from "./enemyTextures";
import { clamp01, lerpHex, ringZoneColour, ringZoneEmphasis } from "./hostageCue";

// The boss QTE tableau — "le Commandant" (ADR-0051). A cinematic duel drawn at the
// STATIC `qte.anchor` the camera zooms onto and holds (the ADR-0030 static-duel
// shape). This is the RENDER of the pure `bossQteSystem` state: it reads state and
// maps it to poses / ring colour / a screen-level phase-break pulse — it decides no
// rule (boundary law). NO new `src/game` HUD field: the current phase is DERIVED
// here from `bossHp` via the exported pure `phaseIndexAt` (ADR-0051 D5).
//
// V1 runs on the COP FALLBACK sprite (`enemy_riot`): the FLUX generator has not yet
// produced the 4 canon Commandant poses (lead-art §7, N1/N2 still blocking), so the
// stance→texture indirection (`resolveBossTexture`) resolves the riot cop until the
// real art lands — swapping it in is then a pure data change at that one seam.

// The commander plane — a SQUARE plane (the fallback sprite is figure-centred, no
// aspect distortion), a touch larger than the captor (2.0) for his dominant stature.
const BOSS_W = 2.2;
const BOSS_H = 2.2;
const BOSS_Z = 0.5;

// The reticle RING that FRAMES the wandering weak-point (spatial-colour model,
// reused vocabulary from the hostage duel). Radius pinned to the game's
// `RING_HIT_RADIUS` so the drawn ring IS the scored catch zone (aim-honesty). Ring
// geometry: outer radius normalised to 1 (world radius = mesh scale), a wide-open
// centre so the weak-point stays visible through it.
const RING_Z = 0.55;
const RING_INNER = 0.78;
const RING_OUTER = 1.0;
const RING_SEGMENTS = 40;
const RING_OPACITY_MAX = 0.5;

// The screen-level phase-break PULSE (ADR-0051 D5, UX spec §2.1): a brief, one-shot,
// non-diegetic wash quad covering the viewport at the ONSET of every phase break —
// the transition cue that does NOT depend on reading text or timing a duration
// (PHASE_BREAK_SECONDS 1.0 s is SHORTER than phase-3's ordinary 1.2 s lull, so the
// break is indistinguishable by duration alone). Cool white, deliberately disjoint
// from the alarm-red LOST strobe and the green WON tint so it reads as its own event.
const PULSE_Z = 5;
const PULSE_MS = 500; // brief onset flash inside the 1.0 s break — leaves the re-arm pose visible
const PULSE_PEAK = 0.5; // a wash, never a white-out (the re-SHIELDED pose must stay legible under it)
const PULSE_COLOUR = "#eaf6ff";

// Per-hit reaction (UX D1.2): a brief recoil + whiten when a ring chip lands. Keyed
// off `bossHp` DROPPING — so a miss / off-ring (0-damage) shot never fires it (D1.2).
const HIT_MS = 160;
const HIT_RECOIL = 0.16;

// Per-phase posture escalation (UX D1.1) — PROVISIONAL on the fallback sprite. lead-art
// §7 ruled that the TRUE greyscale-rankable "more damaged each phase" read needs distinct
// posture SPRITES (a render tint/scale cannot satisfy A1), deferred to the live-encounter
// follow-up story. Until those exist the harness carries a modest ordered stand-in: the
// commander hunches progressively lower each phase. Documented as provisional, not a claim
// to satisfy A1 with the cop fallback.
const POSTURE_HUNCH_STEP = 0.09;

// The re-arming "brace" during a phase break (UX D2.4): the forced re-`SHIELDED` pose
// must look DISTINCT from an ordinary mid-phase lull — a recognisable NEW motion, not a
// state-flag swap invisible to the player. A single downward dip-and-rise under motion; a
// held braced-lower posture under reduced motion (D3.1 — a static step, never a strobe).
const BRACE_DIP = 0.2;
const BRACE_STATIC = 0.12;

// Reinforcing tints (colour is never the sole channel — pose/motion/ring carry the reads;
// tint only reinforces). Cool steel while SHIELDED, warming through the telegraph to an
// alarm lean while EXPOSED; a distinct cold cue during the break; resolved green on WON,
// alarm red on LOST.
const SHIELDED_TINT = "#9fb8cc";
const TELL_TINT = "#ffd27a";
const EXPOSED_TINT = "#ff6a4d";
const BREAK_TINT = "#bfe3ff";
const WON_TINT = "#7dffb0";
const ALARM = "#ff1e2d";
const WHITE = "#ffffff";

/**
 * Stance→texture indirection (mirrors HostageQteSprite): the real 4-pose Commandant
 * sprites ship later via the CI art lane; until then every state resolves to the riot
 * cop fallback, so landing the real art is a pure data swap HERE (no component logic
 * change). `firing` picks the shooting frame (gun raised + muzzle) for the EXPOSED
 * window, giving a stance read from the fallback exactly as the accomplice does.
 */
function resolveBossTexture(firing: boolean): ResolvedEnemyTexture | null {
  return resolveEnemyTexture("riot", 1, firing, 1);
}

interface Props {
  stateRef: React.RefObject<GameState>;
}

/**
 * The boss QTE tableau (the static duel): the commander standing at the FIXED
 * `qte.anchor` the camera zooms onto and holds, plus the wandering weak-point ring
 * and the screen-level phase-break pulse. Pooled meshes in world space (same axes as
 * bullets / crosshair). Visible only while the boss QTE holds the scene frozen
 * (`isBossQteActive`).
 *
 * Reads consumed (never decided here): `phase` / `stance` / `telegraphActive` /
 * `phaseBreakRemaining` (the break sub-state) / `targetOffset` + `ringZone` (the ring)
 * / `bossHp` + `bossHpMax` + `phaseCount` (phase derived via `phaseIndexAt`). Under
 * `prefers-reduced-motion` the phase-break pulse and the re-arm brace degrade to a
 * steady, non-strobing step (≤ 3 Hz — WCAG 2.3.1 / UX D3.1).
 */
export function BossQteSprite({ stateRef }: Props): JSX.Element {
  const bossRef = useRef<Mesh>(null);
  const ringRef = useRef<Mesh>(null);
  const pulseRef = useRef<Mesh>(null);
  // Static placement flag (the commander never moves): reset when the QTE goes
  // inactive so a fresh encounter re-places from its own anchor.
  const positionedRef = useRef(false);
  // Per-hit reaction: last-seen bossHp + the recoil/whiten deadline.
  const prevHpRef = useRef<number | null>(null);
  const hitUntilRef = useRef(0);
  // Phase-break pulse: rising-edge detector on `phaseBreakRemaining > 0` + the flash deadline.
  const wasBreakingRef = useRef(false);
  const pulseUntilRef = useRef(0);
  const { camera, size } = useThree();

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
    const pulse = pulseRef.current;
    if (boss === null || ring === null || pulse === null) return;

    const nowMs = performance.now();
    const qte = stateRef.current.bossQte;
    const active = isBossQteActive(qte);

    if (!active || qte === null) {
      boss.visible = false;
      ring.visible = false;
      pulse.visible = false;
      positionedRef.current = false;
      prevHpRef.current = null;
      hitUntilRef.current = 0;
      wasBreakingRef.current = false;
      pulseUntilRef.current = 0;
      return;
    }

    // ── Static placement (once per activation) ────────────────────────────────
    if (!positionedRef.current) {
      boss.scale.set(BOSS_W, BOSS_H, 1);
      ring.scale.set(RING_HIT_RADIUS, RING_HIT_RADIUS, 1);
      prevHpRef.current = qte.bossHp;
      positionedRef.current = true;
    }

    const reducedMotion = reducedMotionRef.current;
    const breakActive = qte.phaseBreakRemaining > 0;
    const won = qte.phase === "WON";
    const lost = qte.phase === "LOST";
    // Phase is DERIVED from HP (no new game field — ADR-0051 D5). Equals `qte.phaseIndex`.
    const phase = phaseIndexAt(qte.bossHp, qte.bossHpMax, qte.phaseCount);

    // ── Per-hit reaction: rising edge on a bossHp DROP (a landed chip only) ────
    const prevHp = prevHpRef.current ?? qte.bossHp;
    if (qte.bossHp < prevHp) hitUntilRef.current = nowMs + HIT_MS;
    prevHpRef.current = qte.bossHp;
    const hitK = clamp01((hitUntilRef.current - nowMs) / HIT_MS);

    // ── Phase-break pulse: rising edge on entering a break (the transition ONSET) ──
    if (breakActive && !wasBreakingRef.current) pulseUntilRef.current = nowMs + PULSE_MS;
    wasBreakingRef.current = breakActive;

    // ── Commander pose (position: hunch + brace + recoil; tint; stance texture) ──
    let posX = qte.anchor.x;
    let posY = qte.anchor.y;
    // Provisional per-phase hunch (see POSTURE_HUNCH_STEP — distinct sprites deferred).
    posY -= phase * POSTURE_HUNCH_STEP;
    // Re-arming brace during the break — DISTINCT from an idle SHIELDED lull (D2.4).
    if (breakActive) {
      if (reducedMotion) {
        posY -= BRACE_STATIC; // a held braced-lower posture (a single static step)
      } else {
        const p = clamp01(1 - qte.phaseBreakRemaining / PHASE_BREAK_SECONDS);
        posY -= BRACE_DIP * Math.sin(p * Math.PI); // one smooth dip-and-rise across the break
      }
    }
    // Per-hit recoil kick (a brief backward jolt), dropped under reduced motion.
    if (!reducedMotion && hitK > 0) posX += HIT_RECOIL * hitK;
    boss.position.set(posX, posY, BOSS_Z);

    boss.visible = true;
    const firing = qte.phase === "ACTIVE" && qte.stance === "EXPOSED" && !breakActive;
    const bossTex = resolveBossTexture(firing);
    const bossMat = boss.material as MeshBasicMaterial;
    if (bossTex !== null && bossMat.map !== bossTex.texture) {
      bossMat.map = bossTex.texture;
      bossMat.needsUpdate = true;
    }
    let tint = SHIELDED_TINT;
    if (breakActive) tint = BREAK_TINT;
    else if (firing) tint = EXPOSED_TINT;
    else if (qte.telegraphActive) tint = TELL_TINT;
    if (won) tint = WON_TINT;
    if (lost)
      tint = reducedMotion ? ALARM : lerpHex(ALARM, WHITE, (Math.sin(nowMs * 0.006) + 1) / 2);
    // Per-hit whiten rides on top of the stance tint (a landed chip reads as a flash).
    if (hitK > 0) tint = lerpHex(tint, WHITE, hitK);
    bossMat.color.set(tint);

    // ── Reticle ring — weak-point during EXPOSED, faint wind-up tell during SHIELDED ──
    // EXPOSED (not breaking): the ring wanders on the live `targetOffset`, coloured by the
    // anatomy `ringZone` under it (green vital / yellow limb / red off), the paired
    // `ringZoneEmphasis` the non-colour a11y channel. During the SHIELDED wind-up
    // (`telegraphActive`) a faint ring rests at the neutral centre as the "window incoming"
    // tell. Hidden otherwise (zoom / break / result holds).
    if (firing) {
      ring.visible = true;
      ring.position.set(
        qte.anchor.x + qte.targetOffset.x,
        qte.anchor.y + qte.targetOffset.y,
        RING_Z,
      );
      const ringMat = ring.material as MeshBasicMaterial;
      ringMat.color.set(ringZoneColour(qte.ringZone));
      ringMat.opacity = RING_OPACITY_MAX * (0.4 + 0.6 * ringZoneEmphasis(qte.ringZone));
    } else if (qte.telegraphActive && qte.phase === "ACTIVE") {
      ring.visible = true;
      ring.position.set(
        qte.anchor.x + BOSS_WANDER_CENTRE.x,
        qte.anchor.y + BOSS_WANDER_CENTRE.y,
        RING_Z,
      );
      const ringMat = ring.material as MeshBasicMaterial;
      ringMat.color.set(TELL_TINT);
      ringMat.opacity = reducedMotion ? 0.22 : 0.15 + 0.12 * ((Math.sin(nowMs * 0.006) + 1) / 2);
    } else {
      ring.visible = false;
    }

    // ── Phase-break pulse — a screen-level, non-diegetic onset flash (D5 / UX §2.1) ──
    // A quad pegged to the camera each frame and scaled to cover the current view (the
    // ortho zoom is fully in during a break). One-shot at onset: fades over PULSE_MS under
    // motion, holds a single steady step under reduced motion (never a strobe — D3.1).
    const pulseRemaining = pulseUntilRef.current - nowMs;
    const pulsing = pulseRemaining > 0;
    pulse.visible = pulsing;
    if (pulsing) {
      const cam = camera as OrthographicCamera;
      const halfW = size.width / cam.zoom / 2;
      const halfH = size.height / cam.zoom / 2;
      pulse.position.set(cam.position.x, cam.position.y, PULSE_Z);
      pulse.scale.set(halfW * 2, halfH * 2, 1);
      const k = clamp01(pulseRemaining / PULSE_MS); // 1 → 0 over the window
      const pulseMat = pulse.material as MeshBasicMaterial;
      pulseMat.color.set(PULSE_COLOUR);
      pulseMat.opacity = reducedMotion ? PULSE_PEAK : PULSE_PEAK * k;
    }
  });

  return (
    <>
      {/* renderOrder 6 = the STREET-actor layer (like the courier / captor): the
          tableau stands on the sidewalk in front of the facade. The ring (8) sits on
          top of it; the phase-break pulse (20) washes over everything. */}
      <mesh ref={bossRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={ringRef} renderOrder={8} visible={false}>
        <ringGeometry args={[RING_INNER, RING_OUTER, RING_SEGMENTS]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={pulseRef} renderOrder={20} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
