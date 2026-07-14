import { describe, it, expect } from "vitest";
import { difficultyMark } from "../derivations";
import { MARK } from "../../print/tokens";

/**
 * Pure regression lock that the fanzine reskin preserved the shipped `LevelCard`
 * difficulty derivation exactly (plan §7.2). Thresholds are
 * `> 1.2 → DIFFICILE / > 1.0 → NORMAL / else FACILE`; the middle-tier label is the
 * f2-aligned `NORMAL`. The §2bis.1 marker inks (green / orange / pink) are asserted
 * from the single `print/tokens.ts` source, not re-declared here (AC3 dedup).
 */
describe("difficultyMark", () => {
  it("stamps FACILE/green at the shipped belliard multiplier (1.0)", () => {
    expect(difficultyMark(1.0)).toEqual({ label: "FACILE", ink: MARK.green });
  });

  it("stamps DIFFICILE/pink at the shipped stalingrad multiplier (1.3)", () => {
    expect(difficultyMark(1.3)).toEqual({ label: "DIFFICILE", ink: MARK.pink });
  });

  it("stamps DIFFICILE/pink at the shipped vitry multiplier (1.6)", () => {
    // Locks the design-gate finding: both hard gigs stamp DIFFICILE; they are told
    // apart by AMBIANCE + district, not the stamp.
    expect(difficultyMark(1.6)).toEqual({ label: "DIFFICILE", ink: MARK.pink });
  });

  it("stamps the latent middle tier as NORMAL/orange (f2 label), not MOYEN", () => {
    // No shipped level renders this tier, but the boundary locks the label word.
    expect(difficultyMark(1.1)).toEqual({ label: "NORMAL", ink: MARK.orange });
    expect(difficultyMark(1.2)).toEqual({ label: "NORMAL", ink: MARK.orange });
  });

  it("treats the exact 1.0 boundary as FACILE (strict > 1.0)", () => {
    expect(difficultyMark(1.0).label).toBe("FACILE");
  });
});
