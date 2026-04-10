import { memo, useMemo } from "react";
import type { JSX } from "react";
import { CanvasTexture } from "three";
import type { TileMap, TileType } from "@game/types/tileMap";
import { TILESET_DEFAULT } from "@game/maps/tileset_default";

const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);
const STRUCTURE_TYPES = new Set<TileType>(["WALL", "ROOFTOP", "BALCONY"]);

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 43758.5453123;
  return x - Math.floor(x);
}

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function makeWallTexture(baseColor: string, seed: number): CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return new CanvasTexture(canvas);

  const [r, g, b] = hexToRgb(baseColor);
  const drift = (seededRand(seed * 7) - 0.5) * 16;
  const vr = String(Math.round(Math.max(0, Math.min(255, r + drift))));
  const vg = String(Math.round(Math.max(0, Math.min(255, g + drift * 0.8))));
  const vb = String(Math.round(Math.max(0, Math.min(255, b + drift * 1.2))));
  ctx.fillStyle = `rgb(${vr},${vg},${vb})`;
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (seededRand(seed * 1000 + i) - 0.5) * 40;
    const pr = data[i] ?? 0;
    const pg = data[i + 1] ?? 0;
    const pb = data[i + 2] ?? 0;
    data[i] = Math.max(0, Math.min(255, pr + noise));
    data[i + 1] = Math.max(0, Math.min(255, pg + noise * 0.9));
    data[i + 2] = Math.max(0, Math.min(255, pb + noise * 1.1));
  }
  ctx.putImageData(imgData, 0, 0);

  for (let y = 0; y < size; y += 3) {
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0, y, size, 1);
  }

  if (seededRand(seed * 3) > 0.65) {
    const cx = Math.floor(seededRand(seed * 13) * size);
    const len = 20 + Math.floor(seededRand(seed * 17) * 60);
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx + (seededRand(seed * 19) - 0.5) * 10, len);
    ctx.stroke();
  }

  return new CanvasTexture(canvas);
}

interface TileProps {
  tileType: TileType;
  x: number;
  y: number;
  w: number;
  h: number;
  col: number;
  row: number;
}

function TileMesh({ tileType, x, y, w, h, col, row }: TileProps): JSX.Element {
  const def = TILESET_DEFAULT[tileType];
  const seed = col * 31 + row * 97;

  const wallTexture = useMemo(
    () => (STRUCTURE_TYPES.has(tileType) ? makeWallTexture(def.color, seed) : null),
    [],
  );

  if (WINDOW_TYPES.has(tileType)) {
    const frameColor = TILESET_DEFAULT.WALL.color;
    const paneW = w * 0.6;
    const paneH = h * 0.65;
    return (
      <>
        <mesh position={[x, y, -0.5]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={frameColor} />
        </mesh>
        <mesh position={[x, y, -0.4]}>
          <planeGeometry args={[paneW, paneH]} />
          <meshBasicMaterial color={def.color} />
        </mesh>
        {tileType === "WINDOW_LIT" && (
          <mesh position={[x, y, -0.3]}>
            <planeGeometry args={[paneW * 0.6, paneH * 0.6]} />
            <meshBasicMaterial color="#ffe0a0" transparent opacity={0.4} />
          </mesh>
        )}
      </>
    );
  }

  if (tileType === "BALCONY") {
    return (
      <>
        <mesh position={[x, y, -0.5]}>
          <planeGeometry args={[w, h]} />
          {wallTexture !== null ? (
            <meshBasicMaterial map={wallTexture} />
          ) : (
            <meshBasicMaterial color={def.color} />
          )}
        </mesh>
        <mesh position={[x, y - h * 0.35, -0.4]}>
          <planeGeometry args={[w, h * 0.08]} />
          <meshBasicMaterial color="#0a0710" />
        </mesh>
      </>
    );
  }

  return (
    <mesh position={[x, y, -0.5]}>
      <planeGeometry args={[w, h]} />
      {wallTexture !== null ? (
        <meshBasicMaterial map={wallTexture} />
      ) : (
        <meshBasicMaterial color={def.color} />
      )}
    </mesh>
  );
}

interface Props {
  map: TileMap;
}

export const TiledFacade = memo(function TiledFacade({ map }: Props): JSX.Element {
  const offsetX = (map.cols - 1) * map.tileW * 0.5;
  const offsetY = (map.rows - 1) * map.tileH * 0.5;

  return (
    <>
      {map.tiles.map((row, rowIdx) =>
        row.map((tileType, colIdx) => {
          const x = colIdx * map.tileW - offsetX;
          const y = -(rowIdx * map.tileH - offsetY);
          const h = tileType === "DOOR" ? map.tileH * 2 : map.tileH;
          return (
            <TileMesh
              key={`${String(colIdx)}-${String(rowIdx)}`}
              tileType={tileType}
              x={x}
              y={y}
              w={map.tileW}
              h={h}
              col={colIdx}
              row={rowIdx}
            />
          );
        }),
      )}
    </>
  );
});
