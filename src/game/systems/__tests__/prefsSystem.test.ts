import { describe, it, expect, beforeEach } from "vitest";
import { loadPrefs, savePrefs, DEFAULT_PREFS } from "@game/systems/prefsSystem";

beforeEach(() => {
  localStorage.clear();
});

describe("loadPrefs", () => {
  it("retourne DEFAULT_PREFS si rien en storage", () => {
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });

  it("charge les prefs sauvegardées", () => {
    const prefs = { ...DEFAULT_PREFS, lives: 5, difficulty: "hard" as const };
    savePrefs(prefs);
    expect(loadPrefs()).toEqual(prefs);
  });

  it("clamp soundVolume [0,1]", () => {
    localStorage.setItem("muf_prefs", JSON.stringify({ ...DEFAULT_PREFS, soundVolume: 2 }));
    expect(loadPrefs().soundVolume).toBe(1);
  });

  it("clamp lives [1,5]", () => {
    localStorage.setItem("muf_prefs", JSON.stringify({ ...DEFAULT_PREFS, lives: 99 }));
    expect(loadPrefs().lives).toBe(5);
  });

  it("difficulty invalide → default", () => {
    localStorage.setItem("muf_prefs", JSON.stringify({ ...DEFAULT_PREFS, difficulty: "insane" }));
    expect(loadPrefs().difficulty).toBe(DEFAULT_PREFS.difficulty);
  });

  it("JSON corrompu → default", () => {
    localStorage.setItem("muf_prefs", "not-json");
    expect(loadPrefs()).toEqual(DEFAULT_PREFS);
  });
});
