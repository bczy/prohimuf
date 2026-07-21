# Hand-offs — Rue Belliard décor: single wide-image backdrop integration

Story: [`_bmad-output/planning-artifacts/story-belliard-decor-single-image.md`](../../_bmad-output/planning-artifacts/story-belliard-decor-single-image.md)

## 0. PM — pm (John) — 2026-07-21

- claim: scope + author the story for wiring the validated décor v4 single-image backdrop
  (`public/assets/levels/belliard/street-wide.png`, committed PR #122, branch
  `claude/belliard-decor-v3-clean`, not yet wired) in place of the ADR-0048 4-tile
  `troncon-sequence` mode, per Bertrand's explicit scope (rendering swap + window-zone
  re-calibration + repositioning street-cover objects and enemies for the new,
  ≈27%-narrower world).
- release: DRAFT story written. Verdict on scope guard = **conscious, documented,
  justified extension carried over from ADR-0047/0048** — the swap itself is a pure
  production simplification (cahier des charges test passes trivially: Prohibition ST had
  a street backdrop), the one real design risk is the gameplay re-fit (window zones,
  hostage-taker anchor, near-foreground grounding, pacing) on the narrower world, gated
  behind an explicit `game-designer` playtest sign-off (AC4/AC5/AC6) rather than carried
  over blind. Flagged one open assumption for the design lane to confirm before DEV opens:
  "barrières" in Bertrand's brief is read as the near-foreground street-furniture layer
  (`nearForeground.objects`) — no dedicated gameplay entity of that name exists in the
  codebase today.
  File List: `_bmad-output/planning-artifacts/story-belliard-decor-single-image.md`.
