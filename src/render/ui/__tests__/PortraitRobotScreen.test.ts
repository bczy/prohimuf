import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { PortraitIntent, PortraitScene } from "@game/types/portraitRobot";
import { PortraitRobotScreen } from "../portrait/PortraitRobotScreen";
import type { PortraitRobotScreenProps, PortraitBandView } from "../portrait/PortraitRobotScreen";
import { EarlyExitButton, ARM_WINDOW_MS } from "../portrait/EarlyExitButton";
import { OUTCOME_STAMP } from "../portrait/copy";

const BANDS: readonly PortraitBandView[] = [
  { id: "hair", label: "LA COUPE", src: "assets/portrait/hair-01.png", ordinal: 1, total: 6 },
  { id: "eyes", label: "LE REGARD", src: "assets/portrait/eyes-03.png", ordinal: 3, total: 6 },
  { id: "nose", label: "LE NEZ", src: "assets/portrait/nose-02.png", ordinal: 2, total: 6 },
  { id: "mouth", label: "LA BOUCHE", src: "assets/portrait/mouth-05.png", ordinal: 5, total: 6 },
];

// A board mid-scene. `puzzle` is only carried, never read by the screen.
const ACTIVE_SCENE: PortraitScene = {
  phase: "ACTIVE",
  puzzle: {
    order: [
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
      [0, 1, 2, 3, 4, 5],
    ],
    truth: [0, 1, 2, 3],
    initialSelection: [1, 2, 3, 4],
  },
  selection: [0, 2, 1, 4],
  focusedBand: "hair",
  remainingSeconds: 21,
  timerSeconds: 35,
  palier: "MID",
  revealSeconds: 0,
  result: null,
};

const noop = (): void => {
  /* replaced per test */
};

const BASE: PortraitRobotScreenProps = {
  scene: ACTIVE_SCENE,
  bands: BANDS,
  targetSrc: "assets/portrait/target.png",
  isMobile: false,
  onIntent: noop,
};

function markup(overrides: Partial<PortraitRobotScreenProps> = {}): string {
  return renderToStaticMarkup(createElement(PortraitRobotScreen, { ...BASE, ...overrides }));
}

function resolvedScene(
  outcome: "IDENTIFIED" | "PARTIAL" | "FAILED",
  correctCount: number,
): PortraitScene {
  return {
    ...ACTIVE_SCENE,
    phase: "RESOLVED",
    revealSeconds: outcome === "IDENTIFIED" ? 1.4 : 2.6,
    result: { outcome, correctCount, scoreDelta: 0 },
  };
}

/**
 * The screen's non-negotiables, pinned as tests because each of them is a blocking
 * finding at the panel rather than a taste call (story §3.4).
 */
