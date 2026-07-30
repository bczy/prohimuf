import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LEVELS } from "@game/levels/levels";
import { FlyerMotif, MOTIF_BY_LEVEL_ID } from "../FlyerMotif";
import type { MotifKind } from "../FlyerMotif";

const ALL_KINDS: readonly MotifKind[] = ["spiral", "smiley", "rings", "halftone", "invader"];

function render(kind: MotifKind, tiltDeg = 0): string {
  return renderToStaticMarkup(createElement(FlyerMotif, { kind, size: 54, tiltDeg }));
}

describe("FlyerMotif", () => {
  it("draws real geometry for every kind — no empty or placeholder svg", () => {
    for (const kind of ALL_KINDS) {
      const html = render(kind);
      expect(html, kind).toContain("<svg");
      // Each motif must emit at least one painted shape. Catches a shape function that
      // silently returns nothing (e.g. a loop whose threshold rejects every candidate).
      expect(html, kind).toMatch(/<(circle|rect|path|polyline)/);
    }
  });

  it("paints in the sheet's ink via currentColor, never a hard-coded hex", () => {
    // art-direction single-source rule: no render surface may redeclare a colour. A hex
    // here would also break the locked flyer's greyscale filter inheritance.
    for (const kind of ALL_KINDS) {
      const html = render(kind);
      expect(html, kind).toContain("currentColor");
      expect(html, kind).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it("is decorative: hidden from assistive tech and not focusable", () => {
    // The wall is navigated by roving focus; an emblem that announced itself would add
    // noise to every flyer's reading without carrying any information.
    for (const kind of ALL_KINDS) {
      const html = render(kind);
      expect(html, kind).toContain('aria-hidden="true"');
      expect(html, kind).toContain('focusable="false"');
    }
  });

  it("is deterministic — identical props render identical markup", () => {
    // The flyer wall's materiality doctrine forbids Math.random anywhere in the render
    // path, so a re-render must never reshuffle the ink under the player's eyes.
    for (const kind of ALL_KINDS) {
      expect(render(kind), kind).toBe(render(kind));
    }
  });

  it("applies the tilt only when asked, so an untilted motif carries no transform", () => {
    expect(render("spiral", 0)).not.toContain("rotate(");
    expect(render("spiral", 3)).toContain("rotate(3deg)");
  });

  it("assigns a distinct motif to every level that has one", () => {
    // The spiral is SPIRALE 23's signature; reusing any emblem across sheets would turn
    // a crew's mark into wallpaper.
    const assigned = Object.values(MOTIF_BY_LEVEL_ID).filter(
      (k): k is MotifKind => k !== undefined,
    );
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("only maps ids that actually exist in LEVELS", () => {
    // Guards the rename case: a level id changed in game data would otherwise leave a
    // dangling motif entry that silently stops rendering.
    const ids = new Set(LEVELS.map((l) => l.id));
    for (const id of Object.keys(MOTIF_BY_LEVEL_ID)) {
      expect(ids.has(id), `${id} is mapped to a motif but is not a shipped level`).toBe(true);
    }
  });
});
