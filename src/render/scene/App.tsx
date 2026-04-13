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
import { LEVEL_LAYOUTS, DEFAULT_LAYOUT } from "@game/maps/levelMaps";
import { PRE_LEVEL_NARRATIVE, POST_LEVEL_NARRATIVE } from "@game/systems/narrativeSystem";

type AppPhase = "MENU" | "NARRATIVE_PRE" | "PLAYING" | "NARRATIVE_POST" | "END";

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
  };
}

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>("MENU");
  const [paused, setPaused] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);
  const [unlockedLevels, setUnlockedLevels] = useState<ReadonlySet<string>>(loadUnlockedLevels);
  const [selectedLevel, setSelectedLevel] = useState<LevelConfig>(
    () => LEVELS[0] as unknown as LevelConfig,
  );
  const [hudData, setHudData] = useState<HudData>(() =>
    buildHudInitial(LEVELS[0] as unknown as LevelConfig, loadPrefs()),
  );
  const [gameKey, setGameKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudio();

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
    const level = LEVELS.find((l) => l.id === levelId) ?? (LEVELS[0] as unknown as LevelConfig);
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
  const lvLayout = LEVEL_LAYOUTS[selectedLevel.id] ?? DEFAULT_LAYOUT;

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
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100], near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%", background: "#000000" }}
        onCreated={({ camera, size }) => {
          let totalW = 0;
          for (const m of lvLayout.buildings) totalW += m.cols * m.tileW + lvLayout.gap;
          totalW -= lvLayout.gap;
          const STREET_H = lvLayout.streetHeight;
          const zoomByWidth = size.width / totalW;
          const zoomByHeight = (size.height - 40) / STREET_H;
          camera.zoom = Math.max(zoomByWidth, zoomByHeight);
          const viewH = size.height / camera.zoom;
          camera.position.y = -(STREET_H / 2) - 1.5 + viewH / 2;
          camera.updateProjectionMatrix();
        }}
      >
        <ambientLight intensity={2.2} />
        <directionalLight position={[-12, 2, 4]} intensity={0.8} />
        <directionalLight position={[10, -1, 3]} intensity={0.2} color="#2040a0" />
        <Suspense fallback={null}>
          <GameScene
            key={gameKey}
            onHudUpdate={(data) => {
              setHudData({
                ...data,
                levelName: selectedLevel.name,
                isHighScore: isHighScore(selectedLevel.id, data.score),
              });
            }}
            canvasRef={canvasRef}
            playSfx={audio.playSfx}
            levelParams={levelParams}
            levelId={selectedLevel.id}
            paused={paused}
          />
        </Suspense>
      </Canvas>
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
