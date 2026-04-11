import { useState, useRef, useEffect, Suspense } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { HUD } from "@render/ui/HUD";
import type { HudData, TopdownHudData } from "@render/ui/HUD";
import { StartScreen } from "@render/ui/StartScreen";
import { EndScreen } from "@render/ui/EndScreen";
import { GameScene } from "./GameScene";
import { TopdownScene } from "./TopdownScene";

import { useAudio } from "@hooks/useAudio";

type AppPhase = "START" | "PLAYING" | "END";
type PlayingMode = "FACADE" | "TOPDOWN";

const INITIAL_HUD: HudData = {
  score: 0,
  lives: 3,
  timeRemaining: 90,
  phase: "PLAYING",
  wave: 1,
};

const INITIAL_TOPDOWN_HUD: TopdownHudData = {
  phase: "PLAYING",
  hasCargo: false,
  detectionLevel: 0,
};

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>("START");
  const [playingMode, setPlayingMode] = useState<PlayingMode>("FACADE");
  const [hudData, setHudData] = useState<HudData>(INITIAL_HUD);
  const [topdownHudData, setTopdownHudData] = useState<TopdownHudData>(INITIAL_TOPDOWN_HUD);
  const [gameKey, setGameKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audio = useAudio();

  const { playBgm, stopBgm, setTension } = audio;

  useEffect(() => {
    if (appPhase === "PLAYING") {
      playBgm();
    }
  }, [appPhase, playBgm]);

  useEffect(() => {
    const phase = playingMode === "FACADE" ? hudData.phase : topdownHudData.phase;
    if (phase === "GAME_OVER") {
      stopBgm();
    }
  }, [hudData.phase, topdownHudData.phase, playingMode, stopBgm]);

  useEffect(() => {
    const tension = 1 - hudData.timeRemaining / 90;
    setTension(tension);
  }, [hudData.timeRemaining, setTension]);

  // Switch to topdown when facade level complete
  useEffect(() => {
    if (hudData.phase === "LEVEL_COMPLETE" && playingMode === "FACADE") {
      const timer = setTimeout(() => {
        setPlayingMode("TOPDOWN");
      }, 1500);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, [hudData.phase, playingMode]);

  // End screen trigger
  useEffect(() => {
    const phase = playingMode === "FACADE" ? hudData.phase : topdownHudData.phase;
    if (phase !== "GAME_OVER" && phase !== "LEVEL_COMPLETE") return;
    if (playingMode === "FACADE" && phase === "LEVEL_COMPLETE") return; // switching to topdown
    const timer = setTimeout(() => {
      setAppPhase("END");
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [hudData.phase, topdownHudData.phase, playingMode]);

  function handleStart(): void {
    setAppPhase("PLAYING");
  }

  function handleRestart(): void {
    setHudData(INITIAL_HUD);
    setTopdownHudData(INITIAL_TOPDOWN_HUD);
    setGameKey((k) => k + 1);
    setPlayingMode("FACADE");
    setAppPhase("PLAYING");
  }

  if (appPhase === "START") {
    return <StartScreen onStart={handleStart} />;
  }

  if (appPhase === "END") {
    const phase = playingMode === "FACADE" ? hudData.phase : topdownHudData.phase;
    const endPhase = phase === "GAME_OVER" || phase === "LEVEL_COMPLETE" ? phase : "GAME_OVER";
    return (
      <EndScreen
        phase={endPhase}
        score={hudData.score}
        wave={hudData.wave}
        onRestart={handleRestart}
      />
    );
  }

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
        {/* Ambient chaud pour lisibilité globale */}
        <ambientLight intensity={2.2} />
        {/* Lumière rasante depuis la gauche — relief des joints de pierre */}
        <directionalLight position={[-12, 2, 4]} intensity={0.8} />
        {/* Contre-lumière bleue nuit depuis la droite */}
        <directionalLight position={[10, -1, 3]} intensity={0.2} color="#2040a0" />
        <Suspense fallback={null}>
          {playingMode === "FACADE" ? (
            <GameScene
              key={gameKey}
              onHudUpdate={setHudData}
              canvasRef={canvasRef}
              playSfx={audio.playSfx}
            />
          ) : (
            <TopdownScene
              key={`topdown-${String(gameKey)}`}
              onHudUpdate={setTopdownHudData}
              canvasRef={canvasRef}
            />
          )}
        </Suspense>
      </Canvas>
      {playingMode === "FACADE" ? <HUD data={hudData} /> : <HUD topdownData={topdownHudData} />}
    </div>
  );
}
