import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import { isQteActive } from "@game/systems/qteSystem";
import { resolveEnemyTexture } from "./enemyTextures";
import type { ResolvedEnemyTexture } from "./enemyTextures";
import { getHostageGirlTexture } from "./hostageTextures";
import {
  blownPeeksProximity,
  captorTint,
  CAPTOR_WON_TINT,
  hostageAlarmColor,
  hostageDistressTint,
  peekTellVisual,
} from "./hostageCue";
import type { HudHostageQte } from "@render/ui/HUD";

// The captor: a SQUARE plane (his texture is 256×256, figure centred — no aspect
// distortion) drawn at the STATIC `qte.anchor` where he stands holding the
// hostage (the static duel — he never moves). His covered / peeking poses ship
// later via the CI art lane; until then a stance→texture-key indirection
// (resolveCaptorTexture) resolves the cop fallback, so landing the real art is a
// pure data swap here.
const QTE_W = 2.0;
const QTE_H = 2.0;
const QTE_Z = 0.5;

// The hostage — the cartel boss's daughter, dragged in front as a living shield
// (ADR-0034 D2) — is a SECOND figure over his lower-front. Her dedicated art is
// assets/hostage/girl.png (levelArt.json `hostages` block, generated in CI).
// Square plane (256×256, centred). Kept to his front-RIGHT so the peeking head
// (front-left) clears her silhouette by a visible gap (G6 / UX spec D3.1).
const HOSTAGE_W = 1.3;
const HOSTAGE_H = 1.3;
const HOSTAGE_DX = 0.32;
const HOSTAGE_DY = -0.3;
const HOSTAGE_Z = 0.6; // in front of the captor — she is his shield

// The peek CUE: a thin RETICLE RING that FRAMES the head point (front-LEFT of the
// captor, clear of the hostage silhouette — G6), never a filled quad that covers
// it — the head-shot kill-zone stays visible through the ring's open centre. It
// carries BOTH beats of the peek tell (ADR-0034 D2/D3, UX spec §2): the pre-peek
// wind-up while `telegraphActive` (COVERED) draws a small, faint ring, and the
// open danger window while `PEEKING` a larger, brighter one. PRESENCE keys COVERED
// (absent) vs PEEKING (present), and radius + opacity carry the two-beat signal as
// a FORM change — legible without hue (a11y §4.2), colour only reinforces (TELL →
// ALARM). Exact alignment vs `qteZoneAt`'s head band is reconciled at the
// composite gate (ADR-0034 Gotchas — head-zone-vs-visible-head assertion).
// The ring's XY now FOLLOWS the live `qte.targetOffset` (anchor-relative head-zone
// centre): it wanders during PEEKING and rests at the neutral head point
// (≈ {x:-0.525, y:0.725}, front-left of the captor — where the fixed CUE_DX/CUE_DY
// used to place it) during COVERED/ZOOMING. The render only READS the offset (the
// wander is computed by the game lane); this closes the aim-honesty seam — the drawn
// ring sits exactly on the scored `head` band.
const CUE_Z = 0.55;
// World outer radius of the reticle ring at neutral scale; intensity scales it so
// the open PEEKING window reads clearly larger than the COVERED wind-up.
const CUE_RADIUS = 0.46;
// Hard cap on the ring's opacity: a subtle localised tell, never a solid block
// (the earlier filled quad read as a placeholder box and hid the head).
const CUE_OPACITY_MAX = 0.45;
// Ring geometry: outer radius normalised to 1 so world radius = the mesh scale;
// inner 0.78 leaves a wide open centre so the kill-zone is never occluded.
const CUE_RING_INNER = 0.78;
const CUE_RING_OUTER = 1.0;
const CUE_RING_SEGMENTS = 40;

// Pulse speed (rad/ms) for the peek-cue brightness pulse / LOST execution strobe.
const PULSE_SPEED = 0.006;

type CaptorTexKey = "covered" | "peeking";

/**
 * Stance→texture indirection (ADR-0034 / ADR-0030). The real drag / covered /
 * peeking-with-gun-raised captor sprites ship later via the CI art lane; until
 * then every key resolves to the cop fallback, so landing the art is a pure data
 * swap at THIS seam (no component logic change). Flagged to `lead-art`: the cop
 * fallback is a placeholder for the real static captor pose.
 */
