import { useEffect, useRef } from "react";

export interface MouseState {
  x: number;
  y: number;
  fire: boolean;
}

export function useMouse(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): React.RefObject<MouseState> {
  const mouseRef = useRef<MouseState>({ x: 0.5, y: 0.5, fire: false });

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
        mouseRef.current = { ...mouseRef.current, fire: true };
      }
    };

    const onMouseUp = (e: MouseEvent): void => {
      if (e.button === 0) {
        mouseRef.current = { ...mouseRef.current, fire: false };
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [canvasRef]);

  return mouseRef;
}
