/**
 * Shared helpers for the E2E smoke gates (e2e-home / e2e-ingame / e2e-delivery)
 * and the ADR-0005 dynamic-verification harness (harness-motion / harness-assert
 * / harness-golden).
 *
 * These scripts drive the PRODUCTION build in headless Chromium via raw
 * playwright (NOT @playwright/test) so they can run as plain `node` scripts in
 * CI with a server already serving the build at PREVIEW_URL. This module holds
 * the pieces they all share so behaviour (freeze/mute seed, level list, the
 * same-origin failure gate, the SwiftShader launch args) stays identical and is
 * defined once:
 *
 *   - enterMenuFromTitle(page)        — TITLE cover → single-action entry → MENU shell.
 *   - dismissNarrative(page)          — clear the pre-level "Passer" interstitial.
 *   - waitForFlyerWallSettled(p, o)  — hold until every NIVEAUX float-in has finished.
 *   - seedDeterminism(page, ids, o)   — addInitScript: freeze cops + mute + unlock (+ crt off by default).
 *   - seedPlay(page, ids, o)          — ADR-0005 "play" mode: __MUF_PLAY__ + mute + unlock (never __MUF_FREEZE_COPS__).
 *   - readState(page)                 — one window.__MUF_STATE__() read (null if the seam isn't installed yet).
 *   - pollState(page, predicate, o)   — poll readState() until predicate(state) or timeout.
 *   - loadLevelManifest(root)         — level list/ids from levelArt.json (SoT).
 *   - createFailedResponseCollector() — same-origin >=400 response collector.
 *   - decodePng(source)               — @napi-rs/canvas decode to {W,H,data} RGBA.
 *   - diffPixelFraction(a, b, o)      — per-channel-tolerant pixel-diff fraction (D3 golden).
 *   - stitchLabeledStrip(frames, o)   — labelled contact-sheet strip (D1 motion).
 *   - SWIFTSHADER_ARGS                — software-WebGL chromium launch args (no GPU).
 *   - IGNORED_PATHS                   — requests never treated as failures.
 */
import fs from "fs";
import path from "path";

/** Relative path of the shared level-art manifest (single source of truth). */
export const LEVEL_ART_PATH = "src/game/levels/levelArt.json";

// Requests we never treat as failures: the browser asks for /favicon.ico even
// though the app declares none, and that 404 is not a regression.
export const IGNORED_PATHS = ["/favicon.ico"];

// No GPU in CI — force software WebGL so the R3F canvas actually renders. Shared
// verbatim with scripts/screenshot-preview.mjs so the render path is identical.
export const SWIFTSHADER_ARGS = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
  "--enable-webgl",
];

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Read the shared level-art manifest and derive the level list + ids. This is
 * the ONLY place the level set is defined for the harness (mirrors the app,
 * which reads the same file), so adding a level in levelArt.json is enough.
 */
export function loadLevelManifest(root = process.cwd()) {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(root, LEVEL_ART_PATH), "utf8"));
  const levels = manifest.levels.map((l) => ({ id: l.id, name: l.name }));
  return { manifest, levels, levelIds: levels.map((l) => l.id) };
}

// Pre-game entry markers (ADR-0021). Cold load lands on the TITLE cover; a single
// action enters the MENU. The issue label is title-only (both TITLE and MENU render
// the "MUF" logo), so it disambiguates the two; the running masthead is menu-only.
export const TITLE_MARKER = "★ HIVER 1998 ★"; // src/render/ui/TitleScreen.tsx ISSUE_LABEL
export const MENU_MASTHEAD = "UNDERGROUND PARIS · FANZINE CLANDESTIN · 1998"; // print/tokens.ts MASTHEAD.running

/**
 * Advance the new pre-game entry flow (ADR-0021): assert the TITLE cover is up,
 * perform the single-action entry (click the cover, exercising the real pointer
 * handler), then wait for the MENU shell to mount. Every consumer that used to
 * treat the "MUF" logo as a menu signal MUST call this first — "MUF" now also
 * renders on the TITLE cover, so waiting on it alone leaves the app sitting on the
 * cover while a subsequent level-name click times out. Clicks the title-only
 * issue label, which lives inside the interactive surface and clear of the
 * FullscreenButton chrome (`[data-muf-ui]`).
 *
 * The NIVEAUX flyer wall arms a brief click-through lockout on mount (the guard
 * against a title double-click falling through to a freshly mounted flyer); we
 * wait for its `data-flyers-armed="true"` signal so a subsequent flyer click is
 * actually honoured instead of being swallowed by that lockout.
 */
