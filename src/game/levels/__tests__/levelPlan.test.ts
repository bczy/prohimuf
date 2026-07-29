import { describe, expect, it } from "vitest";
import {
  mobileVisibleProps,
  planToLevelArt,
  planToLevelConfig,
  validateLevelPlan,
  type GeneratedPropSpec,
  type LevelPlan,
} from "@game/levels/levelPlan";

/**
 * The LevelPlan schema (spec-level-harness-sp1 §4.4) and the invariants a plan
 * must hold. The validator is called from tests only: a bad plan breaks CI, never
 * the runtime.
 */
const base: LevelPlan = {
  id: "fixture",
  fiction: { name: "Fixture", label: "Fixture, Paris, 1998", district: "Test", year: "1998" },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [],
  props: [],
  gameplay: { enemiesToWin: 5, timeSeconds: 60, enemySpeedMultiplier: 1, windowWeights: {} },
};

const vigile = {
  kind: "fixture:vigile",
  hp: 2,
  bulletDamage: 0.5,
  hiddenDuration: 1.6,
  visibleDuration: 3,
  shoots: true,
  scoreDelta: 2,
  livesDelta: 0,
  timeDelta: 0,
  countsAsTarget: true,
  weight: 0,
  spriteBase: "enemy_fixture_vigile",
  variants: 1,
  tint: "#ffffff",
  aspect: 1,
} as const;

/** A sound prop, so a test only has to spell the field it is about. */
const prop = (kind: `${string}:${string}`, row?: "near" | "far"): GeneratedPropSpec => ({
  kind,
  asset: `assets/nearfg/${kind.replace(":", "/")}.png`,
  aspect: 0.6,
  heightFrac: 0.28,
  footPadFrac: 0.15,
  x: 0.2,
  ...(row === undefined ? {} : { row }),
});

