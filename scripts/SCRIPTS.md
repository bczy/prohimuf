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

## align-windows.mjs — Window-alignment harness (all levels)

Detect-and-correct harness that keeps every level's cop window zones lined up with
the real lit windows of its facade art. The shipped zones were regular grids, but
the AI facades are **not** clean grids — so cops overflowed their window openings
and some slots sat on bare wall while lit windows had no cop (Bertrand: _"plein de
sprites dépassent des fenêtres; des fois il n'y a rien devant les fenêtres"_).

Unlike `gen-window-zones.mjs` (which _snaps_ a fixed grid onto warm light and can
still land between real windows), this harness **detects the real windows** from
the art, then drives the **live production render** to place one non-overflowing
cop in each, looping on measured defects until zero. It accepts one or more level
ids (default = every playable level: `belliard`, `stalingrad`, `vitry`).

- **Detection** (`public/assets/levels/<id>/facade.png`, JPEG despite `.png`),
  adapts per level (see `LEVEL_CFG` in the script):
  - **Floor rows.** `belliard` keeps its proven **equal-thirds** split of the
    residential band (⇒ its shipped 17-zone / 5-5-7 result is reproduced
    exactly). Every other level uses **run-based** row detection: a per-row
    warm-density profile over the gameplay band (`windowGrid.top/bottom`),
    smoothed and **top-hat detrended** (rolling-min baseline removal, so a dim top
    floor still splits from a bright shallow valley below it), thresholded into
    contiguous warm **runs** whose centroids are the floor centres. Robust to
    however many floors a facade has (stalingrad ~3, vitry ~8 — never assumed).
  - **Windows per row.** A warm column-density profile whose above-threshold runs are
    the lit windows, refined in four steps: **(1) hysteresis expansion** — each
    high-threshold run grows outward while the profile stays on a LOW shoulder
    (`sm ≥ HYST_LOW·thr`, `HYST_LOW = 0.45`, `cfg.hystLow`), bounded by the neighbour and
    a `splitPitch·W` cap, so a dim second pane below `colThresh` rejoins its bright twin;
    **(2) twin-merge** of adjacent panes; **(3) valley split** — a run holding two+ density
    peaks separated by a valley `< VALLEY_FRAC·min(peaks)` (`VALLEY_FRAC = 0.4`,
    `cfg.valleyFrac`) splits at the valley (recursively), UNLESS the two sub-runs are
    narrower than `minRunW·W` or their midpoints are closer than `minPitch·W` (the mullion
    guard — two panes of one french window stay merged); **(4) pitch-split** of any still
    over-wide run as a fallback. One opening per real, **visible** window; dark/ambiguous
    windows are intentionally not invented (a zone on unlit wall is itself a defect). Each
    opening carries a **measured centre + width** from its run bounds — `w = (x1−x0)/W`,
    `x = (x0+x1)/2/W`, the geometric **MIDPOINT** (NOT the glow-biased centroid) — clamped
    to `[0.55, 1.6]·openingW` around the per-level seed. `openingW` is only a **fallback
    seed** (the clamp band, and the width when a run has zero warm mass). When the width
    clamps to the floor, a `[align:<id>] clamped run …` warning prints — this is
    **informational** (a lit window narrower than the seed, framed at the railing minimum),
    not a defect.
  - **Coverage audit (detection-vs-art).** Before zones are built, each opening is checked
    against the **art** (not the detected run) via exterior/interior warm-density strips
    (see UNDERCOVER/OVERCOVER below); a flagged opening is re-derived directly off the
    facade in its own vertical band (trim-to-warm: union the lit runs the frame overlaps,
    dropping edge-wall / pulling in a dim adjacent pane), accepted only when it strictly
    reduces the opening's defect count. This is the correction path — the fix is on the
    opening, since `zone.x`/`zone.w` are built straight from it.
- **Correction loop:** boot a served prod build headless (reusing `e2e-lib.mjs` —
  SwiftShader, `seedDeterminism` freezes one static cop per slot), push candidate
  zones via `window.__MUF_ZONES__` + `__MUF_APPLY_ZONES__()`, read each rendered
  sprite box via `__MUF_SLOT_RECTS__()`, and tune each zone's **h** (sprite size,
  ~88% of the opening height) and **y** (centre the down-shifted box), 1:1 with the
  openings. `zone.x`/`zone.w` are built straight from the **measured** opening centre
  and width (framing the foreground railing), so `--fix` frames are aligned by
  construction — there is no snap step; `MISALIGN` is a `--check`-time gate against
  drifted committed data. The h→(size,y) map is **calibrated from the first render**, so
  it stays correct if the render layout changes.
