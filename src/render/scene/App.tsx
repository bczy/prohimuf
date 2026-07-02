import { useState, useRef, useEffect, useCallback } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { MainMenu } from "@render/ui/MainMenu";
import { EndScreen } from "@render/ui/EndScreen";
import { NarrativeScreen } from "@render/ui/NarrativeScreen";
import { PauseScreen } from "@render/ui/PauseScreen";
import { GameScene } from "./GameScene";

import { useAudio } from "@hooks/useAudio";
import { loadPrefs, savePrefs } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { loadUnlockedLevels, unlockLevel, LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { saveScore, isHighScore } from "@game/systems/highScoreSystem";
import type { LevelParams } from "@game/systems/stateMachine";
import { DIFFICULTY_CONFIG } from "@game/levels/levels";
import { PRE_LEVEL_NARRATIVE, POST_LEVEL_NARRATIVE } from "@game/systems/narrativeSystem";

type AppPhase = "MENU" | "NARRATIVE_PRE" | "PLAYING" | "NARRATIVE_POST" | "END";

// Preview harness hook: `?preview=narrative|end` boots straight into a screen
// so the screenshot tool can capture the front-end screens without playing.
const PREVIEW_SCREEN =
  typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview") : null;

function buildHudInitial(level: LevelConfig, prefs: Prefs): HudData {
  return {
    score: 0,
    lives: prefs.lives,
    timeRemaining: level.timeSeconds,
    phase: "PLAYING",
    wave: 1,
  };
}

function buildLevelParams(level: LevelConfig, prefs: Prefs): LevelParams {
  const diffCfg = DIFFICULTY_CONFIG[prefs.difficulty];
  return {
    lives: prefs.lives,
    timeSeconds: level.timeSeconds,
    enemiesToWin: level.enemiesToWin,
    enemySpeedMultiplier: level.enemySpeedMultiplier * diffCfg.enemySpeedMult,
    cargoPickup: level.cargoPickup,
    cargoDepot: level.cargoDepot,
  };
}

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>(
    PREVIEW_SCREEN === "narrative" ? "NARRATIVE_PRE" : PREVIEW_SCREEN === "end" ? "END" : "MENU",
  );
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [unlockedLevels, setUnlockedLevels] = useState<ReadonlySet<string>>(loadUnlockedLevels);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(
    () => LEVELS[0] as unknown as LevelConfig,
  );
  const [hudData, setHudData] = useState<HudData>(() => {
    const initial = buildHudInitial(LEVELS[0] as unknown as LevelConfig, loadPrefs());
    return PREVIEW_SCREEN === "end"
      ? { ...initial, phase: "GAME_OVER", score: 4200, wave: 3 }
      : initial;
  });
  const [gameKey, setGameKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudio();

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

  // Reset pause when leaving PLAYING phase
  useEffect(() => {
    if (appPhase !== "PLAYING") setPaused(false);
  }, [appPhase]);

  useEffect(() => {
    if (appPhase === "PLAYING" && !paused) {
      playBgm();
    } else {
      stopBgm();
    }
  }, [appPhase, paused, playBgm, stopBgm]);

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
    const level = LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
    if (level === undefined) return;
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

  if (appPhase === "MENU") {
    return (
      <MainMenu
        unlockedLevels={unlockedLevels}
        prefs={prefs}
        onPlay={handlePlay}
        onSavePrefs={handleSavePrefs}
      />
    );
  }

  if (appPhase === "NARRATIVE_PRE") {
    const scene = PRE_LEVEL_NARRATIVE[selectedLevel.id];
    if (scene !== undefined) {
      return (
        <NarrativeScreen
          scene={scene}
          showSkipButton
          onDone={() => {
            setAppPhase("PLAYING");
          }}
        />
      );
    }
  }

  if (appPhase === "NARRATIVE_POST") {
    const scene = POST_LEVEL_NARRATIVE[selectedLevel.id];
    if (scene !== undefined) {
      return (
        <NarrativeScreen
          scene={scene}
          onDone={() => {
            setAppPhase("END");
          }}
        />
      );
    }
  }

  if (appPhase === "END") {
    const endPhase =
      hudData.phase === "GAME_OVER" || hudData.phase === "LEVEL_COMPLETE"
        ? hudData.phase
        : "GAME_OVER";
    return (
      <EndScreen
        phase={endPhase}
        score={hudData.score}
        wave={hudData.wave}
        onRestart={handleBackToMenu}
      />
    );
  }

  const levelParams = buildLevelParams(selectedLevel, prefs);

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        cursor: paused ? "default" : "none",
      }}
    >
      <Canvas
        ref={canvasRef}
        flat
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100], near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%", background: "#000000" }}
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
                // Cargo status arrives on a separate channel; keep it across refreshes.
                cargoStatus: prev.cargoStatus,
              }));
            }}
            onCargoStatus={(status) => {
              setHudData((prev) => ({ ...prev, cargoStatus: status }));
            }}
            canvasRef={canvasRef}
            playSfx={audio.playSfx}
            levelParams={levelParams}
            levelId={selectedLevel.id}
            paused={paused}
          />
        </Suspense>
      </Canvas>
      <style>{`@keyframes mufRedFlash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}`}</style>
      {lifeFlash > 0 && (
        <div
          key={lifeFlash}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, rgba(255,0,0,0) 45%, rgba(220,0,0,0.55) 100%)",
            animation: "mufRedFlash 0.6s ease-out forwards",
          }}
        />
      )}
      <HUD data={hudData} />
      {paused && (
        <PauseScreen
          prefs={prefs}
          onResume={() => {
            setPaused(false);
          }}
          onMenu={handleBackToMenu}
          onSavePrefs={handleSavePrefs}
        />
      )}
    </div>
  );
}
