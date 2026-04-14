# Asset Pipeline — muf

## Generator Script

`scripts/generate-assets.mjs` — Node.js script,
 no API key required.

```bash
node scripts/generate-assets.mjs              # generate all missing assets
node scripts/generate-assets.mjs --list       # list available asset names
node scripts/generate-assets.mjs --asset <name>  # generate one asset
```

### How it works

1. For each asset definition,
 constructs a prompt string
2. Encodes prompt as URL parameter to Pollinations.ai FLUX endpoint
3. Downloads the PNG response via HTTPS
4. Saves to `src/assets/generated/<name>.png`
5. Skips if file already exists

**Rate limiting:** 5s pause between assets,
 up to 5 retries with exponential backoff (attempt × 15s per retry).

---

## Style

All prompts include the base style suffix:

```
black and white fanzine style,
 acid neon highlights,
 flat 2D game sprite,
 90s Paris rave aesthetic
```

---

## Asset Categories

| Category       | Naming pattern | Examples                    |
| -------------- | -------------- | --------------------------- |
| Player sprites | `player_*`     | idle,
 walk,
 run,
 crouch     |
| Enemy sprites  | `enemy_*`      | bac,
 crs,
 rg,
 informer      |
| UI backgrounds | `bg_*`         | start_screen,
 end_screen    |
| Tile textures  | `tile_*`       | shop,
 fire_escape,
 arch     |
| Items / cargo  | `item_*`       | vinyl,
 flyer,
 generator_key |
| Audio          | —              | Manual,
 not generated       |

---

## Generated Tile Assets

These were generated but are **not yet used** by the `TiledFacade` renderer (which draws tiles procedurally via Canvas2D):

```
tile_shop_boucherie / tabac / bar / pharmacie
tile_fire_escape
tile_arch_haussmann
tile_rooftop_zinc / chimney / antenna
tile_balcony_ironwork / plant / laundry
tile_window_lit_orange / blue / neon_green
tile_window_dark_shutters / curtain
tile_door_main
tile_wall_damp / clean / graffiti / poster / pipe
```

These assets have opaque backgrounds and do not match the procedural renderer's style. Integration would require a transparent sprite approach or a separate overlay pass.

---

## Output Directory

`src/assets/generated/` — tracked in git if needed,
 but gitignored by default to avoid bloat.

---

## Future: Level Editor Assets

When the level editor is built,
 tile thumbnail previews may be generated via the same pipeline,
 using smaller dimensions (e.g. 64×64) for palette display.
