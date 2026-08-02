#!/usr/bin/env node
/**
 * PHOTO SUBJECT-BOX GATE — F12(1)(b) enforcement for the QTE photo paparazzi
 * set-piece (techplan-photo-qte.md §6 Lane C, N-2; testplan-photo-qte.md CI-1/CI-2/H1/H2).
 *
 * F12(1)(b) ("drawn == box") is NOT unit-testable — the pure layer has no pixels — and NOT
 * screenshot-diffable — there is no golden frame. This is the only mechanism that catches a
 * sprite whose delivered opaque silhouette drifted from the authored keyframe table (a 4%
 * shrink, a re-centred pose, an animation that grows mid-hold) — the exact regression
 * `subjectBoxEdgeTolerance` exists to bound.
 *
 * Imports `subjectBoxAt` and `subjectBoxEdgeTolerance` from `@game/systems/photoQteSystem`
 * (via `scripts/lib/game-alias-loader.mjs`, a narrow Node module hook that resolves the
 * `@game/*` tsconfig alias for plain `node` scripts) — NEVER re-implemented here (lane C
 * honour clause, techplan §6). The authored keyframe table and instants are imported from
 * `@game/levels/photoQteBelliard` (`BELLIARD_PHOTO_QTE.subjectTrack` / `.instants`) — the
 * declared intervals below are DERIVED from that table, never a hand-typed second copy.
 *
 * TWO MODES:
 *   - KEYFRAME mode — the delivered sprite's opaque-pixel AABB (in scene units, via the
 *     pose's authored px→su scale) vs the authored box, at each of the 9 keyframes.
 *   - INTERVAL mode — samples the delivered animation (or a held static pose) at a fixed
 *     0.10 s step over each declared interval and asserts, at EVERY sample: (i) the opaque
 *     AABB stays within tolerance of `subjectBoxAt(track, t)` (the same evaluator the game
 *     uses); (ii) FLAT intervals: `cy` varies by <= tolerance across the whole sample set;
 *     (iii) NO_GROW intervals: `w`/`h` vary by <= tolerance across the whole sample set.
 *     Endpoint-only checks pass on an arc (a reverse-then-return dip) or a mid-hold drift —
 *     interval sampling is what makes those two failure modes visible (testplan H2).
 *
 * Declared intervals (derived from `BELLIARD_PHOTO_QTE`, not re-typed):
 *   - K2->K3 (ARRIVEE hold, ~19.2 s)   — HOLD, no drift.
 *   - K4->K5 (ECHANGE hold, ~14.7 s)   — HOLD, no drift.
 *   - K6->K7 ([53.0, 55.9], PLAQUE)    — FLAT (cy constant) + NO_GROW (w,h constant): one
 *     `berline_plate` sprite translated horizontally by the render, never re-scaled
 *     (levelArt.json photoQte.$comment, structural ruling 2) — this interval is what proves
 *     that construction rather than assuming a steady hand.
 *
 * Sampling step: 0.10 s, fixed (testplan CI-1) — finer than the shortest declared interval
 * (2.9 s) and deterministic (same inputs => same verdict).
 *
 * Assets: this gate needs delivered sprites at `public/assets/photoqte/**` (paths + px sizes
 * are lane C's own manifest wiring, `assetManifest.ts` — not authored yet at the time this
 * gate was written). Until both the sprites AND their scale mapping exist, every check
 * reports itself as SKIPPED with a named reason (never a false PASS) and the script exits
 * non-zero so a silently-skipped gate can never masquerade as green in CI.
 *
 * Usage:
 *   node scripts/check-photo-subject-boxes.mjs           # keyframe + interval, all sprites
 *   node scripts/check-photo-subject-boxes.mjs --json     # machine-readable
 * Exit: 0 only when every declared check actually RAN and passed. 1 on any breach, any
 * missing asset, or any missing scale mapping — and the message names the FIRST offending
 * instant/sample time, never just "failed".
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { register } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// Pure helpers (unit-tested in __tests__/check-photo-subject-boxes.test.mjs).
// No game-module dependency, no I/O — these are what make the gate provable.
// ---------------------------------------------------------------------------

/**
 * Opaque-pixel AABB of a decoded RGBA frame ({W,H,data} — see e2e-lib.mjs `decodePng`), in
 * PIXELS. Returns `null` when the frame is fully transparent (nothing to bound).
 */
