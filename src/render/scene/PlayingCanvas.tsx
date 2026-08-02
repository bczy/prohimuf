/**
 * Lazy-load cut point for Three.js / React Three Fiber (ADR-0068).
 *
 * This is the **only** file in App.tsx's static import graph that imports
 * `@react-three/fiber` or `three`, making it the lazy cut point. It is loaded
 * via `React.lazy` in App.tsx so the ~700 kB R3F bundle is split out of the
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
import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { GameScene } from "./GameScene";
import type { HudData, HudDelivery, HudHostageQte, HudBossQte } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import type { PhotoControlChannel } from "@hooks/useGameLoop";
import type { PhotoLeverage } from "@game/types/photoLeverage";
import type { PhotoPosture, PhotoSheetView } from "@render/ui/photo/photoSeam";
import { ContactSheet } from "@render/ui/photo/ContactSheet";
import { PhotoRaiseButton } from "@render/ui/controls/PhotoRaiseButton";
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
  /** The photo proof, pushed when the tick banks it — App owns the persistence write. */
  onPhotoLeverage: (leverage: PhotoLeverage) => void;
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void;
  levelParams: LevelParams;
  levelId: string;
  /** True when the game is paused OR the rotate-overlay is blocking input. */
  paused: boolean;
  isMobile: boolean;
  crt: boolean;
  /** VHS scan-line travel toggle (prefs.vhs) — forwarded to the CRT pass. */
  vhs: boolean;
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
  onPhotoLeverage,
  playSfx,
  levelParams,
  levelId,
  paused,
  isMobile,
  crt,
  vhs,
  reducedMotion,
}: Props): JSX.Element {
  // The photo set-piece's DOM surfaces live HERE, as siblings of the Canvas: the contact
  // sheet is a screen (DOM, focusable CTAs) and the raise button is a touch control — neither
  // can be drawn inside the R3F tree. `GameScene` pushes the two view values it owns
  // (posture, sheet) and reads the control channel back; nothing here decides anything.
  const photoChannelRef = useRef<PhotoControlChannel>({
    raiseToggle: false,
    pendingCta: null,
    pendingSkip: false,
  });
  const [photoPosture, setPhotoPosture] = useState<PhotoPosture | null>(null);
  const [photoSheet, setPhotoSheet] = useState<PhotoSheetView | null>(null);

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
            onPhotoLeverage={onPhotoLeverage}
            onPhotoPosture={setPhotoPosture}
            onPhotoSheet={setPhotoSheet}
            photoChannelRef={photoChannelRef}
            canvasRef={canvasRef}
            playSfx={playSfx}
            levelParams={levelParams}
            levelId={levelId}
            paused={paused}
            isMobile={isMobile}
            crt={crt}
            vhs={vhs}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>

      {/* Mobile raise/lower latch (UX §1.4, T-2) — mobile only, and only while the
          set-piece holds the scene. The icon follows the TICK's posture, never the tap. */}
      {isMobile && photoPosture !== null && (
        <PhotoRaiseButton channelRef={photoChannelRef} posture={photoPosture} />
      )}

      {/* The second beat (D8): the only surface that ever discloses a verdict. `sheet` is
          the tick's `photoSheetView` — `null` before `CONTACT_SHEET`, so this renders
          nothing one frame early. The roll's authored size comes from the level params. */}
      <ContactSheet
        sheet={photoSheet}
        filmCount={levelParams.photoQte?.filmCount ?? 0}
        onCta={(cta) => {
          photoChannelRef.current.pendingCta = cta;
        }}
      />

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
