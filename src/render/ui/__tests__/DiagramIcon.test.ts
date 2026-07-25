import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DiagramIcon } from "../DiagramIcon";

const DIAGRAM_KINDS = [
  "shot-read-player-vs-enemy-bullet",
  "weapon-crate-loop",
  "threat-hierarchy-ladder",
  "boss-finale-switch",
  "hostage-ring",
] as const;

describe("DiagramIcon", () => {
  it.each(DIAGRAM_KINDS)("renders %s as an SVG diagram", (kind) => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind }));
    expect(html).toContain("<svg");
    expect(html).toContain(`data-diagram-kind="${kind}"`);
  });

  it("keeps hostage-ring on the shipped hostage/captor sprites", () => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: "hostage-ring" }));
    expect(html).toContain("assets/enemy_hostage.png");
    expect(html).toContain("assets/hostage/girl.png");
  });

  it("renders boss-finale-switch with Belliard windows and a commandant threat marker", () => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: "boss-finale-switch" }));
    expect(html).toContain("assets/levels/belliard/facade.png");
    expect(html).toContain("assets/enemy_riot_shooting.png");
    expect(html).toContain("di-bf-flow");
  });
});