export function opaquePixelAabb({ W, H, data }, { alphaMin = 1 } = {}) {
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const a = data[(y * W + x) * 4 + 3];
      if (a >= alphaMin) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return null;
  return { minX, minY, maxX, maxY };
}

/** Pixel AABB -> a scene-unit `Box` ({cx,cy,w,h}), given a uniform su-per-pixel scale. */
export function pixelAabbToSceneBox(aabbPx, suPerPx) {
  const w = (aabbPx.maxX - aabbPx.minX + 1) * suPerPx;
  const h = (aabbPx.maxY - aabbPx.minY + 1) * suPerPx;
  const cx = ((aabbPx.minX + aabbPx.maxX + 1) / 2) * suPerPx;
  const cy = ((aabbPx.minY + aabbPx.maxY + 1) / 2) * suPerPx;
  return { cx, cy, w, h };
}

/**
 * Compare a delivered box against the authored one, per edge (cx±w/2, cy±h/2), each within
 * the game's own `subjectBoxEdgeTolerance` (imported, never re-typed — lane C honour clause:
 * the 0.40 su floor / 5% fraction are `@game/systems/photoQteSystem`'s numbers, not this
 * script's). `edgeTolerance` is the imported evaluator, injected by the caller so this pure
 * helper stays free of the game-module import (unit-tested without the alias loader).
 * Returns `{ pass, deltas }` — `deltas` names every edge that breached, so a failure message
 * never says just "box mismatch".
 */
export function compareBox(actual, authored, edgeTolerance) {
  const authoredLeft = authored.cx - authored.w / 2;
  const authoredRight = authored.cx + authored.w / 2;
  const authoredTop = authored.cy - authored.h / 2;
  const authoredBottom = authored.cy + authored.h / 2;
  const actualLeft = actual.cx - actual.w / 2;
  const actualRight = actual.cx + actual.w / 2;
  const actualTop = actual.cy - actual.h / 2;
  const actualBottom = actual.cy + actual.h / 2;

  const edges = [
    { name: "left", authored: authoredLeft, actual: actualLeft, span: authored.w },
    { name: "right", authored: authoredRight, actual: actualRight, span: authored.w },
    { name: "top", authored: authoredTop, actual: actualTop, span: authored.h },
    { name: "bottom", authored: authoredBottom, actual: actualBottom, span: authored.h },
  ];

  const deltas = edges.map((e) => {
    const tol = edgeTolerance(e.span);
    const delta = Math.abs(e.actual - e.authored);
    return { edge: e.name, delta, tolerance: tol, pass: delta <= tol };
  });

  return { pass: deltas.every((d) => d.pass), deltas };
}

/** FLAT: `cy` must vary by <= tolerance across every sampled box in the interval. */
export function checkFlat(boxes, edgeTolerance) {
  const cys = boxes.map((b) => b.cy);
  const span = Math.max(...cys) - Math.min(...cys);
  const tol = edgeTolerance(cys[0]);
  return { pass: span <= tol, span, tolerance: tol };
}

/** NO_GROW: `w` and `h` must each vary by <= tolerance across every sampled box in the interval. */
export function checkNoGrow(boxes, edgeTolerance) {
  const ws = boxes.map((b) => b.w);
  const hs = boxes.map((b) => b.h);
  const wSpan = Math.max(...ws) - Math.min(...ws);
  const hSpan = Math.max(...hs) - Math.min(...hs);
  const wTol = edgeTolerance(ws[0]);
  const hTol = edgeTolerance(hs[0]);
  return {
    pass: wSpan <= wTol && hSpan <= hTol,
    wSpan,
    hSpan,
    tolerance: { w: wTol, h: hTol },
  };
}

/** Fixed 0.10 s deterministic sample times over `[from, to]`, inclusive of both ends. */
export function sampleTimes(from, to, step = 0.1) {
  const times = [];
  const n = Math.round((to - from) / step);
  for (let i = 0; i <= n; i++) {
    times.push(Number((from + i * step).toFixed(10)));
  }
  if (times[times.length - 1] !== to) times.push(to);
  return times;
}

