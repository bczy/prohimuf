import { describe, it, expect } from "vitest";
import { LEVELS, BOSS_QTE_DEV_HARNESS_LEVEL } from "@game/levels/levels";
import { PRE_LEVEL_NARRATIVE, POST_LEVEL_NARRATIVE } from "@game/systems/narrativeSystem";
import { createBossQte, tickBossQte, BOSS_PARRY_POINT } from "@game/systems/bossQteSystem";
import type { LevelConfig } from "@game/levels/levels";
import type { BossQteSpec } from "@game/types/bossQte";

/**
 * STORY-BOSS-NIVEAU-FINAL-LIVE / ADR-0053 — the "le Commandant" boss ships LIVE on one canon,
 * progression-gated Niveau Final level (l'Éden, 31 déc 1999). This suite asserts the DATA the
 * dev-gameplay lane authors into the FROZEN ADR-0051/0052 shape: the level pacing, the mutual
 * exclusion + real-quota ACs, the value-for-value copy of the tuned boss combat block, and the
 * K-5 seed-winnability of the re-pinned seed with the full differentiated kit. No system logic
 * is exercised here beyond driving the (untouched) boss QTE forward.
 */

const NIVEAU_FINAL = LEVELS.find((l) => l.id === "niveau-final");

function requireLevel(): LevelConfig {
  if (NIVEAU_FINAL === undefined) throw new Error("niveau-final level is not in LEVELS");
  return NIVEAU_FINAL;
}

function requireBossSpec(): BossQteSpec {
  const spec = requireLevel().bossQteSpec;
  if (spec === undefined) throw new Error("niveau-final authors no bossQteSpec");
  return spec;
}

describe("niveau-final level authoring (ADR-0053 D2/D4)", () => {
  it("is appended to LEVELS as the last playable level, after vitry", () => {
    const level = requireLevel();
    const playable = LEVELS.filter((l) => l.kind !== "tutorial");
    // Placement drives the index-based unlock hop (App.tsx LEVELS[shippedIdx+1]) — no new code.
    expect(playable[playable.length - 1]?.id).toBe("niveau-final");
    const ids = playable.map((l) => l.id);
    expect(ids.indexOf("niveau-final")).toBe(ids.indexOf("vitry") + 1);
    // Starts locked — unlocked by clearing Vitry via the existing index hop.
    expect(level.unlocked).toBe(false);
  });

  it("AC1: authors a boss but NO hostageQte (mutual exclusion by construction)", () => {
    const level = requireLevel();
    expect(level.bossQteSpec).toBeDefined();
    expect(level.hostageQte).toBeUndefined();
  });

  it("AC1: the window roster keeps civilian/hostage_taker out of the pool", () => {
    // The override merges over defaults; civilian/hostage_taker are NOT overridden, so they
    // keep their default weight 0 and never spawn — no hostage anything on this level.
    const roster = requireLevel().roster;
    expect(roster?.windowWeights).toEqual({ normal: 40, riot: 28, biker: 20, bonus: 10 });
    expect(roster?.windowWeights?.civilian).toBeUndefined();
    expect(roster?.windowWeights?.hostage_taker).toBeUndefined();
  });

  it("AC4: the quota is a REAL non-zero gallery, not the harness instant-trigger", () => {
    // enemiesToWin 16 !== 0: the boss fires on the real quota crossing (a finale, not an ambush),
    // unlike BOSS_QTE_DEV_HARNESS_LEVEL's enemiesToWin 0 instant-trigger.
    const level = requireLevel();
    expect(level.enemiesToWin).toBe(16);
    expect(level.enemiesToWin).not.toBe(0);
    expect(BOSS_QTE_DEV_HARNESS_LEVEL.enemiesToWin).toBe(0);
  });

  it("carries the monotonic-hardest pre-boss pacing (spec §1)", () => {
    const level = requireLevel();
    expect(level.enemySpeedMultiplier).toBe(1.8);
    expect(level.timeSeconds).toBe(70);
    const vitry = LEVELS.find((l) => l.id === "vitry");
    // Monotonic vs Vitry on every axis: speed up, quota up, timer not looser.
    expect(level.enemySpeedMultiplier).toBeGreaterThan(vitry?.enemySpeedMultiplier ?? 0);
    expect(level.enemiesToWin).toBeGreaterThan(vitry?.enemiesToWin ?? 0);
    expect(level.timeSeconds).toBeLessThanOrEqual(vitry?.timeSeconds ?? Infinity);
  });

  it("holds one truck delivery ≈ Vitry (integrity 60 / window 6 / bonus 300)", () => {
    const deliveries = requireLevel().deliveries;
    expect(deliveries).toHaveLength(1);
    const d = deliveries[0];
    expect(d?.vehicleType).toBe("truck");
    expect(d?.integrity).toBe(60);
    expect(d?.windowSeconds).toBe(6);
    expect(d?.bonus).toBe(300);
    expect(d?.triggerAtElapsedSeconds).toBe(18);
    expect(d?.stopPosition.y).toBeLessThan(0);
  });

  it("AC5: bossQteSpec is a value-for-value copy of the harness combat block, seed + décor aside", () => {
    // The tuned combat values ship UNCHANGED from BOSS_QTE_DEV_HARNESS_LEVEL — only targetSeed
    // (K-5 re-pin) and decorProp (chandelier re-site) are re-authored, exactly what AC5 permits.
    const spec = requireBossSpec();
    const harness = BOSS_QTE_DEV_HARNESS_LEVEL.bossQteSpec;
    if (harness === undefined) throw new Error("harness has no bossQteSpec");
    expect(spec.zoomSeconds).toBe(harness.zoomSeconds);
    expect(spec.phaseCount).toBe(harness.phaseCount);
    expect(spec.bossHp).toBe(harness.bossHp);
    expect(spec.maxBlownWindows).toBe(harness.maxBlownWindows);
    expect(spec.anchor).toEqual({ x: 0, y: -5 });
    // The two re-authorings — distinct from the harness by design. Seed re-pinned at K-5 leg-2
    // (19991231 → 19991232: the NYE seed clustered the vital waypoints centre → camp-dominant).
    expect(spec.targetSeed).toBe(19991232);
    expect(spec.targetSeed).not.toBe(harness.targetSeed);
    expect(spec.decorProp).toEqual({ position: { x: 0.2, y: 1.5 }, armPhaseIndex: 1 });
    expect(spec.decorProp).not.toEqual(harness.decorProp);
  });
});

