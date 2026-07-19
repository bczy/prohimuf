/**
 * scripts/lib/gptimage.mjs — shared gptimage-large generation core.
 *
 * Extracted from gen-gptimage-asset.mjs (tech-plan-road-props.md decision 4) so
 * a second generator (gen-nearfg-sprites.mjs) can reuse the exact same
 * token-resolution / URL-building / chroma-key pipeline instead of forking it.
 * `gen-gptimage-asset.mjs` is now a thin CLI over this module — same flags,
 * same behaviour.
 *
 * gptimage-large (model=gptimage-large, gen.pollinations.ai) is a PREMIUM
 * Pollinations model — every genUrl()/withRetry() round trip here spends Pollen.
 *
 * NON-SQUARE targets (decision 4): gptimage-large is always requested at a
 * SQUARE `gen` resolution (generation is unreliable at arbitrary aspect
 * ratios); `keyAndDown()` chroma-keys that square result, then CENTER-CROPS it
 * to the caller's target aspect (targetW/targetH) BEFORE the final downscale,
 * rather than stretching non-uniformly onto a non-square canvas (which would
 * squash/distort the silhouette). This mirrors the "generate square, fit/crop
 * to aspect" choice used elsewhere in the pipeline (e.g. the vehicle chroma-key
 * detour). When targetW === targetH (the original square-asset call shape, see
 * gen-gptimage-asset.mjs) the crop is a no-op — byte-identical to the
 * pre-refactor behaviour.
 */
import fs from "fs";
import https from "https";
import { createCanvas, loadImage } from "@napi-rs/canvas";

// Legacy local fallback: a remote-session scratchpad path some earlier runs
// wrote the Pollinations bearer token to by hand, before POLLINATIONS_TOKEN
// became a CI secret. readToken() only reaches this branch when the env var is
// unset — kept only so an already-authenticated local sandbox keeps working;
// new call sites should just export POLLINATIONS_TOKEN.
export const LEGACY_TOKEN_PATH =
  "/tmp/claude-0/-home-user-prohimuf/496e8a6c-5e8b-5774-8095-5d6c7e7af504/scratchpad/.pollinations_token";

/**
 * readToken({ env, readFileSync }) -> string
 *
 * Precedence: `POLLINATIONS_TOKEN` env var (CI secret, first) → the legacy
 * scratchpad file (local fallback, second) → throws a clear error. Fixes the
 * pre-refactor script's defect: it hardcoded the scratchpad path with no env
 * override and no fallback error message beyond a raw ENOENT.
 *
 * `env`/`readFileSync` are injectable (default `process.env`/`fs.readFileSync`)
 * so this is unit-testable without touching the real environment or filesystem.
 */
export function readToken({ env = process.env, readFileSync = fs.readFileSync } = {}) {
  const envToken = env.POLLINATIONS_TOKEN;
  if (envToken && envToken.trim()) return envToken.trim();
  try {
    const fileToken = readFileSync(LEGACY_TOKEN_PATH, "utf8").trim();
    if (fileToken) return fileToken;
  } catch {
    // ENOENT (or any other read failure) — fall through to the throw below,
    // this is not a real failure, it just means the legacy fallback is absent.
  }
  throw new Error(
    "No Pollinations token: set POLLINATIONS_TOKEN (CI secret) or write one to " +
      `${LEGACY_TOKEN_PATH} (legacy local fallback).`,
  );
}

