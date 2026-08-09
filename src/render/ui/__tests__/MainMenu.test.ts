import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import { MainMenu } from "../MainMenu";
import styles from "../MainMenu.module.css";

/**
 * The overflow-x clip that stops the flyer float-in from popping a transient horizontal
 * scrollbar is applied by a string comparison (`active === "levels"`). It is scoped to
 * NIVEAUX on purpose: SCORES and OPTIONS have no sideways drift, and clipping them would
 * trade a visible scrollbar for silently cut copy. Nothing else pins either half of that
 * contract, so a typo in the literal or a refactor of the `active` union would silently
 * drop the clip — bringing back the very regression this PR fixed.
 */
function markup(): string {
  return renderToStaticMarkup(
    createElement(MainMenu, {
      reducedMotion: false,
      unlockedLevels: new Set<string>(),
      onPlay: () => undefined,
      prefs: DEFAULT_PREFS,
      onSavePrefs: () => undefined,
    }),
  );
}

describe("MainMenu — NIVEAUX overflow clip", () => {
  beforeEach(() => {
    // The flyer wall reads a first-run flag from localStorage on mount.
    try {
      localStorage.clear();
    } catch {
      // storage unavailable in this environment — the guarded read handles it
    }
  });

  it("emits a distinct class for the clip, not a bare .rubriques", () => {
    // Guards the CSS-module wiring itself: if `rubriquesLevels` disappeared from the
    // stylesheet, `styles.rubriquesLevels` would be undefined and the clip would vanish
    // with no type error, since CSS-module lookups are `string | undefined`.
    expect(styles.rubriquesLevels).toBeTruthy();
    expect(styles.rubriquesLevels).not.toBe(styles.rubriques);
  });

  it("applies the clip class on the default (NIVEAUX) tab", () => {
    const cls = styles.rubriquesLevels;
    // Thrown, not defaulted: falling back to "" would make `toContain` pass against any
    // markup at all, turning a missing class into a green test.
    if (cls === undefined) throw new Error("styles.rubriquesLevels missing from the stylesheet");
    expect(markup()).toContain(cls);
  });

  it("keeps the shared rubriques container class alongside it", () => {
    // The clip is an ADDITION, not a replacement: losing `.rubriques` would drop
    // `flex: 1` and `overflow-y: auto` from the scrolling surface.
    const cls = styles.rubriques;
    if (cls === undefined) throw new Error("styles.rubriques missing from the stylesheet");
    expect(markup()).toContain(cls);
  });
});

/**
 * The OTHER half of the contract. The tests above only prove the clip is PRESENT on
 * NIVEAUX; inverting the condition, or applying the class unconditionally, would leave
 * them all green while silently clipping SCORES and OPTIONS — which is precisely what
 * decision §4 forbids, since those two must keep a visible scrollbar rather than cut copy.
 */
describe("MainMenu — the clip is absent on the other rubriques", () => {
  let root: ReturnType<typeof createRoot> | null = null;
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // storage unavailable — the component's guarded reads handle it
    }
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    container?.remove();
    root = null;
    container = null;
  });

  function mountMenu(): HTMLDivElement {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root?.render(
        createElement(MainMenu, {
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

  function surface(): Element | null {
    // The rubrique surface is the tabpanel-ish container that carries `.rubriques`.
    const cls = styles.rubriques;
    if (cls === undefined) throw new Error("styles.rubriques missing from the stylesheet");
    return container?.querySelector(`.${cls}`) ?? null;
  }

  function clipClass(): string {
    const cls = styles.rubriquesLevels;
    if (cls === undefined) throw new Error("styles.rubriquesLevels missing from the stylesheet");
    return cls;
  }

  function selectTab(label: string): void {
    // `el.textContent` is read DIRECTLY, and that is deliberate — please do not "fix" it.
    // Under this project's TypeScript setup `textContent` resolves to `string`, not
    // `string | null` (a probe assigning null to it fails TS2322), so `tsc` is clean. Every
    // null-handling form is REJECTED by the type-aware lint, which reads the same types:
    //   `?.`            → no-unnecessary-condition ("unnecessary optional chain")
    //   `?? ""`         → no-unnecessary-condition ("left side never nullish")
    //   `String(...)`   → no-unnecessary-type-conversion ("already a string")
    // So no form satisfies both a `string | null` reading and this repo's lint; the direct
    // call is the only one that builds here.
    const tab = Array.from(container?.querySelectorAll('[role="tab"]') ?? []).find((el) =>
      el.textContent.includes(label),
    );
    if (!(tab instanceof HTMLElement)) throw new Error(`tab ${label} not found`);
    act(() => {
      tab.click();
    });
  }

  it("clips on NIVEAUX", () => {
    mountMenu();
    expect(surface()?.className).toContain(clipClass());
  });

  it("does NOT clip on SCORES", () => {
    mountMenu();
    selectTab("SCORES");
    expect(surface()?.className).not.toContain(clipClass());
  });

  it("does NOT clip on OPTIONS", () => {
    mountMenu();
    selectTab("OPTIONS");
    expect(surface()?.className).not.toContain(clipClass());
  });
});
