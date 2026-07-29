import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadUnlockedLevels, unlockLevel } from "@game/systems/progressSystem";

/**
 * Player progression save state (ADR-0074 §1). The module moved out of the level catalogue
 * byte-identical, but a new `src/game` module owes its own spec — this file pins the whole
 * contract, including the two try/catch-swallow paths that a byte-identical move preserved
 * but nothing covered before (panel MAJOR / VERIFY F2).
 *
 * Storage key: `muf_progress`. Fallback on ANY unreadable state: `{"belliard"}` — the first
 * playable level is always unlocked, so a corrupt or unavailable storage can never lock the
 * player out of the game.
 */

const PROGRESS_KEY = "muf_progress";
const FALLBACK = ["belliard"];

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("loadUnlockedLevels", () => {
  it("falls back to belliard when the key is absent", () => {
    expect([...loadUnlockedLevels()]).toEqual(FALLBACK);
  });

  it("reads a valid array of ids", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(["belliard", "stalingrad", "vitry"]));
    expect([...loadUnlockedLevels()]).toEqual(["belliard", "stalingrad", "vitry"]);
  });

  it("de-duplicates repeated ids (it is a Set)", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(["belliard", "belliard", "vitry"]));
    expect([...loadUnlockedLevels()]).toEqual(["belliard", "vitry"]);
  });

  it("falls back when the stored JSON is not an array", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({ belliard: true }));
    expect([...loadUnlockedLevels()]).toEqual(FALLBACK);
  });

  it("falls back when the stored blob is malformed JSON", () => {
    localStorage.setItem(PROGRESS_KEY, "not-json");
    expect([...loadUnlockedLevels()]).toEqual(FALLBACK);
  });

  it("filters out non-string entries instead of dropping the whole array", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(["belliard", 42, null, { id: "vitry" }, "stalingrad"]),
    );
    expect([...loadUnlockedLevels()]).toEqual(["belliard", "stalingrad"]);
  });

  it("returns an empty set for a stored empty array (no fallback re-injection)", () => {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify([]));
    expect([...loadUnlockedLevels()]).toEqual([]);
  });

  it("swallows a throwing storage read and falls back (private mode / quota-locked)", () => {
    const getItem = vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(() => loadUnlockedLevels()).not.toThrow();
    expect([...loadUnlockedLevels()]).toEqual(FALLBACK);
    expect(getItem).toHaveBeenCalled();
  });
});

describe("unlockLevel", () => {
  it("round-trips: an unlocked level is present on the next load", () => {
    unlockLevel("stalingrad");
    const unlocked = loadUnlockedLevels();
    expect(unlocked.has("stalingrad")).toBe(true);
    // The default-unlocked belliard survives the write.
    expect(unlocked.has("belliard")).toBe(true);
  });

  it("accumulates across calls and persists under muf_progress", () => {
    unlockLevel("stalingrad");
    unlockLevel("vitry");
    expect([...loadUnlockedLevels()]).toEqual(["belliard", "stalingrad", "vitry"]);
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(
      JSON.stringify(["belliard", "stalingrad", "vitry"]),
    );
  });

  it("re-unlocking a level does not duplicate it", () => {
    unlockLevel("stalingrad");
    unlockLevel("stalingrad");
    expect([...loadUnlockedLevels()]).toEqual(["belliard", "stalingrad"]);
  });

  it("swallows a throwing storage write without crashing the caller", () => {
    const setItem = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    expect(() => {
      unlockLevel("vitry");
    }).not.toThrow();
    expect(setItem).toHaveBeenCalled();
    // Nothing persisted, and the read path still answers with the fallback.
    expect([...loadUnlockedLevels()]).toEqual(FALLBACK);
  });
});
