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

## stage-5. VERIFY (perf) — gpu-specialist (Ben) — 2026-07-25

- claim: GPU cost audit + PERF verdict on the five street-graphics effects.
- release: `docs/perf-budget.md` created (budget §2 PROPOSED, awaiting Bertrand's
  ratification — there was no budget to verdict against), baseline A/B measured
  `main c6404e4` vs branch, per-effect verdicts in §5, on-target protocol in §6.
- VERDICT: PASS — GPU / frame budget (gpu-specialist)

Per effect: acid neon glow APPROVE · VHS travel APPROVE · energy aura APPROVE
(one DEFERRED-ON-TARGET item, boss-QTE concurrency) · urban motion OPTIMIZE
(non-blocking, 3 named remedies routed to `dev-r3f-render`) · spray title APPROVE.

Measured in-sandbox (headless Chromium + SwiftShader, `belliard`, `crt: true`,
GL-level per-pass census, pointer sweep so frustum culling does not hide the delta):
**+0 passes, +0 render targets, +0 RT-format change, +0 shader programs**; draw calls
desktop 73 → 99 p50 (ceiling B2 = 150), mobile 57 → 58 p50 (ceiling 90). Ambient
allowance B7 now 83–88 % consumed by `UrbanMotion` — recorded for the architect.

**B1 (frame time) is NOT verified and cannot be here** — SwiftShader is a CPU
rasteriser and gives no GPU timing. Escalated to Bertrand as a ready-to-run protocol
(perf-budget §6: preview URL, 7 scenarios, 3 device classes, thresholds, and the
branch-vs-main Δ that is the real gate). `producer` chases; over budget with the PR
still open revokes this DEFERRED pass into a stage-5 FAIL.

### Concurrency note

Another agent (Équipe 2, TITLE spray reveal) is working in the SAME checkout. My first
commit swept their in-flight `TitleScreen` files in; it was reset and re-made with
explicit paths, and their work is intact in `f3b4d35` / `5cbee47`. Every commit here
stages explicit paths only — no `git add -A` on this branch.

The branch was also rebased onto main mid-session (ADR-0068 lazy `PlayingCanvas`, the 3D
loot models, `PlayerHitEffects`, the QTE bullets). Five conflicts, all resolved as unions
of both sides: `vhs` now threads App → `PlayingCanvas` → `GameScene` → `CrtPass`. Post-
rebase: `tsc` clean, 91 files / 1206 tests green, `eslint .` clean, prettier clean.

---

## stage-5. ART GATE — lead-art (Nico) — 2026-07-25

Gate 4 (**in-game composite**) + Gate 3 (bible) on the five street-graphics effects.
Batch **1 of 2** for this set (`art-direction.md` §6, iteration budget).

### Evidence — real in-game frames, not code reading

`yarn build` + `vite preview` + Playwright (headless-shell; the repo `e2e-*.mjs` scripts
launch `--headless=old`, removed from the sandbox Chromium — worked around locally, not
a finding against this lane). Frames read:

| Frame                                   | Seam                                                          |
| --------------------------------------- | ------------------------------------------------------------- |
| Belliard street, CRT+VHS on/off         | `__MUF_FREEZE_COPS__`, `muf_prefs.crt` / `.vhs`               |
| Stalingrad, CRT on                      | same, level 2 (scooter + lamppost emitters)                   |
| Boss duel, energy aura live             | `?preview=boss&at=phase2` / `at=phase3` (ADR-0051 D4 harness) |
| TITLE spray, t=350/900/1600ms + reduced | Équipe 2's `shot.mjs` captures                                |

Measurements below are pixel samples off those PNGs (hue/saturation/value, blob
extents, comb-phase FFT), not impressions.

### Verdicts

