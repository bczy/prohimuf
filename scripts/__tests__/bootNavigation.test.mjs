import { describe, it, expect } from "vitest";
import { bootNavigation } from "../lib/bootNavigation.mjs";

/**
 * Pins align-windows.mjs's navigation-path choice (T4, PR #156 panel fix):
 * a GENERATED level is never listed on the menu wall (FlyerWall renders only
 * LEVELS — ADR-0075 §6), so the harness must NOT try enterLevel's menu-click
 * path for it. Its only boot seam is `?preview=level&level=<id>`, the one
 * e2e-generated-level.mjs already proves lands directly in PLAYING.
 */

const PREVIEW_URL = "http://127.0.0.1:4173/prohimuf/";

describe("bootNavigation (align-windows level entry)", () => {
  it("boots a GENERATED level through the ?preview=level seam, never the menu", () => {
    const nav = bootNavigation(
      { id: "fixture", name: "Niveau généré", generated: true },
      PREVIEW_URL,
    );
    expect(nav.path).toBe("preview-seam");
    expect(nav.url).toBe(`${PREVIEW_URL}?preview=level&level=fixture`);
  });

  it("URL-encodes the generated level id in the seam query", () => {
    const nav = bootNavigation({ id: "rue de l'été", generated: true }, PREVIEW_URL);
    expect(nav.url).toBe(`${PREVIEW_URL}?preview=level&level=rue%20de%20l'%C3%A9t%C3%A9`);
  });

  it("keeps the SHIPPED path unchanged: bare preview URL, then the menu wall", () => {
    const nav = bootNavigation({ id: "belliard", name: "Belliard" }, PREVIEW_URL);
    expect(nav.path).toBe("menu");
    expect(nav.url).toBe(PREVIEW_URL);
    expect(nav.url).not.toContain("preview=level");
  });
});
