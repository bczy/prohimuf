import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DEFAULT_PREFS } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { SHORT_LANDSCAPE_MEDIA } from "@render/ui/print";
import { FlyerWall, buildPressionChoices } from "../FlyerWall";

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