export async function enterMenuFromTitle(page, { timeout = 20000 } = {}) {
  const marker = page.getByText(TITLE_MARKER, { exact: true }).first();
  await marker.waitFor({ timeout });
  await marker.click({ timeout });
  await page.getByText(MENU_MASTHEAD, { exact: true }).first().waitFor({ timeout });
  await page.locator('[data-flyers-armed="true"]').first().waitFor({ timeout });
}

/**
 * Wait until the NIVEAUX flyer wall has visually SETTLED — every float-in entrance
 * animation finished — which is what a capture of that screen must wait for.
 *
 * Asks the browser whether the animations are done (Web Animations API) rather than
 * sleeping for `(count - 1) * stagger + duration`. That arithmetic would restate three
 * values owned elsewhere — the 180ms stagger in FlyerWall.tsx, the 1400ms duration in
 * FlyerWall.module.css, and LEVELS.length — with nothing keeping the copies in sync, so
 * adding a level would silently push the real settle time past a fixed budget and bring
 * back mid-animation screenshots. Waiting on the actual end state cannot drift: change
 * the stagger, the duration or the level count and this still holds exactly long enough.
 * It is also correct under reduced motion, where there is no animation to await.
 *
 * `data-flyers-armed` is NOT a substitute: it gates click-through, not the visual settle.
 *
 * CEILING — `timeout` is ONE budget shared by both waits (mount, then settle), not one
 * each: they run off a single deadline, so this helper cannot exceed it in wall-clock.
 * That matters because the two are chained — a slow mount would otherwise eat its own
 * full budget before the settle poll even started, making the real worst case twice the
 * documented one.
 *
 * It is a safety net, not a computed budget, and left that way ON PURPOSE. Deriving it
 * from `(LEVELS.length - 1) * stagger + duration` would restore in this file exactly the
 * three-way coupling the helper exists to remove: the stagger lives in FlyerWall.tsx, the
 * duration in FlyerWall.module.css, the count in the level data. The wait itself already
 * scales with all three for free, since it watches the real end state. Only the ESCAPE
 * HATCH is fixed — and it stops covering the wall at roughly 105 levels
 * ((105-1) x 180ms + 1400ms > 20s), against 5 today. If the game ever approaches that,
 * raise this default rather than reintroducing the arithmetic.
 */
export async function waitForFlyerWallSettled(page, { timeout = 20000 } = {}) {
  const deadline = Date.now() + timeout;
  // Floor of 1ms, NOT 0: Playwright reads `timeout: 0` as "disable the timeout" and
  // waits forever. Clamping to 0 once the budget is spent — a slow mount eating it all,
  // or a caller passing `{ timeout: 0 }` — would turn this safety net into a hang.
  const left = () => Math.max(1, deadline - Date.now());
  await page.locator(".muf-flyer-slot").first().waitFor({ timeout: left() });
  // Two frames before polling. A slot can be in the DOM — the waitFor above proves it —
  // BEFORE the browser has run the style pass that creates its CSSAnimation object, and an
  // empty getAnimations() is indistinguishable from a finished one. Without this, the poll
  // could read "settled" on a wall that has not started animating. Two frames because the
  // first only guarantees style resolution is scheduled.
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );
  await page.waitForFunction(
    () => {
      const slots = Array.from(document.querySelectorAll(".muf-flyer-slot"));
      // `.every()` on an EMPTY array is true, so without this length guard the predicate
      // reports "settled" on any poll tick where no slot exists. FlyerWall is mounted
      // conditionally and unmounts fully on every rubrique round-trip, and the waitFor
      // above only proves a slot existed at that earlier instant — not at this one.
      return (
        slots.length > 0 &&
        slots.every((el) => el.getAnimations().every((a) => a.playState === "finished"))
      );
    },
    undefined,
    { timeout: left() },
  );
}

/**
 * The pre-level narrative interstitial has a "Passer" (skip) button; clear it so
 * we reach the actual gameplay canvas. Mirrors screenshot-preview.mjs.
 *
 * The asset-preload loading screen (gate) can now sit between the level click and
 * the narrative, so this polls a bounded window instead of deciding on the first
 * frame (the old fixed-iteration loop broke the instant no "Passer" was visible —
 * i.e. while the loader was still up — and never dismissed the narrative that
 * appeared afterwards). It clicks "Passer" whenever it shows and stops as soon as
 * the gameplay canvas has mounted (narrative dismissed, or the level has none).
 */
