import { describe, it, expect, beforeEach } from "vitest";
import { loadScores, saveScore, isHighScore } from "@game/systems/highScoreSystem";

beforeEach(() => {
  localStorage.clear();
});

describe("loadScores", () => {
  it("retourne [] si aucun score", () => {
    expect(loadScores("level1")).toEqual([]);
  });

  it("charge les scores sauvegardés", () => {
    const entry = { score: 100, wave: 3, date: "2026-04-11" };
    saveScore("level1", entry);
    const scores = loadScores("level1");
    expect(scores[0]).toEqual(entry);
  });
});

describe("saveScore", () => {
  it("trie par score décroissant", () => {
    saveScore("level1", { score: 50, wave: 1, date: "2026-04-11" });
    saveScore("level1", { score: 200, wave: 5, date: "2026-04-11" });
    saveScore("level1", { score: 100, wave: 3, date: "2026-04-11" });
    const scores = loadScores("level1");
    expect(scores[0]?.score).toBe(200);
    expect(scores[1]?.score).toBe(100);
    expect(scores[2]?.score).toBe(50);
  });

  it("limite à 10 entrées", () => {
    for (let i = 0; i < 15; i++) {
      saveScore("level1", { score: i, wave: 1, date: "2026-04-11" });
    }
    expect(loadScores("level1").length).toBe(10);
  });

  it("scores isolés par levelId", () => {
    saveScore("level1", { score: 100, wave: 1, date: "2026-04-11" });
    expect(loadScores("level2")).toEqual([]);
  });
});

describe("isHighScore", () => {
  it("true si table vide et score > 0", () => {
    expect(isHighScore("level1", 1)).toBe(true);
  });

  it("false si score = 0 et table vide", () => {
    expect(isHighScore("level1", 0)).toBe(false);
  });

  it("true si score dépasse le plus bas des 10", () => {
    for (let i = 1; i <= 10; i++) {
      saveScore("level1", { score: i * 10, wave: 1, date: "2026-04-11" });
    }
    expect(isHighScore("level1", 200)).toBe(true);
    expect(isHighScore("level1", 5)).toBe(false);
  });
});
