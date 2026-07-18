import { describe, it, expect, vi, beforeEach } from "vitest";

// fetchImage() hits `https.get` directly — mock the built-in so the redirect
// guard is exercised deterministically, with no real network I/O and no
// timing dependency.
vi.mock("https", () => ({ default: { get: vi.fn() } }));

import https from "https";
import { fluxUrl, kontextUrl, fetchImage } from "../pollinations.mjs";

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
  });

  it("URL-encodes the prompt", () => {
    const url = fluxUrl("a truck, pixel art", 1, 256, 160);
    expect(url).toContain(encodeURIComponent("a truck, pixel art"));
  });
});

describe("kontextUrl", () => {
  const imageUrl = "https://raw.githubusercontent.com/bczy/prohimuf/main/references/x.png";

  it("emits model=kontext, enhance=false, private=true", () => {
    const url = kontextUrl("same character, new pose", 12345, 256, 256, imageUrl);
    expect(url).toContain("model=kontext");
    expect(url).toContain("enhance=false");
    expect(url).toContain("private=true");
  });

  it("encodes the image= param with encodeURIComponent", () => {
    const url = kontextUrl("same character", 1, 256, 256, imageUrl);
    expect(url).toContain(`image=${encodeURIComponent(imageUrl)}`);
  });
});

describe("fetchImage redirect handling", () => {
  beforeEach(() => {
    https.get.mockReset();
  });

  it("rejects after more than 5 redirect hops", async () => {
    https.get.mockImplementation((url, cb) => {
      cb(fakeResponse(302, { location: "https://example.com/next" }));
      return fakeRequest();
    });
    await expect(fetchImage("https://example.com/start")).rejects.toThrow(/redirect/i);
  });

  it("rejects a redirect with no location header", async () => {
    https.get.mockImplementation((url, cb) => {
      cb(fakeResponse(302, {}));
      return fakeRequest();
    });
    await expect(fetchImage("https://example.com/start")).rejects.toThrow(/redirect/i);
  });
});
