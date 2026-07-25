import type { JSX } from "react";
import { useEffect, useState } from "react";
import { TextureLoader } from "three";
import type { Texture } from "three";
import { levelLayerUrl } from "@game/levels/levelArt";
import type { WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { ENEMY_PLANE_SCALE, ENEMY_BODY_LIFT } from "./EnemySprite";
import { STREET_DEPTH } from "./streetDepth";

interface Props {
  /** Level id — resolves the `foreground.png` overlay via {@link levelLayerUrl}. */
  levelId: string | undefined;
  zones: readonly WindowZone[];
  facadeW: number;
  facadeH: number;
  /** ONE tuning scalar: on-screen grille width as a multiple of the zone width. */
  grilleScale?: number;
}

/**
 * Image-textured window grilles for the single-wide décor (ADR-0057): overlays
 * the generated `foreground.png` sprite at each window zone, IN FRONT of the
 * cops, with its BOTTOM edge on the enemy FEET line — so the figure reads as
 * standing behind the rail, feet at its base. The baked grids in the street
 * image are visually replaced by this overlay.
 *
 * One shared {@link Texture} is loaded once and mapped onto one quad per zone.
 * R3F does not auto-dispose loader/prop textures, so it is released on unmount.
 *
 * The source aspect ratio that drives each grille's on-screen height (so the
 * ironwork never distorts) is read from the loaded texture's own image
 * (`image.width / image.height`) — no pixel dimensions are hardcoded, so a
 * re-cropped/regenerated `foreground.png` at any resolution stays correct.
 */
export function WindowGrilles({
  levelId,
  zones,
  facadeW,
  facadeH,
  grilleScale = 1,
}: Props): JSX.Element | null {
  const [texture, setTexture] = useState<Texture | null>(null);
  // Source aspect (width / height) read from the loaded image; null until load.
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (levelId === undefined) return;
    // Clear any prior texture/aspect so no disposed texture is referenced
    // between this cleanup and the new load resolving on a levelId swap.
    setTexture(null);
    setAspect(null);
    let disposed = false;
    let loaded: Texture | null = null;
    new TextureLoader().load(
      levelLayerUrl(levelId, "foreground"),
      (t) => {
        applyPixelFilter(t);
        if (disposed) {
          t.dispose();
          return;
        }
        loaded = t;
        setTexture(t);
        // Read the aspect from the loaded image itself (no hardcoded dims), so
        // a re-cropped/regenerated foreground.png at any resolution stays true.
        const image = t.image as HTMLImageElement | undefined;
        if (image !== undefined) setAspect(image.width / image.height);
      },
      undefined,
      () => undefined,
    );
    return () => {
      disposed = true;
      if (loaded !== null) loaded.dispose();
    };
  }, [levelId]);

  if (texture === null || aspect === null) return null;

  return (
    <>
      {zones.map((z, i) => {
        // Tile group is centred at 0 and wraps at tile.centreX; zones are in
        // facade-normalized (y-down) coords, so map into that centred space.
        const worldX = (z.x - 0.5) * facadeW;
        const worldY = (0.5 - z.y) * facadeH;
        const planeH = z.h * facadeH * ENEMY_PLANE_SCALE;
        // The cop's feet line, mirroring EnemySprite's bodyY + ENEMY_BODY_LIFT
        // seating (feet = centre − planeH·(0.5 − lift)).
        const enemyFeetY = worldY - planeH * (0.5 - ENEMY_BODY_LIFT);
        const grilleW = z.w * facadeW * grilleScale;
        const grilleH = grilleW / aspect; // preserve source aspect
        // Centre the quad so its BOTTOM edge lands exactly on the feet line.
        const grilleCentreY = enemyFeetY + grilleH / 2;
        return (
          // STREET_DEPTH.facadeOverlay (z 0.5, renderOrder 5): in front of the
          // enemies (renderOrder 4, z 0), the same slot the code-drawn
          // ForegroundFrames uses — and strictly BELOW every street actor
          // (courier 5.5, delivery van 6/7), which pass in front of the facade.
          <mesh
            key={`grille-${String(i)}`}
            position={[worldX, grilleCentreY, STREET_DEPTH.facadeOverlay.z]}
            renderOrder={STREET_DEPTH.facadeOverlay.order}
          >
            <planeGeometry args={[grilleW, grilleH]} />
            <meshBasicMaterial map={texture} transparent depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}
