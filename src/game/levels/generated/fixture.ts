import type { LevelPlan } from "@game/levels/levelPlan";

/**
 * FIXTURE level — hand-written, with NOT A SINGLE asset. It exists only to prove
 * the schema holds end to end (spec-level-harness-sp1 §8): its enemy falls back
 * to `enemy_sprite`, its prop has no PNG so it never shows, and its backdrop
 * image is absent so `LevelBackdrop` falls back to flat colours. Do not generate
 * art for it, and do not add it to the shipped campaign.
 */
export const plan: LevelPlan = {
  id: "fixture",
  fiction: {
    name: "Fixture",
    label: "Level de vérification, hors fiction",
    district: "Test",
    year: "1998",
  },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [
    {
      kind: "fixture:vigile",
      hp: 2,
      bulletDamage: 0.5,
      hiddenDuration: 1.6,
      visibleDuration: 3.0,
      shoots: true,
      scoreDelta: 2,
      livesDelta: 0,
      timeDelta: 0,
      countsAsTarget: true,
      // Mandatory (§4.2): activation goes through this level's windowWeights only.
      weight: 0,
      spriteBase: "enemy_fixture_vigile",
      variants: 1,
      tint: "#ffffff",
      aspect: 1,
    },
  ],
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
  ],
  gameplay: {
    enemiesToWin: 5,
    timeSeconds: 60,
    enemySpeedMultiplier: 1,
    windowWeights: { "fixture:vigile": 20 },
  },
  // Point de départ de calibration (SP2 §2.3) — valeurs plausibles pour un
  // street-wide standard, jamais consommées par align-windows pour ce level
  // sans asset (documenté ci-dessus : "Do not generate art for it").
  calibration: { windowBand: { top: 0.12, bottom: 0.5 }, expectedCols: 7 },
};
