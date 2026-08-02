import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PhotoControlChannel } from "@hooks/useGameLoop";
import { PhotoRaiseButton } from "@render/ui/controls/PhotoRaiseButton";

function channel(): { current: PhotoControlChannel } {
  return { current: { raiseToggle: false, pendingCta: null, pendingSkip: false } };
}

function markup(posture: "LOWERED" | "RAISED"): string {
  return renderToStaticMarkup(createElement(PhotoRaiseButton, { channelRef: channel(), posture }));
}

describe("PhotoRaiseButton (T-2, mobile only)", () => {
  it("draws two DIFFERENT icons for the two postures (no colour-only tell, A3bis)", () => {
    const lowered = markup("LOWERED");
    const raised = markup("RAISED");
    expect(lowered).not.toBe(raised);
    // The tell is geometry, not ink: neither state states a colour of its own.
    expect(lowered + raised).not.toMatch(/fill="#|stroke="#/);
  });

  it("announces the posture it is in, not the tap it wants", () => {
    expect(markup("RAISED")).toContain('aria-pressed="true"');
    expect(markup("LOWERED")).toContain('aria-pressed="false"');
  });

  it("is exempt from the touch layer's preventDefault (frozen cross-lane contract)", () => {
    expect(markup("LOWERED")).toContain("data-muf-ui");
  });

  it("is a TAP target, not a hold: no pointer-down/up handlers reach the DOM", () => {
    expect(markup("LOWERED")).not.toMatch(/onpointerdown|onmousedown|ontouchstart/i);
  });
});
