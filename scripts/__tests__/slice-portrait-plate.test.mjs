import { describe, it, expect } from "vitest";
import { PNG } from "pngjs";
import {
  detectRegistration,
  PLATE_WIDTH,
  PLATE_HEIGHT,
  PLATE_MARGIN_PX,
  PORTRAIT_HEIGHT,
  EYE_LINE_FRAC,
  NOSE_BASE_FRAC,
} from "../slice-portrait-plate.mjs";

// Confidence-gated registration (art brief §8 C-B): `detectRegistration` must
// ABORT (throw) rather than silently promote noise to a repère. These tests
// exercise the two failure modes the brief calls out by name — an empty
// margin, and an isolated grain — plus the pass case (a franc, continuous
// tick) and the tilt case (disagreeing-but-confident left/right ticks).

function blankPlate() {
  const png = new PNG({ width: PLATE_WIDTH, height: PLATE_HEIGHT });
  png.data.fill(255); // white paper, no alpha channel semantics needed here
  for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;
  return png;
}

function drawTick(png, xStart, xEnd, y, lengthPx) {
  const x0 = xStart;
  const x1 = Math.min(xEnd, xStart + lengthPx);
  for (let x = x0; x < x1; x++) {
    const idx = (png.width * y + x) << 2;
    png.data[idx] = 0;
    png.data[idx + 1] = 0;
    png.data[idx + 2] = 0;
    png.data[idx + 3] = 255;
  }
}

function eyeNominalAbs() {
  return PLATE_MARGIN_PX + Math.round(EYE_LINE_FRAC * PORTRAIT_HEIGHT);
}
function noseNominalAbs() {
  return PLATE_MARGIN_PX + Math.round(NOSE_BASE_FRAC * PORTRAIT_HEIGHT);
}

function plateWithFourTicks({ eyeLeftY, eyeRightY, noseLeftY, noseRightY, lengthPx = 20 } = {}) {
  const png = blankPlate();
  const rightXStart = PLATE_MARGIN_PX + (PLATE_WIDTH - PLATE_MARGIN_PX * 2);
  drawTick(png, 0, PLATE_MARGIN_PX, eyeLeftY ?? eyeNominalAbs(), lengthPx);
  drawTick(png, rightXStart, png.width, eyeRightY ?? eyeNominalAbs(), lengthPx);
  drawTick(png, 0, PLATE_MARGIN_PX, noseLeftY ?? noseNominalAbs(), lengthPx);
  drawTick(png, rightXStart, png.width, noseRightY ?? noseNominalAbs(), lengthPx);
  return png;
}

describe("detectRegistration — confidence-gated tick detection (brief §8 C-B)", () => {
  it("detects a franc, continuous tick at its nominal position", () => {
    const png = plateWithFourTicks();
    const { eyeY, noseY, tiltPx } = detectRegistration(png);
    expect(eyeY).toBeCloseTo(eyeNominalAbs(), 0);
    expect(noseY).toBeCloseTo(noseNominalAbs(), 0);
    expect(tiltPx).toBe(0);
  });

  it("aborts on an empty margin (no marks at all)", () => {
    const png = blankPlate();
    expect(() => detectRegistration(png)).toThrow(/registration ABORTED/);
    expect(() => detectRegistration(png)).toThrow(/eye-line tick, left margin/);
  });

  it("aborts on an isolated grain — a single dark pixel is not a tick", () => {
    const png = blankPlate();
    // One toner-grain pixel exactly at the nominal eye-line row, left margin.
    // It IS the darkest row in the window (darkness=1 > 0 everywhere else),
    // which is precisely the failure mode the brief warns about — the old
    // "darkest row wins" logic would have promoted this to a repère.
    const idx = (png.width * eyeNominalAbs() + 5) << 2;
    png.data[idx] = 0;
    png.data[idx + 1] = 0;
    png.data[idx + 2] = 0;
    png.data[idx + 3] = 255;
    expect(() => detectRegistration(png)).toThrow(/registration ABORTED/);
    expect(() => detectRegistration(png)).toThrow(/eye-line tick, left margin/);
  });

  it("names exactly the missing side when one tick is present without its pair", () => {
    const png = blankPlate();
    // Only the left eye-line tick is drawn; its right-margin pair is absent.
    drawTick(png, 0, PLATE_MARGIN_PX, eyeNominalAbs(), 20);
    drawTick(png, 0, PLATE_MARGIN_PX, noseNominalAbs(), 20);
    let error;
    try {
      detectRegistration(png);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/eye-line tick, right margin/);
    expect(error.message).toMatch(/nose-base tick, right margin/);
    expect(error.message).toMatch(/found with confidence: eye-line\/left, nose-base\/left/);
  });

  it("accepts confidently-detected left/right ticks that disagree (tilt), rather than aborting", () => {
    // Both sides are franc, continuous ticks — just offset from each other,
    // as a genuinely tilted plate would print them. Detection succeeds and
    // reports the disagreement as a tilt estimate; the seam-tolerance gate
    // downstream decides pass/fail on that estimate, not this function.
    const png = plateWithFourTicks({
      eyeLeftY: eyeNominalAbs() - 10,
      eyeRightY: eyeNominalAbs() + 10,
      noseLeftY: noseNominalAbs() - 10,
      noseRightY: noseNominalAbs() + 10,
    });
    const { tiltPx } = detectRegistration(png);
    expect(tiltPx).toBe(20);
  });
});
