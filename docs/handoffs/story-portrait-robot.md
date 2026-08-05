# Hand-offs — Interstitial mini-game: Portrait-Robot (photofit scene)

**Feature:** a clandestine facial reconstruction mini-game between level transitions, inspired by the RoboCop (Ocean, 1988) photofit sequence — player selects from 4 stacked face-bands (hair / eyes / nose / mouth), each with multiple variant textures. Rendering: explicit Atari ST digitized-face aesthetic (coarse, high-contrast, low-color-palette portraits). Requested directly by Bertrand; story opened 2026-08-05.

Story planning artifact: `_bmad-output/planning-artifacts/story-portrait-robot.md` (TBD by pm).

**ADR reservations:**
- **ADR-0079:** Portrait-robot scene as interstitial mini-game within the app-shell — boundary (game/render/hooks seams, insertion point between level completions, state handoff with level loader).
- **ADR-0080:** Face-band data model — archetype registry, target/variant matching, determinism & seed control, asset format, pooling strategy.
- **ADR-0081:** Input & presentation layer — gesture-agnostic intent vocabulary, house BD-comics DA, CSS Modules. *(File renamed 2026-08-05 from `…-atari-st-render.md`: the Atari ST aesthetic is void per Bertrand's 2026-08-05 arbitration / story AC7 — the DA stays house BD-comics. The intake header's "explicit Atari ST digitized-face aesthetic" above is likewise superseded.)*

---

## 0. INTAKE — Bertrand (owner) / producer (Marion) — 2026-08-05

- **claim:** open story tracking shard for the photofit mini-game; allocate 3 ADR reservations (one per architectural boundary); record that stage 0 (tech-scout reconnaissance) is already complete.
- **release:** Story shard opened at `docs/handoffs/story-portrait-robot.md`. ADR slots **0079, 0080, 0081 reserved and scaffolded** (awaiting senior-architect decision content). Index entry generated.

  **Tech-Scout Recon (Stage 0) — COMPLETE** (tech-scout lane, prior to story opening):
  - **Mechanic core validated:** 4-zone band stacking (hair→eyes→noses→mouth, each a swappable row); free selection mode (no forced scroll, player cherry-picks). Input: vertical selects zone, horizontal cycles variant *within* that zone; timer 30–40 seconds (tuning TBD by game-designer); failure = −1 life.
  - **Atari ST rendering validated:** digitized faces are period-accurate source material (available via reference research). Coarse resolution, limited palette (4–8 colors per face), dithering/halftone. NOT a filter on modern faces — canonical asset delivery.
  - **Difficulty tuning decision:** **visual proximity of variants drives challenge, not timer pressure.** Some zones (esp. eye shape) present near-identical twins; correct pair-matching is the skill gate. 30–40s is generous; the cognitive load is recognition, not time management.
  - **Scope boundaries noted:** interstitial only (not a core loop, not a repeatable challenge, not a progression system); state lives in `src/game` (target-face seed, selection state, timer); render lives in `src/render` (band display, touch gestures).

- **next:**
  - `pm` (John): scope story, write story artifact (QUOI/POURQUOI, no architecture), answer: which level transitions trigger the photofit (all? named transitions?), win/loss consequences in the run context, visual/narrative framing.
  - `game-designer` + `ux-designer` (in parallel): design loop for mechanics tuning, gesture UX, Atari ST visual spec (palette choice, grid size, label typography). `lead-game-designer` gate follows.
  - `senior-architect`: TECH PLAN, ADR-0079/0080/0081 content (seams, data shapes, integration points). May request a targeted art-feasibility recon on digitized face sourcing if prior reference is insufficient.

**Pipeline committed (per Bertrand intent):** pm (scope + story artifact) → design loop (game-designer + ux-designer in parallel → lead-game-designer gate) → senior-architect (tech plan, ADR decisions) → dev lanes in parallel (dev-gameplay: face-band archetype logic, seed determinism; dev-r3f-render: band display, gesture handling; optionally dev-tooling-assets if asset-source conversion is needed) → verify (qa-lead: quality gate + playtest + device gesture e2e; ux-designer: gesture responsiveness on 1280×800 desktop & mobile touch; game-designer: tuning feel vs. timer & variant difficulty) → code-review panel → pm acceptance → merge.

**Known scope boundaries:**
- **Module locations:** game state (`src/game`), render/UI (`src/render`), controls (hooks bridge per existing pattern).
- **Asset delivery:** digitized source faces sourced as PNG/reference for hand-pixelation or AI-guided reproduction (TBD by senior-architect + game-graphist).
- **No seam breaches:** `src/game`/`src/render` boundary untouched; existing level loader + run-state APIs reused.

**Index entry generated; ADR-0079/0080/0081 scaffolds awaiting content.**

---

## 1. PM SCOPE + STORY — pm (John) — *awaiting*

*Placeholder: pm to write story artifact answering scope boundaries (level-transition trigger logic, win/loss consequences, narrative framing).*

---

## 2. DESIGN LOOP — game-designer (Sacha) + ux-designer (Tony) — *awaiting*

*Placeholder: tuning spec (timer calibration, variant difficulty curve), UX spec (gesture vocabulary, Atari ST visual interpretation, label legibility), narrative brief.*

**Lead-game-designer design gate — Karim — 2026-08-05 — DONE:**
`docs/game-design/design-gate-portrait-robot.md`.

- **Verdicts:** `spec-portrait-robot.md` (Sacha) **RETOUR LANE** (round 1/2 — contredit l'AC5 de la
  story sur la sanction, le placement et la fréquence ; aucune valeur à re-concevoir) ·
  `spec-portrait-robot-fiction.md` (Yasmine) **PASS AVEC CONDITIONS** ·
  `ux/portrait-robot-ux.md` (Tony) **PASS AVEC CONDITIONS** · brief `lead-art` hors gate,
  cohérence vérifiée.
- **12 arbitrages rendus** (A1→A12) : sanction = **énergie seule, zéro perte de vie** (−20 sur le
  capital initial du niveau suivant) · placement **interstitiel post-niveau**, pas de gel du monde ·
  **1 occurrence par run** · sélection libre ratifiée, mapping tactile = celui de l'UX ·
  **6 variantes / 1 gabarit** (budget art) · vocabulaire canon = celui du narratif ·
  chrono **35 s** (easy 56 / hard 30), télécarte 1 unité = 2,5 s · mini-crop et verrouillage
  indicatif **coupés** · payoff AC6 rendu **obligatoire et chiffré** (retard de vague +20/+10/0 s) ·
  twist « ton propre portrait-robot » **gelé** pour le Niveau Final.
