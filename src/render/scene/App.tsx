import { useState, useRef, useEffect, Suspense } from "react";
import type { JSX } from "react";
import { Canvas } from "@react-three/fiber";
import { HUD } from "@render/ui/HUD";
import type { HudData } from "@render/ui/HUD";
import { StartScreen } from "@render/ui/StartScreen";
import { EndScreen } from "@render/ui/EndScreen";
import { GameScene } from "./GameScene";

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
          // rue_belliard: 4 buildings (12+10+8+14 cols) + 3 gaps of 2 = 50 units wide, 18 rows tall
          const STREET_W = 50;
          const STREET_H = 18;
          // Fit street width into viewport — no sky gaps
          const zoomByWidth = size.width / STREET_W;
          // Never show more than STREET_H rows (tiles stay readable)
          const zoomByHeight = (size.height - 40) / STREET_H;
          camera.zoom = Math.max(zoomByWidth, zoomByHeight);
          // Start camera showing RDC (ground floor) + road strip below buildings.
          // Buildings span y=[-9,+9]. Shift camera down so bottom 3 units of view = road.
          const viewH = size.height / camera.zoom;
          // Center of view at: bottom_of_buildings - road_strip/2 + viewH/2
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
          <GameScene key={gameKey} onHudUpdate={setHudData} canvasRef={canvasRef} />
        </Suspense>
      </Canvas>
      <HUD data={hudData} />
    </div>
  );
}
