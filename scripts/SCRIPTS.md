# Asset Generation Scripts

Scripts for generating game assets (sprites, tiles, audio) without a paid API key.
All generators are idempotent — existing files are always skipped.

---

## Overview

| Script                     | What it generates                                | Output directory        | Requires                    |
| -------------------------- | ------------------------------------------------ | ----------------------- | --------------------------- |
| `generate-assets.mjs`      | Character sprites, UI screens                    | `src/assets/generated/` | nothing                     |
| `generate-game-assets.mjs` | In-game sprites (enemies, crosshair, background) | `public/assets/`        | nothing                     |
| `generate-tiles.mjs`       | Building facade tile textures                    | `public/assets/tiles/`  | nothing (HF_TOKEN optional) |
| `download-audio.mjs`       | BGM and tension music tracks                     | `public/assets/audio/`  | nothing                     |

All image generators call **Pollinations.ai** (free, no account, no API key).
`generate-tiles.mjs` also supports **Hugging Face Inference API** as a faster alternative.

---

## generate-assets.mjs — Character & UI Sprites

Generates character sprites (player, contacts, antagonists) and UI screens (menu, game over, flyers).
Output goes to `src/assets/generated/`.

### Commands

```bash
# Generate all missing assets
node scripts/generate-assets.mjs

# List available asset names
node scripts/generate-assets.mjs --list

# Generate one specific asset by name
node scripts/generate-assets.mjs --asset <name>
```

### Examples

```bash
# See what assets are defined
node scripts/generate-assets.mjs --list
#   player_idle                      Player character — standing idle
#   player_walk                      Player character — walking
#   contact_dj_masta_klem            DJ Masta Klem — sonorisateur, Vitry 94
#   contact_faiza                    Faïza La Logiste — organisation, Stalingrad 19e
#   ...

# Regenerate only the player idle sprite
node scripts/generate-assets.mjs --asset player_idle

# Regenerate only the menu cover
node scripts/generate-assets.mjs --asset ui_menu_cover

# Generate everything from scratch (first run)
node scripts/generate-assets.mjs
```

### Asset catalogue

#### Player (7 sprites)

| Name             | Description                  | Size    |
| ---------------- | ---------------------------- | ------- |
| `player_idle`    | Player — standing idle       | 512×512 |
| `player_walk`    | Player — mid-walk            | 512×512 |
| `player_run`     | Player — full sprint         | 512×512 |
| `player_crouch`  | Player — crouching/hiding    | 512×512 |
| `player_talking` | Player — talking to NPC      | 512×512 |
| `player_caught`  | Player — caught by police    | 512×512 |
| `player_female`  | Player female variant — idle | 512×512 |

#### Contacts (10 sprites)

| Name                            | Description                       | Size    |
| ------------------------------- | --------------------------------- | ------- |
| `contact_dj_masta_klem`         | DJ Masta Klem, Vitry 94           | 512×512 |
| `contact_dj_masta_klem_talking` | DJ Masta Klem — dialogue          | 512×512 |
| `contact_faiza`                 | Faïza La Logiste, Stalingrad 19e  | 512×512 |
| `contact_faiza_stressed`        | Faïza La Logiste — stressed       | 512×512 |
| `contact_seb_le_blond`          | Seb le Blond, Châtelet            | 512×512 |
| `contact_seb_scared`            | Seb le Blond — scared             | 512×512 |
| `contact_oxane`                 | Oxane photographe, Belleville 20e | 512×512 |
| `contact_oxane_shooting`        | Oxane — taking a photo            | 512×512 |
| `contact_karim`                 | Karim Le Mécano, Pantin 93        | 512×512 |
| `contact_karim_working`         | Karim — repairing equipment       | 512×512 |

#### New Contacts / NPCs (8 sprites)

| Name                      | Description                             | Size    |
| ------------------------- | --------------------------------------- | ------- |
| `contact_mamie_rosa`      | Mamie Rosa — logeuse complice, Barbès   | 512×512 |
| `contact_pierrot_le_tech` | Pierrot Le Tech — sono & lumières       | 512×512 |
| `contact_yasmine`         | Yasmine — avocate militante, République | 512×512 |
| `contact_djibril`         | Djibril — dealer de flyers, Oberkampf   | 512×512 |
| `contact_nathalie`        | Nathalie — barwoman, Ménilmontant       | 512×512 |
| `contact_marco`           | Marco — videur underground              | 512×512 |
| `contact_leila_graf`      | Leila — graffiti artist, Canal          | 512×512 |
| `contact_rene_imprimeur`  | René — imprimeur clandestin, 11e        | 512×512 |