- **Output:** overwrites **only the target level's key** of
  `src/game/levels/windowZones.generated.json` (4 identical panels — each facade is
  one image tiled ×4); the other levels are left byte-identical. Each iteration
  writes a proof overlay `scripts/.dbg-<id>-align-*.jpg` (gitignored; detected
  openings green, rendered slot rects magenta, overflow red) — open it to confirm
  every opening is a real window and every sprite frames inside.

### Modes

```bash
# --fix (default): detect → correct → write zones + proof overlays, exit 0 on success
PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/align-windows.mjs           # all levels
PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/align-windows.mjs stalingrad vitry
yarn align                 # all levels
yarn align:belliard        # belliard only (node scripts/align-windows.mjs belliard)

# --check: measure the committed zones only, write nothing, exit 1 on any defect (CI gate)
PREVIEW_URL=http://127.0.0.1:4173/prohimuf/ node scripts/align-windows.mjs --check    # all levels
yarn align:check
yarn align:belliard:check
```

### Defects it detects & the success condition

- **OVERFLOW** — a rendered sprite box not contained (`⊆`, +τ=0.01) in its window.
- **COUNT** — a panel's zone count ≠ its detected window count.
- **EMPTY** — a detected window with no zone centre in it.
- **WALL** — a zone centre on bare wall (low local warm-density, no opening nearby).
- **MISALIGN** — the applied railing frame (`zone.x`/`zone.w`) off its measured opening,
  checked **per edge**: the frame's left (`x−w/2`) and right (`x+w/2`) edges must each sit
  within `ALIGN_TOL = 0.012` (normalized ≈ 15 px on 1280) of the opening's edges. Reasons:
  `MISALIGN(left)` / `(right)` / `(left+right)` for a drifted edge, `MISALIGN(nan)` for a
  non-finite input, `MISALIGN(count)` when a panel's zone count ≠ the detected opening
  count. Zones pair to openings **1:1 by index** (shared construction order), and the pass
  runs over **every one of the 4 committed panels** in `--check` (not just panel 0). Every
  line is prefixed `panel N:`. The pure per-edge check lives in
  `scripts/lib/alignment.mjs` (`misaligned`), unit-tested in
  `scripts/lib/__tests__/alignment.test.mjs`.
- **UNDERCOVER / OVERCOVER** — the applied frame measured against the **ART** itself, not
  the detected opening (the axis `MISALIGN` is blind to: a detection MIS-measurement leaves
  zone == opening, so it converges green while visually wrong). For each frame edge, warm
  density is sampled in an **exterior** strip just outside the edge and an **interior** strip
  just inside it (rectangular sampler; the WALL check keeps its 0.03×0.05 point sampler).
  `UNDERCOVER(left|right)` when the exterior strip `≥ UNDERCOVER_DENS = 0.28` (the lit window
  continues past the edge — the frame covers too little, e.g. one pane of a double);
  `OVERCOVER(left|right)` when the interior strip `< OVERCOVER_DENS = 0.07` (the edge sits on
  unlit wall — the frame is too wide / straddles a gap). Exterior strips are bounded by the
  neighbouring frame in the same row so they never read an adjacent window; `OVERCOVER` is
  **suppressed at the floor width** (a minimum-size railing legitimately overhangs a
  sub-floor window — never a straddle, which is always well above floor width; the haussmann
  railing template's fixed ~5% overhang is outside `zone.w` and so outside the interior
  strip). Pure helpers `coverStrips` (geometry + neighbour bounding) and `coverDefects`
  (verdict from precomputed strip densities) live in `scripts/lib/coverage.mjs`, unit-tested
  in `scripts/lib/__tests__/coverage.test.mjs`. Checked over all 4 panels in `--check`,
  prefixed `panel N:`.

SUCCESS = 0 defects across all 4 panels of every requested level. Exit non-zero
while any defect remains.

### Setup

- Expects a server already serving the production build at `PREVIEW_URL`
  (`node_modules/.bin/vite build` then `node_modules/.bin/vite preview --port 4173
--strictPort`). Because the zones JSON is bundled at **build time**, rebuild
  before `--check` reads the committed zones live.
