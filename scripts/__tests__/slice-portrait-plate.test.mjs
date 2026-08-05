import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect } from "vitest";
import { PNG } from "pngjs";
import {
  detectRegistration,
  computeVerticalScale,
  ensurePngBuffer,
  isAspectPreservedScaleDown,
  runReal,
  measureSeamContinuity,
  PLATE_WIDTH,
  PLATE_HEIGHT,
  PLATE_MARGIN_PX,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  EYE_LINE_FRAC,
  NOSE_BASE_FRAC,
  TOLERANCE,
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

  it("aborts on an isolated elongated artefact in an otherwise empty margin (blank-margin ratio bypass)", () => {
    // 10px run: clears MIN_TICK_RUN_PX (6px) alone, so a 1px-grain-style test
    // would not exercise this path. The margin is otherwise fully empty, so
    // the window's own background median is 0 — before the fix this
    // short-circuited the peak-ratio check entirely (`backgroundRun > 0 &&
    // …`) and let ANY ≥6px artefact (scanner hair, fold, crop-line residue)
    // through as a "confident" repère. This is the nominal shape of a FAILED
    // plate (FLUX drew nothing), so it must abort, not fabricate a geometry.
    const png = blankPlate();
    drawTick(png, 0, PLATE_MARGIN_PX, eyeNominalAbs(), 10);
    expect(() => detectRegistration(png)).toThrow(/registration ABORTED/);
    expect(() => detectRegistration(png)).toThrow(/isolated artefact/);
  });

  it("does not reject a franc 20px tick on an otherwise empty margin as an isolated artefact", () => {
    // Same empty-margin shape as above, but the mark is long enough (matches
    // the default `plateWithFourTicks` tick length exercised by the pass
    // case). `findTick` isn't exported, so this asserts the negative through
    // the public surface: the four-marks-missing plate still aborts overall
    // (this is only one of four required marks), but never for the reason
    // "isolated artefact" — that failure mode must be specific to short runs.
    const png = blankPlate();
    drawTick(png, 0, PLATE_MARGIN_PX, eyeNominalAbs(), 20);
    expect(() => detectRegistration(png)).toThrow(/registration ABORTED/);
    expect(() => detectRegistration(png)).not.toThrow(/isolated artefact/);
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

  it("aborts with a diagnostic (not a crash) when the search window falls off an undersized plate", () => {
    // A plate delivered shorter than nominal (wrong resolution) pushes the
    // eye-line search window [nominalY-24, nominalY+24] entirely past
    // png.height. Before the fix this produced `rows = []` and a TypeError
    // from `best.run` inside findTick — a JS stack trace instead of the
    // named-mark diagnostic every other rejection path produces.
    const shortHeight = 100;
    // Precondition for this test to exercise the intended path at all: the
    // search window must actually fall outside the shortened plate.
    expect(eyeNominalAbs() - 24).toBeGreaterThan(shortHeight - 1);
    const png = new PNG({ width: PLATE_WIDTH, height: shortHeight });
    png.data.fill(255);
    for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;

    let error;
    try {
      detectRegistration(png);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error).not.toBeInstanceOf(TypeError);
    expect(error.message).toMatch(/registration ABORTED/);
    expect(error.message).toMatch(/falls entirely outside the plate/);
  });
});

describe("computeVerticalScale — sign-guarded scale (art brief §8 C-B)", () => {
  // `detectRegistration`'s own confidence windows never overlap (256px apart
  // for ±24px windows — verified by the pass/tilt cases above), so a real
  // plate can never make the two measured y's swap through noise alone. The
  // guard's job is on the (eyeY, noseY) *values* regardless of how a
  // corrupted/mirrored capture pipeline produced them, so it is exercised
  // directly here rather than by contorting a synthetic plate to defeat the
  // window search.
  it("aborts — produces NOTHING — when nose-base measures at or above eye-line", () => {
    // Both a franc inversion (mirrored plate) and an exact tie (degenerate
    // zero-height plate) must be refused, not silently coerced into a
    // plausible-looking mirrored or zero/degenerate scale.
    expect(() => computeVerticalScale(700, 400)).toThrow(/registration ABORTED/);
    expect(() => computeVerticalScale(700, 400)).toThrow(/not above nose-base/);
    expect(() => computeVerticalScale(500, 500)).toThrow(/registration ABORTED/);
  });

  it("produces a positive scale for correctly-ordered marks", () => {
    const eyeNominalAbs = PLATE_MARGIN_PX + Math.round(EYE_LINE_FRAC * PORTRAIT_HEIGHT);
    const noseNominalAbs = PLATE_MARGIN_PX + Math.round(NOSE_BASE_FRAC * PORTRAIT_HEIGHT);
    const { scale } = computeVerticalScale(eyeNominalAbs, noseNominalAbs);
    expect(scale).toBeGreaterThan(0);
  });
});

// RE-PANEL run 3995325a: a plate response that isn't a valid PNG must abort
// with a diagnostic naming the HTTP status / Content-Type / body size / first
// 200 chars — NOT reach pngjs and produce its illegible "unrecognised content
// at end of stream". Every fixture below is either a genuine encoder output
// (the JPEG is produced by @napi-rs/canvas itself, not hand-typed bytes) or
// literal prose/JSON text — no fixture is reverse-engineered from what the
// checker under test wants to see, per the pattern that masked the last two
// defects in this story.
function withMeta(buf, { httpStatus, contentType }) {
  buf.httpStatus = httpStatus;
  buf.contentType = contentType;
  return buf;
}

describe("ensurePngBuffer — content guard before the PNG decoder (RE-PANEL run 3995325a)", () => {
  it("passes a genuine PNG through unchanged", async () => {
    const png = new PNG({ width: 4, height: 4 });
    png.data.fill(0);
    const buf = withMeta(PNG.sync.write(png), { httpStatus: 200, contentType: "image/png" });
    const out = await ensurePngBuffer(buf);
    expect(out).toBe(buf);
  });

  it("aborts on an HTML error page served with HTTP 200, naming status/Content-Type/size/preview", async () => {
    const html =
      "<!DOCTYPE html><html><head><title>503 Service Unavailable</title></head>" +
      "<body><h1>Service Unavailable</h1><p>The upstream generator is overloaded, try again " +
      "later.</p></body></html>";
    const buf = withMeta(Buffer.from(html, "utf8"), { httpStatus: 200, contentType: "text/html" });

    let error;
    try {
      await ensurePngBuffer(buf);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/not a recognisable PNG or JPEG/);
    expect(error.message).toMatch(/HTTP status: 200/);
    expect(error.message).toMatch(/Content-Type: text\/html/);
    expect(error.message).toMatch(new RegExp(`body size: ${buf.length} bytes`));
    expect(error.message).toMatch(/Service Unavailable/); // part of the 200-char preview
  });

  it("aborts on a JSON queue/moderation response served with HTTP 200", async () => {
    const json = JSON.stringify({
      status: "queued",
      message: "Your request is in the moderation queue, poll again shortly.",
      queuePosition: 7,
    });
    const buf = withMeta(Buffer.from(json, "utf8"), {
      httpStatus: 200,
      contentType: "application/json",
    });

    await expect(ensurePngBuffer(buf)).rejects.toThrow(/not a recognisable PNG or JPEG/);
    await expect(ensurePngBuffer(buf)).rejects.toThrow(/Content-Type: application\/json/);
    await expect(ensurePngBuffer(buf)).rejects.toThrow(/queued/);
  });

  it("decodes and re-encodes a genuine JPEG to PNG (Pollinations serving the wrong format)", async () => {
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(16, 12);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#336699";
    ctx.fillRect(0, 0, 16, 12);
    // Genuine JPEG bytes from the encoder itself — not hand-typed magic bytes
    // stapled onto arbitrary data.
    const jpegBuf = withMeta(canvas.toBuffer("image/jpeg"), {
      httpStatus: 200,
      contentType: "image/jpeg",
    });

    const out = await ensurePngBuffer(jpegBuf);
    // Re-encoded output must itself be a valid, decodable PNG of the same
    // pixel dimensions — proves this is a real decode+re-encode, not a stub.
    const decoded = PNG.sync.read(out);
    expect(decoded.width).toBe(16);
    expect(decoded.height).toBe(12);
  });

  it("aborts on a truncated/empty body", async () => {
    const buf = withMeta(Buffer.alloc(0), { httpStatus: 200, contentType: "image/png" });
    await expect(ensurePngBuffer(buf)).rejects.toThrow(/not a recognisable PNG or JPEG/);
    await expect(ensurePngBuffer(buf)).rejects.toThrow(/body size: 0 bytes/);
  });
});

describe("isAspectPreservedScaleDown", () => {
  // Fixed literals, deliberately NOT the live PLATE_WIDTH/PLATE_HEIGHT: this
  // locks in the historical incident (§9 GATE DIMENSIONS resized the plate
  // specifically BECAUSE of this measurement) so the regression test stays
  // meaningful regardless of what the constants are today.
  it("matches the exact historical measurement from run 5d5b5f51 (674x874 vs the then-requested 864x1120)", () => {
    expect(isAspectPreservedScaleDown(674, 874, 864, 1120)).toBe(true);
  });

  it("flags a scale-down at TODAY's dimensions by the same ~0.78 linear factor", () => {
    const scale = 0.78;
    expect(
      isAspectPreservedScaleDown(
        Math.round(PLATE_WIDTH * scale),
        Math.round(PLATE_HEIGHT * scale),
        PLATE_WIDTH,
        PLATE_HEIGHT,
      ),
    ).toBe(true);
  });

  it("rejects a genuinely different aspect ratio", () => {
    expect(
      isAspectPreservedScaleDown(PLATE_WIDTH - 200, PLATE_HEIGHT, PLATE_WIDTH, PLATE_HEIGHT),
    ).toBe(false);
  });
});

describe("runReal — wrong-size plate diagnostic (RE-PANEL run 5d5b5f51)", () => {
  // Drives the real function through its documented `--plate <file>` escape
  // hatch (fetchPlate reads straight from disk, no network/prompt-gate
  // involved) with genuine pngjs-encoded PNGs at the exact measured
  // dimensions — not a mocked runReal, the real size-check branch.
  function writeTempPlate(width, height) {
    const png = new PNG({ width, height });
    png.data.fill(255);
    for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;
    const file = path.join(
      os.tmpdir(),
      `slice-portrait-plate-test-${width}x${height}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
    );
    fs.writeFileSync(file, PNG.sync.write(png));
    return file;
  }

  it("names an aspect-preserved scale-down as Pollinations' cap, not a framing drift", async () => {
    // Today's PLATE_WIDTH/PLATE_HEIGHT (676x871 = 588,796px) were sized by §9
    // GATE DIMENSIONS specifically to sit under the ~590K px cap — so a
    // scale-down AT THESE dimensions is now the "UNEXPECTED, investigate as a
    // new failure mode" branch, not the "consistent with the documented cap"
    // one. Both branches share the same aspect-ratio-preserved / ESCALATE
    // framing, which is what's asserted generically; the UNEXPECTED wording
    // is asserted specifically to lock in today's regime.
    const scale = 0.78;
    const file = writeTempPlate(Math.round(PLATE_WIDTH * scale), Math.round(PLATE_HEIGHT * scale));
    try {
      await expect(runReal(file)).rejects.toThrow(
        /aspect ratio is preserved \(not a framing drift\)/,
      );
      await expect(runReal(file)).rejects.toThrow(/ESCALATE to lead-art/);
      await expect(runReal(file)).rejects.toThrow(/UNEXPECTED.*under the.*documented ~590K/);
      await expect(runReal(file)).rejects.not.toThrow(
        /framing drifted beyond what registration can fix/,
      );
    } finally {
      fs.rmSync(file, { force: true });
    }
  });

  it("still calls out a genuine framing drift (different aspect ratio) by its own message", async () => {
    const file = writeTempPlate(PLATE_WIDTH - 200, PLATE_HEIGHT); // same height, much narrower
    try {
      await expect(runReal(file)).rejects.toThrow(
        /framing drifted beyond what registration can fix/,
      );
      await expect(runReal(file)).rejects.not.toThrow(/aspect ratio is preserved/);
    } finally {
      fs.rmSync(file, { force: true });
    }
  });
});

// brief §9.3 (lead-art, 2026-08-05): sub-pixel alpha-weighted centroid is
// MANDATORY (PASS thresholds sit below 1 whole pixel) and the tangent must be
// a real fit, not the previous `tangentDeltaDeg: 0` stub. Fixtures below are
// GENUINE @napi-rs/canvas-drawn anti-aliased strokes — not hand-typed pixel
// arrays tuned to what the centroid/fit under test wants to see, per the
// pattern that masked the earlier defects in this story.
async function makeContourImage({
  width,
  height,
  leftX,
  rightX,
  strokeWidthPx = 5,
  tiltPerRow = 0,
}) {
  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = strokeWidthPx;
  for (const x0 of [leftX, rightX]) {
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + tiltPerRow * height, height);
    ctx.stroke();
  }
  const imgData = ctx.getImageData(0, 0, width, height);
  return { width, height, data: Buffer.from(imgData.data) };
}

// A single isolated dot at exactly one row, nothing else in the image — used
// to starve the tangent-fit window (brief §9.3's 5%-of-H arc) of usable
// points while still leaving ink at the measured row itself, so the
// sub-pixel-centroid check upstream still succeeds.
async function makeSingleRowDot({ width, height, y, xs, dotWidthPx = 6 }) {
  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#000000";
  for (const x of xs) ctx.fillRect(x - dotWidthPx / 2, y, dotWidthPx, 1);
  const imgData = ctx.getImageData(0, 0, width, height);
  return { width, height, data: Buffer.from(imgData.data) };
}

describe("measureSeamContinuity — sub-pixel centroid + tangent fit (art brief §9.3)", () => {
  const IMG_HEIGHT = 60;
  const SEAM_ROW = 30;
  const LEFT_X = 100;
  const RIGHT_X = PORTRAIT_WIDTH - 100;

  it("passes with near-zero deltas when top and bottom bands are drawn identically", async () => {
    const img = await makeContourImage({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      leftX: LEFT_X,
      rightX: RIGHT_X,
    });
    const report = measureSeamContinuity(img, SEAM_ROW - 1, img, SEAM_ROW);
    expect(report.pass).toBe(true);
    expect(report.values.leftHalfWidthDeltaPx).toBeLessThan(TOLERANCE.skullHalfWidth.pass);
    expect(report.values.rightHalfWidthDeltaPx).toBeLessThan(TOLERANCE.skullHalfWidth.pass);
    expect(report.values.medianAxisDeltaPx).toBeLessThan(TOLERANCE.medianAxis.pass);
    expect(report.values.tangentDeltaDeg).toBeLessThan(TOLERANCE.tangentDeg.pass);
  });

  it("fails when the top and bottom skull edges are shifted by more than the FAIL threshold", async () => {
    const shiftPx = TOLERANCE.skullHalfWidth.fail + 2;
    const topImg = await makeContourImage({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      leftX: LEFT_X,
      rightX: RIGHT_X,
    });
    const botImg = await makeContourImage({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      leftX: LEFT_X + shiftPx,
      rightX: RIGHT_X + shiftPx,
    });
    const report = measureSeamContinuity(topImg, SEAM_ROW - 1, botImg, SEAM_ROW);
    expect(report.pass).toBe(false);
    expect(report.values.leftHalfWidthDeltaPx).toBeGreaterThanOrEqual(
      TOLERANCE.skullHalfWidth.fail,
    );
  });

  it("detects a real tangent (tilted contour) as a non-zero delta, not the old always-0 stub", async () => {
    // Top band's contour drawn dead vertical, bottom band's tilted by a slope
    // large enough to read clearly above the 3° PASS threshold over the
    // fit span.
    const topImg = await makeContourImage({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      leftX: LEFT_X,
      rightX: RIGHT_X,
      tiltPerRow: 0,
    });
    const botImg = await makeContourImage({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      leftX: LEFT_X,
      rightX: RIGHT_X,
      tiltPerRow: 0.3, // ~16.7 degrees off vertical
    });
    const report = measureSeamContinuity(topImg, SEAM_ROW - 1, botImg, SEAM_ROW);
    expect(report.values.tangentDeltaDeg).toBeGreaterThan(TOLERANCE.tangentDeg.fail);
    expect(report.pass).toBe(false);
  });

  it("throws rather than reporting a verdict when there is no ink near the integer edge", () => {
    const blank = {
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      data: Buffer.alloc(PORTRAIT_WIDTH * IMG_HEIGHT * 4, 255),
    };
    expect(() => measureSeamContinuity(blank, SEAM_ROW - 1, blank, SEAM_ROW)).toThrow(
      /alpha-weighted sub-pixel centroid/,
    );
  });

  it("throws rather than defaulting to a 0° tangent when the fit window has fewer than 2 usable points", async () => {
    // Ink exists at exactly the measured row (so the centroid check passes)
    // but nowhere else in the 5%-of-H fit window either side — the fit
    // itself cannot be produced.
    const img = await makeSingleRowDot({
      width: PORTRAIT_WIDTH,
      height: IMG_HEIGHT,
      y: SEAM_ROW,
      xs: [LEFT_X, RIGHT_X],
    });
    expect(() => measureSeamContinuity(img, SEAM_ROW, img, SEAM_ROW)).toThrow(/tangent-fit window/);
  });
});

describe("seam ordinates land on whole pixels with no float rounding (brief §9.2)", () => {
  it("computes C1/C2/C3 as exact integers at H=775 (775 = 25 × 31, chosen for this)", () => {
    expect(0.32 * PORTRAIT_HEIGHT).toBe(248);
    expect(0.52 * PORTRAIT_HEIGHT).toBe(403);
    expect(0.72 * PORTRAIT_HEIGHT).toBe(558);
    // Plate-absolute ordinates (+ margin), matching lead-art's brief §9.2
    // values verbatim: C1 y=296, C2 y=451, C3 y=606.
    expect(PLATE_MARGIN_PX + 248).toBe(296);
    expect(PLATE_MARGIN_PX + 403).toBe(451);
    expect(PLATE_MARGIN_PX + 558).toBe(606);
  });
});
