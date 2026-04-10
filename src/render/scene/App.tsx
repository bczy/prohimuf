import { useState, useRef, useEffect, Suspense } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { StartScreen } from "@render/ui/StartScreen";
import { EndScreen } from "@render/ui/EndScreen";
import { GameScene } from "./GameScene";
import { STALINGRAD_19 as ACTIVE_MAP } from "@game/maps/stalingrad_19";
import { useAudio } from "@hooks/useAudio";

type AppPhase = "START" | "PLAYING" | "END";

const INITIAL_HUD: HudData = {
  score: 0,
  lives: 3,
  timeRemaining: 90,
  phase: "PLAYING",
  wave: 1,
};

export function App(): JSX.Element {
  const [appPhase, setAppPhase] = useState<AppPhase>("START");
  const [hudData, setHudData] = useState<HudData>(INITIAL_HUD);
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
    if (hudData.phase === "GAME_OVER") {
      stopBgm();
    }
  }, [hudData.phase, stopBgm]);

  useEffect(() => {
    const tension = 1 - hudData.timeRemaining / 90;
    setTension(tension);
  }, [hudData.timeRemaining, setTension]);

  useEffect(() => {
    if (hudData.phase !== "GAME_OVER" && hudData.phase !== "LEVEL_COMPLETE") {
      return;
    }
    const timer = setTimeout(() => {
      setAppPhase("END");
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, [hudData.phase]);

  function handleStart(): void {
    setAppPhase("PLAYING");
  }

  function handleRestart(): void {
    setHudData(INITIAL_HUD);
    setGameKey((k) => k + 1);
    setAppPhase("PLAYING");
  }

  if (appPhase === "START") {
    return <StartScreen onStart={handleStart} />;
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
          // Fit entire facade width, show ~14 rows at a time vertically
          const VIEW_ROWS = 14;
          const VIEW_COLS = ACTIVE_MAP.cols * ACTIVE_MAP.tileW;
          const zoomByHeight = (size.height - 40) / VIEW_ROWS;
          const zoomByWidth = size.width / VIEW_COLS;
          camera.zoom = Math.min(zoomByHeight, zoomByWidth);
          // Start camera showing middle of the facade (not the street)
          camera.position.y = 0;
          camera.updateProjectionMatrix();
        }}
      >
        <ambientLight intensity={1.5} />
        <Suspense fallback={null}>
          <GameScene key={gameKey} onHudUpdate={setHudData} canvasRef={canvasRef} />
        </Suspense>
      </Canvas>
      <HUD data={hudData} />
    </div>
  );
}
