import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect } from "vitest";
import { PNG } from "pngjs";
import {
  detectSkullContour,
  measureControlAnchors,
  cropPortrait,
  compareToHeroPlate,
  INTER_PLATE_TOLERANCE,
  ensurePngBuffer,
  isAspectPreservedScaleDown,
  runReal,
  runControlDerivative,
  measureSeamContinuity,
  PLATE_WIDTH,
  PLATE_HEIGHT,
  PLATE_MARGIN_PX,
  PORTRAIT_WIDTH,
  PORTRAIT_HEIGHT,
  SEAMS,
  TOLERANCE,
} from "../slice-portrait-plate.mjs";

// VOIE B (brief §10, Bertrand/lead-art, ROLL 2 retrospective 2026-08-05):
// margin ticks are abandoned, recalage reads the skull OUTLINE drawn inside
// the portrait instead. Fixtures below are GENUINE @napi-rs/canvas-drawn
// plates (an ellipse for the closed skull outline, filled bands for the A1
// brow/eye bar and A2 mouth line) — not hand-typed pixel arrays tuned to
// what the detector under test wants to see, per the pattern that masked
// three earlier defects in this story. Geometry was verified empirically
// (crown/chin/axis measured against the drawn ellipse's own known geometry)
// before being locked into these tests.
const SEAM_ABS = SEAMS.map((f) => PLATE_MARGIN_PX + Math.round(f * PORTRAIT_HEIGHT));
const [C1_ABS, C2_ABS, C3_ABS] = SEAM_ABS;
const CONTOUR_REGION = {
  xFrom: PLATE_MARGIN_PX,
  xTo: PLATE_MARGIN_PX + PORTRAIT_WIDTH,
  yFrom: PLATE_MARGIN_PX,
  yTo: PLATE_MARGIN_PX + PORTRAIT_HEIGHT,
};
const DEFAULT_A1_Y = Math.round((C1_ABS + C2_ABS) / 2);
const DEFAULT_A2_Y = C3_ABS + 40;

async function makeSkullPlate({
  crownLocalY = 15,
  chinLocalY = PORTRAIT_HEIGHT - 60,
  axisShiftPx = 0,
  ellipseWidthFrac = 0.8,
  outlineWidthPx = 5,
  drawA1 = true,
  drawA2 = true,
  a1Y = DEFAULT_A1_Y,
  a2Y = DEFAULT_A2_Y,
  a1TiltRightPx = 0,
  a1SecondPeak = false,
} = {}) {
  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(PLATE_WIDTH, PLATE_HEIGHT);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, PLATE_WIDTH, PLATE_HEIGHT);

  const cx = PLATE_MARGIN_PX + PORTRAIT_WIDTH / 2 + axisShiftPx;
  const rx = (PORTRAIT_WIDTH * ellipseWidthFrac) / 2;
  const topAbs = PLATE_MARGIN_PX + crownLocalY;
  const botAbs = PLATE_MARGIN_PX + chinLocalY;
  const cy = (topAbs + botAbs) / 2;
  const ry = (botAbs - topAbs) / 2;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = outlineWidthPx;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#000000";
  if (drawA1) {
    ctx.fillRect(PLATE_MARGIN_PX + 40, a1Y, PORTRAIT_WIDTH / 2 - 60, 16);
    ctx.fillRect(
      PLATE_MARGIN_PX + PORTRAIT_WIDTH / 2 + 20,
      a1Y + a1TiltRightPx,
      PORTRAIT_WIDTH / 2 - 60,
      16,
    );
    if (a1SecondPeak) ctx.fillRect(PLATE_MARGIN_PX + 40, a1Y + 30, PORTRAIT_WIDTH - 80, 16);
  }
  if (drawA2) ctx.fillRect(PLATE_MARGIN_PX + 60, a2Y, PORTRAIT_WIDTH - 120, 8);

  const imgData = ctx.getImageData(0, 0, PLATE_WIDTH, PLATE_HEIGHT);
  return { width: PLATE_WIDTH, height: PLATE_HEIGHT, data: Buffer.from(imgData.data) };
}

function blankPlate() {
  const png = new PNG({ width: PLATE_WIDTH, height: PLATE_HEIGHT });
  png.data.fill(255);
  for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;
  return png;
}

