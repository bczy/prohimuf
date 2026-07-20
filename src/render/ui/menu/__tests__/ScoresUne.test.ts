import { describe, it, expect, beforeEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import { ANONYMOUS_NAME } from "@game/systems/highScoreSystem";
import { ScoresUne } from "../ScoresUne";

const LEVEL_ID = FIRST_PLAYABLE_LEVEL.id;

function seed(entries: unknown[]): void {
  localStorage.setItem(`muf_scores_${LEVEL_ID}`, JSON.stringify(entries));
}

function render(): string {
  return renderToStaticMarkup(createElement(ScoresUne, { unlockedLevels: new Set([LEVEL_ID]) }));
}

/**
 * ScoresUne renders each classement row's byline through `resolveDisplayName` (M1) —
 * a signed row shows the name, a legacy/skipped row shows the ANONYME fallback, never a
 * blank cell (AC3/AC4/AC5).
 */
describe("ScoresUne byline", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders a signed row's name in the classement", () => {
    seed([{ score: 5000, wave: 4, date: "1998-01-02T00:00:00.000Z", name: "DJ MEHDI" }]);
    const html = render();
    expect(html).toContain("DJ MEHDI");
  });

  it("falls back to ANONYME for a legacy row with no name (tolerant load)", () => {
    // Legacy blob written before the `name` field existed — must still render.
    seed([{ score: 3000, wave: 2, date: "1998-01-01T00:00:00.000Z" }]);
    const html = render();
    expect(html).toContain(ANONYMOUS_NAME);
  });

  it("shows the real name and the fallback side by side across rows", () => {
    seed([
      { score: 5000, wave: 4, date: "1998-01-02T00:00:00.000Z", name: "DJ MEHDI" },
      { score: 3000, wave: 2, date: "1998-01-01T00:00:00.000Z" },
    ]);
    const html = render();
    expect(html).toContain("DJ MEHDI");
    expect(html).toContain(ANONYMOUS_NAME);
  });
});
