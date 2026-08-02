import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { createInitialState, tickGameState } from "@game/systems/stateMachine";
import type { LevelParams } from "@game/systems/stateMachine";
import type { CourierField } from "@game/systems/courierSystem";
import type { LevelRoster } from "@game/levels/levels";
import { useKeyboard } from "@hooks/useKeyboard";
import { useMouse } from "@hooks/useMouse";
import type { TouchControlsState } from "@hooks/useTouchControls";
import type { CameraPan } from "@game/types/cameraPan";
import {
  applyDrag,
  createCameraPan,
  releaseFlick,
  tickCameraPan,
} from "@game/systems/cameraPanSystem";
import type { GameState } from "@game/types/gameState";
import { isOnScreen } from "@game/systems/viewport";
import type { BossQte } from "@game/types/bossQte";
import { fastForwardDeliveryState } from "@render/scene/deliveryHarness";
import type { DeliveryHarnessTarget } from "@render/scene/deliveryHarness";
import type { FacadeMap } from "@game/types/map";
import type { HudData } from "@render/ui/HUD";
import { crosshairToWorld } from "@game/systems/crosshairSystem";
import { isQteActive } from "@game/systems/qteSystem";
import { isBossQteActive } from "@game/systems/bossQteSystem";
import { buildRunSummary } from "@game/systems/runStatsSystem";
import type { ImpactEvent, PlayerHitEvent } from "@game/types/feedback";
import type { Floater } from "@render/scene/FeedbackLayer";
import { energyFloater } from "@render/scene/hostageCue";
import type { CamPose } from "@render/scene/qteCamera";
import {
  BOSS_MOBILE_FRAME_LIFT,
  QTE_RESTORE_SECONDS,
  qtePose,
  qteRestorePose,
  qteZoomInProgress,
} from "@render/scene/qteCamera";

const MAX_DELTA = 0.1;
const DIRECTION_DEAD_ZONE = 0.2;
// Order used by the dev freeze hook to show every enemy type on the contact sheet.
// No "civilian": its window art was retired (ADR-0029) — cycling it would 404 on
// the deleted enemy_civilian.png and draw the fallback cop tinted civilian-green.
const FREEZE_KINDS = ["normal", "riot", "biker", "bonus"] as const;

/**
 * Harness window shape (ADR-0005). Both flags are injected by the verification
 * harness before boot and are NEVER set in production, so the getter and the
 * `play` branch cost nothing on the shipped path. `__MUF_STATE__` is the sole
 * sanctioned read seam — a snapshot getter, never a live handle or a setter.
 */
interface HarnessWindow {
  __MUF_FREEZE_COPS__?: boolean;
  __MUF_PLAY__?: boolean;
  __MUF_STATE__?: () => StateSnapshot;
  /**
   * Boss QTE capture seam: a render-installed factory (see `render/scene/bossHarness.ts`,
   * `?preview=boss&at=…`) that builds a boss already advanced to a target phase by driving the
   * pure API. The real guard is the factory's own presence — it only exists under
   * `?preview=boss` (bossHarness install), never in production. When present AND the booted
   * level authors a boss (`bossQteSpec !== null`), the initial boss state is seeded from it
   * ONCE at boot, so a ~2 fps sandbox can screenshot the depletion-gated ADR-0052 reads
   * (qa-lead C-QA2). Since ADR-0053's C-QA3 seam (`&level=<id>`), that second clause no longer
   * implies non-shipped by itself — the SHIPPED `niveau-final` level can be booted through this
   * same seam over its own backdrop. Reachability for shipped players (no `?preview=boss`
   * param) is unchanged.
   */
  __MUF_BOSS_BOOT__?: () => BossQte;
  /** Re-seed the boss on the blown-window LOSS so an unattended capture stays pinned at its
   *  fast-forwarded phase (`?preview=boss&…&blownImmune=1`). Harness-only. */
  __MUF_BOSS_IMMUNE__?: boolean;
  /** Delivery-assault capture seam target (`?preview=delivery&at=…`, see
   *  `render/scene/deliveryHarness.ts`). Read once at boot, same discipline as
   *  `__MUF_BOSS_BOOT__`. */
  __MUF_DELIVERY_TARGET__?: DeliveryHarnessTarget;
}

