# Asset Generation Scripts

Scripts for generating game assets (sprites,
audio) without a paid API key.
All generators are idempotent — existing files are always skipped.

---

## Overview

| Script                     | What it generates         | Output directory | Requires |
| -------------------------- | ------------------------- | ---------------- | -------- |
| `generate-assets.mjs`      | Character sprites,        |
| UI screens                 | `src/assets/generated/`   | nothing          |
| `generate-game-assets.mjs` | In-game sprites (enemies, |

crosshair,
background) | `public/assets/` | nothing |
| `download-audio.mjs` | BGM and tension music tracks | `public/assets/audio/` | nothing |

All image generators call **Pollinations.ai** (free,
no account,
no API key).

---

## generate-assets.mjs — Character & UI Sprites

Generates character sprites (player,
contacts,
antagonists) and UI screens (menu,
game over,
flyers).
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
#   contact_dj_masta_klem            DJ Masta Klem — sonorisateur,
 Vitry 94
#   contact_faiza                    Faïza La Logiste — organisation,
 Stalingrad 19e
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

| Name                            | Description                 | Size    |
| ------------------------------- | --------------------------- | ------- |
| `contact_dj_masta_klem`         | DJ Masta Klem,              |
| Vitry 94                        | 512×512                     |
| `contact_dj_masta_klem_talking` | DJ Masta Klem — dialogue    | 512×512 |
| `contact_faiza`                 | Faïza La Logiste,           |
| Stalingrad 19e                  | 512×512                     |
| `contact_faiza_stressed`        | Faïza La Logiste — stressed | 512×512 |
| `contact_seb_le_blond`          | Seb le Blond,               |
| Châtelet                        | 512×512                     |
| `contact_seb_scared`            | Seb le Blond — scared       | 512×512 |
| `contact_oxane`                 | Oxane photographe,          |
| Belleville 20e                  | 512×512                     |
| `contact_oxane_shooting`        | Oxane — taking a photo      | 512×512 |
| `contact_karim`                 | Karim Le Mécano,            |
| Pantin 93                       | 512×512                     |
| `contact_karim_working`         | Karim — repairing equipment | 512×512 |

#### New Contacts / NPCs (8 sprites)

| Name                      | Description                       | Size    |
| ------------------------- | --------------------------------- | ------- |
| `contact_mamie_rosa`      | Mamie Rosa — logeuse complice,    |
| Barbès                    | 512×512                           |
| `contact_pierrot_le_tech` | Pierrot Le Tech — sono & lumières | 512×512 |
| `contact_yasmine`         | Yasmine — avocate militante,      |
| République                | 512×512                           |
| `contact_djibril`         | Djibril — dealer de flyers,       |
| Oberkampf                 | 512×512                           |
| `contact_nathalie`        | Nathalie — barwoman,              |
| Ménilmontant              | 512×512                           |
| `contact_marco`           | Marco — videur underground        | 512×512 |
| `contact_leila_graf`      | Leila — graffiti artist,          |
| Canal                     | 512×512                           |
| `contact_rene_imprimeur`  | René — imprimeur clandestin,      |
| 11e                       | 512×512                           |

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

- **Skip**: if the output file already exists,
  it is not regenerated. Delete the file to force a new generation.
- **Retry**: up to 5 attempts per asset. Each retry waits `attempt × 15s` (15s,
  30s,
  45s…).
- **Rate limit**: 5s pause between assets.
- **Seed**: random per run — each generation produces a different image.

---

## generate-game-assets.mjs — In-Game Sprites

Generates the sprites used directly during gameplay: the facade background,
enemy states,
the crosshair,
and the player bullet.
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
- **Retry**: up to 5 attempts,
  exponential backoff (`attempt × 15s`).
- **Rate limit**: 5s pause between assets.
- **Verbose**: prints the Pollinations URL prefix for each fetch attempt.

---