- **Table de tuning canonique** en §3 du gate — fait foi sur toute spec de lane.
- **6 points escaladés à Bertrand** (§6 du gate) ; aucun n'est bloquant.
- **`senior-architect` peut ouvrir le TECH PLAN sur la §3 du gate** sans attendre les réécritures de
  lane : aucune valeur ne bougera.

---

## 3. TECH PLAN — senior-architect (Winston) — 2026-08-05 — DONE

**Canonical input:** `docs/game-design/design-gate-portrait-robot.md` **§3 + A4-bis + §8**
(B1/B2/B3 and the derived A12bis-A16). Every tuning value below comes from there; where
`spec-portrait-robot.md` or `ux/portrait-robot-ux.md` disagrees, §3 wins.

> **Révision 1 — 2026-08-05, after the §9 gate amendment.** The three ADR were updated **in
> place** (each carries a dated « Révisions » section). Net architectural effect: **no lane
> boundary moves and no new file appears** — B1/B2/B3 land inside modules the plan already
> assigned. What changed is *what those modules contain*, plus **two new hard invariants**
> (ADR-0079 D8, ADR-0080 D4.4/`seed-sweep`) and **two new boundary risks** (§3.4). See the
> per-ADR summaries below.

### 3.1 The three ADR, filled — Status `Proposed`