- **Requires:** `jpeg-js` (`npm i --no-save --legacy-peer-deps jpeg-js`) and
  `playwright` (`ln -s /opt/node22/lib/node_modules/playwright node_modules/playwright`)
  — same install pattern as the other e2e scripts.

> **Slot-count note (game-designer / lead-art sign-off):** detecting the real lit
> windows changed the per-panel slot counts — **belliard 21→18** (5/6/7 after the
> iteration-2 valley split turned one over-merged pair into two windows; was 17/5-5-7),
> **stalingrad 21→12** (3/5/4 over 3 floors), **vitry 20→38** (8/3/7/3/4/5/4/4 over
> the 8 dense HLM floors). Fewer or more, but every cop now frames a real window; dark
> windows are left empty by design.

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
  `enemy_shooting_2_f2.png` = cop variant 2, shooting, frame 2 (ADR 0016).
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

## gen-hostage-sprites.mjs — QTE hostage figures (the `girl`)

Generates the hostage figures of the cinematic QTE (ADR-0030) — today the
single `girl`, the cartel boss's daughter the captor holds in front of him —
in the enemies' black-ground pixel style, then keys the flat `#000000` ground
to transparency via the **shared `cutout()` of `cutout-enemies.mjs`**.

- **Single source of truth:** the `hostages` block of
  `src/game/levels/levelArt.json` (prompt, pinned seed, size, output path per
  key). Add or tune a figure **there**, never in the script. The block lives
  BESIDE `enemies` on purpose: its keys must not enter the ARCHETYPES-derived
  `enemies.types` register (levelArt.consistency gate) — the hostage is not a
  shootable window archetype.
- **Naming contract (renderer aligns on it):**
  `public/assets/hostage/<key>.png`, loaded by
  `src/render/scene/hostageTextures.ts` (civilian-sprite fallback until the art
  lands). The `hostage/` subdirectory keeps these files out of the `enemy_*`
  batch globs (cutout/solidify).
- **CI:** `.github/workflows/gen-hostage-sprites.yml` (manual dispatch or the
  `.github/dispatch/gen-hostage-sprites` push marker + `ci(dispatch):` message)
  — generates with `FORCE=1`, solidifies (`fill-sprite-holes.mjs` + `--check`),
  gates topology (`check-sprite-integrity.mjs --file`), commits to the branch.

### Commands

```bash
# Generate missing figures via Pollinations/FLUX, then chroma-key (needs network)
node scripts/gen-hostage-sprites.mjs

# Regenerate all (overwrite), used in CI
FORCE=1 node scripts/gen-hostage-sprites.mjs

# One figure only, or list the defined figures
node scripts/gen-hostage-sprites.mjs --asset girl
node scripts/gen-hostage-sprites.mjs --list
```

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

## gen-from-reference.mjs — Ad-hoc kontext reference-conditioned iteration

Exploratory one-shot CLI (ADR-0044): drop a graphic reference, run a single
`kontext` img2img generation of a target asset **conditioned on it**, iterate.
Not a manifest-driven family generator — no `levelArt.json` entry required.

- **Reference:** `--ref` is a repo-relative path (turned into a
  `raw.githubusercontent.com` URL at `GITHUB_SHA` — Pollinations fetches it
  SERVER-SIDE, so the reference must already be **committed and pushed**) or a
  full `http(s)` URL, passed through unchanged. Convention: drop it in
  `references/` (repo root, outside `public/`, so throwaway inputs never ship
  in the deployed bundle) — see `references/README.md`.
- **Post-processing by `--family`** reuses the existing pipeline, never
  reinvented: `vehicles` → chroma-key cutout (`cutout-enemies.mjs`) then
  Rec.601 desaturation (`gen-vehicle-sprites.mjs`); `enemies` → cutout only;
  `levels` → none (full-bleed backdrops). Both post-processing steps soft-skip
  (`[cutout-skip]` / `[gray-skip]`) when `@napi-rs/canvas` is unavailable —
  the real pass runs in CI.
- **kontext fidelity is variable** against an arbitrary reference — it nudges
  style/pose, it is not a deterministic transform. Expect to iterate
  seed/prompt; some references will not lock. See `references/README.md` and
  ADR-0044 for the full caveat.