describe("detectSkullContour — the A0 registration reference (brief §10.2)", () => {
  it("measures crown/chin/axis on a genuine closed outline", async () => {
    const png = await makeSkullPlate();
    const contour = detectSkullContour(png, CONTOUR_REGION);
    // The drawn ellipse's mathematical extremes are PLATE_MARGIN_PX+15 and
    // PLATE_MARGIN_PX+(PORTRAIT_HEIGHT-60); MIN_CONTOUR_RUN_PX's floor and
    // the stroke's own anti-aliasing mean the measured extreme lands within
    // a handful of px of that (measured 61 vs a nominal 63 in practice), not
    // exactly on it — asserted with a generous tolerance, not equality.
    expect(Math.abs(contour.crownY - (PLATE_MARGIN_PX + 15))).toBeLessThan(8);
    expect(Math.abs(contour.chinY - (PLATE_MARGIN_PX + (PORTRAIT_HEIGHT - 60)))).toBeLessThan(8);
    expect(Math.abs(contour.axisX - (PLATE_MARGIN_PX + PORTRAIT_WIDTH / 2))).toBeLessThan(1);
    expect(contour.coverageRatio).toBe(1);
  });

  it("aborts — never a guess — when the plate is entirely blank (no outline at all)", () => {
    const png = blankPlate();
    expect(() => detectSkullContour(png, CONTOUR_REGION)).toThrow(/skull contour ABORTED/);
    expect(() => detectSkullContour(png, CONTOUR_REGION)).toThrow(
      /not a measurable object on this plate/,
    );
  });

  it("axis reflects a genuine horizontal shift of the skull", async () => {
    const shifted = await makeSkullPlate({ axisShiftPx: 15 });
    const contour = detectSkullContour(shifted, CONTOUR_REGION);
    expect(Math.abs(contour.axisX - (PLATE_MARGIN_PX + PORTRAIT_WIDTH / 2 + 15))).toBeLessThan(2);
  });
});

