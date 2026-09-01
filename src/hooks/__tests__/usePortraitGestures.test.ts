import { describe, it, expect, afterEach } from "vitest";
import { act, createElement, useRef } from "react";
import type { JSX } from "react";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { usePortraitGestures } from "@hooks/usePortraitGestures";
import type { PortraitBandId, PortraitIntent } from "@game/types/portraitRobot";
import { DRAG_CRAN_DISTANCE } from "@game/systems/swipeGestureSystem";
import { VARIANTS_PER_BAND } from "@game/systems/portraitRobotSystem";

const BAND_HEIGHT_PX = 68;

/**
 * A minimal stand-in for the joined band surface: four `[data-band]` rows, no gap.
 * `getBoundingClientRect` is stubbed because happy-dom lays nothing out.
 */
function Harness({
  onIntent,
  enabled = true,
}: {
  onIntent: (i: PortraitIntent) => void;
  enabled?: boolean;
}): JSX.Element {
  const stackRef = useRef<HTMLDivElement>(null);
  usePortraitGestures({
    stackRef,
    enabled,
    focusedBand: "eyes",
    onIntent,
  });
  return createElement(
    "div",
    { ref: stackRef },
    ...(["hair", "eyes", "nose", "mouth"] as const).map((id) =>
      createElement("div", { key: id, "data-band": id }, createElement("button", null, "◁")),
    ),
  );
}

function mount(): {
  el: HTMLDivElement;
  seen: PortraitIntent[];
  setEnabled: (next: boolean) => void;
  unmount: () => void;
} {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const seen: PortraitIntent[] = [];
  const root = createRoot(el);
  const push = (i: PortraitIntent): void => {
    seen.push(i);
  };
  act(() => {
    root.render(createElement(Harness, { onIntent: push }));
  });
  for (const band of el.querySelectorAll("[data-band]")) {
    band.getBoundingClientRect = () => ({ height: BAND_HEIGHT_PX }) as DOMRect;
  }
  const stack = el.firstElementChild as HTMLDivElement;
  stack.setPointerCapture = () => undefined;
  stack.releasePointerCapture = () => undefined;
  stack.hasPointerCapture = () => false;
  return {
    el,
    seen,
    // Re-renders with a new `enabled`, so a test can FREEZE the scene mid-gesture the way
    // the rotate overlay does.
    setEnabled: (next: boolean) => {
      act(() => {
        root.render(createElement(Harness, { onIntent: push, enabled: next }));
      });
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

function pointer(
  el: Element,
  type: string,
  x: number,
  y: number,
  timeStamp = 0,
  init: { button?: number; pointerType?: string } = {},
): void {
  const event = new Event(type, { bubbles: true });
  Object.defineProperties(event, {
    pointerId: { value: 1 },
    clientX: { value: x },
    clientY: { value: y },
    timeStamp: { value: timeStamp },
    // Absent by default so every existing case keeps describing touch/pen contact, where
    // the button is 0 anyway.
    ...(init.button === undefined ? {} : { button: { value: init.button } }),
    ...(init.pointerType === undefined ? {} : { pointerType: { value: init.pointerType } }),
  });
  el.dispatchEvent(event);
}

const bandOf = (el: HTMLElement, id: PortraitBandId): Element => {
  const found = el.querySelector(`[data-band="${id}"]`);
  if (found === null) throw new Error(`no band ${id}`);
  return found;
};

/**
 * The guard the joined bands took away from the layout and gave to the trajectory
 * (UX §2.3.4): the band is frozen at `pointerdown`, drift cancels before engagement
 * and is immune after it, and NO cran ever lands on a neighbour.
 */
describe("usePortraitGestures — pointer", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("banks a multi-cran drag into ONE RELATIVE entry on the band touched first", () => {
    const { el, seen, unmount } = mount();
    const travel = window.innerWidth * DRAG_CRAN_DISTANCE * 2.2;
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0);
    pointer(bandOf(el, "eyes"), "pointermove", 100 + travel, 100, 300);
    pointer(bandOf(el, "eyes"), "pointerup", 100 + travel, 100, 320);
    // Two crans right ⇒ ONE `CYCLE(+2)`, not two `CYCLE(±1)` and not an absolute `SET`
    // computed off a selection React had rendered a frame earlier (panel run-1 minor:
    // the fold, not the hook, holds the board the entry applies to).
    expect(seen).toEqual([{ kind: "CYCLE", band: "eyes", delta: 2 }]);
    unmount();
  });

  it("cancels on vertical drift BEFORE engagement — no cran, on any band", () => {
    const { el, seen, unmount } = mount();
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0);
    pointer(bandOf(el, "eyes"), "pointermove", 110, 100 + BAND_HEIGHT_PX, 100);
    pointer(bandOf(el, "eyes"), "pointerup", 160, 100 + BAND_HEIGHT_PX, 200);
    expect(seen).toEqual([]);
    unmount();
  });

  it("keeps the cran on the ORIGIN band when the drift happens after engagement", () => {
    const { el, seen, unmount } = mount();
    const travel = window.innerWidth * DRAG_CRAN_DISTANCE * 1.2;
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0);
    pointer(bandOf(el, "eyes"), "pointermove", 100 + travel, 100, 100);
    // The finger arcs onto the neighbouring band — the gesture is already engaged.
    pointer(bandOf(el, "nose"), "pointermove", 100 + travel, 100 + BAND_HEIGHT_PX * 2, 200);
    pointer(bandOf(el, "nose"), "pointerup", 100 + travel, 100 + BAND_HEIGHT_PX * 2, 220);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ kind: "CYCLE", band: "eyes" });
    unmount();
  });

  it("never starts a drag from a chevron — that press belongs to the button", () => {
    const { el, seen, unmount } = mount();
    const chevron = bandOf(el, "eyes").querySelector("button");
    if (chevron === null) throw new Error("no chevron");
    const travel = window.innerWidth * DRAG_CRAN_DISTANCE * 2;
    pointer(chevron, "pointerdown", 100, 100, 0);
    pointer(chevron, "pointermove", 100 + travel, 100, 100);
    pointer(chevron, "pointerup", 100 + travel, 100, 120);
    expect(seen).toEqual([]);
    unmount();
  });

  it("reads a quick flick as a swipe — one cran, judged by the pure classifier", () => {
    const { el, seen, unmount } = mount();
    // Under one cran of travel but over the swipe distance, inside the swipe window.
    const travel = window.innerWidth * 0.07;
    pointer(bandOf(el, "mouth"), "pointerdown", 100, 100, 0);
    pointer(bandOf(el, "mouth"), "pointerup", 100 + travel, 100, 120);
    expect(seen).toEqual([{ kind: "CYCLE", band: "mouth", delta: 1 }]);
    unmount();
  });
});

