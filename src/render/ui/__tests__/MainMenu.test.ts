import { describe, it, expect, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
