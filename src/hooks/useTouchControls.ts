import { useEffect, useRef } from "react";
import {
  isTapGesture,
  isDoubleTap,
  TAP_MAX_MS,
  TAP_MAX_DRIFT,
} from "@game/systems/tapGestureSystem";
import type { Tap } from "@game/systems/tapGestureSystem";

export interface TouchControlsState {
  /** One-finger horizontal drag accumulated since last consume, as a fraction of canvas width. */
  panDeltaX: number;
  /** One-finger vertical drag accumulated since last consume, as a fraction of canvas height. */
  panDeltaY: number;
  /** Flick velocity captured at touch release (canvas widths / second). Consumed once. */
  flickVelocityX: number | null;
  /** Flick velocity captured at touch release (canvas heights / second). Consumed once. */
  flickVelocityY: number | null;
  /**
   * Shoot points in normalized [0..1] canvas coords, consumed one per frame: a two-finger
   * tap queues its midpoint; a one-finger double-tap queues its second tap's point.
   */
  pendingTaps: { x: number; y: number }[];
}

// Tap classification (short + still) and the double-tap pairing rule are pure game logic
// (`@game/systems/tapGestureSystem`); TAP_MAX_MS / TAP_MAX_DRIFT also gate the two-finger tap.
// Flick velocity is measured over the trailing window of the drag.
const FLICK_WINDOW_MS = 100;
const FLICK_MIN_VELOCITY = 0.05;

/**
 * Mobile gesture bridge (ADR-0003): one finger pans; a two-finger tap OR a one-finger
 * double-tap shoots (D7). DOM plumbing only — the tap/double-tap rules are pure game logic
 * (`@game/systems/tapGestureSystem`). Listeners are non-passive so taps never become browser
 * pinch/double-tap zoom, and so no synthetic mouse events reach useMouse.
 */
