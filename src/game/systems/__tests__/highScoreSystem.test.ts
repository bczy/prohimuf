import { describe, it, expect, beforeEach } from "vitest";
import {
  loadScores,
  saveScore,
  isHighScore,
  sanitizeName,
  sanitizeNameLive,
  resolveDisplayName,
  loadPlayerName,
  savePlayerName,
  ANONYMOUS_NAME,
  MAX_NAME_LENGTH,
} from "@game/systems/highScoreSystem";

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

describe("sanitizeName (AC6)", () => {
  it("trims leading/trailing whitespace", () => {
    expect(sanitizeName("  DJ MULE  ")).toBe("DJ MULE");
  });

  it("empty string stays empty (no minimum, fallback applied at display)", () => {
    expect(sanitizeName("")).toBe("");
  });

  it("whitespace-only string collapses to empty", () => {
    expect(sanitizeName("     ")).toBe("");
    expect(sanitizeName("\t\n ")).toBe("");
  });

  it("clamps to 16 characters", () => {
    const long = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // 26 chars
    const clamped = sanitizeName(long);
    expect(clamped).toBe("ABCDEFGHIJKLMNOP");
    expect(clamped.length).toBe(MAX_NAME_LENGTH);
  });

  it("has no trailing space when the clamp boundary lands on one", () => {
    // 15 chars then a space then more — slice(0,16) would end on the space.
    const clamped = sanitizeName("QUINZE CARACTER foo");
    expect(clamped).toBe("QUINZE CARACTER");
    expect(clamped.endsWith(" ")).toBe(false);
  });

  it("strips control characters that would break a plain-text row", () => {
    expect(sanitizeName("AB\nCD")).toBe("ABCD");
    expect(sanitizeName("A\tB\u0000C\u007FD")).toBe("ABCD");
  });

  it("is idempotent", () => {
    const once = sanitizeName("  Élément\tPerturbateur  ");
    expect(sanitizeName(once)).toBe(once);
  });
});

describe("sanitizeNameLive (per-keystroke clamp)", () => {
  it("keeps edge whitespace so internal spaces survive left-to-right typing", () => {
    // Typing "DJ MEHDI": after "DJ " the space is trailing — it must survive.
    expect(sanitizeNameLive("DJ ")).toBe("DJ ");
    expect(sanitizeNameLive("DJ MEHDI")).toBe("DJ MEHDI");
  });

  it("still strips control characters and clamps to 16", () => {
    expect(sanitizeNameLive("AB\nCD")).toBe("ABCD");
    expect(sanitizeNameLive("ABCDEFGHIJKLMNOPQRSTUVWXYZ").length).toBe(MAX_NAME_LENGTH);
  });

  it("composes with sanitizeName at submit (full trim applied then)", () => {
    expect(sanitizeName(sanitizeNameLive("  DJ MEHDI  "))).toBe("DJ MEHDI");
  });
});

describe("resolveDisplayName (AC4/AC5)", () => {
  it("returns the sanitized name when present", () => {
    expect(resolveDisplayName("SÉLECTA")).toBe("SÉLECTA");
  });

  it("falls back to the anonymous tag for undefined (legacy entry)", () => {
    expect(resolveDisplayName(undefined)).toBe(ANONYMOUS_NAME);
  });

  it("falls back to the anonymous tag for empty/whitespace", () => {
    expect(resolveDisplayName("")).toBe(ANONYMOUS_NAME);
    expect(resolveDisplayName("   ")).toBe(ANONYMOUS_NAME);
  });
});

