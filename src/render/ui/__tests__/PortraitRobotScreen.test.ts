import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";

// Opt into React's act() environment so client-render interaction tests don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import type { PortraitIntent, PortraitScene } from "@game/types/portraitRobot";
import {
  RESULT_HOLD_SECONDS,
  REVEAL_SECONDS_IDENTIFIED,
  REVEAL_SECONDS_UNRESOLVED,
} from "@game/systems/portraitRobotSystem";
import { PortraitRobotScreen } from "../portrait/PortraitRobotScreen";
import type { PortraitRobotScreenProps, PortraitBandView } from "../portrait/PortraitRobotScreen";
import { EarlyExitButton, ARM_WINDOW_MS } from "../portrait/EarlyExitButton";
import { OUTCOME_STAMP } from "../portrait/copy";

const BANDS: readonly PortraitBandView[] = [
  { id: "hair", label: "LA COUPE", src: "hair-01.png", corrected: false, ordinal: 1, total: 6 },
  { id: "eyes", label: "LE REGARD", src: "eyes-03.png", corrected: false, ordinal: 3, total: 6 },
  { id: "nose", label: "LE NEZ", src: "nose-02.png", corrected: false, ordinal: 2, total: 6 },
  { id: "mouth", label: "LA BOUCHE", src: "mouth-05.png", corrected: false, ordinal: 5, total: 6 },
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
  resultHoldSeconds: 0,
  revealElapsed: 0,
  result: null,
};

const noop = (): void => {
  /* replaced per test */
};

