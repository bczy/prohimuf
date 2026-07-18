import { describe, it, expect } from "vitest";
import { SLUG_RE, SLOT_RE } from "../promote-hero.mjs";

// Regression guard for the merge-gate finding: --slot is a REGISTRY KEY (mirrors a
// levelArt.json key like `enemy_shooting_2`), NOT a path segment, so it MUST allow
// underscores. Validating it with the path-safe SLUG_RE (no underscore) hard-rejected
// every enemy slot key and broke enemy-hero promotion — one of the two wired families.
describe("promote-hero arg patterns", () => {
  it("SLOT_RE accepts underscore-bearing levelArt slot keys", () => {
    for (const slot of ["enemy_shooting_2", "enemy_riot", "truck", "car", "moto"]) {
      expect(SLOT_RE.test(slot)).toBe(true);
    }
  });

  it("SLOT_RE still rejects path-unsafe values (traversal guard)", () => {
    for (const bad of ["../evil", "a/b", ".", "-lead", "", "a.b"]) {
      expect(SLOT_RE.test(bad)).toBe(false);
    }
  });

  it("SLUG_RE (path segment) stays strict — no underscore, no traversal", () => {
    expect(SLUG_RE.test("truck-hero-v1")).toBe(true);
    expect(SLUG_RE.test("cop-v1")).toBe(true);
    // an underscore-bearing slot key is NOT a valid slug (it is a path segment)
    expect(SLUG_RE.test("enemy_shooting_2")).toBe(false);
    for (const bad of ["../evil", "a/b", "bad_slug", "."]) {
      expect(SLUG_RE.test(bad)).toBe(false);
    }
  });
});
