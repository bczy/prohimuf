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
    const shortHeight = 100; // eyeNominalAbs() (458) - 24 > shortHeight - 1
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
  it("matches the exact measured case from run 5d5b5f51 (674x874 vs 864x1120)", () => {
    expect(isAspectPreservedScaleDown(674, 874, PLATE_WIDTH, PLATE_HEIGHT)).toBe(true);
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
    const file = writeTempPlate(674, 874); // run 5d5b5f51's exact measured size
    try {
      await expect(runReal(file)).rejects.toThrow(
        /aspect ratio is preserved \(not a framing drift\)/,
      );
      await expect(runReal(file)).rejects.toThrow(/ESCALATE to lead-art/);
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
