import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";

// Opt into React's act() environment so the client-render mount tests (auto-focus,
// flag-write effect) don't warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { SHORT_LANDSCAPE_MEDIA, SPACE } from "@render/ui/print";
import {
  FlyerWall,
  buildPressionChoices,
  hasSeenTutorialNudge,
  markTutorialNudgeSeen,
  RACK_PAD_TOP_PX,
  RACK_PAD_BOTTOM_PX,
} from "../FlyerWall";
import {
  FLYER_LIFT_PX,
  FLYER_PULL_SCALE_HEADROOM_PX,
  FLYER_PULLED_SHADOW,
  FLYER_STACK_GAP_PX,
  FLYER_GRID_MARGIN_PX,
  PULLED_SHADOW_DROP_PX,
} from "../LevelFlyer";

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

/**
 * The short-landscape rack is the only flyer layout that CLIPS (`overflow-y: hidden`), and
 * a transform pushes content past the border edge, so the rack's top padding is the whole
 * headroom budget for the pulled flyer. That relation lived only in a comment and broke
 * silently when the pull grew from -4px to -22px: the auto-focused tutorial flyer — pulled
 * at FIRST PAINT, not on hover (see the auto-focus test below) — got its top edge cropped
 * on a phone in landscape. These pin the arithmetic so the next pull change fails here.
 */
describe("FlyerWall short-landscape rack — pulled-flyer headroom", () => {
  it("keeps the rack's top padding above the pull plus its scale growth", () => {
    expect(RACK_PAD_TOP_PX).toBeGreaterThanOrEqual(
      Math.abs(FLYER_LIFT_PX.pulled) + FLYER_PULL_SCALE_HEADROOM_PX,
    );
  });

  it("emits that padding into the rack media block, not just into a constant", () => {
    const html = markup(DEFAULT_PREFS);
    const rack = html.slice(html.indexOf(SHORT_LANDSCAPE_MEDIA));
    expect(rack).toContain(`padding-top: ${String(RACK_PAD_TOP_PX)}px`);
    expect(rack).toContain(`padding-bottom: ${String(RACK_PAD_BOTTOM_PX)}px`);
  });

  it("lifts the flyer further when pulled than at rest, both off the wall", () => {
    expect(FLYER_LIFT_PX.pulled).toBeLessThan(FLYER_LIFT_PX.rest);
    expect(FLYER_LIFT_PX.rest).toBeLessThan(0);
  });
});

/**
 * The stacking gap between two flyers, per layout. Same failure shape as the rack above and
 * caught by the same panel: a literal that is "obviously enough" until the pull or the
 * shadow grows. The portrait column is the tight one (`.wall` has no `gap`, so the flyer's
 * own margin is the ONLY separation); the desktop wrap-grid brings 24px of its own.
 */
describe("LevelFlyer stacking gap — clears the pulled shadow in every layout", () => {
  it("derives the portrait gap from the pulled shadow it has to clear", () => {
    expect(FLYER_STACK_GAP_PX).toBeGreaterThanOrEqual(
      FLYER_PULLED_SHADOW.dy + FLYER_PULLED_SHADOW.blur,
    );
  });

  it("emits that gap as the --flyer-stack-gap the CSS reads, on every flyer", () => {
    const html = markup(DEFAULT_PREFS);
    const emitted = (html.match(/--flyer-stack-gap:/g) ?? []).length;
    expect(emitted).toBe((html.match(/role="button"/g) ?? []).length);
    expect(html).toContain(`--flyer-stack-gap:${String(FLYER_STACK_GAP_PX)}px`);
  });

  it("keeps the desktop wrap-grid's own gap + margin above the same requirement", () => {
    expect(SPACE.xxl + FLYER_GRID_MARGIN_PX).toBeGreaterThanOrEqual(FLYER_STACK_GAP_PX);
  });

  /**
   * The desktop margin is authored in CSS, not emitted from TS — a media query can't be
   * driven by the inline custom property the portrait gap uses (inline always wins). So the
   * constant above would only be checking itself unless something reads the stylesheet.
   * This asserts on the actual CSS text: constant and literal cannot drift apart in silence.
   */
  it("ties FLYER_GRID_MARGIN_PX to the literal actually written in the CSS module", () => {
    // Resolved from the repo root, not from `import.meta.url`: under the happy-dom
    // environment that URL is an http one and `readFileSync` rejects it.
    const css = readFileSync(
      resolve(process.cwd(), "src/render/ui/menu/LevelFlyer.module.css"),
      "utf8",
    );
    const grid = /@media \(min-width: 640px\) and \(min-height: 481px\) \{[^}]*\{([^}]*)\}/.exec(
      css,
    );
    expect(grid, "desktop wrap-grid media block not found in LevelFlyer.module.css").not.toBeNull();
    expect(grid?.[1]).toContain(`margin-bottom: ${String(FLYER_GRID_MARGIN_PX)}px`);
  });
});

/**
 * The rack clips on BOTH edges. The top was pinned in round 1; this pins the bottom against
 * what actually reaches it: the pulled shadow's downward drop AND the scale growth, since
 * `transform-origin: center` grows the box downward as much as upward.
 *
 * Like its sibling above, this assertion is quiet while the constant stays derived — it
 * exists to fire the day someone replaces the derivation with a literal that only clears
 * today's numbers. Probed with exactly that mutation, not with a change to an input the
 * constant is computed from (which it would follow, proving nothing).
 */
describe("FlyerWall short-landscape rack — pulled shadow does not get cropped below", () => {
  it("keeps the rack's bottom padding above the shadow drop plus the scale growth", () => {
    expect(RACK_PAD_BOTTOM_PX).toBeGreaterThanOrEqual(
      PULLED_SHADOW_DROP_PX + FLYER_PULL_SCALE_HEADROOM_PX,
    );
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