describe("niveau-final narrative wiring (flags A/B — tests A2/A5)", () => {
  it("A1: adds the niveau-final key to BOTH pre and post maps", () => {
    expect(PRE_LEVEL_NARRATIVE["niveau-final"]).toBeDefined();
    expect(POST_LEVEL_NARRATIVE["niveau-final"]).toBeDefined();
  });

  it("A2: the scene ids follow the <key>_pre / _post convention", () => {
    expect(PRE_LEVEL_NARRATIVE["niveau-final"]?.id).toBe("niveau-final_pre");
    expect(POST_LEVEL_NARRATIVE["niveau-final"]?.id).toBe("niveau-final_post");
  });

  it("A5: both scenes carry the l'Éden facade backdrop (ADR-0023)", () => {
    const backdrop = "assets/levels/niveau-final/facade.png";
    expect(PRE_LEVEL_NARRATIVE["niveau-final"]?.backdrop).toBe(backdrop);
    expect(POST_LEVEL_NARRATIVE["niveau-final"]?.backdrop).toBe(backdrop);
  });

  it("wires the gated final_pre/final_post scripts VERBATIM (reveal beats intact)", () => {
    const pre = PRE_LEVEL_NARRATIVE["niveau-final"];
    const post = POST_LEVEL_NARRATIVE["niveau-final"];
    // Length bounds from the gated scripts (8 pre / 6 post).
    expect(pre?.lines).toHaveLength(8);
    expect(post?.lines).toHaveLength(6);
    // The one-shot reveal — the name spoken once, by MUF over the rider sprite (final_pre #4).
    // "Imageless" in the fiction means no COMMANDANT embodiment yet — the reveal is spent on the
    // words, not a placeholder boss sprite; the MUF rider image is the speaker's own, as gated.
    expect(pre?.lines[3]).toMatchObject({
      speaker: "MUF",
      text: "...le Commandant.",
      image: "assets/courier/rider.png",
    });
    // No boss/commander sprite appears anywhere in the briefing (the reveal stays imageless of him).
    for (const line of pre?.lines ?? []) {
      expect(line.image ?? "").not.toContain("commander");
      expect(line.image ?? "").not.toContain("boss");
    }
    // The downbeat — the boss's fall stated flat (final_post #3).
    expect(post?.lines[2]?.text).toBe("À terre. Ses hommes l'ont pas vu tomber.");
    // The finisher cue diegetically present in the briefing (final_pre #8).
    expect(pre?.lines[7]?.text).toContain("Livre le son");
    // l'Éden is NOT named in dialogue (gate ruling Q1 = NO).
    for (const line of [...(pre?.lines ?? []), ...(post?.lines ?? [])]) {
      expect(line.text).not.toContain("Éden");
    }
  });
});

/**
 * K-5 seed-winnability (spec §2.3 / AC-L5). Drive the FROZEN boss QTE with a "competent player"
 * policy on the re-pinned seed, with the full ADR-0052 kit (two rings + parry + décor) live via
 * the authored spec: fire whenever the reticle sits on a scoring ring while EXPOSED, and parry
 * every charged window. The pinned seed must present landable windows/parries in each phase so
 * the player clears 24 HP before the blown-window clock (maxBlownWindows 10) trips.
 */
function competentClears(spec: BossQteSpec): { won: boolean; lost: boolean; blown: number } {
  let qte = tickBossQte(createBossQte(spec), false, { x: 0, y: 0 }, spec.zoomSeconds).qte;
  for (let i = 0; i < 60 * 120; i++) {
    const canAct =
      qte.stance === "EXPOSED" && qte.phaseBreakRemaining <= 0 && qte.staggerRemaining <= 0;
    const parry = canAct && qte.chargedWindow;
    const onRing = canAct && !qte.chargedWindow && qte.ringZone !== "off";
    const fire = parry || onRing || qte.phase === "FINISHER";
    const impact = parry
      ? { x: qte.anchor.x + BOSS_PARRY_POINT.x, y: qte.anchor.y + BOSS_PARRY_POINT.y }
      : { x: qte.anchor.x + qte.targetOffset.x, y: qte.anchor.y + qte.targetOffset.y };
    qte = tickBossQte(qte, fire, impact, 1 / 60).qte;
    if (qte.phase === "WON") return { won: true, lost: false, blown: qte.blownWindows };
    if (qte.phase === "LOST") return { won: false, lost: true, blown: qte.blownWindows };
  }
  return { won: false, lost: false, blown: qte.blownWindows };
}

describe("niveau-final seed winnability (K-5 discipline, targetSeed 19991232)", () => {
  it("a competent player clears 24 HP before the blown-window clock trips on the pinned seed", () => {
    const spec = requireBossSpec();
    const result = competentClears(spec);
    // If this fails, the seed is NOT winnable with the differentiated kit — re-pin
    // (19991232 + n) per the K-5 discipline and update levels.ts + this expectation.
    expect(result.lost).toBe(false);
    expect(result.won).toBe(true);
    expect(result.blown).toBeLessThan(spec.maxBlownWindows);
  });
});
