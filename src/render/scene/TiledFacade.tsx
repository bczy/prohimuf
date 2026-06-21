import { memo, useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";
import type { TileMap } from "@game/types/tileMap";
import { applyPixelFilter, pixelateCanvas } from "./pixelArt";
import { makeFacadeCanvas, makeNormalCanvas } from "./facadeCanvas";

interface Props {
  map: TileMap;
  /** World x position of the building centre (default 0) */
  worldOffsetX?: number;
  /** Total street height in rows — building is bottom-aligned within this height */
  streetHeight?: number;
}

// Depth constants (world units)
const CORNICE_DEPTH = 0.22; // how far cornices stick out from the facade
const CORNICE_H = 0.12; // height of each cornice band
const BASE_DEPTH = 0.35; // soubassement sticks out more
const BASE_H = 0.18;
const FACADE_Z = 0; // facade plane z
const SIDE_SHADOW_W = 0.15; // width of the right-edge shadow strip

export const TiledFacade = memo(function TiledFacade({
  map,
  worldOffsetX = 0,
  streetHeight,
}: Props): JSX.Element {
  const facadeW = map.cols * map.tileW;
  const facadeH = map.rows * map.tileH;
  const yOffset = streetHeight !== undefined ? -((streetHeight - map.rows) * map.tileH) / 2 : 0;

  // Absolute world coords of the mesh centre
  const cx = worldOffsetX;
  const cy = yOffset;

  // Building base Y (bottom edge of building in world space)
  const baseY = cy - facadeH / 2;

  const { diffuse, normal } = useMemo(() => {
    const diffuseCanvas = makeFacadeCanvas(map);
    // Style B: collapse the finely-drawn facade into chunky 16-bit pixels and
    // band the palette. The normal map is derived from the pixelated canvas so
    // the relief stays aligned with the pixel grid.
    pixelateCanvas(diffuseCanvas, 4, 8);
    return {
      diffuse: applyPixelFilter(new CanvasTexture(diffuseCanvas)),
      normal: applyPixelFilter(new CanvasTexture(makeNormalCanvas(diffuseCanvas))),
    };
  }, [map]);

  // Cornice positions: one per floor boundary (every tileH rows)
  // Skip row 0 (top of building) — only interior joints
  const cornices = useMemo(() => {
    const result: number[] = [];
    for (let row = 1; row < map.rows; row++) {
      // y in world space: top of building minus row*tileH, offset to mesh centre
      const worldY = cy + facadeH / 2 - row * map.tileH;
      result.push(worldY);
    }
    return result;
  }, [map, cy, facadeH]);

  return (
    <>
      {/* Main facade plane */}
      <mesh position={[cx, cy, FACADE_Z]}>
        <planeGeometry args={[facadeW, facadeH]} />
        <meshStandardMaterial
          map={diffuse}
          normalMap={normal}
          normalScale={[3.2, 3.2]}
          roughness={0.6}
          metalness={0.0}
        />
      </mesh>

      {/* Corniches inter-étages — horizontal bands that stick out */}
      {cornices.map((worldY, i) => (
        <mesh key={i} position={[cx, worldY, FACADE_Z + CORNICE_DEPTH / 2]} castShadow>
          <boxGeometry args={[facadeW, CORNICE_H, CORNICE_DEPTH]} />
          <meshStandardMaterial color="#38354e" roughness={0.7} metalness={0.05} />
        </mesh>
      ))}

      {/* Soubassement — heavier base that sticks out more */}
      <mesh position={[cx, baseY + BASE_H / 2, FACADE_Z + BASE_DEPTH / 2]} castShadow>
        <boxGeometry args={[facadeW, BASE_H, BASE_DEPTH]} />
        <meshStandardMaterial color="#28253a" roughness={0.8} metalness={0.0} />
      </mesh>

      {/* Right-edge shadow — thin dark strip simulating depth on the right side */}
      <mesh position={[cx + facadeW / 2 + SIDE_SHADOW_W / 2, cy, FACADE_Z - 0.1]}>
        <planeGeometry args={[SIDE_SHADOW_W, facadeH]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} />
      </mesh>

      {/* Top-edge dark band — sky meets rooftop */}
      <mesh position={[cx, cy + facadeH / 2 + 0.05, FACADE_Z - 0.1]}>
        <planeGeometry args={[facadeW, 0.1]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} />
      </mesh>
    </>
  );
});