export async function dismissNarrative(page) {
  const canvas = page.locator("canvas").first();
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (await canvas.isVisible().catch(() => false)) return;
    const skip = page.getByRole("button", { name: "Passer" });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click().catch(() => undefined);
    }
    await sleep(300);
  }
}

/**
 * Seed a deterministic, headless-friendly run BEFORE the app boots:
 *   - freeze cops VISIBLE (never SHOOTING) so scenes are static & no damage,
 *   - mute audio, force 3 lives / normal difficulty,
 *   - unlock every level so any level can be entered directly,
 *   - pin the CRT post-process (`prefs.crt`) explicitly.
 * `levelIds` comes from loadLevelManifest so the unlock set stays in sync with
 * levelArt.json (never a hardcoded list).
 *
 * `crt` defaults to **false**: the app default (prefsSystem `DEFAULT_PREFS.crt`)
 * is true, but the CRT pass is animated grain/flicker + a multiplicative scanline
 * comb + bloom (ADR-0031) — inherently non-deterministic and, over a capture, it
 * masks constant-alpha-plate regressions and drives the pixel gates with noise.
 * A deterministic/static seed therefore turns it OFF by default. The one flow
 * that must still compile+exercise the CRT shaders under SwiftShader (e2e-ingame,
 * the ADR-0031 publish guard) opts back in with `{ crt: true }`.
 */
export async function seedDeterminism(page, levelIds, { crt = false } = {}) {
  await page.addInitScript(
    ({ ids, crt }) => {
      // Freeze cops so the scene is static/deterministic (matches screenshot-preview).
      window.__MUF_FREEZE_COPS__ = true;
      try {
        localStorage.setItem("muf_progress", JSON.stringify(ids));
        localStorage.setItem(
          "muf_prefs",
          JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal", crt }),
        );
      } catch {
        // ignore storage failures
      }
    },
    { ids: levelIds, crt },
  );
}

/**
 * Collect same-origin responses with a >=400 status (asset & base-path config
 * guard). Third-party requests and IGNORED_PATHS are ignored. Attach the
 * returned `onResponse` to `page.on("response", ...)`; read `failed` after.
 */
export function createFailedResponseCollector(origin) {
  const failed = [];
  const onResponse = (res) => {
    const url = res.url();
    if (!url.startsWith(origin)) return; // ignore any third-party request
    if (IGNORED_PATHS.some((p) => new URL(url).pathname.endsWith(p))) return;
    if (res.status() >= 400) failed.push(`${res.status()} ${url}`);
  };
  return { failed, onResponse };
}

/**
 * ADR-0005 "play" mode seed: leaves the real tick UN-FROZEN (couriers move, the
 * QTE simulates) instead of the `__MUF_FREEZE_COPS__` synthetic-enemies path.
 * NEVER sets `__MUF_FREEZE_COPS__` — the two flags are mutually exclusive
 * (enforced with a hard throw in `useGameLoop.ts`); the harness must pick
 * exactly one. Reuses the same audio-mute / lives / difficulty prefs seed as
 * `seedDeterminism` (no new mute path); `crt` defaults to **false** for the same
 * reason (the animated CRT pass is non-deterministic noise the harness gains
 * nothing from). `levelIds` comes from `loadLevelManifest` so every level stays
 * reachable, same convention as `seedDeterminism`.
 */
export async function seedPlay(page, levelIds, { crt = false } = {}) {
  await page.addInitScript(
    ({ ids, crt }) => {
      window.__MUF_PLAY__ = true;
      try {
        localStorage.setItem("muf_progress", JSON.stringify(ids));
        localStorage.setItem(
          "muf_prefs",
          JSON.stringify({ soundVolume: 0, musicVolume: 0, lives: 3, difficulty: "normal", crt }),
        );
      } catch {
        // ignore storage failures
      }
    },
    { ids: levelIds, crt },
  );
}