- **Network helpers** (`fluxUrl`, `kontextUrl`, `fetchImage`, `fetchWithRetry`)
  live in `scripts/lib/pollinations.mjs`, unit-tested in
  `scripts/lib/__tests__/pollinations.test.mjs` — the single source of the
  kontext URL contract, also imported by `gen-enemy-types.mjs`.

### Commands

```bash
node scripts/gen-from-reference.mjs \
  --ref references/moto-photo.jpg \
  --prompt "same silhouette, side profile, pixel art" \
  --out public/assets/vehicles/moto.png \
  --family vehicles --seed 12345 [--size 256x160] [--style ", extra style tail"]
```

A failed fetch is logged per-asset (`[fail] … (will be generated in CI)`) and
never crashes the run — network Pollinations is normally blocked in the local
sandbox; real generation runs via `.github/workflows/gen-from-reference.yml`
(manual `workflow_dispatch`, seven inputs mirroring the CLI). No style gate —
this path is exploratory; the human reviews the output in the PR/branch
preview.

---

## gen-courier-sprites.mjs — Layered courier flipbook (bike + rider)

Generates the street-courier (livreur) as a **2-layer composite** — a delivery
**bike** (wheel rotation) drawn under a **rider** (pedaling stride), composited as
two stacked planes render-side (bike below rider, ADR 0017).

- **Single source of truth:** the `courier` block of
  `src/game/levels/levelArt.json` (`opening`, `style`, `fps`, `size`, and `layers`
  keyed `bike` / `rider` with `{ asset, seed, prompt, frames, scale, offsetY }`).
  Add or tune a layer **there**, never in the script.
- **Per-frame generation (ADR 0017, amended — strips retired).** Unlike the enemy
  flip, the courier has **no protected frame 1**. Every `frames[i]` pose clause
  becomes ONE dedicated FLUX image (`opening` + `prompt` + `, ` + clause +
  `style`) under the layer's **single pinned seed** — the whole subject appears
  in every image, nothing is sliced out of a larger picture. Each PNG is then
  chroma-keyed per file by importing `cutout()` from `cutout-enemies.mjs`.
- **Atomic layer.** A layer is skipped only when **all** its frame files exist and
  `FORCE !== 1`; if **any** frame is missing (or `FORCE=1`) **all** its frames
  regenerate together (loud `[regen-all]` log — shared-seed consistency). All
  frame buffers are collected before any file is written — a failed fetch never
  leaves a half-written layer.
- **Frame files:** frame 1 unsuffixed `<layer>.png`, frame N≥2 `<layer>_f<N>.png`,
  under `public/assets/courier/`.
- **Output:** `public/assets/courier/{bike,rider}*.png`.

### Commands

```bash
# Generate missing layers via Pollinations/FLUX + chroma-key (needs network + canvas)
node scripts/gen-courier-sprites.mjs

# Regenerate ALL layers (overwrite), used in CI
FORCE=1 node scripts/gen-courier-sprites.mjs

# Restrict to one layer (art-gate iteration, e.g. bike-first sequencing)
FORCE=1 node scripts/gen-courier-sprites.mjs --layer bike

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
- **CI:** the `gen-sprites.yml` gate step was **removed** (ADR-0029). It was
  **scoped to `enemy_civilian.png`**, which has since been **retired** (the courier
  renders from the committed rider flipbook), so the step would only fail on the
  missing file. The script is kept as generic infrastructure — re-wire the gate only
  after calibrating it against a new target (extending to the whole set is a separate
  story: the other committed enemy sprites carry accepted keying debris a blanket gate
  would false-fail).

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

> **Note (ADR-0029):** this script's original target, `enemy_civilian.png`, was
> retired (the courier now renders from the committed rider flipbook). The script is
> kept as generic per-sprite retouch infrastructure; calibrate a new `RETOUCH_SPECS`
> spec before running it against a new sprite.

```bash
node scripts/retouch-sprites.mjs                 # retouch every known sprite
node scripts/retouch-sprites.mjs <sprite>.png    # one sprite by basename
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

## retouch-courier-spokes.mjs — Courier wheel rotation (scripted retouch)

