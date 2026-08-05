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
import wallStyles from "../FlyerWall.module.css";
import {
  FLOAT_IN_STAGGER_MS,
  FlyerWall,
  clearCascadePlayed,
  hasCascadePlayed,
  markCascadePlayed,
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
      reducedMotion: false,
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

/**
 * The rack does not run the ENTRANCE either — the finding above is about the pulled flyer,
 * this is about the float-in, and the numbers are an order of magnitude apart. The fall
 * starts up to 230px above the resting position while the rack reserves ~32px of headroom
 * and clips, so measured on a 844x390 touch viewport the tutorial flyer spent its whole
 * fall with 233px of itself — masthead and stamp included — cut off at the clip edge.
 *
 * Pinned on BOTH halves of the fix, because they close different holes and either one alone
 * leaves a real regression:
 *   - the CSS rule catches a fall already in flight when a phone is rotated INTO the rack;
 *   - the TS latch stops the media rule from handing the animation back on the way OUT
 *     (rotating rack -> portrait replayed the whole cascade mid-visit, decision §1).
 */
describe("FlyerWall short-landscape rack — no entrance cascade", () => {
  it("removes the float-in animation inside the rack media block", () => {
    const html = markup(DEFAULT_PREFS);
    const rack = html.slice(html.indexOf(SHORT_LANDSCAPE_MEDIA));
    const slotRule = /\.muf-flyerwall > \.muf-flyer-slot\{([^}]*)\}/.exec(rack);
    expect(slotRule, "rack slot rule not found in the SHORT_LANDSCAPE_MEDIA block").not.toBeNull();
    expect(slotRule?.[1]).toMatch(/animation:\s*none/);
  });

  it("renders the slots settled when the rack query matches at mount", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({
          matches: query === SHORT_LANDSCAPE_MEDIA,
          media: query,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
        }) as unknown as MediaQueryList,
    );
    sessionStorage.clear();
    localStorage.clear();
    markTutorialNudgeSeen();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        createElement(FlyerWall, {
          reducedMotion: false,
          unlockedLevels: NO_UNLOCKS,
          onPlay: noop,
          prefs: DEFAULT_PREFS,
          onSavePrefs: noop,
        }),
      );
    });
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
    // ...and the session's one showing is NOT spent on a cascade nobody saw — same rule as
    // reduced motion (decision §6), so rotating to portrait and coming back still plays it.
    expect(hasCascadePlayed()).toBe(false);
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.restoreAllMocks();
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
    // FlyerWall now writes a sessionStorage flag on every real mount; leaving it set
    // would make the second mount in this describe render settled instead of animating.
    sessionStorage.clear();
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
          reducedMotion: false,
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

  it("staggers --slot-delay by exactly FLOAT_IN_STAGGER_MS per position", () => {
    const delays = slotStyles.map((s) => Number(/--slot-delay:\s*(-?\d+)ms/.exec(s)?.[1]));
    expect(delays[0]).toBe(0);
    // Pin the actual STEP, not just monotonicity. Asserting "delays increase" let the
    // cascade be destroyed while staying green: shrinking the stagger to a couple of ms
    // still increases, but every flyer then lands at once — the very look this feature
    // replaced. Compared against the exported constant so the test cannot drift from
    // the component by restating the number.
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBe(i * FLOAT_IN_STAGGER_MS);
    }
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

/**
 * Once-per-SESSION cascade (`ux-designer` gate, PR #145). NIVEAUX unmounts on every
 * rubrique switch, so without this the ~2.5s entrance replayed on each OPTIONS→NIVEAUX
 * round trip, hiding level names and lock badges the player had just read.
 */
describe("FlyerWall float-in — once per session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("uses sessionStorage, so a new session animates again", () => {
    expect(hasCascadePlayed()).toBe(false);
    markCascadePlayed();
    expect(hasCascadePlayed()).toBe(true);
    // A *session* flag, not a lifetime one: clearing the session must re-arm it, which is
    // what separates it from muf_seen_tutorial_nudge.
    sessionStorage.clear();
    expect(hasCascadePlayed()).toBe(false);
  });

  it("marks the cascade played on mount, so a remount renders settled", () => {
    expect(hasCascadePlayed()).toBe(false);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        createElement(FlyerWall, {
          reducedMotion: false,
          unlockedLevels: new Set<string>(),
          onPlay: () => undefined,
          prefs: DEFAULT_PREFS,
          onSavePrefs: () => undefined,
        }),
      );
    });
    expect(hasCascadePlayed()).toBe(true);
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("does not touch the lifetime nudge flag", () => {
    // Conflating the two keys would either freeze the cascade forever or make the
    // first-run nudge reappear every session.
    markCascadePlayed();
    expect(localStorage.getItem("muf_seen_tutorial_nudge")).toBeNull();
  });
});