function resolveCaptorTexture(_key: CaptorTexKey): ResolvedEnemyTexture | null {
  return resolveEnemyTexture("hostage_taker", 1, false, 1);
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /**
   * Surfaces the QTE's HUD-relevant fields to the DOM HUD. Fired only when those
   * fields change (never per frame); `null` when the QTE is inactive/absent.
   */
  onHostageQte?: ((qte: HudHostageQte | null) => void) | undefined;
}

// The HUD-relevant slice, or null when inactive. Used both to emit and to detect
// change without a per-frame React re-render (mirrors DeliveryVehicleSprite). The
// HUD now shows only the OTAGE banner (warning) and the WON/LOST verdict (phase)
// — the captor/countdown/hostage gauges left the screen (ADR-0034, UX spec §1).
function hudSliceKey(slice: HudHostageQte | null): string {
  if (slice === null) return "none";
  return `${slice.phase}:${slice.warning ? "1" : "0"}`;
}

/**
 * The hostage-taker QTE tableau (the static duel): the captor standing STILL,
 * holding the hostage as a living shield, drawn at the FIXED `qte.anchor` the
 * camera zooms onto and holds. Three pooled meshes (world space, same axes as
 * bullets / crosshair): the captor, the hostage shield, and the peek cue
 * (wind-up tell + open-window marker). The captor and hostage are positioned ONCE
 * from the static anchor on activation (no per-tick moving-anchor writes); the peek
 * ring instead FOLLOWS the live `qte.targetOffset` each frame (the wandering
 * head-zone centre) alongside its tint/scale/opacity pulse. Visible only while the
 * QTE holds the scene frozen (`isQteActive`).
 *
 * COVERED ↔ PEEKING reads by FORM (peek cue absent vs present) and pose, not hue;
 * the pre-peek cue is keyed off the game's `telegraphActive` (anticipation, not
 * reaction). The blown-peeks proximity is surfaced diegetically (Flag B): the
 * hostage's distress tint warms toward alarm as `blownPeeks` nears `maxBlownPeeks`
 * — no HUD bar. Under `prefers-reduced-motion` the cue and the LOST execution
 * flash degrade from a pulse/strobe to a STEADY appearing cue, and the distress
 * tint is steady by construction (signal preserved, no >3 Hz flash — WCAG 2.3.1 /
 * UX spec §4).
 */
