import { useCallback, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export type RovingAxis = "vertical" | "horizontal";

export interface RovingOptions {
  /** Arrow axis: up/down (default) vs left/right. */
  axis?: RovingAxis;
  /** Wrap past the ends instead of clamping (default false). */
  wrap?: boolean;
  /** Enter on the focused item. */
  onActivate?: (index: number) => void;
}

export interface RovingIndex {
  index: number;
  setIndex: (i: number) => void;
  onKeyDown: (e: ReactKeyboardEvent) => void;
}

const NEXT_KEY: Record<RovingAxis, string> = {
  vertical: "ArrowDown",
  horizontal: "ArrowRight",
};
const PREV_KEY: Record<RovingAxis, string> = {
  vertical: "ArrowUp",
  horizontal: "ArrowLeft",
};

/**
 * Keys that activate the focused item (WAI-ARIA: Enter AND Space). Pure so the
 * activation branch of {@link useRovingIndex} is unit-testable without a DOM.
 */
export function isActivateKey(key: string): boolean {
  return key === "Enter" || key === " ";
}

/**
 * Pure roving-focus transition: the next focused index for a key press, clamped or
 * wrapped. Movement keys are the axis arrows; any other key returns `current`. This
 * is the unit-tested core of {@link useRovingIndex}.
 */
export function nextRovingIndex(
  current: number,
  key: string,
  count: number,
  opts?: Pick<RovingOptions, "axis" | "wrap">,
): number {
  if (count <= 0) return current;
  const axis = opts?.axis ?? "vertical";
  const forward = key === NEXT_KEY[axis];
  const backward = key === PREV_KEY[axis];
  if (!forward && !backward) return current;
  const raw = current + (forward ? 1 : -1);
  if (opts?.wrap ?? false) return (raw + count) % count;
  return Math.max(0, Math.min(count - 1, raw));
}

/**
 * Roving keyboard focus for one list surface (arrows move focus, Enter activates).
 * Render-layer view interaction only — NOT a game↔R3F bridge, so it lives in
 * `src/render/ui/print/`, not `src/hooks/` (ADR-0021 D4).
 */
export function useRovingIndex(count: number, opts?: RovingOptions): RovingIndex {
  const [index, setIndex] = useState(0);

  const onKeyDown = useCallback(
    (e: ReactKeyboardEvent): void => {
      if (isActivateKey(e.key)) {
        if (opts?.onActivate !== undefined) {
          // preventDefault also stops Space from scrolling the page.
          e.preventDefault();
          opts.onActivate(index);
        }
        return;
      }
      const next = nextRovingIndex(index, e.key, count, opts);
      if (next !== index) {
        e.preventDefault();
        setIndex(next);
      }
    },
    [index, count, opts],
  );

  return { index, setIndex, onKeyDown };
}