| #   | Effect                       | Verdict                                 | Binding rule                                |
| --- | ---------------------------- | --------------------------------------- | ------------------------------------------- |
| 1   | Acid neon glow               | **REVISE**                              | §2 law 1 (« rien de décoratif ne brille »)  |
| 2   | VHS travel                   | **PASS**                                | §8.2 / §8.4.5 / §2.1                        |
| 3   | Energy aura                  | **FAIL**                                | §2.1 (halo/rim), §2 law 1, §2 law 3         |
| 3b  | Contact shadow (same commit) | **PASS** (bible silent — rule proposed) | —                                           |
| 4   | Spray title                  | **REVISE**                              | §2bis (loi de l'imprimé)                    |
| 5   | Urban motion                 | **REVISE**                              | §1 (le néon est la seule couleur), §2 law 2 |

---

#### 1. Acid neon glow — REVISE

Split verdict, because the emitters are not one family:

- **`lamppost` (warm sodium `#FFA500`, 0.55) — PASS.** In-frame the head halo runs
  ~110 px with a clean monotonic falloff back to neutral paper (sampled along
  y=455: `255/255/217 → 255/255/177 → 156/112/33 → 247/237/217 → 217/217/217`).
  A dégradé, not an aplat (§2.1). It is a real light source in the fiction, the one
  legal non-acid warm, and under the CRT bloom it reads as a sodium réverbère.
  Not criard. This is the effect working.
  _Note:_ the core clips to `255/255/x` over the paper-white facade — the falloff
  survives in blue only across ~40 px. Tolerated here (it still ramps), but see the
  proposed §2.1 amendment: a glow must be measured on the ground it actually lands on.
- **`streetSign` (acid, 0.40) — CONDITIONAL PASS.** An _enseigne_ is a lit object;
  a halo on it is diegetic. But `#00FF64 / #FF32B4 / #9664FF` are **not the bible's
  anchored hues** (§2 law 1: orange `#FF8C14`, cyan `#28F0FF`, magenta `#FF3CDC`,
  green `#78FF3C`). `#9664FF` is a fourth family — a violet that exists nowhere in
  the palette. Family consistency (§2 law 2) is a colour law too. **Re-anchor the
  triad to `#78FF3C / #FF3CDC / #28F0FF`** and the sign passes.
  (Measured: the emitter green sits at h≈143°, the enemy rim at h≈103° — they are
  genuinely distinguishable, so the collision I expected is NOT there. Credit where
  due. The re-anchor is about palette discipline, not confusion.)
- **`parkingMeter` / `bollard` / `scooter` (acid, 0.12–0.14) — FAIL.** Two reasons,
  both hard:
  1. **Law 1, literally.** These props emit no light in the fiction. An additive
     radial disc centred on a bollard is emission, not reflection — and « ce qui
     brille est interactif » is the one contract the player learns in the first ten
     seconds. Every non-interactive glow spends that contract.
  2. **Archetype impersonation (§2 law 3).** `scooter` is the **moto** silhouette —
     a _delivery vehicle class_ whose interaction signal is precisely a render-side
     neon rim (ADR-0011). Belliard has one parked scooter, **Stalingrad has three**.
     A décor scooter wearing acid is wearing a vehicle's badge.
     Measured in-frame they are also nearly invisible (bollard peak `#476653`, 59 px;
     the Stalingrad scooter reads as zero over its backdrop). They cost a law and buy
     nothing.

  **Revision:** drop the emitter for `parkingMeter`, `bollard`, `scooter`. If the
  "hint of colour on a chrome edge" is wanted, it is a **reflection**, and a
  reflection is a thin crescent on the prop's lit side, keyed off the nearest
  emitter's hue — never a disc centred on the prop. That is a different (larger)
  change; my call is drop it now and spec it later.

  → **Escalation E1**: Bertrand explicitly asked for « métal/rebuts subtils ».
  The bible forbids it. I hold the FAIL; he is the only one who may override it.

#### 2. VHS travel — PASS

Measured over 5 frames at 400 ms, FFT phase of the row-luminance profile on a 4 px
period, `x∈[200,1100] y∈[100,620]`:

```
vhs on   ph=-1.58  -1.10  -0.13  +1.21  -0.10(wrapped)   amp≈20.5
vhs off  ph=-0.51  -0.50  -0.51  -0.50  -0.51            amp≈19.3
```

Monotonic, phase-continuous across the wrap, and **amp unchanged** — the travel
extends the §8.2 comb, it does not restyle it. Frozen under `reducedMotion` and
`paused` (`CrtPass.tsx:255`), behind BALAYAGE VHS. 5 CSS px/s over a 4 px pitch =
1.25 Hz local modulation, far below any strobe threshold (§8.4.5). Small sprites and
the crosshair stay legible in the captured frames (§8.5 P5). On direction: this is a
mistracking head on a third-generation dub (§8.3), which is exactly the identity.

_Watch item, not a condition:_ if it ever reads as a _crawl_ rather than a drift on a
real 120 Hz hidpi panel, halve the speed — do not touch the comb.

#### 3. Energy aura — FAIL (composite gate)

The asset-gate reasoning in `entityAura.ts` is that the sprite occludes the opaque
core and « only the outward falloff reads as a rim ». **On screen it does not.** The
occluder is a narrow figure; the glow is a disc. Measured on `?preview=boss&at=phase2`:

- **7.73 % of the world area is green-tinted, in one contiguous 430×454 px block**
  centred on the boss. For scale, the entire Belliard street — 14 rimmed enemies,
  two traffic lights, every emitter — totals **1.77 %**, spread. One entity's aura
  out-colours a whole level.
- The core is **exposed above the head, between the legs and below the feet**: it
  pools onto the black road as a green ellipse with no source, and it clips the
  pavement to `#F8FFF3` — v=1.00, s=0.05. **That is an aplat**: over the bright
  band the falloff is gone and the hue is gone with it. §2.1, automatic FAIL.
- The shopfront shutter behind him samples `#587E54`, **s=0.33** — a third of the
  saturation on what must be neutral B&W linework (§1, §8.4.4).
- The crosshair (`#7FF74E`) sits inside a green field of near-identical hue. §8.5 P4
  wants it pixel-precise; here it loses its ground.

And a second failure that needs no screenshot — **the same hue is painted on the
captor and on the hostage** (`HostageQteSprite.tsx:464-490`, one `energy` for both).
La loi du glow's job is _identification_: a rim says "this object, this class". An
aura driven by a global scalar says nothing about the object it surrounds, and here
it says the same thing about the man you must shoot and the woman you must not. The
lane already found this principle — it excluded `CourierSprite` because « a red aura
would contradict the don't-shoot colour code » — and then applied it to the courier
only. The hostage is the _original_ don't-shoot figure.

Add: `ENERGY_EMPTY #FF3030` is a **red that does not exist in the palette**.

**Revisions (any accepted route, in my order of preference):**

1. **Make it a rim, not a disc.** Reuse the ADR-0011/ADR-0025 render-side rim path
   (silhouette-derived, alpha falloff outward from the sprite edge). A rim cannot
   pool on the road, cannot clip a pavement, cannot recolour a shutter.
2. If it must stay a quad: cap it at **≤1.15×**, cut `GLOW_OPACITY` to **≤0.20**, and
   change `radialGlowTexture`'s ramp for this consumer — the 22 % opaque plateau is
   what produces the aplat. An entity aura needs falloff from the first texel; the
   plateau exists for the _point-source_ emitters (effect 1) and should stay there.
3. **Hue: the aura may not carry player energy.** Either give each class its assigned
   accent (§2 law 1) and modulate only _intensity_ with energy, or drop the aura on
   the hostage entirely and keep it on the crate + captor + boss. Never red on a
   don't-shoot figure.

→ **Escalation E2** (pm / lead-game-designer, not me): "a second peripheral read of
the energy gauge, painted on world entities" is a **design** decision with an art
consequence, and it was implemented without a design gate. Whatever they rule, the
composite above is not shippable as drawn.

#### 3b. Contact shadow — PASS, and a bible gap

`#07070A` at 0.45, a 0.9×0.2 squashed ellipse under the feet. It **removes** light,
it is neutral ink-black, and it stops the cut-out figures floating. That is the same
reasoning §2bis.2 pt3 uses to grant the flyer its one occlusion shadow. On direction:
a cut-and-paste paste-up casts a shadow; that is a collage tell, not a diorama tell.

The bible is **silent on in-game ground shadows**. Proposed rule below (G4).

#### 4. Spray title — REVISE

Read on `title-1600.png` (finished) and `title-350.png` (mid-reveal).

- **The chrome is not printed.** It renders as a smooth continuous-tone metal ramp
  with a specular fold — a 1997 WordArt / heavy-metal logo. It is the **only**
  smooth-gradient object on a page whose whole identity is degraded photocopy: the
  stock carries a dot screen, the type carries toner grain, and the wordmark carries
  neither. §2bis: the title is « an artifact of the fanzine world, printed on paper —
  bright stock, black ink, xerox texture ». A copier cannot hold that ramp; it would
  **band it**. The `tokens.ts` comment already states the target ("photocopied metal
  sticker, **not a 3D chrome logo**") — the render is the second thing.
  **Revision:** posterise the ramp to 4–6 hard steps (or halftone it through the
  §2bis.1 dot screen) and pull `CHROME.hi` off near-white — `#FBFBF9` on a
  light stock is a **specular sheen**, and §2bis.2 pt4 rejects sheen by name
  ("metallic specular = a glint = glow"). A photocopied chrome sticker is banded grey,
  and its brightest band is the paper, never brighter than it.
  I am **not** rejecting chrome as an idea: chrome-effect Letraset lettering is
  genuinely 1990s and genuinely photocopy-able. It has to be the photocopy of it.
- **The "spray" is a focus-pull.** `blur(0.16em) + scale(1.22) → 0/1.0` uniformly on
  both layers. At t=350 ms the letter is a soft bright metallic blob — a lens rack, or
  a glow, on a print surface. An aerosol can does not shrink a letter and does not
  defocus its contour; it lays **overspray** — a wide, faint, speckled ink halo — and
  then the stencil edge bites hard.
  **Revision:** drop the `scale(1.22)` shrink (or invert to a ~0.98→1 settle); keep
  the contour **sharp from frame 0** and animate a separate **ink-black overspray**
  layer (wide, low-alpha, `feTurbulence`-speckled, §2bis.1 machinery) that lands
  first, then fades to a faint permanent freckle. Dark halo = removes light = legal;
  bright soft halo = glow = FAIL on a menu.
- Timing (~2 s), reduced-motion (`animation: none`, finished state on first paint),
  ink-black contour defining the glyph, `--chrome-*` kept off the global bridge:
  all correct, all PASS. The structure is right; the surface treatment is not.

→ **Escalation E3 (pre-existing, not this lane):** the brief says « sur la couverture
papier **jaune** ». The bible pins `stock-jaune #F1EC1F` as **TITLE cover only**
(§2bis.1). The code has shipped `PaperSheet stock={STOCK.shell}` (`#D7D2C6`, the
NIVEAUX wall backing) since before this branch. Either the code lost the cover stock
or the bible is stale. Bertrand's ruling; the chrome will read differently on jaune.

#### 5. Urban motion — REVISE (small)

Placement, suppression contract and render band are right: `AMBIENT_RENDER_ORDER 3.6`
sits under every actor, boss hides it, QTE/pause/reduced-motion freeze it, no debris
is a target, no game state is driven. In-frame the litter reads as litter, not as
cibles — the confusion risk I came looking for is **not** there. Two things are:

- **Hue on a B&W layer.** `rgba(58,52,44)` is a warm brown; `rgba(232,230,224)` a warm
  cream. §1 reserves colour for the neon. Make both **strictly neutral**.
- **The paper scrap is the brightest moving thing in the lower third.** At ~213/255 on
  the black road it is ≈14:1 contrast — louder than the courier, louder than the van,
  in the exact band where they travel. Meanwhile the leaf at ~52/255 is nearly
  invisible there. Two members of one set, one glaring and one absent: that is §2 law
  2 inside the debris family.
  **Revision:** bring both into one value band, mid-toner, roughly `#6E6E6E` /
  `#3C3C3C` — printed litter, not lit litter. The population (14 / 7) and the speeds
  are fine as they are.

---

### Bible gaps found (Gate 3 — proposed amendments, not yet applied)

The bible was silent or under-specified on four points this batch exposed. I am
proposing them here rather than editing `art-direction.md` mid-review; they land in a
docs PR once effects 1/3 settle.

- **G1 — Diegetic light sources vs interaction rims (§2 law 1 sub-clause).** A third
  category is missing between "interactive" and "decorative": an object that _is a
  light in the fiction_ (réverbère, enseigne, feu tricolore). It may emit, under three
  conditions: (a) the emission is a **disc/halo at the light head**, never a rim
  tracing the silhouette — the rim shape stays reserved for interaction; (b) its hue
  is either the **warm street token** or an anchored accent unused by an interactive
  class in that level; (c) a non-emitting prop (bollard, horodateur, banc, scooter)
  **never** glows — a reflection is a crescent on the lit side, not a disc.
- **G2 — Warm street token.** The sodium `#FFA500` needs to exist in §2bis.1's manner:
  a named non-accent world token (`light-sodium`), explicitly outside the acid palette
  and explicitly not an interaction signal.
- **G3 — Glow geometry (§2.1 addendum).** « Un halo est un dégradé » needs a shape
  clause: _an entity glow traces its silhouette; a disc larger than the entity is a
  point-source form and may not be used as an entity aura._ Plus a measurement clause:
  **falloff is measured on the ground the glow actually lands on** — an additive halo
  that clips its background to white has no falloff there, whatever the texture says.
- **G4 — In-game contact shadow.** Extend the §2bis.2 pt3 occlusion exception to the
  world layer: one neutral ink-black shadow per grounded sprite, no colour, no spread,
  one light direction per scene. Makes 3b a rule instead of a tolerance.
- **G5 — Semantic state ramps.** `#00FF64/#FFD400/#FF3030` (aura) and the enemy heat
  ramp were each invented locally. Green/amber/red as a _state_ language needs one
  anchored triple in the bible, or every feature will mint its own.

### Escalations for Bertrand

- **E1** — décor emitters (`bollard`/`parkingMeter`/`scooter`). He asked for them;
  §2 law 1 forbids them; they measure as near-invisible anyway. I hold the FAIL.
  He is the only one who may override it.
- **E2** — the energy aura's _premise_ (a global scalar painted on world entities,
  including on the hostage) is a design call that skipped the design gate. Needs
  `pm` + `lead-game-designer` before the render is re-cut.
- **E3** — TITLE stock: shipped `paper-shell`, bible says `stock-jaune`, brief says
  jaune. Pre-existing; one of the three has to move.
- **E4 (observation, out of scope)** — Stalingrad's backdrop renders as a saturated
  colour night photograph, not xerox B&W. Nothing to do with this branch, but it is
  the largest single divergence from §1 currently on screen and it deserves its own
  pass.

### Gate status

Effects **2** and **3b** are cleared for merge. Effects **1**, **3**, **4**, **5** do
not have my PASS. Effect **3** is the blocker: it is the one that changes what a
seventh of the screen looks like. The hostage-QTE composite has still **never landed
in a screenshot** — only the boss host has been gated — so even a re-cut aura needs a
QTE frame before it gets a verdict.

Batch 1 of 2 spent. One more generation/tuning round; past that, options go to
Bertrand rather than further runs.

---

## stage-6. TRIAGE ARCHITECTE — senior-architect (Winston) — 2026-07-25

Triage of the 4-reviewer panel **and** the integration review, one pass over
`git diff origin/main...HEAD` (COLLABORATION.md §code-review panel: the triage IS the
integration review). The CI panel is down (API credits) — this local pass is the gate.

**Diff read at `1fc6c7c`** (base `c6404e4`). The branch moved twice while I was reading
it: the panel's findings were raised against `7251569`, then `749c3d0`, `30a91c8` and
`1fc6c7c` landed. My triage covers the tip, which is why it carries findings the panel
could not have seen. Working tree clean at time of writing.

### 1. Panel findings — prescriptions

| #   | Finding                                  | Prescription | State at `1fc6c7c`             |
| --- | ---------------------------------------- | ------------ | ------------------------------ |
| 1   | Vapeur snap on pause/QTE                 | CONFIRMED    | fixed in `30a91c8`             |
| 2   | Effet 3 aura — composite FAIL            | CONFIRMED    | re-cut in `7251569`, UNGATED   |
| 3   | Hostage aura shares renderOrder 6        | CONFIRMED    | fixed in `7251569`, see **I1** |
| 4   | `DEBRIS_LINE` band under the camera floor| CONFIRMED    | fixed in `30a91c8`             |

**#1 — vapeur freeze.** Prescription confirmed, and the applied fix is the right one for
the right reason. The bug was real: `UrbanMotion` passed its `frozen` (pause ∪ QTE ∪
reduced-motion) into `SmokeField.update({ reducedMotion })`, and that branch does not
freeze — it *repositions* every puff onto `staticOx/staticOy/staticRot/staticScale`
(`smokeParticles.ts` ~l.203). Snap out on pause, snap back on resume. The fix passes the
**real** `reducedMotion` only and carries the pause/QTE hold through `step = 0`, which is
already how the debris freezes. Correct: with `step = 0` the live branch recomputes the
same positions from unchanged accumulators, so the plume holds its actual arrangement
instead of teleporting to a different one. One freeze semantics for the whole layer.

**#2 — energy aura.** Prescription confirmed: E2 was Bertrand's to rule and he ruled
render-only re-cut. The landed re-cut answers all three legs of the FAIL by construction,
not by tuning — a silhouette rim (ADR-0025 machinery, `getSilhouetteFor` +
`createEnemyRimMaterial`) exists only in the `marginPx` band outward from the sprite's own
alpha edge, so it *cannot* pool on the road, clip a pavement to v=1.00 or tint a shutter;
the hostage carries no aura at all; and the hexes now come from the shared
`STATE_GREEN/AMBER/RED` triple re-exported from `neonHeatColor` (finding G5 answered in
the same stroke — one state ramp in the codebase, not two). Reusing the hostile-rim path
at `RIM_INTENSITY 0.9` vs the hostile's 1.0 keeps the interaction rim the loudest, which
is the right hierarchy. **This does not close the finding**: the composite gate failed on
measured pixels and only measured pixels can clear it. See condition **C1**.

**#3 — renderOrder 6 collision.** Prescription confirmed, fix landed — and it introduced
the mirror-image defect. See **I1**; it rides the same re-cut.

**#4 — debris band.** Prescription confirmed and the arithmetic checks out against the
real clamp, not against the comment: `GameScene.tsx:386` sets
`rangeY = max(0, (facadeH - viewH)/2)`, so the lowest world y ever framed is
`-rangeY - viewH/2 = -facadeH/2` = **-6** at `WORLD_HEIGHT 12`. Old baseline `1.02` ⇒
-6.24, band `[-6.39, -5.89]` — entirely under the floor bar a sliver. New `0.965` ⇒
baseline -5.58, band `[-5.95, -5.01]`: clears the floor by 0.05 and stays 0.21 below the
courier line (`streetY = -facadeH*0.4` = -4.8, `GameScene.tsx:287`). Extracting the bounds
as named constants with a `debrisBandExtent()` the tests can assert is the right shape —
the invariant is now checkable instead of commented.

**NITs.** Accepted as triaged: `neonSignage` comment (fixed, `2a39233`);
`buildDebrisTextures()` in the render body (session-lifetime singleton, same idiom as
`EnemySprite`'s `glowTexture` and `ImpactEffects`' getters — harmless, no change);
`OptionsControls` "tracks prefs.vhs" test (dispatched, keep). `.muf-shot.mjs` must be gone
before push — **C6**.

**GPU remedies (`1fc6c7c`) — ACCEPTED.** Both are in scope and correctly bounded. The puff
cap is opt-in (`maxScale` defaults to `+Infinity`), so the boss veil is byte-identical, and
clamping at draw as well as on growth is right — a cap tighter than the 0.5–0.95 spawn
range must bind on frame 1. The off-screen vent cull is a real saving on a street far wider
than the view. NIT, no action: `state.camera as OrthographicCamera` is an unchecked cast;
the scene camera is ortho everywhere today and `zoom > 0` is guarded, so it degrades to
`Infinity` (= never cull) rather than misbehaving.

### 2. Integration review — the boundary law

**THE CROSS-LANE CALL: `vhs` in `src/game/systems/prefsSystem.ts` — LEGITIMATE.**

The law is about **dependency direction and rule ownership**, not vocabulary. Measured
against it:

- `src/game` gains no import of React or Three — the field is a `boolean`.
- No rule moved. Nothing in `src/game` reads `vhs`; no system branches on it. Its single
  consumer is `CrtPass`, reached through `App → PlayingCanvas → GameScene`, i.e. the
  render tree, entered at the `App` prefs bridge.
- `Prefs` is already, by design, the **persisted OPTIONS record for the whole app** and not
  a gameplay struct: `crt` is a pure post-process toggle and ADR-0054 §3 deliberately
  stores `reducedMotion` here while placing the live OS union at the render/bridge edge.
  `vhs` is the third instance of exactly that shape.

Refactoring it out would mean a second persistence store for display prefs — more surface,
two migration paths, an OPTIONS screen reading from two places. That is worse architecture
for a purity that the law does not actually ask for. **Keep it.** The lane was right to
escalate rather than assume; that is the behaviour I want.

Guardrail, so `Prefs` does not become a junk drawer. A render-owned pref field is admitted
iff **all four** hold: (a) pure data (boolean / number / string-union — never a function or
a Three/React type); (b) a default plus a type-guarded migration with round-trip tests;
(c) a player-facing OPTIONS row — no hidden render config; (d) **no `src/game` system ever
branches on it** — the day one does, it stops being a display pref and owes a design pass
and an ADR. All four hold here. This rule gets written down: **C4**.

**I1 — NEW, CONFIRMED, MINOR: the aura render band drops out of its host's stack.**
`createEntityAura({ renderOrder: 5 })` in both `HostageQteSprite.tsx:401` and
`BossQteSprite.tsx:468`, with `rimZ = 0.48`. Against `streetDepth.ts`: `facadeOverlay`
**5** @ z 0.50, `vehicleRim` **5.2**, `vehicle` **5.25**, `courier` **5.5**, `nearRow`
**5.75** — every one of them sorts *after* a rim at (5, z 0.48), while the host bodies own
**6** and sort after all of them. Result: wherever a balcony slab, a grille, a frozen
courier or a near-row prop overlaps the figure, the ironwork/prop paints over the *rim*
while the body paints over the ironwork — a rim with a bite out of it. `streetDepth.ts`
documents this exact hazard for `vitry`'s HLM slab (world y -4.17..-4.55 across the actor
band). The boss aura additionally shares slot 5 with the boss tableau's own `decorRef`.

