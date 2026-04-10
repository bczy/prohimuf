import { memo, useEffect, useRef } from "react";
import type { JSX } from "react";
import { TextureLoader } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { TileMap, TileType, Tileset } from "@game/types/tileMap";
import { TILESET_DEFAULT } from "@game/maps/tileset_default";

const TILESET: Tileset = TILESET_DEFAULT;

interface TileProps {
  tileType: TileType;
  x: number;
  y: number;
  w: number;
  h: number;
}

function TileMesh({ tileType, x, y, w, h }: TileProps): JSX.Element {
  const meshRef = useRef<Mesh>(null);
  const def = TILESET[tileType];

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      `${import.meta.env.BASE_URL}assets/tiles/${def.sprite}`,
      (t: Texture) => {
        const mesh = meshRef.current;
        if (mesh === null) return;
        const mat = mesh.material as MeshBasicMaterial;
        mat.map = t;
        mat.needsUpdate = true;
      },
      undefined,
      () => undefined, // keep fallback color on error
    );
  }, [def.sprite]);

  return (
    <mesh ref={meshRef} position={[x, y, -0.5]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={def.fallbackColor} />
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
          // DOOR is taller
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