## download-audio.mjs — BGM & Music Tracks

Downloads royalty-free music tracks for in-game audio from **incompetech.com** (Kevin MacLeod,
CC-BY 4.0).
Output goes to `public/assets/audio/`.

> **Attribution**: Kevin MacLeod tracks require attribution per CC-BY 4.0.
> Credit: "Music by Kevin MacLeod — incompetech.com,
> licensed under CC-BY 4.0"

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
- **Retry**: up to 3 attempts per track,
  5s wait between retries.
- **Timeout**: 30s per download request.
- **Fallback**: `FALLBACKS` map in the script can define per-track backup URLs (currently empty).
- **Rate limit**: 1s pause between tracks.
- At the end,
  the script prints the Howler-compatible paths for all tracks.

---

## Regenerating a single asset — quick reference

```bash
# Delete the file,
 then run the matching script with --asset
rm src/assets/generated/player_idle.png
node scripts/generate-assets.mjs --asset player_idle

rm public/assets/facade_bg.png
node scripts/generate-game-assets.mjs --asset facade_bg

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

## Regenerating level art (Style B)

`gen-level-art.mjs` only generates **missing** files, so reruns are stable.
To re-roll the AI art (random seed each run):

- **One level:** delete its folder, e.g. `rm -rf public/assets/levels/vitry`,
  then push a commit that also touches a non-ignored file (the preview
  workflow ignores `public/assets/levels/**`), and CI regenerates the missing
  layers.
- **All levels:** run the _Style B Preview_ workflow with `regenerate=true`
  (force), or delete `public/assets/levels/*` and push alongside any source
  change.

---

## gen-window-zones.mjs — Per-panel enemy window zones

Derives the cop window zones from the facade **art**, one set per panel, so
cops and the procedural balcony railings line up with the real lit windows of
each (independently generated) facade panel.

For each level the `windowGrid` in `levelArt.json` (cols/rows + the extent of
the lit-window band) is the intended layout; the script only **snaps** each
row/column line onto the warm window light of that panel's image, via separable
warm-density centroids. So the slot **count** stays stable while positions
track whatever art was generated.

- **Output:** `src/game/levels/windowZones.generated.json`
  (`{ "<levelId>": WindowZone[][] }`, outer index = panel). Committed; the app
  imports it. Falls back to the level's grid when a level is missing.
- **Run after regenerating facade art:** `node scripts/gen-window-zones.mjs`
- **Verify:** `node scripts/gen-window-zones.mjs --debug` also writes
  `scripts/.dbg-<level>-p<n>.jpg` overlays (gitignored) — open them to confirm
  each grid box lands on a window.
- **Requires:** the pure-JS JPEG decoder `jpeg-js` (`npm i --no-save jpeg-js`);
  the facade panels are JPEG-encoded despite their `.png` names.

---

## gen-enemy-types.mjs — Enemy sprite flipbook frames

Generates the enemy archetype sprites (base cops + variants, riot/CRS,
motorcycle cop, delivery civilian, bonus figure) as a **2-frame flipbook**
(6 fps, Prohibition-1987 register) — light tones on a pure-black ground that
`cutout-enemies.mjs` keys to transparency afterwards.

- **Single source of truth:** the `enemies` block of
  `src/game/levels/levelArt.json` (`style`, `fps`, `size`, and `types` keyed by
  the exact base filename with `{ seed, prompt, frames }`). Add or tune an enemy
  **there**, never in the script (mirrors `gen-vehicle-sprites.mjs`).
- **Frame files:** `frames[0]` is always `""` → `<key>.png` (the committed
  accepted frame 1, never regenerated); `frames[i>0]` is a pose-delta clause →
  `<key>_f<i+1>.png`. The `_f` prefix sits **after** the legacy variant suffix so
  `enemy_shooting_2_f2.png` = cop variant 2, shooting, frame 2 (ADR 0015).
- **Frame ≥2 strategy (logged per file):** primary `kontext` img2img from the
  committed frame 1 (`image=` set to its raw GitHub URL) so the extra frame is the
  same character in a new pose; fallback = matched flux pair under the pinned seed
  (regenerates frame 1 + frame 2, overwriting the accepted frame 1 → human art
  gate in the PR).
- **Output:** `public/assets/enemy_*.png`. Only MISSING files are generated
  (`FORCE=1` overrides); in practice only the `_f2` files are produced.

### Commands

```bash
# Generate missing frames via Pollinations, then chroma-key (CI usage)
node scripts/gen-enemy-types.mjs && node scripts/cutout-enemies.mjs

# Regenerate everything (overwrite committed frames)
FORCE=1 node scripts/gen-enemy-types.mjs
```

A failed fetch is logged per-asset and never crashes the run (network FLUX is
normally blocked in the local sandbox; real art is produced in CI via
`.github/workflows/gen-sprites.yml`, whose `enemy_*.png` glob already covers the
new frame files — no structural workflow change).

---

## gen-vehicle-sprites.mjs — Delivery-vehicle sprites (truck / car / moto)

Generates the side-profile delivery-vehicle sprites for the scripted "protect
the delivery" beat, in the house style (photocopied fanzine B&W + acid neon) on
a pure-black background that is then keyed to transparency — the **same edge
flood-fill as `cutout-enemies.mjs`**, imported and reused (no duplicated detour).

- **Single source of truth:** the `vehicles` block of
  `src/game/levels/levelArt.json` (prompt, size, neon accent and output path per
  type). Add or tune a vehicle **there**, never in the script.
- **Naming contract (fixed — renderer + gameplay lanes align on it):**
  `public/assets/vehicles/{truck,car,moto}.png`, `vehicleType` ∈
  `"truck" | "car" | "moto"`.
- **Output:** `public/assets/vehicles/<type>.png`, transparent (already cut out).

### Commands

```bash
# Generate missing sprites via Pollinations/FLUX, then chroma-key (needs network)
node scripts/gen-vehicle-sprites.mjs

# Regenerate all (overwrite), used in CI
FORCE=1 node scripts/gen-vehicle-sprites.mjs

# No network? Write dependency-free procedural placeholders so render isn't empty
node scripts/gen-vehicle-sprites.mjs --placeholder

# One type only, or list the defined vehicles
node scripts/gen-vehicle-sprites.mjs --asset truck
node scripts/gen-vehicle-sprites.mjs --list
```

### Behaviour

- **Skip**: existing files are not regenerated; `FORCE=1` regenerates.
- **Placeholder mode** (`--placeholder` / `PLACEHOLDER=1`): writes small
  procedural PNGs (dark silhouette + neon rim, transparent bg) using a built-in
  zlib-only PNG writer — no `@napi-rs/canvas`, no network. Distinct proportions
  read as truck / car / moto. Committed as a fallback so `yarn dev` shows a
  vehicle even before CI runs.
- **Cutout**: after a successful network generation, the black background is
  keyed to transparency by importing `cutout(file)` from `cutout-enemies.mjs`.
  If `@napi-rs/canvas` is missing it logs `[cutout-skip]` and continues (CI does
  the keying).
- **Retry / rate limit**: 5 attempts with backoff, 2s pause between types
  (matches `gen-enemy-types.mjs`).

### CI

`.github/workflows/gen-vehicle-sprites.yml` (manual `workflow_dispatch`):
installs `@napi-rs/canvas`, runs `FORCE=1 node scripts/gen-vehicle-sprites.mjs`
(overwriting placeholders with real FLUX art + keying), and commits the three
PNGs back to the branch — the same pattern as the enemy-sprite workflow. Network
FLUX generation is normally blocked in the local sandbox, so real art is
produced here.

---

## gen-courier-sprites.mjs — Layered courier flipbook (bike + rider)

Generates the street-courier (livreur) as a **2-layer composite** — a delivery
**bike** (wheel rotation) drawn under a **rider** (pedaling stride), composited as
two stacked planes render-side (bike below rider, ADR 0016).

- **Single source of truth:** the `courier` block of
  `src/game/levels/levelArt.json` (`opening`, `style`, `fps`, `size`, and `layers`
  keyed `bike` / `rider` with `{ asset, seed, prompt, frames, scale, offsetY }`).
  Add or tune a layer **there**, never in the script.
- **Strip-and-slice (not per-frame).** Unlike the enemy flip, the courier has **no
  protected frame 1**. Each layer is ONE FLUX image — a horizontal strip of
  `frames.length` identical square cells (strip width = `size.width * N`, always
  **derived**, never stored) — sliced in memory (`@napi-rs/canvas`) on a fixed grid
  into the per-frame PNGs, then chroma-keyed per file by importing `cutout()` from
  `cutout-enemies.mjs`.
- **Atomic layer.** A layer is skipped only when **all** its frame files exist and
  `FORCE !== 1`; if **any** frame is missing (or `FORCE=1`) the **whole strip
  regenerates** and every frame is overwritten (loud `[regen-all]` log). All sliced
  buffers are collected before any file is written — a failed fetch or slice never
  leaves a half-written strip.
- **Frame files:** frame 1 unsuffixed `<layer>.png`, frame N≥2 `<layer>_f<N>.png`,
  under `public/assets/courier/`. Every `frames[i]` is a non-empty pose clause
  (cell `i+1`); the strip prompt is `opening` + `exactly ${N} cells, ` + `prompt` +
  the joined `cell i: clause` clauses + `style`.
- **Output:** `public/assets/courier/{bike,rider}*.png`.

### Commands

```bash
# Generate missing layers via Pollinations/FLUX, slice + chroma-key (needs network + canvas)
node scripts/gen-courier-sprites.mjs

# Regenerate ALL layers (overwrite), used in CI
FORCE=1 node scripts/gen-courier-sprites.mjs

# No network? Write dependency-free procedural placeholder frames (local testing only)
node scripts/gen-courier-sprites.mjs --placeholder

# List the defined layers + their frame files
node scripts/gen-courier-sprites.mjs --list
```

### CI

`.github/workflows/gen-courier-sprites.yml` (manual `workflow_dispatch` or the
`.github/dispatch/gen-courier-sprites` marker) runs the prompt gate
(`check-art-prompts.mjs --set courier`) **before** any paid FLUX, installs
`@napi-rs/canvas` **before** the generator (slicing hard-requires the decoder,
unlike the vehicle/enemy workflows), runs `FORCE=1 node
scripts/gen-courier-sprites.mjs`, and commits `public/assets/courier/*.png` back to
the branch. It is **separate** from `gen-sprites.yml` because the enemy's
protected-frame-1 / missing-only semantics do not match the courier's atomic
strips. Network FLUX is normally blocked in the local sandbox, so real art is
produced here.

---

## e2e-home.mjs — Deploy smoke test (E2E)

Playwright E2E that guards the **deployment** against build and base-path
config regressions — the kind that once served a 404 instead of the game.

Drives the production build in headless Chromium under its real deploy base and
fails (exit 1) if the **home screen** (`MainMenu`) does not render or if any
same-origin request 404s. The menu is pure DOM (no WebGL), so it is fast and
deterministic. Writes `screenshots/e2e-home.png` (artifact, gitignored).

- **Input:** `PREVIEW_URL` — a running server URL **including the base**
  (e.g. `http://127.0.0.1:4173/prohimuf/` or `…/prohimuf/preview/<branch>/`).
- **Local:** `yarn build && yarn preview` then `yarn e2e`
  (Playwright is installed on demand: `npm i --no-save playwright`).
- **CI:** runs in both deploy jobs via the `.github/actions/e2e-home`
  composite action — **after build, before publish** — so a broken build or
  wrong `VITE_BASE` never reaches GitHub Pages.

---

## e2e-ingame.mjs — In-game render gate (E2E)

Playwright E2E that guards the **deployment** against in-game **render**
regressions — the class of bug `e2e-home.mjs` is blind to. The home screen is
pure DOM, so a scene that throws on mount, a canvas that never mounts, or a
shader/asset load that crashes the game all pass the home smoke while the actual
game is unplayable. This gate boots the production build, **enters one level for
real** (belliard), and fails if the game scene does not render.

Kept to a **single level** on purpose so it stays fast and deterministic — it is
a gate, not the per-level contact-sheet farm (`screenshot-preview.mjs`). Runs
headless Chromium with software WebGL (SwiftShader), since CI has no GPU.
Determinism matches the other scripts: cops frozen
(`window.__MUF_FREEZE_COPS__` via `addInitScript`) and audio muted (`muf_prefs`).
Writes `screenshots/e2e-ingame.png` (artifact, gitignored).

Hard gates (exit 1 on any):

- the gameplay `<canvas>` mounts **and** has non-zero pixel dimensions (proves an
  R3F Canvas + WebGL context, not an empty stub),
- no uncaught runtime error (`pageerror`) fires while entering the game,
- at least one screenshot is actually written to disk.

Console errors are logged as a soft signal only.

- **Input:** `PREVIEW_URL` — a running server URL **including the base**
  (e.g. `http://127.0.0.1:4173/prohimuf/`). Optional `E2E_LEVEL_NAME` overrides
  the level (default `Rue Belliard`, must match `levelArt.json`).
- **Local:** `yarn build && yarn preview` then
  `PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/e2e-ingame.mjs`
  (Playwright installed on demand: `npm i --no-save playwright`).
- **CI:** runs in `deploy.yml` via the `.github/actions/e2e-ingame` composite
  action — **after build, before publish** — so a broken game scene never
  reaches GitHub Pages.

---

## check-halo-gradient.mjs — Vehicle neon-halo gradient gate

Mechanical regression lock (story-halo-alpha-composite-gate, AC4) for the
runtime vehicle neon rim (ADR-0011, `src/render/scene/vehicleNeon.ts`). The rim
is composed **only at runtime**, so the ASSET gate
(`check-sprite-style.mjs`, which judges the pure-B&W source PNG) is blind to it —
that blind spot let a hard **binary-alpha plate** (no falloff) ship. This gate
**fails (exit 1)** if the composed in-game halo shows no alpha-gradient falloff.

- **Why frame-diff:** a first cut measured the assigned neon hue on the single
  DELIVERING frame — it was **invalidated on real builds** because belliard's
  facade has "windows glowing warm orange" (`levelArt.json`) in the truck's
  orange band, so it measured the level art (old plate 60.9% vs new gradient
  65.1% — a 4pp non-signal). The gate now diffs **two** frames of the same level:
  **A** (pre-trigger, vehicle absent) vs **B** (DELIVERING, vehicle + rim). Cops
  are frozen and PNG is lossless, so the static facade cancels and only the
  vehicle's added light `max(0, B−A)` remains.
- **Metric:** keep added light in the assigned neon hue band (read from
  `levelArt.json` `vehicles.types[*].neon`; orange/cyan/magenta/green), measured
  **only over a dark baseline** (additive light clamps over bright backgrounds).
  Recover alpha from the neon's non-clamping channel, `α = max_c(added_c/neon_c)`.
  A binary plate recovers α≡1 (all top bin); a gradient spreads α across the
  **intermediate** band. Gate: intermediate-alpha share `>= 20%`. Measured: OLD
  plate (synthetic on real bg) **0.0% → FAIL**; NEW gradient **69.9% live /
  31.9% synthetic → PASS**. Every run prints the histogram + shares; env
  `HALO_MIN_INTERMEDIATE` / `HALO_MIN_NEON_PIXELS` override without a code change.
- **Reusable:** exports
  `checkHaloGradient({ file|buffer|pixels, against|baselineBuffer|baselinePixels, neon })`
  / `analyzeHaloDiff` / `evaluateHalo`; `e2e-delivery.mjs` calls it with its
  baseline + DELIVERING screenshot buffers.
- **Standalone two-file CLI** (`--file` = DELIVERING/with-vehicle, `--against` =
  pre-trigger baseline):

  ```bash
  node scripts/check-halo-gradient.mjs --file DELIVERING.png --against PRE.png --neon orange
  node scripts/check-halo-gradient.mjs --file B.png --against A.png --neon cyan --json
  ```

- **Requires:** `@napi-rs/canvas` (same dep as `check-sprite-style.mjs`),
  imported lazily. Install on demand:
  `npm i --no-save --legacy-peer-deps @napi-rs/canvas@1.0.2`.
- **CI:** runs as part of the delivery gate — `e2e-delivery.mjs` invokes it, and
  `deploy.yml` installs `@napi-rs/canvas` right before the delivery step.

---

## check-sprite-integrity.mjs — Post-cutout topology / integrity gate (enemy sprites)

Objective, ground-agnostic integrity gate for keyed enemy sprites
(story-courier-cyclist-sprite-fix). Where `check-sprite-style.mjs` guards vehicle
**hue/silhouette**, this guards **topology**: it catches the AI-generation anatomy
defect the courier shipped with — FLUX never drew the pelvis (paper-white), the
enclosed-island keying pass (ADR-0013) cleared it → an interior transparent hole
severing both legs, plus 68 keying-debris parasites. A topology-only check missed
it (the silhouette stayed one dominant component — the legs hang on via the bike
frame), so this gate is two-layered.

- **Design:** modelled on `check-halo-gradient.mjs` — a **pure** exported
  `measureIntegrity({ W, H, d })` (+ `evaluateIntegrity`) with **no I/O**
  (unit-testable) plus a thin CLI that decodes pixels via `@napi-rs/canvas`
  (lazy import, so importing the module never throws).
- **HARD checks** (exit 1 on any): (a) **dominance** — largest 4-conn opaque
  component / total opaque ≥ 0.97; (b) **speckle budget** — ≤ 4 non-dominant
  opaque components smaller than 12px (the clause that PROVES detection: courier
  pre-fix = 68 → FAIL, post-retouch = 0 → PASS); (c) **binary alpha** — 0 pixels
  with `0 < alpha < 255`. 4-**connectivity** is required (8-conn would merge the
  diagonally-linked debris cluster under budget).
- **SOFT layer** (printed WARN, **never** fails — routed to the human/agent art
  gates): an inventory of interior transparent enclaves, flagging any > 150px whose
  bbox-top sits in the upper 80% (torso/hip) of the figure — the layer that surfaces
  a severed-limb / anatomy hole for a human glance. **Figure-only:** the torso
  fraction assumes a standing human; pass `isFigure:false` for non-figure sprites.
- **CI:** wired into `.github/workflows/gen-sprites.yml` **after** the cutout step
  and **before** commit, **scoped to `enemy_civilian.png`** — the other committed
  enemy sprites carry pre-existing keying debris / action-pose detached elements a
  blanket gate would false-fail (extending to the whole set is a separate story).

```bash
node scripts/check-sprite-integrity.mjs                 # inventory ALL enemy_*.png
node scripts/check-sprite-integrity.mjs --file a.png    # gate one sprite (exit 0/1)
node scripts/check-sprite-integrity.mjs --json          # machine-readable
```

- **Requires:** `@napi-rs/canvas` (same dep as `check-sprite-style.mjs`), lazy.
  Install on demand:
  `npm install --no-save --legacy-peer-deps --ignore-scripts @napi-rs/canvas@1.0.2`.

---

## retouch-sprites.mjs — Deterministic per-sprite geometry retouch

The sanctioned home (per `game-graphist.md`) for **scripted, re-runnable** sprite
retouches Serge signs off — here, **post-key geometry repair** (distinct from the
KEYING/flood logic, which stays in the shared `cutout-enemies.mjs`; ADR-0013
rejected a standalone retouch only for the flood, not for geometry repair).

Fixes the courier's severed legs deterministically, **no FLUX regeneration**:

1. **Hip bridge** — samples the sprite's own dark trouser **aplat locally** (never a
   hardcoded colour; measured ≈ (52,48,62)) and fills only the hip/crotch pixels
   truly **enclosed** by opaque-dark body on all four sides (maxGap 30px), keeping
   the bike-frame triangle and wheel spokes see-through. Flat aplat, binary alpha,
   **iterated to a fixed point** so it is idempotent.
2. **Speckle sweep** — after the bridge, drops non-dominant 4-conn opaque components
   < 12px (matches `check-sprite-integrity.mjs`'s budget).

Runs **in place** on `public/assets/<sprite>`, deterministic + idempotent
(re-run = byte-identical). Every window/threshold is a **documented per-sprite**
constant (`RETOUCH_SPECS`) tuned to one sprite's geometry — NOT a general filter.
**Not wired into CI** on purpose: it is the explicit human-run fix, so
`check-sprite-integrity.mjs` stays a true gate. The HARD gate catches reintroduced
keying debris / subject fragmentation / non-binary alpha — a re-opened hip hole alone
passes HARD and shows only as a SOFT WARN a human must act on (see ADR-0014 §C).

```bash
node scripts/retouch-sprites.mjs                    # retouch every known sprite
node scripts/retouch-sprites.mjs enemy_civilian.png # one sprite by basename
```

- **Requires:** `@napi-rs/canvas` (same install pattern as `cutout-enemies.mjs`).

---

## preview-vehicle-halo.mjs — Vehicle halo in-game composite preview

Review tool (story-halo-alpha-composite-gate, AC5/AC6) that captures the
**composed in-game neon halo** — the thing no delivered PNG contains — so
lead-art can eyeball the alpha-gradient falloff. Boots the built game and plays
each level's scripted delivery until the vehicle + rim are on screen, one pair
per vehicle type: `belliard`/truck (orange), `stalingrad`/car (cyan),
`vitry`/moto (magenta). `seedDeterminism` unlocks every level and freezes cops.

For each type it writes:

- `screenshots/preview-vehicle-<type>.png` — full 1280×720 frame,
- `screenshots/preview-vehicle-<type>-closeup.png` — crop around the vehicle
  (the neon-hue rim cluster located via `check-halo-gradient.mjs`, else a
  generous street-lane crop).

It is a **preview, not a gate** — it exits non-zero only if it cannot reach a
delivery at all, never on a bad-looking halo. Outputs are gitignored
(`screenshots/preview-vehicle-*.png`).

- **Input:** `PREVIEW_URL` — a running server URL including the base
  (e.g. `http://127.0.0.1:4173/prohimuf/`), same convention as `e2e-delivery.mjs`.
- **Local:** `yarn build && yarn preview` then
  `PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/preview-vehicle-halo.mjs`
  (Playwright + `@napi-rs/canvas` installed on demand:
  `npm i --no-save --legacy-peer-deps playwright @napi-rs/canvas@1.0.2`).
- **Playwright version note:** the `playwright` npm version must match the
  Chromium build already installed in the environment — a mismatched pin fails to
  launch (e.g. `playwright@1.48` breaks against a chromium-1194 revision). Prefer
  an **unpinned** `npm i --no-save playwright` locally so it resolves a compatible
  browser; the CI composite actions pin deliberately and install the matching
  browser via `npx playwright install`.
