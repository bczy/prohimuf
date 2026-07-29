import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// fetchImg()/withRetry() hit `https.get` directly — mock the built-in so retry
// and redirect handling are exercised deterministically, no real network I/O
// and no timing dependency (same pattern as scripts/lib/pollinations.test.mjs).
vi.mock("https", () => ({ default: { get: vi.fn(), request: vi.fn() } }));

import https from "https";
import {
  LEGACY_TOKEN_PATH,
  readToken,
  genUrl,
  fetchImg,
  withRetry,
  cropRectForAspect,
  cyanPreviewCanvas,
  keyAndDown,
  assertRefsReachable,
} from "../gptimage.mjs";
import { createCanvas } from "@napi-rs/canvas";

function fakeRequest() {
  const req = { on: vi.fn(() => req), setTimeout: vi.fn(), destroy: vi.fn() };
  return req;
}

function fakeResponse(statusCode, headers = {}) {
  return { statusCode, headers, on: vi.fn(), resume: vi.fn() };
}

describe("readToken", () => {
  it("prefers POLLINATIONS_TOKEN env when set", () => {
    const readFileSync = vi.fn(() => {
      throw new Error("should not be called");
    });
    const token = readToken({ env: { POLLINATIONS_TOKEN: "  env-tok  " }, readFileSync });
    expect(token).toBe("env-tok");
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it("falls back to the legacy scratchpad file when the env var is unset", () => {
    const readFileSync = vi.fn((p) => {
      expect(p).toBe(LEGACY_TOKEN_PATH);
      return "  file-tok  \n";
    });
    const token = readToken({ env: {}, readFileSync });
    expect(token).toBe("file-tok");
  });

  it("falls back to the legacy scratchpad file when the env var is whitespace-only", () => {
    const readFileSync = vi.fn(() => "file-tok");
    const token = readToken({ env: { POLLINATIONS_TOKEN: "   " }, readFileSync });
    expect(token).toBe("file-tok");
  });

  it("throws a clear error when neither the env var nor the file resolve", () => {
    const readFileSync = vi.fn(() => {
      throw new Error("ENOENT");
    });
    expect(() => readToken({ env: {}, readFileSync })).toThrow(/POLLINATIONS_TOKEN/);
  });

  it("throws when the legacy file exists but is empty", () => {
    const readFileSync = vi.fn(() => "   ");
    expect(() => readToken({ env: {}, readFileSync })).toThrow(/POLLINATIONS_TOKEN/);
  });
});

describe("genUrl", () => {
  it("targets gen.pollinations.ai with model=gptimage-large and a SQUARE gen size", () => {
    const url = genUrl("a bollard", 6105, { gen: 1024 });
    expect(url).toContain("https://gen.pollinations.ai/image/");
    expect(url).toContain("model=gptimage-large");
    expect(url).toContain("width=1024");
    expect(url).toContain("height=1024");
    expect(url).toContain("seed=6105");
    expect(url).toContain(encodeURIComponent("a bollard"));
  });

  it("defaults gen to 1024 when omitted", () => {
    const url = genUrl("x", 1);
    expect(url).toContain("width=1024");
    expect(url).toContain("height=1024");
  });
});

describe("cropRectForAspect — non-square target dims math", () => {
  it("is a no-op when the target aspect matches the square source", () => {
    expect(cropRectForAspect(1024, 1024, 256, 256)).toEqual({
      cropX: 0,
      cropY: 0,
      cropW: 1024,
      cropH: 1024,
    });
  });

  it("crops WIDTH when the target is narrower than the square source (e.g. lamppost, aspect 0.5)", () => {
    const r = cropRectForAspect(1024, 1024, 256, 512); // aspect 0.5
    expect(r.cropH).toBe(1024); // full height kept
    expect(r.cropW).toBe(512); // 1024 * 0.5
    expect(r.cropX).toBe(256); // centered: (1024 - 512) / 2
    expect(r.cropY).toBe(0);
  });

  it("crops HEIGHT when the target is wider than the square source (e.g. bench, aspect 1.7)", () => {
    const r = cropRectForAspect(1024, 1024, 870, 512); // aspect ~1.7
    expect(r.cropW).toBe(1024); // full width kept
    expect(r.cropH).toBe(Math.round(1024 / (870 / 512)));
    expect(r.cropX).toBe(0);
    expect(r.cropY).toBe(Math.round((1024 - r.cropH) / 2));
  });

  it("matches every NEAR_KIND_SPECS aspect from tech-plan-road-props.md decision 1", () => {
    // parkingMeter 0.5, lamppost 0.5, wallaceFountain 0.55, trafficLight 0.44,
    // bollard 0.6, scooter 1.5, bench 1.7, streetSign 0.75 (all against a
    // square 1024x1024 gen source).
    const cases = [
      [256, 512], // parkingMeter / lamppost (aspect 0.5)
      [282, 512], // wallaceFountain (aspect 0.55)
      [225, 512], // trafficLight (aspect 0.44, round(512*0.44)=225)
      [307, 512], // bollard (aspect 0.6)
      [768, 512], // scooter (aspect 1.5)
      [870, 512], // bench (aspect 1.7)
      [384, 512], // streetSign (aspect 0.75)
    ];
    for (const [w, h] of cases) {
      const r = cropRectForAspect(1024, 1024, w, h);
      expect(r.cropW).toBeGreaterThan(0);
      expect(r.cropH).toBeGreaterThan(0);
      expect(r.cropX + r.cropW).toBeLessThanOrEqual(1024);
      expect(r.cropY + r.cropH).toBeLessThanOrEqual(1024);
      // The crop rect itself must carry (approximately) the target aspect.
      expect(r.cropW / r.cropH).toBeCloseTo(w / h, 2);
    }
  });
});

describe("cyanPreviewCanvas", () => {
  it("returns a canvas the same size as the sprite canvas", () => {
    const sprite = createCanvas(37, 51);
    const preview = cyanPreviewCanvas(sprite);
    expect(preview.width).toBe(37);
    expect(preview.height).toBe(51);
  });
});

describe("keyAndDown — globalKey option (enclosed magenta pocket)", () => {
  // Synthesizes a real PNG buffer (keyAndDown loads via @napi-rs/canvas's
  // loadImage, so it needs actual encoded bytes, not a plain ImageData-shaped
  // object): a magenta ground with a small opaque black ring, and INSIDE that
  // ring a pocket of magenta pixels that is never connected to the canvas
  // border — the exact shape of the scooter defect (magenta trapped between
  // opaque geometry, e.g. between the wheels). Corner sample blocks (10x10)
  // stay clear of the ring so the sampled ground colour is pure magenta.
  const W = 30,
    H = 30;
  function enclosedPocketPng() {
    const c = createCanvas(W, H);
    const x = c.getContext("2d");
    x.fillStyle = "#FF3CDC";
    x.fillRect(0, 0, W, H);
    x.fillStyle = "#000000";
    // A 3px-thick ring (not 1px) so a ring pixel deep inside a corner block
    // has ALL 8 neighbours also opaque black — a 1px ring's pixels each
    // border a keyed-transparent pixel, which the target canvas's smoothed
    // 1:1 drawImage can blend into a non-255 alpha at the sample point.
    x.fillRect(10, 10, 12, 3); // ring top band (x10..21, y10..12)
    x.fillRect(10, 19, 12, 3); // ring bottom band (x10..21, y19..21)
    x.fillRect(10, 13, 3, 6); // ring left band (x10..12, y13..18)
    x.fillRect(19, 13, 3, 6); // ring right band (x19..21, y13..18)
    // interior (13..18, 13..18) stays magenta — enclosed, unreachable by the
    // edge-seeded flood fill.
    return c.toBuffer("image/png");
  }

  async function pocketAlpha(opts) {
    const { s } = await keyAndDown(enclosedPocketPng(), { targetW: W, targetH: H, ...opts });
    const px = s.getContext("2d").getImageData(15, 15, 1, 1).data;
    return px[3];
  }

  it("leaves an enclosed magenta pocket OPAQUE when globalKey is off (default) — reproduces the defect", async () => {
    expect(await pocketAlpha({})).toBe(255);
  });

  it("keys an enclosed magenta pocket TRANSPARENT when globalKey is on", async () => {
    expect(await pocketAlpha({ globalKey: true })).toBe(0);
  });

  it("still keys the border-connected magenta the same way regardless of globalKey", async () => {
    const offImg = (await keyAndDown(enclosedPocketPng(), { targetW: W, targetH: H })).s;
    const onImg = (
      await keyAndDown(enclosedPocketPng(), { targetW: W, targetH: H, globalKey: true })
    ).s;
    const offPx = offImg.getContext("2d").getImageData(1, 1, 1, 1).data;
    const onPx = onImg.getContext("2d").getImageData(1, 1, 1, 1).data;
    expect(offPx[3]).toBe(0);
    expect(onPx[3]).toBe(0);
  });

  it("does not touch the opaque ring pixels either way (not near-magenta)", async () => {
    const offImg = (await keyAndDown(enclosedPocketPng(), { targetW: W, targetH: H })).s;
    const onImg = (
      await keyAndDown(enclosedPocketPng(), { targetW: W, targetH: H, globalKey: true })
    ).s;
    const offPx = offImg.getContext("2d").getImageData(11, 11, 1, 1).data;
    const onPx = onImg.getContext("2d").getImageData(11, 11, 1, 1).data;
    expect(offPx[3]).toBe(255);
    expect(onPx[3]).toBe(255);
  });
});

describe("fetchImg", () => {
  beforeEach(() => {
    https.get.mockReset();
  });

  it("sends a Bearer header with the given token", async () => {
    let seenOpts;
    https.get.mockImplementation((url, opts, cb) => {
      seenOpts = opts;
      const res = fakeResponse(200);
      res.on.mockImplementation((ev, fn) => {
        if (ev === "end") fn();
        return res;
      });
      cb(res);
      return fakeRequest();
    });
    await fetchImg("https://gen.pollinations.ai/image/x", "tok_abc");
    expect(seenOpts.headers.Authorization).toBe("Bearer tok_abc");
  });

  it("rejects on a non-200, non-redirect status", async () => {
    https.get.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(500));
      return fakeRequest();
    });
    await expect(fetchImg("https://gen.pollinations.ai/image/x", "tok")).rejects.toThrow(
      /HTTP 500/,
    );
  });

  it("follows a redirect", async () => {
    let calls = 0;
    https.get.mockImplementation((url, opts, cb) => {
      calls++;
      if (calls === 1) {
        cb(fakeResponse(302, { location: "https://gen.pollinations.ai/image/y" }));
      } else {
        const res = fakeResponse(200);
        res.on.mockImplementation((ev, fn) => {
          if (ev === "end") fn();
          return res;
        });
        cb(res);
      }
      return fakeRequest();
    });
    await fetchImg("https://gen.pollinations.ai/image/x", "tok");
    expect(calls).toBe(2);
  });

  it("keeps sending the Bearer header across a SAME-host redirect", async () => {
    const seenOpts = [];
    https.get.mockImplementation((url, opts, cb) => {
      seenOpts.push(opts);
      if (seenOpts.length === 1) {
        cb(fakeResponse(302, { location: "https://gen.pollinations.ai/image/y" }));
      } else {
        const res = fakeResponse(200);
        res.on.mockImplementation((ev, fn) => {
          if (ev === "end") fn();
          return res;
        });
        cb(res);
      }
      return fakeRequest();
    });
    await fetchImg("https://gen.pollinations.ai/image/x", "tok_abc");
    expect(seenOpts).toHaveLength(2);
    expect(seenOpts[0].headers.Authorization).toBe("Bearer tok_abc");
    expect(seenOpts[1].headers.Authorization).toBe("Bearer tok_abc");
  });

  it("DROPS the Bearer header on a CROSS-host redirect (security hardening)", async () => {
    const seenOpts = [];
    https.get.mockImplementation((url, opts, cb) => {
      seenOpts.push(opts);
      if (seenOpts.length === 1) {
        cb(fakeResponse(302, { location: "https://evil.example/image/y" }));
      } else {
        const res = fakeResponse(200);
        res.on.mockImplementation((ev, fn) => {
          if (ev === "end") fn();
          return res;
        });
        cb(res);
      }
      return fakeRequest();
    });
    await fetchImg("https://gen.pollinations.ai/image/x", "tok_abc");
    expect(seenOpts).toHaveLength(2);
    expect(seenOpts[0].headers.Authorization).toBe("Bearer tok_abc");
    expect(seenOpts[1].headers.Authorization).toBeUndefined();
  });
});

