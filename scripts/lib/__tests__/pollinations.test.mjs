import { describe, it, expect, vi, beforeEach } from "vitest";

// fetchImage() hits `https.get` directly — mock the built-in so the redirect
// guard is exercised deterministically, with no real network I/O and no
// timing dependency.
vi.mock("https", () => ({ default: { get: vi.fn() } }));

import https from "https";
import { fluxUrl, kontextUrl, modelUrl, fetchImage } from "../pollinations.mjs";

// A minimal stand-in for the http.ClientRequest chain fetchImage relies on:
// `https.get(url, cb).on("error", reject)`, then `req.setTimeout(...)`.
function fakeRequest() {
  const req = { on: vi.fn(() => req), setTimeout: vi.fn(), destroy: vi.fn() };
  return req;
}

function fakeResponse(statusCode, headers = {}) {
  return { statusCode, headers, on: vi.fn(), resume: vi.fn() };
}

describe("fluxUrl", () => {
  it("emits model=flux and no image= param", () => {
    const url = fluxUrl("a truck", 12345, 256, 160);
    expect(url).toContain("model=flux");
    expect(url).not.toContain("image=");
    expect(url).toContain("seed=12345");
    expect(url).toContain("width=256");
    expect(url).toContain("height=160");
    expect(url).toContain("enhance=false");
    expect(url).toContain("private=true");
    expect(url).toContain("safe=false");
  });

  it("URL-encodes the prompt", () => {
    const url = fluxUrl("a truck, pixel art", 1, 256, 160);
    expect(url).toContain(encodeURIComponent("a truck, pixel art"));
  });
});

describe("kontextUrl", () => {
  const imageUrl = "https://raw.githubusercontent.com/bczy/prohimuf/main/references/x.png";

  it("emits model=kontext, enhance=false, private=true, safe=false", () => {
    const url = kontextUrl("same character, new pose", 12345, 256, 256, imageUrl);
    expect(url).toContain("model=kontext");
    expect(url).toContain("enhance=false");
    expect(url).toContain("private=true");
    expect(url).toContain("safe=false");
  });

  it("encodes the image= param with encodeURIComponent", () => {
    const url = kontextUrl("same character", 1, 256, 256, imageUrl);
    expect(url).toContain(`image=${encodeURIComponent(imageUrl)}`);
  });
});

describe("modelUrl", () => {
  const imageUrl = "https://raw.githubusercontent.com/bczy/prohimuf/main/references/x.png";

  it("emits the given model and the shared params, no image= by default", () => {
    const url = modelUrl({
      prompt: "a truck",
      seed: 12345,
      width: 256,
      height: 160,
      model: "nanobanana-pro",
    });
    expect(url).toContain("model=nanobanana-pro");
    expect(url).toContain("seed=12345");
    expect(url).toContain("width=256");
    expect(url).toContain("height=160");
    expect(url).toContain("enhance=false");
    expect(url).toContain("private=true");
    expect(url).toContain("safe=false");
    expect(url).not.toContain("image=");
  });

  it("appends image= only when imageUrl is passed", () => {
    const url = modelUrl({
      prompt: "same character",
      seed: 1,
      width: 256,
      height: 256,
      model: "kontext",
      imageUrl,
    });
    expect(url).toContain(`image=${encodeURIComponent(imageUrl)}`);
  });
});

// REGRESSION LOCK: fluxUrl/kontextUrl now delegate to modelUrl — assert their
// output is byte-identical to the pre-delegation literal template strings (which
// already carried safe=false, added earlier in this PR before the delegation
// commit), so any future edit to modelUrl that shifts param order/spelling/casing
// is caught here rather than silently changing the production request contract.
describe("fluxUrl / kontextUrl — byte-identical to pre-delegation literals", () => {
  it("fluxUrl matches the pre-refactor literal exactly", () => {
    const url = fluxUrl("a truck", 12345, 256, 160);
    expect(url).toBe(
      "https://image.pollinations.ai/prompt/a%20truck?width=256&height=160&nologo=true&model=flux&seed=12345&enhance=false&private=true&safe=false",
    );
  });

  it("kontextUrl matches the pre-refactor literal exactly", () => {
    const imageUrl = "https://raw.githubusercontent.com/bczy/prohimuf/main/references/x.png";
    const url = kontextUrl("same character", 1, 256, 256, imageUrl);
    expect(url).toBe(
      "https://image.pollinations.ai/prompt/same%20character?width=256&height=256&nologo=true&model=kontext&seed=1&enhance=false&private=true&safe=false&image=https%3A%2F%2Fraw.githubusercontent.com%2Fbczy%2Fprohimuf%2Fmain%2Freferences%2Fx.png",
    );
  });
});

describe("fetchImage redirect handling", () => {
  beforeEach(() => {
    https.get.mockReset();
  });

  it("rejects after more than 5 redirect hops", async () => {
    https.get.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(302, { location: "https://example.com/next" }));
      return fakeRequest();
    });
    await expect(fetchImage("https://example.com/start")).rejects.toThrow(/redirect/i);
  });

  it("rejects a redirect with no location header", async () => {
    https.get.mockImplementation((url, opts, cb) => {
      cb(fakeResponse(302, {}));
      return fakeRequest();
    });
    await expect(fetchImage("https://example.com/start")).rejects.toThrow(/redirect/i);
  });
});

describe("fetchImage authentication", () => {
  // A 200 response that drives the data/end path so fetchImage's promise resolves.
  function okResponse() {
    const res = fakeResponse(200);
    res.on.mockImplementation((ev, fn) => {
      if (ev === "end") fn();
      return res;
    });
    return res;
  }

  beforeEach(() => {
    https.get.mockReset();
    delete process.env.POLLINATIONS_TOKEN;
  });

  function captureOpts() {
    let seenOpts;
    https.get.mockImplementation((url, opts, cb) => {
      seenOpts = opts;
      cb(okResponse());
      return fakeRequest();
    });
    return () => seenOpts;
  }

  it("sends no Authorization header when POLLINATIONS_TOKEN is unset", async () => {
    const opts = captureOpts();
    await fetchImage("https://image.pollinations.ai/img");
    expect(opts().headers.Authorization).toBeUndefined();
  });

  it("sends a Bearer header to a pollinations.ai host when the token is set", async () => {
    process.env.POLLINATIONS_TOKEN = "tok_abc";
    const opts = captureOpts();
    await fetchImage("https://image.pollinations.ai/img");
    expect(opts().headers.Authorization).toBe("Bearer tok_abc");
  });

  it("does NOT send the token to a non-pollinations host (cross-host redirect guard)", async () => {
    process.env.POLLINATIONS_TOKEN = "tok_abc";
    const opts = captureOpts();
    await fetchImage("https://evil.example/img");
    expect(opts().headers.Authorization).toBeUndefined();
  });

  it("treats a whitespace-only token as anonymous", async () => {
    process.env.POLLINATIONS_TOKEN = "   ";
    const opts = captureOpts();
    await fetchImage("https://image.pollinations.ai/img");
    expect(opts().headers.Authorization).toBeUndefined();
  });
});
