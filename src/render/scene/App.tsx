import { useState, useRef, useEffect } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { MainMenu } from "@render/ui/MainMenu";
import { EndScreen } from "@render/ui/EndScreen";
import { GameScene } from "./GameScene";

import { useAudio } from "@hooks/useAudio";
import { loadPrefs, savePrefs } from "@game/systems/prefsSystem";
import type { Prefs } from "@game/systems/prefsSystem";
import { loadUnlockedLevels, unlockLevel, LEVELS } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { saveScore } from "@game/systems/highScoreSystem";
import type { LevelParams } from "@game/systems/stateMachine";
import { DIFFICULTY_CONFIG } from "@game/levels/levels";

type AppPhase = "MENU" | "PLAYING" | "END";

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

  useEffect(() => {
    if (appPhase === "PLAYING") {
      playBgm();
    } else {
      stopBgm();
    }
  }, [appPhase, playBgm, stopBgm]);

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

    // Save score
    const dateStr = new Date().toISOString();
    saveScore(selectedLevel.id, { score: hudData.score, wave: hudData.wave, date: dateStr });

    // Unlock next level on LEVEL_COMPLETE
    if (hudData.phase === "LEVEL_COMPLETE") {
      const currentIdx = LEVELS.findIndex((l) => l.id === selectedLevel.id);
      const nextLevel = LEVELS[currentIdx + 1];
      if (nextLevel !== undefined && !unlockedLevels.has(nextLevel.id)) {
        unlockLevel(nextLevel.id);
        setUnlockedLevels(loadUnlockedLevels());
      }
    }

    const timer = setTimeout(() => {
      setAppPhase("END");
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
    setAppPhase("PLAYING");
  }

  function handleSavePrefs(updated: Prefs): void {
    savePrefs(updated);
    setPrefs(updated);
  }

  function handleBackToMenu(): void {
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
    <div style={{ position: "relative", width: "100vw", height: "100vh", cursor: "none" }}>
      <Canvas
        ref={canvasRef}
        orthographic
        camera={{ zoom: 50, position: [0, 0, 100], near: 0.1, far: 1000 }}
        style={{ width: "100%", height: "100%", background: "#000000" }}
        onCreated={({ camera, size }) => {
          const STREET_W = 50;
          const STREET_H = 18;
          const zoomByWidth = size.width / STREET_W;
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
            onHudUpdate={setHudData}
            canvasRef={canvasRef}
            playSfx={audio.playSfx}
            levelParams={levelParams}
          />
        </Suspense>
      </Canvas>
      <HUD data={hudData} />
    </div>
  );
}
