/**
 * Lazy-load cut point for Three.js / React Three Fiber (ADR-0068).
 *
 * This is the **only** file in the project that statically imports
 * `@react-three/fiber` or anything from `three`. It is loaded via
 * `React.lazy` in App.tsx so the ~700 kB R3F bundle is split out of the
 * initial chunk and only fetched when the player is about to enter PLAYING.
 *
 * Responsibilities:
 *  - Own the R3F `<Canvas>` with its orthographic camera / flat / lights.
 *  - Wrap `<GameScene>` in the internal `<Suspense fallback={null}>` that
 *    manages Three.js texture / asset streaming (keep this Suspense here,
 *    not in App.tsx — it is an R3F concern).
 *  - Render the DOM life-loss vignette (`lifeFlash`) and its keyframe block,
 *    which are visually welded to the Canvas and travel with it.
 *
 * Props are the exact projection of what the PLAYING branch of App.tsx was
 * passing inline — no logic lives here.
 */

import type { JSX, RefObject } from "react";
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { GameScene } from "./GameScene";
import type { HudData, HudDelivery, HudHostageQte, HudBossQte } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import styles from "./App.module.css";

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Incremented by App.tsx on each "new game" — used as `key` on GameScene
   *  to force a full remount of the game loop without tearing down the Canvas. */
  gameKey: number;
  /** Incremented each time a life is lost; drives the vignette animation restart. */
  lifeFlash: number;
  onHudUpdate: (data: HudData) => void;
  onDelivery: (delivery: HudDelivery) => void;
  onHostageQte: (qte: HudHostageQte | null) => void;
  onBossQte: (qte: HudBossQte | null) => void;
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void;
  levelParams: LevelParams;
  levelId: string;
  /** True when the game is paused OR the rotate-overlay is blocking input. */
  paused: boolean;
  isMobile: boolean;
  crt: boolean;
  reducedMotion: boolean;
}

export default function PlayingCanvas({
  canvasRef,
  gameKey,
  lifeFlash,
  onHudUpdate,
  onDelivery,
  onHostageQte,
  onBossQte,
  playSfx,
  levelParams,
  levelId,
  paused,
  isMobile,
  crt,
  reducedMotion,
}: Props): JSX.Element {
  return (
    <>
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
        {/* Internal Suspense: manages R3F asset/texture streaming — keep here, not in App.tsx. */}
        <Suspense fallback={null}>
          <GameScene
            key={gameKey}
            onHudUpdate={onHudUpdate}
            onDelivery={onDelivery}
            onHostageQte={onHostageQte}
            onBossQte={onBossQte}
            canvasRef={canvasRef}
            playSfx={playSfx}
            levelParams={levelParams}
            levelId={levelId}
            paused={paused}
            isMobile={isMobile}
            crt={crt}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      {/* Life-loss vignette — DOM overlay atop the Canvas, driven by lifeFlash counter.
          The keyframe block is inlined here so it travels with the lazy chunk. */}
      <style>{`@keyframes mufRedFlash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}`}</style>
      {lifeFlash > 0 && (
        <div
          key={lifeFlash}
          className={styles.lifeFlash}
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(255,0,0,0) 45%, rgba(220,0,0,0.55) 100%)",
            animation: "mufRedFlash 0.6s ease-out forwards",
          }}
        />
      )}
    </>
  );
}
