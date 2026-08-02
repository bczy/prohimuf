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
} from "../FlyerWall";

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
      el?.dispatchEvent(new MouseEvent("click", { bubbles: true })); // gesture over, no focus
    });
    expect(container.querySelector(".muf-flyer-slot")?.className).not.toContain(settled);
    act(() => {
      el?.focus(); // a virtual cursor arriving later, no key event in between
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
