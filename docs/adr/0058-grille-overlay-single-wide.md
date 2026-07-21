# 0058 — Grille overlay on single-wide backdrop (foreground.png window grilles)

- **Status:** Accepted
- **Date:** 2026-07-21
- **Number:** 0058, self-allocated (no `producer` in the loop on this orchestration; highest
  prior ADR was 0057, checked against local files, the index, and `origin/main` together per
  the `adr-new` skill), re-check at merge.
- **Amends:** ADR-0057 §3 and §4.

## Context

ADR-0057 moved Rue Belliard onto the `single-wide` backdrop: the whole décor — sky,
buildings, street, **and the balcony grilles** — baked into one opaque `street-wide.png`
plane. On that premise ADR-0057 made two calls:

- **§3** — the separate `foreground` layer is "never loaded" on single-wide;
- **§4** — the code-drawn `ForegroundFrames` ironwork overlay is **suppressed** on
  single-wide, because "the drawn décor already paints its own balconies and railings".

In play, the grilles baked into `street-wide.png` (a paid `ideogram-v4-quality` render,
non-standard pipeline) **do not correspond to the new-design grilles** Bertrand wants at the
windows, and they do not register to the enemy pop positions. The art lane regenerated a
dedicated keyed grille sprite — `public/assets/levels/belliard/foreground.png` (décor v3,
fanzine B&W, RGBA) — but it was wired into the render **nowhere** (`ForegroundImage.tsx`
existed as dead code; the single-wide path drew only the backdrop plane).

Requirement (Bertrand): put the **new-design grilles at the windows**, with the enemy
**feet at the bottom of the grille**, the enemy on a **lower z** so the **grille reads in
front**, and verifiable with the **alignment harness** ("le système de grille rouge").

## Decision

Re-introduce a foreground grille overlay on single-wide, **image-sourced** from
`foreground.png`, as a new render component. The `BackdropLayout` abstraction and the
game/render/hooks boundary are untouched — game data still only describes the window zones,
render still only draws them.

**1. New `src/render/scene/WindowGrilles.tsx` — one keyed quad per window zone.** It loads
`foreground.png` once (`levelLayerUrl` + `applyPixelFilter`, the `LevelBackdrop` texture
pattern), shares the single `Texture` across all 54 quads, and disposes it on unmount. For
each `WindowZone` `z` on the tile it draws one `planeGeometry` textured with the grille,
width `z.w · facadeW · grilleScale` (default scale 1 — the sole tuning knob), height
preserving the source aspect (991/594). Rejected alternatives: reusing `ForegroundImage`
(stretches one image across the whole facade — wrong on a 61.7×12 world) and generalizing
the canvas-drawn `ForegroundFrames` (muddies a tested component with an image path for no
gain). `ForegroundImage.tsx` is left as pre-existing dead code (out of scope).

**2. Feet at the grille bottom, by construction.** Each grille's **bottom edge** is pinned
to the enemy feet line, derived from the **same** constants `EnemySprite` uses —
`enemyFeetY = worldY − planeH·(0.5 − ENEMY_BODY_LIFT)`, `planeH = z.h·facadeH·ENEMY_PLANE_SCALE`,
`grilleCentreY = enemyFeetY + grilleH/2`. Because both the sprite and the grille read the
same `ENEMY_PLANE_SCALE (1.3)` / `ENEMY_BODY_LIFT (0.02)`, the invariant
**grilleBottom == enemyFeet** holds for every zone with zero drift. `ENEMY_BODY_LIFT`,
`ENEMY_PLANE_SCALE`, and the `windows` zone rows are **unchanged** — re-tuning the lift to
force feet onto the authored opening base would move feet on every level (stalingrad/vitry
regress), so the grille is pinned to the existing feet line instead (single-level, zero
blast radius).

**3. Z-order — grille in front of enemies.** The overlay draws at **renderOrder 5, z 0.5,
`depthWrite={false}`** — above the enemy (renderOrder 4, z 0), below the courier
(renderOrder 6). This is exactly the layer slot `ForegroundFrames` held before ADR-0057 §4
suppressed it, so the layering is already proven; `depthWrite` stays off like every
transparent quad in the scene so the grille's transparent texels punch no z-hole in the
backdrop.