describe("withRetry", () => {
  beforeEach(() => {
    https.get.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries up to n times then resolves on eventual success", async () => {
    let attempt = 0;
    https.get.mockImplementation((url, opts, cb) => {
      attempt++;
      if (attempt < 3) {
        cb(fakeResponse(500));
      } else {
        const res = fakeResponse(200);
        res.on.mockImplementation((ev, fn) => {
          if (ev === "end") fn();
          return res;
        });
        cb(res);
      }
      return fakeRequest();
    });
    const promise = withRetry("https://gen.pollinations.ai/image/x", "tok", 3);
    await vi.runAllTimersAsync();
    const buf = await promise;
    expect(attempt).toBe(3);
    expect(Buffer.isBuffer(buf)).toBe(true);
  });

  it("throws immediately (no wait) when n=1 and the only attempt fails", async () => {
    https.get.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(500));
      return fakeRequest();
    });
    await expect(withRetry("https://gen.pollinations.ai/image/x", "tok", 1)).rejects.toThrow(
      /HTTP 500/,
    );
  });
});

describe("assertRefsReachable — reference-image preflight guard", () => {
  function fakeReq() {
    const req = { on: vi.fn(() => req), setTimeout: vi.fn(), destroy: vi.fn(), end: vi.fn() };
    return req;
  }

  beforeEach(() => {
    https.request.mockReset();
  });

  it("resolves without throwing when every ref answers 200", async () => {
    https.request.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(200));
      return fakeReq();
    });
    await expect(
      assertRefsReachable(["https://raw.githubusercontent.com/x/enemy_sprite.png"]),
    ).resolves.toBeUndefined();
  });

  it("throws a clear, aggregate error naming every ref that 404s", async () => {
    https.request.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(url.includes("riot") ? 404 : 200));
      return fakeReq();
    });
    await expect(
      assertRefsReachable([
        "https://raw.githubusercontent.com/x/enemy_sprite.png",
        "https://raw.githubusercontent.com/x/enemy_riot.png",
      ]),
    ).rejects.toThrow(/enemy_riot\.png.*HTTP 404/s);
  });

  it("follows a redirect before judging reachability", async () => {
    let calls = 0;
    https.request.mockImplementation((url, opts, cb) => {
      calls++;
      if (calls === 1) {
        cb(fakeResponse(301, { location: "https://raw.githubusercontent.com/x/moved.png" }));
      } else {
        cb(fakeResponse(200));
      }
      return fakeReq();
    });
    await expect(
      assertRefsReachable(["https://raw.githubusercontent.com/x/enemy_sprite.png"]),
    ).resolves.toBeUndefined();
    expect(calls).toBe(2);
  });

  it("surfaces a network error (not just a bad status) in the aggregate message", async () => {
    https.request.mockImplementation(() => {
      const req = fakeReq();
      req.on.mockImplementation((ev, fn) => {
        if (ev === "error") fn(new Error("ENOTFOUND"));
        return req;
      });
      return req;
    });
    await expect(
      assertRefsReachable(["https://raw.githubusercontent.com/x/enemy_sprite.png"]),
    ).rejects.toThrow(/ENOTFOUND/);
  });
});