- **ADR-0079** — `docs/adr/0079-portrait-robot-interstitial-scene-shell.md`.
  New `AppPhase` `PORTRAIT_ROBOT`, rendered as a **DOM screen** (no `<Canvas>`, no Three, no
  CRT — ADR-0068 + accessibility). `PortraitScene` is a **standalone immutable record, not a
  field of `GameState`** (the QTE shell exists to freeze a running sim; there is no sim here).
  The verdict crosses to the next level as an opaque **`LevelModifier`** (`energyDelta`,
  `firstWaveDelaySeconds`, `narrativeBeat`) produced by the pure
  `levelModifierFromPortrait`, carried as React state in `App.tsx`, and applied at the next
  `createInitialState` through **one new optional `LevelParams.modifier`** → `energy:
  applyEnergy(ENERGY_INITIAL, delta)` + a new `GameState.waveHoldRemaining` gating the single
  wave-spawn branch. Absent modifier ⇒ byte-identical build. Seed is supplied by the shell,
  frozen at entry, overridable via `?portraitSeed=`.
  **Rév. 1 — new D8 (auto-resolution) and D9 (continuous chrono).** The 4/4 test is a
  **post-condition of `applyPortraitIntent`**; `tickPortraitScene` is the **identity on a
  resolved scene** (so expiry is only ever evaluated when no lock-in occurred — a property of
  the function's domain, not a check); and the frame fold **`stepPortraitScene(scene, intents,
  dt)` moves into `src/game`**, so the hook queues events and owns **no ordering**. That is
  what makes « 4/4 pile au buzzer ⇒ `IDENTIFIED` » a property of the reducer instead of a race
  between `pointerup` and rAF. `confirmGuardSeconds` **deleted** (replaced by ADR-0080's seed
  invariant). Chrono continuous: no unit, no digit; the paliers become a **monotone `palier`
  field on the scene** (50 % / 10 s / 5 s remaining), so three consumers cannot announce on
  three different frames. `RotateOverlay` pause unchanged — and the inbox is **cleared** on
  pause, never buffered.
- **ADR-0080** — `docs/adr/0080-portrait-robot-face-data-model.md`.
  Catalogue in **`src/game/portraits/`** (mirrors `src/game/levels/`, ADR-0074 shape): 4 bands ×
  6 variants × 1 gabarit, plus a **pairwise distance matrix** (15 entries/band) that makes the
  gate's decoy composition (2 strong + 3 medium + 0 fine) *executable*. `validatePortrait`
  is the single source of invariants (never throws; an invalid catalogue **skips the phase**,
  never bricks the run). Assets: **24 sliced PNGs**, one plate, **atomic** — a single writer
  script with no per-band mode + `plateChecksum` + a consistency test. Preloaded through a new
  `"portrait-robot"` manifest target during `NARRATIVE_POST`.
  **Rév. 1 — the seed invariant `initialStateAllWrong` (gate A14) is a draw constraint, so it
  lands here.** `drawPortraitPuzzle` now also fixes the **initial selection**, excluded from
  the truth slot by **modular arithmetic, not rejection sampling** ⇒ `correctCount(initial) ===
  0` for every seed, by construction. `PortraitPuzzle` gains `initialSelection`. New
  **`seed-sweep`** invariant in `validatePortrait` (severity error), at the same rank as
  `decoy-profile`, checking both the decoy profile and the all-wrong start over a fixed
  deterministic seed set — stated in the ADR as a **regression guard, not a proof** (the proof
  is the arithmetic).
- **ADR-0081** — `docs/adr/0081-portrait-robot-input-and-presentation-layer.md`
  (**renamed** from `…-atari-st-render.md`; the ST framing is void per AC7 — index regenerated).
  The pure layer speaks **intents** (`CYCLE / SET / FOCUS / ABANDON`), never gestures. Swipe
  *classification* is pure (`swipeGestureSystem.ts`, angle/distance constants — the numbers
  `ux-designer` round 2 tunes), *binding* is a hook. CSS Modules + `print/tokens.ts`
  (ADR-0046), runtime values as inline CSS custom properties.
  **Rév. 1 — `SUBMIT` is deleted, not internalised** (B1 removed its only emitter): an intent
  is the vocabulary of what a *player* asks for, and an unreachable member is a loaded gun that
  re-implements the deleted CTA by accident. The resolution keeps a name — the rule
  `resolvePortraitScene`, triggered by ADR-0079 D8.1. **Desktop closed (B3): horizontal drag →
  `SET(i, index + crans)`**, with one new pure function `accumulateDrag` + `DRAG_CRAN_DISTANCE`
  (a drag is continuous; `classifySwipe` judges a finished gesture and cannot serve). Discrete
  on both device classes. No CTA zone, no `Enter` binding, continuous gauge with **no digit**,
  two `revealSeconds` read from the scene (2,6 s / 1,4 s), no anti-brute-force counter-measure
  (gate A16).

### 3.2 Lane cut — non-overlapping paths

| Lane | Owns (exclusive) |
| --- | --- |
| **dev-gameplay** | `src/game/types/portraitRobot.ts`, `src/game/types/levelModifier.ts`, `src/game/systems/portraitRobotSystem.ts`, `src/game/systems/swipeGestureSystem.ts`, `src/game/portraits/**` (catalogue + `validatePortrait` + tests), and the three additive seams: `src/game/types/gameState.ts` (`waveHoldRemaining`), `src/game/systems/stateMachine.ts` (`LevelParams.modifier`, the hold guard), `src/game/systems/assetManifest.ts` (`"portrait-robot"` target), `src/game/systems/narrativeSystem.ts` (the 3 obligatory beats) |
| **dev-r3f-render** | `src/render/ui/portrait/**` (screen + `.module.css`), `src/render/scene/App.tsx` (phase, seed, `pendingModifier`, preload gate), `src/hooks/usePortraitRobot.ts`, `src/hooks/usePortraitGestures.ts` |
| **dev-tooling-assets** | `scripts/slice-portrait-plate.mjs` (+ registration/normalisation pass), `public/assets/portrait/*.png`, `src/game/portraits/portraitPlate.generated.json`, the FLUX prompt family + `check-art-prompts` conformance, CI wiring |

**Zero file is edited by two lanes.** `stateMachine.ts` / `gameState.ts` / `assetManifest.ts`
are game-layer files and belong to `dev-gameplay` alone; `App.tsx` is render-layer and belongs
to `dev-r3f-render` alone. `portraitPlate.generated.json` is **written only by the script**
(tooling lane) and **read only** by the catalogue (gameplay lane).

**Rév. 1 — the lane cut is unchanged.** Everything B1/B2/B3 introduced lands in modules already
assigned: `stepPortraitScene` + `palier` + the two `revealSeconds` in `portraitRobotSystem.ts`
and `initialSelection`/`seed-sweep` in `src/game/portraits/**` (both **dev-gameplay**);
`accumulateDrag` + `DRAG_CRAN_DISTANCE` in `swipeGestureSystem.ts` (**dev-gameplay**, consumed
by the render lane's hook); the pointer state machine in `usePortraitGestures.ts` and the
removal of the CTA zone in `src/render/ui/portrait/**` (**dev-r3f-render**). **No new file, no
lane boundary moved, no serialisation added.** Two workload notes: `dev-gameplay`'s pure
surface grows (the D8 fold and its four ordering tests are the highest-value tests of the
story), and `dev-r3f-render`'s hook is **larger than the TECH PLAN implied** — ADR-0081 C1
scores that misprediction openly rather than hiding it in an estimate.

### 3.3 Order and seams

1. **Step 0 — serialised, blocking (≤1 h, `dev-gameplay`).** Land the two contract files —
   `types/portraitRobot.ts` and `types/levelModifier.ts` — plus the asset **path convention**
   (`assets/portrait/<band>-<nn>.png`) agreed with `dev-tooling-assets`. Nothing else starts
   before these exist; everyone else imports them read-only. This is ADR-0076 C7's pattern.
   **Rév. 1 — the contract files carry three more members**, and the render lane must not start
   against a stale shape: `PortraitScene.palier`, `PortraitScene.revealSeconds`, and
   `PortraitPuzzle.initialSelection`. `PortraitIntent` ships **without `SUBMIT`**.
1bis. **Step 0bis — the D8 fold, first thing in step 1 (`dev-gameplay`).** `stepPortraitScene`
   and its four ordering tests (ADR-0079 D8.3) land **before** `usePortraitRobot` is written,
   so the hook is built against a fold that already exists and never grows an ordering of its
   own "for now".
2. **Step 1 — the three lanes in parallel.**
   - `dev-tooling-assets` ships **placeholder PNGs** (24 flat, distinguishable, correctly-sized
     files) on day 1 so the render lane is never blocked on the art gate. Real plate + slicing +
     checksum follow at the art lane's pace.
   - `dev-gameplay` works TDD against the gate §3 table; a **provisional distance matrix** is
     committed with the placeholders so `decoy-profile` is exercised before
     `game-graphist`'s comparison plate lands (ADR-0080 C2 — this is the one item that can idle
     the lane).
   - `dev-r3f-render` builds against `PortraitScene` + placeholder assets.
3. **Step 2 — integration, `dev-r3f-render` last.** The `pendingModifier` → next-level wiring
   in `App.tsx` needs `levelModifierFromPortrait` merged first.
4. **Step 3 — VERIFY (stage 5, `qa-lead`).** Beyond tsc/vitest/lint: the determinism proof runs
   in the built app via `?portraitSeed=`; `game-designer` replays against §3 and **A11 — the
   question at playtest is "is the payoff *felt*", not "does it work"**; `ux-designer` reviews
   the swipe on a real touch device **and the drag on desktop 1280×800 (B3)**; the wave-hold's
   effect on quota difficulty (ADR-0079 D4) is a named tuning check.
   **Rév. 1 — three additions to the verify list**, all of them things a green suite would not
   catch: (a) the **buzzer race played for real** — a pinned seed where the 4th correct band is
   placed in the last visible instant, checked to yield `IDENTIFIED` on both a 60 Hz and a
   throttled frame rate; (b) **entry state is 0/4** on every QA seed, observed in the built app,
   not only in the sweep; (c) the **three paliers fire exactly once each** (copy, music,
   `aria-live`) — the failure mode B2 created is an announcement repeating every frame, which
   reads as fine in a unit test and is unbearable with a screen reader on.

### 3.4 Boundary risks I am watching at stage 6

- **The −20 energy or the +20 s computed in `App.tsx`.** The single most likely breach (it looks
  like "just a switch"). Rejected in advance: ADR-0079 A5.
- **A life lost anywhere.** Structurally impossible — `LevelModifier` has no field for it. Any
  diff that adds one is a gate failure, not a tuning call (gate A1, story AC5).
- **A drift back to dithered/photo faces** (story Risk 4, AC7).
- **[Rév. 1] `applyPortraitIntent` or `tickPortraitScene` called from `src/hooks`.** The ordering
  guarantee of ADR-0079 D8.3 is only real while `stepPortraitScene` is the hook's single call
  site. Two call sites = the buzzer race is back, silently, with green tests. **Blocking finding
  at the panel, regardless of test colour** (ADR-0079 C2bis) — and D8 is reviewed as a unit, not
  as three independent bullets.
- **[Rév. 1] A resurrected validation act.** No button, no `Enter`, no long-press "confirm", no
  `SUBMIT` member sneaking back into `PortraitIntent` "for the keyboard". B1 deleted the act,
  not just the label.
- **[Rév. 1] A per-trait feedback cue on the screen** — a tint, a check, a border, an `aria`
  hint, a timing tell. Gate A16 permits exactly **one** signal, global and terminal: the phase
  ending. This one arrives as a well-meant polish PR, which is why it is written down here.
- **[Rév. 1] A rejection-sampling loop or a shell-side "nudge" enforcing the all-wrong start.**
  ADR-0080 D4.4 / A7 / A8 — the invariant is arithmetic in the draw, and anywhere else it is
  both unverifiable and a break of seed replayability.
- **[Rév. 1] A chrono digit reappearing**, or a consumer comparing `remainingSeconds` to 10/5
  instead of reading `scene.palier` (ADR-0079 D9).
- **A gesture literal inside `src/game`.** ADR-0081 D1 — if `SWIPE` or `DRAG` appears in the
  intent union, the abstraction has failed. **This one was live-fire-tested on 2026-08-05**: B3
  landed the desktop drag and the intent union did not move (`SET` absorbed it). The risk is now
  the *drag's intermediate state* leaking in — a `dragging` flag or a pixel delta on
  `PortraitScene` (ADR-0081 A7, rejected). Pointer mid-travel belongs to the hook; only crans
  cross the seam.
- **A hand-patched single band** breaking the seam rule — caught by `plateChecksum`, not by eyes.

### 3.5 Descended to other lanes (non-blocking)

- **`lead-art`:** his §4 and §7.3 Q5 assume CRT + the world's glow law. The scene is an
  **interactive DOM surface**: no CRT (structurally outside `CrtPass`), selection liseré as a
  CSS falloff on the focused band, xerox grain as **one post-composition layer**. His §7.3 Q1/Q3
  are answered: **24 PNGs**, sliced from one plate, **atomicity granted and mechanised**.
  His §4's "chrono qui coûte une vie" is false since A1 and must be corrected.
- **`game-graphist`:** the comparison plate (§7.2) is now a **hard dependency** — it is the
  source of the 60 distance values.
- **`ux-designer`:** round 2 lands as constants, on no critical path (ADR-0081 D3). **Rév. 1 —
  the list has changed:** *discrete vs inertial* is **closed** by B3 (discrete on both device
  classes — an inertial desktop drag would not be "the same mental model" as a discrete touch
  swipe); **`DRAG_CRAN_DISTANCE` joins** the open numbers beside `SWIPE_MIN_DISTANCE` and
  `SWIPE_MAX_ANGLE_DEG`; and the round now also owes the **redistribution of the vertical
  budget freed by the deleted CTA** and the **chrono gauge without a number** — with the
  constraint that no affordance may reappear that reads as "confirm".
- **`narrative-designer`:** **Rév. 1 — one new short deliverable, and it is on the critical path
  of the screen's copy**: a gauge label to replace the dead `TÉLÉCARTE · {n} UNITÉS` (no number
  can appear in it — gate A13). Until it lands the render lane ships the gauge **unlabelled**
  rather than inventing copy (ADR-0081 D4). Also owed: the `PARTIAL` verdict copy and the
  re-framing of the expiry line (gate §8 B1), which are gate conditions, not architecture.
- **`game-designer`:** the wave hold reduces pressure *and* kill time on a quota level — a real
  tuning consequence to re-check at playtest. **Rév. 1 —** gate A16 refuses any anti-sweep
  counter-measure; if the playtest shows players sweeping instead of looking, the lever is the
  decoy class (A5), never an input penalty. Architecture will not provide a cooldown.

---

## 4. BUILD LANES — *awaiting dev start (plan in §3.2/§3.3)*

- **dev-gameplay (Amelia):** pure scene state machine + catalogue + `validatePortrait` + the
  three additive seams in the tick. TDD.
- **dev-r3f-render (Amelia):** `PORTRAIT_ROBOT` DOM screen (CSS Modules + tokens), the two
  bridge hooks, `App.tsx` phase + `pendingModifier` wiring.
- **dev-tooling-assets (Victor):** plate → registration → slicing script (atomic, checksummed),
  placeholders day 1, FLUX prompt family, generated seam JSON.

---

## 4bis. LANE `dev-r3f-render` — étapes 1 et 2 — 2026-08-05 — LIVRÉE

- **claim :** `src/render/ui/portrait/**`, `src/hooks/usePortraitRobot.ts`,
  `src/hooks/usePortraitGestures.ts`, `src/render/scene/App.tsx` (phase, graine,
  `pendingModifier`, gate de préchargement). Aucun fichier hors §3.2 touché.
- **release :** trois commits — `4686188` (écran), `e3c649f` (hooks + App), plus le
  présent journal.
  - **Écran DOM pur** : `PortraitRobotScreen` + `TelecarteGauge` + `EarlyExitButton` +
    `PortraitRobotPhase`, `copy.ts` (copie reprise au mot près de la spec fiction round 3
    — la lane render n'écrit aucun texte), CSS Modules sur les tokens print (zéro hex,
    zéro font, zéro breakpoint ; fork d'appareil en `data-device`).
  - **Bandes jointives** : `gap: 0`, aucune bordure ni séparateur entre les rangées, et
    le portrait cible est rendu par la MÊME pile au même gabarit, pour que les deux
    visages se comparent trait pour trait.
  - **Aucun acte de validation**, **aucun feedback par trait**, **aucun chiffre de
    chrono** — chacun couvert par un test.
  - **`usePortraitRobot`** : un seul site d'appel, `stepPortraitScene`. Boîte d'entrée
    vidée en pause ET intentions jetées à l'arrivée pendant la pause (le simple vidage à
    l'entrée en pause laissait la file se remplir puis atterrir d'un coup à la reprise —
    trouvé par le test, corrigé).
  - **`usePortraitGestures`** : binding seul ; bande gelée au `pointerdown`, hystérésis
    en deux phases, N crans ⇒ UN `SET` ; clavier complet, aucune liaison `Enter`.
  - **`App.tsx`** : phase intercalée après `NARRATIVE_POST`, une occurrence par run,
    graine gelée et rejouable (`?portraitSeed=`), gate de préchargement sur la cible
    `portrait-robot`, `pendingModifier` dépensé exactement une fois. Le verdict passe par
    `levelModifierFromPortrait` — aucune table de payoff côté render.
- **Vérification :** `tsc` clean, `eslint` clean, suite complète verte
  (138 fichiers / 1916 tests, dont 24 neufs sur cette lane). **Pas encore de captures
  `verify`** : les 24 PNG sont des placeholders, une capture ne prouverait pas encore la
  jointure au trait (G7a/G7b/G7c du gate art restent à faire sur la vraie planche).
- **Écarts de spec constatés, non tranchés en silence :**
  1. **`aria-valuetext`** — l'UX §5.5.3 écrit trois paliers qualitatifs, le gate A18 en a
     ajouté un quatrième (`MID`). `MID` et `URGENT` partagent « ça presse » plutôt que
     d'inventer une quatrième chaîne. → `ux-designer`.
  2. **Échelle typographique** — le plancher « 14px effectif » (UX §5.3/§9.3) est au-dessus
     des pas `xs`/`sm`/`md` de `print/tokens.ts` (9/11/12px) : les libellés de bande, le
     compteur et la jauge utilisent `--font-size-base` (16px). → `lead-art`.
  3. **Reptation de révélation à `PARTIAL`/`FAILED`** (UX §6) non implémentée : elle exige
     l'asset de la variante JUSTE par bande après résolution. Dérivable de `puzzle.truth`
     côté hook, mais c'est une surface neuve à valider, pas une initiative de lane.
     → `senior-architect` / `ux-designer`.
  4. **Armement de la sortie anticipée** — ADR-0081/gate A17 le situent « dans le hook » ;
     il vit dans `EarlyExitButton` (état local, `ARM_WINDOW_MS`), donc dans la couche render
     et hors du modèle de jeu comme exigé, mais pas littéralement dans `src/hooks`.
     → `senior-architect`.
  5. **Beats narratifs de niveau suivant** (`LevelModifier.narrativeBeat`) portés mais pas
     encore joués : le pré-niveau ne branche pas sur le beat. À câbler une fois les trois
     scènes de `narrativeSystem` disponibles. → coordination `dev-gameplay`.
- **next :** `qa-lead` (stage 5) — dont les trois vérifications Rév. 1 : course du buzzer
  sur seed épinglée à 60 Hz et en frame-rate bridé, entrée 0/4 observée dans l'app buildée,
  et les trois paliers déclenchés exactement une fois chacun.

---

## 5. VERIFY — qa-lead (Inès) — *awaiting dev completion*

*Placeholder: quality gate (desktop tsc/vitest/lint + e2e gesture flow), game-designer playtest vs. spec, ux-designer device gesture review (desktop 1280×800 + mobile touch), composite gate.*

---

## 6. CODE-REVIEW PANEL — *awaiting dev completion*

*Placeholder: 4-reviewer triage (code-review high, bmad-code-review, bmad-review-edge-case-hunter, security-review), architect integration review.*

---

## 7. PM ACCEPTANCE — pm (John) — *awaiting panel clearance*

*Placeholder: scope vs. AC conformity check.*

---

## 8. MERGE — Bertrand (owner) — *awaiting acceptance*

*Placeholder: CI panel-verdict check, then merge to main.*

---

## 9. AMENDEMENT DU GATE — lead-game-designer (Karim) — 2026-08-05 — DONE

Trois arbitrages directs de Bertrand, **postérieurs au gate**, inscrits en
`docs/game-design/design-gate-portrait-robot.md` **§8** ; §3 (valeurs canoniques) et §4 (ce qui est
coupé) mises à jour **en place**, retraits barrés et non effacés. Maquette Figma `muf — Design
System` / `Écrans · Portrait-robot` à jour.

- **B1** — CTA `SORTIR LA TÊTE` **supprimé**, validation **automatique** dès 4/4.
- **B2** — télécarte 14 unités **virée** : essais illimités dans un temps imparti.
- **B3** — desktop = **option B**, drag horizontal sur la bande (mobile inchangé, A4-bis).

**6 arbitrages dérivés rendus** — A12bis (régime des issues : `IDENTIFIED` = verrouillage en cours
de phase, `PARTIAL`/`FAILED` = évaluation au buzzer ; ordre de résolution `IDENTIFIED`-gagne fermant
l'issue fantôme du 4/4 au buzzer) · A13 (paliers refaits en secondes : 50 % / 10,0 s / 5,0 s
restants) · A14 (`confirmGuardSeconds` **supprimé**, remplacé par l'invariant de seed
`initialStateAllWrong`) · A15 (`revealSeconds` 2,6 s à `PARTIAL`/`FAILED`, **1,4 s** à `IDENTIFIED`)
· A16 (A9 reformulé : aucun feedback **par trait**, un seul signal terminal ; **brute-force chiffré
à ~10,8 % de couverture en 35 s ⇒ stratégie dominée, aucune contre-mesure ajoutée**) · B3 en valeur
canonique.

**Inchangés :** A1/A1c/A2/A3/A5/A6/A8/A10/A11/A12, `timerSeconds` 35/56/30, seuils 4/4 · 3/4 · ≤2/4,
les trois barèmes d'issue.

**2 escalades neuves** (§6 points 7-8 du gate) : refus assumé d'une contre-mesure anti-balayage ;
asymétrie des deux `revealSeconds`.

**Specs de lane désormais fausses ⇒ à corriger** (dispatch Bertrand) : `spec-portrait-robot.md`
(R5/R7/R8, §4.1 `confirmGuardSeconds`+unités, §4.2 seuils, §6 paliers, AC13/AC14/§7),
`spec-portrait-robot-fiction.md` (§4.5 libellé télécarte, §4.7 cadrage expiration, §4.9 replis),
`ux/portrait-robot-ux.md` (CTA dans les 2 wireframes + tables de layout, budgets verticaux, §"ENTRÉE",
clavier `Entrée`, chrono, geste desktop). **ADR-0081** cite la copie canon et le compte d'unités ⇒
`tech-writer` / `senior-architect`.

---

## 10. FICTION ROUND 2 — narrative-designer (Yasmine) — 2026-08-05 — DONE

- **claim :** appliquer les 4 conditions du gate §7 F + absorber les amendements §8 (B1/B2/B3,
  A12bis→A16) dans `docs/game-design/spec-portrait-robot-fiction.md`.
- **release :** spec **round 2** livrée, journal de révision en §0 (R1→R9).
  - **Condition 1 (caduque via B2)** — `TÉLÉCARTE · {n} UNITÉS` mort. Nouvelle chaîne permanente
    **`TÉLÉCARTE`** (plafond dur **9 car.**, repli `CARTE` 5 car.), **aucun nombre, aucun
    séparateur**. Répliques recalées sur **paliers nommés** `MI-PARCOURS` / `URGENCE` / `DERNIER` —
    aucune seconde inventée côté fiction, les valeurs restent à `game-designer`/§3.
  - **Condition 2** — `PARTIAL` écrit (§4.8) : tampon **`PRESQUE LUI`** + KENZA/DISPATCH/MUF, cadré
    comme palier **subi** (A12bis), pas comme demi-succès.
  - **Condition 3** — rappels du niveau suivant écrits (§5.3) : `IDENTIFIED` (la porte le refuse),
    `FAILED` (**le beat obligatoire A1b** — `Sam`, habitué refusé à sa propre porte, « l'autre est
    entré »), **+ un troisième pour `PARTIAL`** que le gate n'avait pas commandé mais que l'issue
    rend dû.
  - **Condition 4** — passe de conformité IHM (§6.1), verdict par chaîne + **message d'abandon
    réécrit** (`Tu raccroches ?` / `JE RACCROCHE`), motif « perte de vie » éliminé.
  - **B1** — `SORTIR LA TÊTE` **abandonné**, non recyclé ; la réplique-source KENZA reste au
    dialogue. **Balayage anti-geste-de-validation complet** en §4.11 (7 lignes auditées, 4 modifiées)
    + interdit lexical neuf en §6 (`valide`/`confirme`/`envoie`/`quand tu es sûr`).
  - **A14** — le premier écran tout-faux est **mis en scène** (§4.0, KENZA : `Ça, c'est personne.`).
  - **A15** — plafonds de copie calés sur les deux `revealSeconds`.
- **Livrable neuf non commandé : LE VERROUILLAGE** (§4.6) — le seul feedback de la scène a
  désormais sa ligne, slot dédié, ≤ 1,4 s.
- **next :**
  - `lead-game-designer` (Karim) : verdict round 2.
  - `game-designer` (Sacha) : **Q9** (confirmer 3 paliers nommés, non répétables) · **Q10** (slot
    dédié pour la ligne de verrouillage, sinon repli fusionné).
  - `ux-designer` (Tony) : les chaînes de §6.1 sont définitives, ne pas paraphraser.
  - `dev-gameplay` : ne rien transcrire avant le PASS.

## 2026-08-05 · `lead-art` (Nico) — brief PORTRAIT-ROBOT, **rév. 2** (post-gate + amendements B1/B2/B3)

- **fichier :** `docs/art-direction/brief-portrait-robot.md` — mis à jour en place, note de révision datée en tête.
- **Aucun asset, aucun prompt, `levelArt.json` intouché.** Brief de cadrage, toujours pas un gate.
- **§1.0 (neuf) — LES BANDES SONT JOINTIVES.** Fait de production (Figma `muf — Design System` /
  `Écrans · Portrait-robot`, corrigé par Bertrand). Gap zéro, aucun filet de séparation, surface
  continue au gabarit **exact** de la cible. La règle de raccord n'est plus une bonne pratique,
  c'est la condition d'existence de l'écran. Trois conséquences opposables : plus rien n'absorbe
  l'erreur de raccord · **échelle cible ↔ construction 1:1 obligatoire** (sinon c'est le layout qui
  plie) · **la sélection ne peut plus être géométrique** — le liseré néon reste le seul marqueur.
- **§1.2bis (neuf) — tolérance de raccord retenue.** Référentiel : planche, portrait à 1024 px de
  haut. **Bleed 12 px de chaque côté de la couture** (24 px de recouvrement, coupe au milieu).
  Repères d'alignement en marge (ligne des yeux, base du nez, axe médian, traits de coupe).
  Tolérances : demi-largeur de crâne **≤ 2 px (PASS) / ≥ 4 px (rejet)** · axe médian ≤ 1 / ≥ 2 px ·
  tangente ≤ 3° / ≥ 6° · épaisseur de trait ≤ 10 % / > 15 %. Zone 2-4 px = alerte ; deux grandeurs
  en alerte sur la même couture = rejet. **Le rejet porte sur la PLANCHE, pas sur la variante**
  (atomicité ADR-0080 D5). Mécanique non liante sur le goût.
- **§3bis (neuf) — LE VERROUILLAGE**, seul signal de la scène (A16). Proposition :
  **RECALAGE → NÉGATIF → TAMPON**, un événement en trois couches. Global, binaire, terminal, sans
  couleur seule, intact en `prefers-reduced-motion`. Écartés : le liseré terminal (collide avec le
  liseré de sélection, contresens de la loi du glow) et la montée d'intensité (feedback par trait
  déguisé).
- **§4bis (neuf) — LA JAUGE.** L'encre s'en va, le contour reste : la carte se dépeuple, elle ne
  rétrécit pas. Front rongé au toner, zéro dégradé, zéro teinte, zéro nombre, zéro segment, jamais
  sous les portraits. Paliers 10 s / 5 s en **texture et épaisseur de filet**, pas en lumière.
- **Corrections encaissées.** (a) « un chrono qui coûte une vie » était **FAUX** — la scène ne
  retire aucune vie (A1/AC5), sanction = −20 énergie sur le niveau suivant (A1c) ; argument retiré.
  (b) Statut tranché **surface DOM interactive** (ADR-0080 D6.3) ⇒ liseré légitime sans exception,
  cible sans glow, **pas de CRT** (ADR-0081 D4) : partout où le brief disait « CRT allumé » comme
  condition de test, lire **« grain xerox de post-composition »**. (c) **Auto-correction** : mon
  §4 autorisait le néon sur le chrono critique au titre d'« alerte HUD » — **retiré**, il n'y a pas
  de HUD ici et la jauge n'est pas interactive.
- **G7 élargi (gate composite) :** G7a jointure à l'écran · G7b verrouillage (**4 captures dont une
  en reduced-motion**) · G7c jauge. Aucune n'est dans un PNG : **un PASS d'asset gate ne les couvre
  pas.**
- **Bible :** proposition d'un **§2ter** — sur une surface DOM interactive, la loi du glow
  s'applique à la lettre : brille ce qui se manipule, et rien d'autre, y compris ce qui est urgent.
- **next :**
  - `narrative-designer` (Yasmine) : libellé de jauge sans nombre — **Courier Prime, capitales,
    une ligne, ≤ 12 caractères** ; + le libellé du tampon de verrouillage (forme et poids §3bis.1
    sont à moi, les mots sont à elle).
  - `ux-designer` (Tony) / `game-graphist` : l'échelle **1:1** cible ↔ construction est-elle tenue
    par la maquette ? Si non, le layout plie, pas le gabarit.
  - `dev-r3f-render` : le hors repérage du plateau d'accent est-il tenable sans toucher le trait du
    visage ? S'il coûte une seconde passe, je le supprime — négatif + tampon suffisent.
  - `dev-tooling-assets` : `scripts/slice-portrait-plate.mjs` doit **mesurer et refuser** sur les
    quatre grandeurs de §1.2bis.
  - `concept-artist` (Maud) : §7.1 toujours ouvert, prompts inchangés — le tranchage se durcit, la
    planche ne change pas.

---

## 11. RATIFICATIONS BERTRAND + ARBITRAGES DE CLÔTURE — lead-game-designer (Karim) — 2026-08-05 — DONE

- **fichier :** `docs/game-design/design-gate-portrait-robot.md` — mis à jour **en place**
  (§3 canon, §6.4, §8/A2, **§9 « Ratifications Bertrand » neuf**). La §3 reste la seule source de
  vérité de tuning.
- **claim :** journaliser les trois réponses de Bertrand (lecture du dossier complet) et rendre les
  deux arbitrages qu'elles me laissaient. **Le dossier se clôt, il ne se rouvre pas.**

**Les trois ratifications**

| #   | Réponse                                                          | Portée               | Effet                                             |
| --- | ---------------------------------------------------------------- | -------------------- | ------------------------------------------------- |
| R-1 | Sortie anticipée = « j'ai fini, imprime » — « Ok très bien »      | story · canon §3     | Désaccord Sacha n°1 **clos → décision** (gate A17) |
| R-2 | Règle A1c — « valide ça »                                        | **PROJET**           | Sort de la story, devient règle de projet          |
| R-3 | Visages entiers puis découpe des bandes                          | art · ADR-0080       | Fait acquis, risque « bande par bande » **clos**   |

**Mes deux arbitrages (gate §9)**

- **A17 — sortie anticipée.** (a) Elle **ne peut jamais produire `IDENTIFIED`**, et **la question
  est vide par construction** : `IDENTIFIED` s'évalue sur événement d'entrée (A12bis) + invariant
  `initialStateAllWrong` (A14) ⇒ il n'existe aucun instant où le joueur est à 4/4 et encore en
  `ACTIVE`. La ligne du canon §3 reste, comme **assertion de régression (AC7-b)**, pas comme
  mécanisme — un `if` défensif côté dev signalerait un bug ailleurs. (b) **Confirmation
  CONSERVÉE, sans modale** : armement au 1ᵉʳ appui, sortie au 2ᵉ appui sur la **même** cible dans
  **2,0 s**, désarmement silencieux ensuite ; **chrono NON mis en pause** pendant l'armement (sinon
  c'est un bouton « geler le temps »). Motif : un mistap coûte **la scène entière et
  définitivement** (forward-only, 1 occurrence/run) contre ~1 s sur 35 pour la garde — et le mistap
  n'est pas théorique, le geste primaire est un swipe/drag au milieu des bandes. (c) **Critère
  anti-CTA fixé** (canon §3) : *est interdit tout contrôle dont l'activation peut produire
  `IDENTIFIED` ou évaluer une réussite* — c'est la **fonction** qui décide, pas la forme du geste ;
  la sortie n'est donc pas un « double-tap pour imprimer » au sens de §7 3-bis. (d) **Effet de bord
  nommé** : `PARTIAL` redevient soumettable, la phrase « strictement moins farmable » d'A12bis est
  **corrigée** ; barème inchangé (400 vs 1500, et le joueur abandonne tout son temps restant ⇒
  stratégie dominée). Aucune contre-mesure.
- **A18 — palier de mi-parcours (2ᵉ désaccord Sacha) : ACCORDÉ sur le fond, constante dérivée.**
  Son diagnostic `hard` est juste (deux cues à 5,0 s d'intervalle fusionnent en rampe). Je refuse le
  littéral `17,0` — canon : **`max(timerSeconds/2 ; PALIER_URGENCE + 7,0)` s restants** ⇒
  28,0 / 17,5 / **17,0** (valeurs de Sacha à l'identique). L'objet opposable est la **distance
  minimale de 7,0 s** = le temps de corriger réellement une bande. **Bord fermé :** si le
  mi-parcours calculé ≥ `timerSeconds`, il **n'est pas joué** (pas de cue à t=0).

- **release :** design gate PORTRAIT-ROBOT **CLOS**. Plus aucun désaccord de lane ouvert.
  A1/A2/A3/A5/A6/A8/A10/A11/A12/A12bis/A14/A15/A16 intacts ; `timerSeconds`, seuils
  4/4 · 3/4 · ≤ 2/4, paliers absolus 10,0 / 5,0 s et les trois barèmes **inchangés d'une unité**.
- **next :**
  - `pm` (John) : **inscrire A1c dans `_bmad-output/guidelines/PROJECT_GUIDELINES.md`** — « une
    scène interstitielle modifie le capital d'énergie initial du niveau **suivant**, jamais
    l'énergie du niveau écoulé ». Règle de projet, plus une règle de story.
  - `game-designer` (Sacha) : porter A17/A18 dans `spec-portrait-robot.md` — §2.1 (sortie),
    §4.1 (paliers, formule dérivée), §7 3-bis (critère anti-CTA), §4.2 (`PARTIAL` soumettable,
    correction d'A12bis), **AC13 : supprimer la branche « si Karim refuse le plancher, 15,0 s »**,
    **AC16 : ajouter le protocole des deux appuis**. Transcription, pas reconception.
  - `ux-designer` (Tony) : affordance permanente de sortie (≥ 44×44 px) + **états armé/désarmé**,
    sans modale ; `Échap` en deux temps ; copie ni « valider » ni « abandonner ».
  - `narrative-designer` (Yasmine) : copie de la sortie anticipée (2 états : au repos / armé),
    en plus du libellé de jauge déjà dû.
  - `senior-architect` (Winston) : A17 ajoute un sous-état d'IHM **hors modèle de jeu** (armement) —
    à cadrer dans ADR-0081 ; A18 ajoute **une** constante dérivée, aucune branche.
  - `lead-art` (Nico) : R-3 ratifiée, ta §5 et ADR-0080 D5 sont le fait acquis ; la génération
    bande-par-bande n'est plus une option à évaluer.

---

## 12. LANE `dev-gameplay` — Amelia — 2026-08-05 — DONE (étape 1)

- **claim :** toute la logique pure de la story, en TDD, sur le périmètre exclusif §3.2.
- **release :** 5 commits atomiques, `tsc` propre, **1128 tests verts** sur `src/game` + `src/hooks`.

**File List (écrit par cette lane, et rien d'autre)**

| Fichier | Contenu |
| --- | --- |
| `src/game/systems/portraitRobotSystem.ts` | table de tuning gate §3, paliers (D9), tirage haché (ADR-0080 D4), `applyPortraitIntent` / `tickPortraitScene` / **`stepPortraitScene`** / `resolvePortraitScene`, `levelModifierFromPortrait` |
| `src/game/systems/swipeGestureSystem.ts` | `classifySwipe`, `accumulateDrag`, `DRAG_CRAN_DISTANCE` + les 3 constantes UX round 2 |
| `src/game/portraits/{faceCatalogue.data,validatePortrait,index}.ts` | catalogue 4×6, `validatePortrait` (11 invariants dont `decoy-profile` et `seed-sweep`), barreau public |
| `src/game/types/gameState.ts` · `systems/stateMachine.ts` | `waveHoldRemaining`, `LevelParams.modifier`, la garde de hold |
| `src/game/systems/assetManifest.ts` · `narrativeSystem.ts` | cible `"portrait-robot"` (24 PNG), les 3 beats obligatoires |
| `src/game/{systems,portraits}/__tests__/portrait*.test.ts` | 90 tests, dont les 4 tests d'ordonnancement D8.3 |

**Ordre imposé tenu :** `stepPortraitScene` et ses quatre tests d'ordonnancement sont le **premier**
commit (`484fef93`), avant tout hook.

**Les 7 invariants du §3.4, vrais par construction**

1. `stepPortraitScene` est le seul point d'entrée — pinné par un test de contrat qui **lit les sites
   d'appel** de `src/hooks` et `src/render` (commentaires retirés : un hook qui *documente* qu'il
   n'appelle pas la règle la respecte).
2. Le 4/4 est une post-condition d'`applyPortraitIntent` ; `tickPortraitScene` s'ouvre sur le même
   garde de phase ⇒ l'expiration n'est évaluable que sur une scène non verrouillée.
3. `correctCount(initialSelection) === 0` par décalage modulaire dans le tirage. Zéro rejection
   sampling, zéro coup de pouce shell.
4. `LevelModifier` n'a pas de champ de vie, et un test énumère ses clés.
5. Zéro `Math.random` / `Date.now` dans **tout** `src/game` — test de contrat sur l'arbre entier.
6. `validatePortrait` ne jette jamais (testé sur catalogue vide, tronqué, incohérent).
7. `palier` est un champ monotone de la scène ; un test compte **exactement 3 transitions** sur une
   partie complète.

**Trois écarts constatés à l'implémentation — signalés, non rafistolés**

- **Le manifeste de planche généré n'existe pas encore** (`portraitPlate.generated.json`,
  `dev-tooling-assets`). `validatePortrait(catalogue)` l'accepte donc en second paramètre optionnel
  et remonte un **`plate-missing` (warning)** tant qu'il manque, plutôt que de sauter en silence
  `asset-in-plate` et `plate-provenance`. La forme attendue est déclarée
  (`PortraitPlateManifest` : `plateChecksum` + `assets`) — **à confirmer par la lane tooling**.
  L'ADR-0080 D3 décrit `validatePortrait(catalogue)` à un seul argument : c'est le seul point où
  j'ai élargi une signature d'ADR, et c'est visible.
- **Matrice de distance et traits PROVISOIRES**, marqués en tête du module de données : cycle à 6
  où *chaque* ligne fait 2 forts + 3 moyens + 0 fin, donc **toute** variante est éligible. C'est ce
  qui rend `decoy-profile` et `seed-sweep` exercés dès maintenant (ADR-0080 C2) — et c'est aussi ce
  qui les rend faux : la vraie matrice de `game-graphist` ne sera **pas** uniforme, et la courbe de
  difficulté de la scène est exactement cette différence. **Remplacer les 60 valeurs est une édition
  de données, aucun code ne bouge.**
- **Copie des 3 beats transcrite avant le PASS round 2 de Karim** (§10 disait « ne rien transcrire
  avant le PASS »). Transcription verbatim de la fiction §5.3, sans une paraphrase : si le verdict
  round 2 bouge une réplique, c'est une édition de chaîne dans `narrativeSystem.ts`, rien d'autre.
  Le `trait` des 24 variantes, lui, **n'existe dans aucune spec** — je l'ai écrit provisoirement et
  il revient à `narrative-designer` + la planche qu'il décrit.

**Deux points où le gate/les ADR se sont révélés muets**

- **Le médaillon cible n'a pas d'asset propre.** ADR-0080 D5 annonce « les 24 chemins + le
  médaillon » pour la cible de manifeste ; aucun fichier de médaillon n'existe ni n'est commandé.
  J'ai livré la cible **composée des quatre bandes vraies** (gate A8 : cible visible en permanence,
  tirée du catalogue) ⇒ 24 chemins, pas 25. Si `lead-art` veut une planche de médaillon séparée,
  c'est un asset neuf, pas une ligne de manifeste.
- **Le hold de vague est gelé pendant un QTE.** Les branches de gel (hostage / boss) rendent tôt en
  `...state`, donc `waveHoldRemaining` ne décroît pas — cohérent avec « le beat est hors du temps »,
  mais aucun ADR ne le dit. Signalé pour arbitrage : c'est un comportement, pas un oubli.

- **next :**
  - `dev-tooling-assets` (Victor) : confirmer la forme de `PortraitPlateManifest` et brancher le
    JSON généré dans `validatePortrait` ; la planche doit faire tomber `plate-missing`.
  - `game-graphist` : les 60 valeurs de distance — c'est la dépendance dure qui rend la difficulté
    réelle.
  - `narrative-designer` (Yasmine) : les 24 `trait` (une phrase courte, sans coordonnée, sans indice
    de justesse) ; verdict round 2 de Karim sur les 3 beats déjà transcrits.
  - `ux-designer` (Tony) : `SWIPE_MIN_DISTANCE` / `SWIPE_MAX_ANGLE_DEG` / `DRAG_CRAN_DISTANCE` —
    valeurs par défaut posées, les tests de bord tiennent à n'importe quelle valeur.
  - `senior-architect` (Winston) : les deux points muets ci-dessus + la signature élargie de
    `validatePortrait`.