/** Read-only state seam payload (ADR-0005): a frozen game + last-HUD snapshot. */
export interface StateSnapshot {
  readonly game: GameState;
  readonly hud: HudData | null;
}

/** Recursively freeze a plain-data value in place (returns the same reference). */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

/**
 * Build the read-only state seam payload (ADR-0005): a deep-frozen structuredClone
 * of the live game state plus the last emitted HudData. Pure and side-effect-free —
 * it COPIES data, it moves no rule. GameState/HudData are plain data (no functions),
 * so the clone is total and the harness can never mutate the live refs.
 */
export function frozenSnapshot(game: GameState, hud: HudData | null): StateSnapshot {
  return Object.freeze({
    game: deepFreeze(structuredClone(game)),
    hud: hud === null ? null : deepFreeze(structuredClone(hud)),
  });
}

function computeTargetIndicator(
  state: GameState,
  facade: FacadeMap,
  crosshairWorld: { x: number; y: number },
): HudData["targetIndicator"] {
  let nearestSlot = null as { x: number; y: number } | null;
  let nearestDistSq = Number.POSITIVE_INFINITY;

  for (const enemy of state.enemies) {
    if (enemy.state === "DEAD" || enemy.state === "HIDDEN" || enemy.state === "HIT") {
      continue;
    }
    const slot = facade.slots[enemy.slotIndex];
    if (slot === undefined) continue;
    const dx = slot.screenPosition.x - crosshairWorld.x;
    const dy = slot.screenPosition.y - crosshairWorld.y;
    const distSq = dx * dx + dy * dy;
    if (distSq < nearestDistSq) {
      nearestDistSq = distSq;
      nearestSlot = { x: slot.screenPosition.x, y: slot.screenPosition.y };
    }
  }

  if (nearestSlot === null) {
    return { up: false, down: false, left: false, right: false };
  }

  return {
    up: nearestSlot.y - crosshairWorld.y > DIRECTION_DEAD_ZONE,
    down: crosshairWorld.y - nearestSlot.y > DIRECTION_DEAD_ZONE,
    left: crosshairWorld.x - nearestSlot.x > DIRECTION_DEAD_ZONE,
    right: nearestSlot.x - crosshairWorld.x > DIRECTION_DEAD_ZONE,
  };
}

/**
 * Off-screen direction cue toward the delivery rendez-vous (telegraph spec D2).
 *
 * Active iff the delivery is in flight (`INCOMING` or `DELIVERING`) AND the
 * rendez-vous point is not framed; `undefined` otherwise, so no glyph renders.
 *
 * Anchored on `deliverySpec.stopPosition`, NOT on the vehicle's live position
 * (correction T-2): during `INCOMING` the van sits at the street's entry edge,
 * OUTSIDE the camera pan clamp and sometimes on the opposite side of the street
 * from the rendez-vous — a cue pointing there would point at a place the player
 * cannot reach, then flip as the van crosses. The stop position is fixed, always
 * inside the clamp, and identical to the vehicle's position once `DELIVERING`.
 *
 * Must be called with the LIVE camera offsets and the LIVE view extents — the same
 * four values this tick hands `tickGameState` (correction T-1). `isOnScreen`'s
 * defaults (18/12) are a lie under the mobile `MOBILE_ZOOM_FACTOR` crop, and the
 * whole point of reusing ADR-0071's own predicate is that the cue and the
 * off-screen enemy freeze can never disagree about what counts as "on screen".
 *
 * Takes only the two state fields it reads (a `Pick`, not the whole `GameState`),
 * so "the cue depends on nothing else" is true by signature. Pure.
 */
