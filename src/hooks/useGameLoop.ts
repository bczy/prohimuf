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
import type { FacadeMap } from "@game/types/map";
import type { HudData } from "@render/ui/HUD";
import { crosshairToWorld } from "@game/systems/crosshairSystem";
import type { Floater } from "@render/scene/FeedbackLayer";

const MAX_DELTA = 0.1;
const DIRECTION_DEAD_ZONE = 0.2;
// Order used by the dev freeze hook to show every enemy type on the contact sheet.
const FREEZE_KINDS = ["normal", "riot", "biker", "civilian", "bonus"] as const;

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
): React.RefObject<GameState> {
  const keyboardRef = useKeyboard();
  const mouseRef = useMouse(canvasRef);
  const gameStateRef = useRef<GameState>(createInitialState(facade, levelParams, roster));
  // Viewport state, not a game rule — lives in the bridge, not GameState (ADR-0003).
  const panRef = useRef<CameraPan>(createCameraPan());
  const aimRef = useRef({ x: 0.5, y: 0.5 });
  const { camera, size } = useThree();

  useFrame((_state, delta) => {
    if (paused) return;
    const safeDelta = Math.min(delta, MAX_DELTA);
    const prev = gameStateRef.current;
    const mouse = mouseRef.current;
    const ortho = camera as OrthographicCamera;
    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;

    // Mobile (ADR-0003): consume swipe gestures — pan the camera with inertia
    // (pure cameraPanSystem math) and dequeue at most one two-finger tap as a
    // shot at its midpoint. Runs before the tick so cameraOffsetX is current.
    const touch = mobileControls?.touchRef.current;
    if (mobileControls !== undefined && touch !== undefined) {
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
      panRef.current = tickCameraPan(panRef.current, safeDelta, range);
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
      gameStateRef.current = createInitialState(facade, levelParams, roster);
      return;
    }

    const didFire = hasPendingShot;
    mouseRef.current.pendingShots = Math.max(0, mouse.pendingShots - 1);
    if (didFire) playSfx("shoot");

    // On mobile the crosshair sits at the last tap; on desktop it tracks the mouse.
    if (pendingTap !== undefined) aimRef.current = pendingTap;
    const aimX = mobileControls !== undefined ? aimRef.current.x : mouse.x;
    const aimY = mobileControls !== undefined ? aimRef.current.y : mouse.y;

    const next = tickGameState(
      prev,
      didFire,
      aimX,
      aimY,
      safeDelta,
      facade,
      camera.position.x,
      camera.position.y,
      viewW,
      viewH,
      levelParams?.enemiesToWin,
      courierField,
      roster,
    );
    // Dev/screenshot hook: when set, put one VISIBLE cop (no shooting) in every
    // window so contact-sheet captures show cop-vs-window proportion across the
    // whole facade. Never set in production.
    const frozen =
      typeof window !== "undefined" &&
      (window as unknown as { __MUF_FREEZE_COPS__?: boolean }).__MUF_FREEZE_COPS__ === true;
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

    // Floating feedback for each takedown: bonus time, civilian penalty, score.
    const queue = feedbackQueueRef?.current;
    if (queue && next.feedback) {
      for (const ev of next.feedback) {
        const slot = facade.slots[ev.slotIndex];
        if (slot === undefined) continue;
        const f = floaterFor(ev);
        if (f) queue.push({ x: slot.screenPosition.x, y: slot.screenPosition.y, ...f });
      }
    }
    // Courier-hit feedback is anchored to the courier's world position.
    if (queue && next.pointFeedback) {
      for (const ev of next.pointFeedback) {
        const f = floaterFor(ev);
        if (f) queue.push({ x: ev.x, y: ev.y, ...f });
      }
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

    if (
      next.score !== prev.score ||
      next.lives !== prev.lives ||
      Math.floor(next.timeRemaining) !== Math.floor(prev.timeRemaining) ||
      next.phase !== prev.phase ||
      next.wave !== prev.wave ||
      !isSameIndicator(prevTargetIndicator, targetIndicator)
    ) {
      onHudUpdate({
        score: next.score,
        lives: next.lives,
        timeRemaining: next.timeRemaining,
        phase: next.phase,
        wave: next.wave,
        targetIndicator,
      });
    }
  });

  return gameStateRef;
}