describe("ScoreEntry name persistence (AC3)", () => {
  it("persists a signed name through the storage key round-trip", () => {
    saveScore("level1", { score: 100, wave: 3, date: "2026-04-11", name: "DJ MULE" });
    expect(loadScores("level1")[0]?.name).toBe("DJ MULE");
  });

  it("sanitizes the name on save (clamp + trim + strip control chars)", () => {
    saveScore("level1", {
      score: 100,
      wave: 3,
      date: "2026-04-11",
      name: "  ABCDEFGHIJKLMNOPQRS\n  ",
    });
    expect(loadScores("level1")[0]?.name).toBe("ABCDEFGHIJKLMNOP");
  });

  it("omits the name field entirely when empty (skip = byte-identical to legacy)", () => {
    saveScore("level1", { score: 100, wave: 3, date: "2026-04-11", name: "   " });
    const raw = localStorage.getItem("muf_scores_level1");
    if (raw === null) throw new Error("expected a stored blob");
    const stored = JSON.parse(raw) as unknown[];
    expect(Object.prototype.hasOwnProperty.call(stored[0], "name")).toBe(false);
  });
});

describe("save-once contract (ADR-0054 §2)", () => {
  it("a single save with a name yields exactly one persisted entry with that name", () => {
    // The render layer defers to ONE saveScore at NAME_ENTRY resolution — this documents
    // that a lone call persists a single named row (no duplicate write).
    const updated = saveScore("level1", {
      score: 100,
      wave: 3,
      date: "2026-04-11",
      name: "SÉLECTA",
    });
    expect(updated).toHaveLength(1);
    const loaded = loadScores("level1");
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe("SÉLECTA");
  });
});

describe("legacy blob back-compat (AC5)", () => {
  it("loads pre-story entries without a name field without crashing", () => {
    localStorage.setItem(
      "muf_scores_level1",
      JSON.stringify([{ score: 100, wave: 3, date: "2026-04-11" }]),
    );
    const loaded = loadScores("level1");
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBeUndefined();
    expect(resolveDisplayName(loaded[0]?.name)).toBe(ANONYMOUS_NAME);
  });

  it("mixes legacy and named entries in one blob", () => {
    localStorage.setItem(
      "muf_scores_level1",
      JSON.stringify([
        { score: 200, wave: 5, date: "2026-04-11", name: "DJ MULE" },
        { score: 100, wave: 3, date: "2026-04-10" },
      ]),
    );
    const loaded = loadScores("level1");
    expect(loaded[0]?.name).toBe("DJ MULE");
    expect(loaded[1]?.name).toBeUndefined();
  });

  it("drops an entry whose name field is corrupt (non-string) but keeps valid rows", () => {
    localStorage.setItem(
      "muf_scores_level1",
      JSON.stringify([
        { score: 200, wave: 5, date: "2026-04-11", name: 42 },
        { score: 100, wave: 3, date: "2026-04-10", name: "OK" },
      ]),
    );
    const loaded = loadScores("level1");
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.name).toBe("OK");
  });
});

describe("muf_player_name last-used byline", () => {
  it("returns empty when never set (first-ever high score)", () => {
    expect(loadPlayerName()).toBe("");
  });

  it("round-trips a saved name", () => {
    savePlayerName("DJ MULE");
    expect(loadPlayerName()).toBe("DJ MULE");
  });

  it("sanitizes on save (clamp + trim + strip control chars)", () => {
    savePlayerName("  ABCDEFGHIJKLMNOPQRS\n  ");
    expect(loadPlayerName()).toBe("ABCDEFGHIJKLMNOP");
    expect(localStorage.getItem("muf_player_name")).toBe("ABCDEFGHIJKLMNOP");
  });

  it("clears the key when saving an empty/whitespace name", () => {
    savePlayerName("DJ MULE");
    savePlayerName("   ");
    expect(localStorage.getItem("muf_player_name")).toBeNull();
    expect(loadPlayerName()).toBe("");
  });

  it("is stored separately from the per-level score keys", () => {
    savePlayerName("DJ MULE");
    saveScore("level1", { score: 100, wave: 1, date: "2026-04-11" });
    expect(localStorage.getItem("muf_player_name")).toBe("DJ MULE");
    expect(loadPlayerName()).toBe("DJ MULE");
  });
});