/**
 * Derive the declared intervals (§ header) from the authored spec, never a hand-typed table.
 * `track` is `PhotoQteSpec.subjectTrack`; keyframes are matched by exact authored `t`.
 */
export function deriveDeclaredIntervals(track) {
  const byIndex = (i) => track[i];
  // K2/K3 = the two keyframes bounding the ARRIVEE hold (first non-tell -> next change).
  // K4/K5 = the ECHANGE hold. K6/K7 = the PLAQUE open->close (index 6/7 by authored order,
  // spec §2.5's fixed 9-keyframe shape: K0,K1,K2,K3,K4,K5,K6,K7,K8).
  if (track.length !== 9) {
    throw new Error(
      `deriveDeclaredIntervals: expected the authored 9-keyframe shape (K0..K8), got ${String(track.length)}`,
    );
  }
  return [
    { id: "K2-K3", kind: "hold", from: byIndex(2).t, to: byIndex(3).t },
    { id: "K4-K5", kind: "hold", from: byIndex(4).t, to: byIndex(5).t },
    { id: "K6-K7", kind: "flat+no_grow", from: byIndex(6).t, to: byIndex(7).t },
  ];
}

// ---------------------------------------------------------------------------
// CLI orchestration — resolves the game module + assets, reports or fails.
// ---------------------------------------------------------------------------

async function loadGameModule() {
  register("./lib/game-alias-loader.mjs", pathToFileURL(path.join(ROOT, "scripts") + "/"), {
    data: { root: pathToFileURL(ROOT + "/").href },
  });
  try {
    return await import("@game/systems/photoQteSystem");
  } catch (e) {
    throw new Error(
      "check-photo-subject-boxes: @game/systems/photoQteSystem is not landed yet " +
        `(lane A — subjectBoxAt/subjectBoxEdgeTolerance, techplan §2.3). Nothing to check ` +
        `against until it ships. (${e.message})`,
    );
  }
}

async function loadSpec() {
  register("./lib/game-alias-loader.mjs", pathToFileURL(path.join(ROOT, "scripts") + "/"), {
    data: { root: pathToFileURL(ROOT + "/").href },
  });
  try {
    const m = await import("@game/levels/photoQteBelliard");
    if (m.BELLIARD_PHOTO_QTE === undefined) {
      throw new Error("module has no BELLIARD_PHOTO_QTE export");
    }
    return m.BELLIARD_PHOTO_QTE;
  } catch (e) {
    throw new Error(
      `check-photo-subject-boxes: could not load the authored spec ` +
        `(@game/levels/photoQteBelliard, BELLIARD_PHOTO_QTE). (${e.message})`,
    );
  }
}

/**
 * Resolves a `sceneClock` time to the DELIVERED sprite's decoded frame: `{ decodedFrameAt(t):
 * Promise<{W,H,data}> }` (`decodedFrameAt` reuses `decodePng` from `e2e-lib.mjs`).
 *
 * The time->asset mapping is the structural correspondence §2.5's keyframe table already
 * states ("Drawn subject" column): K0/K1 -> `commandant_wait`, K2/K3 -> `pair_facing`,
 * K4/K5 -> `exchange_close`, K6/K7/K8 -> `berline_plate`. Derived from `track` (never a
 * hand-typed asset list) by walking its boundaries — `track[1].t`/`track[3].t`/`track[5].t`
 * are the three hold-segment ends the 9-keyframe shape (asserted in
 * `deriveDeclaredIntervals`) always produces, so every declared keyframe/interval sample
 * (which never crosses a hold boundary) resolves to exactly one asset.
 *
 * Also asserts every pose type carries `levelArt.json`'s own `pxPerSu` (dev-tooling-assets'
 * per-asset density, ruling §1.3: "write the per-asset px/su into levelArt.json alongside the
 * box" — a missing value here is an authoring gap the gate must not silently pass over, even
 * though the geometry check below (render-placement model) does not consume it directly).
 */