/**
 * Read the ADR-0005 state seam (`window.__MUF_STATE__()`) once. Returns `null`
 * until the seam is installed (the first `__MUF_PLAY__` tick has run) — callers
 * that need to wait for a condition should use `pollState` below rather than
 * retrying this by hand. The returned value is a plain, JSON-serialisable clone
 * (Playwright already structured-clones the `page.evaluate` return value), never
 * a live handle into the page.
 */
export async function readState(page) {
  return page.evaluate(() => {
    const w = /** @type {{ __MUF_STATE__?: () => unknown }} */ (window);
    if (typeof w.__MUF_STATE__ !== "function") return null;
    return w.__MUF_STATE__();
  });
}

/**
 * Poll `readState(page)` until `predicate(state)` is true or `timeout` elapses.
 * Returns the passing snapshot; throws (with the last-seen snapshot, if any) on
 * timeout, so a caller's failure message is never a bare "timed out".
 */
export async function pollState(page, predicate, { timeout = 30000, interval = 150 } = {}) {
  const deadline = Date.now() + timeout;
  let last = null;
  while (Date.now() < deadline) {
    last = await readState(page);
    if (last !== null && predicate(last)) return last;
    await sleep(interval);
  }
  throw new Error(
    `pollState: timed out after ${String(timeout)}ms waiting for predicate` +
      (last === null
        ? " (window.__MUF_STATE__ never appeared — is __MUF_PLAY__ seeded?)"
        : ` (last snapshot: ${JSON.stringify(last)})`),
  );
}

/**
 * Decode a PNG (file path, Buffer, or any @napi-rs/canvas `loadImage` source)
 * into `{ W, H, data }` where `data` is the raw RGBA `Uint8ClampedArray`. Shared
 * decode primitive for the pixel-level checks (D3 golden diff); mirrors the
 * lazy-import pattern of `check-halo-gradient.mjs` / `check-sprite-integrity.mjs`
 * so importing this module never throws when @napi-rs/canvas is unavailable.
 */
export async function decodePng(source) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const img = await loadImage(source);
  const W = img.width;
  const H = img.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  return { W, H, data: ctx.getImageData(0, 0, W, H).data };
}

/**
 * Fraction of pixels that differ between two same-size decoded frames (see
 * `decodePng`), where a pixel counts as differing only if ANY channel's
 * absolute delta exceeds `channelTolerance` (default 2 — absorbs SwiftShader's
 * run-to-run AA/rounding jitter without hiding a real regression). Pure, no I/O
 * — the D3 golden gate's whole decision surface, unit-testable in isolation.
 * Throws on a frame-size mismatch (a resized viewport is a config error, not a
 * pixel diff to report).
 */
export function diffPixelFraction(a, b, { channelTolerance = 2 } = {}) {
  if (a.W !== b.W || a.H !== b.H) {
    throw new Error(
      `frame size mismatch: ${String(a.W)}x${String(a.H)} vs ${String(b.W)}x${String(b.H)}`,
    );
  }
  const total = a.W * a.H;
  let diffCount = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) > channelTolerance ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > channelTolerance ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > channelTolerance ||
      Math.abs(a.data[i + 3] - b.data[i + 3]) > channelTolerance
    ) {
      diffCount++;
    }
  }
  return diffCount / total;
}

/**
 * Stitch a list of `{ buffer, label }` PNG buffers into one labelled contact-
 * sheet strip (same visual idiom as `screenshot-preview.mjs`'s `buildContactSheet`,
 * generalised into a reusable primitive per the ADR-0007 D3 "anatomy of a
 * harness" — this is the contact-sheet consumer that ADR-0007 deferred building
 * ahead of, now that ADR-0005 is the real consumer). Returns a PNG Buffer; the
 * caller writes it to disk.
 */
export async function stitchLabeledStrip(
  frames,
  { cols = 4, cellW = 480, cellH = 270, pad = 16, labelH = 26 } = {},
) {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  const rows = Math.max(1, Math.ceil(frames.length / cols));
  const W = cols * cellW + (cols + 1) * pad;
  const H = rows * (cellH + labelH) + (rows + 1) * pad;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#0a0a12";
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < frames.length; i++) {
    const img = await loadImage(frames[i].buffer);
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = pad + c * (cellW + pad);
    const y = pad + r * (cellH + labelH + pad);
    ctx.fillStyle = "#ffe600";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText(frames[i].label, x, y + 20);
    ctx.drawImage(img, x, y + labelH, cellW, cellH);
  }

  return canvas.toBuffer("image/png");
}
