import type { JSX } from "react";
import { useEffect, useState } from "react";
import { TextureLoader } from "three";
import type { Texture } from "three";
import { levelLayerUrl } from "@game/levels/levelArt";
import type { WindowZone } from "@game/levels/levelArt";
import { applyPixelFilter } from "./pixelArt";
import { ENEMY_PLANE_SCALE, ENEMY_BODY_LIFT } from "./EnemySprite";

// Native size of the generated grille sprite (public/assets/levels/belliard/
// foreground.png, 991×594 RGBA, chroma-keyed). Its aspect drives the on-screen
// grille height from the per-zone width, so the ironwork never distorts.
const GRILLE_SRC_W = 991;
const GRILLE_SRC_H = 594;
const GRILLE_ASPECT = GRILLE_SRC_W / GRILLE_SRC_H; // ≈ 1.6684

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
 */
export function WindowGrilles({
  levelId,
  zones,
  facadeW,
  facadeH,
  grilleScale = 1,
}: Props): JSX.Element | null {
  const [texture, setTexture] = useState<Texture | null>(null);

  useEffect(() => {
    if (typeof document === "undefined" || typeof window === "undefined") return;
    if (levelId === undefined) return;
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
      },
      undefined,
      () => undefined,
    );
    return () => {
      disposed = true;
      if (loaded !== null) loaded.dispose();
    };
  }, [levelId]);

  if (texture === null) return null;

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
        const grilleH = grilleW / GRILLE_ASPECT; // preserve source aspect
        // Centre the quad so its BOTTOM edge lands exactly on the feet line.
        const grilleCentreY = enemyFeetY + grilleH / 2;
        return (
          // z 0.5 + renderOrder 5: in front of the enemies (renderOrder 4, z 0),
          // the same slot the code-drawn ForegroundFrames used.
          <mesh key={`grille-${String(i)}`} position={[worldX, grilleCentreY, 0.5]} renderOrder={5}>
            <planeGeometry args={[grilleW, grilleH]} />
            <meshBasicMaterial map={texture} transparent depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}