export function HostageQteSprite({ stateRef, onHostageQte }: Props): JSX.Element {
  const captorRef = useRef<Mesh>(null);
  const hostageRef = useRef<Mesh>(null);
  const peekCueRef = useRef<Mesh>(null);
  const lastKeyRef = useRef<string>("none");
  // The static tableau is positioned ONCE per activation (the captor never moves);
  // reset when the QTE goes inactive so a fresh QTE re-places from its own anchor.
  const positionedRef = useRef(false);
  // Render-side reduced-motion detection (UX spec §4.1): degrades the peek cue /
  // execution flash to a steady, strobe-free form. Mirrors CrtPass's live query.
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
    const captor = captorRef.current;
    const hostage = hostageRef.current;
    const peekCue = peekCueRef.current;
    if (captor === null || hostage === null || peekCue === null) return;

    const nowMs = performance.now();
    const qte = stateRef.current.qte;
    const active = isQteActive(qte);

    // Surface the HUD slice only when a HUD-relevant field changes (bounded), so
    // the DOM HUD updates the banner/verdict without a per-frame React re-render.
    const slice: HudHostageQte | null =
      active && qte !== null ? { phase: qte.phase, warning: qte.warning } : null;
    const key = hudSliceKey(slice);
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      onHostageQte?.(slice);
    }

    if (!active || qte === null) {
      captor.visible = false;
      hostage.visible = false;
      peekCue.visible = false;
      positionedRef.current = false;
      return;
    }

    // ── Static placement (once per activation) ────────────────────────────────
    // The captor and hostage never move (the static duel): place those two meshes
    // ONCE from the fixed `qte.anchor` — no per-tick moving-anchor writes. The peek
    // ring's XY is NOT static — it follows the live `qte.targetOffset` each frame
    // below (in addition to its tint/scale/opacity pulse).
    if (!positionedRef.current) {
      captor.position.set(qte.anchor.x, qte.anchor.y, QTE_Z);
      captor.scale.set(QTE_W, QTE_H, 1);
      hostage.position.set(qte.anchor.x + HOSTAGE_DX, qte.anchor.y + HOSTAGE_DY, HOSTAGE_Z);
      hostage.scale.set(HOSTAGE_W, HOSTAGE_H, 1);
      positionedRef.current = true;
    }

    const reducedMotion = reducedMotionRef.current;
    const pulse01 = reducedMotion ? 0 : (Math.sin(nowMs * PULSE_SPEED) + 1) / 2;
    const lost = qte.phase === "LOST";
    const won = qte.phase === "WON";
    const peeking = qte.stance === "PEEKING";
    // Flag B: how close the captor is to executing the hostage (blown peeks / cap).
    const proximity = blownPeeksProximity(qte.blownPeeks, qte.maxBlownPeeks);

    // ── Captor (static tableau; pose via stance→texture indirection) ──────────
    captor.visible = true;
    const captorTex = resolveCaptorTexture(peeking ? "peeking" : "covered");
    const captorMat = captor.material as MeshBasicMaterial;
    if (captorTex !== null && captorMat.map !== captorTex.texture) {
      captorMat.map = captorTex.texture;
      captorMat.needsUpdate = true;
    }
    // On LOST he strobes the alarm (the execution); on WON he reads the resolved
    // win green — NOT the PEEKING danger red the tick leaves his stance in through
    // the win hold. Otherwise the live COVERED/PEEKING reinforcement tint.
    captorMat.color.set(
      lost
        ? hostageAlarmColor(pulse01, reducedMotion)
        : won
          ? CAPTOR_WON_TINT
          : captorTint(qte.stance, qte.telegraphActive),
    );

    // ── Hostage (the daughter, held in front as a shield) ─────────────────────
    hostage.visible = true;
    // Her dedicated art (committed). No figure fallback: the enemy cache's cop
    // fallback would make her read as a hostile — so she stays hidden the beat
    // her PNG loads (getHostageGirlTexture returns null until then).
    const girlTex = getHostageGirlTexture();
    const hostageMat = hostage.material as MeshBasicMaterial;
    if (girlTex === null) {
      hostage.visible = false;
    } else if (hostageMat.map !== girlTex) {
      hostageMat.map = girlTex;
      hostageMat.needsUpdate = true;
    }
    // Flag B (diegetic, no HUD bar): her distress tint warms toward alarm as the
    // blown peeks approach the execution cap — the "he's about to do it" read. On
    // LOST she strobes the alarm (she is the one being executed). Steady
    // escalation ⇒ reduced-motion-safe. No stray-hit white flash: a hostage hit
    // is a flat energy penalty with no per-hit signal on the contract.
    hostageMat.color.set(
      lost ? hostageAlarmColor(pulse01, reducedMotion) : hostageDistressTint(proximity),
    );

    // ── Peek cue (reticle ring that FRAMES the head point — never covers it) ──
    // Radius + opacity carry the two beats as a FORM change (bigger/brighter for
    // the open PEEKING window than the COVERED wind-up); the open centre keeps the
    // head-shot kill-zone visible. Opacity is hard-capped so it reads as a subtle
    // tell, not a solid block.
    // The cue is a DANGER/ACTIVE marker: only during ACTIVE. Hidden through both
    // result holds (WON: the tick keeps stance PEEKING but the danger is over;
    // LOST: the execution reads instead), so no danger ring lingers over a win.
    const cue = peekTellVisual(qte.telegraphActive, qte.stance, pulse01, reducedMotion);
    peekCue.visible = cue.active && qte.phase === "ACTIVE";
    if (peekCue.visible) {
      // Follow the live head-zone centre: anchor + the (wandering) targetOffset,
      // so the drawn ring sits exactly on the scored `head` band (aim-honesty seam).
      peekCue.position.set(
        qte.anchor.x + qte.targetOffset.x,
        qte.anchor.y + qte.targetOffset.y,
        CUE_Z,
      );
      const r = CUE_RADIUS * (0.55 + 0.75 * cue.intensity);
      peekCue.scale.set(r, r, 1);
      const cueMat = peekCue.material as MeshBasicMaterial;
      cueMat.color.set(cue.color);
      cueMat.opacity = Math.min(CUE_OPACITY_MAX, 0.15 + 0.3 * cue.intensity);
    }
  });

  return (
    // renderOrder 6/7 = the STREET-actor layers (courier 6, delivery vehicle 7):
    // the tableau stands on the sidewalk in front of the facade, drawn over the
    // balcony ironwork like every street actor. The hostage's higher order + z
    // draws her over the captor; the peek cue (8) sits on top of both.
    <>
      <mesh ref={captorRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={hostageRef} renderOrder={7} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={peekCueRef} renderOrder={8} visible={false}>
        <ringGeometry args={[CUE_RING_INNER, CUE_RING_OUTER, CUE_RING_SEGMENTS]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
