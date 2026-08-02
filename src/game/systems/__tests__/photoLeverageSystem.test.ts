import { describe, expect, it } from "vitest";
import {
  PHOTO_LEVERAGE_STORAGE_KEY,
  mergePhotoLeverage,
  parsePhotoLeverage,
  photoRewardMultiplier,
  serialisePhotoLeverage,
} from "@game/systems/photoLeverageSystem";
import type { PhotoLeverage } from "@game/types/photoLeverage";

const ALL: readonly PhotoLeverage[] = ["none", "master", "master-bonus"];

describe("parsePhotoLeverage — total, never throws (ADR-0076 D4 posture)", () => {
  it("round-trips every legal value", () => {
    for (const v of ALL) expect(parsePhotoLeverage(serialisePhotoLeverage(v))).toBe(v);
  });

  it("reads absent, empty, corrupt, wrong-version and unknown values as `none`", () => {
    for (const raw of [
      null,
      "",
      "not json",
      "[]",
      "null",
      '"master"',
      "{}",
      '{"v":2,"leverage":"master"}',
      '{"v":1}',
      '{"v":1,"leverage":"MASTER"}',
      '{"v":1,"leverage":42}',
      '{"v":1,"leverage":null}',
    ]) {
      expect(parsePhotoLeverage(raw)).toBe("none");
    }
  });

  it("uses its own sixth key, never one of the shipped five", () => {
    expect(PHOTO_LEVERAGE_STORAGE_KEY).toBe("muf_leverage");
    for (const other of ["muf_progress", "muf_prefs", "muf_scores", "muf_funnel"]) {
      expect(PHOTO_LEVERAGE_STORAGE_KEY).not.toBe(other);
    }
  });

  it("the blob is an OBJECT, so `hasPlaque` is an added field and not a migration", () => {
    const blob: unknown = JSON.parse(serialisePhotoLeverage("master-bonus"));
    expect(typeof blob).toBe("object");
    expect(blob).not.toBeNull();
  });
});

describe("mergePhotoLeverage — monotone and idempotent", () => {
  it("never downgrades an obtained proof, whatever order the runs happen in", () => {
    for (const a of ALL) {
      for (const b of ALL) {
        expect(mergePhotoLeverage(a, b)).toBe(mergePhotoLeverage(b, a));
      }
    }
    expect(mergePhotoLeverage("master-bonus", "none")).toBe("master-bonus");
    expect(mergePhotoLeverage("master", "none")).toBe("master");
    expect(mergePhotoLeverage("master", "master-bonus")).toBe("master-bonus");
  });

  it("is idempotent — re-recording the same roll changes nothing", () => {
    for (const v of ALL) expect(mergePhotoLeverage(v, v)).toBe(v);
  });

  it("declining after a good roll keeps the proof (the NORMAL case on level 1)", () => {
    const banked = mergePhotoLeverage("none", "master-bonus");
    expect(mergePhotoLeverage(banked, "none")).toBe("master-bonus");
  });
});

describe("photoRewardMultiplier — the ONLY place leverage becomes a number", () => {
  const TIERS = { master: 0.9, masterBonus: 0.8 };

  it("absent tiers ⇒ ×1.00 at EVERY leverage value (the D-F trap, closed)", () => {
    for (const v of ALL) expect(photoRewardMultiplier(undefined, v)).toBe(1.0);
  });

  it("`none` ⇒ ×1.00 even when tiers are authored — declining costs nothing", () => {
    expect(photoRewardMultiplier(TIERS, "none")).toBe(1.0);
  });

  it("reads the authored tiers, never a module constant", () => {
    expect(photoRewardMultiplier(TIERS, "master")).toBe(0.9);
    expect(photoRewardMultiplier(TIERS, "master-bonus")).toBe(0.8);
    // A different row would give different numbers — that is the whole point of authoring.
    expect(photoRewardMultiplier({ master: 0.95, masterBonus: 0.85 }, "master")).toBe(0.95);
  });

  it("is monotone in the leverage: a better roll is never a worse multiplier", () => {
    expect(photoRewardMultiplier(TIERS, "master-bonus")).toBeLessThanOrEqual(
      photoRewardMultiplier(TIERS, "master"),
    );
    expect(photoRewardMultiplier(TIERS, "master")).toBeLessThanOrEqual(
      photoRewardMultiplier(TIERS, "none"),
    );
  });
});
