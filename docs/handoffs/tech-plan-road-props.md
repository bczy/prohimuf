# Tech plan — road-props gptimage remake

Story: replace the 8 procedural near-foreground road props (ADR-0047) with GENERATED
sprites via the gptimage pipeline, keeping the traffic-light animation.
Branch: `claude/road-props-gptimage-remake` (off `origin/main`).
Author: Winston (senior-architect). Status: **plan frozen, ready for lane fan-out.**

## Tech plan (Winston)

### Core principle

Housing plane **never animates**; overlay plane **always animates**. Every generated PNG
(and every procedural fallback) is a **static grey B&W housing**. The traffic light's
coloured lit lens + halo is the ONE directed C1 exception and lives on a **separate
render-side overlay texture** driven by the existing pure `trafficSignal` clock. World
sizing (`NEAR_KIND_SPECS` aspect/heightFrac, plane math, parallax, non-occlusion caps)
**stays in code, byte-for-byte** — placement and its tests do not move. Generation adds
inputs + registration knobs only.

Invariant that keeps the loading gate unbreakable: `warmNearForegroundTexture(kind)`
**synchronously builds+caches the procedural CanvasTexture first**, THEN async-loads the
PNG and swaps on success. A missing/404/uncommitted PNG degrades to the procedural texture
— never null, never a stall. This is why we **keep the `nearfg:<kind>` manifest scheme**
(decision 2): it is the one dispatch point that guarantees the fallback is wired; switching
the manifest to a real `assets/…png` URL would route through `warmImage` (HTTP-cache prime
only) and lose the guaranteed fallback + overlay wiring, for a larger diff.

---

### Decision 1 — `nearForegroundArt` family block schema (levelArt.json)

New **top-level** art-family block, sibling of `vehicles`/`enemies`/`courier`/`hostages`.
Named `nearForegroundArt` (NOT `nearForeground`) to avoid confusion with the existing
per-level `levels[].nearForeground` layer (factor + placement objects), which is untouched.

```jsonc
"nearForegroundArt": {
  "$comment": "Generated near-foreground décor prop sprites (ADR-0049, amends ADR-0047 code-drawn → generated-with-procedural-fallback). Single source of truth for scripts/gen-nearfg-sprites.mjs. House style: strict GREY B&W photocopied-fanzine décor (art law C1 — décor is grey; ZERO colour). gptimage-large on flat magenta #FF3CDC chroma ground, chroma-keyed + luma-desaturated. Files: public/assets/nearfg/<kind>.png. World sizing (aspect/heightFrac, plane math) stays in code (src/render/scene/nearForegroundArt.ts NEAR_KIND_SPECS) so placement + tests do not move; this block carries ONLY generation inputs + render registration knobs. Per-type `size` sets the GENERATED texture pixel dims (width = round(512*aspect)); it must match NEAR_KIND_SPECS aspect (pinned by nearForegroundArt.consistency test) so the plane never distorts. The trafficLight PNG is a DEAD-lens grey housing; the coloured lit lens + halo is a render-side overlay (the one directed C1 exception) anchored via `lenses` (normalized [0..1] over the texture, y-down, TUNED at the art gate against the real PNG — pattern: enemies muzzle anchors). Missing/uncommitted PNG ⇒ render falls back to the procedural CanvasTexture, so the loading gate never breaks.",
  "opening": "Flat 2D video game sprite, strict side view in orthographic projection, single object centered and fully visible, ",
  "style": ", clean bold comic book ink illustration, three-tone cel shading grey black and white, thick clean black outline, flat evenly filled shapes, strictly monochrome greyscale, no colour, isolated on a perfectly flat solid uniform bright magenta #FF3CDC background, empty flat magenta backdrop, no ground, no cast shadow, no text, no logo, no writing, no signature",
  "types": {
    "parkingMeter":    { "asset": "assets/nearfg/parkingMeter.png",    "size": { "width": 256, "height": 512 }, "seed": 6101, "prompt": "<silhouette-only, from flux-prompt>" },
    "lamppost":        { "asset": "assets/nearfg/lamppost.png",        "size": { "width": 256, "height": 512 }, "seed": 6102, "prompt": "…" },
    "wallaceFountain": { "asset": "assets/nearfg/wallaceFountain.png", "size": { "width": 282, "height": 512 }, "seed": 6103, "prompt": "…" },
    "trafficLight":    {
      "asset": "assets/nearfg/trafficLight.png",
      "size": { "width": 225, "height": 512 },
      "seed": 6104,
      "prompt": "a French vehicle traffic signal in strict side profile, slim mast, a tall 3-aspect vehicle head up top and a 2-aspect pedestrian head lower down cantilevered toward the road on short brackets, each round lens under a curved hood, ALL LENSES DARK AND UNLIT",
      "lenses": {
        "vehicle": [
          { "x": 0.29, "y": 0.10, "rx": 0.11, "ry": 0.035 },
          { "x": 0.29, "y": 0.24, "rx": 0.11, "ry": 0.035 },
          { "x": 0.29, "y": 0.38, "rx": 0.11, "ry": 0.035 }
        ],
        "ped": [
          { "x": 0.34, "y": 0.62, "rx": 0.14, "ry": 0.05 },
          { "x": 0.34, "y": 0.80, "rx": 0.14, "ry": 0.05 }
        ]
      }
    },
    "bollard":    { "asset": "assets/nearfg/bollard.png",    "size": { "width": 307, "height": 512 }, "seed": 6105, "prompt": "…" },
    "scooter":    { "asset": "assets/nearfg/scooter.png",    "size": { "width": 768, "height": 512 }, "seed": 6106, "prompt": "…" },
    "bench":      { "asset": "assets/nearfg/bench.png",      "size": { "width": 870, "height": 512 }, "seed": 6107, "prompt": "…" },
    "streetSign": { "asset": "assets/nearfg/streetSign.png", "size": { "width": 384, "height": 512 }, "seed": 6108, "prompt": "…" }
  }
}
```