describe("PortraitRobotScreen — the prohibitions", () => {
  it("renders no chrono digit anywhere in the DOM (gate A6/A13)", () => {
    const html = markup();
    // The internal seconds may only appear inside aria-value*, never as text.
    const text = html.replace(/<[^>]*>/g, " ");
    expect(text).not.toMatch(/\b21\b/);
    expect(text).not.toMatch(/\b35\b/);
    expect(text).not.toMatch(/UNITÉS|temps restant/i);
  });

  it("speaks the gauge qualitatively — aria-valuetext carries no number", () => {
    const html = markup();
    const valuetext = /aria-valuetext="([^"]*)"/.exec(html)?.[1] ?? "";
    expect(valuetext).not.toBe("");
    expect(valuetext).not.toMatch(/\d/);
  });

  it("carries no validation act — no submit control and no Enter affordance (gate B1)", () => {
    const html = markup();
    expect(html).not.toMatch(/type="submit"/);
    expect(html).not.toMatch(/SORTIR LA TÊTE|VALIDER|CONFIRMER|TERMINER|ENVOYER/i);
  });

  it("grants no per-band correctness cue while ACTIVE (gate A16)", () => {
    const html = markup();
    // No stamp, no aria-pressed on a band, no outcome word before the phase ends.
    expect(html).not.toContain("aria-pressed");
    expect(html).not.toContain(OUTCOME_STAMP.IDENTIFIED);
    expect(html).not.toMatch(/data-correct|data-right|data-wrong/);
  });

  it("keeps the four bands joined — no gap, no separator element between them", () => {
    const html = markup();
    const bands = html.match(/data-band="/g) ?? [];
    expect(bands).toHaveLength(4);
    // Nothing is rendered between two band groups: the stack's children are the bands.
    expect(html).not.toMatch(/<hr|role="separator"/);
  });

  it("announces one palier line, from scene.palier and not from a comparison", () => {
    const mid = markup();
    expect(mid).toContain("Ma carte descend.");
    const none = markup({ scene: { ...ACTIVE_SCENE, palier: "NONE" } });
    expect(none).not.toContain("Ma carte descend.");
  });

  it("shows the single terminal signal — the global lock frame — only at IDENTIFIED", () => {
    expect(markup()).toContain('data-locked="false"');
    expect(markup({ scene: resolvedScene("IDENTIFIED", 4) })).toContain('data-locked="true"');
    expect(markup({ scene: resolvedScene("PARTIAL", 3) })).toContain('data-locked="false"');
  });

  it("freezes every input path once the scene is RESOLVED (UX §2.5.1)", () => {
    const html = markup({ scene: resolvedScene("PARTIAL", 3) });
    // 8 chevrons + the exit button, all disabled.
    expect(html.match(/disabled=""/g) ?? []).toHaveLength(9);
  });

  it("labels each band group and each chevron for the non-gestural path (UX §5.4)", () => {
    const html = markup();
    expect(html).toContain('aria-label="LA COUPE, variante 1 sur 6"');
    expect(html).toContain("Variante précédente — LE REGARD");
    expect(html).toContain("Variante suivante — LA BOUCHE");
  });

  it("forks the exit copy on the device class, never on a CSS breakpoint", () => {
    expect(markup()).toContain("ÇA PART COMME ÇA");
    const mobile = markup({ isMobile: true });
    expect(mobile).toContain("ÇA PART<");
    expect(mobile).not.toContain("ÇA PART COMME ÇA");
  });
});

describe("PortraitRobotScreen — intents", () => {
  const container = (): HTMLDivElement => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    return el;
  };

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("emits CYCLE with the band it was clicked on, never a cursor-implied one", () => {
    const seen: PortraitIntent[] = [];
    const el = container();
    const root = createRoot(el);
    act(() => {
      root.render(
        createElement(PortraitRobotScreen, {
          ...BASE,
          onIntent: (intent) => seen.push(intent),
        }),
      );
    });
    const chevrons = el.querySelectorAll<HTMLButtonElement>("button[aria-label^='Variante']");
    act(() => {
      chevrons[3]?.click(); // « Variante suivante — LE REGARD »
    });
    expect(seen).toEqual([{ kind: "CYCLE", band: "eyes", delta: 1 }]);
    act(() => {
      root.unmount();
    });
  });
});

/**
 * The early exit's two regimes (gate A17 / UX §2.8.3-§2.8.4). The asymmetry is the
 * decision: a corner mistap costs the whole scene, a keyboard activation cannot be
 * accidental in the same way — and a timed two-step at the keyboard would be worse
 * for the players it claims to protect.
 */
describe("EarlyExitButton — arming", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  function mount(onExit: () => void): { el: HTMLDivElement; button: HTMLButtonElement } {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const root = createRoot(el);
    act(() => {
      root.render(createElement(EarlyExitButton, { isMobile: false, onExit, disabled: false }));
    });
    const button = el.querySelector("button");
    if (button === null) throw new Error("no button rendered");
    return { el, button };
  }

  it("needs two pointer presses inside the window, and fires on the second", () => {
    const onExit = vi.fn();
    const { button } = mount(onExit);
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    expect(onExit).not.toHaveBeenCalled();
    expect(button.getAttribute("aria-pressed")).toBe("true");
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("disarms visibly after the window, so a late press re-arms instead of firing", () => {
    vi.useFakeTimers();
    const onExit = vi.fn();
    const { button } = mount(onExit);
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    act(() => {
      vi.advanceTimersByTime(ARM_WINDOW_MS + 1);
    });
    expect(button.getAttribute("aria-pressed")).toBeNull();
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    });
    expect(onExit).not.toHaveBeenCalled();
  });

  it("fires on a single keyboard activation (detail === 0), with no arming step", () => {
    const onExit = vi.fn();
    const { button } = mount(onExit);
    act(() => {
      button.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 0 }));
    });
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("aria-pressed")).toBeNull();
  });
});
