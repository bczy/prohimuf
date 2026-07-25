import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  CanvasTexture,
  Quaternion,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type OrthographicCamera,
  type Texture,
} from "three";
import { AURA_HIDDEN, createEntityAura } from "@render/effects/entityAura";
import type { GameState } from "@game/types/gameState";
import { isQteActive, RING_HIT_RADIUS } from "@game/systems/qteSystem";
import { resolveEnemyTexture, muzzleFor } from "./enemyTextures";
import type { ResolvedEnemyTexture } from "./enemyTextures";
import { getHostageGirlTexture } from "./hostageTextures";
import { getAccompliceTexture } from "./accompliceTextures";
import { bulletModelPath } from "@game/systems/assetManifest";
import { warmBulletModel, getBulletModel } from "./bulletModel";
import { ProceduralBullet } from "./ProceduralBullet";
import {
  attachBulletModel,
  bulletForwardAxis,
  BULLET_DEPTH_RATIO,
  BULLET_Z,
} from "./bulletGeometry";
import {
  blownPeeksProximity,
  captorHpPipLit,
  captorTint,
  CAPTOR_WON_TINT,
  hostageAlarmColor,
  hostageDistressTint,
  peekTellVisual,
  ringZoneColour,
  ringZoneEmphasis,
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
// a FORM change — legible without hue (a11y §4.2). The ring's COLOUR now reads the
// spatial-colour model: `ringZoneColour(qte.ringZone)` — GREEN over a vital zone
// ("shoot now" payoff), YELLOW over a limb, RED over empty space — paired with
// `ringZoneEmphasis` so the vital/limb/off read survives in grayscale (green
// brightens, red dims — via opacity, the ring size is constant). The game owns the
// zone; the render owns the
// colour map. Exact alignment vs `qteZoneAt`'s head band is reconciled at the
// composite gate (ADR-0034 Gotchas — head-zone-vs-visible-head assertion).
// The ring's XY now FOLLOWS the live `qte.targetOffset` (anchor-relative head-zone
// centre): it wanders during PEEKING and rests at the neutral head point
// (≈ {x:-0.525, y:0.725}, front-left of the captor — where the fixed CUE_DX/CUE_DY
// used to place it) during COVERED/ZOOMING. The render only READS the offset (the
// wander is computed by the game lane); this closes the aim-honesty seam — the drawn
// ring sits exactly on the scored `head` band.
const CUE_Z = 0.55;
// World OUTER radius of the reticle ring — pinned to the game's `RING_HIT_RADIUS` so the
// drawn ring IS the scored catch zone: a crosshair anywhere on/inside the ring is within
// `RING_HIT_RADIUS` of its centre → a hit (aim-honesty — "shoot what you see"; the tutorial
// literally instructs "aligne ta cible sur l'anneau"). The ring no longer grows, so a single
// fixed radius is all it needs; the two-beat tell + zone read ride opacity, never size.
const CUE_RADIUS = RING_HIT_RADIUS;
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

// DIEGETIC captor-HP read (U-1, NO HUD bar): a row of small pips above the captor's
// head, one per HP point (belliard starts 3), that vanish as `qte.captorHp` drops.
// Depletion-by-presence is reduced-motion-safe by construction (no strobe). The
// pool is fixed at the belliard-first authored HP; the render only READS captorHp
// (it never computes damage). Placed once with the static tableau, lit each frame.
const CAPTOR_HP_PIPS = 3;
const PIP_SIZE = 0.14;
const PIP_GAP = 0.2;
const PIP_DY = 1.18; // above his head (captor half-height ≈ QTE_H / 2 = 1.0)
const PIP_Z = 0.56;
const PIP_COLOUR = "#f7f7f7"; // bone white — a neutral vitality read, not a zone hue

// The captor's OWN counter-fire (P3-ACC, ADR-0034/0036): armed only when this level
// authored no accomplice — the two channels are mutually exclusive (see qteSystem.ts
// tickQte). Until now a blown peek drained energy with ZERO on-screen report — the
// player felt the hit but never saw the shot. Mirrors the accomplice's muzzle flash
// exactly (same brief bloom, same fade), originating at the pistol's own barrel.
//
// The offset below is only the FALLBACK: the live one is remapped from the sprite's
// authored muzzle anchor by `captorMuzzleOffset()`, so flash and round keep tracking
// the barrel when the real captor plate replaces today's placeholder.
const CAPTOR_MUZZLE_DX = -0.26;
const CAPTOR_MUZZLE_DY = 0.66;
const CAPTOR_MUZZLE_SIZE = 0.5;
const CAPTOR_MUZZLE_Z = 0.57;
const CAPTOR_MUZZLE_COLOUR = "#fff2b0"; // same warm bloom as the accomplice's
const CAPTOR_MUZZLE_FLASH_MS = 140;
const CAPTOR_MUZZLE_FLASH_OPACITY = 0.9;

/**
 * Where the captor's barrel actually is, in world units relative to `qte.anchor`.
 *
 * His sprite fills the QTE_W × QTE_H plane centred on the anchor exactly, so the
 * sprite's normalized muzzle anchor (from the PNG top-left) remaps to a world
 * offset by a straight linear map. Reading it from the manifest instead of
 * hand-placing it is what keeps the flash AND the round on the barrel when the
 * real captor plate lands (today's sprite is a documented placeholder — see
 * `resolveCaptorTexture`). Falls back to the fixed offset when no anchor is
 * authored.
 */
function captorMuzzleOffset(): { dx: number; dy: number } {
  const anchor = muzzleFor("hostage_taker", 1, 1, false);
  if (anchor === null) return { dx: CAPTOR_MUZZLE_DX, dy: CAPTOR_MUZZLE_DY };
  return { dx: (anchor.x - 0.5) * QTE_W, dy: (0.5 - anchor.y) * QTE_H };
}

// ── The accomplice: the SECOND armed figure (F4 / ADR-0036) ──────────────────
// Drawn iff `qte.accomplice !== null` while ACTIVE, spatially DISTINCT from the
// captor (screen-LEFT via ACCOMPLICE_OFFSET) so the player never confuses the
// shootable captor (ring target) with this UNSHOOTABLE second gun. Same square
// plane as the captor; its pose swaps between a gun-lowered IDLE and a gun-raised
// AIM on the game's `accomplice.telegraphActive` wind-up (the fallback cop
// carries the muzzle-raise via its shooting frame). The accomplice carries NO
// ring — it is not a kill target. The render READS the accomplice's presence /
// wind-up from game state only; its world placement is a render constant (the
// game layer carries no accomplice position — boundary law preserved).
const ACCOMPLICE_W = 2.0;
const ACCOMPLICE_H = 2.0;
const ACCOMPLICE_Z = 0.5;
// Anchor-relative placement — screen-LEFT, well clear of the ring's roam (the
// ring reaches ≈ anchor −0.98 in x) and of the front-right hostage. If a stage-5
// framing check finds it off-frame at the QTE zoom, pull x toward the captor
// (e.g. −2.0) — a constant tweak that touches no game logic (K-1 analogue).
const ACCOMPLICE_OFFSET = { x: -2.4, y: 0.0 };
// Muzzle flash: a brief bright bloom at the raised gun when a shot lands. Parked
// toward the duel side of the figure (screen-right of the accomplice), at gun
// height. The −8 energy drain itself reads through the EXISTING energyFloater
// wired in useGameLoop from energyDelta; this is only the on-figure report.
const ACCOMPLICE_MUZZLE_DX = 0.55;
const ACCOMPLICE_MUZZLE_DY = 0.08;
const ACCOMPLICE_MUZZLE_SIZE = 0.5;
const ACCOMPLICE_MUZZLE_Z = 0.57;
const ACCOMPLICE_MUZZLE_COLOUR = "#fff2b0"; // warm muzzle bloom — never ring green/yellow
// How long the muzzle flash stays lit after a shot lands (ms). A single brief
// bloom per shot, never a repeating strobe ⇒ reduced-motion-safe by construction.
const ACCOMPLICE_FLASH_MS = 140;
const ACCOMPLICE_FLASH_OPACITY = 0.9;
// Reinforcing tint: a cold steel read while idle, warming to a warning as the gun
// raises. Deliberately NOT the ring palette (green/yellow) so the accomplice is
// never mistaken for a kill target (exact hue: lead-art).
const ACCOMPLICE_TINT_IDLE = "#9fb8cc";
const ACCOMPLICE_TINT_AIM = "#ff6a4d";

// Muzzle-flash falloff. Both flashes were untextured planes, i.e. a hard-edged
// APLAT — a square of flat colour, which the house rule explicitly forbids ("loi
// du glow": a glow is always a dégradé, never an aplat) and which read as a
// mystery box parked on the gun once the round drew the eye there. Same lazy
// module-scope CanvasTexture pattern as the impact burst's `getExplosionTexture`:
// white-hot core → warm falloff → fully transparent at the rim, so the plane's
// corners carry zero alpha and the flash reads as light instead of a card.
let muzzleTex: Texture | null = null;
function getMuzzleFlashTexture(): Texture | null {
  if (muzzleTex !== null) return muzzleTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,242,176,0.85)");
  grad.addColorStop(1, "rgba(255,242,176,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  muzzleTex = new CanvasTexture(c);
  return muzzleTex;
}

// ── The armed figure's actual ROUND (the same bullet everyone else fires) ─────
// Until now the captor's counter-fire and the accomplice's shot reported only as
// a muzzle bloom plus an energy drain: the player was hit by something they never
// saw. These fire the SAME physical bullet as the street enemies and as the
// player's own shot — same GLB, same procedural fallback, same depth convention
// (bulletGeometry.ts) — so a round is a round wherever it comes from.
//
// It is a pure render transient: the QTE tick is frozen and owns the energy rule
// (P3-ACC), so this adds no game state and changes no outcome. It is spawned off
// the SAME two fire edges that already drive the muzzle flashes.
const QTE_BULLET_POOL = 4; // fire cadence is ~1/s; 4 covers any overlap
const QTE_BULLET_TRAVEL_MS = 520; // slow enough to read as a pass, short enough to stay a shot
// How far past the viewport centre the round travels, as a fraction of the LIVE
// viewport half-height. >0.5 so it leaves the frame at the bottom edge rather
// than stopping politely in mid-air.
const QTE_BULLET_EXIT_FACTOR = 0.85;
// Mirrors BulletSprite's ramp: quadratic growth so the round reads as closing on
// the player rather than sliding across the tableau.
const QTE_BULLET_SCALE_MIN = 1.4;
const QTE_BULLET_SCALE_SPAN = 14.6;
// Warm brass, like the player's own tracer — this is a fired round, not neon.
const QTE_BULLET_COLOR = "#ffd9a0";
const QTE_BULLET_EMISSIVE = "#ffb45c";
const QTE_BULLET_EMISSIVE_INTENSITY = 0.65;

const QTE_BULLET_FORWARD = bulletForwardAxis();
const qteBulletScratch = { dir: new Vector3(), quat: new Quaternion() };

interface QteBullet {
  active: boolean;
  born: number;
  ox: number;
  oy: number;
  tx: number;
  ty: number;
}

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
  /**
   * Effective reduced motion (ADR-0054 §3): the shared union signal (prefs toggle OR
   * live OS query), owned once by `useReducedMotionRoot` in App and threaded through
   * GameScene — the ONE authority. Degrades the peek cue / execution flash to a
   * steady, strobe-free form, honouring the in-app toggle as well as the OS query.
   */
  reducedMotion: boolean;
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
 * camera zooms onto and holds. Pooled meshes (world space, same axes as
 * bullets / crosshair): the captor, the hostage shield, the peek cue (wind-up
 * tell + open-window marker), and — on peak-difficulty levels that authored one
 * (`qte.accomplice !== null`, F4 / ADR-0036) — the second armed figure and its
 * muzzle flash. The captor and hostage are positioned ONCE
 * from the static anchor on activation (no per-tick moving-anchor writes); the peek
 * ring instead FOLLOWS the live `qte.targetOffset` each frame (the wandering
 * head-zone centre) alongside its tint/opacity pulse. Visible only while the
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
export function HostageQteSprite({ stateRef, onHostageQte, reducedMotion }: Props): JSX.Element {
  const captorRef = useRef<Mesh>(null);
  const hostageRef = useRef<Mesh>(null);
  const peekCueRef = useRef<Mesh>(null);
  const accompliceRef = useRef<Mesh>(null);
  const muzzleRef = useRef<Mesh>(null);
  // Falling-edge detector for the accomplice wind-up: `telegraphActive` goes
  // true→false exactly when a shot fires (the cooldown resets to a full
  // interval), so that transition is the render-side "shot landed" signal
  // (presentation only — no game rule). Drives the brief muzzle flash.
  const accompliceTellRef = useRef(false);
  const muzzleFlashUntilRef = useRef(0);
  const captorMuzzleRef = useRef<Mesh>(null);
  // Rising-edge detector for the captor's OWN counter-fire: `qte.blownPeeks`
  // increments exactly once per PEEKING→COVERED close that charges the
  // player (P3-ACC — armed only when `qte.accomplice === null`), so a jump in
  // this count is the render-side "he just fired" signal.
  const prevBlownPeeksRef = useRef(0);
  const captorMuzzleFlashUntilRef = useRef(0);
  // Fixed pool of captor-HP pips (diegetic HP read); populated by the JSX ref cbs.
  const pipRefs = useRef<(Mesh | null)[]>([]);
  // The armed figure's in-flight rounds — a pure render transient (see the
  // QTE_BULLET_* block above). `camera` gives the live aim point: the round flies
  // at the player, i.e. at the centre of whatever the QTE zoom is framing.
  const { camera, size } = useThree();
  const qteBulletGroups = useRef<(Group | null)[]>(
    Array.from({ length: QTE_BULLET_POOL }, () => null),
  );
  const qteBulletProcedural = useRef<(Group | null)[]>(
    Array.from({ length: QTE_BULLET_POOL }, () => null),
  );
  const qteBulletModelAttached = useRef<boolean[]>(
    Array.from({ length: QTE_BULLET_POOL }, () => false),
  );
  const qteBullets = useRef<QteBullet[]>(
    Array.from({ length: QTE_BULLET_POOL }, () => ({
      active: false,
      born: 0,
      ox: 0,
      oy: 0,
      tx: 0,
      ty: 0,
    })),
  );
  // Idempotent: the shared singleton dedupes, so warming here too keeps the QTE
  // self-contained rather than depending on BulletSprite having mounted first.
  useEffect(() => {
    void warmBulletModel(`${import.meta.env.BASE_URL}${bulletModelPath()}`);
  }, []);
  // Fire a round from a world-space muzzle at the player. No-op when the pool is
  // saturated — a dropped cosmetic round is always preferable to stealing one
  // that is mid-flight.
  const fireQteBullet = (mx: number, my: number, nowMs: number): void => {
    const slot = qteBullets.current.find((b) => !b.active);
    if (slot === undefined) return;
    // Where "at the player" is, during the QTE. The camera is ZOOMED ONTO THE
    // CAPTOR, so the camera centre sits practically on the muzzle — aiming there
    // gave the round ~0.6 world units of travel and it died on the gun hand
    // without ever crossing the frame. Under an orthographic camera the round
    // cannot actually fly along +Z toward the lens, so the pass is staged in
    // screen space instead: it exits through the BOTTOM of the LIVE viewport,
    // past the viewer, while the scale ramp does the "coming at you" work.
    //
    // The viewport half-height must be read from the LIVE zoom (the QTE zoom is
    // 2.4×, and it eases): a fixed world constant would misjudge the travel by
    // that factor. Same ADR-0040 discipline as the player tracer's own muzzle.
    const ortho = camera as OrthographicCamera;
    const viewH = size.height / ortho.zoom;
    slot.active = true;
    slot.born = nowMs;
    slot.ox = mx;
    slot.oy = my;
    slot.tx = camera.position.x;
    slot.ty = camera.position.y - viewH * QTE_BULLET_EXIT_FACTOR;
  };
  const lastKeyRef = useRef<string>("none");
  // The static tableau is positioned ONCE per activation (the captor never moves);
  // reset when the QTE goes inactive so a fresh QTE re-places from its own anchor.
  const positionedRef = useRef(false);
  // Energy auras (soft shadow + energy-hued glow) for the two duel figures. Each
  // sits one renderOrder band BELOW its figure and slightly behind it in z, so the
  // opaque sprite occludes the glow core and only the rim reads — the hostage's
  // aura therefore never washes over the captor she shields.
  const captorAura = useMemo(
    () => createEntityAura({ renderOrder: 5, glowZ: QTE_Z - 0.02, shadowZ: QTE_Z - 0.03 }),
    [],
  );
  const hostageAura = useMemo(
    () => createEntityAura({ renderOrder: 6, glowZ: HOSTAGE_Z - 0.02, shadowZ: HOSTAGE_Z - 0.03 }),
    [],
  );
  useEffect(
    () => () => {
      captorAura.dispose();
      hostageAura.dispose();
    },
    [captorAura, hostageAura],
  );
  // Reduced motion (UX spec §4.1) now arrives via the `reducedMotion` prop — the
  // shared union signal from `useReducedMotionRoot` (App → GameScene), the ONE
  // authority (ADR-0054 §3) — degrading the peek cue / execution flash to a steady,
  // strobe-free form. No private `matchMedia` poll: the in-app toggle reaches here too.

  useFrame(() => {
    const captor = captorRef.current;
    const hostage = hostageRef.current;
    const peekCue = peekCueRef.current;
    const accomplice = accompliceRef.current;
    const muzzle = muzzleRef.current;
    const captorMuzzle = captorMuzzleRef.current;
    if (
      captor === null ||
      hostage === null ||
      peekCue === null ||
      accomplice === null ||
      muzzle === null ||
      captorMuzzle === null
    )
      return;

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
      accomplice.visible = false;
      muzzle.visible = false;
      captorMuzzle.visible = false;
      accompliceTellRef.current = false;
      muzzleFlashUntilRef.current = 0;
      prevBlownPeeksRef.current = 0;
      captorMuzzleFlashUntilRef.current = 0;
      for (const pip of pipRefs.current) {
        if (pip !== null) pip.visible = false;
      }
      // Retire any round still in flight — the duel is over, nothing may linger
      // into the unfrozen scene behind it.
      for (const b of qteBullets.current) b.active = false;
      for (const g of qteBulletGroups.current) {
        if (g !== null) g.visible = false;
      }
      captorAura.update(AURA_HIDDEN);
      hostageAura.update(AURA_HIDDEN);
      positionedRef.current = false;
      return;
    }

    // Energy auras follow the (static) tableau anchor. Updated per FRAME, not once
    // per activation like the meshes: the hue tracks the live energy, which the
    // duel itself drains.
    const energy = stateRef.current.energy;
    captorAura.update({
      visible: true,
      x: qte.anchor.x,
      y: qte.anchor.y,
      width: QTE_W,
      height: QTE_H,
      energy,
    });
    hostageAura.update({
      visible: true,
      x: qte.anchor.x + HOSTAGE_DX,
      y: qte.anchor.y + HOSTAGE_DY,
      width: HOSTAGE_W,
      height: HOSTAGE_H,
      energy,
    });

    // ── Static placement (once per activation) ────────────────────────────────
    // The captor and hostage never move (the static duel): place those two meshes
    // ONCE from the fixed `qte.anchor` — no per-tick moving-anchor writes. The peek
    // ring's XY is NOT static — it follows the live `qte.targetOffset` each frame
    // below (in addition to its tint/opacity pulse).
    if (!positionedRef.current) {
      captor.position.set(qte.anchor.x, qte.anchor.y, QTE_Z);
      captor.scale.set(QTE_W, QTE_H, 1);
      hostage.position.set(qte.anchor.x + HOSTAGE_DX, qte.anchor.y + HOSTAGE_DY, HOSTAGE_Z);
      hostage.scale.set(HOSTAGE_W, HOSTAGE_H, 1);
      // Captor-HP pips: a static row centred above his head (he never moves), so
      // they are placed ONCE like the captor/hostage. Only their visibility (how
      // many are lit) changes per frame as `captorHp` chips down.
      for (let i = 0; i < CAPTOR_HP_PIPS; i++) {
        const pip = pipRefs.current[i];
        if (pip === null || pip === undefined) continue;
        const spread = (i - (CAPTOR_HP_PIPS - 1) / 2) * PIP_GAP;
        pip.position.set(qte.anchor.x + spread, qte.anchor.y + PIP_DY, PIP_Z);
        pip.scale.set(PIP_SIZE, PIP_SIZE, 1);
        (pip.material as MeshBasicMaterial).color.set(PIP_COLOUR);
      }
      // The accomplice (if this level authored one) stands screen-LEFT of the
      // captor — placed ONCE like the captor (it never moves); only its pose /
      // tint and the muzzle flash change per frame. The muzzle quad is parked at
      // the raised gun. Placement is unconditional (harmless when there is no
      // accomplice: the mesh stays `visible = false` every frame below).
      accomplice.position.set(
        qte.anchor.x + ACCOMPLICE_OFFSET.x,
        qte.anchor.y + ACCOMPLICE_OFFSET.y,
        ACCOMPLICE_Z,
      );
      accomplice.scale.set(ACCOMPLICE_W, ACCOMPLICE_H, 1);
      muzzle.position.set(
        qte.anchor.x + ACCOMPLICE_OFFSET.x + ACCOMPLICE_MUZZLE_DX,
        qte.anchor.y + ACCOMPLICE_OFFSET.y + ACCOMPLICE_MUZZLE_DY,
        ACCOMPLICE_MUZZLE_Z,
      );
      muzzle.scale.set(ACCOMPLICE_MUZZLE_SIZE, ACCOMPLICE_MUZZLE_SIZE, 1);
      (muzzle.material as MeshBasicMaterial).color.set(ACCOMPLICE_MUZZLE_COLOUR);
      // The captor's own muzzle (P3-ACC — lit only on levels with no accomplice),
      // sat on his pistol's barrel, static like the rest of the tableau.
      const captorMuzzleAt = captorMuzzleOffset();
      captorMuzzle.position.set(
        qte.anchor.x + captorMuzzleAt.dx,
        qte.anchor.y + captorMuzzleAt.dy,
        CAPTOR_MUZZLE_Z,
      );
      captorMuzzle.scale.set(CAPTOR_MUZZLE_SIZE, CAPTOR_MUZZLE_SIZE, 1);
      (captorMuzzle.material as MeshBasicMaterial).color.set(CAPTOR_MUZZLE_COLOUR);
      positionedRef.current = true;
    }

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
    // The ring is a CONSTANT size (it no longer grows during the peek); OPACITY
    // alone carries the two beats as a brightness change (brighter for the open
    // PEEKING window than the COVERED wind-up); the open centre keeps the head-shot
    // kill-zone visible. Opacity is hard-capped so it reads as a subtle tell, not a
    // solid block.
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
      // Colour = the anatomy zone under the ring (spatial-colour model); the paired
      // emphasis is the NON-colour a11y channel — vital reads bright/large, off
      // dim/thin — so the payoff/wasted read survives without hue. `cue.intensity`
      // still carries the two-beat wind-up→open peek FORM on top of it.
      const emphasis = ringZoneEmphasis(qte.ringZone);
      // Fixed radius — the reticle no longer GROWS during the peek (Bertrand
      // playtest: "la cible ne devrait pas grossir"). Its size is CONSTANT so the
      // wander reads as MOVEMENT, not a zoom; the wind-up→open tell and the
      // vital/limb/off a11y read ride OPACITY/brightness below (never size).
      peekCue.scale.set(CUE_RADIUS, CUE_RADIUS, 1);
      const cueMat = peekCue.material as MeshBasicMaterial;
      cueMat.color.set(ringZoneColour(qte.ringZone));
      cueMat.opacity = Math.min(
        CUE_OPACITY_MAX,
        (0.15 + 0.3 * cue.intensity) * (0.4 + 0.6 * emphasis),
      );
    }

    // ── Accomplice (the SECOND gun; F4 / ADR-0036) ────────────────────────────
    // Present iff this level authored one (`qte.accomplice !== null` — the
    // null-guard IS the byte-identity with pre-F4 levels). Drawn only through
    // ACTIVE: like the captor tableau it belongs to the live duel, gone on the
    // WON/LOST result holds. Its pose swaps to the gun-raised AIM during the
    // game's `telegraphActive` wind-up (a readable danger held ≥ ACCOMPLICE_TELL
    // seconds by the game), so the shot is seen coming before it lands (P3).
    const acc = qte.accomplice;
    const accompliceOn = acc !== null && qte.phase === "ACTIVE";
    accomplice.visible = accompliceOn;
    if (accompliceOn) {
      const aiming = acc.telegraphActive;
      const accTex = getAccompliceTexture(aiming);
      const accMat = accomplice.material as MeshBasicMaterial;
      if (accTex !== null && accMat.map !== accTex) {
        accMat.map = accTex;
        accMat.needsUpdate = true;
      }
      // Cold steel idle, warming to a warning as the gun raises — NEVER the ring
      // palette (green/yellow), so the accomplice never reads as a kill target.
      accMat.color.set(aiming ? ACCOMPLICE_TINT_AIM : ACCOMPLICE_TINT_IDLE);
      // Falling edge of the wind-up (`telegraphActive` true→false) = a shot just
      // landed (the game reset the cooldown to a full interval). Light the flash;
      // the −8 drain itself reads through the energyFloater in useGameLoop.
      if (accompliceTellRef.current && !aiming) {
        muzzleFlashUntilRef.current = nowMs + ACCOMPLICE_FLASH_MS;
        fireQteBullet(
          qte.anchor.x + ACCOMPLICE_OFFSET.x + ACCOMPLICE_MUZZLE_DX,
          qte.anchor.y + ACCOMPLICE_OFFSET.y + ACCOMPLICE_MUZZLE_DY,
          nowMs,
        );
      }
      accompliceTellRef.current = aiming;
    } else {
      accompliceTellRef.current = false;
      muzzleFlashUntilRef.current = 0;
    }

    // Muzzle flash — one brief bloom after each shot (never a repeating strobe ⇒
    // reduced-motion-safe): it fades over ACCOMPLICE_FLASH_MS under motion and
    // holds steady for the same brief window under reduced motion.
    const flashRemaining = muzzleFlashUntilRef.current - nowMs;
    const flashing = accompliceOn && flashRemaining > 0;
    muzzle.visible = flashing;
    if (flashing) {
      const k = flashRemaining / ACCOMPLICE_FLASH_MS; // 1 → 0 over the window
      (muzzle.material as MeshBasicMaterial).opacity = reducedMotion
        ? ACCOMPLICE_FLASH_OPACITY
        : ACCOMPLICE_FLASH_OPACITY * k;
    }

    // ── Captor's own muzzle flash (P3-ACC — armed only without an accomplice) ─
    // `qte.blownPeeks` jumping is the render-side "he just fired" signal (see the
    // ref comment above): a rising edge, tested against the PREVIOUS frame's
    // count so it fires exactly once per shot, never on a reset (`!active` above
    // already zeroes `prevBlownPeeksRef`). Guarded by `qte.accomplice === null`
    // to mirror the game's own P3-ACC channel selection byte-for-byte — when an
    // accomplice is present the captor stops firing at the player, so no flash.
    const captorFiresHere = qte.accomplice === null;
    if (captorFiresHere && qte.blownPeeks > prevBlownPeeksRef.current) {
      captorMuzzleFlashUntilRef.current = nowMs + CAPTOR_MUZZLE_FLASH_MS;
      const firedFrom = captorMuzzleOffset();
      fireQteBullet(qte.anchor.x + firedFrom.dx, qte.anchor.y + firedFrom.dy, nowMs);
    }
    prevBlownPeeksRef.current = qte.blownPeeks;

    const captorFlashRemaining = captorMuzzleFlashUntilRef.current - nowMs;
    const captorFlashing = qte.phase === "ACTIVE" && captorFlashRemaining > 0;
    captorMuzzle.visible = captorFlashing;
    if (captorFlashing) {
      const ck = captorFlashRemaining / CAPTOR_MUZZLE_FLASH_MS; // 1 → 0 over the window
      (captorMuzzle.material as MeshBasicMaterial).opacity = reducedMotion
        ? CAPTOR_MUZZLE_FLASH_OPACITY
        : CAPTOR_MUZZLE_FLASH_OPACITY * ck;
    }

    // ── The round itself, in flight ───────────────────────────────────────────
    // Straight muzzle→player line over QTE_BULLET_TRAVEL_MS, growing on the same
    // quadratic ramp as the street bullets. Orientation is computed ONCE per
    // round, at spawn, from its own fixed muzzle→target vector plus the shared
    // depth leg — so it never swivels mid-flight (the enemy-bullet lesson).
    const bulletModel = getBulletModel();
    qteBullets.current.forEach((b, i) => {
      const group = qteBulletGroups.current[i] ?? null;
      if (group === null) return;
      if (!b.active) {
        group.visible = false;
        return;
      }
      const t = (nowMs - b.born) / QTE_BULLET_TRAVEL_MS;
      if (t >= 1) {
        b.active = false;
        group.visible = false;
        return;
      }
      group.visible = true;
      group.position.set(b.ox + (b.tx - b.ox) * t, b.oy + (b.ty - b.oy) * t, BULLET_Z);

      const dx = b.tx - b.ox;
      const dy = b.ty - b.oy;
      const inPlane = Math.sqrt(dx * dx + dy * dy);
      if (inPlane > 0) {
        const dz = inPlane * BULLET_DEPTH_RATIO;
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        qteBulletScratch.dir.set(dx / len, dy / len, dz / len);
        qteBulletScratch.quat.setFromUnitVectors(QTE_BULLET_FORWARD, qteBulletScratch.dir);
        group.quaternion.copy(qteBulletScratch.quat);
      }
      group.scale.setScalar(QTE_BULLET_SCALE_MIN + t * t * QTE_BULLET_SCALE_SPAN);

      if (bulletModel !== null && !qteBulletModelAttached.current[i]) {
        qteBulletModelAttached.current[i] = true;
        attachBulletModel(group, bulletModel);
        const procedural = qteBulletProcedural.current[i] ?? null;
        if (procedural !== null) procedural.visible = false;
      }
    });

    // ── Captor HP pips (diegetic, no HUD bar) ─────────────────────────────────
    // Light one pip per remaining HP; they deplete as the captor is chipped. Only
    // during ACTIVE — on WON he is dead (HP 0) / the verdict reads, on LOST the
    // execution reads — so no HP row lingers over a result hold.
    for (let i = 0; i < CAPTOR_HP_PIPS; i++) {
      const pip = pipRefs.current[i];
      if (pip === null || pip === undefined) continue;
      pip.visible = qte.phase === "ACTIVE" && captorHpPipLit(i, qte.captorHp);
    }
  });

  return (
    // renderOrder 6/7 = ABOVE the whole street stack (far row 4, facade ironwork
    // 5, delivery van 5.2/5.25, courier 5.5, near prop row 5.75 — see
    // streetDepth.ts, all of it re-numbered on 2026-07-25): the tableau is a
    // cinematic that stands on the sidewalk in front of the facade AND in front
    // of both prop rows, drawn over the balcony ironwork like every street actor.
    // The hostage's higher order + z draws her over the captor; the peek cue (8)
    // sits on top of both.
    <>
      {/* Energy auras, drawn under their figures (renderOrder 5/6). */}
      <primitive object={captorAura.group} />
      <primitive object={hostageAura.group} />
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
      {/* The accomplice (second gun, F4 / ADR-0036) — renderOrder 6 like the
          captor (a street-actor figure); its muzzle flash (8) sits on top. Both
          stay hidden unless this level authored `qte.accomplice`. */}
      <mesh ref={accompliceRef} renderOrder={6} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial transparent depthWrite={false} />
      </mesh>
      <mesh ref={muzzleRef} renderOrder={8} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={getMuzzleFlashTexture()} transparent depthWrite={false} />
      </mesh>
      {/* The captor's OWN muzzle flash (P3-ACC) — lit only on levels with no
          accomplice, so his counter-fire on a blown peek is finally visible. */}
      <mesh ref={captorMuzzleRef} renderOrder={8} visible={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={getMuzzleFlashTexture()} transparent depthWrite={false} />
      </mesh>
      {/* Diegetic captor-HP pips (renderOrder 8, over the tableau). One per HP
          point; they deplete as `qte.captorHp` chips down. No HUD bar (U-1). */}
      {Array.from({ length: CAPTOR_HP_PIPS }, (_, i) => (
        <mesh
          key={i}
          ref={(m): void => {
            pipRefs.current[i] = m;
          }}
          renderOrder={8}
          visible={false}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
      {/* The armed figure's rounds in flight — same GLB + procedural fallback as
          every other bullet in the game (bulletGeometry.ts). Pooled and hidden;
          driven imperatively above so a shot costs no React re-render. */}
      {Array.from({ length: QTE_BULLET_POOL }, (_, i) => (
        <group
          key={`qte-bullet-${String(i)}`}
          ref={(el): void => {
            qteBulletGroups.current[i] = el;
          }}
          visible={false}
        >
          <group
            ref={(el): void => {
              qteBulletProcedural.current[i] = el;
            }}
          >
            <ProceduralBullet
              color={QTE_BULLET_COLOR}
              emissive={QTE_BULLET_EMISSIVE}
              emissiveIntensity={QTE_BULLET_EMISSIVE_INTENSITY}
            />
          </group>
        </group>
      ))}
    </>
  );
}
