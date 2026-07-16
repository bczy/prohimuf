import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { GameState } from "@game/types/gameState";
import type { QtePhase } from "@game/types/hostageQte";
import { isQteActive } from "@game/systems/qteSystem";
import { resolveEnemyTexture } from "./enemyTextures";
import { getHostageGirlTexture } from "./hostageTextures";
import { hostageColor, hostageTension, lerpHex } from "./hostageCue";
import type { HudHostageQte } from "@render/ui/HUD";

// The captor: a SQUARE plane (his texture is 256×256, figure centred — no
// aspect distortion) sized to the QTE hit zones (qteSystem.qteZoneAt: tableau
// silhouette dx ∈ [−0.85, 0.85], dy ∈ [−1.05, 1.05]) so the figure the player
// aims at coincides with the body-part bands the game resolves shots against.
const QTE_W = 2.0;
const QTE_H = 2.0;
const QTE_Z = 0.5;

// The hostage — the cartel boss's daughter, held in front of the captor — is a
// SECOND figure drawn over his lower half, covering exactly the "hostage" hit
// band of qteZoneAt (body dx > −0.35 below his waistline + her head strip up to
// dy ≈ 0.2), so what the player must NOT shoot is visibly a distinct young woman. Her dedicated art is
// assets/hostage/girl.png (levelArt.json `hostages` block, generated in CI).
// Square plane (her texture is 256×256, figure centred — no aspect distortion);
// she KNEELS at his front-right, her plane bottom on the same ground line as his
// feet (anchor − 1.0). Matches the qteZoneAt hostage band.
const HOSTAGE_W = 1.3;
const HOSTAGE_H = 1.3;
const HOSTAGE_DX = 0.3;
const HOSTAGE_DY = -0.35;
const HOSTAGE_Z = 0.6; // in front of the captor — she is his shield

// The girl's art reads untinted (white multiplies to identity).
const GIRL_TINT = "#ffffff";
const HIT_FLASH_SECONDS = 0.25;

// Pulse speed (rad/ms) for the rising-tension tint / execution strobe.
const PULSE_SPEED = 0.006;

interface Props {
  stateRef: React.RefObject<GameState>;
  /**
   * Surfaces the QTE's HUD-relevant fields to the DOM HUD. Fired only when those
   * fields change (never per frame); `null` when the QTE is inactive/absent.
   */
  onHostageQte?: ((qte: HudHostageQte | null) => void) | undefined;
}

// The HUD-relevant slice, or null when inactive. Used both to emit and to detect
// change without a per-frame React re-render (mirrors DeliveryVehicleSprite).
function hudSliceKey(slice: HudHostageQte | null): string {
  if (slice === null) return "none";
  return [
    slice.phase,
    slice.captorHp,
    slice.hostageHp,
    Math.ceil(slice.windowRemaining),
    slice.warning ? 1 : 0,
  ].join(":");
}

/**
 * The hostage-taker QTE tableau (ADR-0030): the captor holding the hostage in
 * front of him. Two pooled meshes driven each frame from `GameState.qte` (world
 * space, same axes as bullets / crosshair), mirroring `DeliveryVehicleSprite`.
 * Visible only while the QTE holds the scene frozen (`isQteActive`).
 *
 * Captor: the `enemy_hostage` texture (cop fallback until its art lands); tint
 * climbs from calm pink toward alarm red as the window runs down and strobes
 * red↔white on LOST (the execution flash). Hostage: the kneeling daughter held
 * over his lower-front — she flashes white when a stray shot hits her, and
 * strobes with the alarm on LOST (she is the one being executed).
 */