FLUX draws a consistent subject per frame (pinned seed) but refuses legible
tri-spoke mag wheels and re-rolls small details between frames. This
game-graphist pass derives **every** frame of each courier layer from its
single FLUX base: the two wheel discs are detected (dark-pixel centroids in two
x-windows) and three bold spokes are drawn per wheel, rotated per frame across
a 120° period — identical sprite everywhere, zero flicker. Layers: **rider**
(the shipped full-cyclist sprite, 6 frames at 20° steps, dark-outlined pale
spokes) and **bike** (validated spare art, 3 frames at 40° steps). A layer with
no base PNG on disk is skipped. Deterministic and idempotent; runs in CI right
after generation + cutout.

```bash
node scripts/retouch-courier-spokes.mjs   # requires @napi-rs/canvas
```

## fill-sprite-holes.mjs — Enemy figure SOLIDIFY pass (scripted retouch + gate)

The chroma-key cutout keys the background AND clears ground fully walled in by the
subject (ADR-0013 enclosed-island pass). Where a character wears DARK clothing that
matched the near-black key ground, the keyer ate those pixels and left the figure
**POROUS** — see-through gaps in the legs/torso, speckles, a leg opening a window to
the sky. Iteration 1 filled only fully-enclosed voids; Bertrand's direction gate
("encore trop de transparence") rejected it because the porosity is also reachable
through **border-connected** transparency (a gap that opens to the outside, or a bust
sprite cut at the waist whose torso void drains through the bottom edge). Mandate:
**"everything solid"** — the figure body ships opaque, no see-through.

This game-graphist pass reconstructs and fills the body deterministically, **no FLUX
regeneration**, in two passes on every `public/assets/enemy_*.png`:

