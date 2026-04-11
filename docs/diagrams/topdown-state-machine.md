# Top-down State Machines

## Cop State Machine

States: `PATROLLING` | `ALERT`  
Source: `src/game/types/cop.ts`, `src/game/systems/copSystem.ts`

```mermaid
stateDiagram-v2
    [*] --> PATROLLING

    PATROLLING --> PATROLLING : move toward waypoint\n(advance index on arrival)
    PATROLLING --> ALERT : distance to player ≤ DETECTION_RADIUS (3 units)\nalertTimer = ALERT_DURATION (2.0s)

    ALERT --> ALERT : alertTimer > 0\n(cop stands still)
    ALERT --> PATROLLING : alertTimer ≤ 0\n(resume patrol from current waypointIndex)

    note right of PATROLLING
        COP_SPEED = 3 units/s
        Cycles waypoints (modulo)
        Threshold: 0.3 units
    end note

    note right of ALERT
        Frozen — no movement
        ALERT_DURATION = 2.0s
        Detection checked every frame
    end note
```

> There is no CHASE state in the current implementation. Cops detect and freeze — they do not pursue.

---

## Delivery State Machine

Source: `src/game/types/delivery.ts`, `src/game/systems/deliverySystem.ts`

```mermaid
stateDiagram-v2
    [*] --> WAITING_PICKUP : createTopdownInitialState\ncargoPickedUp=false, cargoDelivered=false

    WAITING_PICKUP --> CARRYING : player within pickup.radius (1.5 units)\nplayer.hasCargo = true

    CARRYING --> DELIVERED : player within delivery.radius (1.5 units)\ncargoDelivered = true

    DELIVERED --> [*] : phase → LEVEL_COMPLETE

    note right of WAITING_PICKUP
        pickup.position set by TopdownMap
    end note
    note right of CARRYING
        player.hasCargo = true
        delivery checks enabled
    end note
```

---

## Game Phase Machine

Source: `src/game/systems/topdownStateMachine.ts`

```mermaid
stateDiagram-v2
    [*] --> PLAYING : createTopdownInitialState

    PLAYING --> GAME_OVER : detectionLevel ≥ 1.0\n(all cops alerting continuously)
    PLAYING --> LEVEL_COMPLETE : cargoDelivered = true

    GAME_OVER --> [*]
    LEVEL_COMPLETE --> [*]

    note right of PLAYING
        detectionLevel: +0.3×delta per ALERT cop
        detectionLevel: −0.1×delta per non-ALERT cop
        Clamped to [0.0, 1.0]
    end note
```