- notes for the tech plan: recon done ahead of hand-off so `senior-architect` doesn't
  re-derive it —
  - Old belliard `fullW` (troncon-sequence) ≈ 87.4 world units (`WORLD_HEIGHT=12` ×
    Σaspects 1.6491+1.9224+1.7857+1.9224, `TRONCON_GAP=0`); new `street-wide.png`
    (6656×1248, aspect ≈5.333) gives `fullW` ≈ 64 world units — **≈27% narrower**.
  - `hostageQte.anchor.x = 9.9` (`levels.ts`) is a comment-documented tune to
    "troncon-b's tile centre" specifically to avoid a black sky-gap void at the ×2.4 QTE
    zoom (PR #76 regression) — that transparency problem doesn't exist with the new
    opaque image, but the absolute position still needs re-validation against the new art.
  - `backdropLayout.test.ts` is explicitly labeled a **FROZEN cross-lane contract** for
    ADR-0048; this story requires amending it for belliard (1 tile vs. 4) — must ship
    with an ADR update/supersession, not a silent test-value edit (AC8).
  - The asset's provenance is a **non-standard pipeline**: `scripts/gen-street-paid.mjs`
    (paid `ideogram-v4-quality`, CI `.github/workflows/gen-street-experiment.yml`) +
    `scripts/stitch-belliard-street.mjs` (tone-matched butt-join of two street renders
    into ~5.3:1) — NOT the standard Pollinations/FLUX `levelArt.json` prompt-gate flow
    used for `troncon-a/b/c`. Needs documenting (AC10) so a future regen request doesn't
    default to the wrong pipeline.
  - Current render coupling: `LevelBackdrop.tsx`/`GameScene.tsx` branch on
    `layout.mode === "troncon-sequence"` (`isTroncon`) for sky-empty / ground-tiling /
    no-feather behavior; belliard's `windowZones.generated.json` entry is an array
    keyed to the 4-tile sequence order (`a, c, b, c`).
- next: awaiting `senior-architect` TECH PLAN (lane cut, ADR-0048 amendment/supersession
  call, feasibility read on re-adapting the window-zone detector for one continuous image)
  running in parallel with `game-designer` (design read on AC4/AC5/AC6 and the
  "barrières" assumption above) before DEV opens.

## 1. DESIGN — game-designer (Sacha) — 2026-07-21

- claim: author the design spec repositioning enemy pop-windows + street "barrières" on
  `street-wide.png` (read the image, the old troncon pool, ADR-0048, `levels.ts`,
  `nearForegroundArt.ts`).
- release: **[`docs/game-design/spec-belliard-street-wide-repositioning.md`](../game-design/spec-belliard-street-wide-repositioning.md)** — all
  values normalized 0..1 over image (robust to exact `fullW`).
  - **Windows (§1):** 3 pop-rows at `y_norm 0,24 / 0,35 / 0,47` (lucarnes / R1 étage noble /
    R2 persiennes). Chosen so `worldY` stays within **0,4 unit of the OLD aim band**
    (+3,31/+2,11/+0,75 → +3,12/+1,80/+0,36) — same feel, real windows. ~52 candidate zones
    (12+18+22 columns, explicit `x_norm` lists), 0,81/unit vs old 0,97/unit.
  - **CONFIRMS PM assumption:** "barrières" = the ADR-0047/0049 near-foreground props;
    muf has **no cover-collision system**. Interactive cover (Prohibition barricades) is
    NOT reproduced — flagged as an undecided extension for pm+lead-GD, not invented here.
  - **Barrières (§2):** 18 → **13 props** (world −27% ⇒ hold on-screen sparsity). KEY rule:
    the 3 TALL props (trafficLight, 2× lamppost) sit at `x_norm 0,388 / 0,495 / 0,800` —
    exactly on the passage / mitoyen-seam / pignon **no-window gaps** ⇒ AC1 (no window
    occlusion) satisfied for free + they read as navigation landmarks.
  - **Width/difficulty (§3):** hold `enemiesToWin 10` / `timeSeconds 90` UNCHANGED (win is
    spawn-rate-bound, not width-bound; one variable at a time). Named levers if VERIFY
    deviates (first: `timeSeconds 90→80` if trivial).
  - **Coherence (§4):** QTE `anchor.x 9,9` → `x_norm 0,655` = solid facade, clear of passage
    (0,39) & pignon (0,80) — **keep 9,9** (but its old "troncon-b centre / x=0 sky-gap"
    rationale is void on the opaque image ⇒ update the `levels.ts` comment). Delivery stop
    `x 0` → 0,50 mid-street OK; courier lane / loot pool unaffected.
- **Exclusion zones (load-bearing for both devs):** passage `0,372–0,408`, right pignon
  `0,788–0,812`, tonal seam `0,485–0,502`, edges `<0,035 / >0,965`. No pop, no tall prop.
- verdict on scope guard: faithful re-fit of an existing faithful mechanic (windows pop);
  props are the already-documented ADR-0047 extension. No new mechanic proposed.
- next: → `lead-game-designer` (Karim) GATE this spec before dev. → `senior-architect`
  confirm `fullW=64` (single-image 1-tile) — §3 depends on it. Then `dev-gameplay` (pool
  §1 + `levels.ts` comment) ∥ `dev-r3f-render` (13 props §2). I run the VERIFY playtest vs
  §5 acceptance criteria and report PASS/deviations to Karim before architect integration.

## 1b. DESIGN gate applied — game-designer (Sacha) — 2026-07-21

- gate: `lead-game-designer` (Karim) = **PASS with 2 text corrections, 0 coordinate change**.
  Verified both against the engine (`NearForeground.tsx` L127-135) before applying.
- **C1 (verifiability):** engine hard-clamps ALL props under the low window band (`maxH`)
  EXCEPT `trafficLight` (`TRAFFIC_LIGHT_H_FRAC = 0,8`, ADR-0047). So the 2 lampposts do NOT
  rise into the windows. Corrected §2.3: "3 tall landmarks" → **1 (the feu)**; dropped the
  false premise that lampposts occlude. Lamppost coords (0,495 / 0,800) unchanged — requalified
  as ground-level landmarks.
- **C2 (coherence):** removed the contradictory "tall-props-in-gaps ⇒ AC1 free" claim; the feu
  is _deliberately_ exempt from AC1. Reworded the feu-on-passage rationale = **minimise swept
  occlusion of ACTIVE targets** (placement was right, the described mechanic was wrong).
  Re-scoped **AC-BARRIÈRES §5.4** to the **12 clamped props only** (non-occlusion holds by
  construction; feu's exemption is intentional).
- **Dev note added (§7 render hand-off):** update `windowGrid.top`/`band` (today **0,19**) so
  the `maxH` clamp ceiling follows the NEW top row (Row A `y_norm 0,24`).
- release: spec §2.3 / §2.4 / §5.4 / §7 amended; **all coordinates untouched (Karim-cleared)**.
- next: spec is GATE-CLEARED → ready for `senior-architect` (`fullW=64` confirm) then dev lanes.

## 2. DESIGN GATE — lead-game-designer (Karim) — 2026-07-21

**Verdict : PASS w/ corrections (C1 + C2).** Le spec
`docs/game-design/spec-belliard-street-wide-repositioning.md` est **gaté**. Les données §1
(fenêtres), §3 (difficulté) et §4 (cohérence courier/QTE/delivery/loot) sont **vertes et
implémentables telles quelles**. Deux corrections **bloquantes pour la lecture §2** (rationale +
critère d'acceptation), à appliquer par Sacha ; elles ne changent **aucun chiffre** de la table
des 13 props, donc les lanes dev peuvent ouvrir en parallèle sur les valeurs.

### Vérifications (contre PROJECT_GUIDELINES + code shipé)

- **Scope / cahier des charges — PASS.** Fenêtres-pop = mécanique fidèle Prohibition, simplement
  recalée. Props = extension ADR-0047/0049 déjà gatée, repositionnée. **Cover interactif
  (barricades)** : Prohibition l'avait, muf n'a **aucun système de collision-cover** ; le spec
  ne l'invente PAS et l'escalade correctement à pm+lead-GD → ce n'est **pas** un manque bloquant,
  c'est une non-implémentation **déclarée** (hors-périmètre propre). Interprétation
  « barrières = props near-foreground décoratifs » **ACCEPTÉE**.
- **Core loop / 3-5 min — PASS.** Rien ne dilue `Récupérer→Livrer→Éviter`. `enemiesToWin 10` /
  `timeSeconds 90` (≈90 s combat + QTE/delivery) tient largement sous le plafond 5 min.
- **§1 fenêtres — PASS.** Vérifié : 3 rangées `y_norm 0,24/0,35/0,47` → `worldY +3,12/+1,80/+0,36`
  (conversion `(0,5−y)·12` OK), toutes à **≤0,4 unité** de l'ancien band (ancien pool
  `0,2238/0,3243/0,4379` **confirmé** dans `windowZones.generated.json`, 84 zones = 4×3×7). Feel
  de visée préservé. ~52 zones (12+18+22), densité 0,81/u vs 0,96/u — plus clairsemé, justifié par
  la rue −27 %, bande 48-56 saine. Les listes `x_norm` **respectent** les 4 zones d'exclusion
  (vérifié colonne par colonne : passage/couture/pignon/bords tous sautés). Calage sur vraies
  ouvertures + non-occlusion = leg VERIFY (harness SCREEN + snap ADR-0028), correctement adossé à
  AC-POP. **Note dev :** mettre aussi à jour `windowGrid.top`/band data du niveau (aujourd'hui
  0,19) pour que le clamp near-foreground `maxH` suive la nouvelle rangée haute — sinon le clamp
  travaille sur une bande périmée.
- **§3 difficulté — PASS.** Tenir 10/90 = discipline « une variable à la fois » (le win est
  borné par la cadence de spawn temporelle, pas par la largeur). Leviers nommés et ordonnés pour
  VERIFY (`timeSeconds 90→80` en premier). Sain.
- **§4 QTE `anchor.x 9,9` — PASS.** Vérifié dans `levels.ts` (9,9 ; `enemiesToWin 10` ;
  `timeSeconds 90` ; delivery `stopPosition {0,−4,5}`). `9,9 → x_norm 0,655` = façade pleine, hors
  passage/pignon/couture. **On garde 9,9** + mise à jour du commentaire (l'ancienne justif
  « centre tronçon-b / trou de ciel à x=0 » est caduque sur l'image opaque). Repli `anchor.x 0`
  (0,50) nommé, à n'activer que sur preuve composite-gate. Delivery x=0 → 0,50 : tombe sur la
  couture mais c'est un gros véhicule foreground opaque (couvre même la jointure) — non-conflit,
  les exclusions ne visent que pop/props.
- **Zones d'exclusion — PASS (claires pour les devs).** `passage 0,372–0,408`, `pignon
0,788–0,812`, `couture 0,485–0,502`, `bords <0,035 / >0,965` : chiffrées, tabulées, load-bearing.
  Les 3 props « repères » tombent bien **dans** ces zones (feu 0,388 ∈ passage ✓, prop 0,495 ∈
  couture ✓, prop 0,800 ∈ pignon ✓).

### Corrections bloquantes (§2 — verifiability + cohérence avec le moteur shipé)

**Constat moteur (source de vérité, `src/render/scene/NearForeground.tsx` L127-135 +
`nearForegroundArt.ts`) :** **tout prop SAUF le `trafficLight` est clampé dur à `maxH`** (plafond
juste sous la bande de fenêtres) — donc **jamais occlusif, quel que soit x, à tout offset de pan**.
`MAX_PROP_WORLD_H = 4,5` borne le `lamppost` (naturel 7,44) **bien en dessous** des fenêtres.
**Seul le `trafficLight`** (feu) bénéficie de l'exemption `TRAFFIC_LIGHT_H_FRAC = 0,8` et **monte
volontairement dans les rangées de fenêtres** (amendement hero-prop ADR-0047) — c'est le **seul**
prop **autorisé** à occulter.

- **C1 (classification « props hauts » — verifiability).** §2.3/§2.4 classent les 2 `lamppost`
  (0,495 couture, 0,800 pignon) comme « hauts / mât montant dans les rangées de fenêtres » : **FAUX**
  dans le moteur (clampés `maxH`, top loin sous les fenêtres). Il n'y a **qu'UN seul prop haut : le
  feu** (0,388, passage). Corriger : (a) requalifier `lamppost` en prop **clampé/non-occlusif**, (b)
  ramener le « 3 repères hauts » à **1 repère réellement haut (le feu au passage)** ; les 2
  lampadaires restent posés (ils couvrent couture/pignon au sol, lisibilité mineure) mais **sans**
  prétendre au read « landmark vertical ». Si Bertrand/Sacha veulent 3 vrais repères hauts, c'est un
  **changement moteur** (étendre l'exemption au lamppost) = lane render + ADR, **hors périmètre de
  ce spec** → à escalader, pas à supposer.
- **C2 (rationale AC1 + AC auto-contradictoire — cohérence).** §2.3 « props hauts devant les gaps
  ⇒ satisfait AC1 gratuitement » : le clamp `maxH` satisfait AC1 **par construction pour tous les
  props clampés, indépendamment de x** (le gap n'y change rien). Pour le **feu**, l'engine
  l'**exempte** délibérément d'AC1 (il PEUT balayer les fenêtres). Donc AC-BARRIÈRES §5.4 « aucun
  prop ne chevauche une fenêtre +0,8 » est **auto-contradictoire pour le feu** et le ferait échouer
  à tort au VERIFY. Corriger en deux temps : (a) AC-BARRIÈRES ne s'applique **qu'aux props clampés**
  (le feu est explicitement exempté, canon ADR-0047) ; (b) reformuler le vrai (et bon) rationale :
  le feu étant l'unique prop occlusif, le placer **sur le passage** (zone sans fenêtre-flic)
  **minimise son occlusion balayée de cibles actives** — c'est un net progrès sur le Belliard actuel
  (feu à 0,13/0,57, pile sur des colonnes de flics). L'instinct de placement est **juste** ; seule
  la mécanique décrite est fausse.

### Feux verts

- **`dev-gameplay`** : GO immédiat — pool fenêtres §1 (`windowZones` belliard) + maj commentaire
  `anchor.x` `levels.ts` §4 ; `enemiesToWin/timeSeconds` inchangés ; + maj `windowGrid.top`/band.
- **`dev-r3f-render`** : GO sur les 13 positions §2.4 (chiffres inchangés). Traiter le feu (0,388)
  comme l'unique prop haut/occlusif-exempté ; les 2 lampposts (0,495/0,800) rendront clampés-courts
  (attendu, pas un bug).
- **`senior-architect`** : confirmer `fullW=64` (single-image 1-tile) — §3 en dépend ; call
  ADR-0048 amendement/supersession (1 tuile vs 4) hors de ce gate.
- **`lead-art`** : read des repères (passage/couture/pignon = respirations) reste sa juridiction ;
  **coherence flag** — le feu est le seul prop qui recouvre des fenêtres (canon ADR-0047), à garder
  gris/zéro-glow (« ce qui brille est interactif ») pour ne pas lire comme cible.
- **`game-designer` (Sacha)** : appliquer C1 + C2 au spec (édits de texte §2.3/§2.4/§5.4, 0 chiffre
  touché) avant la revue d'intégration architecte ; puis playtest VERIFY vs §5 (AC-BARRIÈRES à lire
  corrigé). Cap rework : 1/2 round consommé.

## 2. ARCHITECT FEASIBILITY — producer (Marion) — 2026-07-21

- claim: open the story tracking, allocate ADR for tech plan, prepare dev lane cut.
- release: **ADR-0057 allocated** (`docs/adr/0057-single-wide-backdrop-belliard.md`, scaffolded awaiting senior-architect decision content). Index regenerated.
  Story lanes prepared:
  - **Lane A (dev-gameplay):** `spec-belliard-street-wide-repositioning.md` §1 window pool + `levels.ts` hostage anchor comment update, 3 branches: 1 add windowZones data, 1 refactor/amend `backdropLayout.test.ts` contract (AC8), 1 hardpoint the 64-unit `fullW`.
  - **Lane B (dev-r3f-render):** `LevelBackdrop.tsx` + `GameScene.tsx` + `ForegroundFrames.tsx` wire single-wide mode, drop `troncon-sequence` branching for belliard, place 13 props per §2 + game-designer coordinates.
  - **Lane C (dev-tooling-assets):** `levelArt.json` belliard entry amended for `single-wide` mode (no standard Pollinations flow; note guard for regen via `gen-street-paid.mjs` + `stitch-belliard-street.mjs`), `levels.ts` backdrop mode wire.
  - **Contention:** Lanes A+B share `backdropLayout.test.ts` (A amends, B reads); lanes A+C share `levels.ts` (A comment, C mode wire); lanes B+C share `LevelBackdrop.tsx`/`GameScene.tsx` (mode dispatch). **Serialisation:** A → B → C (test→render→data).
    File List: ADR-0057.
- next: awaiting `lead-game-designer` (Karim) design gate, then `senior-architect` TECH PLAN (ADR-0057 decision + lane green-light). Lanes hold until both gates PASS.

## 3. LANE B (render) — dev-r3f-render (Amelia) — 2026-07-21

- claim: wire the `single-wide` backdrop composition in the render layer per §2 of the
  senior-architect plan. Scope held to disjoint files; did NOT touch `levelArt.ts` /
  `levelArt.json` / `backdropLayout.test.ts` (lanes A/C).
- release: **`src/render/scene/LevelBackdrop.tsx`** — added the 3rd composition branch for
  `layout.mode === "single-wide"`:
  - Draws ONLY the full décor plane through the existing `facadePane` path — `tileUrl(id,
"street-wide")`, draw-scale 1 (`facadeDrawScale` already returns 1 outside single-facade),
    feather OFF, world-locked, facade parallax 0. No new geometry, reuses the pane mesh.
  - In single-wide: sky + street/ground meshes forced `visible={false}` and their textures
    never loaded (`sky.png`, `street.png`, and the tiled `ground.png` ~1 Mo all skipped) —
    the baked image already carries ciel + immeubles + sol. Parallax sky stays CLOSED
    (Bertrand's separate task, not reopened).
  - Near-foreground props (barrières) unchanged: still rendered from layout DATA (lane C),
    zero hardcoded positions — `NearForeground` untouched.
  - `facadeLayout.ts` needs no logic change (recompiles clean against A's widened union;
    `facadeDrawScale`/`backdropPanes` already yield scale 1 + feather false for single-wide).
    `GameScene.tsx` untouched (its `troncon-sequence` guard already resolves false for
    single-wide; no comment added — minimal diff).
- verify (my files): `rtk tsc` = **No errors**. `rtk lint` = **No issues**. `rtk vitest` =
  **988 pass / 3 fail** — the 3 reds are ALL lane A's `getBackdropLayout — belliard
single-wide (ADR-0057)` contract test, red only because lane C has not yet flipped the
  belliard `levelArt.json` entry from `troncon-sequence` to `single-wide` (getBackdropLayout
  still returns 4-tile geometry: fullW 87.36 vs expected 61.71, 31 zones vs 21). Not my
  files; they go green once lane C lands the data wire. `facadeLayout.test.ts` (my module)
  passes.
- File List: `src/render/scene/LevelBackdrop.tsx`.
- next: → **lane C (dev-tooling-assets)** to land the `levelArt.json` belliard `single-wide`
  entry + `levels.ts` mode wire (unblocks the 3 red contract tests). → `qa-lead` VERIFY
  will confirm the composited render in-game (single opaque plane, no sky/ground draw,
  props unoccluded) at stage 6.

## 3. LANE A — dev-gameplay (Amelia) — 2026-07-21

- claim: pose the `single-wide` backdrop TEST CONTRACT (ADR-0057) that lanes B (render)
  and C (data) build against — pure logic only, TDD, files DISJOINT from B/C.
  Scope: `src/game/levels/levelArt.ts` + `src/game/levels/__tests__/backdropLayout.test.ts`.
  Did NOT touch `levels.ts` / window-zone data (deferred — see note) or the manifest.
- release: contract shipped, `rtk tsc` + `rtk lint` GREEN.
  - **Type surface:** `BackdropDescriptor` union gains the third variant
    `{ mode: "single-wide"; file: string; aspect: number }`; `BackdropLayout["mode"]`
    gains `"single-wide"`.
  - **Builder:** new `buildSingleWideLayout(id, file, aspect)` → ONE tile
    `{ file, width: WORLD_HEIGHT*aspect, centreX: 0, zones: getWindowZones(id) }`,
    `fullW = width`, `mode: "single-wide"`. `getBackdropLayout` branches single-wide
    BEFORE troncon-sequence. Other modes byte-identical (single-facade parity block still
    green: 4/4).
  - **Contract test:** replaced the `belliard troncon-sequence geometry` block with
    `belliard single-wide (ADR-0057)` — asserts `mode==="single-wide"`, `tiles.length===1`,
    `tile.file==="street-wide"`, `tile.width===WORLD_HEIGHT*5.1426`, `fullW===tile.width`,
    `centreX===0`, and `computeBackdropSlots("belliard")` = 1 slot per `getWindowZones`
    zone (robust to whatever zone count lane C ships). The `single-facade parity` block is
    UNTOUCHED (frozen non-regression). Header comment updated: ADR-0048 tronçon freeze
    LIFTED for belliard per ADR-0057.
  - **Contract decision (load-bearing for lane C):** aspect is pinned to the 4-decimal
    literal **`5.1426`** = round(6418/1248, 4), matching the manifest convention (troncon
    aspects are 4-decimal: 1.6491, 1.9224…). `tile.width` uses exact `===`, so **lane C
    MUST write `"aspect": 5.1426` (NOT the full 5.142628… of 6418/1248, NOT 6656/5.333 from
    the ADR-0057 draft context) and `"file": "street-wide"`** or the contract will not close.
    Flagging the ADR-0057 body still cites 6656×1248/≈5.333 from an earlier draft — my
    directive pinned 6418/1248→5.1426; `senior-architect` should reconcile the ADR text.
  - **Expected RED (documented):** with the manifest still on `troncon-sequence`, the 3
    belliard tests FAIL now — the contract is my deliverable, it goes green when lane C
    flips the manifest. **Proven:** a throwaway manifest patch to
    `{mode:"single-wide",file:"street-wide",aspect:5.1426}` → **7/7 pass**; manifest then
    hard-restored byte-identical (git-verified, `levelArt.json` unmodified).
    File List: `src/game/levels/levelArt.ts`,
    `src/game/levels/__tests__/backdropLayout.test.ts`.
- note / not-in-this-cut: the producer lane-cut (§2) also assigned Lane A the `levels.ts`
  hostage-anchor comment update + `windowZones`/`windowGrid.top` data (design spec §1/§4).
  Those were NOT in my directive (contract-only) and `levels.ts` is shared with lane C —
  left for a follow-up Lane A pass or explicit assignment to avoid the A+C contention.
- next: → Lane B (render) reads the frozen `BackdropLayout` single-wide shape; → Lane C
  (data) flips the belliard manifest to `single-wide` with `file:"street-wide"`,
  `aspect:5.1426` (exact) — contract then closes green. Serialisation A→B→C respected.

## 4. LANE C (data/tooling) — dev-tooling-assets (Amelia) — 2026-07-21

- claim: land the belliard manifest data per the gated design spec
  (`docs/game-design/spec-belliard-street-wide-repositioning.md`, lead-game-designer PASS)
  and lane A's frozen contract (§3 above). Scope held to disjoint files: `levelArt.json`,
  `windowZones.generated.json`, `gen-window-zones.mjs` (comment only). Did NOT touch
  `levelArt.ts` / `LevelBackdrop.tsx` / `backdropLayout.test.ts` / `levels.ts`.
- release:
  - **`src/game/levels/levelArt.json` belliard entry:** - `backdrop`: `troncon-sequence` (4 tiles) → `{ mode: "single-wide", file:
"street-wide", aspect: 5.1426 }` — matches lane A's pinned contract literal exactly
    (verified `image dimensions 6418×1248` via the committed PNG; `5.1426 = round(6418/1248,
4)`, NOT the ADR-0057 draft's stale 6656×1248/≈5.333). `$comment` rewritten: single
    opaque plane (buildings+ground+sky baked in), no more tile/sky/ground split, regen
    pipeline note (`gen-street-paid.mjs` + `stitch-belliard-street.mjs`, not
    `gen-level-art.mjs`). - `windows` (WindowRows, feeds `getWindowZones` → consumed directly by
    `buildSingleWideLayout`): 3 rows from spec §1.2/§1.3 verbatim — y=0.24 (12 cols),
    y=0.35 (18 cols), y=0.47 (24 cols; the spec's prose says "22 colonnes" but its own
    explicit `x_norm` list — the stated "cible ET critère d'acceptation" — has 24 values;
    I followed the literal list, total 54 zones, still inside the spec's 48-56 AC-DENSITÉ
    band). All exclusion zones re-verified column-by-column (passage 0.372-0.408, couture
    0.485-0.502, pignon 0.788-0.812, edges <0.035/>0.965) — clean. `w`/`h` are new: the
    compact `WindowRows` format shares one box size across all rows/cols, so I picked
    `w:0.018` (under the tightest observed column gap, 0.02, to avoid any zone overlap)
    and `h:0.09` (close to the old per-tile generated windows' measured 0.0898, and
    `facadeH` — what `h` scales against — is unchanged at `WORLD_HEIGHT=12` in both modes,
    so this keeps roughly the same on-screen window-box height as before). - `nearForeground.objects`: 18 props → the 13 from spec §2.4 verbatim (x_norm + row).
    `trafficLight` at 0.388 (over the passage) documented in the `$comment` as the sole
    prop exempt from the render-side `maxH` clamp (per Karim's C1/C2 gate correction) —
    the only one that can rise into the window band, deliberately placed where its mast
    never sweeps a live pop window. - `windowGrid.top`: 0.19 → 0.24 per spec §7 dev note. **Correction to the dev note's own
    premise, verified against shipped code:** the near-foreground `maxH` clamp
    (`nearForegroundBandTop` in `src/render/scene/nearParallax.ts`) is derived LIVE from
    the level's actual `windows` zones (lowest row's bottom edge + margin), not from
    `windowGrid.top` — and `getWindowGrid`/`WINDOW_GRID` has no other live caller in
    `src/render` or `src/game` today (checked: only defined, never imported elsewhere).
    So this field has zero functional effect on belliard's clamp right now; I updated it
    anyway for data hygiene (it's stale otherwise) and documented the real mechanism in
    the `$comment` so a future reader doesn't chase a dead lead. Left `bottom`/`cols`/
    `left`/`right` untouched (not asked, and `windowGrid` is otherwise unconsumed for
    belliard since `windows` takes priority in `getWindowZones`).
  - **`src/game/levels/windowZones.generated.json`:** removed the three dead
    `belliard/troncon-a|b|c` keys (114 zones, hand-calibrated troncon-pass output — never
    read by `buildSingleWideLayout`, which calls `getWindowZones` → `art.windows`, not
    `GENERATED_TRONCON_ZONES`). Left the bare `belliard` key (Pass-1 single-facade output)
    untouched — `gen-window-zones.mjs` Pass 1 still runs unconditionally per level and would
    regenerate it from `facade.png` regardless of `backdrop.mode`; it's merely unconsumed
    for belliard's render path now, not literally dead in the generator's output contract.
  - **`scripts/gen-window-zones.mjs`:** comment-only — noted in the Pass-2 doc block that
    belliard's `backdrop.mode` is no longer `"troncon-sequence"` so the existing
    `mode !== "troncon-sequence"` filter now silently skips it (no logic touched), and that
    its bare Pass-1 `belliard` key, while still generated, is unconsumed by the single-wide
    backdrop path.
- verify: `python3 -c "json.load(...)"` valid on both JSON files; `node
scripts/check-art-prompts.mjs` → PASSED (0 errors, pre-existing unrelated warnings only);
  `rtk tsc` → No errors; `rtk lint` → No issues; `rtk vitest run
src/game/levels/__tests__/backdropLayout.test.ts` → **7/7 pass** (lane A's contract now
  green, confirming `aspect`/`file`/`mode`/zone-count all match); `npx prettier --check` on
  all 3 files → formatted correctly.
  - Full `rtk vitest run`: 989 pass / 2 fail — both **pre-existing, outside my lane, not
    regressions from this change**: `assetManifest.test.ts` ("warms the tronçon tiles…
    ADR-0048") and `facadeLayout.test.ts` ("troncon-sequence (belliard): one native-width…
    pane per tile") both still hard-assert the OLD 4-tile troncon contract for belliard.
    Neither file is modified by lane A or lane B yet (`git status` confirms both untouched);
    they need a same-story follow-up in `src/game/systems/assetManifest.ts`+test (lane A/
    dev-gameplay territory) and `src/render/scene/facadeLayout.test.ts` (lane B/
    dev-r3f-render territory, companion to their already-modified `LevelBackdrop.tsx`) to
    assert the single-wide shape instead.
- File List: `src/game/levels/levelArt.json`, `src/game/levels/windowZones.generated.json`,
  `scripts/gen-window-zones.mjs`.
- next: → `senior-architect`: ADR-0057 body's Decision/Consequences sections are still
  unauthored placeholders, and its Context section cites the stale 6656×1248/≈5.333 draft
  figures (real committed asset is 6418×1248/5.1426, per lane A's pinned contract and my
  landed data) — reconcile when authoring the decision content. → `dev-gameplay`: the
  `levels.ts` hostage-anchor comment update (spec §4) and the `assetManifest.test.ts` red
  are both still unclaimed/pending in this lane. → `dev-r3f-render`: `facadeLayout.test.ts`
  needs the single-wide assertion update alongside the already-shipped
  `LevelBackdrop.tsx`. → `qa-lead`/`game-designer`: VERIFY playtest vs spec §5 acceptance
  criteria (AC-POP/AC-DENSITÉ/AC-VISÉE/AC-BARRIÈRES/AC-DIFFICULTÉ/AC-COHÉRENCE) can now run
  against the fully-wired manifest.

## 5. ARCHITECT — ADR-0057 decision content authored — senior-architect (Winston) — 2026-07-21

- claim: formalise the already-delivered-and-verified `single-wide` backdrop decision into
  ADR-0057 (producer scaffolded Context + empty Decision/Consequences); reconcile the stale
  aspect figure flagged by lanes A and C.
- release: **ADR-0057 → Accepted** (`docs/adr/0057-single-wide-backdrop-belliard.md`). Authored
  Decision (7 points), Consequences (positive/negative), and Alternatives; rewrote Context.
  - **Aspect reconciled (ADR now authoritative):** the scaffold's `6656×1248 / ≈5.333` was a
    stale draft figure. Committed asset verified `6418×1248` (`sips`), aspect **`5.1426`**,
    **`fullW = 12 × 5.1426 ≈ 61.71`** (≈27% narrower). Matches lane A's pinned contract literal
    and lane C's landed manifest. Fixed in Context, References, and the asset line.
  - **Amends, not supersedes, ADR-0048** (Decision §5): `troncon-sequence` stays a valid, tested
    capability with **zero live users**; belliard's freeze in `backdropLayout.test.ts` is lifted
    and re-authored for 1 tile, stalingrad/vitry `single-facade` parity left frozen byte-for-byte.
    Flagged in Consequences: troncon-sequence is now dead-code-adjacent, a candidate retirement if
    still unused at the next backdrop revisit.
  - **Alternatives documented:** rejected `troncon-1-tuile` (buildings-only + ground + empty sky)
    and `single-facade` N-repeat as semantically wrong for a fully-baked opaque décor; rejected
    detector-based zones (over-engineering) and win-condition retune (width is not the win lever).
  - **Provenance recorded** (regen guard): paid `ideogram-v4-quality` + `POLLINATIONS_TOKEN`
    (CI, seed 7111) mirror-stitched by `stitch-belliard-street.mjs` — NOT the FLUX prompt gate.
  - Verified against shipped code before writing: `GameScene.tsx` L403-416 suppresses
    `ForegroundFrames` on `single-wide`; `assetManifest.test.ts` L113 warms `street-wide.png`
    only. Index regenerated (`gen-adr-index.mjs --write`): 0057 = Accepted; `public/adr/index.html`
    kept in sync (freshness gate).
  - Scope: touched only the ADR + generated index (+ its HTML companion) + this shard. No code.
- File List: `docs/adr/0057-single-wide-backdrop-belliard.md`, `docs/adr/README.md`,
  `public/adr/index.html`.
- next: → `dev-gameplay`: the `levels.ts` hostage-anchor comment update and the
  `assetManifest.test.ts` red remain open (out of scope of this ADR pass). → `qa-lead`: VERIFY
  playtest + stage-6 review panel over the full diff before merge.

---

## Stage 6 — Code-review panel (merge gate) · CLOSED · 2026-07-21

**Scope reviewed:** `git diff origin/main...HEAD`, single-wide story files only (levelArt.ts/.json,
levels.ts, windowZones.generated.json, assetManifest.ts + tests, LevelBackdrop.tsx, GameScene.tsx,
facadeLayout.test.ts, gen-window-zones.mjs, stitch-belliard-street.mjs, gen-street-paid.mjs,
gen-street-experiment.yml). Boss/UI work on the shared worktree explicitly excluded.

**Four reviewers, parallel, orthogonal skills:**

- A `code-review` (high): 1 MINOR — seed input no-op (experiment tooling).
- B `bmad-code-review`: 1 MINOR — `$comment` drift "butt-join of two renders" vs mirror-of-one.
- C `bmad-review-edge-case-hunter`: #1 MAJEUR/CONFIRMED (seed `SEED` vs `SEEDS` → input ignored,
  3× paid generations); #2-#4 MINEUR (divergent single-wide warm-guard, resolution-dependent
  bottom band, stitch degenerate-source NaN); NITs (aspect/W-H validation).
- D `security-review`: clean — token stays a CI secret, no attacker-controlled asset path.

**Triage (integration review, senior-architect pass):**

- **Boundary law: OK** — `src/game` stays React/Three-free (levelArt/assetManifest are pure data
  - string builders); `src/render` (LevelBackdrop/GameScene) holds no rules, only reads
    `layout.mode`; no new cross-layer import.
- **Seams: OK** — the single-wide contract is consistent across the three touch points
  (render draws one opaque pane, `levelLayerPaths` warms that one file, tests pin `street-wide`).
- **Deps/deploy: none** — no dependency added; asset ships committed; workflow is manual-dispatch
  experiment only, off the render path.

**Findings actioned (commit `327487f`, dev-tooling + owning lanes):**

- C#1 / A (seed): workflow now passes `SEEDS="$SEED"` — dispatch seed honoured. RESOLVED.
- A+B (`$comment` drift): corrected to "mirror of ONE ideogram render". RESOLVED.
- C#2 (divergent guard): `levelLayerPaths` keys on `mode === "single-wide"` alone, mirroring the
  render's suppression. RESOLVED.
- C#3 (bottom band) / C#4 (stitch NaN) / NITs: **not blocking** — resolution-dependent cosmetic
  (band is night-black in the shipped 6418×1248 asset, verified in-game at 1280×800) and
  build-time malformed-input guards on throwaway experiment tooling. Logged as follow-up, not
  merge-blockers.

**Re-verify after fixes:** `tsc` clean · `vitest` 991/0 · JSON+YAML valid.

**VERDICT: MERGE.** No unresolved CONFIRMED BLOQUANT/MAJEUR finding remains. Branch = single-wide
story (rebased on origin/main) + this fix commit. Ready for Bertrand to merge.