describe("measureControlAnchors — A1/A2, control-only (brief §10.2)", () => {
  it("measures A1/A2 and reports zero tilt for a level plate", async () => {
    const png = await makeSkullPlate();
    const contour = detectSkullContour(png, CONTOUR_REGION);
    const controls = measureControlAnchors(png, contour);
    expect(controls.a1Y).toBeCloseTo(DEFAULT_A1_Y, 0);
    expect(controls.a2Y).toBeCloseTo(DEFAULT_A2_Y, 0);
    expect(controls.tiltPx).toBe(0);
  });

  it("measures a genuine left/right tilt at A1", async () => {
    const png = await makeSkullPlate({ a1TiltRightPx: 12 });
    const contour = detectSkullContour(png, CONTOUR_REGION);
    const controls = measureControlAnchors(png, contour);
    expect(controls.tiltPx).toBe(12);
  });

  it("aborts — the C-B defect, transposed — when a peak has a competing second candidate within 2x", async () => {
    // A second dark band 30px below A1's, on a plate that otherwise has
    // blank cheeks/forehead as the prompt clause demands. Brief §10.2
    // clause 1, verbatim: a peak is an anchor only if it's the darkest AND
    // separated from the window's second-best candidate by >=2x.
    const png = await makeSkullPlate({ a1SecondPeak: true });
    const contour = detectSkullContour(png, CONTOUR_REGION);
    let error;
    try {
      measureControlAnchors(png, contour);
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(error.message).toMatch(/control anchors ABORTED/);
    expect(error.message).toMatch(/A1 \(brow\/eye bar\)/);
    expect(error.message).toMatch(/need 2x/);
  });

  it("aborts when the A1 bands are not drawn at all (blank cheeks and forehead, nothing else)", async () => {
    // A2's own search window ([C3, chin]) overlaps the lower half of the
    // drawn ellipse outline itself in this synthetic fixture (a real
    // drawing's outline sits at the silhouette edge, not inside the A2
    // band, so this coincidence is a fixture artefact, not a detector
    // gap) — so this asserts on A1 specifically, which has no such overlap.
    const png = await makeSkullPlate({ drawA1: false });
    const contour = detectSkullContour(png, CONTOUR_REGION);
    expect(() => measureControlAnchors(png, contour)).toThrow(/control anchors ABORTED/);
    expect(() => measureControlAnchors(png, contour)).toThrow(/A1 \(brow\/eye bar\), left half/);
    expect(() => measureControlAnchors(png, contour)).toThrow(/A1 \(brow\/eye bar\), right half/);
  });

  it("rejects an anchor drawn on top of a seam (brief §10.2 clause 3)", async () => {
    // A1 band placed AT C1 itself instead of between C1 and C2 — the search
    // window is still [C1,C2] so it's still found, but it now sits at
    // distance 0 from the seam, well inside the 5%-of-H exclusion zone.
    const png = await makeSkullPlate({ a1Y: C1_ABS });
    const contour = detectSkullContour(png, CONTOUR_REGION);
    expect(() => measureControlAnchors(png, contour)).toThrow(/crosses a seam/);
  });
});

describe("cropPortrait — straight crop, no resample (VOIE B, no hero reference for a lone plate)", () => {
  it("crops the fixed PLATE_MARGIN_PX-offset window at the declared portrait size", async () => {
    const png = await makeSkullPlate();
    const portrait = cropPortrait(png);
    expect(portrait.width).toBe(PORTRAIT_WIDTH);
    expect(portrait.height).toBe(PORTRAIT_HEIGHT);
    // Spot-check: a pixel just inside the crop's top-left should match the
    // source plate's pixel at the corresponding PLATE_MARGIN_PX-offset
    // location.
    const srcIdx = (png.width * (PLATE_MARGIN_PX + 5) + (PLATE_MARGIN_PX + 5)) << 2;
    const dstIdx = (PORTRAIT_WIDTH * 5 + 5) << 2;
    expect(portrait.data[dstIdx]).toBe(png.data[srcIdx]);
  });
});

describe("compareToHeroPlate — inter-plate reproducibility (brief §10.3, NEW table)", () => {
  const hero = { crownY: 100, chinY: 700, axisX: 400, a1Y: 300, a2Y: 600, tiltPx: 2 };

  it("passes a candidate that reproduces the hero closely", () => {
    const candidate = { crownY: 101, chinY: 701, axisX: 400.5, a1Y: 301, a2Y: 601, tiltPx: 3 };
    const report = compareToHeroPlate(candidate, hero);
    expect(report.pass).toBe(true);
    expect(report.alerts).toEqual([]);
  });

  it("rejects on height drift at or beyond the 1.0% FAIL threshold", () => {
    const heroH = hero.chinY - hero.crownY; // 600
    const candidate = { ...hero, chinY: hero.chinY + Math.ceil(heroH * 0.011) };
    const report = compareToHeroPlate(candidate, hero);
    expect(report.pass).toBe(false);
    expect(report.values.heightDeltaPctOfH).toBeGreaterThanOrEqual(
      INTER_PLATE_TOLERANCE.heightDeltaPctOfH.fail,
    );
  });

  it("rejects on tilt at or beyond the 16px FAIL threshold (brief §10.3's tightened figure)", () => {
    const candidate = { ...hero, tiltPx: 16 };
    const report = compareToHeroPlate(candidate, hero);
    expect(report.pass).toBe(false);
  });

  it("rejects on 2+ simultaneous alert-zone values even if none individually fails", () => {
    const candidate = {
      crownY: hero.crownY,
      chinY: hero.chinY + 4, // heightDeltaPctOfH ≈0.67%, in the 0.5-1.0% alert zone
      axisX: hero.axisX + 2, // axisDeltaPx = 2px, in the 1.5-3.0px alert zone
      a1Y: hero.a1Y,
      a2Y: hero.a2Y,
      tiltPx: 0,
    };
    const report = compareToHeroPlate(candidate, hero);
    expect(report.alerts.length).toBeGreaterThanOrEqual(2);
    expect(report.pass).toBe(false);
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

describe("runControlDerivative — brief §10.4/§10.5's sequencing requirement", () => {
  // Drives the REAL function through its documented --plate-file arguments
  // (no mocking) with genuine @napi-rs/canvas-drawn hero/candidate plates —
  // "one derivative, measure, stop" before ever deriving the other 23.
  function writePlateFile(buf) {
    const file = path.join(
      os.tmpdir(),
      `slice-portrait-plate-cd-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
    );
    fs.writeFileSync(file, buf);
    return file;
  }

  it("passes a candidate that reproduces the hero plate closely", async () => {
    const { PNG: PNGLib } = await import("pngjs");
    const heroPng = await makeSkullPlate();
    const candidatePng = await makeSkullPlate({ crownLocalY: 16, a1Y: DEFAULT_A1_Y + 1 });
    const heroFile = writePlateFile(PNGLib.sync.write(heroPng));
    const candidateFile = writePlateFile(PNGLib.sync.write(candidatePng));
    try {
      const report = await runControlDerivative(candidateFile, heroFile);
      expect(report.pass).toBe(true);
    } finally {
      fs.rmSync(heroFile, { force: true });
      fs.rmSync(candidateFile, { force: true });
    }
  });

  it("rejects a candidate whose skull height does not reproduce (brief §10.4 abandon condition 3)", async () => {
    const { PNG: PNGLib } = await import("pngjs");
    const heroPng = await makeSkullPlate();
    // Chin ~140px shorter than the hero's — a real non-reproducibility, not
    // a rounding artefact.
    const candidatePng = await makeSkullPlate({ chinLocalY: PORTRAIT_HEIGHT - 200 });
    const heroFile = writePlateFile(PNGLib.sync.write(heroPng));
    const candidateFile = writePlateFile(PNGLib.sync.write(candidatePng));
    try {
      await expect(runControlDerivative(candidateFile, heroFile)).rejects.toThrow(
        /does not reproduce plate-to-plate/,
      );
    } finally {
      fs.rmSync(heroFile, { force: true });
      fs.rmSync(candidateFile, { force: true });
    }
  });
});

// A full runReal() end-to-end run through a genuine plate is deliberately
// NOT exercised here: on a passing plate it writes the 24 band PNGs and the
// manifest to the real, COMMITTED public/assets/portrait — exactly the
// resync the coordinator asked NOT to touch until a real hero plate exists
// (dev-gameplay's faceCatalogue.data.ts embeds that manifest's checksum).
// The registration logic runReal calls (detectSkullContour,
// measureControlAnchors, cropPortrait) is covered directly above, and the
// full pipeline was verified manually via the --plate/--control-derivative
// CLI flags against temp files outside the repo (see PR description).