export function HostageQteSprite({ stateRef, onHostageQte }: Props): JSX.Element {
  const captorRef = useRef<Mesh>(null);
  const hostageRef = useRef<Mesh>(null);
  const lastKeyRef = useRef<string>("none");
  // Previous hostage hp + remaining flash time, to pulse her white on a stray hit.
  const lastHostageHpRef = useRef<number | null>(null);
  const hitFlashRef = useRef(0);
  const lastFrameMsRef = useRef<number | null>(null);

  useFrame(() => {
    const captor = captorRef.current;
    const hostage = hostageRef.current;
    if (captor === null || hostage === null) return;

    // Render-side frame delta for the cosmetic hit flash (the game state is
    // frozen-time authoritative; this only times a tint pulse).
    const nowMs = performance.now();
    const frameDelta =
      lastFrameMsRef.current === null ? 0 : Math.min(0.1, (nowMs - lastFrameMsRef.current) / 1000);
    lastFrameMsRef.current = nowMs;

    const qte = stateRef.current.qte;
    const active = isQteActive(qte);

    // Surface the HUD slice only when a HUD-relevant field changes (bounded), so
    // the DOM HUD gauges update without a per-frame React re-render.
    const slice: HudHostageQte | null =
      active && qte !== null
        ? {
            phase: qte.phase,
            captorHp: qte.captorHp,
            captorHpMax: qte.captorHpMax,
            hostageHp: qte.hostageHp,
            hostageHpMax: qte.hostageHpMax,
            windowRemaining: qte.windowRemaining,
            windowSeconds: qte.windowSeconds,
            warning: qte.warning,
          }
        : null;
    const key = hudSliceKey(slice);
    if (key !== lastKeyRef.current) {
      lastKeyRef.current = key;
      onHostageQte?.(slice);
    }

    if (!active || qte === null) {
      captor.visible = false;
      hostage.visible = false;
      lastHostageHpRef.current = null;
      hitFlashRef.current = 0;
      return;
    }

    // ── Captor ──────────────────────────────────────────────────────────────
    captor.visible = true;
    captor.position.set(qte.anchor.x, qte.anchor.y, QTE_Z);
    captor.scale.set(QTE_W, QTE_H, 1);

    const captorTex = resolveEnemyTexture("hostage_taker", 1, false, 1);
    const captorMat = captor.material as MeshBasicMaterial;
    if (captorTex !== null && captorMat.map !== captorTex.texture) {
      captorMat.map = captorTex.texture;
      captorMat.needsUpdate = true;
    }

    const pulse01 = (Math.sin(nowMs * PULSE_SPEED) + 1) / 2;
    const tension = hostageTension(qte.windowRemaining, qte.windowSeconds);
    const phase: QtePhase = qte.phase;
    captorMat.color.set(hostageColor(tension, pulse01, phase === "LOST"));

    // ── Hostage (the daughter, held in front) ───────────────────────────────
    hostage.visible = true;
    hostage.position.set(qte.anchor.x + HOSTAGE_DX, qte.anchor.y + HOSTAGE_DY, HOSTAGE_Z);
    hostage.scale.set(HOSTAGE_W, HOSTAGE_H, 1);

    // Her dedicated art (committed). No figure fallback: enemy_civilian was
    // retired (ADR-0029) and the enemy cache's cop fallback would make her read
    // as a hostile — so she simply stays hidden for the beat her PNG loads.
    const girlTex = getHostageGirlTexture();
    const hostageMat = hostage.material as MeshBasicMaterial;
    if (girlTex === null) {
      hostage.visible = false;
    } else if (hostageMat.map !== girlTex) {
      hostageMat.map = girlTex;
      hostageMat.needsUpdate = true;
    }

    // A stray hit on her (hp dropped since last frame) pulses her white briefly.
    if (lastHostageHpRef.current !== null && qte.hostageHp < lastHostageHpRef.current) {
      hitFlashRef.current = HIT_FLASH_SECONDS;
    }
    lastHostageHpRef.current = qte.hostageHp;
    hitFlashRef.current = Math.max(0, hitFlashRef.current - frameDelta);

    if (phase === "LOST") {
      // She is the one being executed — strobe with the alarm.
      hostageMat.color.set(hostageColor(1, pulse01, true));
    } else if (hitFlashRef.current > 0) {
      hostageMat.color.set(lerpHex(GIRL_TINT, "#ffffff", hitFlashRef.current / HIT_FLASH_SECONDS));
    } else {
      hostageMat.color.set(GIRL_TINT);
    }
  });

  return (
    // renderOrder 6/7 = the STREET-actor layers (courier 6, delivery vehicle 7):
    // the tableau stands on the sidewalk in front of the facade, drawn over the
    // balcony ironwork like every street actor. The hostage's higher order + z
    // draws her over the captor.
    <>
      <mesh ref={captorRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={hostageRef} renderOrder={7} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
    </>
  );
}
