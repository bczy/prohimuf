import { describe, it, expect } from "vitest";
import { parseSize, resolveRefUrl, resolveOutFile } from "../gen-from-reference.mjs";

describe("parseSize", () => {
  it("accepts a valid WxH", () => {
    expect(parseSize("256x160")).toEqual({ width: 256, height: 160 });
  });

  it.each(["0x0", "256", "256x", "-5x5", "9999x9999"])("rejects %s", (size) => {
    expect(() => parseSize(size)).toThrow();
  });
});

describe("resolveRefUrl", () => {
  it("passes an https:// URL through unchanged", () => {
    const url = "https://example.com/ref.png";
    expect(resolveRefUrl(url)).toBe(url);
  });

  it("rejects a non-https URL scheme", () => {
    expect(() => resolveRefUrl("http://example.com/ref.png")).toThrow(/https/i);
  });

  it("turns a repo-relative path into a raw.githubusercontent.com URL", () => {
    const url = resolveRefUrl("references/x.png");
    expect(url).toContain("https://raw.githubusercontent.com/");
    expect(url).toContain("/references/x.png");
  });

  it("treats a scheme-less path containing 'http' as repo-relative, not passthrough", () => {
    const url = resolveRefUrl("httpfoo.png");
    expect(url).toContain("https://raw.githubusercontent.com/");
    expect(url).toContain("/httpfoo.png");
  });
});

describe("resolveOutFile", () => {
  it("rejects an absolute path outside the repo", () => {
    expect(() => resolveOutFile("/etc/x.png")).toThrow(/escapes repo root/);
  });

  it("rejects a path that escapes the repo root via ../", () => {
    expect(() => resolveOutFile("../evil.png")).toThrow(/escapes repo root/);
  });

  it("accepts a repo-relative path under public/assets", () => {
    const p = resolveOutFile("public/assets/vehicles/moto.png");
    expect(p.replace(/\\/g, "/")).toMatch(/public\/assets\/vehicles\/moto\.png$/);
  });
});
