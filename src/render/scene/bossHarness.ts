import type { BossQte, BossQteSpec } from "@game/types/bossQte";
import type { Vec2 } from "@game/types/vector";
import { BOSS_PARRY_POINT, createBossQte, tickBossQte } from "@game/systems/bossQteSystem";
import { BOSS_QTE_DEV_HARNESS_LEVEL, LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";

/**
 * Boss QTE capture seam (harness-only, NON-shipped) — ADR-0051 D4 / ADR-0005 discipline.
 *
 * The depletion-gated ADR-0052 differentiation reads (phase-2 dual rings, the parry
 * telegraph, the phase-3 smoke veil, the renfort edge, the décor-armed glow, the FINISHER
 * and the HP-bar zero-settle) are UNREACHABLE in the CI sandbox: headless SwiftShader runs
 * ~2 fps, so the blown-window LOSS clock trips before enough chips land to cross the first
 * HP threshold (qa-lead shard §10, hole C-QA2). This module lets a headless run BOOT the
 * boss already advanced to a target phase, so those reads become e2e-screenshottable.
 *
 * It is VIEW-SIDE ONLY and touches NO game rule: the advanced state is CONSTRUCTED by
 * driving the EXISTING pure API (`createBossQte` + a deterministic `tickBossQte`
 * fast-forward loop with scripted inputs), then handed to `useGameLoop` as the initial
 * `bossQte` via the `window.__MUF_BOSS_BOOT__` factory it consumes. Reachability is the
 * SAME as `?preview=boss`: the factory is installed only under `?preview=boss&at=…`, so no
 * shipped player (no `?preview=boss`) can ever reach it, and `useGameLoop` additionally
 * gates the boot on `bossQteSpec !== null` — true only on the excluded-from-`LEVELS`
 * dev-harness level. The LEVELS-exclusion and persistence-inertness guards in `App.tsx`
 * are untouched and keep holding.
 */

/** The advance target: `phase1`/`phase2`/`phase3` = the first EXPOSED window of 0-based phaseIndex
 *  0/1/2; `finisher` = the ceremonial FINISHER beat (bossHp 0). `phase1` exists so a SHIPPED level
 *  whose real kill quota gates the boss (niveau-final, C-QA3) is capturable at the single-ring
 *  opening — unreachable in-sandbox otherwise (the harness reaches it only via its instant trigger). */
export type BossHarnessTarget = "phase1" | "phase2" | "phase3" | "finisher";

interface BossHarnessWindow extends Window {
  /** Render-installed factory: build a fresh fast-forwarded boss for the boot / re-seed. */
  __MUF_BOSS_BOOT__?: () => BossQte;
  /** When true, `useGameLoop` re-seeds the boss on the blown-window LOSS so an unattended
   *  capture stays pinned at its target phase (harness-only). */
  __MUF_BOSS_IMMUNE__?: boolean;
}

// Fixed-step fast-forward. `FF_DT` is the nominal 60 fps frame; `FF_MAX_TICKS` is a safety
// bound the loop always terminates well before (a full 24-HP depletion with scripted
// perfect fire is a few hundred ticks — the pinned seed is winnable, qa-lead K-5).
const FF_DT = 1 / 60;
const FF_MAX_TICKS = 200_000;

/** True once the fast-forward has driven the boss to its target beat. Phase targets land on the
 *  FIRST EXPOSED window of the wanted phase (a readable single/dual-ring frame, not the SHIELDED
 *  lull), so the scripted loop stops before chipping that window. */
function targetReached(qte: BossQte, target: BossHarnessTarget): boolean {
  if (target === "finisher") return qte.phase === "FINISHER";
  const wantPhaseIndex = target === "phase1" ? 0 : target === "phase2" ? 1 : 2;
  return qte.phase === "ACTIVE" && qte.stance === "EXPOSED" && qte.phaseIndex >= wantPhaseIndex;
}

/**
 * The scripted input for this fast-forward tick: fire on the live ring / parry point during a
 * readable EXPOSED window so every chip lands, idle otherwise (zoom, lull, break, stagger).
 * Phase 2+ ring A is the fixed-identity VITAL ring, so a shot at `targetOffset` always chips;
 * a CHARGED window is answered on `BOSS_PARRY_POINT`. Reads only the CURRENT snapshot — the
 * same fields `tickBossQte` resolves `fire` against — so no window is ever blown.
 */
function scriptedShot(qte: BossQte): { fire: boolean; impact: Vec2 } {
  const idle = { fire: false, impact: { x: 0, y: 0 } };
  if (qte.phase !== "ACTIVE") return idle;
  if (qte.stance !== "EXPOSED") return idle;
  if (qte.phaseBreakRemaining > 0 || qte.staggerRemaining > 0) return idle;
  const point = qte.chargedWindow ? BOSS_PARRY_POINT : qte.targetOffset;
  return { fire: true, impact: { x: qte.anchor.x + point.x, y: qte.anchor.y + point.y } };
}

/**
 * Construct a boss QTE already advanced to `target`, purely by driving the pure API. Starts
 * from a fresh `createBossQte(spec)` and applies the scripted fast-forward loop until the
 * target beat is reached. Deterministic (seeded-pure — the same seed + the same scripted
 * inputs), side-effect-free, and byte-for-byte inside `bossQteSystem`'s own logic.
 */
export function fastForwardBossQte(spec: BossQteSpec, target: BossHarnessTarget): BossQte {
  let qte = createBossQte(spec);
  for (let i = 0; i < FF_MAX_TICKS && !targetReached(qte, target); i++) {
    const { fire, impact } = scriptedShot(qte);
    qte = tickBossQte(qte, fire, impact, FF_DT).qte;
  }
  return qte;
}

/** Parse the `at=` capture param to a target, or `null` for any other/absent value. */
export function parseBossHarnessTarget(raw: string | null): BossHarnessTarget | null {
  return raw === "phase1" || raw === "phase2" || raw === "phase3" || raw === "finisher"
    ? raw
    : null;
}

/**
 * Which level `?preview=boss` boots (C-QA3). DEFAULT = the non-shipped dev harness (belliard
 * backdrop). With `&level=<id>` naming a LEVELS level that AUTHORS a `bossQteSpec` (e.g.
 * `niveau-final` — its real spec, seed 19991231, chandelier décor), boots THAT level so the boss
 * renders over its real backdrop + anchor. Any other/absent `level` ⇒ the harness. PURE (search
 * string in, LevelConfig out) — testable, no `window`. Callers gate reachability on `preview=boss`
 * separately; this only picks the level.
 */
export function resolveBossPreviewLevel(search: string): LevelConfig {
  const id = new URLSearchParams(search).get("level");
  if (id !== null) {
    const lvl = LEVELS.find((l) => l.id === id);
    if (lvl?.bossQteSpec !== undefined) return lvl;
  }
  return BOSS_QTE_DEV_HARNESS_LEVEL;
}

/**
 * True when the boss capture seam targets a SHIPPED (in-`LEVELS`) level — i.e. `?preview=boss&
 * level=<id>` where `<id>` is a real level authoring a `bossQteSpec` (C-QA3: `niveau-final`).
 * `App` folds this into its persistence guard so a seam-booted SHIPPED level is treated as
 * non-shipped for score/unlock writes — belt-and-suspenders BEHIND the `?preview=` early-return
 * (the seam boots a level that IS in LEVELS, unlike the harness, so the LEVELS-membership guard
 * alone would let it persist). `false` for the harness and off the `?preview=boss` path.
 */
export function isBossSeamShippedLevel(search: string): boolean {
  const params = new URLSearchParams(search);
  if (params.get("preview") !== "boss") return false;
  const level = resolveBossPreviewLevel(search);
  return level.id !== BOSS_QTE_DEV_HARNESS_LEVEL.id;
}

/**
 * Install the capture seam from the URL query, gated on the SAME reachability as
 * `?preview=boss`: it no-ops unless `preview=boss` AND `at=` names a valid target. When it
 * does install, `useGameLoop` picks up `__MUF_BOSS_BOOT__` for the initial boss state (and,
 * under `blownImmune=1`, re-seeds on the blown-window LOSS). Called once at `App` module
 * load; never runs on a shipped path (no `?preview=boss` ⇒ no install).
 */
export function installBossCaptureSeam(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("preview") !== "boss") return;
  const target = parseBossHarnessTarget(params.get("at"));
  if (target === null) return;
  // Default harness, or the `&level=<id>` shipped level (C-QA3 — niveau-final over l'Éden).
  const spec = resolveBossPreviewLevel(window.location.search).bossQteSpec;
  if (spec === undefined) return;
  const w = window as BossHarnessWindow;
  w.__MUF_BOSS_BOOT__ = () => fastForwardBossQte(spec, target);
  if (params.get("blownImmune") === "1") w.__MUF_BOSS_IMMUNE__ = true;
}