This is the same class of defect finding #3 closed, in the other direction: an aura must
live in **its host's band**, not in a lower integer band shared by other layers.
Prescription — take the fractional slot immediately below the host, the `vehicleRim/vehicle`
(5.2/5.25) idiom: **`renderOrder: 5.9`** for both QTE auras, `rimZ`/`shadowZ` unchanged.
5.75 < 5.9 < 6 keeps the aura above the whole street stack, like the tableau it belongs to.
`LootCrate`'s aura at 4 is **correct as-is** — same band as its host body, disambiguated by
z, which is the `EnemySprite` rim idiom. Lane `dev-r3f-render`, rides the same re-cut as
C1 so one QTE frame gates both.

**I2 — DOC: the depth table is now stale.** `streetDepth.ts`'s header is the single source
of truth for the stack and its neighbour list ("backdrop 0..3, impact marks 3.5, enemies +
LootCrate 4, facade overlays 5, hostage QTE 6..8…") omits the two bands this branch adds:
ambient **3.6** (`UrbanMotion`) and the aura slot. That omission is precisely how #3 and I1
happened. `dev-r3f-render` updates the table in the I1 commit (they are in the file
anyway); `tech-writer` verifies in the DOC gate. **C5.**

**Other seams — all clean.**

- `vhs` threading `App → PlayingCanvas → GameScene → CrtPass`: prop-drilled through the
  existing render tree, default `false` at every hop, no new context, no new bridge. The
  hooks layer is untouched and did not need to be — this is config, not a game↔render
  contract.
- `CrtPass` extension: `uScanlineScroll` defaults to 0 and the shader is unbranched, so OFF
  is the pre-existing static comb exactly. The clock gets its **own** accumulator rather
  than reusing `timeRef` (which wraps on the flicker period, not a whole number of comb
  periods) — that is the right call and the reason is correctly stated. Wrapping in CSS px
  on the comb's own period, then converting through the **live** `uScanlinePeriod`
  (`CrtPass.tsx:212` writes `SCANLINE_PERIOD_CSS * ratio`), is phase-continuous across
  every wrap and dpr-stable. `SCANLINE_PERIOD_CSS` moving into `vhsScanline.ts` is a
  correct ownership move, not churn.
- `smokeParticles` boss→street reuse: both new params are optional with the boss's previous
  behaviour as the default, so the shared file is extended without touching the boss lane's
  read. This is the one shared file on the branch and it was handled correctly. Three
  positional optionals is the ceiling — a fourth becomes an options object.
- `neonSignage` / `radialGlowTexture`: pure table + session singleton, no consumer disposes
  the shared texture (checked: only `getRadialGlowTexture` writes it), so the two consumers
  cannot tear each other's map down. `entityAura.dispose()` disposing materials but not the
  shared map is correct.
- `energyGlow` importing `STATE_*` from `@render/scene/neonHeatColor`: render→render, and
  it collapses two ramps into one. Right direction.

**Dependencies / deployment: NO IMPACT — confirmed.** `git diff origin/main...HEAD` touches
zero bytes of `package.json`, `yarn.lock`, `.github/**` and `scripts/**`. No new pass, no
new render target, no new shader program (gpu-specialist, GL-level census). Nothing to
re-provision, nothing to re-key in CI.

### 3. Blocker found in integration — scope

**B1 — `749c3d0` is a FEATURE that landed after the panel read the branch.**
The lead-art REVISE on effect 4 asked for three things: posterise the chrome ramp, pull
`CHROME.hi` off near-white, replace the blur+scale focus pull with an ink-black overspray.
All three are in that commit and all three are well executed. But the commit also ships
**three randomly-drawn title reveals** (`spray` / `paint` / `blast`, `pickTitleAnimation`,
a new exported type, a detonation cloud, ~390 lines of new CSS) — nobody asked for `paint`
or `blast`. And it moves TITLE to `STOCK.jaune`, which is **escalation E3**, explicitly
flagged as pre-existing, not-this-lane and Bertrand's ruling; no ruling is recorded in this
shard.

Two rules fail at once. The scope guard (`PROJECT_GUIDELINES.md`): "which cover animation
plays" is not a Prohibition-ST feature, so it is an extension and owes a conscious,
documented justification — through `pm` and the design gate, which it never saw. And the
merge gate itself: four reviewers signed a diff that no longer exists. A stage-6 fix commit
may answer findings; it may not add a feature.

Not a judgement on the work's quality — the print reasoning in it is good. It is in the
wrong lane at the wrong stage. Route: `pm` rules keep-or-cut. **Cut** ⇒ reduce `749c3d0`
to the three gate answers (overspray + posterised chrome + `CHROME.hi`), E3 still needs
Bertrand's word on the stock, and this branch merges on the conditions below. **Keep** ⇒ it
leaves this branch for its own story with a design gate and its own panel; it does not ride
a rendering-effects PR through on a re-cut's coat-tails.

### 4. ADRs

- **REQUIRED, this PR — energy-rim signalling contract.** The branch ships a *rule*: which
  entity classes may carry a player-energy rim (crate, captor, boss), which may not
  (hostage, courier) and why — identification, not decoration; plus the single
  `STATE_GREEN/AMBER/RED` triple both ramps now import. It survived an escalation and it
  constrains every future entity. Undocumented, it gets re-litigated — G5 is the proof
  (ADR-0025's red was silently re-minted here). Number from `producer` (never
  self-allocated); `tech-writer` drafts; decision content is mine and is above.
- **REQUIRED, this PR — amend ADR-0054 in place** (→ `Accepted (amended)`, no new number)
  with the four-part Prefs admission rule from §2. ADR-0054 already owns the OPTIONS/PAUSE
  shared-options contract and the `reducedMotion` authority; this belongs there, not in a
  new ADR. `tech-writer`.
- **NOT required — VHS travel.** In-envelope extension of ADR-0031 §8.2: same comb, same
  period, same trough, one offset uniform, 0 ⇒ byte-identical, pass graph unchanged. A
  one-line note in ADR-0031 is enough. `tech-writer`.
- **NOT required for this merge — `docs/perf-budget.md`.** A budget that gates future
  merges is ADR-worthy, but it is ADR-worthy *when ratified*, and B1 is unverified by
  construction in the sandbox (§6). Ships as PROPOSED. Follow-up: Bertrand ratifies →
  `producer` allocates → `tech-writer` drafts. The DEFERRED perf pass stands only while
  `producer` chases the §6 on-target protocol; over budget with the PR open revokes it.
- Bible amendments G1–G5 stay in `lead-art`'s own docs PR, as he stated. Not a condition.

### 5. Verdict

**NO-MERGE at `1fc6c7c`.** Two blockers, neither of them about the rendering work's
quality:

- **B1 — scope.** `749c3d0` adds an ungated feature after the merge gate ran. Owner `pm`
  (cut-or-split ruling), then `dev-r3f-render` executes. E3 (jaune stock) needs Bertrand.
- **B2 — the quality gate is open.** Effects **1, 3, 4, 5** have no `lead-art` PASS. The
  re-cuts have landed but nothing has re-measured them, and effect 3 failed on *pixels*.

Converts to MERGE when all of the following are true:

- **C1** — `lead-art` re-gates the energy rim on a **hostage-QTE frame** (never once
  captured — `?preview` harness or `__MUF_FREEZE_COPS__`) *and* a boss frame, post-I1.
  Effect 3 does not merge on a code read.
- **C2** — `lead-art` re-gates effects **1** (acid triad re-anchor + décor emitters
  dropped) and **5** (neutral mid-toner litter + the raised band) on belliard **and**
  stalingrad frames. Stalingrad specifically: it is the level where the litter was
  invisible.
- **C3** — **I1** fixed: both QTE auras to `renderOrder 5.9`. `dev-r3f-render`. Must land
  *before* the C1 frames are taken.
- **C4** — ADR-0054 amended with the Prefs admission rule; new ADR for the energy-rim
  contract (number from `producer`). `tech-writer`.
- **C5** — **I2**: `streetDepth.ts`'s band table updated with 3.6 and the aura slot, in the
  C3 commit. `dev-r3f-render`, verified by `tech-writer`.
- **C6** — `rtk tsc` + `rtk vitest` + `rtk lint` green on the final tree, untracked
  `.muf-shot.mjs` removed, `OptionsControls` test tightened.
- **C7** — a **delta panel pass** over `git diff 1fc6c7c...HEAD` before merge. The branch
  moved three times during this review; whatever B1 resolves to, the final diff must have
  been read by the gate that signs it. `senior-architect` triages the delta only — not a
  second full read.

Boundary law: **respected** across the branch, `vhs` included. No game system imports React
or Three; no rule moved into `src/render`; the hooks layer is untouched and correctly so.

`producer` (Marion) drives B1 to `pm`, C4's ADR number, and the C1/C2 re-gate slot against
`lead-art`'s remaining iteration budget (batch 2 of 2 — the last one).
