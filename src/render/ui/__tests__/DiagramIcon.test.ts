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

    const [before] = withClass(digits, "di-bf-timer-before");
    const [after] = withClass(digits, "di-bf-timer-after");
    expect(before?.opacity).toBe(0);
    expect(after?.opacity).toBeGreaterThan(0);
    // The boss-trigger state is the one kept, with the Commandant it announces.
    expect(html).toContain("00:00");
    expect(html).toContain("assets/boss/commander_shielded.png");
  });
});

/**
 * Motion ON (the DEFAULT path, twin of the frozen frame above). `boss-finale-switch` paints two
 * timer readouts at the SAME anchor (x=33,y=68, same size, same textAnchor). The group keyframes
 * bottom out at a deliberate residual (.25 / .32 = "dimmed, deprecated") which is right for the
 * chrono box and the quota bar and WRONG for two texts on one anchor: it ghosts "00:05" through
 * "00:00" for most of the 3.2s cycle. The digits therefore ride their own `di-bf-timer-*` pair,
 * which reaches a hard 0. Asserted off the inline `<style>` the component ships.
 */

/** The opacity values a one-line `@keyframes <name> { … }` rule declares, in source order. */
function keyframeOpacities(css: string, name: string): readonly number[] {
  const rule = new RegExp(`@keyframes\\s+${name}\\s*\\{(.*)$`, "m").exec(css);
  return [...(rule?.[1] ?? "").matchAll(/opacity:\s*([\d.]+)/g)].map(([, v]) => Number(v));
}

describe("DiagramIcon boss-finale-switch timer separation with motion ON", () => {
  const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: "boss-finale-switch" }));

  it("vanishes each timer readout in its hidden phase instead of merely dimming it", () => {
    const digits = frozenFrame(html).filter((element) => element.tag === "text");
    expect(digits.length).toBe(2);
    for (const digit of digits) {
      // The classes driving this digit, `di-anim` (the reduced-motion kill switch) aside.
      const [animation, ...extra] = (/class="([^"]*)"/.exec(digit.attrs)?.[1] ?? "")
        .split(/\s+/)
        .filter((name) => name !== "" && name !== "di-anim");
      // One animation per digit: two opacity animations on one node is how they overprint.
      expect(extra).toEqual([]);
      const opacities = keyframeOpacities(html, animation ?? "");
      expect(opacities.length).toBeGreaterThan(1);
      // Two states on ONE anchor (x=33,y=68): the hidden phase must reach 0. This is also what
      // keeps the digits OFF the `.25`/`.32` group keyframes — those would fail right here.
      expect(Math.min(...opacities)).toBe(0);
      expect(Math.max(...opacities)).toBe(1);
    }
  });

  it("leaves the box/bar residual and the position keyframes untouched", () => {
    // Non-regression: the .25/.32 dimming IS the intended read for the deprecated chrono box and
    // quota bar (they stay on screen, faded), and the arrow/flow motion math is unchanged.
    expect(keyframeOpacities(html, "di-bf-before")).toEqual([1, 0.25]);
    expect(keyframeOpacities(html, "di-bf-after")).toEqual([0.32, 1]);
    expect(html).toContain("transform:translateX(0)}");
    expect(html).toContain("transform:translateX(4px)}");
    expect(html).toContain("stroke-dashoffset:18");
    expect(html).toContain("stroke-dashoffset:-18");
  });
});