export function computeDeliveryDirection(
  state: Pick<GameState, "deliverySpec" | "deliveryVehicle">,
  cameraOffsetX: number,
  cameraOffsetY: number,
  viewW: number,
  viewH: number,
): HudData["deliveryDirection"] {
  const spec = state.deliverySpec;
  const phase = state.deliveryVehicle?.phase;
  if (spec === null || (phase !== "INCOMING" && phase !== "DELIVERING")) return undefined;
  const stop = spec.stopPosition;
  if (isOnScreen(stop, cameraOffsetX, cameraOffsetY, viewW, viewH)) return undefined;
  // Same half-extents as the predicate above, so the per-axis booleans and the
  // on-screen verdict are one computation: an off-frame point lights exactly the
  // axes it overflows (X-only pan ⇒ no vertical glyph, and vice versa — ADR-0008's
  // two-axis pan can push a street actor off the top/bottom, not only off a side).
  return {
    up: stop.y - cameraOffsetY > viewH / 2,
    down: cameraOffsetY - stop.y > viewH / 2,
    left: cameraOffsetX - stop.x > viewW / 2,
    right: stop.x - cameraOffsetX > viewW / 2,
  };
}

function isSameIndicator(
  a: HudData["targetIndicator"] | undefined,
  b: HudData["targetIndicator"] | undefined,
): boolean {
  if (a === undefined && b === undefined) return true;
  if (a === undefined || b === undefined) return false;
  return a.up === b.up && a.down === b.down && a.left === b.left && a.right === b.right;
}

// Map a takedown's effect deltas to a floating label (text + colour), or null.
function floaterFor(ev: {
  scoreDelta: number;
  livesDelta: number;
  timeDelta: number;
}): { text: string; color: string } | null {
  if (ev.livesDelta < 0) return { text: "-1 ♥", color: "#ff6b6b" };
  if (ev.livesDelta > 0) return { text: `+${String(ev.livesDelta)} ♥`, color: "#7CFF7C" };
  if (ev.timeDelta > 0) return { text: `+${String(ev.timeDelta)}s`, color: "#ffe08a" };
  if (ev.scoreDelta > 0) return { text: `+${String(ev.scoreDelta)}`, color: "#bfffd0" };
  if (ev.scoreDelta < 0) return { text: String(ev.scoreDelta), color: "#ff6b6b" };
  return null;
}

/** Mobile swipe controls (ADR-0003): gesture state + the pan clamp's level half-extents. */
export interface MobileControls {
  touchRef: React.RefObject<TouchControlsState>;
  halfWorldWidth: number;
  halfWorldHeight: number;
  /** Base (max) orthographic zoom; the pinch fraction scales this down to zoom out. */
  baseZoom: number;
}

/**
 * Bridge→render transport for player-shot impacts (ADR-0040). Carries the
 * per-frame event queue AND the level-scope reset signal in one ref, so the
 * effects component clears its persistent wall-mark FIFO deterministically.
 */
export interface ImpactChannel {
  // Per-frame queue: the bridge pushes each tick's impactEvents; the effects
  // component splices it empty each frame (single consumer, like Floater[]).
  readonly queue: ImpactEvent[];
  // Monotonic; the bridge bumps it on level RESTART only (mount starts at 0 by
  // design). The effects component clears its wall-mark FIFO + transient pools
  // when it sees this change — how "cleared on level restart" (spec D4.3) lands.
  resetNonce: number;
}

/**
 * Bridge→render transport for enemy-bullet hits on the player (ADR-0065).
 * Mirror of {@link ImpactChannel} in the opposite direction (enemy → player).
 * Same contract: per-frame queue + reset signal bumped on level restart.
 */
export interface PlayerHitChannel {
  readonly queue: PlayerHitEvent[];
  resetNonce: number;
}