export function useTouchControls(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  enabled: boolean,
): React.RefObject<TouchControlsState> {
  const stateRef = useRef<TouchControlsState>({
    panDeltaX: 0,
    panDeltaY: 0,
    flickVelocityX: null,
    flickVelocityY: null,
    pendingTaps: [],
  });

  useEffect(() => {
    if (!enabled) return;

    let mode: "idle" | "pan" | "two" = "idle";
    let lastX = 0;
    let lastY = 0;
    let history: { x: number; y: number; t: number }[] = [];
    let twoStart: { t: number; midX: number; midY: number } | null = null;
    let twoDrifted = false;
    // One-finger tap tracking for the double-tap shoot: the current touch's start and
    // running max drift, plus the previous qualifying tap (null when none is pending).
    let oneStart: { t: number; x: number; y: number } | null = null;
    let oneDrift = 0;
    let lastTap: Tap | null = null;

    // On-screen UI (fullscreen button, etc.) carries data-muf-ui: those touches
    // belong to the DOM controls, so the gesture layer ignores them entirely and
    // never calls preventDefault, letting the native tap/click through.
    const isUiTarget = (e: TouchEvent): boolean =>
      e.target instanceof Element && e.target.closest("[data-muf-ui]") !== null;

    const normalize = (clientX: number, clientY: number): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (canvas === null) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
      };
    };

    const midpoint = (touches: TouchList): { x: number; y: number } | null => {
      const [a, b] = [touches[0], touches[1]];
      if (a === undefined || b === undefined) return null;
      return normalize((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    };

    const onTouchStart = (e: TouchEvent): void => {
      if (isUiTarget(e)) return;
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch === undefined) return;
        const pos = normalize(touch.clientX, touch.clientY);
        if (pos === null) return;
        mode = "pan";
        lastX = pos.x;
        lastY = pos.y;
        const now = performance.now();
        history = [{ x: pos.x, y: pos.y, t: now }];
        oneStart = { t: now, x: pos.x, y: pos.y };
        oneDrift = 0;
      } else if (e.touches.length === 2) {
        const mid = midpoint(e.touches);
        if (mid === null) return;
        mode = "two";
        twoStart = { t: performance.now(), midX: mid.x, midY: mid.y };
        twoDrifted = false;
        // A two-finger gesture breaks any pending one-finger double-tap.
        lastTap = null;
      } else {
        mode = "idle";
      }
    };

    const onTouchMove = (e: TouchEvent): void => {
      if (isUiTarget(e)) return;
      e.preventDefault();
      if (mode === "pan" && e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch === undefined) return;
        const pos = normalize(touch.clientX, touch.clientY);
        if (pos === null) return;
        stateRef.current.panDeltaX += pos.x - lastX;
        stateRef.current.panDeltaY += pos.y - lastY;
        lastX = pos.x;
        lastY = pos.y;
        const now = performance.now();
        history.push({ x: pos.x, y: pos.y, t: now });
        history = history.filter((h) => now - h.t <= FLICK_WINDOW_MS);
        if (oneStart !== null) {
          oneDrift = Math.max(oneDrift, Math.hypot(pos.x - oneStart.x, pos.y - oneStart.y));
        }
      } else if (mode === "two" && twoStart !== null) {
        const mid = midpoint(e.touches);
        if (mid === null) return;
        const drift = Math.hypot(mid.x - twoStart.midX, mid.y - twoStart.midY);
        if (drift > TAP_MAX_DRIFT) twoDrifted = true;
      }
    };

    const onTouchEnd = (e: TouchEvent): void => {
      if (isUiTarget(e)) return;
      e.preventDefault();
      if (mode === "two" && twoStart !== null && e.touches.length < 2) {
        if (!twoDrifted && performance.now() - twoStart.t <= TAP_MAX_MS) {
          stateRef.current.pendingTaps.push({ x: twoStart.midX, y: twoStart.midY });
        }
        twoStart = null;
        // The remaining finger (if any) must lift before a new gesture starts.
        mode = "idle";
      } else if (mode === "pan" && e.touches.length === 0) {
        const now = performance.now();
        if (oneStart !== null && isTapGesture(now - oneStart.t, oneDrift)) {
          // A still one-finger tap never seeds pan inertia; it only ever pairs into a
          // double-tap shoot. Fire at the second tap's point when it matches the first.
          const current: Tap = { t: now, x: lastX, y: lastY };
          if (isDoubleTap(lastTap, current)) {
            stateRef.current.pendingTaps.push({ x: lastX, y: lastY });
            lastTap = null;
          } else {
            lastTap = current;
          }
        } else {
          // A real drag: break any pending double-tap and release flick inertia.
          lastTap = null;
          const newest = history[history.length - 1];
          const oldest = history[0];
          if (newest !== undefined && oldest !== undefined && newest.t > oldest.t) {
            const dt = newest.t - oldest.t;
            // Both axis velocities come from the SAME trailing window, each gated
            // independently so a purely horizontal flick seeds no vertical inertia.
            const vx = ((newest.x - oldest.x) / dt) * 1000;
            const vy = ((newest.y - oldest.y) / dt) * 1000;
            if (Math.abs(vx) >= FLICK_MIN_VELOCITY) stateRef.current.flickVelocityX = vx;
            if (Math.abs(vy) >= FLICK_MIN_VELOCITY) stateRef.current.flickVelocityY = vy;
          }
        }
        oneStart = null;
        mode = "idle";
      } else if (e.touches.length === 0) {
        mode = "idle";
      }
    };

    const onTouchCancel = (): void => {
      mode = "idle";
      twoStart = null;
      oneStart = null;
      lastTap = null;
      history = [];
      stateRef.current.flickVelocityX = null;
      stateRef.current.flickVelocityY = null;
    };

    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: false });
    window.addEventListener("touchcancel", onTouchCancel);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [canvasRef, enabled]);

  return stateRef;
}
