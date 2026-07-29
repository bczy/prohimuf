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
import {
  installBossCaptureSeam,
  isBossSeamShippedLevel,
  resolveBossPreviewLevel,
} from "./bossHarness";
import { installDeliveryCaptureSeam, resolveDeliveryPreviewLevel } from "./deliveryHarness";
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
import { loadUnlockedLevels, unlockLevel, LEVELS, FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import {
  saveScore,
  isHighScore,
  loadPlayerName,
  savePlayerName,
} from "@game/systems/highScoreSystem";
import type { LevelParams } from "@game/systems/stateMachine";
import { DIFFICULTY_CONFIG } from "@game/levels/levels";
import {
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
} from "@game/systems/narrativeSystem";

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

// Preview harness hook: `?preview=title|menu|narrative|end|nameentry|tutorial` boots
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

const INITIAL_LEVEL: LevelConfig = BOSS_HARNESS_PREVIEW
  ? resolveBossPreviewLevel(BOSS_PREVIEW_SEARCH)
  : DELIVERY_HARNESS_PREVIEW
    ? resolveDeliveryPreviewLevel(DELIVERY_PREVIEW_SEARCH)
    : FIRST_PLAYABLE_LEVEL;
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

// Mobile mode is decided once at app load from the user agent (ADR-0003);
// it never flips mid-session — devtools emulation needs a refresh.
const IS_MOBILE = detectMobile();

// Device-forked tutorial script (ADR-0015): same once-at-load decision as IS_MOBILE.
const TUTORIAL_SCENE = IS_MOBILE ? TUTORIAL_NARRATIVE_MOBILE : TUTORIAL_NARRATIVE_DESKTOP;

// Stable empty manifest: reused when a target needs no warming (preview bypass or
// already-loaded) so `useAssetPreloader`'s `paths` identity doesn't churn.
const NO_PATHS: readonly string[] = [];

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

function buildLevelParams(level: LevelConfig, prefs: Prefs): LevelParams {
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
  };
}

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>(
    BOSS_HARNESS_PREVIEW || DELIVERY_HARNESS_PREVIEW
      ? "PLAYING"
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
  // Held when a run qualifies for the board; the single deferred saveScore reads it on
  // NAME_ENTRY resolution (ADR-0054 §2). `null` = nothing pending (non-high-score path).
  const [pendingScore, setPendingScore] = useState<PendingScore | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudio();
  const isPortrait = useOrientation();
  const rotateBlocked = IS_MOBILE && isPortrait;

  // Red vignette flash whenever a life is lost (shot, or shooting a civilian).
  const prevLivesRef = useRef(hudData.lives);
  const [lifeFlash, setLifeFlash] = useState(0);
  useEffect(() => {
    if (hudData.lives < prevLivesRef.current) setLifeFlash((k) => k + 1);
    prevLivesRef.current = hudData.lives;
  }, [hudData.lives]);

  const { playBgm, stopBgm, setTension } = audio;

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

    // M1 (ADR-0054 §2): when the run qualifies for the board, DEFER the single saveScore
    // to NAME_ENTRY resolution so the player's byline can be attached; otherwise save now,
    // silently and anonymously, byte-identical to before. The next-level unlock below is
    // UNAFFECTED either way — it fires on today's schedule, never gated behind typing a name.
    const qualifies = isShippedLevel && isHighScore(selectedLevel.id, hudData.score);

    if (isShippedLevel) {
      const dateStr = new Date().toISOString();
      if (qualifies) {
        setPendingScore({ score: hudData.score, wave: hudData.wave, date: dateStr });
      } else {
        saveScore(selectedLevel.id, { score: hudData.score, wave: hudData.wave, date: dateStr });
      }

      // Next-level unlock: pure decision (ADR-0059 §D4, AC3/AC4). Fires ONLY on a win —
      // a shipped level reaching GAME_OVER (lives/timer death, or a boss LOST once
      // Belliard's boss flips on) returns null here, so a failable shipped ending never
      // unlocks the next level. Retry stays available; the write is still idempotent.
      const unlockId = nextLevelToUnlock(hudData.phase, selectedLevel.id);
      if (unlockId !== null && !unlockedLevels.has(unlockId)) {
        unlockLevel(unlockId);
        setUnlockedLevels(loadUnlockedLevels());
      }
    }

    const timer = setTimeout(() => {
      if (
        hudData.phase === "LEVEL_COMPLETE" &&
        POST_LEVEL_NARRATIVE[selectedLevel.id] !== undefined
      ) {
        // NARRATIVE_POST is told first; its onDone routes on to NAME_ENTRY when qualifying.
        setAppPhase("NARRATIVE_POST");
      } else if (qualifies) {
        setAppPhase("NAME_ENTRY");
      } else {
        setAppPhase("END");
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [hudData.phase, hudData.score, hudData.wave, selectedLevel.id, unlockedLevels]);

  // Prefetch the R3F/Three.js chunk as soon as the player reaches the MENU so
  // the dynamic import is already cached when "Play" is clicked (ADR-0068).
  useEffect(() => {
    if (appPhase === "MENU") {
      void import("./PlayingCanvas");
    }
  }, [appPhase]);

  function handlePlay(levelId: string): void {
    const level = LEVELS.find((l) => l.id === levelId) ?? FIRST_PLAYABLE_LEVEL;
    // Scripted onboarding stage (ADR-0012, D3): no game state, no `setSelectedLevel`
    // (keeps `selectedLevel` playable so the audio-tension divisor never sees a
    // `timeSeconds: 0` and pushes NaN into tension). Finish or skip → MENU.
    if (level.kind === "tutorial") {
      setAppPhase("TUTORIAL");
      return;
    }
    setSelectedLevel(level);
    setHudData(buildHudInitial(level, prefs));
    setGameKey((k) => k + 1);
    if (PRE_LEVEL_NARRATIVE[levelId] !== undefined) {
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
        ? "tutorial"
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
    const label =
      target === "menu" ? "MENU" : target === "tutorial" ? "Tutoriel" : selectedLevel.name;
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
            setAppPhase(pendingScore !== null ? "NAME_ENTRY" : "END");
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
        scene={TUTORIAL_SCENE}
        showSkipButton
        onDone={handleBackToMenu}
        doneLabel="TERMINER"
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
        score={hudData.score}
        wave={hudData.wave}
        onRestart={handleBackToMenu}
      />,
      rotateBlocked,
    );
  }

  const levelParams = buildLevelParams(selectedLevel, prefs);

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