export function useGameLoop(
  facade: FacadeMap,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onHudUpdate: (data: HudData) => void,
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void,
  levelParams?: LevelParams,
  paused = false,
  feedbackQueueRef?: React.RefObject<Floater[]>,
  courierField?: CourierField,
  roster?: LevelRoster,
  mobileControls?: MobileControls,
  impactChannelRef?: React.RefObject<ImpactChannel>,
  playerHitChannelRef?: React.RefObject<PlayerHitChannel>,
): React.RefObject<GameState> {
  const keyboardRef = useKeyboard();
  const mouseRef = useMouse(canvasRef);
  const gameStateRef = useRef<GameState>(
    createInitialState(facade, levelParams, roster, courierField),
  );
  // Boss QTE capture seam: if the render layer installed a fast-forward factory
  // (`?preview=boss&at=…`), seed the initial boss state with the pre-advanced BossQte ONCE —
  // so the SwiftShader ~2 fps sandbox can screenshot the depletion-gated ADR-0052
  // differentiation reads without playing to them (qa-lead C-QA2). Guarded by the factory's own
  // presence — it only exists under `?preview=boss` (bossHarness install), never in production
  // — AND by `bossQteSpec !== null`. Since ADR-0053's C-QA3 seam (`&level=<id>`), that second
  // clause no longer implies non-shipped by itself: the SHIPPED `niveau-final` level can be
  // booted through this same seam over its real backdrop. Reachability for shipped players (no
  // `?preview=boss` param) is unchanged — never runs on that path.
  const bossBootedRef = useRef(false);
  if (!bossBootedRef.current) {
    bossBootedRef.current = true;
    const w = typeof window !== "undefined" ? (window as unknown as HarnessWindow) : undefined;
    const boot = w?.__MUF_BOSS_BOOT__;
    if (boot !== undefined && gameStateRef.current.bossQteSpec !== null) {
      gameStateRef.current = { ...gameStateRef.current, bossQte: boot() };
    }
  }
  // Delivery-assault capture seam: if the render layer installed a target
  // (`?preview=delivery&at=…`, see `render/scene/deliveryHarness.ts`), fast-forward the
  // initial state to it ONCE. Unlike the boss seam this has no isolated pure sub-tick to
  // precompute — it drives the SAME `tickGameState` this hook calls every frame, with the
  // SAME `facade`/`courierField`/`roster` already in scope here. Guarded the same way: the
  // target only exists under `?preview=delivery` (deliveryHarness install), never in
  // production, AND by `deliverySpec !== null`.
  const deliveryBootedRef = useRef(false);
  if (!deliveryBootedRef.current) {
    deliveryBootedRef.current = true;
    const w = typeof window !== "undefined" ? (window as unknown as HarnessWindow) : undefined;
    const target = w?.__MUF_DELIVERY_TARGET__;
    if (
      target !== undefined &&
      gameStateRef.current.deliverySpec !== null &&
      courierField !== undefined
    ) {
      gameStateRef.current = fastForwardDeliveryState(
        gameStateRef.current,
        facade,
        courierField,
        levelParams?.enemiesToWin,
        roster,
        target,
      );
    }
  }
  // Viewport state, not a game rule — lives in the bridge, not GameState (ADR-0003).
  const panRef = useRef<CameraPan>(createCameraPan());
  const aimRef = useRef({ x: 0.5, y: 0.5 });
  // QTE cinematic camera (ADR-0030): the pre-QTE pose captured once when the QTE
  // fires (restored to EXACTLY on the way out), and the in-flight restore lerp.
  const qteBaseRef = useRef<CamPose | null>(null);
  const qteRestoreRef = useRef<{ from: CamPose; t: number } | null>(null);
  // Last HudData emitted to onHudUpdate — read (never mutated) by the __MUF_STATE__
  // seam so the harness reads the same view value the HUD renders (ADR-0005).
  const lastHudRef = useRef<HudData | null>(null);
  // Monotonic empty-return counter (ADR-0055 §6.1 / AC10): bumped the tick a special
  // empties (the `weaponEmpty` transient), surfaced to the HUD so its empty-flash
  // replays the SAME frame as the auto-return. Distinct from `impactEvents`.
  const weaponEmptyNonceRef = useRef(0);
  const { camera, size } = useThree();

  useFrame((_state, delta) => {
    if (paused) return;
    const safeDelta = Math.min(delta, MAX_DELTA);
    const prev = gameStateRef.current;
    const mouse = mouseRef.current;
    const ortho = camera as OrthographicCamera;

    // Mobile pinch-zoom (ADR-0003): apply the committed zoom fraction BEFORE
    // deriving the view extents, so the pan clamp below reflects the current
    // framing (zooming out widens the view and shrinks the pan range).
    const touch = mobileControls?.touchRef.current;
    // While the QTE cinematic runs, its zoom driver (below) owns ortho.zoom —
    // applying the pinch zoom here would desync the aim mapping (viewW/viewH
    // derive from ortho.zoom before the tick) from the displayed framing.
    if (
      mobileControls !== undefined &&
      touch !== undefined &&
      !isQteActive(prev.qte) &&
      !isBossQteActive(prev.bossQte)
    ) {
      const zoom = mobileControls.baseZoom * touch.zoom;
      if (ortho.zoom !== zoom) {
        ortho.zoom = zoom;
        ortho.updateProjectionMatrix();
      }
    }

    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;

    // Mobile (ADR-0003): consume swipe gestures — pan the camera with inertia
    // (pure cameraPanSystem math) and dequeue at most one two-finger tap as a
    // shot at its midpoint. Runs before the tick so cameraOffsetX is current.
    // While the QTE holds the scene frozen the cinematic zoom below owns the
    // camera; skip the inertial pan so the two don't fight over its position
    // (taps are still dequeued below as QTE shots).
    if (
      mobileControls !== undefined &&
      touch !== undefined &&
      !isQteActive(prev.qte) &&
      !isBossQteActive(prev.bossQte)
    ) {
      const rangeX = Math.max(0, mobileControls.halfWorldWidth - viewW / 2);
      const rangeY = Math.max(0, mobileControls.halfWorldHeight - viewH / 2);
      const range = { x: rangeX, y: rangeY };
      if (touch.panDeltaX !== 0 || touch.panDeltaY !== 0) {
        // X: content follows finger → drag right = camera left (−).
        // Y: screen-y grows downward, world-y upward → sign OPPOSITE X: drag DOWN raises camera.y.
        panRef.current = applyDrag(
          panRef.current,
          { x: -touch.panDeltaX * viewW, y: touch.panDeltaY * viewH },
          range,
        );
        touch.panDeltaX = 0;
        touch.panDeltaY = 0;
      }
      if (touch.flickVelocityX !== null || touch.flickVelocityY !== null) {
        panRef.current = releaseFlick(panRef.current, {
          x: -(touch.flickVelocityX ?? 0) * viewW,
          y: (touch.flickVelocityY ?? 0) * viewH,
        });
        touch.flickVelocityX = null;
        touch.flickVelocityY = null;
      }
      const ticked = tickCameraPan(panRef.current, safeDelta, range);
      // Re-clamp against range every frame: a pinch-out this frame can shrink
      // the pan range, so a resting camera must be pulled back inside bounds
      // (tickCameraPan only clamps while a glide is active).
      panRef.current = {
        ...ticked,
        x: Math.max(-range.x, Math.min(range.x, ticked.x)),
        y: Math.max(-range.y, Math.min(range.y, ticked.y)),
      };
      camera.position.x = panRef.current.x;
      camera.position.y = panRef.current.y;
    }

    const pendingTap = touch?.pendingTaps.shift();
    const hasPendingShot = mouse.pendingShots > 0 || pendingTap !== undefined;

    if (
      (prev.phase === "GAME_OVER" || prev.phase === "LEVEL_COMPLETE") &&
      (hasPendingShot || keyboardRef.current.restart)
    ) {
      mouseRef.current.pendingShots = 0;
      if (touch !== undefined) touch.pendingTaps = [];
      // Level restart: bump the reset signal so the effects layer clears its
      // persistent wall-mark FIFO on a clean facade (spec D4.3).
      if (impactChannelRef?.current) impactChannelRef.current.resetNonce += 1;
      if (playerHitChannelRef?.current) playerHitChannelRef.current.resetNonce += 1;
      gameStateRef.current = createInitialState(facade, levelParams, roster, courierField);
      return;
    }

    const didFire = hasPendingShot;
    mouseRef.current.pendingShots = Math.max(0, mouse.pendingShots - 1);
    // NB: the shoot cue is NOT played here on the raw input gesture. Under the weapon
    // system (ADR-0055) a press can resolve into 0..3 hitscan resolutions across ticks —
    // a refractory/mid-burst tap is swallowed (0), a burst emits one round per later tick,
    // a spread press emits up to 3 in one tick. Keying the cue off the gesture would play
    // a phantom shot for a swallowed tap, stay silent for burst rounds 2..N, and play once
    // for a 3-impact spread. So the cue fires AFTER the tick, off resolution activity
    // (`next.impactEvents`), below — one cue per tick with ≥1 resolution (MINEUR-1).

    // On mobile the crosshair sits at the last tap; on desktop it tracks the mouse.
    if (pendingTap !== undefined) aimRef.current = pendingTap;
    const aimX = mobileControls !== undefined ? aimRef.current.x : mouse.x;
    const aimY = mobileControls !== undefined ? aimRef.current.y : mouse.y;

    // Captured, not re-read at the push site: the QTE cinematic below moves
    // `camera.position` after the tick, and the delivery cue must read the EXACT
    // offsets the tick fed `isOnScreen` (T-1) so it can never disagree with
    // ADR-0071's off-screen freeze — including while a cinematic holds the camera.
    const tickCameraX = camera.position.x;
    const tickCameraY = camera.position.y;

    const next = tickGameState(
      prev,
      didFire,
      aimX,
      aimY,
      safeDelta,
      facade,
      tickCameraX,
      tickCameraY,
      viewW,
      viewH,
      levelParams?.enemiesToWin,
      courierField,
      roster,
    );
    // Dev/screenshot hook: when set, put one VISIBLE cop (no shooting) in every
    // window so contact-sheet captures show cop-vs-window proportion across the
    // whole facade. Never set in production.
    const harness =
      typeof window !== "undefined" ? (window as unknown as HarnessWindow) : undefined;
    const frozen = harness?.__MUF_FREEZE_COPS__ === true;
    // ADR-0005 un-frozen "play" mode: the real tick advances untouched (couriers
    // move, the QTE simulates). Mutually exclusive with the freeze hook — fail
    // loud rather than silently pick one. When play is set, `frozen` is false, so
    // the freeze branch below is byte-identical to the shipped path.
    const play = harness?.__MUF_PLAY__ === true;
    if (play && frozen) {
      throw new Error("__MUF_PLAY__ and __MUF_FREEZE_COPS__ are mutually exclusive");
    }
    // Install the read-only state seam once, only under the harness play flag, so
    // production carries no getter. The closure reads the live refs at call time
    // and returns a frozen snapshot — a copy, never a live handle (ADR-0005).
    if (harness !== undefined && play && harness.__MUF_STATE__ === undefined) {
      harness.__MUF_STATE__ = () => frozenSnapshot(gameStateRef.current, lastHudRef.current);
    }
    gameStateRef.current = frozen
      ? {
          ...next,
          enemies: facade.slots.map((_slot, i) => ({
            id: i,
            slotIndex: i,
            state: "VISIBLE" as const,
            timer: 999,
            kind: FREEZE_KINDS[i % FREEZE_KINDS.length] ?? "normal",
            hp: 1,
          })),
        }
      : next;

    // Boss QTE capture seam (harness-only): with `blownImmune`, re-seed the boss the moment
    // the blown-window clock LOSES it — the exact clock that made the depletion-gated reads
    // unreachable (qa-lead C-QA2) — so an unattended capture stays pinned at its
    // fast-forwarded phase. Bounded (only on the LOST transition), view-side, pure-API. Never
    // set in production.
    if (
      harness?.__MUF_BOSS_IMMUNE__ === true &&
      harness.__MUF_BOSS_BOOT__ !== undefined &&
      gameStateRef.current.bossQte?.phase === "LOST"
    ) {
      gameStateRef.current = { ...gameStateRef.current, bossQte: harness.__MUF_BOSS_BOOT__() };
    }

    // QTE cinematic camera (ADR-0030, the static duel): while EITHER QTE is active,
    // capture the pre-QTE pose ONCE, then progressively zoom onto the actor's STATIC
    // `anchor` and HOLD there (no follow — the actor never moves). The zoom eases in
    // during ZOOMING and pins fully in during ACTIVE / WON / LOST. When it ends, ease
    // back to the captured base over QTE_RESTORE_SECONDS and restore it EXACTLY. Runs
    // after the tick so it reads this frame's fresh phase/timers. The boss QTE
    // (ADR-0051) exposes the SAME `{ anchor, phase, zoomRemaining, zoomSeconds }`
    // shape, so the driver generalises unchanged — it drives whichever QTE is live
    // (never both: the boss triggers on quota-completion, after any hostage QTE has
    // long resolved).
    const hostageQte = gameStateRef.current.qte;
    const bossQte = gameStateRef.current.bossQte;
    const camQte = isQteActive(hostageQte) ? hostageQte : isBossQteActive(bossQte) ? bossQte : null;
    if (camQte !== null) {
      qteBaseRef.current ??= { zoom: ortho.zoom, x: camera.position.x, y: camera.position.y };
      qteRestoreRef.current = null;
      const p = qteZoomInProgress(camQte.phase, camQte.zoomRemaining, camQte.zoomSeconds);
      // Mobile boss framing lift (§21): raise the camera TARGET above the boss anchor so the
      // tableau drops on screen and the vital band clears the fixed-footprint BossHpBar. Boss-only,
      // mobile-only; the hostage path, the desktop path, and the qteBaseRef restore are untouched.
      const camAnchor =
        mobileControls !== undefined && camQte === bossQte
          ? { x: camQte.anchor.x, y: camQte.anchor.y + BOSS_MOBILE_FRAME_LIFT }
          : camQte.anchor;
      const pose = qtePose(qteBaseRef.current, camAnchor, p);
      ortho.zoom = pose.zoom;
      camera.position.x = pose.x;
      camera.position.y = pose.y;
      ortho.updateProjectionMatrix();
    } else if (qteBaseRef.current !== null) {
      const base = qteBaseRef.current;
      qteRestoreRef.current ??= {
        from: { zoom: ortho.zoom, x: camera.position.x, y: camera.position.y },
        t: 0,
      };
      const restore = qteRestoreRef.current;
      restore.t = Math.min(1, restore.t + safeDelta / QTE_RESTORE_SECONDS);
      if (restore.t >= 1) {
        ortho.zoom = base.zoom;
        camera.position.x = base.x;
        camera.position.y = base.y;
        qteBaseRef.current = null;
        qteRestoreRef.current = null;
      } else {
        const pose = qteRestorePose(restore.from, base, restore.t);
        ortho.zoom = pose.zoom;
        camera.position.x = pose.x;
        camera.position.y = pose.y;
      }
      ortho.updateProjectionMatrix();
    }

    // Floating feedback for each takedown: bonus time, civilian penalty, score.
    // A non-zero energyDelta floats a second "⚡" label just above, so both the
    // score and the energy hit are read. (During the hostage QTE the frozen tick
    // emits no feedback events — its energy swings are read on the persistent global
    // énergie bar instead; the QTE-local HUD gauge and result chip were removed by
    // ADR-0034.)
    const queue = feedbackQueueRef?.current;
    if (queue && next.feedback) {
      for (const ev of next.feedback) {
        const slot = facade.slots[ev.slotIndex];
        if (slot === undefined) continue;
        const f = floaterFor(ev);
        if (f) queue.push({ x: slot.screenPosition.x, y: slot.screenPosition.y, ...f });
        const e = energyFloater(ev.energyDelta);
        if (e) queue.push({ x: slot.screenPosition.x, y: slot.screenPosition.y + 0.7, ...e });
      }
    }
    // Courier-hit feedback is anchored to its world position.
    if (queue && next.pointFeedback) {
      for (const ev of next.pointFeedback) {
        const f = floaterFor(ev);
        if (f) queue.push({ x: ev.x, y: ev.y, ...f });
        const e = energyFloater(ev.energyDelta);
        if (e) queue.push({ x: ev.x, y: ev.y + 0.7, ...e });
      }
    }
    // Player-shot impacts: drain onto the channel queue for the effects layer
    // (explosion, wall marks). Single consumer splices it each frame.
    const impactChannel = impactChannelRef?.current;
    if (impactChannel && next.impactEvents) {
      for (const ev of next.impactEvents) impactChannel.queue.push(ev);
    }
    // Enemy → player hits: same drain pattern, mirror direction (ADR-0065).
    const playerHitChannel = playerHitChannelRef?.current;
    if (playerHitChannel && next.playerHitEvents) {
      for (const ev of next.playerHitEvents) playerHitChannel.queue.push(ev);
    }
    // Shoot cue (ADR-0055 MINEUR-1): keyed off RESOLUTION ACTIVITY, not the input gesture.
    // `impactEvents` is the per-tick transient set of player-shot resolutions (0..3), so a
    // single cue when it is non-empty gives the correct model on every weapon: base/miss →
    // 1 (unchanged, a fired tap always resolves ≥1 impact); burst → one pop per round-tick
    // (the sulfateuse rattle); spread press → 1 cue for the fan; refractory/mid-burst
    // swallowed tap → silent. Base/no-loot levels are byte-identical to the old behaviour.
    if (next.impactEvents !== undefined && next.impactEvents.length > 0) {
      playSfx("shoot");
    }
    // Weapon empty-return cue (ADR-0055 §6.1 / AC10 / W3): the tick a special empties
    // and auto-returns to `base`, fire the audible cue (culasse à vide) AND bump the
    // HUD flash nonce the SAME frame — never a silently-failed shot. V1 reuses the
    // shipped `death` SFX slot for the culasse-à-vide (spec §6.1: existing SFX
    // acceptable; a dedicated cue asset is a fast-follow — see the handoff note).
    if (next.weaponEmpty === true) {
      weaponEmptyNonceRef.current += 1;
      playSfx("death");
    }

    const nextCrosshairWorld = crosshairToWorld(
      next.crosshair,
      camera.position.x,
      camera.position.y,
      viewW,
      viewH,
    );
    const prevCrosshairWorld = crosshairToWorld(
      prev.crosshair,
      camera.position.x,
      camera.position.y,
      viewW,
      viewH,
    );

    const targetIndicator = computeTargetIndicator(next, facade, nextCrosshairWorld);
    const prevTargetIndicator = computeTargetIndicator(prev, facade, prevCrosshairWorld);
    const deliveryDirection = computeDeliveryDirection(
      next,
      tickCameraX,
      tickCameraY,
      viewW,
      viewH,
    );

    if (
      next.score !== prev.score ||
      next.lives !== prev.lives ||
      Math.floor(next.timeRemaining) !== Math.floor(prev.timeRemaining) ||
      next.phase !== prev.phase ||
      next.wave !== prev.wave ||
      next.energy !== prev.energy ||
      // Weapon glyph / stock changed (equip, burst-round decrement, auto-return) or a
      // special emptied this tick — push so the fuel gauge + empty-flash stay live.
      next.weapon.active !== prev.weapon.active ||
      next.weapon.stock !== prev.weapon.stock ||
      next.weaponEmpty === true ||
      !isSameIndicator(prevTargetIndicator, targetIndicator) ||
      // The delivery cue turns on/off with the CAMERA, not with the game state, so
      // it is compared against the value last PUSHED (not against `prev`, which
      // would be re-derived from this same camera and so almost never differ).
      // Without this term the cue would refresh at the 1 Hz `Math.floor(timeRemaining)`
      // cadence — a direction arrow up to a second stale (D2.6, Karim's advisory).
      !isSameIndicator(lastHudRef.current?.deliveryDirection, deliveryDirection)
    ) {
      // Project the finished run once the phase is terminal (ADR-0076 D6). The
      // loop keeps TICKING in a terminal phase — the early-return above is
      // conditioned on a RESTART INPUT, not on the phase — so this push can fire
      // again (the camera-driven delivery-arrow term alone can trigger it) and
      // hand out a NEW `RunSummary` object carrying the same frozen numbers. The
      // derivation is value-idempotent, never identity-stable: consumers must key
      // their side-effects on the run identity, not on this object (see the
      // end-of-run effect in `App.tsx`). The render never touches `next.stats`.
      const runSummary =
        next.phase === "GAME_OVER" || next.phase === "LEVEL_COMPLETE"
          ? buildRunSummary(next)
          : undefined;
      const hudData: HudData = {
        score: next.score,
        lives: next.lives,
        timeRemaining: next.timeRemaining,
        phase: next.phase,
        wave: next.wave,
        energy: next.energy,
        targetIndicator,
        deliveryDirection,
        weapon: { active: next.weapon.active, stock: next.weapon.stock },
        weaponEmptyNonce: weaponEmptyNonceRef.current,
        runSummary,
      };
      // Cache for the __MUF_STATE__ read seam (ADR-0005) before handing it out.
      lastHudRef.current = hudData;
      onHudUpdate(hudData);
    }
  });

  return gameStateRef;
}