function loadAssetScaleMap(track) {
  const levelArtPath = path.resolve(ROOT, "src/game/levels/levelArt.json");
  const levelArt = JSON.parse(fs.readFileSync(levelArtPath, "utf8"));
  const types = levelArt.photoQte?.types ?? {};

  const boundary1 = track[1].t;
  const boundary3 = track[3].t;
  const boundary5 = track[5].t;
  const keyFor = (t) => {
    if (t <= boundary1) return "commandant_wait";
    if (t <= boundary3) return "pair_facing";
    if (t <= boundary5) return "exchange_close";
    return "berline_plate";
  };

  const missing = [];
  const noPxPerSu = [];
  for (const key of ["commandant_wait", "pair_facing", "exchange_close", "berline_plate"]) {
    const entry = types[key];
    const file = entry && path.resolve(ROOT, "public", entry.asset);
    if (!entry?.asset || !fs.existsSync(file)) missing.push(key);
    if (typeof entry?.pxPerSu !== "number") noPxPerSu.push(key);
  }
  if (missing.length > 0) {
    return { skipReason: `delivered PNG(s) missing: ${missing.join(", ")}` };
  }
  if (noPxPerSu.length > 0) {
    return {
      skipReason: `levelArt.json photoQte.types missing numeric "pxPerSu" (ruling §1.3): ${noPxPerSu.join(", ")}`,
    };
  }

  return {
    async decodedFrameAt(t) {
      const { decodePng } = await import("./e2e-lib.mjs");
      const key = keyFor(t);
      const file = path.resolve(ROOT, "public", types[key].asset);
      return decodePng(file);
    },
  };
}

