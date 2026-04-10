# Roadmap — muf

## Status as of 2026-04-11

---

## Completed

### Sprint 0 — Foundation

- [x] Project setup: Vite + React 19 + R3F + TypeScript + Vitest + Yarn 4
- [x] Strict game logic / render separation enforced
- [x] TDD framework in place

### Sprint 1 — Shooting Gallery Core

- [x] `GameState` type + `tickGameState` state machine
- [x] Enemy system: IDLE → APPEARING → VISIBLE → SHOOTING → HIT → DEAD
- [x] Bullet system: fire, move, hit detection (player bullets + enemy bullets)
- [x] Crosshair system
- [x] Timer (90s countdown)
- [x] Wave system (respawn on all-dead)
- [x] Lives (3 lives, GAME_OVER at 0)
- [x] HUD: score, lives, timer, wave
- [x] StartScreen / EndScreen

### Sprint 2 — Visual Polish

- [x] `TiledFacade` — procedural Canvas2D facade renderer
- [x] 9 tile types: WALL, WINDOW_LIT, WINDOW_DARK, BALCONY, DOOR, ROOFTOP, SHOP, FIRE_ESCAPE, ARCH
- [x] Normal map (Sobel filter) — bump mapping relief on stone joints
- [x] `TiledFacade` 3D depth: extruded cornices + soubassement (`boxGeometry`), edge shadow strips
- [x] `StreetBackground` — sky gradient + stars + pavement + neon reflections, ground-line aligned
- [x] Multi-building street: `rue_belliard` (4 buildings, variable heights, bottom-aligned)
- [x] Camera zoom fills viewport; horizontal + vertical scroll on mouse edge
- [x] Audio system: Howler.js, 3 BGM tension tiers, SFX
- [x] Asset generator: Pollinations.ai FLUX, 25+ sprite definitions
- [x] Lighting: ambient + rasant directional + blue counter-light

### Sprint 3 — Top-down Prototype (in progress)

- [x] Top-down types: `Player`, `Cop`, `DeliveryState`, `TopdownState`, `TopdownInput`
- [x] `playerSystem` — movement + velocity
- [x] `copSystem` — patrol + detection cone
- [x] `deliverySystem` — pickup/carry/drop
- [x] `topdownStateMachine` — integrates sub-systems
- [x] `useTopdownLoop` hook + `TopdownScene` R3F scene
- [x] `vitry_94` top-down map draft
- [ ] `PlayerSprite`, `CopSprite`, `DeliverySprite` — sprites awaiting assets
- [ ] Collision system against map tiles
- [ ] Detection meter in HUD

---

## Planned

### Level Editor (next major initiative)

- Standalone tool (separate page or app), zero server required
- Visual grid editor: click tile → place TileType
- Multi-building street layout support
- JSON export compatible with `TileMap` interface
- Auto-built palette from TileType union
- BMAD workflow: CP → CA → CE → SP pending

### Sprint 4 — Full Top-down Level

- Complete top-down game loop (pick up → deliver → avoid)
- Real Vitry 94 map with collision zones
- Detection escalation → police chase
- Multiple delivery objectives per wave

### Sprint 5 — Story & Narrative

- NPC network: DJ Masta Klem, Faïza, Seb le Blond, Oxane, Karim
- Dialogue system (fanzine style)
- Multiple districts: Vitry, Stalingrad 19e, Belleville, Châtelet

### Sprint 6 — Polish & Release

- Full sprite set (generated + refined)
- Proper audio assets (boom bap tracks)
- Mobile-friendly input
- Deploy to itch.io or GitHub Pages

---

## Known Gaps

| Area                  | Issue                                                        |
| --------------------- | ------------------------------------------------------------ |
| Generated tile assets | Opaque backgrounds — not integrable into procedural renderer |
| Audio files           | Placeholder paths — actual MP3s not yet recorded/sourced     |
| Top-down collision    | Not implemented — player can walk through walls              |
| Level editor          | Not started — blocked on BMAD CP                             |
| Sprite assets         | Most sprites still missing actual PNG files                  |