#### Antagonists (7 sprites)

| Name              | Description                      | Size    |
| ----------------- | -------------------------------- | ------- |
| `cop_bac`         | BAC de nuit — patrouille visible | 512×512 |
| `cop_bac_radio`   | BAC de nuit — appel radio        | 512×512 |
| `cop_rg`          | RG en civil — détective discret  | 512×512 |
| `cop_rg_watching` | RG en civil — en surveillance    | 512×512 |
| `cop_prefecture`  | Préfecture — fonctionnaire zélé  | 512×512 |
| `cop_crs`         | CRS — intervention anti-rave     | 512×512 |
| `informer`        | Indic — balance du quartier      | 512×512 |

#### UI (11 assets)

| Name                 | Description                         | Size    |
| -------------------- | ----------------------------------- | ------- |
| `ui_menu_cover`      | Menu principal — couverture fanzine | 512×910 |
| `ui_gameover`        | Game over — une de journal fictif   | 512×910 |
| `ui_flyer_rave`      | Flyer de rave                       | 512×910 |
| `ui_flyer_techno`    | Flyer soirée techno warehouse       | 512×910 |
| `ui_flyer_jungle`    | Flyer soirée jungle                 | 512×910 |
| `ui_victory_fanzine` | Victoire — une de fanzine festive   | 512×910 |
| `ui_dialogue_box`    | Boîte de dialogue — style fanzine   | 512×256 |
| `ui_inventory_bg`    | Fond d'inventaire — carnet de notes | 512×512 |
| `ui_map_paris`       | Carte de Paris — plan clandestin    | 512×512 |
| `ui_tension_meter`   | Jauge de tension                    | 512×128 |
| `ui_chapter_card`    | Carte de chapitre — style fanzine   | 512×256 |

#### Items (8 sprites)

| Name                 | Description                | Size    |
| -------------------- | -------------------------- | ------- |
| `item_vinyl_record`  | Vinyle — objet collectible | 128×128 |
| `item_flyers_bundle` | Liasse de flyers           | 128×128 |
| `item_walkie_talkie` | Talkie-walkie              | 128×128 |
| `item_cassette_tape` | Cassette audio — mix de DJ | 128×128 |
| `item_generator_key` | Clé de générateur          | 128×128 |
| `item_spray_can`     | Bombe de peinture          | 128×128 |
| `item_lockpick`      | Crochets de serrure        | 128×128 |
| `item_fake_id`       | Faux papiers               | 128×128 |

### Behaviour

- **Skip**: if the output file already exists, it is not regenerated. Delete the file to force a new generation.
- **Retry**: up to 5 attempts per asset. Each retry waits `attempt × 15s` (15s, 30s, 45s…).
- **Rate limit**: 5s pause between assets.
- **Seed**: random per run — each generation produces a different image.

---

## generate-game-assets.mjs — In-Game Sprites

Generates the sprites used directly during gameplay: the facade background, enemy states, the crosshair, and the player bullet.
Output goes to `public/assets/`.

### Commands

```bash
# Generate all missing game assets
node scripts/generate-game-assets.mjs

# List available asset names
node scripts/generate-game-assets.mjs --list

# Generate one specific asset by name
node scripts/generate-game-assets.mjs --asset <name>
```

### Examples

```bash
# Regenerate only the facade background
node scripts/generate-game-assets.mjs --asset facade_bg

# Regenerate the shooting enemy sprite
node scripts/generate-game-assets.mjs --asset enemy_shooting

# Regenerate the crosshair UI element
node scripts/generate-game-assets.mjs --asset crosshair

# Full generation run
node scripts/generate-game-assets.mjs
```

### Asset catalogue

#### Facade backgrounds (5 variants)

| Name                  | Description                             | Size     |
| --------------------- | --------------------------------------- | -------- |
| `facade_bg`           | Paris building facade — brutalist night | 1024×512 |
| `facade_bg_haussmann` | Paris building — Haussmann stone        | 1024×512 |
| `facade_bg_banlieue`  | Paris building — banlieue HLM           | 1024×512 |
| `facade_bg_warehouse` | Paris building — warehouse squat        | 1024×512 |
| `facade_bg_mixed`     | Paris building — mixed storefronts      | 1024×512 |

