import { useEffect, useRef } from "react";

export interface MouseState {
  x: number;
  y: number;
  /** Number of clicks pending since last frame. Consumed (decremented) by the gameloop. */
  pendingShots: number;
  /**
   * Signed wheel notches accumulated since the last frame — the DESKTOP focal axis of the
   * photo set-piece. Same consume-once posture as `pendingShots`: the loop reads it and
   * ZEROES it every frame, so a paused frame cannot bank zoom. Untouched outside the
   * set-piece (nothing else reads it), so the camera path stays byte-identical.
   */
  wheelDelta: number;
}

export function useMouse(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): React.RefObject<MouseState> {
  const mouseRef = useRef<MouseState>({ x: 0.5, y: 0.5, pendingShots: 0, wheelDelta: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent): void => {
      const canvas = canvasRef.current;
      if (canvas === null) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        ...mouseRef.current,
        x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
        y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
      };
    };

    const onMouseDown = (e: MouseEvent): void => {
      if (e.button === 0) {
        mouseRef.current = { ...mouseRef.current, pendingShots: mouseRef.current.pendingShots + 1 };
      }
    };

    const onWheel = (e: WheelEvent): void => {
      // Normalised to notches and sign-flipped so "wheel up" = "zoom in" (longer focal),
      // which is the direction every desktop viewer trains the player on.
      mouseRef.current = {
        ...mouseRef.current,
        wheelDelta: mouseRef.current.wheelDelta - Math.sign(e.deltaY),
      };
    };

    const onBlur = (): void => {
      mouseRef.current = { ...mouseRef.current, pendingShots: 0, wheelDelta: 0 };
    };

    // Touch input is handled by useTouchControls (ADR-0003); this hook is mouse-only.
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("blur", onBlur);
    };
  }, [canvasRef]);

  return mouseRef;
}
