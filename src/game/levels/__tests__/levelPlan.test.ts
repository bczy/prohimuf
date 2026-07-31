import { describe, expect, it } from "vitest";
import {
  mobileVisibleProps,
  planToLevelArt,
  planToLevelConfig,
  validateCatalogue,
  validateLevelPlan,
  WORLD_HEIGHT_UNITS,
  type GeneratedPropSpec,
  type LevelPlan,
} from "@game/levels/levelPlan";
import { WORLD_HEIGHT } from "@game/levels/levelArt";
import type { Archetype } from "@game/types/enemyTypes";

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

/**
 * `validateLevelPlan` speaks structured `LevelIssue`s (MCP §4.1). The guards' human
 * sentences are unchanged, so the historical assertions still read them — through this
 * projection instead of the old bare `string[]`.
 */
const messagesOf = (plan: LevelPlan): readonly string[] =>
  validateLevelPlan(plan).map((issue) => issue.message);

describe("validateLevelPlan", () => {
  it("accepts a minimal plan", () => {
    expect(validateLevelPlan(base)).toEqual([]);
  });

  it("rejects an archetype whose weight is not zero", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, weight: 3 }] };
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("weight"));
  });

  it("rejects an archetype id namespaced on another level", () => {
    const plan: LevelPlan = { ...base, archetypes: [{ ...vigile, kind: "autre:vigile" }] };
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  // Run-8: `"<id>:"` (empty name — the copy-paste-template typo) passes a bare
  // startsWith but isOwnedGeneratedPropKind / the sprite pipeline silently drop it
  // at runtime; the CI-time rule must be byte-for-byte the runtime contract.
  it("rejects an empty name after the namespace prefix (archetype AND prop)", () => {
    const badArch: LevelPlan = { ...base, archetypes: [{ ...vigile, kind: "fixture:" }] };
    expect(messagesOf(badArch)).toContainEqual(expect.stringContaining("non-empty name"));
    const badProp: LevelPlan = { ...base, props: [{ ...prop("fixture:x"), kind: "fixture:" }] };
    expect(messagesOf(badProp)).toContainEqual(expect.stringContaining("non-empty name"));
  });

  it("rejects a prop with an incomplete sizing triplet", () => {
    const plan = {
      ...base,
      props: [{ kind: "fixture:kiosque", asset: "a.png", aspect: 0.6, x: 0.2 }],
    } as unknown as LevelPlan;
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("heightFrac"));
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
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("rejects a windowWeights key namespaced on another level", () => {
    // Would leak a foreign level's kind into THIS level's window pool.
    const plan: LevelPlan = {
      ...base,
      archetypes: [vigile],
      gameplay: { ...base.gameplay, windowWeights: { "autre:vigile": 50 } },
    };
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("namespace"));
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
    expect(messagesOf(plan)).toContainEqual(expect.stringContaining("fixture:vigille"));
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

describe("validateLevelPlan — panel run-9 hardenings", () => {
  // Runtime reads these unclamped: bulletDamage → snapLives (NaN corrupts lives
  // forever), hidden/visible durations → enemySystem timers (NaN flips state every
  // frame), the deltas → HUD arithmetic on every kill.
  it("rejects non-finite/out-of-range bulletDamage, durations and deltas", () => {
    const cases: readonly (readonly [Partial<Archetype>, string])[] = [
      [{ bulletDamage: Number.NaN }, "bulletDamage"],
      [{ bulletDamage: -0.5 }, "bulletDamage"],
      [{ hiddenDuration: 0 }, "hiddenDuration"],
      [{ visibleDuration: Number.NaN }, "visibleDuration"],
      [{ scoreDelta: Number.NaN }, "scoreDelta"],
      [{ livesDelta: Number.POSITIVE_INFINITY }, "livesDelta"],
      [{ timeDelta: Number.NaN }, "timeDelta"],
    ];
    for (const [patch, field] of cases) {
      const bad: LevelPlan = { ...base, archetypes: [{ ...vigile, ...patch }] };
      expect(messagesOf(bad)).toContainEqual(expect.stringContaining(field));
    }
  });

  // Run-10 BLOQUANT: buildWeightedFrom does Array.from({ length: weight }) per kind —
  // Infinity resolves past the max array length and throws RangeError on EVERY boot
  // of the level; NaN silently contributes zero entries (and blinded the winnable
  // check below); negative is nonsense the runtime clamps in silence.
  it("rejects non-finite, negative or absurdly large windowWeights VALUES", () => {
    // 200000 (run-11): same Array.from blow-up class as Infinity, below the
    // RangeError threshold — a frozen tab on boot instead of a crash.
    for (const weight of [Number.POSITIVE_INFINITY, Number.NaN, -5, 200000]) {
      const bad: LevelPlan = {
        ...base,
        archetypes: [vigile],
        gameplay: { ...base.gameplay, windowWeights: { "fixture:vigile": weight } },
      };
      expect(messagesOf(bad)).toContainEqual(
        expect.stringContaining("weight must be a finite number in [0, 1000]"),
      );
    }
  });

  // Victory counts only countsAsTarget kinds (normal/riot/biker in the core pool):
  // zeroing them all while activating only a non-countable kind is a permanent
  // softlock — enemiesToWin can never be reached.
  it("rejects a windowWeights override that leaves no countsAsTarget kind in the pool", () => {
    const softlock: LevelPlan = {
      ...base,
      archetypes: [{ ...vigile, countsAsTarget: false }],
      gameplay: {
        ...base.gameplay,
        windowWeights: { normal: 0, riot: 0, biker: 0, "fixture:vigile": 20 },
      },
    };
    expect(messagesOf(softlock)).toContainEqual(
      expect.stringContaining("enemiesToWin can never be reached"),
    );
  });

  it("accepts zeroed core kinds when the plan's OWN countable archetype takes over", () => {
    const spotlight: LevelPlan = {
      ...base,
      archetypes: [vigile], // countsAsTarget: true
      gameplay: {
        ...base.gameplay,
        windowWeights: { normal: 0, riot: 0, biker: 0, "fixture:vigile": 20 },
      },
    };
    expect(validateLevelPlan(spotlight)).toStrictEqual([]);
  });

  it("keeps the default pool winnable with no overrides at all", () => {
    expect(validateLevelPlan(base)).toStrictEqual([]);
  });
});

describe("WORLD_HEIGHT_UNITS drift pin (panel run-8)", () => {
  // levelPlan.ts hand-duplicates the manifest's world.heightUnits because it imports
  // levelArt as TYPES ONLY. This test (which may import both freely) is the guard:
  // retune levelArt.json's world.heightUnits and this goes red until the validator's
  // copy — and therefore the delivery-runway arithmetic — is updated with it.
  it("equals levelArt's live WORLD_HEIGHT (manifest world.heightUnits)", () => {
    expect(WORLD_HEIGHT_UNITS).toBe(WORLD_HEIGHT);
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
    expect(messagesOf(two)).toContainEqual(expect.stringContaining("cap is 1"));
  });

  it("rejects variants above the cap (16) — preload fan-out guard, run-11", () => {
    const bad: LevelPlan = { ...base, archetypes: [{ ...vigile, variants: 100000 }] };
    expect(messagesOf(bad)).toContainEqual(
      expect.stringContaining("variants must be an integer in [1, 16]"),
    );
  });

  it("rejects variants < 1 and non-integer hp — runtime divides and loops on them", () => {
    const bad = {
      ...base,
      archetypes: [{ ...vigile, variants: 0, hp: 0 }],
    } as LevelPlan;
    const errors = messagesOf(bad);
    expect(errors).toContainEqual(expect.stringContaining("variants"));
    expect(errors).toContainEqual(expect.stringContaining("hp"));
  });

  it("rejects a non-finite prop x — getNearForeground would silently drop it", () => {
    const bad = {
      ...base,
      props: [{ ...prop("fixture:kiosque"), x: Number.NaN }],
    } as LevelPlan;
    expect(messagesOf(bad)).toContainEqual(expect.stringContaining("x missing or non-finite"));
  });
});

describe("validateLevelPlan — panel run-3 hardenings", () => {
  it("rejects a timer the default delivery can never fire within", () => {
    const short = { ...base, gameplay: { ...base.gameplay, timeSeconds: 15 } };
    expect(messagesOf(short)).toContainEqual(expect.stringContaining("delivery trigger"));
  });

  // Panel run-4/run-5: firing is not completing. After the 20s trigger the vehicle
  // still travels to stopPosition — a distance that SCALES with backdrop.aspect
  // (fullW = WORLD_HEIGHT 12 × aspect, halved, + VEHICLE_MARGIN 4, at VEHICLE_SPEED 8)
  // — then holds its FULL 8s window before the bonus is awarded. For base's aspect
  // 5.14 the allowance is ceil((30.84+4)/8) = 5s → minimum 33; the boundary itself is
  // rejected (`<=`), 34 is the first legal value.
  it("rejects a timer where the delivery fires but can never COMPLETE (bonus unearnable)", () => {
    const fires = { ...base, gameplay: { ...base.gameplay, timeSeconds: 25 } };
    expect(messagesOf(fires)).toContainEqual(
      expect.stringContaining("delivery bonus can never be earned"),
    );
    const boundary = { ...base, gameplay: { ...base.gameplay, timeSeconds: 33 } };
    expect(messagesOf(boundary)).toContainEqual(
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
    expect(messagesOf(tooShort)).toContainEqual(
      expect.stringContaining("delivery bonus can never be earned"),
    );
    const enough = { ...wide, gameplay: { ...wide.gameplay, timeSeconds: 37 } };
    expect(validateLevelPlan(enough)).toStrictEqual([]);
  });

  // Run-6: archetype.aspect is read as directly as variants/hp — EnemySprite scales
  // the mesh by it, and GameScene folds every generated aspect into WIDEST_ASPECT at
  // import, so a NaN would leak into every level's window-fit harness box.
  it("rejects a NaN/non-positive archetype aspect (sprite scale + WIDEST_ASPECT seed)", () => {
    for (const aspect of [Number.NaN, 0, -1]) {
      const bad = { ...base, archetypes: [{ ...vigile, aspect }] };
      expect(messagesOf(bad)).toContainEqual(
        expect.stringContaining("aspect must be a finite number > 0"),
      );
    }
  });

  // Run-7: prop.aspect feeds `planeW = planeH * aspect` UNCLAMPED in NearForeground —
  // 0 renders an invisible prop, negative mirrors it — so it gets the same > 0 law as
  // archetype.aspect (NaN already caught by the finite-triplet check above).
  it("rejects a zero/negative prop aspect (plane width is aspect-scaled, unclamped)", () => {
    for (const aspect of [0, -0.6]) {
      const bad: LevelPlan = { ...base, props: [{ ...prop("fixture:kiosque"), aspect }] };
      expect(messagesOf(bad)).toContainEqual(
        expect.stringContaining("aspect must be a finite number > 0"),
      );
    }
  });

  it("rejects a NaN/non-positive backdrop.aspect (it seeds the layout AND the runway math)", () => {
    const nan = { ...base, backdrop: { ...base.backdrop, aspect: Number.NaN } };
    expect(messagesOf(nan)).toContainEqual(expect.stringContaining("backdrop.aspect"));
    const zero = { ...base, backdrop: { ...base.backdrop, aspect: 0 } };
    expect(messagesOf(zero)).toContainEqual(expect.stringContaining("backdrop.aspect"));
  });

  it("rejects zero/non-finite timeSeconds and bad enemiesToWin/speed", () => {
    const bad = {
      ...base,
      gameplay: { enemiesToWin: 0, timeSeconds: 0, enemySpeedMultiplier: 0, windowWeights: {} },
    };
    const errors = messagesOf(bad);
    expect(errors).toContainEqual(expect.stringContaining("timeSeconds"));
    expect(errors).toContainEqual(expect.stringContaining("enemiesToWin"));
    expect(errors).toContainEqual(expect.stringContaining("enemySpeedMultiplier"));
  });

  it("rejects two placements of one kind that disagree on sizing (last-wins hazard)", () => {
    const twice = {
      ...base,
      props: [prop("fixture:kiosque"), { ...prop("fixture:kiosque"), aspect: 0.9, x: 0.8 }],
    };
    expect(messagesOf(twice)).toContainEqual(expect.stringContaining("disagree"));
  });

  it("accepts two AGREEING placements of one kind at different anchors", () => {
    const twice = {
      ...base,
      props: [prop("fixture:kiosque"), { ...prop("fixture:kiosque"), x: 0.8 }],
    };
    expect(validateLevelPlan(twice)).toEqual([]);
  });
});

/**
 * The MCP `validate` contract (spec-mcp-level-editor §4.1): `validateLevelPlan` speaks the
 * SAME structured `LevelIssue` as `validateLevel` (ADR-0074 §3), so the server composes the
 * two without an ad-hoc wrapper. Every guard carries a stable `plan/…` code — the machine
 * key an agent branches on — while the human `message` is unchanged from the string era.
 *
 * No `plan/mobile-halving` code exists on purpose: the halving keeps a row's index-0 prop,
 * so the "emptied row" it would report is unconstructible (see the note in `levelPlan.ts`).
 */
describe("validateLevelPlan — LevelIssue contract (MCP §4.1)", () => {
  const codesOf = (plan: LevelPlan): readonly string[] =>
    validateLevelPlan(plan).map((i) => i.code);

  it("reports every issue as a well-formed error-severity LevelIssue", () => {
    const bad: LevelPlan = { ...base, archetypes: [{ ...vigile, weight: 3 }] };
    const issues = validateLevelPlan(bad);
    expect(issues.length).toBeGreaterThan(0);
    for (const issue of issues) {
      expect(issue.severity).toBe("error");
      expect(issue.code).toMatch(/^plan\//);
      expect(issue.field.length).toBeGreaterThan(0);
      expect(issue.message.length).toBeGreaterThan(0);
    }
  });

  it("keeps the human message byte-for-byte identical to the string era", () => {
    const bad: LevelPlan = { ...base, archetypes: [{ ...vigile, weight: 3 }] };
    expect(validateLevelPlan(bad)).toContainEqual({
      code: "plan/weight-nonzero",
      severity: "error",
      field: "archetypes[0].weight",
      message: "archetype fixture:vigile: weight must be 0 (activation via windowWeights)",
    });
  });

  it("codes the archetype guards", () => {
    const two: LevelPlan = {
      ...base,
      archetypes: [
        { ...vigile, kind: "fixture:a" },
        { ...vigile, kind: "fixture:b" },
      ],
    };
    expect(codesOf(two)).toContain("plan/archetype-cap");

    const foreign: LevelPlan = { ...base, archetypes: [{ ...vigile, kind: "autre:vigile" }] };
    expect(codesOf(foreign)).toContain("plan/namespace");

    for (const patch of [
      { variants: 0 },
      { hp: 0 },
      { bulletDamage: Number.NaN },
      { hiddenDuration: 0 },
      { visibleDuration: Number.NaN },
      { scoreDelta: Number.NaN },
      { livesDelta: Number.POSITIVE_INFINITY },
      { timeDelta: Number.NaN },
      { aspect: 0 },
    ]) {
      const bad: LevelPlan = { ...base, archetypes: [{ ...vigile, ...patch }] };
      expect(codesOf(bad)).toContain("plan/archetype-bounds");
    }
  });

  it("codes the prop guards", () => {
    const foreign: LevelPlan = {
      ...base,
      props: [{ ...prop("fixture:x"), kind: "autre:kiosque" }],
    };
    expect(codesOf(foreign)).toContain("plan/namespace");

    const incomplete = {
      ...base,
      props: [{ kind: "fixture:kiosque", asset: "a.png", aspect: 0.6, x: 0.2 }],
    } as unknown as LevelPlan;
    expect(codesOf(incomplete)).toContain("plan/sizing");
    expect(validateLevelPlan(incomplete)).toContainEqual(
      expect.objectContaining({ field: "props[0].heightFrac" }),
    );

    const flat: LevelPlan = { ...base, props: [{ ...prop("fixture:kiosque"), aspect: 0 }] };
    expect(codesOf(flat)).toContain("plan/sizing");

    const disagree: LevelPlan = {
      ...base,
      props: [prop("fixture:kiosque"), { ...prop("fixture:kiosque"), aspect: 0.9, x: 0.8 }],
    };
    expect(codesOf(disagree)).toContain("plan/prop-consistency");
  });

  it("codes the backdrop and gameplay bounds", () => {
    const nanAspect: LevelPlan = { ...base, backdrop: { ...base.backdrop, aspect: Number.NaN } };
    expect(validateLevelPlan(nanAspect)).toContainEqual(
      expect.objectContaining({ code: "plan/sizing", field: "backdrop.aspect" }),
    );

    const bad: LevelPlan = {
      ...base,
      gameplay: { enemiesToWin: 0, timeSeconds: 0, enemySpeedMultiplier: 0, windowWeights: {} },
    };
    const fields = validateLevelPlan(bad)
      .filter((i) => i.code === "plan/gameplay-bounds")
      .map((i) => i.field);
    expect(fields).toEqual([
      "gameplay.timeSeconds",
      "gameplay.enemiesToWin",
      "gameplay.enemySpeedMultiplier",
    ]);

    // The unearnable-delivery guard is a bound on the SAME field, hence the same code.
    const short: LevelPlan = { ...base, gameplay: { ...base.gameplay, timeSeconds: 25 } };
    expect(validateLevelPlan(short)).toContainEqual(
      expect.objectContaining({ code: "plan/gameplay-bounds", field: "gameplay.timeSeconds" }),
    );
  });

  it("codes the windowWeights guards", () => {
    const withVigile = { ...base, archetypes: [vigile] };
    const huge: LevelPlan = {
      ...withVigile,
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigile": 200000 } },
    };
    expect(validateLevelPlan(huge)).toContainEqual(
      expect.objectContaining({
        code: "plan/window-weights",
        field: "gameplay.windowWeights.fixture:vigile",
      }),
    );

    const foreign: LevelPlan = {
      ...withVigile,
      gameplay: { ...base.gameplay, windowWeights: { "autre:vigile": 50 } },
    };
    expect(codesOf(foreign)).toContain("plan/namespace");

    const typo: LevelPlan = {
      ...withVigile,
      gameplay: { ...base.gameplay, windowWeights: { "fixture:vigille": 20 } },
    };
    expect(codesOf(typo)).toContain("plan/window-weights");

    const softlock: LevelPlan = {
      ...base,
      archetypes: [{ ...vigile, countsAsTarget: false }],
      gameplay: {
        ...base.gameplay,
        windowWeights: { normal: 0, riot: 0, biker: 0, "fixture:vigile": 20 },
      },
    };
    expect(validateLevelPlan(softlock)).toContainEqual(
      expect.objectContaining({
        code: "plan/window-weights",
        field: "gameplay.windowWeights",
      }),
    );
  });
});

/**
 * `validateCatalogue` is the SINGLE source of the id-uniqueness rule (ADR-0077 D6,
 * sign-off condition C2): the same invariant that used to live as a bare `throw` in
 * `generated/index.ts`'s module body, now expressed as `LevelIssue`s so the MCP
 * `validate`/`scaffold` tools can REPORT a collision instead of dying on it. The
 * bootstrap wrapper (`registerGeneratedLevels`) is the only surface that still throws.
 */
describe("validateCatalogue (id uniqueness, MCP §4.1)", () => {
  const other: LevelPlan = { ...base, id: "other" };

  it("accepts a catalogue of distinct ids", () => {
    expect(validateCatalogue([base, other])).toEqual([]);
    expect(validateCatalogue([])).toEqual([]);
  });

  it("reports a duplicate id as one plan/duplicate-id issue naming the id", () => {
    const issues = validateCatalogue([base, other, base]);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      code: "plan/duplicate-id",
      severity: "error",
      field: "plans[2].id",
      // The split-brain sentence of ADR-0075 §6, kept verbatim: LEVEL_ART is
      // last-wins while ALL_LEVELS.find is first-wins.
      message: 'generated level "fixture" is declared twice — ids must be unique',
    });
  });

  it("reports one issue per extra copy, not one per colliding pair", () => {
    expect(validateCatalogue([base, base, base]).map((i) => i.field)).toEqual([
      "plans[1].id",
      "plans[2].id",
    ]);
  });
});
