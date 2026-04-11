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
- [x] Bullet system: fire, move, hit detection (player + enemy bullets)
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
- [x] `TiledFacade` 3D depth: extruded cornices + soubassement, edge shadow strips
- [x] `StreetBackground` — sky gradient + stars + pavement + neon reflections
- [x] Multi-building street: `rue_belliard` (4 buildings, variable heights, bottom-aligned)
- [x] Camera zoom fills viewport; horizontal + vertical scroll on mouse edge
- [x] Audio system: Howler.js, 3 BGM tension tiers, SFX (shoot.wav)
- [x] Asset generator: Pollinations.ai FLUX, 25+ sprite definitions
- [x] Lighting: ambient + rasant directional + blue counter-light

### Sprint 3 — Gameplay Polish

- [x] Bullet bounds fix: `OUT_OF_BOUNDS_X` 20 → 60 (full street width)
- [x] Fire input reliability: `pendingShots` counter (no lost clicks, no spray)
- [x] Shoot SFX: `shoot.wav` generated and wired

---

## Planned

### Sprint 4 — Menu & Préférences

- [ ] Écran de sélection de niveau (choix de la carte / du quartier)
- [ ] High scores (localStorage, top 10 par niveau)
- [ ] Préférences : volume son, volume musique, nombre de vies, difficulté
- [ ] Persistance des préférences entre sessions (localStorage)

### Sprint 5 — Multiple Levels

- [ ] 2e carte (nouveau quartier, nouveaux bâtiments)
- [ ] 3e carte
- [ ] Tuning ennemi par niveau (vitesse, taux de spawn)
- [ ] Progression : débloquer le niveau suivant au LEVEL_COMPLETE

### Sprint 6 — Story & Narrative

- [ ] Réseau NPC : DJ Masta Klem, Faïza, Seb le Blond, Oxane, Karim
- [ ] Système de dialogues (style fanzine, entre les niveaux)
- [ ] Quartiers : Vitry, Stalingrad 19e, Belleville, Châtelet

### Sprint 7 — Polish & Release

- [ ] Sprite set complet (générés + raffinés)
- [ ] Assets audio définitifs (boom bap tracks)
- [ ] Input mobile
- [ ] Deploy itch.io ou GitHub Pages

---

## Known Gaps

| Area                  | Issue                                                        |
| --------------------- | ------------------------------------------------------------ |
| Generated tile assets | Opaque backgrounds — not integrable into procedural renderer |
| Audio files           | Placeholder paths — actual MP3s not yet recorded/sourced     |
| Sprite assets         | Most sprites still missing actual PNG files                  |
| High scores           | Not implemented                                              |
| Level select          | Not implemented                                              |