/** genUrl(prompt, seed, { gen, model }) -> the gptimage-large request URL (always square). */
export function genUrl(prompt, seed, { gen = 1024, model = "gptimage-large" } = {}) {
  return (
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(model)}&width=${gen}&height=${gen}&nologo=true&quality=high&seed=${seed}`
  );
}

/** fetchImg(url, token, redir) -> Buffer. Bearer-authenticated GET, follows up to 5 redirects. */
export function fetchImg(url, token, redir = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      if ([301, 302].includes(res.statusCode) && res.headers.location && redir < 5) {
        fetchImg(new URL(res.headers.location, url).toString(), token, redir + 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error("HTTP " + res.statusCode));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(220000, () => req.destroy(new Error("timeout")));
  });
}

/** withRetry(url, token, n) -> Buffer, retrying up to n times with linear backoff. */
export async function withRetry(url, token, n = 3) {
  for (let i = 0; i < n; i++) {
    try {
      return await fetchImg(url, token);
    } catch (e) {
      if (i < n - 1) await new Promise((r) => setTimeout(r, (i + 1) * 5000));
      else throw e;
    }
  }
}

/**
 * cropRectForAspect(W, H, targetW, targetH) -> { cropX, cropY, cropW, cropH }
 *
 * Pure geometry: the largest centered rectangle of aspect targetW/targetH that
 * fits inside a W×H source, used to center-crop a square gptimage result to a
 * non-square target BEFORE downscaling (see file header). No-op (full source
 * rect) when the source is already at the target aspect.
 */
export function cropRectForAspect(W, H, targetW, targetH) {
  const srcAspect = W / H;
  const dstAspect = targetW / targetH;
  if (dstAspect < srcAspect) {
    // Target is narrower (relative to its height) than the source: crop width.
    const cropW = Math.round(H * dstAspect);
    return { cropX: Math.round((W - cropW) / 2), cropY: 0, cropW, cropH: H };
  }
  if (dstAspect > srcAspect) {
    // Target is wider (relative to its height) than the source: crop height.
    const cropH = Math.round(W / dstAspect);
    return { cropX: 0, cropY: Math.round((H - cropH) / 2), cropW: W, cropH };
  }
  return { cropX: 0, cropY: 0, cropW: W, cropH: H };
}

/**
 * keyAndDown(buf, { targetW, targetH, keepColor, tol }) -> { s, ground, opaque }
 *
 * Chroma-keys a magenta-ground gptimage PNG buffer (edge-flood-fill from the
 * sampled corner ground colour), optionally luma-desaturates the kept pixels
 * (grey house style; `keepColor: false`, the default, desaturates), then
 * center-crops to targetW/targetH's aspect (see `cropRectForAspect`) and
 * downscales. `s` is the @napi-rs/canvas Canvas ready for
 * `.toBuffer("image/png")`; `ground` is the sampled RGB background colour;
 * `opaque` is the fraction of GEN-resolution pixels kept (post-key), for
 * logging/QA.
 */
export function keyAndDown(buf, { targetW, targetH, keepColor = false, tol = 95 } = {}) {
  return loadImage(buf).then((img) => {
    const W = img.width,
      H = img.height;
    const c = createCanvas(W, H);
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const id = x.getImageData(0, 0, W, H);
    const d = id.data;
    let cr = 0,
      cg = 0,
      cb = 0,
      n = 0;
    for (const [x0, y0] of [
      [0, 0],
      [W - 10, 0],
      [0, H - 10],
      [W - 10, H - 10],
    ])
      for (let a = 0; a < 10; a++)
        for (let b = 0; b < 10; b++) {
          const i = ((y0 + b) * W + (x0 + a)) * 4;
          cr += d[i];
          cg += d[i + 1];
          cb += d[i + 2];
          n++;
        }
    cr /= n;
    cg /= n;
    cb /= n;
    const tol2 = tol * tol;
    const d2 = (i) => {
      const dr = d[i * 4] - cr,
        dg = d[i * 4 + 1] - cg,
        db = d[i * 4 + 2] - cb;
      return dr * dr + dg * dg + db * db;
    };
    const bg = new Uint8Array(W * H);
    const st = [];
    const push = (px, py) => {
      if (px < 0 || py < 0 || px >= W || py >= H) return;
      const i = py * W + px;
      if (bg[i]) return;
      if (d2(i) < tol2) {
        bg[i] = 1;
        st.push(i);
      }
    };
    for (let px = 0; px < W; px++) {
      push(px, 0);
      push(px, H - 1);
    }
    for (let py = 0; py < H; py++) {
      push(0, py);
      push(W - 1, py);
    }
    while (st.length) {
      const i = st.pop();
      const px = i % W,
        py = (i / W) | 0;
      push(px + 1, py);
      push(px - 1, py);
      push(px, py + 1);
      push(px, py - 1);
    }
    let op = 0;
    for (let i = 0; i < W * H; i++) {
      if (bg[i]) d[i * 4 + 3] = 0;
      else {
        if (!keepColor) {
          const L = Math.round(0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]);
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = L;
        }
        d[i * 4 + 3] = 255;
        op++;
      }
    }
    x.putImageData(id, 0, 0);

    const { cropX, cropY, cropW, cropH } = cropRectForAspect(W, H, targetW, targetH);
    const s = createCanvas(targetW, targetH);
    const sx = s.getContext("2d");
    sx.imageSmoothingEnabled = true;
    sx.imageSmoothingQuality = "high";
    sx.drawImage(c, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
    return { s, ground: [cr | 0, cg | 0, cb | 0], opaque: op / (W * H) };
  });
}

/**
 * cyanPreviewCanvas(spriteCanvas) -> Canvas
 * The sprite composited over a flat cyan (#00c8c8) backdrop — a review preview
 * against a non-transparent, non-magenta ground — same size as `spriteCanvas`.
 */
export function cyanPreviewCanvas(spriteCanvas) {
  const w = spriteCanvas.width,
    h = spriteCanvas.height;
  const v = createCanvas(w, h);
  const vx = v.getContext("2d");
  vx.fillStyle = "#00c8c8";
  vx.fillRect(0, 0, w, h);
  vx.drawImage(spriteCanvas, 0, 0);
  return v;
}
