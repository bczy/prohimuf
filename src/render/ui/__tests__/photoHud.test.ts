import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { HudPhotoQte } from "@render/ui/hud/types";
import { PhotoHud } from "@render/ui/photo/PhotoHud";

function hud(over: Partial<HudPhotoQte> = {}): HudPhotoQte {
  return {
    phase: "ACTIVE",
    posture: "RAISED",
    film: 6,
    suspicion: 0,
    suspicionMax: 100,
    focalMm: 300,
    bracket: "dashed",
    ...over,
  };
}

function markup(data: HudPhotoQte | undefined): string {
  return renderToStaticMarkup(createElement(PhotoHud, { photoQte: data }));
}

/** The needle's rotation, in degrees, as rendered. */
function needleAngle(html: string): number {
  return Number(/--needle-angle:\s*(-?[\d.]+)deg/.exec(html)?.[1]);
}

/** Every text node the dress puts in the DOM. */
function textContent(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

describe("PhotoHud", () => {
  it("renders nothing when the set-piece is not holding the scene", () => {
    expect(markup(undefined)).toBe("");
  });

  it("prints the film count — the one numeral on this HUD (§2.1)", () => {
    expect(textContent(markup(hud({ film: 4 })))).toMatch(/\b4\b/);
  });

  it("keeps the film counter visible in BOTH postures (running out is a stake either way)", () => {
    expect(textContent(markup(hud({ posture: "LOWERED", film: 2 })))).toMatch(/\b2\b/);
  });

  it("A7 — never prints the suspicion value, in any form", () => {
    const text = textContent(markup(hud({ suspicion: 73, suspicionMax: 100 })));
    expect(text).not.toMatch(/73/);
    // The only digits allowed in the dress are the film count and the focal label.
    expect(text.replace(/6|300 mm/g, "")).not.toMatch(/\d/);
  });

  it("T-4 — carries no light/exposure vocabulary anywhere in the dress", () => {
    const html = markup(hud());
    expect(html).not.toMatch(/\b(lux|EV|f\/|ISO|exposition|posemètre|expos)/i);
  });

  it("maps suspicion onto the needle ANGLE across the full sweep", () => {
    expect(needleAngle(markup(hud({ suspicion: 0 })))).toBeCloseTo(-45, 5);
    expect(needleAngle(markup(hud({ suspicion: 50 })))).toBeCloseTo(0, 5);
    expect(needleAngle(markup(hud({ suspicion: 100 })))).toBeCloseTo(45, 5);
  });

  it("clamps a hostile suspicion value instead of flinging the needle off the dial", () => {
    expect(needleAngle(markup(hud({ suspicion: 400 })))).toBeCloseTo(45, 5);
    expect(needleAngle(markup(hud({ suspicion: -20 })))).toBeCloseTo(-45, 5);
    expect(needleAngle(markup(hud({ suspicion: 10, suspicionMax: 0 })))).toBeCloseTo(-45, 5);
    expect(needleAngle(markup(hud({ suspicion: Number.NaN })))).toBeCloseTo(-45, 5);
  });

  it("has no posture branch on the needle — the TICK freezes it while lowered", () => {
    const raised = markup(hud({ posture: "RAISED", suspicion: 40 }));
    const lowered = markup(hud({ posture: "LOWERED", suspicion: 40 }));
    expect(needleAngle(lowered)).toBe(needleAngle(raised));
  });

  it("engraves the focal length (fiction §4.2)", () => {
    expect(textContent(markup(hud({ focalMm: 135 })))).toContain("135 mm");
  });

  it("carries no bracket/verdict-shaped tell: the dress is identical at every bracket state", () => {
    const states = (["dashed", "solid", "locked"] as const).map((bracket) =>
      markup(hud({ bracket })),
    );
    expect(new Set(states).size).toBe(1);
  });
});
