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

| Category       | Naming pattern | Examples |
| -------------- | -------------- | -------- |
| Player sprites | `player_*`     | idle,    |

walk,
run,
crouch |
| Enemy sprites | `enemy_*` | bac,
crs,
rg,
informer |
| UI backgrounds | `bg_*` | start\*screen,
end_screen |
| Items / cargo |`item\_\_` | vinyl,
flyer,
generator_key |
| Audio | — | Manual,
not generated |

---

## Output Directory

`src/assets/generated/` — tracked in git if needed,
but gitignored by default to avoid bloat.

---

## Enemy sprite flipbook frames

Enemy archetypes carry a minimal 2-frame flip (6 fps) as **separate PNG frame
files** with an `_f<N>` suffix after the variant suffix (`enemy_shooting_2_f2.png`),
defined in the `enemies` block of `src/game/levels/levelArt.json` (ADR 0015). The
frame files flow through the pipeline unchanged: `scripts/gen-enemy-types.mjs`
reads the manifest and generates only the missing `_f<N>` files (frame 1 is the
committed accepted art, never regenerated) via kontext img2img from frame 1;
`scripts/cutout-enemies.mjs` then chroma-keys them because they match its existing
`enemy_*.png` glob; and `.github/workflows/gen-sprites.yml` commits them with **no
structural change** (the glob already covers them, committed pre-keyed files stay
skipped per ADR 0013).

---

## Future: Level Editor Assets

When the level editor is built,
tile thumbnail previews may be generated via the same pipeline,
using smaller dimensions (e.g. 64×64) for palette display.
