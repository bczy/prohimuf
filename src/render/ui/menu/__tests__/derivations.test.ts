import { describe, it, expect } from "vitest";
import { difficultyMark } from "../derivations";

/**
 * Pure regression lock that the fanzine reskin preserved the shipped `LevelCard`
 * difficulty derivation exactly (plan §7.2). Thresholds are
 * `> 1.2 → DIFFICILE / > 1.0 → NORMAL / else FACILE`; the middle-tier label is the
 * f2-aligned `NORMAL`. The §2bis.1 marker inks: green / orange / pink.
 */
const MARK_GREEN = "#2FA84F";
const MARK_ORANGE = "#E8641E";
const MARK_PINK = "#D62A7A";

describe("difficultyMark", () => {
  it("stamps FACILE/green at the shipped belliard multiplier (1.0)", () => {
    expect(difficultyMark(1.0)).toEqual({ label: "FACILE", ink: MARK_GREEN });
  });

  it("stamps DIFFICILE/pink at the shipped stalingrad multiplier (1.3)", () => {
    expect(difficultyMark(1.3)).toEqual({ label: "DIFFICILE", ink: MARK_PINK });
  });

  it("stamps DIFFICILE/pink at the shipped vitry multiplier (1.6)", () => {
    // Locks the design-gate finding: both hard gigs stamp DIFFICILE; they are told
    // apart by AMBIANCE + district, not the stamp.
    expect(difficultyMark(1.6)).toEqual({ label: "DIFFICILE", ink: MARK_PINK });
  });

  it("stamps the latent middle tier as NORMAL/orange (f2 label), not MOYEN", () => {
    // No shipped level renders this tier, but the boundary locks the label word.
    expect(difficultyMark(1.1)).toEqual({ label: "NORMAL", ink: MARK_ORANGE });
    expect(difficultyMark(1.2)).toEqual({ label: "NORMAL", ink: MARK_ORANGE });
  });

  it("treats the exact 1.0 boundary as FACILE (strict > 1.0)", () => {
    expect(difficultyMark(1.0).label).toBe("FACILE");
  });
});
