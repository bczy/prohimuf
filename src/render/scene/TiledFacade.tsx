import { memo } from "react";
import type { JSX } from "react";
import type { TileMap, TileType } from "@game/types/tileMap";
import { TILESET_DEFAULT } from "@game/maps/tileset_default";

// Window types get an inner "glow" inset panel
const WINDOW_TYPES = new Set<TileType>(["WINDOW_DARK", "WINDOW_LIT"]);

interface TileProps {
  tileType: TileType;
  x: number;
  y: number;
  w: number;
  h: number;
}

function TileMesh({ tileType, x, y, w, h }: TileProps): JSX.Element {
  const def = TILESET_DEFAULT[tileType];
  const isWindow = WINDOW_TYPES.has(tileType);

  if (isWindow) {
    // Window: outer frame (wall color) + inner pane (window color)
    const frameColor = TILESET_DEFAULT.WALL.color;
    const paneW = w * 0.6;
    const paneH = h * 0.65;
    return (
      <>
        {/* Frame — same as wall */}
        <mesh position={[x, y, -0.5]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={frameColor} />
        </mesh>
        {/* Pane */}
        <mesh position={[x, y, -0.4]}>
          <planeGeometry args={[paneW, paneH]} />
          <meshBasicMaterial color={def.color} />
        </mesh>
        {/* Warm inner glow for lit windows */}
        {tileType === "WINDOW_LIT" && (
          <mesh position={[x, y, -0.3]}>
            <planeGeometry args={[paneW * 0.6, paneH * 0.6]} />
            <meshBasicMaterial color="#ffe0a0" transparent opacity={0.4} />
          </mesh>
        )}
      </>
    );
  }

  // Balcony: wall + thin ledge strip at bottom
  if (tileType === "BALCONY") {
    return (
      <>
        <mesh position={[x, y, -0.5]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={def.color} />
        </mesh>
        {/* Iron railing line */}
        <mesh position={[x, y - h * 0.35, -0.4]}>
          <planeGeometry args={[w, h * 0.08]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      </>
    );
  }

  // All other tiles (WALL, ROOFTOP, DOOR): flat color
  return (
    <mesh position={[x, y, -0.5]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={def.color} />
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
            />
          );
        }),
      )}
    </>
  );
});
