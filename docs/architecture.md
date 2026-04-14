# Architecture — muf

## Folder Structure

```
src/
├── game/                   # Pure game logic — zero React/Three deps
│   ├── types/              # Shared type definitions (no functions)
│   │   ├── gameState.ts    # GameState,
 Phase
│   │   ├── tileMap.ts      # TileMap,
 TileType,
 Tileset
│   │   ├── map.ts          # FacadeMap,
 WindowSlot
│   │   ├── topdownState.ts # TopdownState,
 TopdownInput
│   │   ├── player.ts       # Player
│   │   ├── cop.ts          # Cop
│   │   ├── delivery.ts     # DeliveryState
│   │   ├── enemy.ts        # Enemy
│   │   ├── bullet.ts       # Bullet
│   │   ├── crosshair.ts    # Crosshair
│   │   ├── vector.ts       # Vec2
│   │   └── input.ts        # InputState
│   ├── systems/            # Pure functions — state-in / state-out
│   │   ├── stateMachine.ts         # Shooting gallery main loop
│   │   ├── topdownStateMachine.ts  # Top-down main loop
│   │   ├── bulletSystem.ts
│   │   ├── enemySystem.ts
│   │   ├── crosshairSystem.ts
│   │   ├── playerSystem.ts
│   │   ├── copSystem.ts
│   │   ├── deliverySystem.ts
│   │   ├── tileMapSystem.ts        # TileMap → FacadeMap conversion
│   │   ├── audioSystem.ts          # Howler.js wrapper
│   │   ├── timer.ts
│   │   ├── vec2.ts
│   │   └── __tests__/      # Vitest unit tests
│   ├── maps/               # Level data (TileMap arrays)
│   │   ├── rue_belliard.ts # Active shooting gallery map (4 buildings)
│   │   ├── stalingrad_19.ts
│   │   ├── vitry_94.ts
│   │   ├── topdown_test.ts
│   │   ├── facade01.ts
│   │   └── tileset_default.ts
│   ├── entities/index.ts   # Entity factory helpers
│   └── state/index.ts      # State factory helpers
├── hooks/                  # React hooks — bridge between game logic and R3F
│   ├── useGameLoop.ts      # Shooting gallery loop (useFrame)
│   ├── useTopdownLoop.ts   # Top-down loop (useFrame)
│   ├── useAudio.ts         # AudioSystem React wrapper
│   ├── useMouse.ts         # Normalised mouse position ref
│   ├── useKeyboard.ts      # Keyboard input ref
│   └── index.ts
├── render/
│   ├── scene/              # R3F scene components
│   │   ├── App.tsx              # Root: phase router + Canvas + lighting
│   │   ├── GameScene.tsx        # Shooting gallery scene
│   │   ├── TopdownScene.tsx     # Top-down scene (Sprint 3)
│   │   ├── TiledFacade.tsx      # Procedural facade renderer
│   │   ├── StreetBackground.tsx # Sky + pavement backdrop
│   │   ├── FacadeBackground.tsx # Plain background fallback
│   │   ├── EnemySprite.tsx
│   │   ├── PlayerSprite.tsx
│   │   ├── CopSprite.tsx
│   │   ├── BulletSprite.tsx
│   │   ├── CrosshairSprite.tsx
│   │   └── DeliverySprite.tsx
│   └── ui/                 # HTML overlay components (not R3F)
│       ├── HUD.tsx
│       ├── StartScreen.tsx
│       └── EndScreen.tsx
├── assets/
│   ├── audio/              # bgm_loop.mp3,
 bgm_tension.mp3,
 bgm_danger.mp3,
 sfx/
│   └── generated/          # PNG sprites from generate-assets.mjs
└── main.tsx
scripts/
├── generate-assets.mjs     # Pollinations.ai asset generator
└── SCRIPTS.md
docs/                       # Project documentation (this folder)
```

---

## Design Principles

### Strict game logic / render separation

All game logic lives in `src/game/` and is pure TypeScript with zero React or Three.js imports. This enables:

- Unit testing without DOM / WebGL setup
- Deterministic state — same input always produces same output
- Easy porting to any renderer

React hooks in `src/hooks/` are the only bridge. They subscribe to the R3F `useFrame` loop and call game system functions,
 then update refs used by render components.

→ See [diagrams/architecture-layers.md](./diagrams/architecture-layers.md)

### Immutable state

`GameState` and `TopdownState` are read-only. Every tick returns a new state object. No mutation in system functions.

### YAGNI / DRY / TDD

- Write tests before adding system functions
- Don't add features not currently needed
- No shared abstractions unless 3+ use cases exist

---

## Key Data Flow

→ Full diagram: [diagrams/data-flow.md](./diagrams/data-flow.md)

```
useMouse / useKeyboard
        │
        ▼
useGameLoop / useTopdownLoop  (useFrame — 60fps)
        │  calls
        ▼
stateMachine.tickGameState()   ← pure function
        │  returns new GameState
        ▼
stateRef.current = newState    ← ref (no re-render)
        │
        ▼
R3F Components read stateRef every frame
(EnemySprite,
 BulletSprite,
 CrosshairSprite…)
```

HUD data is pushed via `onHudUpdate` callback (triggers React re-render only when values change).

---

## Camera

Orthographic camera. Zoom is computed on `onCreated` to fill the viewport:

```ts
const zoomByWidth = size.width / STREET_W; // fill horizontally
const zoomByHeight = (size.height - 40) / STREET_H; // fill vertically (minus HUD)
camera.zoom = Math.max(zoomByWidth,
 zoomByHeight);
```

Initial position shows the ground floor + a strip of road below buildings.

Horizontal and vertical scroll via mouse edge zones (GameScene `useFrame`),
 clamped to scene bounds.

---

## Tech Stack

| Layer            | Technology                         |
| ---------------- | ---------------------------------- |
| Framework        | React 19                           |
| 3D renderer      | React Three Fiber + Three.js       |
| Language         | TypeScript (strict)                |
| Build            | Vite                               |
| Tests            | Vitest                             |
| Audio            | Howler.js                          |
| Package manager  | Yarn 4 (PnP)                       |
| Asset generation | Pollinations.ai (FLUX model,
 free) |