`size.width` per kind = `round(512 * NEAR_KIND_SPECS[kind].aspect)` (parkingMeter 0.5→256,
lamppost 0.5→256, wallaceFountain 0.55→282, trafficLight 0.44→225 (**corrected** —
the schema block above originally showed 226, an arithmetic slip caught in the stage-6
panel triage; `round(512*0.44)=225`, aligned with `NEAR_KIND_SPECS.trafficLight.aspect`),
bollard 0.6→307, scooter 1.5→768, bench 1.7→870, streetSign 0.75→384). `lenses` anchors
seeded from the
current procedural geometry (`drawTrafficLight`/`drawSignalHeadProfile`/`drawProfileLamp`)
and **re-tuned at the art gate** once the real PNG lands. Prompts drafted via the
**flux-prompt** skill (concept-artist), gated by lead-art — silhouette-only, positively
described, colour baked out.

### Decision 2 — texture path (nearForegroundTextures.ts)

Keep the `nearfg:<kind>` manifest scheme; `assetManifest.ts` and `assetManifest.test.ts`
**unchanged**. Changes are internal to `nearForegroundTextures.ts`:

- `warmNearForegroundTexture(kind): Promise<void>` becomes async-with-guaranteed-fallback:
  1. `ensure(kind)` — build+cache the procedural CanvasTexture (today's `build`) if absent.
     Guarantees `getNearForegroundTexture(kind)` is non-null from this tick on.
  2. Resolve the PNG URL from the block: `${BASE_URL}${nearForegroundArtAsset(kind)}`
     (accessor in decision 5). Load via a shared `TextureLoader`; `applyPixelFilter`; on
     **success** replace the cache entry (dispose the procedural one); on **failure**
     (404/uncommitted/non-DOM) keep the procedural entry. Always resolves.
- `getNearForegroundTexture(kind)` unchanged in shape: returns the cached texture (loaded
  PNG once swapped, else procedural), builds procedural on demand if the gate never warmed.
- Cache stays `Map<NearForegroundKind, Texture>` (widen from `CanvasTexture` to `Texture`
  since a loaded PNG is a `Texture`). Mirror `enemyTextures.ts` `pending`/`failed` guards so
  a per-frame `getNearForegroundTexture` can't re-issue the same load.

### Decision 3 — traffic-light animated overlay

Generated art = dead-lens grey housing. Split the lit-lens drawing OUT of the housing path
into a pure overlay drawer, rendered on a second co-located plane.

- `nearForegroundArt.ts` (pure Canvas2D): `drawTrafficLight` stops drawing lit lenses and
  drops its `SignalState` param — it draws the housing with **dead lenses only** (near-black
  discs). New pure export:
  `drawSignalLenses(g, texW, texH, lenses: SignalLenses, state: SignalState): void` — clears,
  then for each of the 5 anchors draws lit (`SIGNAL_LIT[i]` + halo) or dead/transparent per
  `state`. `SIGNAL_LIT`/`SIGNAL_HALO`/`lensHalo` and the profile-lamp/pictogram helpers move
  here (still pure). `drawNearForegroundObject` loses `DrawNearForegroundOptions.signal`
  (only trafficLight used it; housing is now signal-independent).
- `nearForegroundTextures.ts`: new overlay texture, transparent background, sized to the
  trafficLight `size` (aspect 0.44). Retains `canvas/ctx/tex` at module scope for in-place
  repaint (same pattern the whole-prop texture used). `updateTrafficLightSignal(signal)`
  now repaints the **overlay** only (calls `drawSignalLenses` with the anchors from the
  block) and flips `needsUpdate`. New `getTrafficLightOverlayTexture(): Texture | null`.
- `NearForeground.tsx`: when a `trafficLight` prop is placed, render TWO meshes at the same
  `worldX/centerY/planeW/planeH`: the housing (renderOrder as today) and the overlay
  (`z + 0.001` so it sorts in front within the same renderOrder; still `renderOrder 5`, so
  BELOW courier 6 / delivery van 7 — finding #8 non-occlusion preserved). The frame loop's
  `lastSignalKey`/`updateTrafficLightSignal` gate is unchanged; reduced-motion still freezes
  on `DEFAULT_SIGNAL`.

**Anchor schema** (`SignalLenses`): `{ vehicle: LensAnchor[3]; ped: LensAnchor[2] }`,
`LensAnchor = { x, y, rx, ry }` normalized [0..1] over the texture, y-down, top-left origin
(same convention as enemy `muzzle`). `vehicle` order = red, amber, green; `ped` = stand(red),
walk(green). Missing/short/malformed `lenses` ⇒ overlay drawer degrades to a fixed-fraction
fallback (never crashes) — mirror `muzzleFor`'s optional degradation.

### Decision 4 — generation lane

- **Refactor** `gen-gptimage-asset.mjs` internals into `scripts/lib/gptimage.mjs`:
  `readToken()` (**`POLLINATIONS_TOKEN` env first, then the remote-session scratchpad file
  as local fallback, then throw** — fixes the hardcoded-path reuse defect), `genUrl`,
  `withRetry`/`fetchImg`, and `keyAndDown(buf, { targetW, targetH, keepColor })`
  parameterized for **non-square** output (currently square `SIZE`). `gen-gptimage-asset.mjs`
  becomes a thin CLI over the lib (behaviour-compatible; `--keepcolor`/`--tail` preserved).
- **New** `scripts/gen-nearfg-sprites.mjs`: reads `nearForegroundArt` from levelArt.json
  (prompts/seed/asset/size per kind), assembles `opening + prompt + style`, calls the lib
  with `targetW/targetH` from each kind's `size`, luma-desaturate ON (grey décor, no
  `--keepcolor`), writes `public/assets/nearfg/<kind>.png` + cyan preview. Only-missing by
  default; `FORCE=1` regenerates all; `--asset <kind>` for one. **CI-only** for real art
  (gptimage-large is premium/Pollen; no local token on this machine) — no on-disk
  placeholder needed because the render's procedural texture IS the placeholder.
- **New** `.github/workflows/gen-nearfg-sprites.yml` modeled on `gen-vehicle-sprites.yml`:
  `workflow_dispatch` + `push` on `.github/dispatch/gen-nearfg-sprites` (guarded by the
  `ci(dispatch):` head-commit check), `POLLINATIONS_TOKEN` env → lib `readToken()`, a
  **grey/C1 style gate** (assert near-zero saturation — the inverse of the vehicle neon
  check; extend `check-sprite-style.mjs` with a `nearfg` mode or add
  `scripts/check-nearfg-style.mjs`) with bounded regen retry, then commit
  `public/assets/nearfg/*.png`. Add `.github/dispatch/gen-nearfg-sprites` marker.
- **check-art-prompts.mjs**: new `checkNearForegroundArt()` + register the `--set
nearForeground` and include it in the default all-sets run (validate opening/style
  present, per-kind prompt non-empty, asset path exactly `assets/nearfg/<kind>.png`,
  no colour/neon token in the assembled grey prompt, `size` present).

### Decision 5 — lane split (non-overlapping paths)

| Lane                   | Owns (writes)                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **dev-tooling-assets** | `scripts/lib/gptimage.mjs` (new), `scripts/gen-gptimage-asset.mjs` (thin CLI refactor), `scripts/gen-nearfg-sprites.mjs` (new), `scripts/check-art-prompts.mjs` (new set), grey style gate script/mode, `.github/workflows/gen-nearfg-sprites.yml`, `.github/dispatch/gen-nearfg-sprites`, **`src/game/levels/levelArt.json` `nearForegroundArt` block** (generation source of truth, same as other family blocks) |
| **dev-r3f-render**     | `src/render/scene/nearForegroundArt.ts`, `src/render/scene/nearForegroundTextures.ts`, `src/render/scene/NearForeground.tsx`, **`src/game/levels/levelArt.ts` type additions + accessors**                                                                                                                                                                                                                         |

**Shared seam (my sign-off, frozen here as the contract both lanes build to):**

1. `levelArt.json` `nearForegroundArt` block — **written by tooling**, read by render via a
   typed accessor. Schema is frozen in decision 1; neither lane edits the other's side.
2. `src/game/levels/levelArt.ts` — **assigned to dev-r3f-render** (tooling only READS the
   JSON, render needs the typed accessor + consumes it). Add: `NearForegroundArtType`,
   `SignalLenses`/`LensAnchor` types, and accessors `nearForegroundArtAsset(kind): string`
   and `trafficLightLenses(): SignalLenses` (both reading the untyped JSON with the same
   source-hardening style as `getNearForeground`). This is the game/render boundary
   crossing → recorded here, not re-litigated.
3. No two lanes touch the same file. `levelArt.json` (tooling) and `levelArt.ts` (render)
   are distinct files → parallel-safe. Serialise nothing.

### Decision 6 — ADR

New ADR amending ADR-0047's "code-drawn décor" decision to **generated-with-procedural-
fallback**. **Candidate number 0049** (highest on `origin/main` + index = 0048) — but do
NOT hand-write it: **producer/tech-writer allocate via the `adr-new` skill** (checks
local + index + origin/main together, guards the duplicate-number bug). Draft as
**Proposed**. Skeleton content (deciding lane = me; scaffolding/number = adr-new):

- **Context**: ADR-0047 shipped 8 code-drawn (Canvas2D) grey props + an animated
  code-drawn feu tricolore. We now have the gptimage pipeline (magenta chroma, comic-ink
  house style); generated sprites read richer than procedural silhouettes.
- **Decision**: props are **generated PNGs** (`public/assets/nearfg/<kind>.png`) from the
  new `nearForegroundArt` block; the **procedural Canvas2D drawers are retained as the
  synchronous fallback** (missing/uncommitted PNG ⇒ procedural texture; loading gate never
  breaks). The traffic light's animated coloured lens+halo moves to a **render-side overlay
  texture** anchored via normalized `lenses` (the one C1 exception; housing art stays grey).
  World sizing + placement + parallax + non-occlusion stay in code unchanged.
- **Consequences**: +1 CI generation lane (premium Pollen), +1 grey style gate; procedural
  code stays as fallback (not deleted); `nearfg:` manifest scheme retained;
  `trafficSignal` clock unchanged.
- **Supersedes/amends**: ADR-0047 (partial — décor rendering source only).

### Test impact (keep green + new coverage)

- **`nearForeground.test.ts`** (game/levels): the frozen `getNearForeground` seam
  (factor/objects/opt-out) is **untouched** — must stay green as-is. dev-r3f-render adds a
  sibling **`nearForegroundArt.consistency`** test: for every `NEAR_KIND_SPECS` kind the
  JSON `nearForegroundArt.types[kind]` exists, `asset === assets/nearfg/<kind>.png`, and
  `size.width/size.height ≈ NEAR_KIND_SPECS[kind].aspect` (pins the no-distortion seam +
  the aspect duplication).
- **`assetManifest.test.ts`**: `ASSET_RE` still matches `nearfg:<kind>` (scheme kept) —
  **no change, must stay green.**
- **`trafficSignal.test.ts`**: pure clock unchanged — **must stay green.**
- **`foregroundArt.test.ts`**: unrelated (`clusterZonesByBuilding`/`buildingIronStyle`) —
  unaffected.
- **New (dev-r3f-render)**: `drawSignalLenses` unit test (lit index ↔ colour per aspect,
  malformed/short `lenses` degrades not crashes), housing draws no colour (C1). `Texture`
  cache swap + 404-fallback behaviour of `warmNearForegroundTexture`.
- **New (dev-tooling-assets)**: `gptimage.mjs` lib tests (token env-before-scratchpad
  precedence, non-square `keyAndDown` dims), `check-art-prompts` nearForeground-set
  fixtures, gen-nearfg dry-run/`--list`.

### Verify + gate

VERIFY (qa-lead): tsc + vitest + lint, then `verify` on both device classes (props read as
grey décor; traffic light cycles green→amber→red with ped interlock; overlay aligned to the
housing lenses; mobile density halving intact). gpu-specialist perf check is low-risk (one
extra small transparent quad only when a trafficLight is on-screen). Composite gate for the
generated grey art (lead-art C1: strictly grey, dead lenses). Merge via the mandatory
4-reviewer **review-panel** → my triage/sign-off → pm accept.
