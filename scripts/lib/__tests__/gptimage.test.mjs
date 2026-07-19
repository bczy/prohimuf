import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// fetchImg()/withRetry() hit `https.get` directly — mock the built-in so retry
// and redirect handling are exercised deterministically, no real network I/O
// and no timing dependency (same pattern as scripts/lib/pollinations.test.mjs).
vi.mock("https", () => ({ default: { get: vi.fn() } }));

import https from "https";
import {
  LEGACY_TOKEN_PATH,
  readToken,
  genUrl,
  fetchImg,
  withRetry,
  cropRectForAspect,
  cyanPreviewCanvas,
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
