# muf — Project Documentation

**Generated:** 2026-04-11 (rescan)
**Project type:** Browser game (React Three Fiber)
**Scan level:** Deep

---

## Contents

| Document                                   | Description                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| [overview.md](./overview.md)               | Project vision, gameplay, universe                                          |
| [architecture.md](./architecture.md)       | Technical architecture, folder structure, data flow, camera, tech stack     |
| [game-systems.md](./game-systems.md)       | Game logic systems (state machine, enemies, bullets, top-down systems)      |
| [render-layer.md](./render-layer.md)       | R3F scene, TiledFacade (texture + 3D depth), StreetBackground, sprites, HUD |
| [tile-system.md](./tile-system.md)         | TileMap types, FacadeMap conversion, rue_belliard map, tileset              |
| [audio-system.md](./audio-system.md)       | Audio system (Howler.js, tension tiers, BGM/SFX)                            |
| [asset-pipeline.md](./asset-pipeline.md)   | Asset generation scripts (Pollinations.ai, sprites, tiles)                  |
| [dev-guidelines.md](./dev-guidelines.md)   | TDD, YAGNI, DRY — project coding standards                                  |
| [roadmap.md](./roadmap.md)                 | Sprint status, planned features, known gaps                                 |
| [topdown-systems.md](./topdown-systems.md) | Top-down game systems: player, cop AI, delivery, state machine              |

## Diagrams

| Diagram                                                                  | Incorporated in                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| [diagrams/architecture-layers.md](./diagrams/architecture-layers.md)     | Linked in [architecture.md](./architecture.md)         |
| [diagrams/data-flow.md](./diagrams/data-flow.md)                         | Linked in [architecture.md](./architecture.md)         |
| [diagrams/enemy-state-machine.md](./diagrams/enemy-state-machine.md)     | Embedded in [game-systems.md](./game-systems.md)       |
| [diagrams/app-phase-flow.md](./diagrams/app-phase-flow.md)               | Embedded in [render-layer.md](./render-layer.md)       |
| [diagrams/street-layout.md](./diagrams/street-layout.md)                 | Linked in [tile-system.md](./tile-system.md)           |
| [diagrams/topdown-state-machine.md](./diagrams/topdown-state-machine.md) | Embedded in [topdown-systems.md](./topdown-systems.md) |
| [diagrams/topdown-data-flow.md](./diagrams/topdown-data-flow.md)         | Embedded in [topdown-systems.md](./topdown-systems.md) |

---

## Quick Reference

| Area         | Current state                                                                 |
| ------------ | ----------------------------------------------------------------------------- |
| Active map   | `rue_belliard` — 4 buildings, 50 units wide, 18 rows tall                     |
| Game mode    | Shooting gallery (facade) active + top-down prototype active (`TopdownScene`) |
| Test count   | 107 tests, all green                                                          |
| Entry point  | `src/main.tsx` → `App.tsx`                                                    |
| Dev command  | `yarn dev`                                                                    |
| Test command | `yarn test`                                                                   |
