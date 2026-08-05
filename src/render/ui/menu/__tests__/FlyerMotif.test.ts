import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LEVELS } from "@game/levels/levels";
import { FlyerMotif, FLYER_EMBLEMS } from "../FlyerMotif";
import { LevelFlyer } from "../LevelFlyer";
import type { MotifKind } from "../FlyerMotif";

const ALL_KINDS: readonly MotifKind[] = ["spiral", "rings", "plumb", "chandelier"];

function render(kind: MotifKind, tiltDeg = 0, instanceId = "t", wearSeed = 5): string {
  return renderToStaticMarkup(
    createElement(FlyerMotif, { kind, size: 54, tiltDeg, instanceId, wearSeed }),
  );
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

  it("wears the ink with a FIXED turbulence seed", () => {
    // feTurbulence is only deterministic when the seed is explicit; leaving it to the
    // default would let the browser reshuffle the ink breakup between renders.
    const html = render("rings", 0, "a", 12);
    expect(html).toContain("feTurbulence");
    expect(html).toContain('seed="12"');
    expect(html).toContain("feDisplacementMap");
  });

  it("scopes filter ids per instance so two sheets never collide", () => {
    // A shared id would make every emblem on the wall inherit the first one's filter.
    expect(render("rings", 0, "belliard")).toContain("muf-motif-wear-belliard");
    expect(render("rings", 0, "vitry")).toContain("muf-motif-wear-vitry");
  });

  it("applies the tilt only when asked, so an untilted motif carries no transform", () => {
    expect(render("spiral", 0)).not.toContain("rotate(");
    expect(render("spiral", 3)).toContain("rotate(3deg)");
  });

  it("attributes each mark to the sheet the fiction gate assigned it", () => {
    // The gated map (docs/game-design/decision-flyer-crew-emblems-fiction.md): the mark a
    // sheet carries is universe attribution, not decoration, so it is asserted per sheet
    // rather than left to whatever the table happens to say.
    expect(FLYER_EMBLEMS.belliard?.kind).toBe("spiral");
    expect(FLYER_EMBLEMS.stalingrad?.kind).toBe("rings");
    expect(FLYER_EMBLEMS.vitry?.kind).toBe("plumb");
    expect(FLYER_EMBLEMS["niveau-final"]?.kind).toBe("chandelier");
  });

  it("leaves the tutorial sheet unsigned — no emblem at all", () => {
    // `SANS SYSTÈME · AVANT LE SON`: the one flyer with no crew and no info-line carries
    // no stamp either. Filling the slot to keep the table symmetrical would contradict the
    // sheet's own gated copy.
    expect(FLYER_EMBLEMS.tutorial).toBeUndefined();
  });

  it("keeps the finale's layout untouched by the emblem swap", () => {
    // A5b (promoting the finale to `hero`) was DEFERRED by the design gate: only the shape
    // changes, never the placement.
    expect(FLYER_EMBLEMS["niveau-final"]).toEqual({
      kind: "chandelier",
      slot: "body",
      offsetY: 18,
      sizePx: 88,
      tiltDeg: -3,
      wearSeed: 3,
    });
  });

  it("assigns a distinct motif to every level that has one", () => {
    // The spiral is SPIRALE 23's signature; reusing any emblem across sheets would turn
    // a crew's mark into wallpaper.
    const assigned = Object.values(FLYER_EMBLEMS)
      .filter((e) => e !== undefined)
      .map((e) => e.kind);
    expect(new Set(assigned).size).toBe(assigned.length);
  });

  it("shows its emblem whether the level is locked or unlocked", () => {
    // NADIR 94 shipped with no emblem at all: it is placed in the `hero` slot, and the
    // LOCKED layout rendered only `mid` and `body`. A slot that branch omits costs the
    // emblem exactly where it shows most — on a first visit, most of the wall is locked.
    // Asserting both states for EVERY mapped level catches the next omission without
    // anyone having to remember which slots each branch happens to offer.
    for (const level of LEVELS) {
      if (FLYER_EMBLEMS[level.id] === undefined) continue;
      for (const unlocked of [true, false]) {
        const markup = renderToStaticMarkup(
          createElement(LevelFlyer, {
            level,
            flyerIndex: 0,
            unlocked,
            stock: "#eee",
            restRotationDeg: 0,
            jitterPx: 0,
            focused: false,
            shaking: false,
            tabIndex: 0,
            onSelect: () => undefined,
            onKeyDown: () => undefined,
            onFocus: () => undefined,
            registerRef: () => undefined,
          }),
        );
        expect(markup, `${level.id} (unlocked=${String(unlocked)})`).toContain("motifRow");
      }
    }
  });

  it("only maps ids that actually exist in LEVELS", () => {
    // Guards the rename case: a level id changed in game data would otherwise leave a
    // dangling motif entry that silently stops rendering.
    const ids = new Set(LEVELS.map((l) => l.id));
    for (const id of Object.keys(FLYER_EMBLEMS)) {
      expect(ids.has(id), `${id} is mapped to a motif but is not a shipped level`).toBe(true);
    }
  });
});