#### Enemy sprites — standing (5 types)

| Name             | Description                       | Size    |
| ---------------- | --------------------------------- | ------- |
| `enemy_sprite`   | Undercover cop — standing         | 128×128 |
| `enemy_sprite_2` | Plainclothes detective — standing | 128×128 |
| `enemy_sprite_3` | BAC officer — standing            | 128×128 |
| `enemy_sprite_4` | RG agent — standing               | 128×128 |
| `enemy_sprite_5` | CRS riot police — standing        | 128×128 |

#### Enemy sprites — alert & shooting

| Name               | Description                       | Size    |
| ------------------ | --------------------------------- | ------- |
| `enemy_alert`      | Enemy — spotted player alert      | 128×128 |
| `enemy_radio`      | Enemy — calling backup on radio   | 128×128 |
| `enemy_shooting`   | Undercover cop — shooting         | 128×128 |
| `enemy_shooting_2` | Plainclothes detective — shooting | 128×128 |
| `enemy_shooting_3` | BAC officer — shooting            | 128×128 |
| `enemy_shooting_4` | RG agent — shooting               | 128×128 |

#### Player in-game

| Name                 | Description                   | Size  |
| -------------------- | ----------------------------- | ----- |
| `player_ingame_idle` | Player small sprite — idle    | 64×64 |
| `player_ingame_walk` | Player small sprite — walking | 64×64 |

#### Projectiles & Effects

| Name            | Description                   | Size  |
| --------------- | ----------------------------- | ----- |
| `crosshair`     | Crosshair — acid green        | 64×64 |
| `crosshair_red` | Crosshair — red enemy lock-on | 64×64 |
| `bullet_player` | Player bullet tracer          | 16×16 |
| `bullet_enemy`  | Enemy bullet tracer           | 16×16 |
| `fx_explosion`  | Explosion burst effect        | 64×64 |
| `fx_hit`        | Hit impact spark              | 32×32 |
| `fx_smoke`      | Smoke cloud puff              | 64×64 |

#### HUD elements

| Name        | Description                | Size  |
| ----------- | -------------------------- | ----- |
| `hud_heart` | Heart / life indicator     | 32×32 |
| `hud_skull` | Skull / death indicator    | 32×32 |
| `hud_siren` | Police siren icon          | 32×32 |
| `hud_vinyl` | Vinyl record progress icon | 32×32 |

### Behaviour

- **Skip**: existing files are not overwritten.
- **Retry**: up to 5 attempts, exponential backoff (`attempt × 15s`).
- **Rate limit**: 5s pause between assets.
- **Verbose**: prints the Pollinations URL prefix for each fetch attempt.

---

## generate-tiles.mjs — Building Facade Tiles

Generates tileable textures for the procedural building facade: walls, windows, rooftops, doors.
Output goes to `public/assets/tiles/`.

Supports two image generation backends, tried in order by default.

### Commands

```bash
# Generate all missing tiles (auto mode: tries HuggingFace first, falls back to Pollinations)
node scripts/generate-tiles.mjs

# List available tile names
node scripts/generate-tiles.mjs --list

# Generate one specific tile
node scripts/generate-tiles.mjs --tile <name>

# Force a specific source
node scripts/generate-tiles.mjs --source pollinations
node scripts/generate-tiles.mjs --source huggingface
node scripts/generate-tiles.mjs --source auto        # default

# HuggingFace with authentication (avoids rate limits)
HF_TOKEN=hf_xxx node scripts/generate-tiles.mjs
HF_TOKEN=hf_xxx node scripts/generate-tiles.mjs --tile tile_wall
```

### Examples

```bash
# Quick check — what tiles are available?
node scripts/generate-tiles.mjs --list
#   tile_wall                Solid wall — Haussmann plaster
#   tile_window_dark         Dark window — shutters, no light
#   tile_window_lit          Lit window — warm neon glow inside
#   tile_rooftop             Rooftop edge — zinc, chimneys
#   tile_door                Ground floor door — heavy wood

# Regenerate just the lit window tile via Pollinations only
node scripts/generate-tiles.mjs --tile tile_window_lit --source pollinations

# Regenerate all tiles using HuggingFace (faster, better quality when authenticated)
HF_TOKEN=hf_xxx node scripts/generate-tiles.mjs --source huggingface

# Regenerate only the rooftop using HuggingFace, fall back to Pollinations automatically
HF_TOKEN=hf_xxx node scripts/generate-tiles.mjs --tile tile_rooftop
```