describe("validateLevelPlan", () => {
  it("accepts a minimal plan", () => {
    expect(validateLevelPlan(base)).toEqual([]);
  });

  it("rejects an archetype whose weight is not zero", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, weight: 3 }] };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("weight"));
  });

  it("rejects an archetype id namespaced on another level", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, kind: "autre:vigile" }] };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("rejects a prop with an incomplete sizing triplet", () => {
    const plan = {
      ...base,
      props: [{ kind: "fixture:kiosque", asset: "a.png", aspect: 0.6, x: 0.2 }],
    } as unknown as LevelPlan;
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("heightFrac"));
  });

  it("rejects a prop namespaced on another level", () => {
    const plan: LevelPlan = {
      ...base,
      props: [
        {
          kind: "autre:kiosque",
          asset: "a.png",
          aspect: 0.6,
          heightFrac: 0.28,
          footPadFrac: 0.15,
          x: 0.2,
        },
      ],
    };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("rejects a windowWeights key namespaced on another level", () => {
    // Would leak a foreign level's kind into THIS level's window pool.
    const plan: LevelPlan = {
      ...base,
      archetypes: [vigile],
      gameplay: { ...base.gameplay, windowWeights: { "autre:vigile": 50 } },
    };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("keeps the unprefixed core kinds allowed in windowWeights", () => {
    const plan: LevelPlan = {
      ...base,
      gameplay: { ...base.gameplay, windowWeights: { riot: 30, normal: 0 } },
    };
    expect(validateLevelPlan(plan)).toEqual([]);
  });

  it("rejects a windowWeights key no archetype of the plan declares (typo)", () => {
    // `buildWeightedFrom` drops an unregistered kind in silence: 0 % spawn, no error.
    const plan: LevelPlan = {
      ...base,
      archetypes: [vigile],
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigille": 20 } },
    };
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("fixture:vigille"));
  });

  it("accepts a windowWeights key backed by a declared archetype", () => {
    const plan: LevelPlan = {
      ...base,
      archetypes: [vigile],
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigile": 20 } },
    };
    expect(validateLevelPlan(plan)).toEqual([]);
  });

  it("accepts a plan whose every non-empty row survives the mobile halving", () => {
    const plan: LevelPlan = {
      ...base,
      props: [prop("fixture:kiosque", "far"), prop("fixture:borne")],
    };
    expect(validateLevelPlan(plan)).toEqual([]);
  });
});

describe("mobileVisibleProps", () => {
  // Mirrors NearForeground.tsx `split()`: row filter FIRST, then even indices of
  // the ROW's own order — the parity that made the panneaux PARIS vanish.
  const props: readonly GeneratedPropSpec[] = [
    prop("fixture:a", "far"),
    prop("fixture:b"),
    prop("fixture:c", "far"),
    prop("fixture:d", "far"),
    prop("fixture:e"),
  ];

  it("keeps one prop out of two of the row's own order", () => {
    expect(mobileVisibleProps(props, "far").map((p) => p.kind)).toEqual(["fixture:a", "fixture:d"]);
  });

  it("treats a prop without a row as belonging to the near row", () => {
    expect(mobileVisibleProps(props, "near").map((p) => p.kind)).toEqual(["fixture:b"]);
  });
});

describe("planToLevelConfig", () => {
  it("projects the plan into a playable, locked LevelConfig", () => {
    const cfg = planToLevelConfig({ ...base, archetypes: [vigile] });
    expect(cfg.id).toBe("fixture");
    expect(cfg.kind).toBe("playable");
    expect(cfg.name).toBe("Fixture");
    expect(cfg.district).toBe("Test");
    expect(cfg.year).toBe("1998");
    expect(cfg.enemiesToWin).toBe(5);
    expect(cfg.timeSeconds).toBe(60);
    expect(cfg.enemySpeedMultiplier).toBe(1);
    // A generated level is never unlocked by default — it opens through progress.
    expect(cfg.unlocked).toBe(false);
    // `deliveries[0]` seeds GameState.deliveryVehicle: a playable level needs one.
    expect(cfg.deliveries).toHaveLength(1);
  });

  it("carries the plan's window weights into the roster (the activation seam)", () => {
    const cfg = planToLevelConfig({
      ...base,
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigile": 20 } },
    });
    expect(cfg.roster?.windowWeights).toEqual({ "fixture:vigile": 20 });
  });
});

describe("planToLevelArt", () => {
  it("projects the plan into a single-wide LevelArt with no per-layer prompt", () => {
    const art = planToLevelArt(base);
    expect(art.id).toBe("fixture");
    expect(art.label).toBe("Fixture, Paris, 1998");
    expect(art.backdrop).toEqual({ mode: "single-wide", file: "street-wide", aspect: 5.14 });
    // The decor comes from the paid single-wide pipeline, not from gen-level-art.
    expect(art.prompts).toEqual({});
  });

  it("projects the props as near-foreground objects, keeping their declared order", () => {
    const art = planToLevelArt({
      ...base,
      props: [
        {
          kind: "fixture:kiosque",
          asset: "assets/nearfg/fixture/kiosque.png",
          aspect: 0.6,
          heightFrac: 0.28,
          footPadFrac: 0.15,
          x: 0.22,
          row: "far",
        },
        {
          kind: "fixture:borne",
          asset: "assets/nearfg/fixture/borne.png",
          aspect: 0.3,
          heightFrac: 0.1,
          footPadFrac: 0.1,
          x: 0.7,
        },
      ],
    });
    expect(art.nearForeground?.objects).toEqual([
      { kind: "fixture:kiosque", x: 0.22, row: "far" },
      // `row` is OMITTED, never passed as undefined (exactOptionalPropertyTypes).
      { kind: "fixture:borne", x: 0.7 },
    ]);
  });
});

describe("validateLevelPlan — panel run-2 hardenings", () => {
  it("caps level-authored archetypes at ONE (spec §2.1 design decision)", () => {
    const two = {
      ...base,
      archetypes: [
        { ...vigile, kind: "fixture:a" },
        { ...vigile, kind: "fixture:b" },
      ],
    } as LevelPlan;
    expect(validateLevelPlan(two)).toContainEqual(expect.stringContaining("cap is 1"));
  });

  it("rejects variants < 1 and non-integer hp — runtime divides and loops on them", () => {
    const bad = {
      ...base,
      archetypes: [{ ...vigile, variants: 0, hp: 0 }],
    } as LevelPlan;
    const errors = validateLevelPlan(bad);
    expect(errors).toContainEqual(expect.stringContaining("variants"));
    expect(errors).toContainEqual(expect.stringContaining("hp"));
  });

  it("rejects a non-finite prop x — getNearForeground would silently drop it", () => {
    const bad = {
      ...base,
      props: [{ ...prop("fixture:kiosque"), x: Number.NaN }],
    } as LevelPlan;
    expect(validateLevelPlan(bad)).toContainEqual(
      expect.stringContaining("x missing or non-finite"),
    );
  });
});

describe("validateLevelPlan — panel run-3 hardenings", () => {
  it("rejects a timer the default delivery can never fire within", () => {
    const short = { ...base, gameplay: { ...base.gameplay, timeSeconds: 15 } };
    expect(validateLevelPlan(short)).toContainEqual(expect.stringContaining("delivery trigger"));
  });

  // Panel run-4/run-5: firing is not completing. After the 20s trigger the vehicle
  // still travels to stopPosition — a distance that SCALES with backdrop.aspect
  // (fullW = WORLD_HEIGHT 12 × aspect, halved, + VEHICLE_MARGIN 4, at VEHICLE_SPEED 8)
  // — then holds its FULL 8s window before the bonus is awarded. For base's aspect
  // 5.14 the allowance is ceil((30.84+4)/8) = 5s → minimum 33; the boundary itself is
  // rejected (`<=`), 34 is the first legal value.
  it("rejects a timer where the delivery fires but can never COMPLETE (bonus unearnable)", () => {
    const fires = { ...base, gameplay: { ...base.gameplay, timeSeconds: 25 } };
    expect(validateLevelPlan(fires)).toContainEqual(
      expect.stringContaining("delivery bonus can never be earned"),
    );
    const boundary = { ...base, gameplay: { ...base.gameplay, timeSeconds: 33 } };
    expect(validateLevelPlan(boundary)).toContainEqual(
      expect.stringContaining("delivery bonus can never be earned"),
    );
    const enough = { ...base, gameplay: { ...base.gameplay, timeSeconds: 34 } };
    expect(validateLevelPlan(enough)).toStrictEqual([]);
  });

  // Run-5 hardening: the allowance follows the plan's OWN backdrop. Aspect 10 travels
  // ceil((60+4)/8) = 8s → minimum 36: a timer legal on the 5.14 street (34) is
  // rejected on the wide one, and 37 is the first legal value there.
  it("scales the travel allowance with backdrop.aspect (wide street needs more runway)", () => {
    const wide = { ...base, backdrop: { ...base.backdrop, aspect: 10 } };
    const tooShort = { ...wide, gameplay: { ...wide.gameplay, timeSeconds: 34 } };
    expect(validateLevelPlan(tooShort)).toContainEqual(
      expect.stringContaining("delivery bonus can never be earned"),
    );
    const enough = { ...wide, gameplay: { ...wide.gameplay, timeSeconds: 37 } };
    expect(validateLevelPlan(enough)).toStrictEqual([]);
  });

  it("rejects a NaN/non-positive backdrop.aspect (it seeds the layout AND the runway math)", () => {
    const nan = { ...base, backdrop: { ...base.backdrop, aspect: Number.NaN } };
    expect(validateLevelPlan(nan)).toContainEqual(expect.stringContaining("backdrop.aspect"));
    const zero = { ...base, backdrop: { ...base.backdrop, aspect: 0 } };
    expect(validateLevelPlan(zero)).toContainEqual(expect.stringContaining("backdrop.aspect"));
  });

  it("rejects zero/non-finite timeSeconds and bad enemiesToWin/speed", () => {
    const bad = {
      ...base,
      gameplay: { enemiesToWin: 0, timeSeconds: 0, enemySpeedMultiplier: 0, windowWeights: {} },
    };
    const errors = validateLevelPlan(bad);
    expect(errors).toContainEqual(expect.stringContaining("timeSeconds"));
    expect(errors).toContainEqual(expect.stringContaining("enemiesToWin"));
    expect(errors).toContainEqual(expect.stringContaining("enemySpeedMultiplier"));
  });

  it("rejects two placements of one kind that disagree on sizing (last-wins hazard)", () => {
    const twice = {
      ...base,
      props: [prop("fixture:kiosque"), { ...prop("fixture:kiosque"), aspect: 0.9, x: 0.8 }],
    };
    expect(validateLevelPlan(twice)).toContainEqual(expect.stringContaining("disagree"));
  });

  it("accepts two AGREEING placements of one kind at different anchors", () => {
    const twice = {
      ...base,
      props: [prop("fixture:kiosque"), { ...prop("fixture:kiosque"), x: 0.8 }],
    };
    expect(validateLevelPlan(twice)).toEqual([]);
  });
});
