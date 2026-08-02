import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPhotoLeverage, recordPhotoLeverage } from "@hooks/photoLeverageStorage";
import { PHOTO_LEVERAGE_STORAGE_KEY } from "@game/systems/photoLeverageSystem";

describe("photoLeverageStorage — the impure half (ADR-0080)", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("reads `none` when nothing was ever written", () => {
    expect(loadPhotoLeverage()).toBe("none");
  });

  it("round-trips a recorded proof across a simulated reload", () => {
    expect(recordPhotoLeverage("master")).toBe("master");
    expect(loadPhotoLeverage()).toBe("master");
  });

  it("merges monotonically: a later worse roll never downgrades the stored proof", () => {
    recordPhotoLeverage("master-bonus");
    expect(recordPhotoLeverage("none")).toBe("master-bonus");
    expect(recordPhotoLeverage("master")).toBe("master-bonus");
    expect(loadPhotoLeverage()).toBe("master-bonus");
  });

  it("is idempotent — the bridge may write it every tick without a guard of its own", () => {
    recordPhotoLeverage("master");
    const blob = localStorage.getItem(PHOTO_LEVERAGE_STORAGE_KEY);
    recordPhotoLeverage("master");
    expect(localStorage.getItem(PHOTO_LEVERAGE_STORAGE_KEY)).toBe(blob);
  });

  it("writes ONLY its own key", () => {
    recordPhotoLeverage("master");
    expect(Object.keys(localStorage)).toEqual([PHOTO_LEVERAGE_STORAGE_KEY]);
  });

  it("a corrupt blob reads as `none` and is repaired by the next write", () => {
    localStorage.setItem(PHOTO_LEVERAGE_STORAGE_KEY, "{ not json");
    expect(loadPhotoLeverage()).toBe("none");
    expect(recordPhotoLeverage("master")).toBe("master");
  });

  it("a throwing localStorage degrades to `none` instead of breaking navigation", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(loadPhotoLeverage()).toBe("none");
    expect(() => recordPhotoLeverage("master-bonus")).not.toThrow();
  });
});