async function main() {
  const problems = [];
  const skipped = [];

  let photoQteSystem;
  let spec;
  try {
    photoQteSystem = await loadGameModule();
  } catch (e) {
    console.error(`[check-photo-subject-boxes] ${e.message}`);
    process.exit(1);
    return;
  }
  try {
    spec = await loadSpec();
  } catch (e) {
    console.error(`[check-photo-subject-boxes] ${e.message}`);
    process.exit(1);
    return;
  }

  const { subjectBoxAt, subjectBoxEdgeTolerance } = photoQteSystem;
  if (typeof subjectBoxAt !== "function") {
    console.error(
      "[check-photo-subject-boxes] @game/systems/photoQteSystem has no subjectBoxAt export.",
    );
    process.exit(1);
    return;
  }
  if (typeof subjectBoxEdgeTolerance !== "function") {
    console.error(
      "[check-photo-subject-boxes] @game/systems/photoQteSystem has no subjectBoxEdgeTolerance " +
        "export — this gate must CALL the game's own tolerance evaluator, never re-type the " +
        "0.40 su floor / 5% fraction itself (lane C honour clause).",
    );
    process.exit(1);
    return;
  }
  // The evaluator this gate calls everywhere below — never the raw floor/fraction numbers.
  const edgeTolerance = subjectBoxEdgeTolerance;

  const track = spec.subjectTrack;
  const intervals = deriveDeclaredIntervals(track);

  const scaleMap = loadAssetScaleMap(track);
  if (scaleMap.skipReason !== undefined) {
    skipped.push(
      `${scaleMap.skipReason} — every keyframe and interval check below is SKIPPED, not passed.`,
    );
  } else {
    // `scaleMap` resolves a time to the DELIVERED sprite's decoded frame (lane C's
    // assetManifest.ts wiring). `subjectBoxAt(track, t)` is the LIVE value the game actually
    // uses — the two must never be the same computation (testplan §7.2.a: "must sample the
    // rendered animation frames, not a re-interpolation of the authored table against
    // itself" — that would assert nothing, a green light for free).
    //
    // RENDER-PLACEMENT MODEL: the game places each pose sprite as a plane STRETCHED to
    // exactly `targetBox.w x targetBox.h`, centred at `(targetBox.cx, targetBox.cy)` (the
    // shared plane-sizing contract every other flipbook family in this codebase uses —
    // enemies/hostages/boss — never a sub-rect crop). Position is therefore guaranteed BY
    // CONSTRUCTION (the render places the whole canvas at the box); what this gate can and
    // must still catch is a delivered PNG whose OPAQUE content does not fill that stretched
    // canvas — i.e. an internal transparent margin that silently shrinks the effective drawn
    // silhouette below the authored box (F12(1b), "the drawing IS the box"). `deliveredBoxAgainst`
    // maps the sprite's own opaque pixel AABB into scene units by that same stretch-and-centre
    // transform, so a full-bleed silhouette compares equal to `targetBox` and a padded one
    // reports the exact shrunk edge(s).
    const deliveredBoxAgainst = async (t, targetBox) => {
      const frame = await scaleMap.decodedFrameAt(t); // { W, H, data } — decodePng result
      const aabb = opaquePixelAabb(frame);
      if (aabb === null) {
        throw new Error(`no opaque pixel at t=${String(t)}s (fully transparent delivered frame)`);
      }
      const local = pixelAabbToSceneBox(aabb, 1); // scene box in RAW pixel units first
      const sx = targetBox.w / frame.W;
      const sy = targetBox.h / frame.H;
      return {
        cx: targetBox.cx + (local.cx - frame.W / 2) * sx,
        cy: targetBox.cy + (local.cy - frame.H / 2) * sy,
        w: local.w * sx,
        h: local.h * sy,
      };
    };

    // KEYFRAME mode — one AABB check per authored keyframe, delivered sprite vs authored box.
    for (const kf of track) {
      const authored = { cx: kf.cx, cy: kf.cy, w: kf.w, h: kf.h };
      const delivered = await deliveredBoxAgainst(kf.t, authored);
      const cmp = compareBox(delivered, authored, edgeTolerance);
      if (!cmp.pass) {
        const bad = cmp.deltas.filter((d) => !d.pass).map((d) => d.edge);
        problems.push(`keyframe t=${String(kf.t)}s: edge(s) ${bad.join(",")} breached tolerance`);
      }
    }

    // INTERVAL mode — sample at 0.10 s; delivered sprite vs the LIVE `subjectBoxAt` value
    // (the same evaluator the game uses, imported — never re-implemented) + FLAT/NO_GROW.
    for (const iv of intervals) {
      const times = sampleTimes(iv.from, iv.to);
      const delivered = [];
      let brokeAt = null;
      for (const t of times) {
        const live = subjectBoxAt(track, t);
        const box = await deliveredBoxAgainst(t, live);
        delivered.push(box);
        const cmp = compareBox(box, live, edgeTolerance);
        if (!cmp.pass && brokeAt === null) {
          brokeAt = { t, bad: cmp.deltas.filter((d) => !d.pass).map((d) => d.edge) };
        }
      }
      if (brokeAt !== null) {
        problems.push(
          `interval ${iv.id}, first offending sample t=${String(brokeAt.t)}s: ` +
            `edge(s) ${brokeAt.bad.join(",")} breached tolerance`,
        );
      }
      if (iv.kind.includes("flat")) {
        const flat = checkFlat(delivered, edgeTolerance);
        if (!flat.pass) {
          problems.push(
            `interval ${iv.id} FLAT breach: cy span ${flat.span.toFixed(3)}su > tolerance ${flat.tolerance.toFixed(3)}su`,
          );
        }
      }
      if (iv.kind.includes("no_grow")) {
        const noGrow = checkNoGrow(delivered, edgeTolerance);
        if (!noGrow.pass) {
          problems.push(
            `interval ${iv.id} NO_GROW breach: w span ${noGrow.wSpan.toFixed(3)}su ` +
              `(tol ${noGrow.tolerance.w.toFixed(3)}), h span ${noGrow.hSpan.toFixed(3)}su ` +
              `(tol ${noGrow.tolerance.h.toFixed(3)})`,
          );
        }
      }
    }
  }

  if (skipped.length > 0) {
    console.warn("[check-photo-subject-boxes] SKIPPED:");
    for (const s of skipped) console.warn(`  - ${s}`);
  }
  if (problems.length > 0) {
    console.error("[check-photo-subject-boxes] FAILED:");
    for (const p of problems) console.error(`  ✗ ${p}`);
  }

  // A skipped check is a hole in the verdict, never a silent PASS (testplan §9's own rule).
  if (skipped.length > 0 || problems.length > 0) {
    process.exit(1);
  }
  console.log(
    `[check-photo-subject-boxes] PASSED — ${String(track.length)} keyframes + ` +
      `${String(intervals.length)} intervals within tolerance.`,
  );
}

main().catch((e) => {
  console.error("[check-photo-subject-boxes] Fatal:", e.message);
  process.exit(1);
});