- **PASS A — solidify.** Build the solid body mask morphologically: `opaque = alpha>=16`
  plus a **selective bottom-row seal** — sealed ONLY in columns where the figure is
  genuinely frame-cut (opaque within 2px of the bottom edge, i.e. a bust sprite), NEVER
  the whole x-extent (which would annex bottom-open background: the triangle between a
  shooter's spread legs, the slivers under the feet). Then
  `binary_fill_holes(binary_closing(sealed, DISK r=10))` (a **disk**
  structuring element bridges the keyed-out gaps), keep the largest connected component,
  erode by **DISK r=1** (anti-halo). Fill every transparent pixel inside that mask with
  the **dark-clothing tone** = median RGB of the opaque pixels below the figure's median
  luminance.
- **PASS B — mop-up.** Re-run the iteration-1 enclosed-region fill (border flood; each
  leftover enclosed region gets its opaque-boundary-mean colour) to catch small enclaves.

**Cardinal rule — fill only, never reshape.** Both passes only turn transparent pixels
(`alpha < 16`) opaque; a built-in self-check asserts every originally-opaque pixel
(`alpha >= 16`) is **byte-identical** and ABORTS the write otherwise. Deterministic and
idempotent (a second run fills 0 px). Runs in CI right after generation + cutout, before
the commit — with a `--check` gate that FAILS the job if either pass would still fill
anything (Bertrand's validation condition: no enemy character may ship porous).

```bash
node scripts/fill-sprite-holes.mjs          # solidify every enemy_*.png (PASS A + PASS B)
node scripts/fill-sprite-holes.mjs --check  # gate: write nothing, exit 1 if any px would fill
```

- **Requires:** `@napi-rs/canvas` (same install pattern as `cutout-enemies.mjs`).

---

## measure-muzzle-anchors.mjs — Per-frame muzzle-flash anchors (levelArt.json data)

Measures where the baked muzzle flash sits on each **shooting** enemy sprite and
writes a per-frame `muzzle` anchor into the `enemies` manifest, so the render-side
additive glow lands on the gun barrel regardless of which way the sprite aims (the
flash flips left/right between archetypes and shifts on the recoil frame). The
renderer reads it via `muzzleFor()` in `src/render/scene/enemyTextures.ts` and falls
back to a fixed right-side offset when a frame has no anchor.

- **Data written:** for every `enemies.types.<key>` whose key contains `shooting`,
  an OPTIONAL `"muzzle": [ { "x": .., "y": .. } | null, … ]` array in
  `src/game/levels/levelArt.json`, **index-aligned with `frames`** (element _i_
  anchors frame _i+1_ — file `<key>.png`, then `<key>_f2.png`, …). Anchors are
  normalized `[0..1]` of the PNG width/height from the **top-left** corner, rounded
  to 3 decimals; `null` = no detectable flash for that frame. Array length always
  equals the entry's `frames` length. Non-shooting entries are never touched.
- **Detection:** hot pixels = the near-white-hot flash core
  (`alpha>100 AND r>235 AND g>220 AND b>150`); take the LARGEST 8-connected
  component (`>= 50 px`, else emit `null`); anchor = its unweighted centroid / (W,H).
- **Surgical + idempotent:** the JSON is edited by string insertion of just the
  `muzzle` property (a full `JSON.parse`→`stringify` round-trip would rewrite
  unrelated literals like `"scale": 1.0`), then `prettier --write` normalizes it — so
  a re-run is byte-identical. Deterministic detection makes it re-runnable.
- **Human-run, not a CI gate** (like `retouch-sprites.mjs` / `retouch-flash-halos.mjs`):
  re-run it after regenerating any shooting sprite, then commit the JSON.

```bash
node scripts/measure-muzzle-anchors.mjs            # measure + write muzzle arrays in place
node scripts/measure-muzzle-anchors.mjs --dry-run  # print the anchor table, write nothing
node scripts/measure-muzzle-anchors.mjs --preview  # also write a marked verification sheet
PREVIEW_DIR=/tmp node scripts/measure-muzzle-anchors.mjs --preview  # override sheet output dir
```

- **Requires:** `@napi-rs/canvas` (same install pattern as `cutout-enemies.mjs`).

---

## lib/morphology.mjs — Shared binary-image morphology primitives

The ONE source of truth for the geometric mask primitives the sprite-retouch pipeline
shares (extracted per ADR-0014 / ADR-0019 to kill the hand-copied duplicates and the
"re-sync if that script's morphology changes" desync class). Pure functions over a mask
= `Uint8Array` of length `W*H`, row-major (`idx = y*W + x`), values `0|1` (not bit-packed);
the lib never touches RGBA / alpha — callers build the opaque predicate / mask. No I/O, no
`@napi-rs/canvas` dependency, so it imports cleanly into a Vitest suite.

- **Exports:** `diskOffsets(r)`, `dilate(mask,W,H,offsets)`,
  `erode(mask,W,H,offsets,opts)` (with `opts.outsideBelowBottom` — the ONE geometric
  divergence, used only by `fill-bust-hem.mjs` for its frame-cut hem), `fillHoles(mask,W,H)`
  (4-conn border-seeded), `largestComponent(mask,W,H)` (4-conn only, by design),
  `labelComponents(W,H,keep,opts)` (`opts.connectivity` 4|8, `opts.collectPixels`) →
  `{size,bbox,touchesBorder,pixels?}[]` largest-first, `zoneMask(zones,W,H)` (array of
  normalized rects), `solidBodyMask(opaque,W,H)` (fill-sprite-holes PASS-A body
  reconstruction), and the read-only constants `CLOSE_R` / `ERODE_R` / `SEAL_MARGIN`.
- **Consumers:** `fill-sprite-holes.mjs` (reference — owns `solidBodyMask`'s caller loop),
  `retouch-flash-halos.mjs` (its whole mirrored PASS-A block is gone — it now imports the
  same `solidBodyMask`, so the two can no longer drift), `restore-figure-bites.mjs`,
  `fill-bust-hem.mjs`, `check-sprite-integrity.mjs` (4-conn labelling, deliberate),
  `measure-muzzle-anchors.mjs` (8-conn labelling, deliberate). `cutout-enemies.mjs` keeps
  its flood LOCAL on purpose — it is fused with per-component colour sampling and does not
  map onto the pure mask primitives.
- **Connectivity is explicit at every call site** (no hidden default that masks intent),
  each with a comment stating 4 vs 8 and why.
- **Behaviour is FROZEN.** The primitives are verbatim lifts; any change rewrites committed
  sprite bytes. The binding oracle is the `--check` fixpoint of every retouch script on the
  22 enemy PNGs plus the `measure-muzzle-anchors` levelArt.json byte-diff — never edit this
  module without re-proving them.
- **Tests:** `scripts/lib/__tests__/morphology.test.mjs`, wired into `yarn test` via
  `test.include` in `vitest.config.ts` (`scripts/lib/**/*.test.mjs`). `coverage.include`
  stays scoped to `src/game/**`, so this module does not affect coverage thresholds.
