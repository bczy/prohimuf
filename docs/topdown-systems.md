# Top-down Systems — muf

All systems are pure functions: `(state, input) → newState`. No side effects, fully unit-tested.

---

## Types

### `Player` (`src/game/types/player.ts`)

```ts
interface Player {
  readonly position: Vec2;
  readonly velocity: Vec2;
  readonly hasCargo: boolean;
}
```

Factory: `createPlayer(position: Vec2): Player` — velocity `{0,0}`, `hasCargo: false`.

### `Cop` (`src/game/types/cop.ts`)

```ts
type CopState = "PATROLLING" | "ALERT";

interface Cop {
  readonly id: number;
  readonly position: Vec2;
  readonly direction: Vec2;
  readonly state: CopState;
  readonly waypointIndex: number;
  readonly alertTimer: number;
}
```

Factory: `createCop(id, startPosition)` — starts `PATROLLING`, direction `{1,0}`, `alertTimer: 0`.

### `DeliveryState` (`src/game/types/delivery.ts`)

```ts
interface DeliveryPoint {
  readonly id: string;
  readonly position: Vec2;
  readonly radius: number;
}

interface DeliveryState {
  readonly pickup: DeliveryPoint;
  readonly delivery: DeliveryPoint;
  readonly cargoPickedUp: boolean;
  readonly cargoDelivered: boolean;
}
```

### `TopdownInput` / `TopdownState` (`src/game/types/topdownState.ts`)

```ts
interface TopdownInput {
  readonly up: boolean;
  readonly down: boolean;
  readonly left: boolean;
  readonly right: boolean;
}

interface TopdownState {
  readonly phase: Phase; // "PLAYING" | "GAME_OVER" | "LEVEL_COMPLETE"
  readonly player: Player;
  readonly cops: readonly Cop[];
  readonly delivery: DeliveryState;
  readonly detectionLevel: number; // 0.0–1.0
}
```

### `TopdownMap` (`src/game/maps/topdown_test.ts`)

```ts
interface TopdownMap {
  readonly name: string;
  readonly widthUnits: number;
  readonly heightUnits: number;
  readonly playerStart: Vec2;
  readonly copWaypoints: readonly (readonly Vec2[])[];
  readonly pickupPosition: Vec2;
  readonly deliveryPosition: Vec2;
}
```

Test map `TOPDOWN_TEST`: 30×20 units, player at origin, 2 cops, pickup at `{-12,0}`, delivery at `{12,0}`.

---

## playerSystem (`src/game/systems/playerSystem.ts`)

**Constants**

| Name           | Value |
| -------------- | ----- |
| `PLAYER_SPEED` | `5`   |

**`movePlayer(player, input, delta, bounds): Player`**

1. Compute direction from `{up, down, left, right}` booleans → `{x, y}` in `[-1, 1]`
2. Normalize the direction vector
3. `velocity = normalized × PLAYER_SPEED`
4. `displacement = velocity × delta`
5. Clamp resulting position to `bounds.{minX, maxX, minY, maxY}`

Returns a new `Player` with updated `position` and `velocity`. `hasCargo` is preserved.

Bounds are computed in `topdownStateMachine` from `map.widthUnits / 2` and `map.heightUnits / 2`.

---

## copSystem (`src/game/systems/copSystem.ts`)

**Constants**

| Name                       | Value |
| -------------------------- | ----- |
| `COP_SPEED`                | `3`   |
| `DETECTION_RADIUS`         | `3`   |
| `ALERT_DURATION`           | `2.0` |
| `WAYPOINT_REACH_THRESHOLD` | `0.3` |

**`tickCop(cop, waypoints, delta): Cop`**

- `ALERT` branch: decrements `alertTimer`. When `alertTimer ≤ 0` → transitions to `PATROLLING`.
- `PATROLLING` branch: moves toward current waypoint at `COP_SPEED`. On arrival (distance `< 0.3`) → advances `waypointIndex` cyclically.

**`detectPlayer(cop, playerPosition): Cop`**

If `distance(cop.position, playerPosition) ≤ DETECTION_RADIUS` → sets state to `ALERT`, `alertTimer = ALERT_DURATION`. Otherwise returns cop unchanged.

Detection is checked every frame in `topdownStateMachine`, after `tickCop`.

---

## deliverySystem (`src/game/systems/deliverySystem.ts`)

**`checkPickup(player, delivery): DeliveryState`**

If cargo not yet picked up and player is within `pickup.radius` of `pickup.position` → sets `cargoPickedUp: true`.

**`checkDelivery(player, delivery): DeliveryState`**

If cargo is held and player is within `delivery.radius` of `delivery.position` → sets `cargoDelivered: true`.

Both functions are no-ops when their precondition is already met.

---

## topdownStateMachine (`src/game/systems/topdownStateMachine.ts`)

Entry point for the frame tick. Orchestrates all sub-systems in order.

**`createTopdownInitialState(map): TopdownState`**

Builds initial state from a `TopdownMap`: creates player, one cop per waypoint array, and delivery points with `radius: 1.5`. `phase: "PLAYING"`, `detectionLevel: 0`.

**`tickTopdown(state, input, delta, map): TopdownState`**

Early return if `phase` is `GAME_OVER` or `LEVEL_COMPLETE`.

| Step | Operation                                                                                                |
| ---- | -------------------------------------------------------------------------------------------------------- |
| 1    | `movePlayer` — player movement with map bounds                                                           |
| 2    | `tickCop × N` — advance each cop patrol / alert timer                                                    |
| 3    | `detectPlayer × N` — check each cop against new player position; count `ALERT` cops                      |
| 4    | Update `detectionLevel`: `+0.3×delta` per alert cop, `−0.1×delta` per non-alert cop; clamped to `[0, 1]` |
| 5    | `detectionLevel ≥ 1.0` → `phase: "GAME_OVER"`                                                            |
| 6    | `checkPickup` → set `player.hasCargo: true` if cargo collected                                           |
| 7    | `checkDelivery` → check delivery zone                                                                    |
| 8    | `cargoDelivered` → `phase: "LEVEL_COMPLETE"`                                                             |

---

## useTopdownLoop (`src/hooks/useTopdownLoop.ts`)

React hook wiring the state machine into R3F's `useFrame`.

```ts
function useTopdownLoop(
  map: TopdownMap,
  _canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onHudUpdate: (data: TopdownHudData) => void,
): React.RefObject<TopdownState>;
```

- `MAX_DELTA = 0.1` — caps delta to avoid spiral of death on tab resume
- Calls `tickTopdown` every frame; stores result in `gameStateRef` (no React re-render)
- Fires `onHudUpdate` only when `phase`, `cargoPickedUp`, or `detectionLevel` changes

---

## TopdownScene (`src/render/scene/TopdownScene.tsx`)

R3F scene component. Mounts `useTopdownLoop`, updates camera to follow player, renders sprites.

```
TopdownScene
├── useTopdownLoop(TOPDOWN_TEST, canvasRef, onHudUpdate) → stateRef
├── useFrame → camera.position = player.position
├── PlayerSprite(stateRef)
├── CopSprite(stateRef, copIndex) × N
└── DeliverySprite(stateRef, map)
```

Sprites are placeholder components; see roadmap for asset status.
