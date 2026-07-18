import { describe, it, expect } from "vitest";
import { parseAssetArgs } from "../cli.mjs";

// ADR-0007 D2 — replaces the duplicated `--list` / `--asset` parser that used
// to differ only in a padEnd column width between generate-assets.mjs and
// generate-game-assets.mjs.
describe("parseAssetArgs", () => {
  it("returns {} for an empty argv", () => {
    expect(parseAssetArgs([])).toEqual({});
  });

  it("detects --list", () => {
    expect(parseAssetArgs(["--list"])).toEqual({ list: true });
  });

  it("detects --asset <name> as target (default flag)", () => {
    expect(parseAssetArgs(["--asset", "truck"])).toEqual({ target: "truck" });
  });

  it("--list and --asset can combine (caller decides precedence)", () => {
    expect(parseAssetArgs(["--list", "--asset", "truck"])).toEqual({
      list: true,
      target: "truck",
    });
  });

  it("ignores unrelated flags", () => {
    expect(parseAssetArgs(["--placeholder", "--force"])).toEqual({});
  });

  it("throws when --asset has no value", () => {
    expect(() => parseAssetArgs(["--asset"])).toThrow(/--asset requires a value/);
  });

  it("throws when --asset's value looks like another flag", () => {
    expect(() => parseAssetArgs(["--asset", "--list"])).toThrow(/--asset requires a value/);
  });

  it("supports a custom target flag (e.g. courier's --layer)", () => {
    expect(parseAssetArgs(["--layer", "bike"], { targetFlag: "--layer" })).toEqual({
      target: "bike",
    });
    // the default --asset is NOT recognised when a custom targetFlag is set
    expect(parseAssetArgs(["--asset", "bike"], { targetFlag: "--layer" })).toEqual({});
  });
});
