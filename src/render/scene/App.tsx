import { lazy, Suspense, useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { MainMenu } from "@render/ui/MainMenu";
import { TitleScreen } from "@render/ui/TitleScreen";
import { EndScreen } from "@render/ui/EndScreen";
import { NameEntryScreen } from "@render/ui/NameEntryScreen";
import { NarrativeScreen } from "@render/ui/NarrativeScreen";
import { PauseScreen } from "@render/ui/PauseScreen";
import { RotateOverlay } from "@render/ui/RotateOverlay";
import { FullscreenButton } from "@render/ui/FullscreenButton";
import { LoadingScreen } from "@render/ui/LoadingScreen";
import { PortraitRobotPhase } from "@render/ui/portrait/PortraitRobotPhase";
import { SCREEN_TITLE } from "@render/ui/portrait/copy";
import {
  installBossCaptureSeam,
  isBossSeamShippedLevel,
  resolveBossPreviewLevel,
} from "./bossHarness";
import { installDeliveryCaptureSeam, resolveDeliveryPreviewLevel } from "./deliveryHarness";
import { resolveGeneratedPreviewLevel } from "./generatedHarness";
import { resolvePortraitSeed } from "./portraitHarness";
import { nextLevelToUnlock } from "./levelProgress";
import { useReducedMotionRoot } from "@render/ui/print";
import { warm } from "./warmAssets";
import styles from "./App.module.css";

import { useAudio } from "@hooks/useAudio";
import { useAssetPreloader } from "@hooks/useAssetPreloader";
import { useOrientation } from "@hooks/useOrientation";
import { manifestFor } from "@game/systems/assetManifest";
import type { ManifestTarget } from "@game/systems/assetManifest";
import { detectMobile } from "@utils/platform";
import { loadPrefs, savePrefs } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { loadUnlockedLevels, unlockLevel } from "@game/systems/progressSystem";
import { LEVELS, ALL_LEVELS, FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import {
  saveScore,
  isHighScore,
  loadPlayerName,
  savePlayerName,
} from "@game/systems/highScoreSystem";
import type { LevelParams } from "@game/systems/stateMachine";
import type { LevelModifier } from "@game/types/levelModifier";
import type { PortraitOutcome } from "@game/types/portraitRobot";
import { PORTRAIT_TIMER_SECONDS } from "@game/systems/portraitRobotSystem";
import { portraitCatalogueIsPlayable } from "@hooks/usePortraitRobot";
import { DIFFICULTY_CONFIG } from "@game/levels/levels";
import {
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
  PORTRAIT_ROBOT_NARRATIVE,
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
} from "@game/systems/narrativeSystem";
import type { NarrativeScene } from "@game/systems/narrativeSystem";
import { milestonesFromRun } from "@game/systems/runFunnelSystem";
import type { FunnelState, RunSummary } from "@game/types/runStats";
import { loadFunnel, recordMilestones } from "@hooks/runFunnelStorage";

// Lazy-loaded R3F/Three.js chunk (ADR-0068): Canvas + GameScene only reach the
// network when the player is about to enter PLAYING. Prefetch fires on MENU entry
// so the chunk is already cached when "Play" is clicked.
const PlayingCanvas = lazy(() => import("./PlayingCanvas"));

type AppPhase =
  | "TITLE"
  | "MENU"
  | "NARRATIVE_PRE"
  | "PLAYING"
  | "NARRATIVE_POST"
  | "PORTRAIT_ROBOT"
  | "NAME_ENTRY"
  | "END"
  | "TUTORIAL";

// The deferred high-score save (M1, ADR-0054 §2): the `{score, wave, date}` triple is
// held while NAME_ENTRY collects the byline, then written exactly once on resolution.
interface PendingScore {
  readonly score: number;
  readonly wave: number;
  readonly date: string;
}

// Preview harness hook: `?preview=title|menu|narrative|end|nameentry|tutorial|portrait` boots
// straight into a screen so the screenshot tool can capture the front-end screens
// without playing.
const PREVIEW_SCREEN =
  typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview") : null;

// Boss QTE harness reachability seam (ADR-0051 D4): `?preview=boss` boots straight into
// the NON-SHIPPED `BOSS_QTE_DEV_HARNESS_LEVEL` so engineering (and Bertrand, on a branch
// preview) can iterate "le Commandant" without shipping it. No `LEVELS`/menu path exists
// to it, so no player reaches the required gate ("Belliard live contract untouched") —
// same protection as the other `?preview=` screens above, which are equally reachable on
// production builds. Bertrand explicitly asked for this to work on the branch-preview
// build (2026-07-19), so this is intentionally NOT `import.meta.env.DEV`-gated.
const BOSS_HARNESS_PREVIEW = PREVIEW_SCREEN === "boss";
// `?preview=boss` boots the non-shipped harness by default; `&level=<id>` (C-QA3) boots a shipped
// level (niveau-final) so the boss renders over its real backdrop. Resolved view-side from the URL.
const BOSS_PREVIEW_SEARCH = typeof window !== "undefined" ? window.location.search : "";

// Delivery-assault capture seam (harness-only, non-shipped): `?preview=delivery&at=
// incoming|delivering` boots straight into a SHIPPED level (belliard by default, or
// `&level=<id>` naming another delivery-bearing level) with the vehicle already
// fast-forwarded to that phase — see `deliveryHarness.ts` for why this can't precompute
// a state the way the boss seam does. Every delivery-bearing level is already shipped,
// so persistence stays inert via the generic `PREVIEW_SCREEN !== null` guard alone (no
// second `BOSS_SEAM_SHIPPED_LEVEL`-style guard needed — there is no non-shipped variant).
const DELIVERY_HARNESS_PREVIEW = PREVIEW_SCREEN === "delivery";
const DELIVERY_PREVIEW_SEARCH = typeof window !== "undefined" ? window.location.search : "";

// Generated-level verification seam (spec-level-harness-sp1 §8): `?preview=level&
// level=<generated id>` boots PLAYING on a harness-generated level — which is
// deliberately absent from the menu (`LEVELS` is the shipped campaign, ADR-0075 §6),
// so no menu path can reach it. The resolver is restricted to generated configs
// (a shipped id yields null → normal boot), the same reachability discipline as
// `?preview=boss`; persistence stays inert via the `PREVIEW_SCREEN !== null` guard.
const GENERATED_PREVIEW_LEVEL: LevelConfig | null =
  PREVIEW_SCREEN === "level" ? resolveGeneratedPreviewLevel(BOSS_PREVIEW_SEARCH) : null;
const GENERATED_HARNESS_PREVIEW = GENERATED_PREVIEW_LEVEL !== null;

const INITIAL_LEVEL: LevelConfig = BOSS_HARNESS_PREVIEW
  ? resolveBossPreviewLevel(BOSS_PREVIEW_SEARCH)
  : DELIVERY_HARNESS_PREVIEW
    ? resolveDeliveryPreviewLevel(DELIVERY_PREVIEW_SEARCH)
    : (GENERATED_PREVIEW_LEVEL ?? FIRST_PLAYABLE_LEVEL);
// True when the seam booted a SHIPPED level (niveau-final IS in LEVELS, unlike the harness). Folded
// into the persistence guard below so a seam-booted shipped level NEVER writes muf_scores_*/
// muf_progress — belt-and-suspenders behind the `PREVIEW_SCREEN !== null` early-return.
const BOSS_SEAM_SHIPPED_LEVEL = isBossSeamShippedLevel(BOSS_PREVIEW_SEARCH);

// Boss QTE capture seam (harness-only, non-shipped): `?preview=boss&at=phase2|phase3|finisher`
// (optionally `&blownImmune=1`) installs a view-side fast-forward factory that `useGameLoop`
// consumes to boot the boss already advanced to that state — so a ~2 fps SwiftShader sandbox
// can screenshot the depletion-gated ADR-0052 differentiation reads (qa-lead C-QA2). It
// no-ops unless `?preview=boss` is present, so it shares `?preview=boss`'s reachability
// discipline exactly (shipped players never reach it). `&level=<id>` (C-QA3) points the boot at a
// SHIPPED level's real bossQteSpec (niveau-final over l'Éden) instead of the harness; persistence
// stays inert via the `PREVIEW_SCREEN !== null` guard + `BOSS_SEAM_SHIPPED_LEVEL`. See `bossHarness.ts`.
installBossCaptureSeam();
installDeliveryCaptureSeam();

// Portrait-robot capture seam — `?preview=portrait` (see `portraitHarness.ts`), the house
// convention every other screen already has. It boots straight into the interstitial phase
// so the screenshot tool, the screen reviews and the "entry board is 0/4" check do not cost
// a full playthrough.
const PORTRAIT_HARNESS_PREVIEW = PREVIEW_SCREEN === "portrait";
// Seed (ADR-0079 D3): supplied BY THE SHELL and frozen for the session, so a board is
// replayable with `?portraitSeed=<n>` — the determinism proof `qa-lead` runs in the built
// app, and it composes with the preview (`?preview=portrait&portraitSeed=42`). The pure
// layer holds no `Math.random`; drawing the seed is the shell's job, and this is the one
// place it happens.
// Drawn ONCE PER PHASE ENTRY, not once per module load: computed at load, two runs in
// the same tab replayed the identical board, which contradicts the whole draw (panel
// run-1 minor). `?portraitSeed=` still pins it, so the determinism proof is unchanged.
function drawPortraitSeed(): number {
  return resolvePortraitSeed(
    typeof window !== "undefined" ? window.location.search : "",
    PORTRAIT_HARNESS_PREVIEW,
    () => Math.floor(Math.random() * 0x7fffffff),
  );
}

// Mobile mode is decided once at app load from the user agent (ADR-0003);
// it never flips mid-session — devtools emulation needs a refresh.
const IS_MOBILE = detectMobile();

// Device-forked tutorial (ADR-0015): the render layer owns the device decision, so it picks the
// fork ONCE — the script it will DRAW and the manifest target it will PRELOAD come out of a single
// `IS_MOBILE` read and travel together. `manifestFor` takes a widened `ManifestTarget`, so a second
// ternary drifting to the other fork would type-check and silently make a mobile player download
// the desktop-only `edge-scroll` panel's 5.7 MB street bitmap it never draws. `manifestTarget` is
// annotated to the two literals (NOT `ManifestTarget`, whose `(string & {})` arm swallows typos).
const TUTORIAL_FORK: {
  readonly scene: NarrativeScene;
  readonly manifestTarget: "tutorial-desktop" | "tutorial-mobile";
} = IS_MOBILE
  ? { scene: TUTORIAL_NARRATIVE_MOBILE, manifestTarget: "tutorial-mobile" }
  : { scene: TUTORIAL_NARRATIVE_DESKTOP, manifestTarget: "tutorial-desktop" };

// Stable empty manifest: reused when a target needs no warming (preview bypass or
// already-loaded) so `useAssetPreloader`'s `paths` identity doesn't churn.
const NO_PATHS: readonly string[] = [];

// `?preview=end` boots straight into the end screen with NO run behind it (the
// hudData above is seeded GAME_OVER / 4200 / wave 3 by hand), so the screenshot
// harness needs a run summary to render — one value per branch of the screen: a
// crate ratio, the long H2 string (the R2 worst case, minus its 100 %), a fault
// share on the damage line. Harness fixture, and the type-total fallback at the
// END call site: a real run always carries its own summary (the terminal HUD push
// derives it), so this value is never what a player sees.
const PREVIEW_END_SUMMARY: RunSummary = {
  score: 4200,
  durationSeconds: 68.4,
  wave: 3,
  endCause: "SANTE",
  pickups: { collected: 3, spawned: 4 },
  delivery: { issue: "INTERROMPUE", integrityPct: 78 },
  heartsLost: { total: 1.5, damage: 0.5, faults: 1, max: 3 },
};

// The rotate overlay covers every app phase, menus included (ADR-0003).
// The fullscreen button (ADR-0008) is always appended; it self-hides when
// element fullscreen is unsupported.
function renderAppShell(content: JSX.Element, rotateBlocked: boolean): JSX.Element {
  return (
    <>
      {content}
      {rotateBlocked && <RotateOverlay />}
      <FullscreenButton />
    </>
  );
}

function buildHudInitial(level: LevelConfig, prefs: Prefs): HudData {
  return {
    score: 0,
    lives: prefs.lives,
    timeRemaining: level.timeSeconds,
    phase: "PLAYING",
    wave: 1,
    // Energy init 100 (ADR-0030 D5), mirrors createInitialState.
    energy: 100,
    // Every level starts on the base weapon at ∞ stock (ADR-0055 D1), mirrors
    // createInitialState; the first loop tick then keeps `weapon` live.
    weapon: { active: "base", stock: Number.POSITIVE_INFINITY },
    weaponEmptyNonce: 0,
  };
}

function buildLevelParams(
  level: LevelConfig,
  prefs: Prefs,
  modifier: LevelModifier | null,
): LevelParams {
  const diffCfg = DIFFICULTY_CONFIG[prefs.difficulty];
  return {
    lives: prefs.lives,
    timeSeconds: level.timeSeconds,
    enemiesToWin: level.enemiesToWin,
    enemySpeedMultiplier: level.enemySpeedMultiplier * diffCfg.enemySpeedMult,
    // MVP authors exactly one scripted delivery per level; seed reads deliveries[0].
    delivery: level.deliveries[0] ?? null,
    // Scripted hostage-taker QTE for this level (ADR-0030), if authored.
    hostageQte: level.hostageQte ?? null,
    // Scripted boss QTE for this level (ADR-0051). Absent ⇒ `null` (byte-identical); the
    // non-shipped dev-harness authors one for iteration, and since ADR-0053 the SHIPPED
    // `niveau-final` level authors the live canon encounter too.
    bossQte: level.bossQteSpec ?? null,
    // Per-level armament crates (ADR-0055 D8). Absent on a level ⇒ `null` ⇒ no crates
    // spawn and the weapon stays base/∞ (byte-identical to ADR-0040). Belliard-first.
    loot: level.loot ?? null,
    // The interstitial scene's only residue (ADR-0079 D4). Absent ⇒ byte-identical
    // to a run without any interstitial scene; the shell CARRIES this value and
    // never interprets it — no `switch` on the outcome exists on this side.
    modifier,
  };
}

/**
 * Is the portrait-robot catalogue fit to open a scene on? (ADR-0080 D3, panel B4a.)
 *
 * Memoised because the answer cannot change within a session and the validator runs a
 * 1000-seed sweep: asking once per run is free, asking per render is not.
 */
let portraitCataloguePlayable: boolean | null = null;
function portraitPhaseAvailable(): boolean {
  portraitCataloguePlayable ??= portraitCatalogueIsPlayable();
  return portraitCataloguePlayable;
}

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>(
    BOSS_HARNESS_PREVIEW || DELIVERY_HARNESS_PREVIEW || GENERATED_HARNESS_PREVIEW
      ? "PLAYING"
      : PORTRAIT_HARNESS_PREVIEW
        ? "PORTRAIT_ROBOT"
        : PREVIEW_SCREEN === "narrative"
          ? "NARRATIVE_PRE"
          : PREVIEW_SCREEN === "end"
            ? "END"
            : PREVIEW_SCREEN === "nameentry"
              ? "NAME_ENTRY"
              : PREVIEW_SCREEN === "tutorial"
                ? "TUTORIAL"
                : PREVIEW_SCREEN === "menu"
                  ? "MENU"
                  : // Cold load (no ?preview) and ?preview=title both boot the TITLE cover.
                    "TITLE",
  );
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  // The ONE shared derived reduced-motion signal (ADR-0054 §3): unions
  // prefs.reducedMotion with the live OS query, mirrors it onto the document root as
  // data-reduced-motion (base.css's second --motion-* zeroing trigger), and returns
  // the effective value for the JS consumer that can't read CSS vars (CrtPass).
  const reducedMotion = useReducedMotionRoot(prefs.reducedMotion);
  const [unlockedLevels, setUnlockedLevels] = useState<ReadonlySet<string>>(loadUnlockedLevels);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(() => INITIAL_LEVEL);
  const [hudData, setHudData] = useState<HudData>(() => {
    const initial = buildHudInitial(INITIAL_LEVEL, loadPrefs());
    return PREVIEW_SCREEN === "end" || PREVIEW_SCREEN === "nameentry"
      ? { ...initial, phase: "GAME_OVER", score: 4200, wave: 3 }
      : initial;
  });
  const [gameKey, setGameKey] = useState(0);
  // Idempotence guard for the end-of-run persistence block below: holds the
  // `gameKey` of the run whose side-effects (score, unlock, funnel milestones)
  // already fired. The terminal HUD push is NOT a one-shot — the loop keeps
  // ticking after `GAME_OVER`/`LEVEL_COMPLETE` (its early-return needs a RESTART
  // input, not a terminal phase), so a later push carrying the same frozen
  // numbers can re-enter this effect. Armed per run, so a restart (`gameKey + 1`)
  // re-opens the block exactly once (review-panel finding A, PR run-stats).
  const persistedRunRef = useRef<number | null>(null);
  // The 4-milestone funnel (ADR-0076 D4). Read once at boot; every write goes
  // through `recordMilestones`, which OR-merges and hands back the new state.
  // Purely internal in v1 — it is rendered NOWHERE (UX §4, gate T1); its only
  // consumer is the "copier mon rapport" payload.
  const [funnel, setFunnel] = useState<FunnelState>(loadFunnel);
  // Held when a run qualifies for the board; the single deferred saveScore reads it on
  // NAME_ENTRY resolution (ADR-0054 §2). `null` = nothing pending (non-high-score path).
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  // The portrait-robot verdict travelling to the NEXT level (ADR-0079 D4). Produced by
  // `levelModifierFromPortrait` in the pure layer, carried here as an opaque value, spent
  // exactly once at the next `createInitialState`. The shell reads two PRE-COMPUTED fields
  // off it — `narrativeBeat` (which scene the next level owes, picked by key) and
  // `scoreDelta` (handed to `settleRunScore`) — and derives NEITHER: ADR-0079 A5 forbids
  // mapping an outcome to a number here, not reading a number the pure layer already
  // wrote. No `switch` on `outcome` exists on this side, and that is the invariant.
  const [pendingModifier, setPendingModifier] = useState<LevelModifier | null>(null);
  const [runModifier, setRunModifier] = useState<LevelModifier | null>(null);
  // One portrait-robot per run (gate A3). Armed on the run identity, like the persistence block.
  const portraitPlayedRef = useRef<number | null>(null);
  // The seed of the scene currently being played, drawn at phase entry.
  const [portraitSeed, setPortraitSeed] = useState<number>(drawPortraitSeed);
  // The obligatory pre-level beat the portrait-robot verdict owes the NEXT level
  // (ADR-0079 D5, gate A1b, story AC6). Armed when the run's modifier is spent, played
  // once at that level's NARRATIVE_PRE, then cleared. `null` ⇒ nothing owed.
  const [pendingBeat, setPendingBeat] = useState<PortraitOutcome | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudio();
  const isPortrait = useOrientation();
  const rotateBlocked = IS_MOBILE && isPortrait;

  // What `settleRunScore` decided, for the routing timer below. A ref and not state:
  // the 1500 ms timer reads it when it fires, and a re-render in between must not
  // re-arm the effect.
  const qualifiedRef = useRef(false);
  // The `gameKey` of the run whose score has ALREADY been written or deferred. Distinct
  // from `persistedRunRef` on purpose: since the settlement moved to the exit of the
  // portrait phase, "the run's side-effects fired" and "the run's score is settled" are
  // two different instants, and collapsing them is what let the score be lost (below).
  const scoreSettledRef = useRef<number | null>(null);

  /**
   * Settle the run's score — the ONE place a run's final total is decided (ADR-0054 §2,
   * hand-off §6.2). `scoreDelta` is the interstitial scene's contribution, `0` on every
   * path that has no scene. Returns whether the total qualifies for the board.
   *
   * `canDeferByline` is `false` on the ONE path that has no future: the tab is going
   * away (`pagehide`). A deferred `pendingScore` is a promise to write at NAME_ENTRY,
   * and there is no NAME_ENTRY after the document unloads — so that path writes the
   * entry now, anonymously, rather than qualifying it into oblivion.
   *
   * Idempotent per run: whichever of the two paths gets there first settles, the other
   * is a no-op. `saveScore` de-duplicates nothing, so this guard is what keeps a single
   * run from landing twice on the board.
   */
  const settleRunScore = useCallback(
    (scoreDelta: number, canDeferByline = true): boolean => {
      const isShipped =
        LEVELS.findIndex((l) => l.id === selectedLevel.id) !== -1 && !BOSS_SEAM_SHIPPED_LEVEL;
      if (!isShipped) {
        qualifiedRef.current = false;
        return false;
      }
      if (scoreSettledRef.current === gameKey) return qualifiedRef.current;
      scoreSettledRef.current = gameKey;
      const score = hudData.score + scoreDelta;
      const qualifies = isHighScore(selectedLevel.id, score);
      const date = new Date().toISOString();
      // M1: a qualifying run DEFERS its single write to NAME_ENTRY so the byline can be
      // attached; anything else is written now, silently and anonymously.
      if (qualifies && canDeferByline) setPendingScore({ score, wave: hudData.wave, date });
      else saveScore(selectedLevel.id, { score, wave: hudData.wave, date });
      qualifiedRef.current = qualifies && canDeferByline;
      return qualifiedRef.current;
    },
    [hudData.score, hudData.wave, selectedLevel.id, gameKey],
  );

  /**
   * Will a portrait-robot scene still be played on this run? ONE predicate, read by the
   * score-settlement effect and by the two hand-overs that route into the phase.
   *
   * It deliberately does NOT test `POST_LEVEL_NARRATIVE`. The scene used to be reachable
   * only through the post-level cutscene, which made a copy table a silent on/off switch
   * for the feature — it was simply absent on `niveau-final` and on every generated level,
   * with nothing in the code saying so (panel run-1, undeclared dependency). The cutscene
   * is now a step on the way, not the door.
   */
  function portraitReachable(levelId: string): boolean {
    return (
      PREVIEW_SCREEN === null &&
      portraitPlayedRef.current !== gameKey &&
      LEVELS.findIndex((l) => l.id === levelId) !== -1 &&
      !BOSS_SEAM_SHIPPED_LEVEL &&
      portraitPhaseAvailable()
    );
  }

  /**
   * The window the deferred settlement opened, closed (panel run-2 MAJEUR).
   *
   * Since the score is settled at the EXIT of the portrait phase (so a 1500-point
   * `IDENTIFIED` can qualify for the board), a player who closes the tab or reloads
   * during the scene's 30–56 s spent a run that is never written anywhere — while the
   * next-level unlock, fired at `LEVEL_COMPLETE`, WAS written. Save state then says
   * "level cleared" and the board says the run never happened.
   *
   * The chosen fix is a flush at `pagehide`, not a provisional write at
   * `LEVEL_COMPLETE`: `saveScore` appends and de-duplicates nothing, so a provisional
   * entry completed later means two rows for one run, and "arm `persistedRunRef` only
   * once settled" would have left the unlock/funnel writes racing on a second guard
   * without closing the loss window at all. This closes exactly the window that opened
   * and leaves the nominal path byte-identical: one write, at the exit, with the
   * scene's `scoreDelta`.
   *
   * `event.persisted` discriminates a real teardown from a bfcache freeze — a frozen
   * page can come back and finish the scene, and settling it would rob the player of
   * the portrait's points. If it comes back anyway, `scoreSettledRef` keeps the run to
   * one entry.
   */
  useEffect(() => {
    if (PREVIEW_SCREEN !== null || appPhase !== "PORTRAIT_ROBOT") return;
    const flush = (event: PageTransitionEvent): void => {
      if (event.persisted) return;
      // No byline can be collected from a document that is unloading, so the entry is
      // written now and anonymously — exactly what the pre-deferral behaviour did.
      settleRunScore(0, false);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
    };
  }, [appPhase, settleRunScore]);

  // Red vignette flash whenever a life is lost (shot, or shooting a civilian).
  const prevLivesRef = useRef(hudData.lives);
  const [lifeFlash, setLifeFlash] = useState(0);
  useEffect(() => {
    if (hudData.lives < prevLivesRef.current) setLifeFlash((k) => k + 1);
    prevLivesRef.current = hudData.lives;
  }, [hudData.lives]);

  const { playBgm, stopBgm, setTension } = audio;

  // Funnel milestone 1 — the cover was seen. A navigation event, not a run event,
  // so it is written here and never from the pure loop. Inert under `?preview=`
  // like every other persistence side-effect on this screen.
  useEffect(() => {
    if (PREVIEW_SCREEN !== null || appPhase !== "TITLE") return;
    setFunnel(recordMilestones(["titleSeen"]));
  }, [appPhase]);

  // Escape toggles pause — only during active gameplay
  useEffect(() => {
    if (appPhase !== "PLAYING") return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setPaused((p) => !p);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [appPhase]);

  // Escape backs the MENU out to the TITLE cover — only while on the menu
  useEffect(() => {
    if (appPhase !== "MENU") return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setAppPhase("TITLE");
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [appPhase]);

  // Reset pause when leaving PLAYING phase
  useEffect(() => {
    if (appPhase !== "PLAYING") setPaused(false);
  }, [appPhase]);

  useEffect(() => {
    if (appPhase === "PLAYING" && !paused && !rotateBlocked) {
      playBgm();
    } else {
      stopBgm();
    }
  }, [appPhase, paused, rotateBlocked, playBgm, stopBgm]);

  useEffect(() => {
    if (hudData.phase === "GAME_OVER") {
      stopBgm();
    }
  }, [hudData.phase, stopBgm]);

  useEffect(() => {
    const tension = 1 - hudData.timeRemaining / selectedLevel.timeSeconds;
    setTension(tension);
  }, [hudData.timeRemaining, selectedLevel.timeSeconds, setTension]);

  useEffect(() => {
    // Preview harness (`?preview=`) boots straight into a screen; this persistence/
    // routing effect must be FULLY INERT there. `?preview=end` / `?preview=nameentry`
    // seed a GAME_OVER hudData (score 4200) on FIRST_PLAYABLE_LEVEL, so without this
    // guard the effect would run for real: on a fresh board `isHighScore` is true, so
    // the 1500ms timer would drift the phase to NAME_ENTRY (the screenshot tool would
    // capture the WRONG screen for `09_end.png`), and SIGNER/PASSER would write a fake
    // 4200 entry into the visitor's real `muf_scores_*`. Early-returning before any
    // saveScore/setPendingScore/unlock/phase-routing keeps every `?preview=` screen
    // deterministic (`pendingScore` stays null → the NameEntry handlers no-op on storage).
    if (PREVIEW_SCREEN !== null) return;
    if (hudData.phase !== "GAME_OVER" && hudData.phase !== "LEVEL_COMPLETE") return;
    // This effect acts on the run that is still ON SCREEN, and the terminal HUD push
    // always lands while `appPhase === "PLAYING"`. Once it has routed away, the phase
    // it routed to owns its own exit, and re-arming the 1500 ms timer from here is a
    // trapdoor: a re-execution after `portraitPlayedRef.current === gameKey` is set
    // makes `portraitAhead` false, and the `else` branch below would tear the player
    // out of the portrait scene into END with the score never settled. Not reachable
    // today (the canvas is unmounted, so no further HUD push exists) — which is
    // precisely why nothing was stopping it (panel run-2 minor 3).
    if (appPhase !== "PLAYING") return;

    // Persistence side-effects (high-score board, next-level unlock) are scoped to
    // SHIPPED levels only. `BOSS_QTE_DEV_HARNESS_LEVEL` is deliberately EXCLUDED from
    // `LEVELS` (ADR-0051 D4, "Belliard live contract untouched"), so `?preview=boss` must
    // stay fully inert — no write to `muf_scores_*` or `muf_progress`. Because that seam is
    // now reachable on branch-preview builds (commit 9a49edf), guarding on
    // membership-in-`LEVELS` — not just `findIndex !== -1` for the unlock hop — keeps any
    // player finishing the duel from corrupting their own save (review-panel finding, PR #112).
    // A boss-capture-seam session that booted a SHIPPED level (C-QA3: niveau-final over l'Éden)
    // must NOT persist — niveau-final IS in `LEVELS`, so the membership check alone would let it
    // write. `BOSS_SEAM_SHIPPED_LEVEL` forces it non-shipped here (redundant with the
    // `PREVIEW_SCREEN !== null` early-return above, kept as an independent second guard).
    const shippedIdx = LEVELS.findIndex((l) => l.id === selectedLevel.id);
    const isShippedLevel = shippedIdx !== -1 && !BOSS_SEAM_SHIPPED_LEVEL;

    // WILL a portrait-robot scene still be played on this run? (hand-off §6.2.)
    // It decides WHEN the run's score is settled, so it must be computed here, from the
    // same three conditions the NARRATIVE_POST hand-over uses — one predicate, two call
    // sites, so the two can never disagree about whether points are still coming.
    const portraitAhead = hudData.phase === "LEVEL_COMPLETE" && portraitReachable(selectedLevel.id);

    // ONE pass per run: the persistence block is armed on the run identity, never
    // on the HUD push that revealed the terminal phase. Without it, a second
    // terminal push (a stale delivery-arrow diff, a fresh `unlockedLevels` Set)
    // wrote the score twice — `saveScore` de-duplicates nothing.
    if (isShippedLevel && persistedRunRef.current !== gameKey) {
      persistedRunRef.current = gameKey;

      // THE SCORE IS SETTLED LAST (architect's arbitration, hand-off §6.2). When a
      // portrait-robot is still ahead, the run is not over: its `scoreDelta` (up to
      // 1500) is part of the final score, and qualifying for the board must be decided
      // on that total. Settling here would have made an `IDENTIFIED` worth nothing on
      // the board — a high-score bug. `settleRunScore` runs at the exit of the phase
      // instead; on every other path it runs now, with a delta of 0, byte-identically
      // to before.
      if (!portraitAhead) settleRunScore(0);

      // Next-level unlock: pure decision (ADR-0059 §D4, AC3/AC4). Fires ONLY on a win —
      // a shipped level reaching GAME_OVER (lives/timer death, or a boss LOST once
      // Belliard's boss flips on) returns null here, so a failable shipped ending never
      // unlocks the next level. Retry stays available; the write is still idempotent.
      const unlockId = nextLevelToUnlock(hudData.phase, selectedLevel.id);
      if (unlockId !== null && !unlockedLevels.has(unlockId)) {
        unlockLevel(unlockId);
        setUnlockedLevels(loadUnlockedLevels());
      }

      // Funnel milestones 3/4 — read off the finished run, never chained (D4.3):
      // clearing Belliard without ever seeing a delivery locks 4 and leaves 3
      // alone. Scoped to shipped levels like the two writes above, and idempotent,
      // so this effect re-running costs one identical rewrite.
      const summary = hudData.runSummary;
      if (summary !== undefined) {
        setFunnel(recordMilestones(milestonesFromRun(summary, selectedLevel.id)));
      }
    }

    const timer = setTimeout(() => {
      if (
        hudData.phase === "LEVEL_COMPLETE" &&
        POST_LEVEL_NARRATIVE[selectedLevel.id] !== undefined
      ) {
        // NARRATIVE_POST is told first; its onDone routes on to the portrait, or on to
        // NAME_ENTRY when the score qualifies.
        setAppPhase("NARRATIVE_POST");
      } else if (portraitAhead) {
        // No post-level cutscene on this level — the scene is reached directly rather
        // than being silently skipped (see `portraitReachable`).
        portraitPlayedRef.current = gameKey;
        setPortraitSeed(drawPortraitSeed());
        setAppPhase("PORTRAIT_ROBOT");
      } else {
        // Not a portrait path, so `settleRunScore` already ran above and `pendingScore`
        // holds its verdict — read it through the setter's own value rather than a
        // second `isHighScore` call, so the board is consulted exactly once per run.
        setAppPhase(qualifiedRef.current ? "NAME_ENTRY" : "END");
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
    // Deps are STABLE-VALUED on purpose: `hudData.runSummary` (a fresh object on
    // every terminal push) and `unlockedLevels` (a fresh Set after the unlock
    // write) are read inside but kept OUT — either one re-running this effect
    // tears down the 1500 ms routing timer and re-enters the persistence block.
    // `gameKey` is the run identity the guard above is armed on. `appPhase` is in
    // because the effect must STOP once it has routed — see the guard at the top.
  }, [hudData.phase, hudData.score, hudData.wave, selectedLevel.id, gameKey, appPhase]);

  // Prefetch the R3F/Three.js chunk as soon as the player reaches the MENU so
  // the dynamic import is already cached when "Play" is clicked (ADR-0068).
  useEffect(() => {
    if (appPhase === "MENU") {
      void import("./PlayingCanvas");
    }
  }, [appPhase]);

  function handlePlay(levelId: string): void {
    // ALL_LEVELS, not LEVELS: the menu only ever passes shipped ids (identical
    // resolution — shipped levels are the list's head), but a generated id
    // invoked directly must resolve to ITS level, not silently substitute
    // belliard (panel run-2 MAJEUR on PR #149).
    const level = ALL_LEVELS.find((l) => l.id === levelId) ?? FIRST_PLAYABLE_LEVEL;
    // Scripted onboarding stage (ADR-0012, D3): no game state, no `setSelectedLevel`
    // (keeps `selectedLevel` playable so the audio-tension divisor never sees a
    // `timeSeconds: 0` and pushes NaN into tension). Finish or skip → MENU.
    if (level.kind === "tutorial") {
      setAppPhase("TUTORIAL");
      return;
    }
    setSelectedLevel(level);
    // Spent exactly ONCE: the pending verdict becomes this run's modifier and the pending
    // slot empties, so a restart or a second level never re-applies a scene played earlier.
    setRunModifier(pendingModifier);
    setPendingModifier(null);
    // AC6 / gate A1b: the verdict OWES the next level a scene, and the shell picks it BY
    // KEY — it never branches on what the verdict means (ADR-0079 A5). Without this the
    // player lost 20 energy and nothing on screen ever said why: `narrativeBeat` was
    // produced and had no consumer at all (panel B3).
    const beat = pendingModifier?.narrativeBeat ?? null;
    setPendingBeat(beat);
    setHudData(buildHudInitial(level, prefs));
    setGameKey((k) => k + 1);
    // A level with no pre-level cutscene still owes the beat — routing on the copy table
    // alone is how the portrait's own reachability got silently disabled (see
    // `portraitReachable`), and the beat must not inherit that bug.
    if (beat !== null || PRE_LEVEL_NARRATIVE[levelId] !== undefined) {
      setAppPhase("NARRATIVE_PRE");
    } else {
      setAppPhase("PLAYING");
    }
  }

  const handleSavePrefs = useCallback((updated: Prefs): void => {
    savePrefs(updated);
    setPrefs(updated);
  }, []);

  function handleBackToMenu(): void {
    setPaused(false);
    setAppPhase("MENU");
  }

  // NAME_ENTRY resolution — the ONE deferred write to `muf_scores_<id>` (ADR-0054 §2).
  // Submit attaches the byline (and persists it as the last-used name); the pure layer
  // sanitises + omits an empty name, so an empty submit is byte-identical to a skip.
  const handleNameSubmit = useCallback(
    (name: string): void => {
      if (pendingScore !== null) {
        saveScore(selectedLevel.id, { ...pendingScore, name });
        savePlayerName(name);
        setPendingScore(null);
      }
      setAppPhase("END");
    },
    [pendingScore, selectedLevel.id],
  );

  const handleNameSkip = useCallback((): void => {
    if (pendingScore !== null) {
      saveScore(selectedLevel.id, pendingScore);
      setPendingScore(null);
    }
    setAppPhase("END");
  }, [pendingScore, selectedLevel.id]);

  // Asset-preload gate (story-asset-preloading). Warm the module caches for the
  // screen about to render and hold a LoadingScreen until its manifest is 100%
  // settled — killing the untextured-square pop-in. On the TITLE cover we warm
  // the "menu" target in the background so the title→menu step is seamless; the
  // cover itself is never gated (it renders immediately, below). A level's assets
  // warm at selection (target = selectedLevel.id), and the same target covers
  // NARRATIVE_PRE + PLAYING (+ END) so the gate is shown at most once per level
  // per session. END is never gated on its own: by the time it shows, its level
  // target is already in loadedTargets. These hooks run unconditionally, ahead of
  // every early return below (Rules of Hooks).
  const target: ManifestTarget =
    appPhase === "MENU" || appPhase === "TITLE"
      ? "menu"
      : appPhase === "TUTORIAL"
        ? TUTORIAL_FORK.manifestTarget
        : // The 24 sliced band PNGs (ADR-0080). Gated on the phase itself rather than
          // warmed behind NARRATIVE_POST: one preloader, one target at a time, and the
          // scene must never open on half its bands — an untextured band would read as
          // a variant, i.e. as information, on a screen whose whole subject is what a
          // band looks like.
          appPhase === "PORTRAIT_ROBOT"
          ? "portrait-robot"
          : selectedLevel.id;
  // Targets warmed this session — a target skips its manifest once settled so
  // revisiting it (or advancing TITLE→MENU→level→END) never re-shows the loader.
  const loadedTargets = useRef<Set<string>>(new Set());
  // Memoised per target so the array identity is stable across renders (the hook
  // restarts on identity change). The ?preview= harness bypasses warming to keep
  // its boot behaviour byte-for-byte.
  const paths = useMemo<readonly string[]>(
    () =>
      PREVIEW_SCREEN !== null || loadedTargets.current.has(target) ? NO_PATHS : manifestFor(target),
    [target],
  );
  const { loaded, total, done } = useAssetPreloader(paths, warm);
  useEffect(() => {
    if (done) loadedTargets.current.add(target);
  }, [done, target]);

  // The TITLE cover shows immediately (cold load / ?preview=title); the menu
  // manifest warms behind it via the gate above.
  if (appPhase === "TITLE") {
    return renderAppShell(
      <TitleScreen
        onEnter={() => {
          setAppPhase("MENU");
        }}
      />,
      rotateBlocked,
    );
  }

  if (!done) {
    // Keyed off the SAME constant the target is built from above, never a re-typed
    // `"tutorial"` literal: with the target now device-forked, a hardcoded string would miss
    // on one device and silently fall through to `selectedLevel.name` (a level name on the
    // tutorial loader).
    const label =
      target === "menu"
        ? "MENU"
        : target === TUTORIAL_FORK.manifestTarget
          ? "Tutoriel"
          : target === "portrait-robot"
            ? SCREEN_TITLE
            : selectedLevel.name;
    return renderAppShell(
      <LoadingScreen label={label} progress={total ? loaded / total : 1} />,
      rotateBlocked,
    );
  }

  if (appPhase === "MENU") {
    return renderAppShell(
      <MainMenu
        unlockedLevels={unlockedLevels}
        prefs={prefs}
        onPlay={handlePlay}
        onSavePrefs={handleSavePrefs}
      />,
      rotateBlocked,
    );
  }

  if (appPhase === "NARRATIVE_PRE" && pendingBeat !== null) {
    // The portrait-robot recall, played BEFORE the level's own briefing (ADR-0079 D5).
    return renderAppShell(
      <NarrativeScreen
        scene={PORTRAIT_ROBOT_NARRATIVE[pendingBeat]}
        showSkipButton
        onDone={() => {
          setPendingBeat(null);
          if (PRE_LEVEL_NARRATIVE[selectedLevel.id] === undefined) setAppPhase("PLAYING");
        }}
        onSkip={() => {
          setPendingBeat(null);
          if (PRE_LEVEL_NARRATIVE[selectedLevel.id] === undefined) setAppPhase("PLAYING");
        }}
      />,
      rotateBlocked,
    );
  }

  if (appPhase === "NARRATIVE_PRE") {
    const scene = PRE_LEVEL_NARRATIVE[selectedLevel.id];
    if (scene !== undefined) {
      return renderAppShell(
        <NarrativeScreen
          scene={scene}
          showSkipButton
          onDone={() => {
            setAppPhase("PLAYING");
          }}
        />,
        rotateBlocked,
      );
    }
  }

  if (appPhase === "NARRATIVE_POST") {
    const scene = POST_LEVEL_NARRATIVE[selectedLevel.id];
    if (scene !== undefined) {
      return renderAppShell(
        <NarrativeScreen
          scene={scene}
          onDone={() => {
            // Interstitial insertion point (gate A2): LEVEL_COMPLETE → NARRATIVE_POST →
            // PORTRAIT_ROBOT → the rest. Once per run, and never INSERTED on a `?preview=`
            // boot — that guard stands: a `?preview=narrative` capture must not drift into
            // another screen. `?preview=portrait` does not need it lifted, because it does
            // not insert the phase, it BOOTS in it (see the initial `appPhase` above).
            if (portraitReachable(selectedLevel.id)) {
              portraitPlayedRef.current = gameKey;
              // The seed is drawn HERE, at phase entry — not once per module load, which
              // gave two runs in the same tab the same board (panel run-1 minor).
              setPortraitSeed(drawPortraitSeed());
              setAppPhase("PORTRAIT_ROBOT");
              return;
            }
            setAppPhase(qualifiedRef.current ? "NAME_ENTRY" : "END");
          }}
        />,
        rotateBlocked,
      );
    }
  }

  if (appPhase === "TUTORIAL") {
    // Optional, scripted, informative-only onboarding (ADR-0012, D3; device-forked
    // per ADR-0015). Finish AND skip both return to MENU; nothing is written to
    // muf_progress or high scores.
    return renderAppShell(
      <NarrativeScreen
        scene={TUTORIAL_FORK.scene}
        showSkipButton
        onDone={() => {
          // Funnel milestone 2 — the tutorial was CLEARED, i.e. read to the end.
          // Skipping routes through `onSkip` below and locks nothing: a milestone
          // that fires on the skip button would make the funnel lie.
          if (PREVIEW_SCREEN === null) setFunnel(recordMilestones(["tutorialCleared"]));
          handleBackToMenu();
        }}
        onSkip={handleBackToMenu}
        doneLabel="TERMINER"
      />,
      rotateBlocked,
    );
  }

  if (appPhase === "PORTRAIT_ROBOT") {
    // A DOM screen: no Canvas, no Three, no CRT (ADR-0079 D1). The chrono pauses behind
    // the rotate overlay by simply not being folded (gate A7).
    return renderAppShell(
      <PortraitRobotPhase
        seed={portraitSeed}
        timerSeconds={PORTRAIT_TIMER_SECONDS[prefs.difficulty]}
        isMobile={IS_MOBILE}
        paused={rotateBlocked}
        reducedMotion={reducedMotion}
        onDone={(modifier) => {
          setPendingModifier(modifier);
          // On a `?preview=portrait` boot there is no run behind the scene and no next
          // level to spend the modifier on: we STAY on the resolved screen. Routing to
          // END would show a run summary of a run nobody played, and re-entering the
          // phase would loop the capture — a preview that loops is worse than none. The
          // verdict tableau is also exactly what `lead-art` and `ux-designer` need to
          // photograph, so staying is the useful behaviour, not just the safe one.
          if (PORTRAIT_HARNESS_PREVIEW) return;
          // THE RUN ENDS HERE, and so does its score. `scoreDelta` settles the scene
          // that just played (hand-off §6.2), so the board is consulted on the total —
          // a 1500-point IDENTIFIED can qualify, which is the whole finding B1.
          setAppPhase(settleRunScore(modifier.scoreDelta) ? "NAME_ENTRY" : "END");
        }}
      />,
      rotateBlocked,
    );
  }

  if (appPhase === "NAME_ENTRY") {
    // Reached only on a qualifying high score (ADR-0054 §2). Save is deferred to
    // handleNameSubmit/handleNameSkip; the unlock side-effect already fired above.
    return renderAppShell(
      <NameEntryScreen
        score={hudData.score}
        wave={hudData.wave}
        initialName={loadPlayerName()}
        onSubmit={handleNameSubmit}
        onSkip={handleNameSkip}
      />,
      rotateBlocked,
    );
  }

  if (appPhase === "END") {
    const endPhase =
      hudData.phase === "GAME_OVER" || hudData.phase === "LEVEL_COMPLETE"
        ? hudData.phase
        : "GAME_OVER";
    return renderAppShell(
      <EndScreen
        phase={endPhase}
        summary={hudData.runSummary ?? PREVIEW_END_SUMMARY}
        funnel={funnel}
        levelId={selectedLevel.id}
        onRestart={handleBackToMenu}
      />,
      rotateBlocked,
    );
  }

  const levelParams = buildLevelParams(selectedLevel, prefs, runModifier);

  return renderAppShell(
    <div
      className={styles.gameRoot}
      style={{
        cursor: paused ? "default" : "none",
        // Keeps two-finger taps from becoming browser pinch/double-tap zoom.
        touchAction: IS_MOBILE ? "none" : "auto",
      }}
    >
      {/* Lazy-loaded R3F chunk (ADR-0068): Three.js + Canvas + GameScene.
          The outer Suspense shows a LoadingScreen while the JS chunk fetches;
          the inner one (inside PlayingCanvas) handles Three.js texture streaming. */}
      <Suspense fallback={<LoadingScreen label={selectedLevel.name} progress={0} />}>
        <PlayingCanvas
          canvasRef={canvasRef}
          gameKey={gameKey}
          lifeFlash={lifeFlash}
          onHudUpdate={(data) => {
            setHudData((prev) => ({
              ...data,
              levelName: selectedLevel.name,
              isHighScore: isHighScore(selectedLevel.id, data.score),
              // Delivery / QTE state arrive on separate channels; keep across refreshes.
              delivery: prev.delivery,
              hostageQte: prev.hostageQte,
              bossQte: prev.bossQte,
            }));
          }}
          onDelivery={(delivery) => {
            setHudData((prev) => ({ ...prev, delivery }));
          }}
          onHostageQte={(hostageQte) => {
            setHudData((prev) => ({ ...prev, hostageQte: hostageQte ?? undefined }));
          }}
          onBossQte={(bossQte) => {
            setHudData((prev) => ({ ...prev, bossQte: bossQte ?? undefined }));
          }}
          playSfx={audio.playSfx}
          levelParams={levelParams}
          levelId={selectedLevel.id}
          paused={paused || rotateBlocked}
          isMobile={IS_MOBILE}
          crt={prefs.crt}
          vhs={prefs.vhs}
          reducedMotion={reducedMotion}
        />
      </Suspense>
      <HUD data={hudData} />
      {paused && !rotateBlocked && (
        <PauseScreen
          prefs={prefs}
          onResume={() => {
            setPaused(false);
          }}
          onMenu={handleBackToMenu}
          onSavePrefs={handleSavePrefs}
        />
      )}
    </div>,
    rotateBlocked,
  );
}
