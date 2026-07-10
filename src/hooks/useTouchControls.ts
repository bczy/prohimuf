import { useEffect, useRef } from "react";

export interface TouchControlsState {
  /** One-finger horizontal drag accumulated since last consume, as a fraction of canvas width. */
  panDeltaX: number;
  /** Flick velocity captured at touch release (canvas widths / second). Consumed once. */
  flickVelocityX: number | null;
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
    flickVelocityX: null,
    pendingTaps: [],
  });

  useEffect(() => {
    if (!enabled) return;

    let mode: "idle" | "pan" | "two" = "idle";
    let lastX = 0;
    let history: { x: number; t: number }[] = [];
    let twoStart: { t: number; midX: number; midY: number } | null = null;
    let twoDrifted = false;

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
      e.preventDefault();
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch === undefined) return;
        const pos = normalize(touch.clientX, touch.clientY);
        if (pos === null) return;
        mode = "pan";
        lastX = pos.x;
        history = [{ x: pos.x, t: performance.now() }];
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
      e.preventDefault();
      if (mode === "pan" && e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch === undefined) return;
        const pos = normalize(touch.clientX, touch.clientY);
        if (pos === null) return;
        stateRef.current.panDeltaX += pos.x - lastX;
        lastX = pos.x;
        const now = performance.now();
        history.push({ x: pos.x, t: now });
        history = history.filter((h) => now - h.t <= FLICK_WINDOW_MS);
      } else if (mode === "two" && twoStart !== null) {
        const mid = midpoint(e.touches);
        if (mid === null) return;
        const drift = Math.hypot(mid.x - twoStart.midX, mid.y - twoStart.midY);
        if (drift > TAP_MAX_DRIFT) twoDrifted = true;
      }
    };

    const onTouchEnd = (e: TouchEvent): void => {
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
          const velocity = ((newest.x - oldest.x) / (newest.t - oldest.t)) * 1000;
          if (Math.abs(velocity) >= FLICK_MIN_VELOCITY) {
            stateRef.current.flickVelocityX = velocity;
          }
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
