import { describe, it, expect } from "vitest";
import { skipIfExists, skip } from "../idempotent.mjs";

// ADR-0007 D-TDD: "returns true (skip) when the file exists and force is
// false; returns false when force is true." Written RED against the
// not-yet-extracted decision, then the copy-pasted `!FORCE && fs.existsSync(...)`
// guards in the generators are replaced by this.
describe("skipIfExists", () => {
  it("returns true (skip) when the file exists and force is false", () => {
    expect(skipIfExists({ exists: true }, false)).toBe(true);
  });

  it("returns false (do not skip) when the file exists but force is true", () => {
    expect(skipIfExists({ exists: true }, true)).toBe(false);
  });

  it("returns false (do not skip) when the file does not exist, force false", () => {
    expect(skipIfExists({ exists: false }, false)).toBe(false);
  });

  it("returns false (do not skip) when the file does not exist, force true", () => {
    expect(skipIfExists({ exists: false }, true)).toBe(false);
  });

  it("defaults force to false when omitted", () => {
    expect(skipIfExists({ exists: true })).toBe(true);
    expect(skipIfExists({ exists: false })).toBe(false);
  });
});

// The injectable-existsSync edge: the primitive above never imports `fs`
// itself; `skip()` is the thin wrapper a generator calls, taking the real (or
// a fake) existsSync as an explicit dependency.
describe("skip (injectable existsSync edge)", () => {
  it("calls the injected existsSync with the given path and applies skipIfExists", () => {
    const calls = [];
    const fakeExistsSync = (p) => {
      calls.push(p);
      return p === "public/assets/truck.png";
    };
    expect(skip("public/assets/truck.png", { force: false, existsSync: fakeExistsSync })).toBe(
      true,
    );
    expect(skip("public/assets/car.png", { force: false, existsSync: fakeExistsSync })).toBe(false);
    expect(calls).toEqual(["public/assets/truck.png", "public/assets/car.png"]);
  });

  it("force=true never skips even when existsSync reports true", () => {
    expect(skip("x.png", { force: true, existsSync: () => true })).toBe(false);
  });

  it("throws a clear error when existsSync is not injected", () => {
    expect(() => skip("x.png", {})).toThrow(/existsSync/);
  });
});