**4. Gated to single-wide, mirroring §4's suppression.** `GameScene.tsx` renders
`WindowGrilles` under `layout.mode === "single-wide" && !hideRailings`. The `ForegroundFrames`
block and its `!== "single-wide"` gate are **kept exactly as-is** — this ADR does not restore
the code-drawn ironwork; it adds the image grille as the single-wide equivalent. `hideRailings`
(`__MUF_HIDE_RAILINGS__`) is honoured so the alignment harness can still screenshot the bare
facade.

**5. Verification via a sibling harness.** `scripts/align-grilles.mjs` reuses
`align-windows.mjs`'s `measure`/`writeOverlay` (no fork of the frozen file), builds the 54
green "opening" boxes directly from `levelArt.json` `belliard.windows` (a new tested pure
helper `scripts/lib/windowRows.mjs`, mirroring `getWindowZones`), reads `__MUF_SLOT_RECTS__`,
and draws the same dimmed-facade debug overlay (openings green, feet boxes magenta, **red on
overflow**). No single-wide branch is added to the frozen `align-windows.mjs`; stalingrad/
vitry single-facade detection is byte-identical.

**6. Asset keying fixed.** The regenerated `foreground.png` shipped a partial chroma-key
(colour-cast duotone leaving ~35% of the glass as an opaque pink wash). It was re-keyed via
the existing `retouch-belliard-decor.mjs` (silhouette guard passed, 0px bbox shrink), and
that retouch step wired into `gen-belliard-decor.yml` so future regenerations stay clean.

## Consequences

**Positive**

- The new-design grilles now appear at every window, in front of the enemies, with feet at
  the grille base by construction — the requirement met numerically, not by eyeball.
- The `BackdropLayout` boundary held: this is one more render component reading existing
  zone data, no game-rule leak, no new hook surface (the harness verifies transitively
  through the existing `__MUF_SLOT_RECTS__`).
- 54 lightweight textured quads sharing one GPU texture — cheaper than the ~16 MB per-panel
  CanvasTextures `ForegroundFrames` built.
- Fixed levels provably untouched: the shared enemy constants and the frozen
  single-facade harness are unchanged.

**Negative / gotchas**

- **A systematic ~0.0112 (normalized) feet-vs-*painted*-opening offset** remains: the feet
  line (hence the grille base) sits ~0.0112 below the authored `windows` opening bottom.
  This is the *painted* window reference, not the grille reference (feet-vs-grille is exact);
  the new-design overlay grille is authoritative per Bertrand's direction. Whether any baked
  ironwork in `street-wide.png` should be toned down where it now doubles with the overlay is
  a follow-up art pass, out of scope here. `align-grilles.mjs` reports this offset by design.
- `ForegroundImage.tsx` stays as pre-existing dead code — flagged, not removed (out of
  scope). A future cleanup can retire it.
- `grilleScale` is a single magic scalar (default 1); if art wants the rail taller/shorter
  it is the one knob to turn, tuned against the real PNG at the art gate.

## References

- ADR-0057 (single-wide backdrop; §3/§4 amended here)
- Render: `src/render/scene/WindowGrilles.tsx` (new), `src/render/scene/GameScene.tsx`
  (single-wide render block), `src/render/scene/EnemySprite.tsx` (source of the shared
  `ENEMY_PLANE_SCALE` / `ENEMY_BODY_LIFT` constants, unchanged)
- Harness: `scripts/align-grilles.mjs`, `scripts/lib/windowRows.mjs` (+ test),
  reuses `scripts/align-windows.mjs`
- Asset: `public/assets/levels/belliard/foreground.png` (re-keyed),
  `scripts/retouch-belliard-decor.mjs`, `.github/workflows/gen-belliard-decor.yml`
- Game data: `src/game/levels/levelArt.json` (`belliard.windows`, unchanged),
  `src/game/levels/levelArt.ts` (`getWindowZones` / `buildSingleWideLayout`, unchanged)
