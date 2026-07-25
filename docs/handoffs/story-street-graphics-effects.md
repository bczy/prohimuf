# story-street-graphics-effects

Branch: `claude/street-graphics-effects-q8p59k`. Plan:
`/root/.claude/plans/fais-chaque-t-che-que-valiant-tulip.md` (Équipe 1 — rendering lane).

## stage-4. DEV (render) — dev-r3f-render (Amelia) — 2026-07-25

- claim: effects 1 (acid neon glow), 2 (VHS scan lines), 3 (entity shadow + energy
  glow) and 5 (urban movement), all inside `src/render/**`.
- release: four commits, one per effect. `tsc` clean, `vitest` 82 files / 1075 tests
  green, `eslint src` clean.

### File List

Effect 1 — acid neon glow (`fccbb96`)

- `src/render/scene/neonSignage.ts` (new)
- `src/render/scene/__tests__/neonSignage.test.ts` (new)
- `src/render/effects/radialGlowTexture.ts` (new)
- `src/render/scene/NearForeground.tsx`

Effect 2 — VHS scan lines (`ad09155`)

- `src/render/effects/vhsScanline.ts` (new)
- `src/render/effects/__tests__/vhsScanline.test.ts` (new)
- `src/render/effects/CrtPass.tsx`, `src/render/effects/crtShaders.ts`
- `src/render/ui/menu/OptionsControls.tsx` (+ its spec)
- `src/game/systems/prefsSystem.ts` (+ its spec) — **cross-lane, see below**
- `src/render/scene/App.tsx`, `src/render/scene/PlayingCanvas.tsx`,
  `src/render/scene/GameScene.tsx`

Effect 3 — entity shadow + energy glow (`1e2d2a4`)

- `src/render/effects/energyGlow.ts` (new), `src/render/effects/entityAura.ts` (new)
- `src/render/effects/__tests__/energyGlow.test.ts` (new)
- `src/render/scene/HostageQteSprite.tsx`, `src/render/scene/BossQteSprite.tsx`,
  `src/render/scene/LootCrate.tsx`

Effect 5 — urban movement (`9c792a7`)

- `src/render/effects/UrbanMotion.tsx` (new), `src/render/effects/urbanDebris.ts` (new)
- `src/render/effects/__tests__/urbanDebris.test.ts` (new)
- `src/render/scene/smokeParticles.ts` (one optional arg), `src/render/scene/GameScene.tsx`

### Boundary note — ESCALATION to senior-architect

`src/game/systems/prefsSystem.ts` is `dev-gameplay` territory. The VHS toggle had to
be persisted through the existing single `Prefs` store (the brief says "brancher sur le
système d'options existant"), so it gained ONE boolean field (`vhs`, default `true`)
with its loader/migration/round-trip tests. No rule, no behaviour, pure data shape.
Flagged rather than assumed — architect's call whether to keep it here or hand it over.

### Open points for the design gate

1. **"Sprite joueur"** (effect 3) — NOT implemented. This shooting gallery has no
   player-body sprite; the player's only on-screen representation is `CrosshairSprite`,
   whose fixed acid green (`#39ff14`) is an aiming instrument and lives on the flat CRT
   overlay layer by design (ADR-0031 P4). Recolouring it red at low energy is a design
   decision, not a render one. Needs `game-designer` / `ux-designer`.
2. **`CourierSprite` deliberately excluded** from the energy aura: the courier is a
   civilian and carries the "don't shoot" colour code. A red aura would contradict it.
3. **"Enseignes boutique"** (effect 1) — the level-art shopfront signs are BAKED into the
   facade images, so there is no shopfront-sign entity to attach an emitter to. The acid
   emitters ride `streetSign` (+ the métal props) instead. A real neon-sign prop is an
   art-lane + `levelArt.json` item (`dev-tooling-assets` / `concept-artist`).
4. **Lampposts get no `PointLight`.** Every scene material is `MeshBasicMaterial` on a
   `flat` Canvas — unlit — so a `PointLight` would be dead code. The lamp reads through
   the additive warm halo the CRT bloom picks up. Revisit if the scene ever goes lit.
5. **Day/night & combat modulation** (effect 1) — no such signal exists in `src/game`
   (`phase` is PLAYING / GAME_OVER / LEVEL_COMPLETE only). Intensity is constant, per the
   brief's "ne pas en inventer un sinon".
6. **Vent placement** (effect 5) is a render-side constant (two fixed fractions of the
   street width): `levelArt.json` has no vent entity, and authoring one is another lane's
   file. Promote to level data if the art lane wants per-level vents.

### Verify / perf not run

No composite gate and no `gpu-specialist` verdict yet. Effect 5 adds ~14 debris quads +
2 pooled puff fields (10 particles each, halved on mobile) and effect 3 adds 2 quads per
active QTE figure — all on layer 0, riding the existing CRT world pass; no new render
target, no new pass, `CrtPass`'s pass graph unchanged. Ben should still verdict it.

### Concurrency note

Another agent (Équipe 2, TITLE spray reveal) is working in the SAME checkout. My first
commit swept their in-flight `TitleScreen` files in; it was reset and re-made with
explicit paths, and their work is intact in `f3b4d35` / `5cbee47`. Every commit here
stages explicit paths only — no `git add -A` on this branch.

The branch was also rebased onto main mid-session (ADR-0068 lazy `PlayingCanvas`, the 3D
loot models, `PlayerHitEffects`, the QTE bullets). Five conflicts, all resolved as unions
of both sides: `vhs` now threads App → `PlayingCanvas` → `GameScene` → `CrtPass`. Post-
rebase: `tsc` clean, 91 files / 1206 tests green, `eslint .` clean, prettier clean.
