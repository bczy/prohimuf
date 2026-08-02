import { useRef, useState } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import type { GameState } from "@game/types/gameState";
import type { PhotoPosture, PhotoSceneView, PhotoSheetView } from "@render/ui/photo/photoSeam";
import type { PhotoLeverage } from "@game/types/photoLeverage";
import {
  PLATE_HEIGHT,
  PLATE_WIDTH,
  isPhotoQteActive,
  photoSceneView,
  photoSheetView,
} from "@game/systems/photoQteSystem";
import { PhotoQteView } from "./PhotoQteView";
import { sweepPhaseAt } from "./photoPlateMaterial";

/**
 * The set-piece's mount point inside the scene graph (techplan §6 Lane B).
 *
 * It exists so the per-frame projection re-render stays SCOPED: `PhotoQteView` consumes
 * `PhotoSceneView` as a prop (a fresh object each tick), so whoever owns that state
 * re-renders every frame while the set-piece holds the scene. Putting it on `GameScene`
 * would re-render the whole level subtree (every `EnemySprite`, every railing) at 60 Hz for
 * four minutes; here it re-renders one plate and its brackets, and only while active.
 *
 * It reads the state ref and DECIDES NOTHING: `isPhotoQteActive`, `photoSceneView` and
 * `photoSheetView` are the game's projections, and the two-beat rule (D8) holds because the
 * sheet is `null` until the tick says otherwise — this file never infers it from a phase.
 *
 * The plate's extent comes from the game's own `PLATE_WIDTH`/`PLATE_HEIGHT` (the seam lane A
 * delivered), so no render file re-states the authored `100.0 × 56.25` su.
 */
export function PhotoQteLayer({
  stateRef,
  onPosture,
  onSheet,
  onLeverage,
}: {
  stateRef: React.RefObject<GameState>;
  /**
   * The set-piece's live posture, or `null` while it does not hold the scene. ONE callback
   * for both consumers: non-null is what switches the world group off, and the value itself
   * is the mobile raise button's icon state (which follows the TICK, never the tap latch).
   */
  onPosture: (posture: PhotoPosture | null) => void;
  /** The verdict surface, hoisted to the DOM sibling of the Canvas (it is a screen). */
  onSheet: (sheet: PhotoSheetView | null) => void;
  /**
   * The banked proof, on the frame `GameState.photoLeverage` changes. The tick owns the
   * merge (monotone, at the set-piece's exit); this is a pure edge report so App can mirror
   * it into storage — no second channel, no render-side derivation of the outcome.
   */
  onLeverage: (leverage: PhotoLeverage) => void;
}): JSX.Element | null {
  const [view, setView] = useState<PhotoSceneView | null>(null);
  const [sweepPhase, setSweepPhase] = useState(0);
  // Edge memos for the three callbacks. They all cross into the DOM tree (the world group's
  // visibility, the contact sheet, a localStorage write), so they fire on TRANSITIONS only:
  // pushing a fresh value every frame would re-render the Canvas' DOM siblings at 60 Hz — and
  // hit storage 60 times a second — which is the exact cost this layer exists to contain.
  const postureRef = useRef<PhotoPosture | null>(null);
  const sheetRef = useRef(false);
  const leverageRef = useRef<PhotoLeverage>(stateRef.current.photoLeverage);

  useFrame(() => {
    const banked = stateRef.current.photoLeverage;
    if (banked !== leverageRef.current) {
      leverageRef.current = banked;
      onLeverage(banked);
    }

    const qte = stateRef.current.photoQte;
    const active = isPhotoQteActive(qte) && qte !== null;
    const posture = active ? qte.posture : null;

    if (posture !== postureRef.current) {
      postureRef.current = posture;
      onPosture(posture);
    }

    if (!active) {
      setView(null);
      if (sheetRef.current) {
        sheetRef.current = false;
        onSheet(null);
      }
      return;
    }

    setView(photoSceneView(qte));
    setSweepPhase(sweepPhaseAt(qte.spec.cover, qte.sceneClock));

    // The sheet is `null` until the tick reaches `CONTACT_SHEET` and frozen from then on
    // (D8) — so it is pushed on the edge, once, and never re-derived here.
    const sheet = photoSheetView(qte);
    if ((sheet !== null) !== sheetRef.current) {
      sheetRef.current = sheet !== null;
      onSheet(sheet);
    }
  });

  if (view === null) return null;

  return (
    <PhotoQteView
      view={view}
      plate={{ w: PLATE_WIDTH, h: PLATE_HEIGHT }}
      // The plate's art id → path mapping is the manifest's (lane C, `assetManifest.ts`) and
      // the PNGs are still being generated. Until it lands the surface draws flat, which is
      // exactly what `PhotoQteView` documents for a texture that has not warmed.
      plateTexture={null}
      sweepPhase={sweepPhase}
    />
  );
}
