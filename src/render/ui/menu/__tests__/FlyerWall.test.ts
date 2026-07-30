import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";

// Opt into React's act() environment so the client-render mount tests (auto-focus,
// flag-write effect) don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
import {
  FlyerWall,
  buildPressionChoices,
  hasSeenTutorialNudge,
  markTutorialNudgeSeen,
} from "../FlyerWall";

const SEEN_KEY = "muf_seen_tutorial_nudge";

const noop = (): void => {
  /* host-owned in production */
};
const NO_UNLOCKS: ReadonlySet<string> = new Set<string>();

function markup(prefs: Prefs): string {
  return renderToStaticMarkup(
    createElement(FlyerWall, {
      unlockedLevels: NO_UNLOCKS,
      onPlay: noop,
      prefs,
      onSavePrefs: noop,
    }),
  );
}

const count = (html: string, re: RegExp): number => (html.match(re) ?? []).length;
const selectedLabel = (html: string): string | undefined =>
  /aria-checked="true"[^>]*>\s*([A-ZÀ-Ü]+)/.exec(html)?.[1];

/**
 * M2 — the promoted PRESSION header on the NIVEAUX flyer wall. These pin: the shared
 * ballot a11y contract (radiogroup / radio / aria-checked, inherited from `BallotRow`),
 * the Option-A short-landscape gating class + rule, and the single-`Prefs.difficulty`
 * write-through so the header can never become a second difficulty datum.
 */
describe("FlyerWall PRESSION header — a11y contract", () => {
  const html = markup(DEFAULT_PREFS);

  it("renders exactly one PRESSION radiogroup, named from its visible label", () => {
    expect(count(html, /role="radiogroup"/g)).toBe(1);
    expect(count(html, /role="radiogroup" aria-labelledby="/g)).toBe(1);
    expect(html).toContain("PRESSION");
  });

  it("exposes role=radio + aria-checked on all three difficulty choices", () => {
    expect(count(html, /role="radio"/g)).toBe(3);
    expect(count(html, /aria-checked="/g)).toBe(3);
  });

  it("checks exactly one choice, matching prefs.difficulty", () => {
    expect(count(html, /aria-checked="true"/g)).toBe(1);
    expect(selectedLabel(markup(DEFAULT_PREFS))).toBe("NORMAL");
    expect(selectedLabel(markup({ ...DEFAULT_PREFS, difficulty: "hard" }))).toBe("DIFFICILE");
  });
});

describe("FlyerWall PRESSION header — short-landscape gating (Option A)", () => {
  const html = markup(DEFAULT_PREFS);

  it("marks the header with the gating class the flyer-wall chrome already uses", () => {
    expect(html).toContain("muf-pression-header");
  });

  it("hides the header under the SHORT_LANDSCAPE_MEDIA query", () => {
    expect(html).toContain(SHORT_LANDSCAPE_MEDIA);
    expect(html).toMatch(/\.muf-pression-header\s*\{\s*display:\s*none/);
  });
});

describe("FlyerWall PRESSION header — single-pref write-through", () => {
  it("flags the current difficulty selected, the others not", () => {
    const choices = buildPressionChoices({ ...DEFAULT_PREFS, difficulty: "easy" }, noop);
    expect(choices.map((c) => c.selected)).toEqual([true, false, false]);
  });

  it("selecting a choice calls onSavePrefs once, patching only difficulty", () => {
    const onSavePrefs = vi.fn();
    const choices = buildPressionChoices(DEFAULT_PREFS, onSavePrefs);
    choices.find((c) => c.label === "DIFFICILE")?.onSelect();

    expect(onSavePrefs).toHaveBeenCalledTimes(1);
    expect(onSavePrefs).toHaveBeenCalledWith({ ...DEFAULT_PREFS, difficulty: "hard" });
  });
});

/**
 * §4 — first-run tutorial discoverability (spec-menus-ui-completion §4, ADR-0054 §1).
 * A single `muf_seen_tutorial_nudge` localStorage flag gates BOTH the tutorial-flyer
 * auto-focus and the one-time "COMMENCE ICI" nudge; the flag is written on first mount
 * so neither ever nags a returning player.
 */
describe("FlyerWall first-run — seen-flag helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("reads absent as not-yet-seen, then seen after marking", () => {
    expect(hasSeenTutorialNudge()).toBe(false);
    markTutorialNudgeSeen();
    expect(hasSeenTutorialNudge()).toBe(true);
    expect(localStorage.getItem(SEEN_KEY)).not.toBeNull();
  });
});

describe("FlyerWall first-run — nudge markup", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the COMMENCE ICI nudge on a first-ever visit (flag absent)", () => {
    const html = markup(DEFAULT_PREFS);
    expect(html).toContain("muf-tutorial-nudge");
    expect(html).toContain("COMMENCE ICI");
  });

  it("renders no nudge once the flag is set (returning visit)", () => {
    markTutorialNudgeSeen();
    const html = markup(DEFAULT_PREFS);
    expect(html).not.toContain("muf-tutorial-nudge");
    expect(html).not.toContain("COMMENCE ICI");
  });
});