### Tile catalogue

#### Walls (10 tiles)

| Name                       | Description                    | Size    |
| -------------------------- | ------------------------------ | ------- |
| `tile_wall`                | Haussmann plaster — clean      | 128×128 |
| `tile_wall_cracked`        | Wall — cracked, weathered      | 128×128 |
| `tile_wall_graffiti`       | Wall — graffiti tags + flyers  | 128×128 |
| `tile_wall_graffiti_large` | Wall — large graffiti piece    | 128×128 |
| `tile_wall_poster`         | Wall — rave flyers pasted      | 128×128 |
| `tile_wall_brick`          | Wall — exposed brick, banlieue | 128×128 |
| `tile_wall_concrete`       | Wall — brutalist concrete      | 128×128 |
| `tile_wall_tiles_facade`   | Wall — ceramic facade tiles    | 128×128 |
| `tile_wall_ivy`            | Wall — ivy-covered stone       | 128×128 |
| `tile_wall_stained`        | Wall — water-stained plaster   | 128×128 |

#### Windows (9 tiles)

| Name                        | Description                         | Size    |
| --------------------------- | ----------------------------------- | ------- |
| `tile_window_dark`          | Window — shutters closed, dark      | 128×128 |
| `tile_window_lit`           | Window — warm neon glow inside      | 128×128 |
| `tile_window_tv`            | Window — TV flickering inside       | 128×128 |
| `tile_window_open`          | Window — open, curtains blowing     | 128×128 |
| `tile_window_boarded`       | Window — boarded up                 | 128×128 |
| `tile_window_bars`          | Window — iron bars, rez-de-chaussée | 128×128 |
| `tile_window_neon_sign`     | Window — shop with neon sign        | 128×128 |
| `tile_window_small`         | Window — small mansard attic        | 128×64  |
| `tile_window_shutters_open` | Window — volets ouverts, cold light | 128×128 |

#### Balconies (3 tiles)

| Name                   | Description                    | Size    |
| ---------------------- | ------------------------------ | ------- |
| `tile_balcony`         | Balcony — wrought iron railing | 128×128 |
| `tile_balcony_plants`  | Balcony — potted plants        | 128×128 |
| `tile_balcony_laundry` | Balcony — laundry hanging      | 128×128 |

#### Rooftops (5 tiles)

| Name                       | Description                | Size    |
| -------------------------- | -------------------------- | ------- |
| `tile_rooftop`             | Rooftop — zinc, chimneys   | 128×128 |
| `tile_rooftop_satellite`   | Rooftop — satellite dishes | 128×128 |
| `tile_rooftop_water_tower` | Rooftop — water tower      | 128×256 |
| `tile_rooftop_skylight`    | Rooftop — velux skylight   | 128×128 |
| `tile_rooftop_parapet`     | Rooftop — stone parapet    | 128×64  |

#### Doors & Entrances (4 tiles)

| Name                 | Description                       | Size    |
| -------------------- | --------------------------------- | ------- |
| `tile_door`          | Door — heavy wooden double        | 128×256 |
| `tile_door_metal`    | Door — industrial metal fire door | 128×256 |
| `tile_door_coded`    | Door — digicode entry             | 128×256 |
| `tile_door_graffiti` | Door — tagged with graffiti       | 128×256 |

#### Ground Level (4 tiles)

| Name                    | Description                    | Size    |
| ----------------------- | ------------------------------ | ------- |
| `tile_shopfront_closed` | Shop — metal shutter closed    | 128×128 |
| `tile_shopfront_bar`    | Shop — bar café, lights on     | 128×128 |
| `tile_basement_window`  | Basement — frosted half-window | 128×64  |
| `tile_garage_door`      | Garage — rolling metal gate    | 128×128 |

#### Special / Atmospheric (5 tiles)

| Name                 | Description                         | Size   |
| -------------------- | ----------------------------------- | ------ |
| `tile_drainpipe`     | Drainpipe — zinc vertical           | 32×128 |
| `tile_vent_grate`    | Vent — metal wall grate             | 64×64  |
| `tile_street_lamp`   | Street lamp — Parisian lamp post    | 64×256 |
| `tile_corner_pillar` | Corner — stone pillar with carvings | 64×128 |
| `tile_cornice`       | Cornice — decorative plaster border | 128×32 |

