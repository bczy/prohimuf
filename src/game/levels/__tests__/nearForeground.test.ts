import { describe, it, expect } from "vitest";
import { getNearForeground, LEVEL_ART_LIST, type NearForegroundKind } from "@game/levels/levelArt";

/**
 * Near-foreground parallax data seam (ADR-0045, story near-foreground parallax).
 * This is the FROZEN cross-lane contract Lane B (render) imports: the shape of
 * `getNearForeground`, its opt-out semantics and the clamped factor range. These
 * tests pin that behaviour against the real manifest data.
 */

const VALID_KINDS: readonly NearForegroundKind[] = [
  "parkingMeter",
  "lamppost",
  "wallaceFountain",
  "trafficLight",
  "bollard",
  "scooter",
  "bench",
  "streetSign",
];
const FACTOR_MIN = -0.5;
const FACTOR_MAX = -0.1;

describe("getNearForeground", () => {
  it.each(["belliard", "stalingrad"])("%s declares a well-formed near-foreground layer", (id) => {
    const layer = getNearForeground(id);
    expect(layer, `${id} must declare a near-foreground layer`).not.toBeNull();
    if (layer === null) return;

    // factor is clamped into the negative parallax band.
    expect(layer.factor).toBeGreaterThanOrEqual(FACTOR_MIN);
    expect(layer.factor).toBeLessThanOrEqual(FACTOR_MAX);

    // Two kerb rows (near + far); a sane ceiling of ~10 props per row. Off-screen
    // props are frustum-culled, so the on-screen draw count stays small.
    expect(layer.objects.length).toBeGreaterThan(0);
    expect(layer.objects.length).toBeLessThanOrEqual(20);

    for (const obj of layer.objects) {
      expect(VALID_KINDS, `kind "${obj.kind}"`).toContain(obj.kind);
      expect(obj.x, "anchor x in [0,1]").toBeGreaterThanOrEqual(0);
      expect(obj.x, "anchor x in [0,1]").toBeLessThanOrEqual(1);
      if (obj.scale !== undefined) {
        expect(obj.scale, "scale positive when present").toBeGreaterThan(0);
      }
      if (obj.row !== undefined) {
        expect(["near", "far"], `row "${obj.row ?? ""}"`).toContain(obj.row);
      }
    }
  });

  it("returns null for vitry (ratified opt-out: no nearForeground field)", () => {
    expect(getNearForeground("vitry")).toBeNull();
  });

  it("returns null for an unknown id (no fall-back to the first level)", () => {
    expect(getNearForeground("does-not-exist")).toBeNull();
  });

  it("returns null for undefined id", () => {
    expect(getNearForeground(undefined)).toBeNull();
  });

  it("clamps an out-of-range factor to [-0.50, -0.10] (via a cast-injected level)", () => {
    // The real manifest keeps factors in range, so exercise the clamp branch
    // directly: monkeypatch a declared level to carry an out-of-range factor,
    // read it back through the accessor, then restore. (Cast to bypass the
    // readonly seam only for this white-box clamp assertion.)
    const level = LEVEL_ART_LIST.find((l) => l.id === "belliard");
    expect(level).toBeDefined();
    if (level === undefined) return;

    const mutable = level as { nearForeground?: { factor: number; objects: readonly unknown[] } };
    const original = mutable.nearForeground;
    expect(original).toBeDefined();
    if (original === undefined) return;

    try {
      mutable.nearForeground = { factor: -5, objects: original.objects };
      expect(getNearForeground("belliard")?.factor).toBe(FACTOR_MIN);

      mutable.nearForeground = { factor: 0.9, objects: original.objects };
      expect(getNearForeground("belliard")?.factor).toBe(FACTOR_MAX);

      // In-range factor passes through untouched.
      mutable.nearForeground = { factor: -0.22, objects: original.objects };
      expect(getNearForeground("belliard")?.factor).toBeCloseTo(-0.22, 10);
    } finally {
      mutable.nearForeground = original;
    }
  });

  // --- Hardening (post-review): the manifest is untyped JSON, so bad values are
  // scrubbed at the source before the render layer consumes them. Injected via a
  // cast on a declared level, exercised through the accessor, then restored. ---

  /** A near-foreground layer shape loose enough to inject malformed fixtures. */
  interface InjectedNear {
    factor: number;
    objects: readonly { kind: string; x: number; scale?: number }[];
  }
  interface MutableNear {
    nearForeground?: InjectedNear;
  }

  const withInjectedLayer = (layer: InjectedNear, assert: () => void): void => {
    const level = LEVEL_ART_LIST.find((l) => l.id === "belliard");
    expect(level).toBeDefined();
    if (level === undefined) return;
    const mutable = level as MutableNear;
    const original = mutable.nearForeground;
    expect(original).toBeDefined();
    if (original === undefined) return;
    try {
      mutable.nearForeground = layer;
      assert();
    } finally {
      mutable.nearForeground = original;
    }
  };

  it("falls back to a finite in-range factor when the declared factor is NaN", () => {
    withInjectedLayer({ factor: Number.NaN, objects: [{ kind: "parkingMeter", x: 0.5 }] }, () => {
      const factor = getNearForeground("belliard")?.factor;
      expect(factor).toBeDefined();
      expect(Number.isFinite(factor)).toBe(true);
      expect(factor).toBeGreaterThanOrEqual(FACTOR_MIN);
      expect(factor).toBeLessThanOrEqual(FACTOR_MAX);
    });
  });

  it("drops objects whose kind is not a known near-foreground kind", () => {
    withInjectedLayer(
      {
        factor: -0.2,
        objects: [
          { kind: "parkingMeter", x: 0.2 },
          { kind: "carRof", x: 0.5 }, // typo → unknown kind
          { kind: "bench", x: 0.8 },
        ],
      },
      () => {
        const layer = getNearForeground("belliard");
        expect(layer).not.toBeNull();
        expect(layer?.objects).toHaveLength(2);
        for (const obj of layer?.objects ?? []) {
          expect(VALID_KINDS, `kind "${obj.kind}"`).toContain(obj.kind);
        }
      },
    );
  });

  it("normalizes non-positive or non-finite scale to 1; keeps valid scale", () => {
    withInjectedLayer(
      {
        factor: -0.2,
        objects: [
          { kind: "parkingMeter", x: 0.1, scale: 0 },
          { kind: "parkingMeter", x: 0.3, scale: -2 },
          { kind: "parkingMeter", x: 0.5, scale: Number.NaN },
          { kind: "parkingMeter", x: 0.7, scale: 1.5 },
          { kind: "parkingMeter", x: 0.9 }, // absent → default (undefined)
        ],
      },
      () => {
        const objs = getNearForeground("belliard")?.objects ?? [];
        expect(objs).toHaveLength(5);
        expect(objs[0]?.scale).toBe(1);
        expect(objs[1]?.scale).toBe(1);
        expect(objs[2]?.scale).toBe(1);
        expect(objs[3]?.scale).toBe(1.5);
        expect(objs[4]?.scale).toBeUndefined();
      },
    );
  });
});