describe("FlyerWall first-run — auto-focus + flag timing (client mount)", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  function mount(): HTMLDivElement {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(FlyerWall, {
          unlockedLevels: NO_UNLOCKS,
          onPlay: noop,
          prefs: DEFAULT_PREFS,
          onSavePrefs: noop,
        }),
      );
    });
    return container;
  }

  it("lands focus on the tutorial flyer and writes the flag (flag absent)", () => {
    const el = mount();
    const active = document.activeElement;
    expect(active?.getAttribute("role")).toBe("button");
    expect(active?.textContent).toContain("Tutoriel");
    expect(el.contains(active)).toBe(true);
    expect(localStorage.getItem(SEEN_KEY)).not.toBeNull();
  });

  it("does not steal focus nor render the nudge on a return visit (flag present)", () => {
    markTutorialNudgeSeen();
    const el = mount();
    // No flyer stole focus — activeElement stays the document body.
    expect(document.activeElement).toBe(document.body);
    expect(el.textContent).not.toContain("COMMENCE ICI");
  });
});

/**
 * Float-in entrance wiring. The animation itself is CSS (untestable here, and not worth
 * asserting on timing), but the CONTRACT the TSX owns is: every slot gets its staggered
 * delay, and consecutive flyers get DIFFERENT fall paths. Both are values a future
 * tuning pass edits by hand — this component has already had three — so they are pinned
 * rather than left to a screenshot to catch.
 */
describe("FlyerWall float-in entrance — per-slot wiring", () => {
  const html = markup(DEFAULT_PREFS);
  const slotStyles: string[] = [
    ...html.matchAll(/class="muf-flyer-slot[^"]*"\s+style="([^"]*)"/g),
  ].flatMap((m) => (m[1] === undefined ? [] : [m[1]]));

  it("gives every flyer slot an inline --slot-delay", () => {
    expect(slotStyles.length).toBeGreaterThan(1);
    expect(slotStyles.every((s) => s.includes("--slot-delay"))).toBe(true);
  });

  it("staggers --slot-delay by list position, starting at zero", () => {
    const delays = slotStyles.map((s) => Number(/--slot-delay:\s*(-?\d+)ms/.exec(s)?.[1]));
    expect(delays[0]).toBe(0);
    // Strictly increasing: a constant (or reset) delay would mean the wall lands at once,
    // which is precisely the "all at the same time" look this feature replaced.
    // `?? Infinity` keeps this assertion-free and still fails on a missing value.
    const strictlyIncreasing = delays.every((d, i) => i === 0 || d > (delays[i - 1] ?? Infinity));
    expect(strictlyIncreasing).toBe(true);
  });

  it("does not give two consecutive flyers the same fall path", () => {
    // Guards the `i % FLYER_FLOAT_IN_VARIANTS.length` cycling: dropping it (or letting
    // the array collapse to one entry) would restore the copy-pasted-path look.
    const firstDrop = slotStyles.map((s) => /--fio-y0:\s*(-?\d+)px/.exec(s)?.[1]);
    expect(firstDrop.every((v) => v !== undefined)).toBe(true);
    for (let i = 1; i < firstDrop.length; i++) {
      expect(firstDrop[i]).not.toBe(firstDrop[i - 1]);
    }
  });

  it("keeps the reduced-motion escape hatch reachable on every slot", () => {
    // The two kill-switches (@media prefers-reduced-motion and the in-app
    // :root[data-reduced-motion="true"]) both target `.slot` via its CSS-module class.
    // If the class ever stops being emitted, the animation would still run but neither
    // guard could stop it — an accessibility regression no visual test would show.
    expect(count(html, /class="muf-flyer-slot [^"]+"/g)).toBe(slotStyles.length);
  });
});