### Sources compared

|             | Pollinations.ai     | Hugging Face (FLUX.1-schnell)        |
| ----------- | ------------------- | ------------------------------------ |
| API key     | Not required        | Optional (`HF_TOKEN`)                |
| Speed       | Slow (rate limited) | Fast with token                      |
| Quality     | Good                | Good                                 |
| Retry wait  | 20s × attempt       | 10s × attempt                        |
| Max retries | 4                   | 3                                    |
| Fallback    | —                   | Yes, auto falls back to Pollinations |

### Behaviour

- **Auto mode** (default): tries HuggingFace first. If it fails, falls back to Pollinations.
- **Skip**: existing tiles are not regenerated. Delete the file to force a new one.
- **Image validation**: responses are checked for minimum size (>2KB) and valid PNG/JPEG magic bytes (HF only).
- **Rate limit**: 2s pause between tiles.

---

## download-audio.mjs — BGM & Music Tracks

Downloads royalty-free music tracks for in-game audio from **incompetech.com** (Kevin MacLeod, CC-BY 4.0).
Output goes to `public/assets/audio/`.

> **Attribution**: Kevin MacLeod tracks require attribution per CC-BY 4.0.
> Credit: "Music by Kevin MacLeod — incompetech.com, licensed under CC-BY 4.0"

### Commands

```bash
# Download all missing tracks
node scripts/download-audio.mjs
```

> There are no `--list` or `--asset` flags — runs all tracks or nothing.

### Examples

```bash
# First run — downloads all 5 tracks
node scripts/download-audio.mjs
#   [dl]   bgm_loop — Main BGM — Funky Chunk (boom bap groove)
#   [ok]   bgm_loop.mp3 (3421 KB)
#   [dl]   bgm_tension — Tension BGM — Sneaky Snitch (suspense)
#   ...

# Re-run after a partial failure — skips already-downloaded files
node scripts/download-audio.mjs
#   [skip] bgm_loop — already exists
#   [skip] bgm_loop2 — already exists
#   [dl]   bgm_tension — ...

# Force re-download a specific track (delete it first)
rm public/assets/audio/bgm_tension.mp3
node scripts/download-audio.mjs
```

### Track catalogue

| File              | Description                   | Used when         |
| ----------------- | ----------------------------- | ----------------- |
| `bgm_loop.mp3`    | Funky Chunk — boom bap groove | Main gameplay BGM |
| `bgm_loop2.mp3`   | Ouroboros — dark groove       | Secondary loop    |
| `bgm_tension.mp3` | Sneaky Snitch — suspense      | Tension rising    |
| `bgm_danger.mp3`  | Darkest Child — high tension  | Danger state      |
| `bgm_win.mp3`     | Reformat — upbeat             | Victory screen    |

### Behaviour

- **Skip**: files over 10KB that already exist are not re-downloaded.
- **Validation**: files under 10KB are deleted and treated as failed (error pages from the server).
- **Retry**: up to 3 attempts per track, 5s wait between retries.
- **Timeout**: 30s per download request.
- **Fallback**: `FALLBACKS` map in the script can define per-track backup URLs (currently empty).
- **Rate limit**: 1s pause between tracks.
- At the end, the script prints the Howler-compatible paths for all tracks.

---

## Regenerating a single asset — quick reference

```bash
# Delete the file, then run the matching script with --asset / --tile
rm src/assets/generated/player_idle.png
node scripts/generate-assets.mjs --asset player_idle

rm public/assets/facade_bg.png
node scripts/generate-game-assets.mjs --asset facade_bg

rm public/assets/tiles/tile_wall.png
node scripts/generate-tiles.mjs --tile tile_wall

rm public/assets/audio/bgm_tension.mp3
node scripts/download-audio.mjs
```

## Adding a new asset

Open the relevant script and add an entry to its `ASSETS` / `TILES` / `CURATED` array:

```js
// In generate-assets.mjs — ASSETS array
{
  name: "my_new_sprite",
  description: "Short human-readable description",
  prompt: `Your image generation prompt here. ${BASE_STYLE}`,
  width: 512,
  height: 512,
},
```

Then run:

```bash
node scripts/generate-assets.mjs --asset my_new_sprite
```
