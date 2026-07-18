#!/usr/bin/env node
/**
 * gpt-asset.mjs — reusable gptimage asset harness.
 * Generates ONE asset via gptimage-large on a flat magenta chroma ground,
 * chroma-keys it (supersampled), downscales to the target size, and writes a
 * clean transparent PNG + a cyan preview.
 *
 * Usage:
 *   node gpt-asset.mjs --prompt "<subject>" --seed 4814 --out /path/out.png \
 *        [--gen 1024] [--size 256] [--tol 95] [--kind sprite|vehicle]
 *
 * Token: read from scratchpad/.pollinations_token (Bearer, *.pollinations.ai only).
 * Never printed. gptimage-large is premium (spends Pollen).
 */
import fs from "fs";
import https from "https";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => {
    if (v.startsWith("--")) a.push([v.slice(2), arr[i + 1]]);
    return a;
  }, []),
);
const PROMPT = args.prompt;
const SEED = parseInt(args.seed ?? "1", 10);
const OUT = args.out;
const GEN = parseInt(args.gen ?? "1024", 10);
const SIZE = parseInt(args.size ?? "256", 10);
const TOL = parseInt(args.tol ?? "95", 10);
const KIND = args.kind ?? "sprite";
if (!PROMPT || !OUT) {
  console.error("need --prompt and --out");
  process.exit(2);
}
const TOKEN = fs
  .readFileSync("/tmp/claude-0/-home-user-prohimuf/496e8a6c-5e8b-5774-8095-5d6c7e7af504/scratchpad/.pollinations_token", "utf8")
  .trim();

// House "clean comic" treatment tail + flat magenta chroma ground + hard no-text
// + no ground shadow (killed at source, avoids a post-matte).
const STYLE =
  ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, full body figure fully visible and centered, floating isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no floor, no cast shadow, no drop shadow, no text, no letters, no logo, no writing, no signature, blank plain clothing with no markings";

function genUrl(prompt, seed) {
  return (
    `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}` +
    `?model=gptimage-large&width=${GEN}&height=${GEN}&nologo=true&quality=high&seed=${seed}`
  );
}
function fetchImg(url, redir = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: `Bearer ${TOKEN}` } }, (res) => {
      if ([301, 302].includes(res.statusCode) && res.headers.location && redir < 5) {
        fetchImg(new URL(res.headers.location, url).toString(), redir + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error("HTTP " + res.statusCode));
        return;
      }
      const ch = [];
      res.on("data", (c) => ch.push(c));
      res.on("end", () => resolve(Buffer.concat(ch)));
    });
    req.on("error", reject);
    req.setTimeout(220000, () => req.destroy(new Error("timeout")));
  });
}
async function withRetry(url, n = 3) {
  for (let i = 0; i < n; i++) {
    try {
      return await fetchImg(url);
    } catch (e) {
      if (i < n - 1) await new Promise((r) => setTimeout(r, (i + 1) * 5000));
      else throw e;
    }
  }
}

// chroma-key: flood exterior connected region within TOL of the sampled corner
// ground; keep the rest; desaturate kept pixels to luma (removes any magenta
// spill, keeps the 3-tone greyscale). Binary at GEN res → AA on downscale.
function keyAndDown(buf) {
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
    for (const [x0, y0] of [[0, 0], [W - 10, 0], [0, H - 10], [W - 10, H - 10]])
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
    const tol2 = TOL * TOL;
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
        const L = Math.round(0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2]);
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = L;
        d[i * 4 + 3] = 255;
        op++;
      }
    }
    x.putImageData(id, 0, 0);
    const s = createCanvas(SIZE, SIZE);
    const sx = s.getContext("2d");
    sx.imageSmoothingEnabled = true;
    sx.imageSmoothingQuality = "high";
    sx.drawImage(c, 0, 0, SIZE, SIZE);
    return { s, ground: [cr | 0, cg | 0, cb | 0], opaque: op / (W * H) };
  });
}

const buf = await withRetry(genUrl(`${PROMPT}${STYLE}`, SEED));
const { s, ground, opaque } = await keyAndDown(buf);
fs.mkdirSync(OUT.replace(/\/[^/]+$/, ""), { recursive: true });
fs.writeFileSync(OUT, s.toBuffer("image/png"));
// cyan preview next to it
const v = createCanvas(SIZE, SIZE);
const vx = v.getContext("2d");
vx.fillStyle = "#00c8c8";
vx.fillRect(0, 0, SIZE, SIZE);
vx.drawImage(s, 0, 0);
fs.writeFileSync(OUT.replace(/\.png$/, "_cyan.png"), v.toBuffer("image/png"));
console.log(
  JSON.stringify({ out: OUT, seed: SEED, ground, opaquePct: +(opaque * 100).toFixed(1) }),
);
