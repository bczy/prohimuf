import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GestureIcon } from "../GestureIcon";

const GESTURE_KINDS = ["mouse-click", "edge-scroll", "two-finger-tap", "swipe-pan"] as const;

describe("GestureIcon", () => {
  it.each(GESTURE_KINDS)("renders %s as an SVG icon", (kind) => {
    const html = renderToStaticMarkup(createElement(GestureIcon, { kind }));
    expect(html).toContain("<svg");
  });

  it("renders edge-scroll with the shipped Belliard in-game backdrop strip", () => {
    const html = renderToStaticMarkup(createElement(GestureIcon, { kind: "edge-scroll" }));
    expect(html).toContain("assets/levels/belliard/street-wide.png");
    expect(html).toContain("gi-es-bg-scroll");
  });
});
