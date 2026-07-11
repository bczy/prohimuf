import { useEffect, useRef } from "react";

export interface TouchControlsState {
  /** One-finger horizontal drag accumulated since last consume, as a fraction of canvas width. */
  panDeltaX: number;
  /** One-finger vertical drag accumulated since last consume, as a fraction of canvas height. */
  panDeltaY: number;
  /** Flick velocity captured at touch release (canvas widths / second). Consumed once. */
  flickVelocityX: number | null;
  /** Flick velocity captured at touch release (canvas heights / second). Consumed once. */
  flickVelocityY: number | null;
  /** Two-finger tap midpoints in normalized [0..1] canvas coords. Consumed one per frame. */
  pendingTaps: { x: number; y: number }[];
}

// A two-finger touch counts as a tap (= one shot) only if it is short and still.
const TAP_MAX_MS = 300;
const TAP_MAX_DRIFT = 0.03;
// Flick velocity is measured over the trailing window of the drag.
const FLICK_WINDOW_MS = 100;
const FLICK_MIN_VELOCITY = 0.05;

/**
 * Mobile gesture bridge (ADR-0003): one finger pans, a two-finger tap shoots.
 * DOM plumbing only — all frame math stays in the pure game layer. Listeners
 * are non-passive so two-finger taps never become browser pinch-zoom, and so
 * no synthetic mouse events reach useMouse.
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
        history = [{ x: pos.x, y: pos.y, t: performance.now() }];
      } else if (e.touches.length === 2) {
        const mid = midpoint(e.touches);
        if (mid === null) return;
        mode = "two";
        twoStart = { t: performance.now(), midX: mid.x, midY: mid.y };
        twoDrifted = false;
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
        mode = "idle";
      } else if (e.touches.length === 0) {
        mode = "idle";
      }
    };

    const onTouchCancel = (): void => {
      mode = "idle";
      twoStart = null;
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