/** The keyboard socle — and the two bindings that must NOT exist (gate B1). */
describe("usePortraitGestures — only the LEFT mouse button drives a band (panel MINEUR)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("ignores a right-button drag, so the context menu is not swallowed", () => {
    const { el, seen, unmount } = mount();
    const travel = DRAG_CRAN_DISTANCE * window.innerWidth * 3;
    const mouse = { button: 2, pointerType: "mouse" };
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0, mouse);
    pointer(bandOf(el, "eyes"), "pointermove", 100 + travel, 100, 200, mouse);
    pointer(bandOf(el, "eyes"), "pointerup", 100 + travel, 100, 300, mouse);
    expect(seen).toEqual([]);
    unmount();
  });

  it("still drives on the left button", () => {
    const { el, seen, unmount } = mount();
    const travel = DRAG_CRAN_DISTANCE * window.innerWidth * 3;
    const mouse = { button: 0, pointerType: "mouse" };
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0, mouse);
    pointer(bandOf(el, "eyes"), "pointermove", 100 + travel, 100, 200, mouse);
    pointer(bandOf(el, "eyes"), "pointerup", 100 + travel, 100, 300, mouse);
    expect(seen.length).toBeGreaterThan(0);
    unmount();
  });
});

describe("usePortraitGestures — a frozen scene freezes the gesture too (panel MAJEUR)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("banks nothing while paused, and emits nothing when the finger lifts after resuming", () => {
    // Rotate the phone mid-drag: `enabled` goes false, and the pointer stays CAPTURED.
    // `endGesture` reads `enabled` at RELEASE time, so without cancelling, every cran
    // banked behind the overlay was emitted the moment the player straightened the phone
    // and lifted — a band moved that the player never intentionally scrubbed.
    const { el, seen, setEnabled, unmount } = mount();
    const travel = DRAG_CRAN_DISTANCE * window.innerWidth * 3;
    pointer(bandOf(el, "eyes"), "pointerdown", 100, 100, 0);
    setEnabled(false);
    pointer(bandOf(el, "eyes"), "pointermove", 100 + travel, 100, 200);
    setEnabled(true);
    pointer(bandOf(el, "eyes"), "pointerup", 100 + travel, 100, 400);
    expect(seen).toEqual([]);
    unmount();
  });
});

describe("usePortraitGestures — keyboard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const press = (key: string): void => {
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
  };

  it("maps the socle onto intents, focused band included", () => {
    const { seen, unmount } = mount();
    press("ArrowRight");
    press("ArrowLeft");
    press("ArrowDown");
    press("3");
    press("Escape");
    expect(seen).toEqual([
      { kind: "CYCLE", band: "eyes", delta: 1 },
      { kind: "CYCLE", band: "eyes", delta: -1 },
      { kind: "FOCUS", band: "nose" },
      { kind: "SET", band: "eyes", index: 2 },
      { kind: "ABANDON" },
    ]);
    unmount();
  });

  it("direct selection reaches EVERY variant — 1..9 then 0 (Copilot review)", () => {
    // `[1-6]` survived the 6 → 10 move, so variants 7-10 were reachable only by cycling.
    // `0` addresses the tenth, like a numeric keypad.
    const { seen, unmount } = mount();
    for (const key of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) press(key);
    expect(seen.map((i) => (i.kind === "SET" ? i.index : null))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
    expect(seen.every((i) => i.kind === "SET" && i.index < VARIANTS_PER_BAND)).toBe(true);
    unmount();
  });

  it("ignores a chord — a browser command is never a scene entry (panel run-1)", () => {
    const { seen, unmount } = mount();
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", ctrlKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", metaKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "3", altKey: true }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", ctrlKey: true }));
    });
    // `Ctrl+A` used to cycle a variant: the handler only ever looked at `event.key`.
    expect(seen).toEqual([]);
    unmount();
  });

  it("binds neither Enter nor Space — the validation act is deleted, not hidden", () => {
    const { seen, unmount } = mount();
    press("Enter");
    press(" ");
    expect(seen).toEqual([]);
    unmount();
  });
});