const BASE: PortraitRobotScreenProps = {
  scene: ACTIVE_SCENE,
  bands: BANDS,
  targetBands: [
    "assets/portrait/hair-02.png",
    "assets/portrait/eyes-01.png",
    "assets/portrait/nose-04.png",
    "assets/portrait/mouth-02.png",
  ],
  isMobile: false,
  paused: false,
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
    // The two durations come from `src/game`; a render test re-typing 1,4 / 2,6 would be
    // the ADR-0079 A5 breach it is here to guard against.
    revealSeconds: outcome === "IDENTIFIED" ? REVEAL_SECONDS_IDENTIFIED : REVEAL_SECONDS_UNRESOLVED,
    resultHoldSeconds: RESULT_HOLD_SECONDS,
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

  it("draws the four bands with an IDENTICAL attribute set — only the band's own identity varies", () => {
    // A deny-list of three strings is not a proof: it caught `data-correct` (the A16
    // regression of 485d6bbe) and would have missed `data-ok`, a conditional class or
    // an inline style. This is the allow-list version — anything a future pass adds to
    // ONE band and not to its neighbours fails here, whatever it is called.
    const html = markup();
    const openings = html.match(/<div class="[^"]*" role="group"[^>]*>/g) ?? [];
    expect(openings).toHaveLength(4);
    const shapes = openings.map((tag) =>
      (tag.match(/[a-zA-Z-]+="/g) ?? []).map((a) => a.slice(0, -2)).sort(),
    );
    // Same attributes on all four, and only the ones a band legitimately carries.
    expect(new Set(shapes.map((s) => s.join(",")))).toHaveLength(1);
    expect(shapes[0]).toEqual(["aria-label", "class", "data-band", "role"]);
    // The one class is the shared one: no conditional variant slipped onto a band.
    const classes = openings.map((tag) => /class="([^"]*)"/.exec(tag)?.[1] ?? "");
    expect(new Set(classes)).toHaveLength(1);
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

  it("freezes every input path while PAUSED too — a swallowed click is a lie (panel run-1)", () => {
    // Behind RotateOverlay the fold stops, so a chevron click was accepted by the DOM,
    // dropped by the hook, and reported to the player as an action taken.
    const html = markup({ paused: true });
    expect(html.match(/disabled=""/g) ?? []).toHaveLength(9);
  });

  it("does not put the early exit first in the tab order (panel M5-aggravant)", () => {
    // One Tab and one Enter used to end the scene, definitively, before it was played.
    const html = markup();
    const exitAt = html.indexOf("ÇA PART COMME ÇA");
    const firstChevronAt = html.indexOf("Variante précédente");
    expect(exitAt).toBeGreaterThan(firstChevronAt);
    // And no positive tabindex was used to fake it — the DOM order IS the fix.
    expect(html).not.toMatch(/tabindex="[1-9]/);
  });

  it("announces the verdict to a screen reader on EVERY outcome, not only on a win", () => {
    for (const outcome of ["PARTIAL", "FAILED"] as const) {
      const html = markup({ scene: resolvedScene(outcome, outcome === "PARTIAL" ? 3 : 1) });
      const assertive = /aria-live="assertive">([^<]*)</.exec(html)?.[1] ?? "";
      expect(assertive).toBe(OUTCOME_STAMP[outcome]);
    }
  });

  it("carries no chrono seconds on ANY channel, aria-valuenow included (gate A13)", () => {
    // `aria-valuenow` used to hold `remainingSeconds`: the digit the gate forbids,
    // rewritten ~60x a second (panel run-1).
    const html = markup();
    expect(html).not.toContain('aria-valuenow="21"');
    const now = /aria-valuenow="(\d+)"/.exec(html)?.[1] ?? "";
    expect(Number(now)).toBeLessThanOrEqual(3);
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

/**
 * The HUD corner, pinned as text.
 *
 * The exit target is out of flow (`position: absolute`) because it is LAST in the DOM
 * for the tab order — so the HUD's flex row cannot see it, and the gauge stretched its
 * rail straight through `ÇA PART COMME ÇA`: the screen's only permanent control came
 * out struck through, which reads as disabled (panel run-2, captures). The fix is a
 * reservation, and a reservation is only true while the two numbers stay ONE number.
 *
 * jsdom lays nothing out, so this asserts the mechanism rather than the pixels — the
 * pixels are the `verify` captures. What it catches is the realistic regression: a
 * later hand widening the button, or the padding, and not the other.
 */
describe("run-2 — the exit corner is reserved, not overlapped", () => {
  const css = readFileSync(
    resolve(process.cwd(), "src/render/ui/portrait/PortraitRobotScreen.module.css"),
    "utf8",
  );

  it("pads the HUD by the SAME custom property the exit slot is wide", () => {
    const hud = /\.hud \{([^}]*)\}/.exec(css)?.[1] ?? "";
    const slot = /\.exitSlot \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(hud).toMatch(/padding-right:[^;]*var\(--exit-reserve\)/);
    expect(slot).toMatch(/width:[^;]*var\(--exit-reserve\)/);
  });

  it("declares the reserve on both device forks", () => {
    expect(css).toMatch(/\.root \{\s*--exit-reserve:/);
    expect(css).toMatch(/\.root\[data-device="mobile"\] \{\s*--exit-reserve:/);
  });

  it("keeps the desktop control strip clear of the fullscreen glyph's corner", () => {
    // Same defect one corner down: `{n} sur {total}` of the last band sat under the
    // fixed 40px glyph (ADR-0008), which is drawn over every screen at z-index 300.
    const stack = /\.root\[data-device="desktop"\] \.stack \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(stack).toMatch(/margin:[^;]*var\(--chrome-corner\)/);
  });
});

/**
 * The masthead is what yields on the 32px strip (UX §9.1) — and it could not: `.title`
 * ships `flex: 0 0 auto`, so the `text-overflow: ellipsis` declared for mobile was
 * unreachable and the chrono's rail was pushed off the viewport instead.
 */
describe("run-2 — the mobile strip yields the masthead, not the chrono", () => {
  const css = readFileSync(
    resolve(process.cwd(), "src/render/ui/portrait/PortraitRobotScreen.module.css"),
    "utf8",
  );

  it("makes the mobile masthead shrinkable, so its ellipsis is reachable", () => {
    const title = /\.root\[data-device="mobile"\] \.title \{([^}]*)\}/.exec(css)?.[1] ?? "";
    expect(title).toMatch(/flex:\s*0 1 auto/);
    expect(title).toMatch(/min-width:\s*0/);
    expect(title).toMatch(/text-overflow:\s*ellipsis/);
  });

  it("gives the gauge a floor so it is never the thing that gives", () => {
    expect(/\.hud > div \{([^}]*)\}/.exec(css)?.[1] ?? "").toMatch(/min-width:\s*\d+px/);
  });

  it("keeps the gauge's own rail from being squeezed out by its caption", () => {
    const gauge = readFileSync(
      resolve(process.cwd(), "src/render/ui/portrait/TelecarteGauge.module.css"),
      "utf8",
    );
    // `white-space: nowrap` without `min-width: 0` cannot shrink past its text: the
    // caption took the whole gauge and the rail rendered outside the box.
    expect(/\.label \{([^}]*)\}/.exec(gauge)?.[1] ?? "").toMatch(/min-width:\s*0/);
    expect(/\.track \{([^}]*)\}/.exec(gauge)?.[1] ?? "").toMatch(/min-width:\s*\d+px/);
  });
});
