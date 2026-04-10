# Tile System — muf

## Types

### TileType

```ts
type TileType =
  | "WALL"
  | "WINDOW_DARK"
  | "WINDOW_LIT"
  | "BALCONY"
  | "DOOR"
  | "ROOFTOP"
  | "SHOP" // vitrine commerciale au RDC
  | "FIRE_ESCAPE" // escalier de secours métallique
  | "ARCH"; // arcade haussmannienne
```

Only `WINDOW_DARK` and `WINDOW_LIT` become enemy spawn slots.

### TileMap

```ts
interface TileMap {
  name: string;
  cols: number;
  rows: number;
  tiles: readonly (readonly TileType[])[]; // row-major [row][col]
  tileW: number; // world units per tile horizontally
  tileH: number; // world units per tile vertically
}
```

### FacadeMap (derived)

```ts
interface FacadeMap {
  width: number;
  height: number;
  slots: WindowSlot[]; // only WINDOW tiles
}

interface WindowSlot {
  col: number;
  row: number;
  screenPosition: { x: number; y: number }; // world coords
}
```

---

## Conversion: `tileMapToFacade(map, worldOffsetX, streetHeight)`

`src/game/systems/tileMapSystem.ts`

Filters tiles to window types only, converts grid indices to world positions:

```ts
worldX = worldOffsetX + col * tileW - ((cols - 1) * tileW) / 2;
worldY = -(row * tileH - ((rows - 1) * tileH) / 2) + rowOffsetY;
```

`streetHeight` triggers bottom-alignment: `rowOffsetY = -(streetHeight - map.rows) * tileH`

---

## Active Map: `rue_belliard.ts`

Four buildings placed left-to-right with `BUILDING_GAP = 2` world units between them.

| Building   | Cols | Rows | Style                          |
| ---------- | ---- | ---- | ------------------------------ |
| BELLIARD_A | 12   | 18   | Haussmannien, pierre de taille |
| BELLIARD_B | 10   | 12   | Années 70, béton brut          |
| BELLIARD_C | 8    | 8    | Petit pavillon/commerce        |
| BELLIARD_D | 14   | 15   | Copropriété moderne            |

Total street width: `12+2+10+2+8+2+14 = 50` world units  
`STREET_HEIGHT = 18` (max building height, used for bottom-alignment)

→ Layout diagram: [diagrams/street-layout.md](./diagrams/street-layout.md)

### Map authoring helpers

```ts
// Fill a row with wall, then override specific positions
function row(cols, ...[count, type][]): TileType[]

// Fill entire row with one type
function solidRow(cols, type): TileType[]
```

---

## Other Maps

| File               | Status     | Description                                        |
| ------------------ | ---------- | -------------------------------------------------- |
| `rue_belliard.ts`  | **Active** | Shooting gallery, 4 buildings                      |
| `stalingrad_19.ts` | Draft      | 48×40, uses `rep()`/`frow()` helpers, not imported |
| `vitry_94.ts`      | Draft      | Top-down map                                       |
| `topdown_test.ts`  | Active     | Top-down prototype map                             |
| `facade01.ts`      | Legacy     | Simple single-building facade                      |

---

## Tileset

`src/game/maps/tileset_default.ts` defines default `TilesetDef` per `TileType`:

```ts
interface TilesetDef {
  color: string; // fallback flat color
  sprite?: string; // optional PNG path (currently unused in renderer)
}
```

The procedural `TiledFacade` renderer draws each tile type via Canvas2D draw functions — `sprite` is not yet used.

---

## Level Editor (Planned)

A standalone tool is planned (BMAD CP → CA → CE → SP). Goals:

- Visual grid editor, click to place TileType
- Multi-building street layout
- JSON export compatible with `TileMap` interface
- Zero server required — runs as local static page
