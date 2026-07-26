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

  it("renders boss-finale-switch with Belliard windows and the shipped Commandant pose", () => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: "boss-finale-switch" }));
    expect(html).toContain("assets/levels/belliard/facade.png");
    expect(html).toContain("assets/boss/commander_shielded.png");
    expect(html).not.toContain("assets/enemy_riot_shooting.png");
    expect(html).toContain("di-bf-flow");
  });
});

/**
 * Reduced motion (AC9 / TUT-A11Y-03): `.di-anim { animation: none }` leaves each element on its
 * PRESENTATION ATTRIBUTES, so those attributes are the frozen frame the player actually sees. The
 * markup is static, so the frame is assertable straight off the server render.
 */

interface FrozenElement {
  readonly tag: string;
  readonly attrs: string;
  readonly opacity: number;
}

/** Every `.di-anim` element with the opacity it freezes at (absent attribute = fully opaque). */
function frozenFrame(html: string): readonly FrozenElement[] {
  const frame: FrozenElement[] = [];
  for (const [, rawTag, rawAttrs] of html.matchAll(/<(\w+)((?:\s[^>]*)?)>/g)) {
    const tag = rawTag ?? "";
    const attrs = rawAttrs ?? "";
    if (!/class="[^"]*\bdi-anim\b[^"]*"/.test(attrs)) continue;
    const opacity = /\sopacity="([^"]*)"/.exec(attrs);
    frame.push({ tag, attrs, opacity: opacity === null ? 1 : Number(opacity[1]) });
  }
  return frame;
}

function withClass(frame: readonly FrozenElement[], className: string): readonly FrozenElement[] {
  return frame.filter((element) =>
    new RegExp(`class="[^"]*\\b${className}\\b`).test(element.attrs),
  );
}

describe("DiagramIcon reduced-motion frozen frame", () => {
  it.each(DIAGRAM_KINDS)("leaves %s with a non-empty frozen frame", (kind) => {
    const frame = frozenFrame(renderToStaticMarkup(createElement(DiagramIcon, { kind })));
    expect(frame.length).toBeGreaterThan(0);
    expect(frame.filter((element) => element.opacity > 0).length).toBeGreaterThan(0);
  });

  it("keeps the shot-read lesson visible: enemy round in flight plus danger ring", () => {
    const frame = frozenFrame(
      renderToStaticMarkup(
        createElement(DiagramIcon, { kind: "shot-read-player-vs-enemy-bullet" }),
      ),
    );
    const [bullet] = withClass(frame, "di-sr-bullet");
    const [ring] = withClass(frame, "di-sr-warning");
    expect(bullet?.opacity).toBeGreaterThan(0);
    expect(ring?.opacity).toBeGreaterThan(0);
    // Frozen mid-course between the enemy (x≈84-94) and the player (x=28) so travel reads.
    expect(bullet?.attrs).toContain('cx="68"');
  });

  it("freezes boss-finale-switch on ONE timer state, never both digits overprinted", () => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: "boss-finale-switch" }));
    const frame = frozenFrame(html);
    const digits = frame.filter((element) => element.tag === "text");
    // Both readouts are painted at the same anchor (x=33,y=68): exactly one may be visible.
    expect(digits.length).toBe(2);
    expect(digits.filter((element) => element.opacity > 0).length).toBe(1);

    const [before] = withClass(digits, "di-bf-before");
    const [after] = withClass(digits, "di-bf-after");
    expect(before?.opacity).toBe(0);
    expect(after?.opacity).toBeGreaterThan(0);
    // The boss-trigger state is the one kept, with the Commandant it announces.
    expect(html).toContain("00:00");
    expect(html).toContain("assets/boss/commander_shielded.png");
  });
});
