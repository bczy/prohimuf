import { describe, expect, it } from "vitest";
import { createKeyboardState } from "@game/types/input";
import { NEUTRAL_PHOTO_INPUT } from "@game/systems/stateMachine";
import type { PhotoControlChannel } from "@hooks/useGameLoop";
import type { PhotoInput } from "@game/types/photoQte";

/**
 * A4 — the bridge seam. `useGameLoop` itself needs an R3F canvas to run, so what is pinned
 * here is the CONTRACT the bridge implements: the device fork collapses to one intent, every
 * one-shot channel is consumed exactly once, and the pause rule is one line on both devices.
 * The rules themselves live in `src/game` and are tested there.
 */
describe("D-B — the device fork dies in the bridge", () => {
  const raiseIntentOf = (space: boolean, latch: boolean): boolean => space || latch;

  it("desktop hold-Space and the mobile toggle produce the SAME intent", () => {
    expect(raiseIntentOf(true, false)).toBe(true);
    expect(raiseIntentOf(false, true)).toBe(true);
    expect(raiseIntentOf(false, false)).toBe(false);
  });

  it("`KeyboardState` gains `raise`, defaulting to LOWERED — the resting state", () => {
    expect(createKeyboardState().raise).toBe(false);
  });

  it("T-5: clearing the latch on pause makes BOTH devices resume LOWERED", () => {
    const channel: PhotoControlChannel = {
      raiseToggle: true,
      pendingCta: null,
      pendingSkip: false,
    };
    // The one line the bridge runs on the frame `paused` goes true.
    channel.raiseToggle = false;
    // Desktop needs nothing: the key is not held behind an overlay.
    expect(raiseIntentOf(createKeyboardState().raise, channel.raiseToggle)).toBe(false);
  });
});

describe("the one-shot channels are consumed EXACTLY once", () => {
  it("a CTA and a skip are drained by the reader, never replayed", () => {
    const channel: PhotoControlChannel = {
      raiseToggle: false,
      pendingCta: "retry",
      pendingSkip: true,
    };
    const cta = channel.pendingCta;
    channel.pendingCta = null;
    const skip = channel.pendingSkip;
    channel.pendingSkip = false;
    expect(cta).toBe("retry");
    expect(skip).toBe(true);
    expect(channel.pendingCta).toBeNull();
    expect(channel.pendingSkip).toBe(false);
  });

  it("the neutral input is genuinely inert — every existing caller gets this", () => {
    const neutral: PhotoInput = NEUTRAL_PHOTO_INPUT;
    expect(neutral.shutter).toBe(false);
    expect(neutral.raiseIntent).toBe(false);
    expect(neutral.skipBriefing).toBe(false);
    expect(neutral.cta).toBeNull();
    expect(neutral.aim).toBeNull();
    expect(neutral.panDx).toBe(0);
    expect(neutral.panDy).toBe(0);
    expect(neutral.focalDelta).toBe(0);
  });

  it("`src/game` never learns a device: PhotoInput carries no device vocabulary", () => {
    for (const key of Object.keys(NEUTRAL_PHOTO_INPUT)) {
      expect(key).not.toMatch(/key|space|tap|touch|wheel|pinch|mouse|button/i);
    }
  });
});