/**
 * The two decisions recorded in docs/game-design/ux/decision-niveaux-entrance-animation.md
 * pinned at the RENDER level. Both were previously only documented: the session flag was
 * round-tripped without ever asserting what the markup does with it, and the focus test
 * passed identically with or without `preventScroll` — so either could have been undone
 * without a red test.
 */
describe("FlyerWall — ux-designer decisions, pinned in the markup", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
  });

  function mountWall(): HTMLDivElement {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(FlyerWall, {
          reducedMotion: false,
          unlockedLevels: new Set<string>(),
          onPlay: () => undefined,
          prefs: DEFAULT_PREFS,
          onSavePrefs: () => undefined,
        }),
      );
    });
    return container;
  }

  it("renders slots SETTLED when the cascade already played this session", () => {
    markCascadePlayed();
    const el = mountWall().querySelector(".muf-flyer-slot");
    expect(el).not.toBeNull();
    // Asserted against the CSS-module TOKEN, not the literal "slotSettled": the emitted
    // class name is a build artefact, so a hash-only naming strategy would fail this test
    // while the behaviour stayed correct.
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    expect(el?.className).toContain(settled);
  });

  it("renders slots ANIMATING on the first mount of a session", () => {
    const el = mountWall().querySelector(".muf-flyer-slot");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    expect(el?.className).not.toContain(settled);
  });

  it("settles the wall at once when a keyboard user arrives mid-cascade", () => {
    // The drift (±44px) exceeds the wall's 16px padding, so mid-entrance an edge flyer and
    // its focus ring poke past `.rubriquesLevels`' overflow-x clip and get cut. Settling on
    // arrival closes that window; without it a keyboard user can lose their focus indicator.
    //
    // The keydown is dispatched on WINDOW, not on the flyer, because that is where the
    // real one lands: a Tab that arrives from outside the wall fires on whatever had focus
    // before, never on us. Dispatching it on the flyer would pass while the production
    // listener sat on the wrong node.
    markTutorialNudgeSeen(); // not a first visit ⇒ no auto-focus to muddy the signal
    const el = mountWall().querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    expect(el).not.toBeNull();
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    expect(container?.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      el?.focus();
    });
    expect(container?.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("does NOT settle when the focus follows a pointer press", () => {
    // The regression the golden E2E gate caught: settling mid-click rips the animation off
    // the flyer, it jumps out from under the cursor between mousedown and mouseup, and the
    // click lands on nothing. The guard is the last INPUT TYPE — deliberately neither
    // :focus-visible (engine-dependent on a script-focusable div) nor a pointer-recency
    // window (broken on touch, pinned by the next test).
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    expect(el).not.toBeNull();
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el?.focus();
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
  });

  it("does NOT settle on a touch tap, whose own focus arrives AFTER its pointerup", () => {
    // The exact event order of a tap, which is what makes this different from a mouse
    // click: pointerdown → pointerup → (synthetic) mousedown → focus → mouseup → click.
    // The focus lands after the gesture has already ENDED, so any guard that treats
    // pointerup as "the gesture is over" reads a tap as a keyboard arrival, settles, and
    // yanks the flyer out from under the finger before its click — the mobile twin of the
    // desktop regression above.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
      el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }));
    });
    act(() => {
      el?.focus(); // the tap's OWN focus, arriving late
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
  });

  it("settles for a focus that arrives with NO input event at all (assistive tech)", () => {
    // A VoiceOver swipe or an NVDA rotor jump moves DOM focus without the page ever seeing
    // a keydown. Requiring one shut out exactly the population this rule protects: the
    // clipped focus ring is the accessibility reason it exists in the first place. So
    // settling is the DEFAULT, and only a focus belonging to a pointer gesture is skipped.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.focus(); // no keydown, no pointerdown — focus simply moves
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("does NOT settle when a SECOND finger lands while the first is still tapping", () => {
    // Touches are concurrent. A thumb resting on the wall while the index finger taps fires
    // a second pointerdown, and a single shared marker would be clobbered by it: the tapping
    // finger's own focus would then match nothing, settle the wall, and yank the flyer out
    // from under it mid-gesture — the exact regression this guard exists to prevent,
    // reintroduced by the guard itself. Keyed by pointerId, both gestures stay live.
    markTutorialNudgeSeen();
    const container = mountWall();
    const slots = container.querySelectorAll<HTMLElement>(".muf-flyer-slot [role='button']");
    const first = slots[0];
    const second = slots[1];
    expect(second).toBeDefined();
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      first?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 1 }),
      );
      // The resting thumb, landing on another flyer while the first gesture is still live.
      second?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch", pointerId: 2 }),
      );
      first?.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true, pointerType: "touch", pointerId: 1 }),
      );
    });
    act(() => {
      first?.focus(); // the tapping finger's OWN focus, arriving after its pointerup
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
  });

  it("releases the marker for a right-click, which dispatches no click at all", () => {
    // The third way a gesture ends: a right-click fires pointerdown but never a click, and
    // an OS-intercepted long-press does not reliably cancel either. Released only by the
    // player's next interaction ANYWHERE, the marker would stay live in between — and a
    // virtual cursor landing on that same flyer in that window would be denied its settle.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
      // pointerup included because a browser always sends one: only pointerup/pointercancel
      // END a gesture, and click/contextmenu then drop the ended ones. A marker released
      // without its pointer having lifted would be the wholesale clearing that wipes a
      // second finger still down.
      el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 2 }));
      el?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }));
    });
    act(() => {
      el?.focus(); // assistive tech arriving on the same flyer, no click in between
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("keeps a still-pressed finger's marker when another finger's click fires", () => {
    // Pointers overlap: finger A lifting fires the click that used to wipe the WHOLE map,
    // including finger B still down. B's own focus would then match nothing and settle the
    // wall out from under it. Only ENDED gestures are released, so B survives A's click.
    markTutorialNudgeSeen();
    const container = mountWall();
    const slots = container.querySelectorAll<HTMLElement>(".muf-flyer-slot [role='button']");
    const a = slots[0];
    const b = slots[1];
    expect(b).toBeDefined();
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      a?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));
      b?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 2 }));
      // Finger A completes its whole gesture. Finger B is still down.
      a?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
      a?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => {
      b?.focus(); // finger B's own focus, its gesture still live
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
  });

  it("keeps a live tap's marker when a stray keydown lands mid-gesture", () => {
    // A keystroke anywhere used to clear the whole map. On a tablet with a keyboard, a key
    // pressed while a finger is down would strip that finger's marker, and the tap's own
    // focus would settle the wall from under it. Only ended gestures are released.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    });
    act(() => {
      el?.focus();
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
  });

  it("repairs a marker whose release never reached the window", () => {
    // Let go outside the window, or let the OS take the pointer during an app switch, and
    // neither pointerup nor pointercancel ever arrives. The entry then sits at ended:false
    // forever — releaseEnded skips it — and that flyer is denied its settle for the rest of
    // the mount. A later move reporting no buttons is proof the press is over.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, buttons: 1 }));
      // No pointerup, no pointercancel — the release happened off-window.
      window.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, buttons: 0 }));
    });
    act(() => {
      el?.focus(); // a keyboard or screen-reader arrival, much later
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("drops markers in flight when the page loses the window", () => {
    // Touch needs its own repair: a finger emits no hover move on the way back, so the
    // buttons check above never runs for it. Whatever was pressed when the page went away
    // cannot be the gesture behind a focus that arrives after it returns.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
      window.dispatchEvent(new Event("blur"));
    });
    act(() => {
      el?.focus();
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("still settles when assistive tech lands on a flyer clicked earlier", () => {
    // The pointer marker must not outlive its own gesture. A press that produces NO focus
    // — macOS Safari does not focus a control on click without Full Keyboard Access, and a
    // locked flyer only shakes — would otherwise leave it aimed at that flyer for good, and
    // a screen reader arriving on the SAME flyer later would be mistaken for that stale
    // gesture's own focus and denied the settle. The gesture's click releases it.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
      el?.dispatchEvent(new MouseEvent("click", { bubbles: true })); // gesture over, no focus
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
    act(() => {
      el?.focus(); // a virtual cursor arriving later, no key event in between
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("drops an ended gesture's marker once it has swallowed its own focus", () => {
    // The marker of an ENDED gesture is kept for exactly one thing: the tap's own focus,
    // which on touch arrives after its pointerup. Once that focus has been swallowed the
    // marker has done its job — but click/contextmenu/keydown were the only things that
    // collected it, and a gesture can end without any of the three ever firing (a tap whose
    // click is suppressed, a press the page navigates away from). The marker then outlived
    // its gesture and denied the NEXT arrival — keyboard or screen reader — its settle,
    // which is the accessibility reason the whole rule exists.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerType: "touch" }));
      el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerType: "touch" }));
    });
    act(() => {
      el?.focus(); // the tap's OWN late focus — still correctly swallowed
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
    // No click, no contextmenu, no keydown ever follows. A later arrival on the same flyer
    // must still settle the wall.
    act(() => {
      el?.blur();
      el?.focus();
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("does not hand the showing back after the player settled the wall themselves", () => {
    // Settling on arrival REMOVES a running animation, so the last slot fires
    // animationcancel, never animationend — "ran to its end" alone would read this wall as
    // never having shown. It did show: the player ended it. A later, unrelated reduced-motion
    // flip must not treat that as a cascade owed back, or they get a second one.
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (reducedMotion: boolean) => {
      act(() => {
        root.render(
          createElement(FlyerWall, {
            reducedMotion,
            unlockedLevels: new Set<string>(),
            onPlay: () => undefined,
            prefs: DEFAULT_PREFS,
            onSavePrefs: () => undefined,
          }),
        );
      });
    };
    markTutorialNudgeSeen();
    render(false);
    expect(hasCascadePlayed()).toBe(true);
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']")?.focus();
    });
    render(true); // unrelated OS flip, later in the same visit
    expect(hasCascadePlayed()).toBe(true);
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("still settles for a keyboard arrival right after a pointer release", () => {
    // Clicking a locked flyer only shakes it and leaves the player on the menu, so a Tab
    // pressed immediately afterwards is a real arrival — and it is the one the settle
    // exists to serve. Keyed on the key event, so no elapsed-time window has to be tuned
    // to be both long enough for a tap's late focus and short enough for this.
    markTutorialNudgeSeen();
    const container = mountWall();
    const el = container.querySelector<HTMLElement>(".muf-flyer-slot [role='button']");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    act(() => {
      el?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      el?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      el?.focus();
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
  });

  it("does NOT let the first-visit auto-focus cancel the cascade", () => {
    // That focus is ours, not the player's. Counting it would make a first-time visitor
    // the only person who never sees the entrance.
    const el = mountWall().querySelector(".muf-flyer-slot");
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");
    expect(el?.className).not.toContain(settled);
  });

  it("focuses the first-visit flyer with preventScroll", () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    mountWall();
    // Without preventScroll the browser scrolls to the flyer's still-transformed rect —
    // i.e. to where the sheet is NOT. document.activeElement alone cannot catch that.
    const withPrevent = focusSpy.mock.calls.some((args) => args[0]?.preventScroll === true);
    expect(withPrevent).toBe(true);
  });
});

/** Reduced motion suppresses the animation, so the session's one showing must not be
 *  spent on it — otherwise turning the in-app toggle off mid-session shows nothing. */
describe("FlyerWall — reduced motion does not burn the session's cascade", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("leaves the flag unset when reduced motion is on", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    act(() => {
      root.render(
        createElement(FlyerWall, {
          // The PROP, not prefs: App derives it once and threads it (ADR-0054 §3).
          reducedMotion: true,
          unlockedLevels: new Set<string>(),
          onPlay: () => undefined,
          prefs: DEFAULT_PREFS,
          onSavePrefs: () => undefined,
        }),
      );
    });
    expect(hasCascadePlayed()).toBe(false);
    act(() => {
      root.unmount();
    });
    container.remove();
  });
});

/** The OS half of `reducedMotion` is live: it can turn on WHILE the cascade is falling,
 *  cutting it off via the CSS kill switch. The session's one showing must not be spent on
 *  a cascade the player only half saw. */
describe("FlyerWall — reduced motion turning on mid-cascade hands the showing back", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("clears the flag when reduced motion turns on during a playing cascade", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (reducedMotion: boolean) => {
      act(() => {
        root.render(
          createElement(FlyerWall, {
            reducedMotion,
            unlockedLevels: new Set<string>(),
            onPlay: () => undefined,
            prefs: DEFAULT_PREFS,
            onSavePrefs: () => undefined,
          }),
        );
      });
    };
    render(false);
    expect(hasCascadePlayed()).toBe(true); // cascade started, session marked
    render(true); // OS switch flipped mid-fall
    expect(hasCascadePlayed()).toBe(false); // showing handed back
    const settled = wallStyles.slotSettled;
    if (settled === undefined) throw new Error("styles.slotSettled missing from the stylesheet");

    // ...and flipping it back OFF, still on this SAME mount, must NOT restart the fall.
    // `playCascade` is latched at mount, so once the CSS kill switch stops applying there
    // is nothing left to hold the wall down unless the interruption was latched too — the
    // player would watch the whole cascade replay in the middle of their visit, which is
    // precisely what decision §6 of the UX gate forbids. The flag stays handed back, so a
    // LATER mount still gets its showing.
    render(false);
    expect(container.querySelector(".muf-flyer-slot")?.className).toContain(settled);
    expect(hasCascadePlayed()).toBe(false);

    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("does NOT hand the showing back once the cascade has run to its end", () => {
    // The hand-back exists for a cascade the player only half saw. After it finishes, the
    // session HAS had its showing, and clearing the flag would buy a second full cascade
    // later in the same session — decision §1 broken from the other end. Reduced motion
    // can be toggled at any moment of a visit, for reasons unrelated to this wall.
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const render = (reducedMotion: boolean) => {
      act(() => {
        root.render(
          createElement(FlyerWall, {
            reducedMotion,
            unlockedLevels: new Set<string>(),
            onPlay: () => undefined,
            prefs: DEFAULT_PREFS,
            onSavePrefs: () => undefined,
          }),
        );
      });
    };
    render(false);
    expect(hasCascadePlayed()).toBe(true);

    // The LAST slot's animationend is the end of the cascade: same duration everywhere,
    // delay growing with the index. jsdom runs no animation, so it is dispatched here.
    const slots = container.querySelectorAll(".muf-flyer-slot");
    const last = slots[slots.length - 1];
    expect(last).toBeDefined();
    act(() => {
      last?.dispatchEvent(new AnimationEvent("animationend", { bubbles: true }));
    });

    render(true); // OS switch flipped LONG after the fall ended
    expect(hasCascadePlayed()).toBe(true); // showing kept — it was fully seen
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("exposes clearCascadePlayed as the inverse of markCascadePlayed", () => {
    markCascadePlayed();
    expect(hasCascadePlayed()).toBe(true);
    clearCascadePlayed();
    expect(hasCascadePlayed()).toBe(false);
  });
});
