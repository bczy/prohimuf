import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { MainMenu } from "@render/ui/MainMenu";
import { TitleScreen } from "@render/ui/TitleScreen";
import { EndScreen } from "@render/ui/EndScreen";
import { NarrativeScreen } from "@render/ui/NarrativeScreen";
import { PauseScreen } from "@render/ui/PauseScreen";
import { RotateOverlay } from "@render/ui/RotateOverlay";
import { FullscreenButton } from "@render/ui/FullscreenButton";
import { LoadingScreen } from "@render/ui/LoadingScreen";
import { GameScene } from "./GameScene";
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
import { saveScore, isHighScore } from "@game/systems/highScoreSystem";
import type { LevelParams } from "@game/systems/stateMachine";
import { DIFFICULTY_CONFIG } from "@game/levels/levels";
import {
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
} from "@game/systems/narrativeSystem";

type AppPhase =
  | "TITLE"
  | "MENU"
  | "NARRATIVE_PRE"
  | "PLAYING"
  | "NARRATIVE_POST"
  | "END"
  | "TUTORIAL";

// Preview harness hook: `?preview=title|menu|narrative|end|tutorial` boots straight
// into a screen so the screenshot tool can capture the front-end screens without playing.
const PREVIEW_SCREEN =
  typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview") : null;

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
  };
}

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>(
    PREVIEW_SCREEN === "narrative"
      ? "NARRATIVE_PRE"
      : PREVIEW_SCREEN === "end"
        ? "END"
        : PREVIEW_SCREEN === "tutorial"
          ? "TUTORIAL"
          : PREVIEW_SCREEN === "menu"
            ? "MENU"
            : // Cold load (no ?preview) and ?preview=title both boot the TITLE cover.
              "TITLE",
  );
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [unlockedLevels, setUnlockedLevels] = useState<ReadonlySet<string>>(loadUnlockedLevels);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(() => FIRST_PLAYABLE_LEVEL);
  const [hudData, setHudData] = useState<HudData>(() => {
    const initial = buildHudInitial(FIRST_PLAYABLE_LEVEL, loadPrefs());
    return PREVIEW_SCREEN === "end"
      ? { ...initial, phase: "GAME_OVER", score: 4200, wave: 3 }
      : initial;
  });
  const [gameKey, setGameKey] = useState(0);
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
    if (hudData.phase !== "GAME_OVER" && hudData.phase !== "LEVEL_COMPLETE") return;

    const dateStr = new Date().toISOString();
    saveScore(selectedLevel.id, { score: hudData.score, wave: hudData.wave, date: dateStr });

    if (hudData.phase === "LEVEL_COMPLETE") {
      const currentIdx = LEVELS.findIndex((l) => l.id === selectedLevel.id);
      const nextLevel = LEVELS[currentIdx + 1];
      if (nextLevel !== undefined && !unlockedLevels.has(nextLevel.id)) {
        unlockLevel(nextLevel.id);
        setUnlockedLevels(loadUnlockedLevels());
      }
    }

    const timer = setTimeout(() => {
      if (
        hudData.phase === "LEVEL_COMPLETE" &&
        POST_LEVEL_NARRATIVE[selectedLevel.id] !== undefined
      ) {
        setAppPhase("NARRATIVE_POST");
      } else {
        setAppPhase("END");
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [hudData.phase, hudData.score, hudData.wave, selectedLevel.id, unlockedLevels]);

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
            setAppPhase("END");
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
        "--game-root-cursor": paused ? "default" : "none",
        "--game-root-touch-action": IS_MOBILE ? "none" : "auto",
      } as React.CSSProperties}
    >
      <Canvas
        ref={canvasRef}
        flat
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100], near: 0.1, far: 1000 }}
        className={styles.canvas}
      >
        <ambientLight intensity={2.2} />
        <directionalLight position={[-12, 2, 4]} intensity={0.8} />
        <directionalLight position={[10, -1, 3]} intensity={0.2} color="#2040a0" />
        <Suspense fallback={null}>
          <GameScene
            key={gameKey}
            onHudUpdate={(data) => {
              setHudData((prev) => ({
                ...data,
                levelName: selectedLevel.name,
                isHighScore: isHighScore(selectedLevel.id, data.score),
                // Delivery / QTE state arrive on separate channels; keep across refreshes.
                delivery: prev.delivery,
                hostageQte: prev.hostageQte,
              }));
            }}
            onDelivery={(delivery) => {
              setHudData((prev) => ({ ...prev, delivery }));
            }}
            onHostageQte={(hostageQte) => {
              setHudData((prev) => ({ ...prev, hostageQte: hostageQte ?? undefined }));
            }}
            canvasRef={canvasRef}
            playSfx={audio.playSfx}
            levelParams={levelParams}
            levelId={selectedLevel.id}
            paused={paused || rotateBlocked}
            isMobile={IS_MOBILE}
            crt={prefs.crt}
          />
        </Suspense>
      </Canvas>
      <style>{`@keyframes mufRedFlash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}`}</style>
      {lifeFlash > 0 && (
        <div
          key={lifeFlash}
          className={styles.lifeFlash}
          style={{
            animation: "mufRedFlash 0.6s ease-out forwards",
          }}
        />
      )}
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
