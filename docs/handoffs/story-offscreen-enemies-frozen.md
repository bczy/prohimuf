# Story — off-screen enemies frozen (ADR-0071) — merge-gate panel

## Panel run — 2026-07-26 (Bertrand: "ok could we merge?" — whole branch `claude/offscreen-enemies-cannot-shoot` → main)

Scope: `git diff origin/main...HEAD` at panel time (31 files, 1552+/87- — the
offscreen-enemies freeze + ADR-0071, the boss multi-model bake-off tooling, regenerated
boss PNGs, and this session's tag-live-paint reference board/curation). Player-visible
(gameplay) + tooling/CI + docs/assets.

Four reviewers run in parallel: `code-review` (high), `bmad-code-review`,
`bmad-review-edge-case-hunter`, `security-review`. Findings adversarially verified; two
(prettier BLOQUANT, `speaker_wall.png` chroma conflict) re-checked directly against the
real files/image by the triager below before being accepted.

### CONFIRMED findings (most severe first)

- **[BLOQUANT] scripts/bakeoff-boss-models.mjs, scripts/gen-boss-sprites.mjs,
  docs/art-direction/references/LICENSES.md — not prettier-formatted**, CI's
  `yarn format:check` (`.github/workflows/ci.yml`) would redden the branch.
  **FIXED** in commit `de8b6135` (prettier --write, no semantic change; `LICENSES.md`
  line was this session's own italic-style slip).

- **[MAJEUR] src/game/systems/stateMachine.ts:497-499 — "protéger la camionnette"
  devient un objectif gratuit.** `shootingCount` filtre maintenant sur la position
  caméra, pas la proximité au véhicule : pointer la caméra sur un tronçon sans ennemi
  pendant la fenêtre `DELIVERING` donne `shootingCount === 0`, l'intégrité ne descend
  jamais, `SUCCESS` + bonus (belliard 500 / stalingrad 400) tombent à tous les coups.
  **Unanimously confirmed by all 3 code reviewers** (A/B/C), independently traced to
  the same lines. ADR-0071 §Négatif discloses this verbatim and explicitly asks for a
  `game-designer` arbitration ("mérite un arbitrage game-designer plutôt qu'un choix
  implicite") that has not happened — the diff instead ships a new test
  (`stateMachine.test.ts:1492`) that _pins_ the exploit as expected behaviour rather
  than guarding it. **Owner: `game-designer`** (decide fix — e.g. gate on
  shooter-to-vehicle proximity instead of camera position, or redesign the objective)
  → `dev-gameplay` implements. **Not fixed — blocks merge.**

- **[MAJEUR] public/assets/boss/speaker_wall.png — chroma-key background conflict,
  ships a visibly broken asset.** The bake-off pipeline's `COMIC_TAIL` demands a flat
  magenta (#FF3CDC) chroma ground, but `speaker_wall`'s own subject prompt
  (`levelArt.json` boss.types.speaker_wall, untouched by this diff) still says "on a
  completely flat uniform black background" — the two clauses fight. Verified visually
  (`Read` on the committed PNG): large opaque black masses flare left/right of the
  stack, un-keyable at any chroma tolerance (~250 away from #FF3CDC). Every gate passes
  it (`check-sprite-integrity` sees one dominant component; `desaturate-enemy-figure
--check` accepts black as neutral). **Owner: `concept-artist`** fixes the
  `speaker_wall` prompt (drop/align the background clause with the magenta tail),
  `dev-tooling-assets` regenerates. **Not fixed — blocks merge.**

- **[MAJEUR→downgraded on verification] "3 of 4 levels enemy-inert at camera rest" /
  unpinned viewport-reachability invariant** (stateMachine.ts:364 / viewport.ts:17,
  raised independently by B and C). Triager re-verified the underlying numbers: A's
  own re-derivation of max\|slotX\| vs the pan-clamp bound (`fullW/2`) matches ADR-0071's
  disclosed figure exactly (vitry 39.4586/40, margin 0.54) and shows **every shipped
  level's slots are currently reachable — no permanent stall exists today.** The
  "3 levels empty at camera rest for the whole level" framing describes a pre-existing
  level-geometry/camera-control property (player-driven pan, no autoscroll — confirmed
  in `GameScene.tsx`), not a regression this diff introduces; ADR-0071 §Négatif already
  names this pacing change and records it as knowingly accepted, with a mitigation path
  if it proves to feel broken. **Not a merge blocker as a correctness bug** — but the
  ADR is still `Proposed` (not `Accepted`) and self-commits to adding a test for
  `max |slotX| <= fullW/2` that is missing from the diff; given the panel's sharper
  measurement (0% active frames for a full level, not "one cycles"), **recommend**
  Bertrand/`game-designer` re-confirm the pacing call now that it's quantified, and
  `dev-gameplay` add the invariant test per the ADR's own to-do before flipping
  ADR-0071 to `Accepted`. Non-blocking for this panel's verdict, but should not be
  dropped silently.

### MINEUR (non-blocking, recommended before/soon after merge)

- `scripts/bakeoff-boss-models.mjs` duplicates `genUrl`/`fetchImg`/`withRetry` from
  `scripts/lib/gptimage.mjs` with no timeout/retry — a hung request stalls a paid CI
  run to its 45-min cap. Owner: `dev-tooling-assets`.
- `scripts/gen-boss-sprites.mjs` `REF_IMAGES` points at mutable `raw.githubusercontent`
  URLs on `main` — breaks the "pinned seed" reproducibility contract, silent 404
  degradation. Owner: `dev-tooling-assets`.
- Chroma `tol: 150` (`gen-boss-sprites.mjs:212`) now reaches into the art's own
  mid-grey tone band (nearest neutral grey at distance 147) — no current damage, but
  margin against future poses is gone and only a WARN-level gate would notice. Owner:
  `dev-tooling-assets` / `lead-art` to confirm tolerance.
- New "flatten to neutral tones" CI step (`gen-boss-sprites.yml:144`) is a no-op —
  `keyAndDown()` already flattens; 0px changed on all 9 committed PNGs. Owner:
  `dev-tooling-assets`.
- `security-review`: unescaped error text interpolated into the bake-off HTML report
  (`bakeoff-boss-models.mjs:345/419/117`) — a hostile/spoofed upstream error becomes
  markup in a CI artifact opened by a human. One `esc()` helper fixes it. Owner:
  `dev-tooling-assets`.
- `workflow_dispatch` inputs interpolated raw into a `run:` bash block
  (`.github/workflows/bakeoff-boss-models.yml:90-92`) — standard `env:` indirection
  fix; no actual privilege escalation (dispatch already requires write). Owner:
  `dev-tooling-assets`.

### NIT

Muzzle flash cosmetic on a frozen mid-`SHOOTING` enemy (ADR-0071 already discloses,
accepted); dead default params on `viewport.ts` (single call site passes all args);
ADR-0071 leads its Context sentence with backticked snake_case (violates this diff's
own `adr-new` SKILL.md style rule, added same commit) — **routed to `tech-writer`**;
`urlFor()`/`fetchBuf()` duplicate `genUrl()`/`fetchImg()` (same root cause as the
MINEUR above).

### Integration review (boundary law / seams / deps)

- Boundary law holds: `viewport.ts`/`enemySystem.ts`/`stateMachine.ts` stay
  `src/game`-pure (no React/Three); the `EnemySprite.tsx` muzzle-flash NIT is a
  `src/render` cosmetic reader, not a boundary violation.
- New deps: `@napi-rs/canvas@1.0.2` (bake-off only), pinned, `--ignore-scripts
--no-save` — no supply-chain concern.
- Two new GH Actions workflows are least-privilege (`contents: read`, no commit step);
  no secret reachable outside the `Authorization` header.
- No SSRF / attacker-controlled surface in the gameplay diff (pure in-memory state).

### Verdict: **NO-MERGE**

Blockers (both owned outside this session's lane, neither touched by our reference-hunt
commits):

1. Van-objective-becomes-free — needs `game-designer` arbitration + `dev-gameplay` fix.
2. `speaker_wall.png` broken chroma background — needs `concept-artist` prompt fix +
   `dev-tooling-assets` regen.

Prettier BLOQUANT already fixed (commit `de8b6135`). This session's own additions
(reference board, `art-culture.md`, `LICENSES.md`, this handoffs shard) carry **zero**
CONFIRMED findings beyond the now-fixed formatting slip.

Process note: the working tree carries substantial **unrelated, uncommitted** work from
a concurrent session (CI review-panel automation itself — `panelFindings.mjs`,
`panel-write-*.mjs`, ADR-0070 draft, `.github/actions/panel-reviewer/`, `FlyerWall.*`,
`NearForeground.tsx` boss-QTE z-order fix). None of it is in `origin/main...HEAD`, none
of it was touched or reviewed by this panel, per Bertrand's explicit instruction to
leave it alone.

---

## Design arbitration — van objective (blocker #1) — `game-designer` (Sacha), 2026-07-26

**Requested by:** the panel above (MAJEUR #2, 4/4 reviewers CONFIRMED) and ADR-0071 §Négatif's own
explicit call for a `game-designer` ruling. **Spec:**
`docs/game-design/spec-delivery-van-assault.md` (status DRAFT — needs `lead-game-designer` PASS
before `senior-architect` plans it; `dev-gameplay` implements, I do NOT).

**Decision (one line):** the vehicle is chipped by **its own scripted assault** — 2 enemies seated
at the free window slots nearest `stopPosition.x` (within 7 u) when the van enters `INCOMING` —
while they are alive and **targetable**, wherever the camera looks, and **by nothing else**. The
camera stops being an input of the damage rule; proximity stops being a filter on the ambient wave
and becomes a _seating_ rule.

**Played it before ruling** (real `tickGameState`, 60 Hz, 7 runs across belliard/stalingrad/vitry,
QTE isolated, camera parked). Findings sharper than the panel's:

1. Free confirmed: 7/7 runs `SUCCESS` + full bonus with zero player action.
2. **The incentive is INVERTED, not merely absent.** Damage appeared ONLY in the runs where the
   camera pointed AWAY from the van (belliard cam −18 → 86/100; vitry cam −25 → 47.6/60). Camera on
   the van → **exactly 0 damage**. Today's rule reads "the van is hurt in proportion to how much
   the player engages the fight somewhere else"; optimal play during `DELIVERING` is to stop
   playing.
3. **ADR-0071's own suggested fix (proximity filter) is a measured NO-OP** — 0 damage in 7/7 runs,
   because (i) the freeze means an off-screen enemy never _enters_ `SHOOTING`, so a proximity filter
   has nothing to count, and it re-opens the frozen-shooter-chips-forever hole the camera filter was
   added to close; (ii) slots near the van are a small minority (R = 7: 10/54 belliard, 7/48
   stalingrad, 28/152 vitry, 2/16 niveau-final) against waves of `1 + wave` enemies, so the outcome
   would be decided by the `spawnWave` shuffle — predetermined, zero agency.

**Key properties of the ruling:** ADR-0071 needs **no exception and no amendment to its rule** — a
frozen assailant threatens the _vehicle_ (a HUD gauge) and never the _player_ (it cannot enter
`SHOOTING` off-screen ⇒ no bullet), so Bertrand's "off-screen enemy cannot shoot" holds literally.
Seating at `INCOMING` (4.4-5.8 s before the window) turns the roll-in into a real telegraph and
rewards pre-emption. Assault retires (`DEAD`, no credit) when the window closes, so it never
pollutes `allDead`.

**Tuning:** `DAMAGE_PER_ASSAILANT_PER_SECOND` 8 → **10** (the single tuned value),
`DELIVERY_ASSAILANTS` = 2, `ASSAULT_RADIUS` = 7 u (the van + both assailants fit one uncropped
frame), ids from 900000. Ignore ⇒ `FAILED` at 5.0 s / 4.0 s / 3.0 s / 3.0 s of an 8/7/6/6 s window;
mobile worst case (2 riots, 1.5 taps/s, +0.5 s reaction) costs 50 damage ⇒ still `SUCCESS` on all
four levels. **No `levels.ts` data change.**

**Trap flagged for the implementer:** the seating exclusion must skip slots occupied by ANY enemy
entry **including `DEAD`** — `EnemySprite` resolves its occupant with
`enemies.find(e => e.slotIndex === slotIndex)` (first match), so an assailant seated behind a corpse
would render nothing while chipping the gauge. (Shipped levels have 0 duplicate slot positions —
verified 54/48/152/16 — so slot-index exclusion suffices.)

**Hand-offs opened:**

- `lead-game-designer` (Karim) — **design gate PASS required** on the spec before anything is coded.
- `pm` (John) — scope call, stated explicitly in spec §8: D2 (the seating) is more than the panel's
  one-line filter swap, but there is no honest minimal version (the alternative is a knowingly-fake
  bonus or `bonus: 0`), and its surface is `src/game/**` only, one lane, no render/art/audio/data
  change. My position: it belongs in THIS story.
- `dev-gameplay` — implements after the gate (AC1-AC15 in spec §5; AC2 replaces
  `stateMachine.test.ts:1492`, which currently pins the exploit as expected behaviour).
- `ux-designer` — telegraph the objective at `INCOMING` too (`DeliveryIntegrityBanner` renders only
  on `DELIVERING`) + off-screen direction cue toward the van. Fairness-relevant: edge-scroll is
  8 u/s over up to 31 u of street, so a 6 s window is unreachable without pre-warning.
- `lead-art` — read requirement only: the two assailants must read as firing DOWN at the vehicle,
  not at the player.
- `narrative-designer` — one line on who ambushes the delivery.
- `senior-architect` + `tech-writer` — ADR-0071 §Négatif's van bullet is now resolved by this spec
  (the ADR's rule itself stands unamended); architect's call whether the assault warrants its own
  ADR before ADR-0071 flips to Accepted.

**Panel blocker #1 status:** design DECIDED (this section). Still NO-MERGE until the gate PASSes and
`dev-gameplay` lands it (plus blocker #2, `speaker_wall.png`, owned by `concept-artist`).

---

## Blocker 2 levé côté prompt — `speaker_wall` conflit chroma (concept-artist, Maud, 2026-07-26)

Réponse au finding **[MAJEUR] public/assets/boss/speaker_wall.png** ci-dessus. Corrigé :
**uniquement** la clause de fond du prompt `boss.types.speaker_wall` dans
`src/game/levels/levelArt.json` (1 ligne, 0 autre clé touchée).

- **AVANT** — `a hand-built teknival sound-system wall `**`on a completely flat uniform black background filling the frame`**`, a wide pyramid of mismatched plywood bass-bins and horns stacked on a pallet rig, cables looping between the cabinets, a sprayed stencil spiral on one face`
- **APRÈS** — `one hand-built teknival sound-system wall `**`as a single isolated object`**`, a wide pyramid of mismatched plywood bass-bins and horns stacked on a pallet rig, cables looping between the cabinets, a sprayed stencil spiral on one face`

Pourquoi ça ne peut plus contredire `COMIC_TAIL` : le sujet ne nomme **plus aucun fond ni aucune
couleur** (0 occurrence de `background`/`backdrop`/`black`/`magenta`), donc la queue est la **seule
autorité** sur le fond — même patron que les 8 autres entrées `boss.types.*`. La clause de
remplacement est un verrou de **composition** (objet unique, isolé), qui _renforce_ le
`floating isolated on a … #FF3CDC background` de la queue au lieu de se battre avec lui ; elle
reprend la charge utile de [B4] (tuer la traction photo-outdoor du référent teknival, échec mesuré
à 94,3 %) sans rouvrir le conflit. `one` (ex-`a`) est le garde-fou mono-objet de `lustre`. Contenu
du sujet inchangé par ailleurs (pile teknival, bass-bins/horns contreplaqué, pallet rig, câbles,
stencil spray).

Budget : sujet **36** mots (41 avant), **assemblé 106** avec le `COMIC_TAIL` réellement envoyé
(bande du set 95-105), 93 avec `boss.style` ; **0 négation** dans le sujet ; `<= 120` §3.3 tenu.
`node scripts/check-art-prompts.mjs` **vert** (14 warnings préexistants, aucun sur `boss`),
`prettier --check` vert. Rationale complète + variante rejetée (retrait sec de la clause, gardée en
fallback) : `docs/art-direction/prompt-drafts/boss-commander.md` §[B5]. Note : la prémisse du
RULING (2) de lead-art qui avait _restauré_ ce verrou noir (« la queue porte bien le fond noir ») est
devenue fausse au passage du set sur la queue comic-ink/magenta — la correction sert la même
intention sur la queue réelle.

**Non fait, délibérément** : aucune régénération d'asset (pas de script, pas d'appel API) — le PNG
reste cassé sur disque. **Suite : `dev-tooling-assets`** régénère `public/assets/boss/speaker_wall.png`
(seed 4878, épinglé, inchangé) → **`lead-art` Gate 2** sur le PNG (watch : retour de la photo outdoor

- plus aucune masse opaque non-magenta sur les flancs). Le blocker 1 (van-objective gratuit,
  `game-designer`) est hors de ma lane et reste ouvert.

## Blocker 2 — FERMÉ : asset régénéré et gated (2026-07-26)

Dispatch `gen-boss-sprites.yml` (run [30206080475](https://github.com/bczy/prohimuf/actions/runs/30206080475),
seed 4878 épinglé, `regenerate: false` — idiome missing-file, PNG cassé supprimé au préalable
en `3c928274`). Résultat : le conflit de fond est bien résolu — sujet isolé, dominance 100%,
plus aucune masse noire opaque — mais le run a échoué sur un gate DIFFÉRENT et plus étroit :
`Sprite integrity gate` a compté **546 px semi-transparents** (`0<alpha<255`), 0 autorisé.
Cause : `keyAndDown()` (scripts/lib/gptimage.mjs) binarise bien l'alpha à pleine résolution,
mais le crop+resize final (`imageSmoothingEnabled: true`) lisse les bords — `speaker_wall`
est un PROP, explicitement exclu du passage `fill-sprite-holes.mjs` (finding E4, réservé aux
7 figures humanoïdes) qui aurait sinon absorbé ce résidu comme effet de bord.

Pas de nouveau régen payant : le PNG généré par ce run a été récupéré depuis l'artefact CI
(`boss-sprites-unpushed`, le job échoue avant `Commit sprites` donc rien n'atterrit sur la
branche automatiquement), puis binarisé localement (seuil alpha à 128, contenu RGB inchangé)
avec `@napi-rs/canvas` déjà en dépendance. Revérifié en local avec les deux scripts réels :
`node scripts/check-sprite-integrity.mjs --file …` → PASS (dominance 100%, 0 semi px, 0 comp
speckle) ; `node scripts/desaturate-enemy-figure.mjs --check …` → PASS. Committé en `50739cfa`.

**Note pour `dev-tooling-assets` (hors scope de ce fix, à considérer séparément)** : `keyAndDown()`
peut laisser des pixels semi-alpha après le resize sur des PROPS non couverts par le solidify
figures — un futur regen d'un autre prop pourrait retomber sur le même gate sans ce filet local.
Piste : binariser l'alpha (seuil 128) juste après le `drawImage` de resize dans `keyAndDown()`
elle-même, universellement, plutôt que de compter sur le hasard du contenu.

**Blocker 2 : CLOS.** Reste ouvert : **Blocker 1** (van-objective gratuit) — voir la section
game-designer ci-dessus/à venir.

---

## Design gate — `lead-game-designer` (Karim), 2026-07-26

**Deliverable:** `docs/game-design/spec-delivery-van-assault.md` (Sacha, DRAFT, 345 lines).
**Downstream blocked on this verdict:** `senior-architect` (tech plan) → `dev-gameplay` (TDD).
**Rework round:** 1 of 2 (cap per `.claude/agents/COLLABORATION.md`).

### VERDICT: **PASS WITH CORRECTIONS** — spine RATIFIED, 4 blocking corrections (K-1…K-4)

The decision itself is right and I ratify it whole: the threat must be **directed**, not derived
from the ambient wave. §2's rejection of ADR-0071's own suggested fix is **measured, not argued**
(no-op in 7/7 runs) and independently coherent with the code — `SHOOTING` is only ever _entered_
on screen, so a proximity filter over the wave has nothing to count. D1 (targetable-set damage),
D2 (seating at `INCOMING` as telegraph), D3 (retirement) and §7's alternative table are sound and
need no rework.

But three of the spec's load-bearing artefacts are arithmetically wrong _because they forgot
ADR-0071 applies to the assault too_: the assailants are ordinary window enemies, so an **on-screen**
assailant cycles (≈72 % exposure duty) while an **off-screen** one freezes exposed (100 %). That
single omission falsifies AC2, softens the whole §4.2 table, and leaves the "watch the van and do
nothing" player possibly still free on Belliard. Corrections are surgical — no re-architecture.

### What I verified against the shipped code (all PASS)

1. **Scope / cahier des charges — PASS.** No new mechanic, no new entity, no new state, no new
   authored field, no new asset. `pickKindFor` filtered to `ARCHETYPES[k].shoots` stays inside the
   level's own pool ⇒ preload/manifest untouched (and the empty-pool edge is already safe:
   `pickKindFor(seed, [])` returns `"normal"`, itself a shooter — `enemyTypes.ts:185`). §8's framing
   is in fact _too modest_: `Livrer` is not a loose extension, it is one of the three pillars of the
   **"boucle de gameplay core (intouchable)"** (`PROJECT_GUIDELINES` §1). A pillar objective that is
   provably free is a **regression against the guidelines**, not a missing nice-to-have — which
   settles the §8 scope question in Sacha's favour: it belongs in THIS story. "Une mission = 3-5 min"
   untouched (no added phase, no added time).
2. **Core loop — PASS.** `Récupérer → Livrer → Éviter` all three served: the assault restores a real
   `Livrer` stake, is cleared by the shooting core verb, and its return fire feeds `Éviter`.
3. **ADR-0071 coherence — the spec's reading is CORRECT, verified line by line.** No exception and no
   amendment needed: the bullet spawn keys off the **transition** into `SHOOTING`
   (`stateMachine.ts:454-458`, `wasShooting` edge), and `tickEnemy` (`enemySystem.ts:74`) freezes
   every state but `HIT` — so a frozen assailant can never spawn a round. It threatens the **gauge**,
   never the **player**. Bertrand's rule holds literally. D2.4's choice of `VISIBLE` at seating (vs
   `HIDDEN`/`APPEARING`) is the right one for exactly the reasons given.
4. **Predicate claim — PASS, byte-exact.** `resolvePlayerShot` skips `DEAD | HIT | HIDDEN`
   (`bulletSystem.ts:126`) ⇒ targetable = `APPEARING | VISIBLE | SHOOTING`. The shared-helper /
   "you only ever lose integrity to something you could have shot" invariant is real and is the best
   idea in the spec.
5. **The DEAD-slot trap — CONFIRMED real.** `EnemySprite.tsx:117` is
   `enemies.find((e) => e.slotIndex === slotIndex)`, first match ⇒ seating behind a corpse renders
   nothing. AC8 is load-bearing, keep it.
6. **`ASSAULT_RADIUS = 7` framing math — PASS.** `VIEW_W 18` ⇒ half-frame 9; enemy plane ≈2.1 ⇒
   7 + 1.05 = 8.05 < 9, margin 0.95. The "van + both assailants in one uncropped frame" claim holds,
   and every shipped `stopPosition.x` (0 / −2 / +2 / 0) is inside the pan clamp.
7. **Cross-spec / cross-ADR — no contradiction found.** ADR-0002 (delivery in core state) is
   untouched. Hostage QTE Belliard triggers at 12 s and resolves before the 20 s delivery; the
   Belliard boss is timer-triggered (ADR-0059 Am.2) and the Niveau Final boss quota-triggered — no
   concurrency with the window. `CRATE_DELIVERY_GAP_X = 2.0 < R = 7`, so a crate CAN sit in the
   assault zone: covered by AC8, and Niveau Final authors no `lootSpec`. `spec-boss-niveau-final-level.md`
   §1.6 ("delivery held ≈ Vitry, not the escalation axis") stays satisfied — same `integrity`/`window`,
   same damage rule ⇒ same t_fail as Vitry. **Except under K-3.**

### BLOCKING corrections — `game-designer` (Sacha) owns all four; `dev-gameplay` does not open a red test before my re-check

**K-1 — AC2 is falsified by ADR-0071 and cannot pass as written. Replace it.**
AC2 demands an _identical integrity series_ for `cameraOffsetX` 0 vs 25. It cannot be identical: the
assailants are ordinary enemies, so at camera 0 they cycle (`VISIBLE→SHOOTING→HIDDEN→APPEARING`,
targetable ≈72 % of the time) and at camera 25 they freeze in `VISIBLE` (targetable 100 %). Integrity
IS camera-dependent — through the freeze, not through the damage rule. Handing this AC to a TDD lane
hands it a test that is red for a correct implementation, and invites an improvised reinterpretation
of the panel's own blocker. Replace with the properties that are true AND that kill the exploit:

- (a) **no free camera position**: the ignore case ends `FAILED` with `scoreDelta 0` for every camera
  x in a set spanning on-van and far-off-van (e.g. `{0, ±9, ±18, 25}`) — this is the panel's blocker,
  correctly pinned;
- (b) **structural**: the delivery damage count is a pure function of the enemy array — no
  `isOnScreen` / `cameraOffsetX` / `cameraOffsetY` read in the delivery selection path (assert by
  construction, e.g. the count helper takes no camera argument);
- (c) **orientation, not equality**: `damage(camera on the van) ≤ damage(camera away)` — the
  inversion the panel found is reversed, engagement never punishes the van.
  Keep AC2's deletion instruction for `describe("frozen mid-SHOOTING")`
  (`src/game/systems/__tests__/stateMachine.test.ts:1441-1499`, cases at 1492 and 1496 — I verified
  both pin the exploit as expected behaviour) and keep AC14 as the ADR-0071 survivor. Also fix the
  over-claim in §0/D1: "the camera is not a **term of the damage rule**" is true and sufficient;
  "integrity is camera-independent" is false — say the former.

**K-2 — §4.2's tuning table is computed at 100 % exposure, i.e. only for the player who is NOT
looking. Recompute at the real duty cycle and re-tune, or re-seat.**
From `ARCHETYPES` + `enemySystem` (`APPEARING 0.3`, `SHOOTING 0.5`): targetable duty =
**normal 4.0/5.5 = 72.7 %**, **riot 4.4/6.1 = 72.1 %**, **biker 2.8/4.0 = 70 %**. So the honest
ignore case — camera parked ON the van, player never fires, very plausible on mobile —
is `t_fail = integrity / (N·D·duty)`:
| Level | §4.2 claims | on-screen ignore (smooth) | margin vs window |
| --- | --- | --- | --- |
| belliard (100 / 8 s) | 5.0 s (37 %) | **≈6.9 s** | **13 %** |
| stalingrad (80 / 7 s) | 4.0 s (57 %) | ≈5.5 s | 21 % |
| vitry & niveau-final (60 / 6 s) | 3.0 s (50 %) | ≈4.1 s | 31 % |
Worse, the drain is not smooth: D2.4 seats both assailants with the **same** timer, so identical
kinds cycle in **lockstep** — the gauge drains in 20/s bursts separated by 0/s duck-backs, and the
outcome depends on where the window boundary falls in that pattern. My discrete walk of Belliard
(roll-in ≈4.4 s, both `riot`) lands at **≈100 damage against a 100 gauge** — i.e. the "watch and do
nothing" player may **keep the 500 bonus**, which is the exact defect we are repairing. Required:

- recompute §4.2 (t_fail, the reference-player rows, and §4.3's `A ≤ 0.53·N·W` derivation) with the
  per-archetype duty cycle, stating which case each number describes (frozen / on-screen);
- re-tune so the ignore case fails with an explicit margin (state it, ≥20 % of the window is my
  floor) on **all four levels × every seatable kind pair × both camera cases** — `D` is your
  one-variable knob, but seating/stagger is legitimately on the table;
- rule explicitly on the lockstep timer: stagger it (`spawnWave`'s `timer * (1 + i*0.3)` is the
  house precedent, DRY) or justify synchrony as intended;
- fix the AC3 value accordingly and say in which configuration it is measured.

**K-3 — D2.3 ("seat as many as available") re-imports the very lottery §2 rejects, and it lands on
the finale.** Niveau Final has exactly **2** candidate slots for 16 total slots; waves seat `1+wave`
enemies on shuffled slots and **corpses persist in the array until `allDead`**, so at the 18 s
trigger there is a materially likely chance (order 1/3 at wave ≈3) that one candidate is occupied ⇒
**1 assailant** ⇒ `t_fail` = 6.0 s frozen / **8.3 s on-screen** against a **6 s** window ⇒ the
objective is **free again**, decided by a shuffle the player cannot influence. That is §2's own
"coin the game flips for you", and it breaks an **already-gated** spec:
`spec-boss-niveau-final-level.md` §1.6 + its monotonic-hardest curve (the finale would be _easier_
than Vitry in a third of runs). One contradictory spec fails the set, so this is blocking. Required:
a **deterministic guarantee of `DELIVERY_ASSAILANTS` seated** on every shipped level, or an
explicitly authored fallback. Your call among (non-exhaustive, do not widen R past 7.9 — it breaks
the one-frame guarantee of §4.1): reserve the R-zone slots from the wave while a delivery is armed
(`spawnWave` already takes `excludeSlots` — ADR-0055 D5 precedent, and the determinism cost must be
weighed); relocate the ambient occupant deterministically; per-level authored assault slots. Then
**AC12 must pin the SEATED count under occupancy** (corpse on a candidate, crate on a candidate,
wave enemy on a candidate), not only the geometric candidate count.

**K-4 — the assault's identity is never specified, and AC5/AC6 cannot be written without it.**
D1 counts "THIS delivery's assault enemies" and AC6 requires a wave enemy 1 u from the van to
contribute 0 — so the implementation needs a discriminator. D2.6 pins **ids** (900000+i) but never
says identity is derived from them; the alternatives (a flag on `Enemy`, an id list on the delivery
state) have different boundary/serialisation costs. State the discriminator you assume, or write
"delegated to `senior-architect`" explicitly — do not leave a TDD lane to guess. Note AC15 forbids
new fields on `DeliverySpec`/`LevelConfig` but says nothing about `Enemy`: make that intent explicit.

### Re-scoped hand-offs (D5) — my ruling on the "non-blocking" claim

**K-5 — the `ux-designer` telegraph is NOT non-blocking. It is a fairness precondition, and I make it
blocking for stage-5 design acceptance and for the merge** (not for the dev lane, which is
`src/game` only — the two run in parallel on non-overlapping paths). The spec's own arithmetic
proves it: edge-scroll 8 u/s over up to ~31 u of street = 3.1-3.9 s of travel, against `t_fail`
**3.0 s** on Vitry and Niveau Final — and the only existing surface,
`DeliveryIntegrityBanner`, renders **solely** on `phase === "DELIVERING"` (verified), i.e. the player
is first told the objective exists at the instant the gauge starts draining. Shipping the mechanic
without an `INCOMING`-phase telegraph + off-screen direction cue ships an objective that is lost for
reasons the player could not perceive, on the two hardest levels. Commission it now, in parallel.
Pre-declare the design-lane fallback if UX slips (a stated `D` reduction, per your own §6.5
discipline) so nothing stalls.

**K-6 — D5's `lead-art` read requirement contradicts D2.7 and must be reframed before it reaches
Nico.** "The player must tell they are firing **down at the vehicle**, not at him" is false as a
mechanic: D2.7 makes them ordinary shooters, and since ADR-0065 their rounds are **aimed at the
player** (`aimBulletVelocity` toward the camera; a `riot` round costs a full heart). Art that reads
them as busy with the van manufactures a **false affordance** — the player ignores a threat that
will take a heart. Reframe the read as: they must read as _pinning the van_ (that is why the gauge
drops) **while staying legible as live shooters that will fire at the player once framed**. Style
stays lead-art's call; the mechanical truth is ours.

### Advisories (non-blocking; carry to the verify leg / disclose in the spec)

- **A1** — assault kills are quota-eligible (`countsAsTarget`), so clearing the assault can cross
  `enemiesToWin` and end the level **mid-window**, voiding the very bonus the player was earning.
  Rule it explicitly (accept + disclose, or exclude — the cheaper call is almost certainly accept).
- **A2** — the objective now costs **lives**: each on-screen assailant fires once per cycle, aimed,
  `riot` = 1 full heart of 3. §4.2 prices integrity only. Add "lives lost during the window" to the
  §6 mobile playtest capture — that is the sharpest stage-5 risk after K-2.
- **A3** — ADR-0071's accepted muzzle-flash cosmetic (frozen mid-`SHOOTING` = permanent flash) will
  now occur **next to the van**, in the player's focus. Known-cosmetic, route as a note to
  `lead-art` / `dev-r3f-render`, not a blocker.
- **A4** — while assailants live, `allDead` is false ⇒ the wave rollover pauses for the duration of
  the set-piece. D3's retirement clears it. Acceptable; disclose in D3.
- **A5** — §8 should be re-framed per the guidelines finding above (repair of a mandated pillar, not
  a feature addition). It strengthens the `pm` scope call rather than weakening it.

### Sequencing after this gate

1. Sacha ships **Rev.2** with K-1…K-4 (spec text + §4 numbers + AC set). Back to me for a fast
   re-check — round 1 of 2 consumed.
2. In parallel, `ux-designer` opens the K-5 telegraph spec (blocks acceptance, not the dev lane);
   `narrative-designer` the D5 line; I hand `lead-art` the K-6-reframed read.
3. `pm` (John) rules the §8 scope call — my design-side position: **in this story**, since a free
   pillar objective is a guidelines regression, and the surface is one lane / `src/game/**` only.
4. `senior-architect` plans (K-4 discriminator, seating seam at the `IDLE→INCOMING` edge detected
   from `tickDelivery`'s result, K-3's mechanism, and the ADR call) → `dev-gameplay` TDD.
5. Stage 5: Sacha playtests §6 (+ A2's lives capture, + the K-2 ignore-case margins) → design
   acceptance verdict from me before the architect's integration review.

**Panel blocker #1 status:** design DECIDED and now GATED **with blocking corrections**. Still
NO-MERGE until Rev.2 passes, `dev-gameplay` lands it, and the K-5 telegraph ships.

---

## Scope call — pm (John), 2026-07-26

Saisi par `game-designer` (Sacha) §8 de `docs/game-design/spec-delivery-van-assault.md` : trancher
si D1-D4 (le fix du damage rule, `src/game/**` seulement) entre dans CETTE story de merge ou si un
correctif neutre + une story d'assaut scripté séparée plus tard est préférable, et si D5 (ux-designer
/ lead-art / narrative-designer) est bloquant. Lu le spec en entier + `PROJECT_GUIDELINES.md`.

### 1. D1-D4 dans cette story — OUI

Pas de version minimale honnête qui vaille la peine d'être livrée séparément :

- Le §2 du spec **mesure** que la propre suggestion de l'ADR-0071 (filtre de proximité sur la vague
  ambiante — c'est exactement le « fix neutre » qu'on pourrait envisager comme lot minimal) est un
  **no-op** : 0 dégât sur 7/7 runs, pour deux raisons structurelles (le freeze prive le filtre de
  toute matière à compter ; les slots proches du van sont une minorité de la vague, donc l'issue
  serait décidée par le shuffle de `spawnWave` — une loterie, pas un objectif). Il n'existe donc pas
  de « petit fix propre » à livrer maintenant : les seules alternatives neutres sont un objectif
  encore gratuit (le no-op ci-dessus), un retour à la règle pré-ADR-0071 (réintroduit le trou du
  tireur gelé qui grignote à l'infini — §7), ou `bonus: 0` qui retire un pilier du core loop
  documenté. Le spec les classe lui-même comme pires (§7), une seule explicitement « fallback si pm
  refuse, non recommandée ». Reporter D1-D4 ne réduit donc pas le risque, ça retarde le seul design
  qui fonctionne tout en laissant tourner en prod un objectif qui, chiffres à l'appui, récompense
  aujourd'hui de regarder ailleurs — pire que free, inversé.
- Surface disciplinée : `src/game/**` seulement (`deliverySystem.ts` + `stateMachine.ts` + tests),
  une seule lane, aucun changement de rendu/art/audio/dépendance/frontière, aucun nouveau champ
  `levels.ts`. C'est le profil exact d'un changement qui appartient à la story qui l'a fait remonter,
  pas d'un scope creep qu'on isolerait.
- Le blocage de merge porte précisément sur cette question, et l'ADR-0071 demandait explicitement
  cet arbitrage plutôt qu'un choix implicite — le reporter reviendrait à re-choisir implicitement
  (en gardant le statu quo cassé) ce que l'ADR refusait de trancher seul.

**Décision : D1-D4 reste dans cette story.** Karim (`lead-game-designer`) gate la qualité du spec —
ce n'est pas mon rôle de la juger — mais le fait qu'il fasse partie de CETTE story de merge, oui.

### 2. D5 (ux-designer / lead-art / narrative-designer) — suivi, non bloquant

Confirme la proposition du spec : ce sont des lectures compagnons, pas des conditions de correction
du damage rule. Aucune ne touche `src/game` ni la mécanique elle-même ; elles enrichissent la
lisibilité (télégraphe UX, sens de tir visuel, ligne de fiction) d'un mécanisme déjà correct sans
elles. Un point mérite un fast-follow **rapide plutôt qu'un simple "un jour"** : le spec note qu'un
joueur loin de la camionnette au moment `INCOMING` peut être **physiquement incapable** d'atteindre
le point de rendez-vous avant la fenêtre `DELIVERING` (edge-scroll 8 u/s sur jusqu'à 31 u, fenêtre de
6-8 s) faute de télégraphe précoce — un souci d'équité de lecture, pas de mort injustifiée (`FAILED`
ne coûte ni vie ni points, conforme à la règle 6 des guidelines « jamais de mort bullshit »). Je
recommande à `producer` d'ouvrir la story ux-designer immédiatement après celle-ci, pas dans un
backlog indéterminé — mais elle ne bloque pas ce merge.

### 3. Cohérence avec PROJECT_GUIDELINES — confirmée

Je confirme la lecture du spec §8. `Livrer` fait partie du core loop non-négociable
(`Récupérer → Livrer → Éviter`, §1 des guidelines) : un objectif structurellement gratuit et inversé
sur ce pilier n'est pas un bug cosmétique, c'est le core loop lui-même qui ne fonctionne pas. Le test
du cahier des charges est correctement appliqué : l'objectif `Livrer` en tant que tel est une
extension de muf (Prohibition Atari ST n'avait pas de camionnette à protéger), documentée et
justifiée de longue date ; mais **la grammaire de l'assaut** — des tireurs pop-up aux fenêtres qu'il
faut abattre avant qu'ils n'atteignent leur cible — est exactement le vocabulaire de Prohibition,
donc ce spec n'ajoute aucune mécanique nouvelle, il corrige qui occupe les slots et quand. YAGNI/DRY/
KISS tiennent aussi : pas de nouveau champ par-niveau (`DELIVERY_ASSAILANTS` est une constante, pas
une donnée), prédicat de ciblage partagé avec `resolvePlayerShot` (DRY), aucune nouvelle entité/état/
surface de rendu (KISS).

### Prochaine étape

1. `lead-game-designer` (Karim) — gate qualité du spec (PASS/révision), inchangé par cet arbitrage de
   scope.
2. `senior-architect` (Winston) — confirme la lane (`dev-gameplay` seul, single-lane) et tranche si
   l'assaut mérite sa propre ADR ou reste sous ADR-0071 inchangé (le spec argue que non — D4).
3. `dev-gameplay` implémente AC1-AC15 (spec §5) **maintenant**, sur cette même branche/story — pas de
   story séparée, pas de fix "neutre" intermédiaire.
4. `ux-designer` : story de suivi ouverte tout de suite après (fast-follow recommandé, non
   bloquante). `lead-art` / `narrative-designer` : suivi standard, non bloquant.

---

## K-5 — télégraphe INCOMING (ux-designer, Tony), 2026-07-26

Réponse à la re-qualification de Karim (K-5, section "Design gate" ci-dessus) : le télégraphe UX
n'est pas un follow-up, il est **bloquant pour l'acceptation stage-5 et pour le merge** — l'arithmétique
du spec de Sacha le prouve (edge-scroll 8 u/s sur jusqu'à 31 u = 3.1-3.9 s de trajet, contre un
`t_fail` mesuré 3.0-5.0 s selon niveau/config, et le seul signal existant,
`DeliveryIntegrityBanner`, ne s'affiche qu'en `DELIVERING` — le joueur apprend l'objectif au moment
exact où le gauge commence à descendre).

**Livrable :** `docs/game-design/ux/spec-delivery-assault-telegraph.md` (DRAFT, attend PASS
`lead-game-designer`). Deux besoins spécifiés :

1. **Signal à `INCOMING`** — le banner top-centre existant (`DeliveryIntegrityBanner.tsx`) gagne une
   branche `phase === "INCOMING"` : même chip/gauge-track, gauge pleine et statique (l'intégrité est
   déjà au max tant que `DELIVERING` n'a pas commencé — aucune nouvelle donnée), copie distincte
   (placeholder, Yasmine tranche le texte final). Le hook est déjà là : `DeliveryVehicleSprite.tsx`
   pousse déjà `phase` vers le HUD à chaque tick d'`onHudChange`, avant toute porte de visibilité —
   donc **zéro plomberie neuve** pour le signal lui-même, juste une branche de rendu.
   Propriété robuste au Rev.2 de Sacha : ce signal donne au joueur toute la durée d'`INCOMING`
   (4.4-5.8 s) EN PLUS du `t_fail` — le manque mesuré aujourd'hui (0 s d'alerte vs jusqu'à 3.9 s de
   trajet requis) disparaît quels que soient les chiffres que Rev.2 retiendra.
2. **Repère directionnel hors-écran vers le van** — PAS une réutilisation du `OffscreenArrowIndicator`
   existant (la bague à 4 flèches pointe vers l'ennemi le plus proche du crosshair, un aim-assist qui
   peut tirer dans une direction totalement différente au même instant — collision de lecture si on
   partage ses 4 slots d'écran). Nouveau calcul, ancré sur le banner lui-même (pas les bords d'écran) :
   actif ssi `phase ∈ {INCOMING, DELIVERING}` ET `!isOnScreen(vehicle.position, cameraOffsetX,
cameraOffsetY)` — **le même prédicat pur que ADR-0071 utilise pour geler les ennemis**
   (`src/game/systems/viewport.ts`), donc le repère et le gel des assaillants ne peuvent jamais se
   contredire. Calculé dans `useGameLoop.ts` (même endroit que `computeTargetIndicator`, même forme
   `HudTargetIndicator` réutilisée), zéro changement `src/game`.

**Surface d'implémentation estimée** (résumée en §6 du spec, pas une décision) : 3 fichiers
render-only (`DeliveryIntegrityBanner.tsx`+css, `useGameLoop.ts`, `hud/types.ts` +1 champ optionnel) —
aucun changement `HudDelivery`/`DeliverySpec`/`LevelConfig`, aucun nouvel asset, aucune dépendance.

**Accessibilité** : distinction INCOMING/DELIVERING et direction toujours portées par texte/forme (pas
la couleur seule) ; zéro animation neuve ajoutée par ce spec (le swap de phase reste un remplacement
de contenu discret, comme le stamp de verdict existant) — donc pas de nouvelle case
`prefers-reduced-motion` à ouvrir, juste l'obligation explicite de ne pas en ajouter sans la gater ;
glyphes de flèche `aria-hidden`, texte du chip déjà exposé nativement. Mobile : clearance vérifiée au
breakpoint short-landscape existant (`SHORT_LANDSCAPE_MEDIA`), et un flag non-bloquant vers Sacha pour
ajouter au playtest stage-5 la mesure "cue perçu → van atteint" (pas seulement le budget
assaillant-secondes déjà chiffré en §4.2/§6 de son spec).

**Suite :** attend `lead-game-designer` PASS ; en parallèle `narrative-designer` (copie finale),
`lead-art` (encre/placement des glyphes), `senior-architect`/`dev-r3f-render` (implémentation, pas
d'ADR attendu — même précédent que `targetIndicator`). Je révise à nouveau une fois le Rev.2 de Sacha
posé, mais je ne m'attends pas à un re-gate (le fix est structurel, pas chiffré).

---

## Rev.2 du spec — `game-designer` (Sacha), 2026-07-26 — réponse au design gate K-1…K-4/K-6

**Livrable :** `docs/game-design/spec-delivery-van-assault.md` **Rev.2** (même fichier, historique de
révisions en tête, tout ce que Karim a RATIFIÉ conservé tel quel : §1, §2, D2.1/2.2/2.4-`VISIBLE`/2.5/2.7,
D3, §7). Round 1 de 2 consommé — retour à `lead-game-designer` pour re-check.

**Méthode :** rejoué avant de re-tuner. 4 harnais jetables (non commités) sur les vrais modules
(`tickEnemy`/`hitEnemy`/`spawnWave`/`ARCHETYPES` + la géométrie de slots réelle reconstruite depuis
`getBackdropLayout` + `stretchAboutCentre`, comme `GameScene`), 60 Hz, 4 niveaux livrés.

### Corrections bloquantes

- **K-1 — AC2 remplacé.** L'AC "série identique" est supprimée et remplacée par (a) aucune position
  caméra gratuite (`FAILED`/`scoreDelta 0` pour x ∈ {0, ±9, ±18, 25}, 4 niveaux), (b) assertion
  **structurelle** (le helper de comptage ne prend aucun argument caméra — vérifiable à la signature),
  (c) `dégâts(caméra sur le van) ≤ dégâts(caméra ailleurs)`. Wording §0/D1 corrigé : « aucun terme
  caméra dans la règle de dégâts », l'over-claim « intégrité caméra-indépendante » est retiré et
  n'est re-revendiqué qu'en AC2(d), là où il devient vrai. Le `describe("frozen mid-SHOOTING")`
  (1441-1499) reste à supprimer, AC14 reste le survivant ADR-0071.
- **K-2 — §4.2/§4.3 retablés, `D` re-tuné, lockstep tranché.** Duty cycles re-vérifiés sur le vrai
  code, **chiffres de Karim exacts au chiffre près** (normal 4.0/5.5 = 72,7 % ; riot 4.4/6.1 = 72,1 % ;
  biker 2.8/4.0 = 70 %). Sa lecture était même trop douce : en marche discrète, `riot+riot` on-screen
  **survivait carrément** la fenêtre belliard (96,3 dégâts / 100) — pas un coin-flip, une victoire.
  Stagger : adopté au format maison `(1 + i·0.3)` (`enemySystem.ts:130`) appliqué à `visibleDuration`,
  justifié désormais par la lecture + le rythme de tir (mesuré : belliard 73 % vs 56 % de jauge restante
  pour le joueur desktop), plus par les dégâts. Marges : **31/37/44/44 %** (≥ 20 % exigé), et vérifiées
  non par argument mais par **balayage exhaustif de trajectoires caméra** (tous les instants de début de
  pan à 8 u/s, deux directions) : **0 / 8 904 trajectoires survivent** sur belliard, 0/9 180, 0/8 460,
  0/8 280 ailleurs. AC3 corrigé à **5,56 s** avec sa configuration explicite (les deux assaillants
  vivants à l'ouverture, tir nul, caméra fixe, assert à x = 0 et x = 25).
- **K-3 — garantie déterministe de 2 assaillants RÉELLEMENT assis.** Mesuré, R = 7, cohorte réelle :
  niveau-final perd un candidat sur 6 des 10 premières vagues et **les deux** sur 3 d'entre elles
  (`w4 w9 w10` → 0 libre) — pire que l'ordre 1/3 estimé. Élargir R est mesuré et **rejeté** (7,5 et 7,9
  laissent encore 1 libre en `w9/w10` ; 7,9 est le plafond du cadre unique), donc `ASSAULT_RADIUS`
  **reste 7**. Fix retenu : **D2.8, réservation des slots d'assaut pour tout le niveau** (exclus de
  `spawnWave` — argument `excludeSlots` déjà existant, précédent ADR-0055 D5 — **et** du spawn de caisse
  de loot, qui n'exclut aujourd'hui que les slots à ennemi non-`DEAD`). Vérifié vagues 1-30 : 21/16/11/48
  collisions **sans**, **0 avec**, sur les 4 niveaux. AC12 est maintenant en 3 temps dont le point 3
  épingle le **compte réellement assis** sur niveau-final à une vague qui aurait collisionné, avec
  cadavre + ennemi de vague + caisse présents. Coût assumé et retourné en atout : 2 fenêtres près du
  point de dépôt restent vides jusqu'à l'arrivée du van (télégraphe diégétique gratuit, sert K-5).
  Cohérence `spec-boss-niveau-final-level.md` §1.6 rétablie (même `t_fail` que Vitry, courbe monotone
  intacte).
- **K-4 — discriminant nommé : la plage d'id** (`id >= DELIVERY_ASSAULT_ID_BASE = 900000`), justifié
  (zéro nouvel état, aucune liste parallèle à resynchroniser, `Enemy` non élargi donc contrat
  game→render inchangé, une seule livraison vivante à la fois) et coût déclaré (convention tenue par
  les tests, pas par le type). Explicitement **overrulable par `senior-architect`** pour un champ typé —
  une ligne de prédicat, aucune valeur de §4 ne bouge. AC5/AC6 réécrits avec le discriminant, et
  **AC15 dit maintenant explicitement** qu'aucun champ n'est ajouté à `DeliverySpec`, `LevelConfig`
  **ni `Enemy`**.
- **K-6 — wording `lead-art` corrigé.** La lecture exclusive « ils tirent vers le bas sur le véhicule,
  pas sur le joueur » est retirée (fausse : D2.7 + ADR-0065, un `riot` coûte un cœur plein). Remplacée
  par une **double lecture** : (1) ils doivent lire comme _clouant la camionnette_ — c'est pourquoi la
  jauge tombe ; (2) ils doivent **rester lisibles comme des tireurs vivants et dangereux pour le
  joueur** dès qu'il les cadre. Rien qui lise « occupé ailleurs ». Note A3 (muzzle flash gelé à côté du
  van) routée dans le même hand-off.

### ⚠ Un amendement à une décision RATIFIÉE — demande une re-ratification explicite de Karim

En traitant K-1/K-2 j'ai testé le prédicat `targetable` (que Karim a ratifié, « the best idea in the
spec ») contre des caméras **mobiles**, pas seulement les deux caméras fixes. Il ne tient pas : geler
les deux assaillants **pendant leur duck** (`HIDDEN`) suspend complètement les dégâts, et c'est
atteignable par un edge-scroll ordinaire. Balayage exhaustif des instants de début de pan à 8 u/s,
D = 12 : **254-382 / 1 484 timings sur belliard (17-26 %) finissent la fenêtre avec le bonus complet et
zéro tir**, 6-144/~1 400 sur les trois autres, dégâts minimum **0,0**. Aucune valeur de `D` ne ferme un
trou dont le plancher est 0 — c'est le blocker du panel, rouvert par la même porte.

**D1 est donc amendé : les dégâts comptent les assaillants VIVANTS, plus les assaillants `targetable`.**
Gains : la règle ne lit ni la caméra ni aucun état gelable ⇒ `t_fail = I/(N·D)`, **un** nombre par
niveau, prouvable au lieu de tabulé ; 0 trajectoire caméra survivante ; AC2(d) (série identique) devient
vraie. Perte assumée et écrite : le prédicat partagé avec `resolvePlayerShot` disparaît, et l'invariant
« on ne perd d'intégrité que pour une cible qu'on aurait pu abattre » passe de la forme **par tick** à la
forme **par beat** (cible cadrée avec le van, exposée ≥ 70 % du temps, plus longue fenêtre non-tirable
1,7 s, et un roll-in de 4,4-5,8 s où la tuer ne coûte rien). Variantes mesurées et rejetées en §7,
dont `max(1, targetable)` qui ne scelle qu'à `D ≥ 13` — où le joueur mobile lent perd Vitry et le
Niveau Final. Overrule d'une ligne disponible si Karim préfère garder le prédicat ratifié.

### Tuning final

`DAMAGE_PER_ASSAILANT_PER_SECOND` 8 → **9** (seule valeur tunée ; borne basse `D ≥ I/(1.6·N·W) = 7.81`
imposée par la marge de 20 % sur belliard, borne haute `D ≤ 9` imposée par le joueur mobile lent qui
perd Vitry/Niveau-Final à 10). `t_fail` = **5,56 / 4,44 / 3,33 / 3,33 s** (marges 31/37/44/44 %).
`DELIVERY_ASSAILANTS` = 2, `ASSAULT_RADIUS` = **7 (inchangé)**, ids depuis 900000, stagger `(1+i·0.3)`.
**Fallback pré-déclaré** (discipline §6.5) si le verify mobile ou le télégraphe K-5 glisse : `D` 9 → 8
(marges 22-38 %, toujours au-dessus du plancher). Aucun changement de données `levels.ts`.
AC1 → 100 − 18 = **82**. AC4 → intégrité **46**. Nouveau **AC16** (bord assumé : la réservation plafonne
la cohorte de niveau-final à 14 à partir de la vague 14 — injouable, mais dégradation gracieuse épinglée).

**Advisories** : A1 accepté + divulgué (impossible sur la finale, `stateMachine.ts:291`), A2 adopté en
§6.7 (capture des vies perdues sur les deux classes d'appareil, leviers Rev.3 nommés), A3 routé
`lead-art`/`dev-r3f-render`, A4 divulgué dans D3, A5 adopté (§8 réécrit : réparation d'un pilier mandaté).

**Suite :** `lead-game-designer` round-2 (dont re-ratification de l'amendement D1) → `senior-architect`
(plan : discriminant K-4 overrulable, couture `excludeSlots` sur `spawnWave` + `lootSystem`, appel ADR)
→ `dev-gameplay` (AC1-AC16). En parallèle : `ux-designer` K-5, `lead-art` K-6, `narrative-designer` D5.

---

## Design gate — round 2 — `lead-game-designer` (Karim), 2026-07-26

**Deliverables under review (two, verdicted separately):**

1. `docs/game-design/spec-delivery-van-assault.md` **Rev.2** (Sacha) — round **2 of 2**, cap reached.
2. `docs/game-design/ux/spec-delivery-assault-telegraph.md` (Tony, K-5) — **first** gate.

### VERDICT 1 — `spec-delivery-van-assault.md` Rev.2: **PASS WITH CORRECTIONS (minor)** — round 2 CLOSED, **no round 3**

K-1, K-2, K-3, K-4, K-6 are all **LIFTED**. The residual corrections (K-7…K-10 below) move **no
decision and no shipped number**: they are transcription/AC hardening. **`dev-gameplay` may open its
red tests now**, taking K-7…K-10 into account; Sacha folds them into the spec text in parallel (no
re-gate, I verify them at the stage-5 design-acceptance leg).

### THE D1 AMENDMENT — **RATIFIED: the damage counts ALIVE assailants**

I ratified `targetable` in round 1 and I was wrong; Sacha's counter-measurement is right and the
mechanism is verified in the shipped code: `tickEnemy` freezes every state but `HIT`
(`enemySystem.ts:74`), so two assailants caught mid-duck freeze in `HIDDEN`, which under a
`targetable` predicate suspends the drain **entirely and indefinitely** — a hole whose damage floor
is **0**, therefore closable by no value of `D`. That is the panel's own blocker (a camera position
that makes the objective free), re-entered through the pop-up state instead of `isOnScreen`. The
elegance of the shared `resolvePlayerShot` predicate is not worth re-shipping the defect this whole
story exists to repair.

**`max(1, targetable)` at `D = 13` is REJECTED**, and not only for Sacha's reason (empty tuning band:
belliard still exploitable at 12, slow-mobile loses Vitry + Niveau Final at 13). It is _strictly
worse than `alive` on the very axis it was supposed to protect_: when both assailants are ducked it
drains at the SAME rate as when one is exposed, so it keeps 100 % of the "gauge drops with nothing
shootable on screen" legibility cost while **losing** the honest mapping rate ↔ number of attackers.
Two rate concepts, one of them a fiction. No third option beats `alive`: pinning `VISIBLE` for the
beat kills D2.7 + K-6's threat read and needs a `tickEnemy` special case (§7, correctly rejected);
kind-filtering to shrink the duck (`riot.hiddenDuration 1.7` is the worst) is a Rev.3 lever already
named in §6.7, not a rule change.

**What buys the ratification** (and what I now require written down — K-9): under `alive` the
fairness of the beat rests on **D2.4's `VISIBLE` seating**, not on the damage rule. Verified: an
assailant the player is not looking at freezes in the state it was seated in, so the late-arriving
player finds **two exposed, immediately shootable targets** — never a frozen duck. Rev.2 demotes
D2.4 to "purely a read/threat decision"; that is now false in the player's favour and must be
re-promoted to load-bearing, or a future retune of the seating state silently removes the guarantee.

### What I re-verified against the shipped code (all PASS)

- **K-1 lifted, substantively not cosmetically.** AC2 is now (a) no-free-camera-position over
  `{0, ±9, ±18, 25}` × 4 levels, (b) a **structural signature** assertion (the count helper takes no
  camera argument), (c) `damage(on-van) ≤ damage(away)`. (d) re-adds the identical-series claim
  _only_ where the amendment makes it true (ignore case, count constant at 2). The §0/D1 over-claim
  is gone and replaced by the precise "no camera term". The `describe("frozen mid-SHOOTING")`
  deletion + AC14 survivor both held.
- **K-2 lifted, and the method is real, not a stated conclusion.** Duty cycles recomputed exact:
  `normal 4.0/5.5 = 72.7 %`, `riot 4.4/6.1 = 72.1 %`, `biker 2.8/4.0 = 70 %` (re-derived from
  `ARCHETYPES` + `APPEARING 0.3`/`SHOOTING 0.5`). `D = 9` ⇒ `t_fail = I/18` = **5.56 / 4.44 / 3.33 /
  3.33 s**, margins 31/37/44 % — recomputed at 60 Hz tick granularity against the real
  `tickDelivery` ordering (damage-then-test): 334 / 267 / 200 ticks, i.e. AC3's "± one tick" is
  right. The sweep counts are **internally consistent with the geometry**, which is what makes the
  method credible: belliard 8 904 = 6 kind pairs × 1 484 = 6 × 2 × 742 ticks × (4.36 + 8 s); the
  same identity holds to the tick on the other three (9 180 / 8 460 / 8 280 ⇒ 12.75 / 11.75 / 11.5 s
  = roll-in + window). Roll-in cross-check on Vitry exact: `(40 + 4 + 2)/8 = 5.75 s`. Lockstep ruled
  with the house factor `(1 + i·0.3)`; under `alive` it no longer touches the ignore case, which is
  the correct consequence.
- **K-3 lifted, and it does NOT collide with the gated finale spec.** Re-read
  `spec-boss-niveau-final-level.md` §1.2/§1.3/§1.5/§1.6: the finale delivery is deliberately **held
  at Vitry** (60 / 6 s / 300) and is explicitly _not_ the escalation axis ⇒ equal `t_fail` (3.33 s)
  is exactly what §1.6 asks for, monotonic curve intact. The reservation's two new costs are also
  clean against that spec: the cohort cap (14 from wave 14) is unreachable — reaching wave 14 needs
  ≈ 104 kills inside 70 s — and §1.5 states the finale's density is carried by
  `enemySpeedMultiplier 1.8` + `windowWeights`, neither of which the reservation touches (waves ≤ 6
  seat ≤ 7 of 14 remaining slots). `bonus` is a non-shooter so the shooter filter keeps it out of the
  assault; the finale's `riot 28` bias means `riot+riot` is the likely pair there, which is exactly
  the worst pair §4.4 tabulates. Seam verified in code: `spawnWave` already takes `excludeSlots`
  (`enemySystem.ts:101`) and `lootSystem`'s eligibility really does exclude only **non-`DEAD`**
  occupants (`lootSystem.ts:127`) with `LOOT_MAX_ABS_X = 7` — so a crate genuinely could squat a
  reserved slot on belliard (reserved x ≈ 0.99). Sacha's reading is byte-accurate.
- **K-4 lifted.** Id-range discriminator stated with its cost, `senior-architect` overrule
  pre-authorised, AC15 now names `Enemy` explicitly ⇒ the game→render contract stays byte-identical.
- **K-6 lifted.** The false-affordance wording is gone; the **double read** (pinning the van AND
  legible as live shooters who will fire at the player) is the mechanically true one. A3 routed in
  the same hand-off. Ready for Nico.
- **Advisories A1-A5** all ruled, and A1's "impossible on the finale" claim verified:
  `stateMachine.ts:291` / `:648` gate `LEVEL_COMPLETE` on `bossQteSpec === null`.

### Corrections — binding, non-blocking (transcribe; `dev-gameplay` proceeds)

- **K-7 — a factor-2 slip in the feasibility algebra (§4.1 rationale + §4.3).** The stated bound
  `D ≥ I/(1.6·N·W)` evaluates to **3.91**, not the 7.81 quoted; the correct form is
  `D ≥ I/(0.8·N·W)` (= `I/(1.6·W)` once `N = 2` is substituted — the `N` is counted twice).
  Consequently §4.3's `A ≤ 1.6·N·W·(1−h)` must read `A ≤ 1.6·W·(1−h)`, so **Vitry's budget is
  `A ≤ 9.6`, not 19.2**. Every shipped number survives (measured worst `A = 6.13 ≤ 9.6`, `D = 9`
  inside `[7.81, 9]`) — but a Rev.3 retune inheriting a 2×-too-loose bound would ship a broken
  window. Fix the printed algebra.
- **K-8 — the reservation must land on BOTH `spawnWave` call sites, and wave 1 is the primary
  path.** D2.8 says "for the whole level" but only names the rollover; the initial wave is minted by
  `createInitialState` (`stateMachine.ts:163`) with **no** `excludeSlots`. This is not cosmetic: the
  ignore case _never rolls over_ (no kills ⇒ `allDead` false ⇒ wave 1 lives forever) and belliard's
  delivery triggers at 20 s, so **AC2(a)/AC3 run on wave 1's seating by construction**. A reserved
  slot occupied by a wave-1 cop ⇒ 1 assailant ⇒ `t_fail` 11.1 s > 8 s ⇒ the objective is free again,
  i.e. K-3 re-entering through the call site the spec did not name. Required: state both call sites,
  and make **AC12.2 assert at the call sites** (drive the real level, wave 1 included), not only at
  the `spawnWave` helper.
- **K-9 — re-promote D2.4 (`VISIBLE` at seating) to fairness-load-bearing, and pin it.** Under the
  ratified `alive` rule the per-beat invariant of D1 is only true because the freeze holds the
  seating state: write that sentence into D1's invariant paragraph (it is the answer to "why is a
  drain I cannot shoot back at fair?"), and give AC7 an explicit fairness clause — a player absent
  for the whole roll-in finds both assailants **exposed** at the window opening. Delete the "purely a
  read decision" framing.
- **K-10 — name the one real cost the amendment buys, and capture it.** Under `alive` the gauge
  drains for up to **1.7 s** (`riot.hiddenDuration`) with **nothing visible at the two windows**.
  `FAILED` costs no life and no points, so guidelines rule 6 ("jamais de mort bullshit") is not
  breached — this is opportunity cost, not a bullshit death — but rule 4's legibility standard
  applies to the _reason_ the gauge moves. Add to §6 a capture: does the player understand why the
  gauge drops during a shared duck? And add it to D5's `lead-art` read as a question (does the
  "pinning the van" read survive the duck?) — visual answer is Nico's, the requirement is ours.
  Rev.3 lever if it reads badly: the already-named "at most one `riot`" (shortens the blind stretch
  to 1.5 s and halves the A2 heart cost at once).
- **K-11 (nit)** AC16's "`spawnWave` takes `min(1 + wave, slots.length)` **after** filtering" — the
  code computes `count` **before** filtering and slices the filtered list (`enemySystem.ts:103/122`).
  Same resulting value; fix the wording so the assertion is written against what the code does.

### VERDICT 2 — `ux/spec-delivery-assault-telegraph.md`: **PASS WITH CORRECTIONS** — 4 binding, all one-liners; no round 3, no re-gate

**It answers K-5, and the timing math closes — I re-derived it against Rev.2's numbers.** Signalling
at `INCOMING`'s first tick hands the player the whole roll-in **before** `t_fail` starts: available
**4.36 + 5.56 / 5.75 + 4.44 / 5.75 + 3.33 / 5.50 + 3.33 s** against a worst desktop travel of
`(rangeX + |stopX|)/8` = 33 u / 8 = **4.1 s** on Vitry (pan clamp `rangeX = halfWorldWidth − viewW/2`
= 40 − 9 = 31). The 0-s-of-warning hole I measured in round 1 is gone on all four levels, and it
stays closed under the pre-declared `D = 8` fallback. Premises verified in code: the banner really
does render **solely** on `DELIVERING` (`DeliveryIntegrityBanner.tsx:26`), `INCOMING` really does
already reach the DOM HUD (`DeliveryVehicleSprite.tsx:174-182` pushes on every phase change,
**before** the `onStage`/QTE gate at `:189`), and `deliveryFill` really is 1.0 during `INCOMING`
(gauge seeded at `integrityMax`, damage phase-gated) ⇒ zero new plumbing, as claimed. Accessibility
(text-not-colour, no new motion, `aria-hidden` glyphs, no `aria-live` — house pattern), mobile
short-landscape clearance, and the "no new authored field" discipline are all coherent with the HUD
as shipped and with Sacha's AC15.

- **T-1 — `isOnScreen` must be called with the LIVE viewport, or the spec's central claim is false
  on mobile.** D2.2's fairness argument is "the cue is on exactly when the assailants are
  frozen-and-exposed — the cue and the mechanic can never disagree". `isOnScreen`'s `viewW`/`viewH`
  **default to 18/12** (`viewport.ts:17-23`) while the tick passes the live values
  (`stateMachine.ts:358`), and on mobile the `MOBILE_ZOOM_FACTOR 1.7` crop makes the real viewport
  materially smaller (`useGameLoop.ts:272-273`). Called with the defaults, the cue would claim
  "on screen" for a vehicle the game counts as off screen — the two disagree exactly on the device
  class this whole fairness argument exists for. Specify the live `viewW`/`viewH` (both already in
  scope at the proposed call site).
- **T-2 — anchor the cue on the delivery `stopPosition`, not on `vehicle.position`.** During
  `INCOMING` the vehicle sits at the entry edge (`±(halfWidth + 4)`, e.g. Vitry −44) — **outside the
  pan clamp (±31)**, i.e. the cue would point at a place the player cannot reach, in a direction that
  is sometimes opposite the rendezvous (Vitry: entry left, `stopPosition.x = +2`), then flip as the
  van crosses. The actionable instruction is "go to the delivery point", and the point is fixed,
  always inside the clamp (`{0, −2, +2, 0}` — verified round 1), and identical to the vehicle's
  position once `DELIVERING`. It is also **closer to D2.2's own invariant**: the assailants seat
  within `ASSAULT_RADIUS` of `stopPosition`, not of the rolling van. `state.deliverySpec` is in
  `GameState` (`stateMachine.ts:180`), so nothing new crosses the seam.
- **T-3 — the "cannot collide with the nearest-enemy ring" claim is true semantically and false in
  pixels.** The ring's **up** arrow anchors at `top: 52; left: 50%; translateX(-50%)`
  (`OffscreenArrowIndicator.tsx:87-92`) and `.deliveryBanner` at `top: 58px; left: 50%;
translateX(-50%)` (`DeliveryIntegrityBanner.module.css:10-14`) — the same anchor, with a 60-102 px
  glyph. Two same-family arrow glyphs meaning different things land within ~50 px, which is the very
  reading collision D2.1 refuses. Do not claim structural immunity: hand `lead-art` the measured
  adjacency as a hard constraint (and the short-landscape case, where the ring shrinks to 51-60 px).
- **T-4 — D3.3/A9 vs D2.3's token reuse are inconsistent as written.** `ArrowIndicator` carries an
  inline `transition: opacity 120ms ease, transform 120ms ease` (`:32`) that is **not**
  reduced-motion-gated, so reusing the component makes A9 ("no animated transition frame on the
  glyph's appearance") fail by construction. Specify: reuse the SVG **token** (polygon geometry,
  `ACID.yellow` fill, `INK.black` non-scaling keyline), not the component's inline transition — or
  gate it per `base.css`.
- **Advisory (architect, not a spec defect):** the HUD push in `useGameLoop.ts:542-554` is
  change-gated on an explicit field list; the new `deliveryDirection` needs its own term next to
  `isSameIndicator(...)`, or D2.6's "live recompute" degrades to the 1 Hz timer-tick cadence.
- **Advisory:** D4.2's cue-to-arrival capture is **confirmed as a stage-5 gate item** and I sharpen
  its worst case: the mobile crop _widens_ the pan range (`rangeX = halfWorldWidth − viewW/2` grows
  as `viewW` shrinks), so mobile travel can reach ≈ 4.6 s against a 5.50-5.75 s roll-in on
  Vitry/Niveau-Final — a ~20 % margin, thinner than desktop's. That is the residual risk of the whole
  feature, and it is a measurement, not a redesign.

### Sequencing after this gate

1. **`senior-architect` (Winston) — unblocked now, both lanes.** Plan: K-4's id-range discriminator
   (overrule to a typed field is pre-authorised; one predicate line, no §4 value moves), the
   `excludeSlots` seam on **both** `spawnWave` call sites + `lootSystem` eligibility (K-8), the
   seating hook at the `IDLE → INCOMING` edge, the ADR call (my design-side read: ADR-0071 stands
   unamended, this spec resolves its §Négatif van bullet), and the render-lane confirmation that
   `HudData.deliveryDirection` needs no ADR (`targetIndicator` precedent).
2. **`dev-gameplay`** implements AC1-AC16 with K-7…K-11 applied — may open red tests immediately.
   **`dev-r3f-render`** implements the telegraph with T-1…T-4 applied, in parallel (non-overlapping
   paths: `src/game` vs `src/render` + `src/hooks`).
3. Sacha folds K-7…K-11 into the spec text (Rev.3 header, no re-gate); Tony folds T-1…T-4 (no
   re-gate). `narrative-designer`: `INCOMING` chip copy + the one line on who ambushes the delivery.
   `lead-art`: K-6 double read + A3 note + T-3's measured adjacency + chip ink.
4. **Stage 5 (`qa-lead`-orchestrated):** Sacha's §6 playtest (+ A2 lives capture, + K-10's
   duck-legibility read, + D4.2's cue-to-arrival on both device classes) and Tony's A1-A9 → my
   **design-acceptance** verdict before the architect's integration review.

**Panel blocker #1 status:** design **GATED** (both specs). The merge still waits on
`dev-gameplay` + `dev-r3f-render` landing it, then stage 5 + the panel re-run.

---

## TECH PLAN — `senior-architect` (Winston), 2026-07-26

**Input:** `spec-delivery-van-assault.md` Rev.2 + K-7…K-11, `ux/spec-delivery-assault-telegraph.md` +
T-1…T-4 (both `PASS WITH CORRECTIONS (minor)`, round 2 CLOSED). **Verdict: GO — both lanes start now,
in parallel.** No design re-gate. Every code claim below re-verified against the shipped files on this
branch.

### 1. Lane assignment — CONFIRMED, with three additions the specs did not list

**Lane A — `dev-gameplay`, `src/game/**` only, AC1-AC16 with K-7…K-11 folded in.\*\*

| File                                                             | What                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **NEW** `src/game/systems/deliveryAssault.ts`                    | **Architect's call, see §2.** `DELIVERY_ASSAILANTS`, `ASSAULT_RADIUS`, `DELIVERY_ASSAULT_ID_BASE`, `ASSAULT_SEED_BASE`; `reservedAssaultSlots(facade, spec)`, `seatAssault(facade, spec, pool)`, `isDeliveryAssailant(e)`, `countAliveAssailants(enemies)`, `retireAssault(enemies)`. Pure, facade-aware, no camera argument anywhere in the file.                    |
| `src/game/systems/deliverySystem.ts`                             | `DAMAGE_PER_SHOOTER_PER_SECOND` → `DAMAGE_PER_ASSAILANT_PER_SECOND = 9`; param `shootingCount` → `assailantCount`; header doc updated (D4 shape otherwise unchanged). Stays facade-free and camera-free — the arithmetic module does **not** gain a `FacadeMap` import.                                                                                               |
| `src/game/systems/stateMachine.ts`                               | Both `spawnWave` call sites (§3), `tickLoot` exclusion, seating at the `IDLE→INCOMING` edge, `countAliveAssailants` into `tickDelivery`, retirement at `DELIVERING→SUCCESS\|FAILED`, and the **three** `enemies:` return sites (§3.4). Delete `describe("frozen mid-SHOOTING")` per AC2.                                                                              |
| `src/game/systems/lootSystem.ts`                                 | One new **delivery-agnostic** `excludeSlots: readonly number[] = []` param on `tickLoot`/`attemptSpawn`, folded into the existing `occupied` set. **Do not** import anything delivery-shaped into `lootSystem` — the stateMachine assembles the numbers, exactly as it already does for `deliveryGap` (`stateMachine.ts:513-519`, "only pure data crosses the seam"). |
| `src/game/systems/__tests__/**` + `src/game/levels/__tests__/**` | AC1-AC16 + the two guard tests of §2.3 and §5.                                                                                                                                                                                                                                                                                                                        |

**Additions to the spec's file list (all lane A, all `src/game`):** `lootSystem.ts` (Sacha names the
seam but not the file), and the **ADR-0071 reachability invariant test** — see §5.
`enemySystem.ts` needs **no change**: `spawnWave` already accepts `excludeSlots`
(`enemySystem.ts:101`) and the seating only _imports_ `ARCHETYPES`/`pickKindFor`. Do not touch it.

**Lane B — `dev-r3f-render`, `src/render/**`+`src/hooks/**`, A1-A9 with T-1…T-4 folded in.**

| File                                                            | What                                                                                                                                                                                                                                                       |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useGameLoop.ts`                                      | `computeDeliveryDirection(...)` beside `computeTargetIndicator` (`:102`); a `!isSameIndicator(prev, next)` term in the push gate (`:542-554`) — Karim's advisory, **confirmed load-bearing**, see §4.2; field added to the `hudData` literal at `:555`.    |
| `src/render/ui/hud/types.ts`                                    | `HudData.deliveryDirection?: HudTargetIndicator` (existing type reused).                                                                                                                                                                                   |
| `src/render/ui/hud/DeliveryIntegrityBanner.tsx` + `.module.css` | `INCOMING` branch (D1.2), 0-2 glyphs (D2.3), T-4's token-not-component reuse.                                                                                                                                                                              |
| **`src/render/ui/HUD.tsx`**                                     | **Not in Tony's §6:** the banner is called `<DeliveryIntegrityBanner delivery={data.delivery} />` (`HUD.tsx:73`) — `deliveryDirection` is a sibling field on `HudData`, so HUD.tsx must thread a second prop. One line, but it is a real file in the lane. |

**Boundary law — checked, holds both ways.**

- Lane A adds no React/Three import and no camera term: `reservedAssaultSlots` and
  `countAliveAssailants` take no camera argument **by signature**, which is literally how AC2(b) is
  asserted. `Enemy` is not widened (§2.2) ⇒ the game→render contract is byte-identical and
  `EnemySprite` needs no change (AC15).
- Lane B holds no rule: it re-reads the pure `isOnScreen` from `@game/systems/viewport` — hooks
  importing pure game predicates is the intended direction of the bridge — and reads
  `deliveryVehicle.phase` / `deliverySpec.stopPosition` as _data_. **The render lane must not learn
  the word "assault":** no `ASSAULT_RADIUS`, no assailant enumeration, no id-range test in
  `src/render` or `src/hooks`. One cue for the set-piece, anchored on `stopPosition` (T-2).
- **`src/game/systems/viewport.ts` is FROZEN for this story, both lanes.** T-1 is a _call-site_
  change (pass the live `viewW`/`viewH`), not a signature change. The panel's NIT about its dead
  default params stays a NIT — touching it would turn the one file both lanes read into a shared
  write. Serialise it into a later fix-lane if anyone still cares.

**Parallel-safety: zero shared files.** `src/game/**` vs `src/render/**` + `src/hooks/**`, no
overlap, no ordering constraint between the lanes. Lane B does not need lane A's `deliveryDirection`
data (it derives it itself from `GameState`, which already carries everything) and lane A does not
need lane B at all. Both can be red-tested and merged independently.

**Working-tree note:** `src/render/scene/GameScene.tsx` carries an uncommitted change on this branch.
Neither lane needs it — lane B works in `ui/hud` + `hooks`, not `scene`. Leave it alone.

### 2. Architectural rulings

**2.1 — NEW MODULE `src/game/systems/deliveryAssault.ts` (my call, neither spec names it).**
The reservation must be computed identically at **four** consumers (initial wave, rollover wave, loot
eligibility, seating). One pure helper, one source of truth — a second copy is how K-3 and K-8 both
happened. It does not go in `deliverySystem.ts`: D4 keeps that module facade-free arithmetic, and
importing `FacadeMap` there to serve a seating concern is how a clean module starts rotting. It does
not go in `stateMachine.ts` either: that file is 687 lines and already the tick's orchestrator. A
~3 KB focused system module is the house pattern (`courierSystem` 3.4K, `enemyFireSystem` 1.9K,
`viewport` 1.0K) and it makes the assault unit-testable without driving a whole level. No import
cycle: `deliveryAssault` → types + `enemyTypes`; `stateMachine` → `deliveryAssault`; `lootSystem`
imports nothing new.
`seatAssault` takes the pool as a **parameter** (`windowPoolFor` is private to `stateMachine.ts:49`
— do not export or move it; `spawnWave` already takes its pool the same way).

**2.2 — DISCRIMINANT: id range CONFIRMED. I do not overrule Sacha.**
An entry is one of this delivery's assailants iff `id >= DELIVERY_ASSAULT_ID_BASE` (900000).
The decisive reason is not "zero new state", it is the **boundary**: `Enemy` is the game→render
contract read by `EnemySprite`, and an assailant renders exactly like any window cop (D2.7). A field
on `Enemy` would be a fact the renderer must ignore — and a fact a renderer can see is a fact a
renderer eventually reads ("assailants get a different flash"). That is the rule-leaks-into-render
failure the boundary law exists to prevent, and it is a worse risk than a convention whose blast
radius I can bound with two tests. `DeliveryVehicle.assailantIds` was also considered and rejected:
a parallel list can drift out of step with the array, an id range cannot.
**Three binding conditions on the convention (they are what makes it safe, and what makes a future
override a one-liner):**

1. **One exported predicate** `isDeliveryAssailant(e: Enemy): boolean`. No inline `id >= 900000`
   comparison anywhere else, tests included.
2. **The disjointness is an executable invariant, not a comment:** a test pinning that `spawnWave`
   cannot mint into the range (`wave·100 + i` needs wave ≥ 9000).
3. **The constant's doc comment names it as the discriminator**, not merely as a collision-avoidance
   base, so a future tidy-up does not lower it.

**2.3 — Damage counts the POST-shot array (`shotEnemies`), not `activeEnemies`.**
Both specs are silent and the two differ by one tick per kill. Current code counts `activeEnemies`
(pre-shot, `stateMachine.ts:497`), deliberately, for the _bullet telegraph_ (`:451-454`: a same-tick
kill must not suppress a shot already announced). The damage gauge has the opposite requirement:
charging the player 0.15 integrity for an assailant he just killed is exactly the "engaging punishes
the van" flavour this story exists to delete. **Rule: count `shotEnemies`.** Consequence for the TDD
lane: **AC4's expected 46 carries the same "± one tick per kill" tolerance AC3 already has** (2 kills
⇒ ≤ 0.3 integrity). AC1 (unit-level `tickDelivery`) and AC3 (no kills) are unaffected.

### 3. Seams — verified, with the exact traps

**3.1 — `excludeSlots`: TWO call sites, both confirmed byte-exact. K-8 is right.**

- `stateMachine.ts:163` — `createInitialState`, wave 1: `spawnWave(1, facade, windowPoolFor(roster))`,
  **no `excludeSlots` argument at all**. `deliverySpec` and `facade` are both in scope. This is the
  **primary** path, not an edge: the ignore case never rolls over, so AC2(a)/AC3 run on wave 1's
  seating by construction.
- `stateMachine.ts:373` — the rollover: `spawnWave(newWave, facade, windowPoolFor(roster), state.loot !== null ? [state.loot.slotIndex] : [])`.
  **Trap:** this site already passes an array. The new value is the **union** of the crate slot and
  the reserved slots — not a replacement. A blind `[...reserved]` here silently re-opens ADR-0055 D5.

**3.2 — loot eligibility.** `lootSystem.ts:127` builds `occupied` from non-`DEAD` enemies only, and
`LOOT_MAX_ABS_X = 7` with belliard's reserved slots at x ≈ 0.99 ⇒ a crate genuinely can squat a
reserved slot before the delivery arms. Fold the reserved slots into `occupied` via the new
`excludeSlots` param. Keep `lootSystem` delivery-agnostic (see §1).

**3.3 — reservation computed ONCE per tick, before step 3.** It must exist before the rollover
(`:372`) and before `tickLoot` (`:398`). Guard it on `state.deliverySpec !== null` so a level with
`deliveries: []` computes nothing and AC13's byte-identical claim is structural rather than measured.

**3.4 — the seating/retirement lands on `enemies:` at THREE return sites.** `shotEnemies`
(`:445`) is returned at `:570`, `:614` and `:654`. Introduce **one** variable in the 7c delivery
block and use it at all three — patching one return and missing two is the shape of bug this seam
produces. The frozen-QTE early return (`:~470`) returns `...state` and never runs 7c, so no assault
is ever seated behind a cinematic — correct, and free.

**3.5 — seating fires on the `IDLE→INCOMING` edge detected from `tickDelivery`'s result**
(`state.deliveryVehicle.phase === "IDLE" && result.vehicle.phase === "INCOMING"`). The appended
assailants join `activeEnemies` from the _next_ tick; damage is phase-gated to `DELIVERING` so the
one-tick lag is invisible and is what AC10 asserts anyway.

### 4. Render-lane seams — verified

**4.1 — T-1 is implementable in its strongest form.** At the push site, `camera.position.x`,
`camera.position.y`, `viewW` and `viewH` are the **exact four values the tick itself receives**
(`useGameLoop.ts:354-364`). Call `isOnScreen(stopPosition, camera.position.x, camera.position.y, viewW, viewH)`
— same arguments, same function ⇒ the cue and ADR-0071's freeze cannot disagree, on any device class.
Never rely on the defaults (18/12): on mobile `MOBILE_ZOOM_FACTOR` makes them a lie.

**4.2 — Karim's push-gate advisory is CONFIRMED and load-bearing.** `useGameLoop.ts:542-554` gates
on an explicit field list; without its own `!isSameIndicator(...)` term the cue would refresh at the
1 Hz `Math.floor(timeRemaining)` cadence — a direction arrow up to a second stale. Reuse
`isSameIndicator` (`:137`, already `| undefined`-tolerant) — do not write a second comparator.

**4.3 — no clobber between the two HUD channels.** `App.tsx:559-569` spreads `...data` then
re-preserves `delivery`/`hostageQte`/`bossQte` from `prev` (they arrive on separate channels), and
`onDelivery` (`:571`) does `{...prev, delivery}`. `deliveryDirection` rides `data`, so both
directions are safe as shipped. Do not add a fourth channel.

**4.4 — note for `qa-lead` / A4-A7.** `deliveryDirection` lands in `lastHudRef` (`:567`) so it IS
visible through the `__MUF_STATE__` HUD snapshot (ADR-0005). `delivery.phase` is **not** — it is
merged into React state in `App.tsx`, never into `lastHudRef`. An e2e asserting "phase INCOMING +
glyph" reads the phase from `__MUF_STATE__.game.deliveryVehicle.phase`, not from the hud snapshot.

### 5. ADR decisions

**5.1 — ADR-0071 stands UNAMENDED. Karim's reading CONFIRMED, and Rev.2 makes it stronger than he
argues.** The damage rule now reads `state !== "DEAD"` only: no `isOnScreen`, no `state`-per-se, no
`timer`. The freeze acts exclusively on `state` and `timer`, so after Rev.2 there is no shared term
left in either direction — not an exception granted, an interaction that ceased to exist. The bullet
rule keys off the _transition_ into `SHOOTING` (`:454-458`, `wasShooting` edge) and `tickEnemy`
freezes every state but `HIT` (`enemySystem.ts:74`), so a frozen assailant threatens the gauge and
never the player. Bertrand's rule holds literally. And yes — **this spec resolves ADR-0071
§Négatif's van bullet** (`0069:101-105`), which asked for this exact arbitration.

**5.2 — a NEW ADR IS REQUIRED for the assault. I contradict the "no ADR needed" reading, narrowly.**
Not because the damage rule changed — the spec and this thread document that better than an ADR
would — but because the mechanism ships **one cross-module invariant and one convention**, and both
are invisible from the files that must honour them:

1. **Reserved assault slots are a level-wide invariant every slot-consumer must honour** — both
   `spawnWave` call sites _and_ loot eligibility. Nothing in `enemySystem.ts` or `lootSystem.ts`
   hints that seating there can silently gut a core-loop objective. That failure mode has already
   been found **twice** in review (K-3, then K-8) before a line was written; the third time will be
   in six months, by someone retouching window geometry. That is the definition of a call future
   contributors must not re-litigate.
2. **Assault identity is an id-range convention** (§2.2) enforced by tests, not by the type system,
   with a deliberate refusal to widen `Enemy` for boundary reasons. A convention with a documented
   rationale is an ADR; a convention without one is folklore.
3. Plus the record that the damage rule contains no camera and no pop-up-state term, superseding
   the implicit camera-filter choice — and closing ADR-0071's §Négatif.
   Precedent density settles it: ADR-0055 D5 (`excludeSlots` for crates) and ADR-0056 D9-2 (the
   crate/delivery x-gap) are _smaller_ decisions than this one and both got ADRs. Not writing one
   here would be inconsistent with the project's own record.
   **Number: `producer` (Marion) allocates — I never self-allocate.** Writing: `tech-writer` (Otis),
   content from this section + Rev.2 §D1/D2.6/D2.8. **Not a blocker for either dev lane** — code and
   ADR land on the same branch; the panel checks it at stage 6.

**5.3 — `HudData.deliveryDirection` needs NO ADR. Karim CONFIRMED.** Same shape as `targetIndicator`
in every respect that matters: a derived view value computed in `useGameLoop` from state the hook
already reads, surfaced as an optional `HudData` field, reusing the existing `HudTargetIndicator`
type, zero `src/game` change, zero boundary movement, zero new dependency. Render-lane-internal.

**5.4 — ADR-0071 → `Accepted` needs its own missing test, and it belongs to lane A.** The ADR is
still `Proposed` and self-commits (`0069:119`) to pinning `max |slotX| <= fullW/2`; no test does
(`backdropLayout.test.ts` pins `fullW`, not the slot bound). The panel explicitly asked that this not
be dropped silently, and the reservation makes slot geometry _more_ load-bearing, not less — it
removes two slots per delivery level. **Lane A adds it in `src/game/levels/__tests__/`, next to
AC12.1's geometry guard** (same family, DRY, test-only, no production code, no overlap with lane B).
Then `tech-writer` flips ADR-0071 to `Accepted` with the van bullet marked resolved.

### 6. Corrections carried to the lanes — confirmed in the package, unchanged

- **Lane A (`dev-gameplay`), from Karim's round-2 gate:** **K-7** (factor-2 slip: `D ≥ I/(0.8·N·W)`,
  Vitry `A ≤ 9.6`), **K-8** (both `spawnWave` call sites, AC12.2 asserted at the call sites incl.
  wave 1 — expanded in §3.1 above), **K-9** (`VISIBLE` seating re-promoted to fairness-load-bearing,
  AC7 fairness clause), **K-10** (the ≤ 1.7 s blind-drain cost, §6 capture + `lead-art` question),
  **K-11** (AC16 wording: `count` computed before filtering). All five transmitted **as written** —
  they move no decision and no shipped number. Rev.2's own §4/§5 values stand, plus my §2.3 ordering
  ruling and AC4 tolerance.
- **Lane B (`dev-r3f-render`), from Karim's VERDICT 2:** **T-1** (live `viewW`/`viewH` — §4.1),
  **T-2** (anchor on `deliverySpec.stopPosition`, not `vehicle.position`), **T-3** (measured
  banner/arrow-ring adjacency handed to `lead-art` as a hard constraint — do **not** claim structural
  immunity), **T-4** (reuse the SVG _token_, not `ArrowIndicator`'s ungated inline transition).
  Plus Karim's two advisories: the push-gate term (§4.2, now a requirement) and D4.2's
  cue-to-arrival capture (stage-5, `qa-lead` + `game-designer`).

### 7. Verdict

**GO.** Both lanes start now, in parallel, on non-overlapping paths. Sign-off recorded here as the
cross-cutting gatekeeper: this change touches `src/game` + `src/hooks` + `src/render`, and the
partition above is what keeps it two independent single-layer diffs instead of one cross-layer one.
My integration review happens at stage 6 as the triage of the `review-panel` re-run, not before.

**Owed to me before that panel:** lane A's confirmation that §2.3's ordering ruling holds against
AC4's measured value, and lane B's confirmation that T-3's adjacency was resolved with `lead-art`
rather than asserted away.

---

## Implémentation — `dev-gameplay` (lane A, `src/game/**`), 2026-07-26

**Entrée :** `spec-delivery-van-assault.md` Rev.2 + K-7…K-11, TECH PLAN de `senior-architect`
(§1-§6). TDD standard : un test rouge par AC avant le code. **Vert : `rtk tsc` / `rtk vitest`
(1303 tests, 92 fichiers) / `rtk lint` / `prettier --check`.** Aucun fichier `src/render` ni
`src/hooks` touché (lane B travaille en parallèle sur des chemins disjoints).

### Fichiers

| Fichier                                                          | Quoi                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **NEW** `src/game/systems/deliveryAssault.ts`                    | ~4 Ko, pur, aucun argument caméra : `DELIVERY_ASSAILANTS 2`, `ASSAULT_RADIUS 7`, `DELIVERY_ASSAULT_ID_BASE 900000`, `isDeliveryAssailant`, `reservedAssaultSlots`, `seatAssault`, `countAliveAssailants`, `retireAssault`.                                                                                               |
| `src/game/systems/deliverySystem.ts`                             | `DAMAGE_PER_SHOOTER_PER_SECOND 8` → `DAMAGE_PER_ASSAILANT_PER_SECOND 9`, param `shootingCount` → `assailantCount`, header doc. Reste facade-free / camera-free (D4).                                                                                                                                                     |
| `src/game/systems/stateMachine.ts`                               | Réservation calculée **une fois par tick** (`reservedSlots`), les **2** call sites `spawnWave` + `tickLoot`, seating au front `IDLE→INCOMING`, `countAliveAssailants(shotEnemies)` dans `tickDelivery`, retirement au front `DELIVERING→SUCCESS\|FAILED`, **une** variable `finalEnemies` sur les **3** sites de retour. |
| `src/game/systems/lootSystem.ts`                                 | `excludeSlots: readonly number[] = []` sur `tickLoot`/`attemptSpawn`, plié dans `occupied`. Reste delivery-agnostique (des indices, jamais un `DeliveryVehicle`).                                                                                                                                                        |
| `src/game/types/delivery.ts`                                     | Doc de tête corrigée (elle décrivait encore « enemies in the SHOOTING state chip »). Aucun champ ajouté.                                                                                                                                                                                                                 |
| **NEW** `src/game/systems/__tests__/deliveryAssault.test.ts`     | 42 tests : AC5, AC6, AC7 (+ clause K-9), AC8, AC9, AC15, AC2(b), invariant d'id exécutable.                                                                                                                                                                                                                              |
| **NEW** `src/game/systems/__tests__/deliveryAssaultTick.test.ts` | 48 tests : AC2(a/c/d), AC3 (4 niveaux × 6 caméras), AC4, AC10, AC11, AC12.2/12.3, AC13, AC14, AC16, K-8.                                                                                                                                                                                                                 |
| **NEW** `src/game/levels/__tests__/slotGeometryGuards.test.ts`   | AC12.1 + le garde géométrique auto-promis par ADR-0071 (`max \|slotX\| <= fullW/2`).                                                                                                                                                                                                                                     |
| **NEW** `src/game/levels/__tests__/levelFacade.ts`               | Fixture de test : la façade RÉELLE d'un niveau livré (voir « écart 1 »).                                                                                                                                                                                                                                                 |
| `src/game/systems/__tests__/stateMachine.test.ts`                | `describe("frozen mid-SHOOTING")` **supprimé** (AC2, il épinglait l'exploit) + le test « a failed delivery adds no score and no life penalty » réécrit sur des assaillants.                                                                                                                                              |
| `src/game/systems/__tests__/lootSystem.test.ts`                  | 3 tests unitaires du nouveau `excludeSlots`.                                                                                                                                                                                                                                                                             |

### AC couvertes (AC1-AC16)

AC1 (82) · AC2 (a) 4 niveaux × caméras `{0, ±9, ±18, 25}` → `FAILED`/`score 0`, (b) signature +
scan de source (0 occurrence de `isOnScreen`/`cameraOffset`/`viewW` dans le module), (c) orientation,
(d) séries d'intégrité **identiques** tick par tick · AC3 **334 / 267 / 200 ticks** = 5,57 / 4,45 /
3,33 / 3,33 s (± 1 tick), puis `GONE` · AC4 **46** (± 0,4) + bonus 500 exactement une fois · AC5 les
6 états · AC6 · AC7 ids 900000/900001, `VISIBLE`, `visibleDuration × {1,0 ; 1,3}`, slots **#23/#42,
#19/#23, #107/#102, #7/#8** (valeurs mesurées du spec, reproduites) · AC8 (vivant / **`DEAD`** /
caisse) · AC9 · AC10 · AC11 · AC12.1/12.2/12.3 · AC13 · AC14 · AC15 · AC16 (cap 14 dès la vague 14).

### Conditions contraignantes de l'architecte

1. **Un seul prédicat.** `grep -rn "900000" src scripts` → une seule occurrence hors
   `deliveryAssault.ts` : le test qui _interdit_ la constante ailleurs. Aucun `id >= …` inline nulle
   part (le test le vérifie sur `stateMachine`/`deliverySystem`/`lootSystem`/`enemySystem`).
2. **Disjonction exécutable.** Test qui balaie **les 8 999 vagues** sous le seuil (`spawnWave` ne
   frappe jamais dans la plage) _et_ montre que la borne est arithmétique, pas chanceuse : à la
   vague 9000 (`wave·100 + i`) la plage est atteinte. 0,5 s de run, assumé.
3. **Commentaire de la constante** : nommée explicitement « the identity DISCRIMINANT itself … must
   never be lowered », avec le refus documenté d'un champ sur `Enemy` (raison frontière).

### Décisions d'implémentation notables

- **`seatAssault` prend 5 arguments** (`facade, spec, pool, enemies, lootSlotIndex`) au lieu des 3 du
  plan : AC8 exige le contrôle d'occupation, et la règle « occupé = n'importe quel état, `DEAD`
  inclus » est ainsi **dans** le module qui la documente et l'unit-teste, plutôt que dispersée dans
  `stateMachine`. La caisse passe en `number | null` (pas de type `LootCrate` importé).
- **Pas de repli sur le slot suivant** quand un slot réservé est occupé : le spec en fait une erreur
  d'authoring inatteignable (D2.3), donc le seating se contente de sauter le slot — et AC12.3 épingle
  que ça n'arrive pas, même sur niveau-final à une vague qui aurait collisionné.
- `ASSAULT_SEED_BASE` (907) reste **privé** au module : personne à l'extérieur ne le lit (passe
  simplify), le déterminisme est épinglé par AC9.
- `retireAssault` met aussi `timer: 0` (un cadavre ne garde pas un compte à rebours périmé).
- Les runs « ignore » tournent avec `lives: 99` : par D2.7 les assaillants **tirent** sur le joueur,
  et un GAME_OVER en pleine fenêtre arrêterait la machine de livraison avant l'assertion. Le coût en
  vies est A2 (capture stage-5), pas cet AC.

### Mutation-probes (est-ce que les tests mordent ?)

Chaque mutation appliquée puis **immédiatement révoquée** ; rien de tout ceci n'est committé.

| Mutation                                                   | Tests rouges                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------- |
| D1 revient à `targetable` (`APPEARING\|VISIBLE\|SHOOTING`) | **20** (dont AC2(d) et les 4 niveaux d'AC3)                    |
| réservation retirée du call site **rollover**              | 4                                                              |
| réservation retirée du call site **wave 1**                | **1** (test ajouté après un premier probe muet — voir écart 3) |
| exclusion retirée de `tickLoot`                            | 1                                                              |
| seating en `HIDDEN` au lieu de `VISIBLE` (K-9)             | 2                                                              |
| `DELIVERY_ASSAILANTS` 2 → 1                                | 38                                                             |
| `ASSAULT_RADIUS` 7 → 1                                     | 30                                                             |
| `D` 9 → 8                                                  | 7                                                              |
| retirement (D3) supprimé                                   | 25                                                             |
| un seul des 3 sites `enemies:` remis sur `shotEnemies`     | 29                                                             |

### Écarts / points remontés

1. **Écart au plan (fixture de test, assumé) :** `src/game/levels/__tests__/levelFacade.ts` importe
   `stretchAboutCentre`/`facadeDrawScale` depuis `@render/scene/facadeLayout`. Raison : la façade que
   le tick reçoit RÉELLEMENT est composée par `GameScene` **avec le draw-scale 1,08** du mode
   `single-facade` ; `computeBackdropSlots` (côté game) est la géométrie _nominale_, non étirée. Les
   valeurs gatées (candidats 10/7/28/2, slots #107/#102 sur vitry, et la marge 39,4586/40 que
   l'ADR-0071 cite lui-même comme « mangée par le draw-scale 1,08 ») ne sont vraies que sur la
   géométrie étirée. Choix : passer par le **même helper pur** (aucun React/Three) plutôt que de
   redéclarer le facteur dans `src/game`. **Test-only** — aucun module de production `src/game` ne
   lit `@render`, la boundary law tient. Si `senior-architect` préfère, l'alternative est d'exposer
   le stretch côté `@game/levels/levelArt` (changement de production, hors périmètre ici).
2. **Réponse à ce que l'architecte s'est fait devoir (§7) — le ruling §2.3 tient, mais il est
   aujourd'hui un no-op mesuré.** J'ai implémenté `countAliveAssailants(shotEnemies)` comme ruled, et
   `AC4 = 46` passe. **Mais** : muter le comptage vers `activeEnemies` (pré-tir) ne rougit **aucun**
   test, et c'est structurel — un tir joueur résout en `HIT` (`hitEnemy`, hp 0), **jamais** en `DEAD` ;
   le cadavre n'apparaît qu'un `HIT_DURATION` (0,2 s) plus tard, via `tickEnemy`. Sous la règle ALIVE
   ratifiée les deux tableaux ne peuvent donc pas différer. Conséquences : (a) la tolérance « ± un
   tick par kill » d'AC4 n'est pas consommée ; (b) le drain continue pendant les 0,2 s de flash de
   coup. J'ai épinglé cette conséquence par un test dédié (« a shot assailant is HIT — still ALIVE,
   still chipping ») pour que personne ne la re-dérive à l'envers. Le ruling reste implémenté : c'est
   le tableau sémantiquement juste, et il redevient porteur le jour où un tir résoudrait direct en
   `DEAD`.
3. **K-8, wave 1 : le call site est réel, la collision ne l'est pas (aujourd'hui).** Mesuré : sur les
   4 niveaux livrés la vague 1 s'assied sur les slots #4 et #3, jamais sur un slot réservé — donc
   l'exclusion ajoutée à `createInitialState` ne changeait rien d'observable et mon premier probe est
   passé muet. Corrigé en ajoutant un test sur une **façade synthétique** (16 slots, les deux plus
   proches du stop étant justement #3/#4) qui reproduit la conséquence de K-8 : sans l'exclusion la
   vague 1 squatte les deux fenêtres d'embuscade, 0 assaillant s'assied, et la fenêtre se termine
   `SUCCESS` — objectif gratuit. Avec, 2 assaillants et `FAILED`. C'est donc un garde _qui mord_.
4. **K-10, vérifié sans le changer :** `FAILED` ne coûte ni point ni vie (assertion sur le tick de
   transition lui-même). Une vie _peut_ bouger sur ce tick — les assaillants riposent (D2.7) — mais
   seulement avec un `playerHitEvents` résolu pour l'expliquer ; la machine de livraison ne touche
   jamais aux vies. La fenêtre de « drain à l'aveugle » ≤ 1,7 s est intacte (rien dans le tick ne la
   corrige : c'est la lecture, K-10, à capturer au stage 5).
5. **K-7 :** aucun code à changer ; vérifié que les valeurs codées sont bien les valeurs FINALES du
   spec (`D = 9`, `N = 2`, `R = 7`, ids 900000, stagger `1 + i·0,3`), pas celles d'une révision
   antérieure. `D` est documenté avec ses deux bornes et le fallback 8 pré-déclaré.
6. **K-11 :** vérifié `enemySystem.ts:103/122` — `count` est calculé **avant** filtrage puis la liste
   filtrée est tranchée ⇒ cohorte effective `min(1 + wave, slots − reserved)`. AC16 est écrit contre
   ça (et le premier écart réel avec le run non réservé est bien la **vague 14** : à 13 les deux
   valent 14).
7. **`enemySystem.ts` non touché** (comme demandé) ; `viewport.ts` non touché (gelé pour cette story).

### Suite

- `qa-lead` / `game-designer` : stage 5 (§6 du spec + capture A2 des vies + lecture du duck K-10).
- `tech-writer` / `producer` : l'ADR de l'assaut (§5.2 du plan) — non bloquant pour ce diff ; le
  garde `max |slotX| <= fullW/2` que l'ADR-0071 se devait est **livré** ici, ADR-0071 peut passer
  `Accepted` avec le bullet van marqué résolu par ce spec.
- `senior-architect` : les deux points 1 et 2 ci-dessus sont ce que je lui dois avant le panel.

---

## Implémentation — `dev-r3f-render` (Amelia), 2026-07-26 — télégraphe de livraison (A1-A9, T-1…T-4)

**Périmètre tenu :** `src/render/**` + `src/hooks/**` uniquement, zéro fichier `src/game`
(`viewport.ts` gelé comme demandé — T-1 est un changement de **site d'appel**, pas de signature).

### Fichiers

| Fichier                                                         | Ce qui change                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useGameLoop.ts`                                      | `computeDeliveryDirection(...)` exportée à côté de `computeTargetIndicator` ; capture de `tickCameraX/Y` (les offsets **exacts** passés au tick) ; terme `!isSameIndicator(lastHudRef.current?.deliveryDirection, …)` dans la porte de push ; champ ajouté au littéral `hudData`. |
| `src/render/ui/hud/types.ts`                                    | `HudData.deliveryDirection?: HudTargetIndicator` (type existant réutilisé, sibling de `delivery`, jamais dans `HudDelivery`).                                                                                                                                                     |
| `src/render/ui/hud/DeliveryIntegrityBanner.tsx` + `.module.css` | Branche `INCOMING` (même chip + gauge track, gauge pleine et statique), conteneur **unique** pour les deux phases en vol, 0-2 glyphes de direction ancrés hors du bord droit du chip.                                                                                             |
| `src/render/ui/HUD.tsx`                                         | second prop `deliveryDirection={data.deliveryDirection}` (le 5e fichier signalé par l'architecte).                                                                                                                                                                                |
| **NOUVEAU** `src/render/ui/hud/arrowGlyph.tsx`                  | Le **token de forme** partagé (polygone, `ACID.yellow`, keyline `INK.black`, `non-scaling-stroke`) extrait de `OffscreenArrowIndicator` — c'est ce que T-4 demande de réutiliser. Ne porte aucune taille, aucune ancre, **aucun mouvement**.                                      |
| `src/render/ui/hud/OffscreenArrowIndicator.tsx`                 | consomme le token extrait ; markup rendu **identique** (mêmes attributs), sa transition 120 ms shippée reste chez lui.                                                                                                                                                            |
| **NOUVEAU** `src/hooks/__tests__/deliveryDirection.test.ts`     | 15 cas : fenêtre d'activation, bearing par axe, et les deux corrections gatées.                                                                                                                                                                                                   |
| `src/render/scene/NearForeground.tsx`                           | **hors story, divulgué** : erreur ESLint pré-existante de cette branche (`no-unnecessary-condition` sur `stateRef?.current?.bossQte`, commit `6761637e`, absente de `main`) — 1 ligne, dans ma lane, corrigée pour que `rtk lint` soit vert.                                      |

### T-1 → T-4 : traités

- **T-1 (forme la plus forte) — FAIT.** `isOnScreen(stopPosition, tickCameraX, tickCameraY, viewW, viewH)` :
  les **quatre mêmes valeurs** que celles passées à `tickGameState` la même frame. Elles sont
  capturées **avant** le tick parce que le driver caméra du QTE (`useGameLoop.ts` §cinématique)
  déplace `camera.position` **après** — les relire au site de push aurait réintroduit une divergence
  repère/gel pendant une cinématique. Les defaults 18/12 ne sont jamais atteignables depuis ce site.
  Pinné par un test qui **échoue** si on retire les extents (mutation vérifiée : 14 pass / 1 fail, le
  cas mobile) et **observé en vrai** : sur mobile-landscape le crop rend `stopPosition.y = −4.5`
  hors cadre verticalement (`viewH/2 ≈ 3.5`) là où les defaults auraient dit « à l'écran » — le
  repère affiche donc `down` (capture 07), exactement la divergence que T-1 visait.
- **T-2 — FAIT.** Ancré sur `deliverySpec.stopPosition`. Test dédié : à l'instant `INCOMING` avec le
  van à `x = −44` et le rendez-vous à `x = +2`, caméra à `−20`, le repère pointe **à droite** ; la
  même fonction ancrée sur le van pointe **à gauche** (bearing opposé, hors clamp de pan).
- **T-3 — FAIT, comme CONTRAINTE, sans revendiquer d'immunité.** L'adjacence est réelle et je l'ai
  re-mesurée en pixels dans le navigateur : la bague `up` est un glyphe de 102 px centré sur
  `top: 52; left: 50%`, le banner est sur `top: 58; left: 50%`. Ce que j'ai fait : (a) le groupe de
  glyphes est **absolu, hors du bord droit du chip** (`left: 100%` + `--space-sm`), donc jamais dans
  la boîte centrée de la bague — mesuré desktop : chip `right = 813.6`, glyphe `x = 819.6…843.6`, la
  bague occupe `589…691` ⇒ **~128 px de dégagement** ; (b) le chip ne bouge pas d'un pixel quand le
  repère apparaît (positionnement absolu, pas un flex qui recentre) ; (c) là où la bague et le
  banner se touchent encore (la hampe de la flèche `up` derrière le gauge track), le banner **peint
  au-dessus** — `HUD.tsx` le rend après la bague, ordre déjà commenté dans le fichier. Ce qui reste
  et qui est un **appel visuel pour `lead-art` (Nico)** : pendant `INCOMING`/`DELIVERING` le banner
  est à l'écran bien plus longtemps qu'avant, donc la hampe de la flèche `up` inactive (opacité 0.35)
  affleure le gauge track plus souvent (visible captures 01 et 07). Décision possible : décaler la
  bague, ou masquer sa fente `up` pendant la livraison. **Je n'ai pas deviné** — rien de cassé, rien
  de recouvert, la lisibilité du chip et du gauge est intacte.
- **T-4 — FAIT.** Le nouveau composant réutilise le **token SVG**, pas `ArrowIndicator` : zéro
  transition, zéro animation, et `.directionGlyph` déclare `transition: none; animation: none`
  **inconditionnellement** — c'est plus fort qu'un gate `prefers-reduced-motion` (ça tient dans les
  DEUX modes, et ça résiste à un futur `transition: all` sur un ancêtre). Vérifié dans le navigateur,
  `getComputedStyle` du glyphe : `transitionProperty/Duration = "none 0s"`, `animationName = "none"`
  — identique en mode normal ET sous `prefers-reduced-motion: reduce` + le toggle interne
  (`data-reduced-motion="true"` sur `:root`, les deux confirmés actifs dans le run). A9 ne peut pas
  échouer par construction : il n'y a aucune frame animée à capturer.
- **Advisory de Karim / §4.2 de l'architecte — FAIT, et pas sous la forme attendue.** Le terme de
  changement compare le repère à la **dernière valeur poussée** (`lastHudRef.current`), pas à une
  re-dérivation depuis `prev` : le repère bascule avec la **caméra**, pas avec l'état, donc un
  `computeDeliveryDirection(prev, …)` avec la même caméra aurait été quasi toujours égal et la
  cadence serait retombée au 1 Hz de `Math.floor(timeRemaining)` — exactement le défaut visé.
  `isSameIndicator` est réutilisée telle quelle (déjà tolérante à `undefined`), aucun second
  comparateur.

### AC couvertes

| AC                                                                                           | État                              | Preuve                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1 (banner à la 1re tick `INCOMING`, gauge pleine non drainante, desktop + mobile-landscape) | **PASS**                          | captures 01 (desktop) / 07 (mobile) : `LIVRAISON EN APPROCHE` + track plein, `integrity 80/80`.                                                                                                                                                                                      |
| A2 (même banner en `DELIVERING`, **sans démontage** entre les deux)                          | **PASS**                          | preuve DOM, pas visuelle : le conteneur est tagué `data-muf-seen` pendant `INCOMING` et le tag est **toujours là** en `DELIVERING` (`seenBefore: true`, même `top: 58`) ⇒ un seul nœud DOM traverse le swap, seul le contenu du chip change.                                         |
| A3 / A8 (distinction sans la teinte)                                                         | **PASS**                          | captures 04-05 en niveaux de gris : les deux libellés diffèrent par le **texte** ; le glyphe reste lisible (fill clair + keyline sombre). Aucune encre `INCOMING` n'a été inventée — c'est `lead-art`, et en deviner une aurait risqué le plancher de contraste sur `--stock-shell`. |
| A4 (repère + rotation correcte, hors cadre, les deux axes)                                   | **PASS**                          | desktop `dir {left:true}` → un glyphe `rotate(180deg)` (capture 01) ; mobile `dir {left:true, down:true}` → **deux** glyphes `180deg` + `90deg` (captures 06-07).                                                                                                                    |
| A5 (cadré ⇒ aucun glyphe)                                                                    | **PASS**                          | capture 03 + DOM : `glyphs: []` et `dir` absent dès que le rendez-vous rentre dans le cadre, chip conservé.                                                                                                                                                                          |
| A6 (idem en `DELIVERING`)                                                                    | **PASS**                          | hors cadre : capture 02 (`dir {left:true}`, 1 glyphe) ; cadré pendant `DELIVERING` : `glyphs: []` (log du run `MUF_LEG=framed`).                                                                                                                                                     |
| A7 (pan vertical seul ⇒ glyphe vertical seul)                                                | **PASS (unit + partiel runtime)** | test unitaire dédié (Y seul ⇒ `down`/`up` seul, X seul ⇒ horizontal seul) ; en runtime le cas 2 axes mobile est capturé (06-07). Le desktop n'a pas de pan vertical, donc l'axe Y **seul** n'est pas atteignable en jeu sur cette classe d'appareil.                                 |
| A9 (reduced-motion : aucune frame animée)                                                    | **PASS**                          | run dédié avec `prefers-reduced-motion: reduce` + `data-reduced-motion="true"` : `transition none 0s`, `animation none` sur le glyphe, swap de contenu sur le même nœud. Voir T-4.                                                                                                   |
| D4.1 (clearance short-landscape)                                                             | **PASS**                          | capture 06/07 : banner `top 58 → bottom 132`, glyphes `x 639…691` dans un viewport de 844 — sous la bande ticker, aucun clipping, aucun chevauchement.                                                                                                                               |

**Captures** (uncommitted, `docs/qa/evidence/story-delivery-telegraph/` — `qa-lead` reste
propriétaire du jeu de preuves stage 5) : 01 desktop `INCOMING` hors cadre, 02 desktop `DELIVERING`
hors cadre, 03 desktop `INCOMING` cadré (sans repère), 04-05 niveaux de gris, 06-07 mobile-landscape
844×390 (deux axes).

**Méthode de capture, à savoir pour stage 5 :** j'ai dû jouer **Stalingrad**, pas Belliard — le QTE
otage de Belliard gèle le tick indéfiniment dans un run non piloté (« duel statique », aucune
horloge), donc la livraison à 20 s n'arrive jamais. Stalingrad livre à 25 s et n'a pas de QTE. Et il
faut **rester panné loin** : cadrer la façade réveille les flics (ADR-0071) qui tuent le joueur
inactif vers 15 s. Seeds `localStorage` utilisés : `muf_progress` (déblocage) + `muf_prefs`
(5 vies / easy / CRT off).

### Notes pour les autres lanes

- **`lead-art` (Nico)** : l'appel visuel de T-3 ci-dessus (hampe de la flèche `up` de la bague
  affleurant le gauge track pendant une fenêtre désormais longue) + l'encre `INCOMING` vs
  `DELIVERING` (renfort seulement, texte déjà distinct) + le placement/taille du glyphe (24 px = 1.5em
  du token `--font-size-base` du chip, aucune media query neuve).
- **`narrative-designer` (Yasmine)** : `"LIVRAISON EN APPROCHE"` est le placeholder du spec, une
  seule chaîne à changer dans `DeliveryIntegrityBanner.tsx`.
- **`qa-lead` (Inès)** : conforme à §4.4 du plan — `deliveryDirection` est lisible via
  `__MUF_STATE__().hud.deliveryDirection`, alors que `delivery.phase` ne l'est **pas** (elle vit dans
  l'état React de `App.tsx`) : lire la phase depuis `__MUF_STATE__().game.deliveryVehicle.phase`.
- **`senior-architect` (Winston)** : ce que je te dois — T-3 est traité comme contrainte mesurée
  (dégagement de ~128 px, banner au-dessus, chip immobile) avec le résidu explicitement routé à
  `lead-art`, pas revendiqué comme résolu tout seul. Deux écarts au plan, tous deux divulgués
  ci-dessus : le token de forme extrait dans un nouveau fichier `arrowGlyph.tsx` (T-4 « réutilise le
  token, pas le composant » pris au mot, markup de la bague inchangé) et le fix ESLint 1 ligne dans
  `NearForeground.tsx`.

### Vert / rouge

`rtk tsc` **vert** (0 erreur) · `rtk vitest` **vert** (1197 pass / 0 fail, dont les 15 nouveaux) ·
`npx eslint src/render src/hooks` **vert** (0 issue) et `npx prettier --check src/render src/hooks`
**vert**. Le `rtk lint` global reste rouge sur `src/game/systems/__tests__/deliveryAssault.test.ts`
— c'est le chantier **en cours de lane A** dans le même arbre de travail, pas mon diff. Rien commité.
