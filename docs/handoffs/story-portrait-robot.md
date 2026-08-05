# Hand-offs — Interstitial mini-game: Portrait-Robot (photofit scene)

**Feature:** a clandestine facial reconstruction mini-game between level transitions, inspired by the RoboCop (Ocean, 1988) photofit sequence — player selects from 4 stacked face-bands (hair / eyes / nose / mouth), each with multiple variant textures. Rendering: explicit Atari ST digitized-face aesthetic (coarse, high-contrast, low-color-palette portraits). Requested directly by Bertrand; story opened 2026-08-05.

Story planning artifact: `_bmad-output/planning-artifacts/story-portrait-robot.md` (TBD by pm).

**ADR reservations:**

- **ADR-0079:** Portrait-robot scene as interstitial mini-game within the app-shell — boundary (game/render/hooks seams, insertion point between level completions, state handoff with level loader).
- **ADR-0080:** Face-band data model — archetype registry, target/variant matching, determinism & seed control, asset format, pooling strategy.
- **ADR-0082:** Input & presentation layer — gesture-agnostic intent vocabulary, house BD-comics DA, CSS Modules. _(File renamed 2026-08-05 from `…-atari-st-render.md`: the Atari ST aesthetic is void per Bertrand's 2026-08-05 arbitration / story AC7 — the DA stays house BD-comics. The intake header's "explicit Atari ST digitized-face aesthetic" above is likewise superseded.)_

---

## 0. INTAKE — Bertrand (owner) / producer (Marion) — 2026-08-05

- **claim:** open story tracking shard for the photofit mini-game; allocate 3 ADR reservations (one per architectural boundary); record that stage 0 (tech-scout reconnaissance) is already complete.
- **release:** Story shard opened at `docs/handoffs/story-portrait-robot.md`. ADR slots **0079, 0080, 0081 reserved and scaffolded** (awaiting senior-architect decision content). Index entry generated.

  **Tech-Scout Recon (Stage 0) — COMPLETE** (tech-scout lane, prior to story opening):
  - **Mechanic core validated:** 4-zone band stacking (hair→eyes→noses→mouth, each a swappable row); free selection mode (no forced scroll, player cherry-picks). Input: vertical selects zone, horizontal cycles variant _within_ that zone; timer 30–40 seconds (tuning TBD by game-designer); failure = −1 life.
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

## 1. PM SCOPE + STORY — pm (John) — _awaiting_

_Placeholder: pm to write story artifact answering scope boundaries (level-transition trigger logic, win/loss consequences, narrative framing)._

---

## 2. DESIGN LOOP — game-designer (Sacha) + ux-designer (Tony) — _awaiting_

_Placeholder: tuning spec (timer calibration, variant difficulty curve), UX spec (gesture vocabulary, Atari ST visual interpretation, label legibility), narrative brief._

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
> assigned. What changed is _what those modules contain_, plus **two new hard invariants**
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
  gate's decoy composition (2 strong + 3 medium + 0 fine) _executable_. `validatePortrait`
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
- **ADR-0082** — `docs/adr/0082-portrait-robot-input-and-presentation-layer.md`
  (**renamed** from `…-atari-st-render.md`; the ST framing is void per AC7 — index regenerated).
  The pure layer speaks **intents** (`CYCLE / SET / FOCUS / ABANDON`), never gestures. Swipe
  _classification_ is pure (`swipeGestureSystem.ts`, angle/distance constants — the numbers
  `ux-designer` round 2 tunes), _binding_ is a hook. CSS Modules + `print/tokens.ts`
  (ADR-0046), runtime values as inline CSS custom properties.
  **Rév. 1 — `SUBMIT` is deleted, not internalised** (B1 removed its only emitter): an intent
  is the vocabulary of what a _player_ asks for, and an unreachable member is a loaded gun that
  re-implements the deleted CTA by accident. The resolution keeps a name — the rule
  `resolvePortraitScene`, triggered by ADR-0079 D8.1. **Desktop closed (B3): horizontal drag →
  `SET(i, index + crans)`**, with one new pure function `accumulateDrag` + `DRAG_CRAN_DISTANCE`
  (a drag is continuous; `classifySwipe` judges a finished gesture and cannot serve). Discrete
  on both device classes. No CTA zone, no `Enter` binding, continuous gauge with **no digit**,
  two `revealSeconds` read from the scene (2,6 s / 1,4 s), no anti-brute-force counter-measure
  (gate A16).

### 3.2 Lane cut — non-overlapping paths

| Lane                   | Owns (exclusive)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **dev-gameplay**       | `src/game/types/portraitRobot.ts`, `src/game/types/levelModifier.ts`, `src/game/systems/portraitRobotSystem.ts`, `src/game/systems/swipeGestureSystem.ts`, `src/game/portraits/**` (catalogue + `validatePortrait` + tests), and the three additive seams: `src/game/types/gameState.ts` (`waveHoldRemaining`), `src/game/systems/stateMachine.ts` (`LevelParams.modifier`, the hold guard), `src/game/systems/assetManifest.ts` (`"portrait-robot"` target), `src/game/systems/narrativeSystem.ts` (the 3 obligatory beats) |
| **dev-r3f-render**     | `src/render/ui/portrait/**` (screen + `.module.css`), `src/render/scene/App.tsx` (phase, seed, `pendingModifier`, preload gate), `src/hooks/usePortraitRobot.ts`, `src/hooks/usePortraitGestures.ts`                                                                                                                                                                                                                                                                                                                         |
| **dev-tooling-assets** | `scripts/slice-portrait-plate.mjs` (+ registration/normalisation pass), `public/assets/portrait/*.png`, `src/game/portraits/portraitPlate.generated.json`, the FLUX prompt family + `check-art-prompts` conformance, CI wiring                                                                                                                                                                                                                                                                                               |

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
story), and `dev-r3f-render`'s hook is **larger than the TECH PLAN implied** — ADR-0082 C1
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
   question at playtest is "is the payoff _felt_", not "does it work"**; `ux-designer` reviews
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
- **A gesture literal inside `src/game`.** ADR-0082 D1 — if `SWIPE` or `DRAG` appears in the
  intent union, the abstraction has failed. **This one was live-fire-tested on 2026-08-05**: B3
  landed the desktop drag and the intent union did not move (`SET` absorbed it). The risk is now
  the _drag's intermediate state_ leaking in — a `dragging` flag or a pixel delta on
  `PortraitScene` (ADR-0082 A7, rejected). Pointer mid-travel belongs to the hook; only crans
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
- **`ux-designer`:** round 2 lands as constants, on no critical path (ADR-0082 D3). **Rév. 1 —
  the list has changed:** _discrete vs inertial_ is **closed** by B3 (discrete on both device
  classes — an inertial desktop drag would not be "the same mental model" as a discrete touch
  swipe); **`DRAG_CRAN_DISTANCE` joins** the open numbers beside `SWIPE_MIN_DISTANCE` and
  `SWIPE_MAX_ANGLE_DEG`; and the round now also owes the **redistribution of the vertical
  budget freed by the deleted CTA** and the **chrono gauge without a number** — with the
  constraint that no affordance may reappear that reads as "confirm".
- **`narrative-designer`:** **Rév. 1 — one new short deliverable, and it is on the critical path
  of the screen's copy**: a gauge label to replace the dead `TÉLÉCARTE · {n} UNITÉS` (no number
  can appear in it — gate A13). Until it lands the render lane ships the gauge **unlabelled**
  rather than inventing copy (ADR-0082 D4). Also owed: the `PARTIAL` verdict copy and the
  re-framing of the expiry line (gate §8 B1), which are gate conditions, not architecture.
- **`game-designer`:** the wave hold reduces pressure _and_ kill time on a quota level — a real
  tuning consequence to re-check at playtest. **Rév. 1 —** gate A16 refuses any anti-sweep
  counter-measure; if the playtest shows players sweeping instead of looking, the lever is the
  decoy class (A5), never an input penalty. Architecture will not provide a cooldown.

---

## 4. BUILD LANES — _awaiting dev start (plan in §3.2/§3.3)_

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
  4. **Armement de la sortie anticipée** — ADR-0082/gate A17 le situent « dans le hook » ;
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

## 5. VERIFY — qa-lead (Inès) — 2026-08-05 — **QUALITY GATE : FAIL**

- **Rapport complet :** `docs/qa/plan-story-portrait-robot.md` (couverture AC par AC, verdict sur
  les 10 écarts déclarés par les lanes, specs de régression R1→R7 et d'e2e E1→E5).
- **Les trois vérifications Rév. 1 de §3.3 étape 3 : PASSÉES toutes les trois**, dans l'app buildée
  via `?preview=portrait` — (a) course du buzzer ⇒ `IDENTIFIED` à 60,2 fps **et** à 19,6 fps
  (bridage CPU ×20), 4ᵉ bande tirée entre 0,018 s et 0,311 s restantes ; (b) entrée **0/4 sur 6
  graines** ; (c) **3 changements de la région `aria-live` sur 2 221 frames**, un par palier.
- **4 findings BLOQUANTS (dont 1 corrigé pendant le gate) :**
  1. ~~**HEAD (`485d6bbe`) portait un feedback par bande** (`data-correct=…`), test A16 **ROUGE**~~
     — **corrigé pendant le gate** par `dev-r3f-render` (`7c4a8947`), 15/15 verts. Reste au journal
     comme finding de process : le diff n'avait pas été relu (la ligne venait d'une sonde QA
     ramassée par un commit de lane sur le même arbre de travail).
  2. **`narrativeBeat` produit, jamais consommé** ⇒ gate A1b et story **AC6** non satisfaits
     (`dev-gameplay` + `dev-r3f-render`).
  3. **`Échap` résout la scène en UN appui** contre A2/A17b/§11 (deux temps) — écart non déclaré
     (`lead-game-designer` arbitre, `dev-r3f-render` exécute).
  4. **`validatePortrait` n'a aucun appelant en production** ⇒ le saut de phase d'ADR-0080 D3
     n'existe pas et le `plateChecksum` est inerte (`dev-gameplay` + `dev-tooling-assets`).
- **Majeurs :** `aria-valuenow` mute ~60×/s et expose les secondes ; une liaison `Enter` **survit**
  à la mutation (trou de couverture prouvé) ; reptation AC4 non livrée ; gabarit cible↔construction
  non 1:1 sur mobile ; **zéro e2e** sur la scène ; aucun canal audio de palier.
- **Non vérifiable à ce stade :** tout le fond visuel (placeholders), la courbe de difficulté
  (matrice provisoire uniforme), le geste tactile réel. **CI-DEFERRED** (escaladé à `producer`) :
  la chaîne complète niveau → portrait → niveau suivant, faute de run scripté — l'e2e E5 la lève.
- **next :** `dev-r3f-render` (B1, B3), `dev-gameplay` (B2, B4, R1/R2), `dev-tooling-assets`
  (E1→E5), `lead-game-designer` (arbitrage `Échap`), `producer` (CI-DEFERRED). Re-gate après B1→B4.

---

## 5bis. ADR COLLISION & MERGE RESOLUTION — producer (Marion) — 2026-08-05

**Process finding recorded for all long-running stories.**

**Collision:** During parallel development, `main` merged PR #159 (ADR-0081: MCP level-editor server) while portrait-robot story was in-flight carrying ADR-0081 (input & presentation layer), allocated at story intake before PR #159 merged. Two ADRs with the same number existed post-merge.

**Root cause:** ADR numbers are allocated at story opening by producer (§COLLABORATION.md rule #9). Recheck-at-merge is stated in ADR filing protocol but was not executed — once main moved ahead, portrait-robot branch did not re-verify numbering against origin/main before seeking merge.

**Resolution:**

1. Verified 0082 free across local, index, origin/main.
2. Renamed file: `docs/adr/0081-portrait-robot-input-and-presentation-layer.md` → `0082-…`
3. Updated ADR header: renumbering note + collision timestamp.
4. Replaced ADR-0081 → ADR-0082 in 64 references (12 TS files, 8 Markdown docs, 2 adjacent ADRs).
5. Merged origin/main; regenerated `docs/adr/README.md` and `public/adr/index.html` (conflicts on generated files resolved by script).
6. Typecheck remains ✓ after merge.

**Lesson for future long stories:** ADR numbering must be re-verified at **final merge cycle**, not just at opening, when the story has lived long enough for origin/main to move. Producer must block merge on stale ADR numbers, same as for stale branch. Cost of fix is O(references to ADR); cost of silent collision is undetectable until review — hence rule-level, not hope-level.

---

## 6. CODE-REVIEW PANEL — _awaiting dev completion_

_Placeholder: 4-reviewer triage (code-review high, bmad-code-review, bmad-review-edge-case-hunter, security-review), architect integration review._

---

## 7. PM ACCEPTANCE — pm (John) — _awaiting panel clearance_

_Placeholder: scope vs. AC conformity check._

---

## 8. MERGE — Bertrand (owner) — _awaiting acceptance_

_Placeholder: CI panel-verdict check, then merge to main._

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
clavier `Entrée`, chrono, geste desktop). **ADR-0082** cite la copie canon et le compte d'unités ⇒
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
    - interdit lexical neuf en §6 (`valide`/`confirme`/`envoie`/`quand tu es sûr`).
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
  cible sans glow, **pas de CRT** (ADR-0082 D4) : partout où le brief disait « CRT allumé » comme
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

| #   | Réponse                                                      | Portée           | Effet                                              |
| --- | ------------------------------------------------------------ | ---------------- | -------------------------------------------------- |
| R-1 | Sortie anticipée = « j'ai fini, imprime » — « Ok très bien » | story · canon §3 | Désaccord Sacha n°1 **clos → décision** (gate A17) |
| R-2 | Règle A1c — « valide ça »                                    | **PROJET**       | Sort de la story, devient règle de projet          |
| R-3 | Visages entiers puis découpe des bandes                      | art · ADR-0080   | Fait acquis, risque « bande par bande » **clos**   |

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
  anti-CTA fixé** (canon §3) : _est interdit tout contrôle dont l'activation peut produire
  `IDENTIFIED` ou évaluer une réussite_ — c'est la **fonction** qui décide, pas la forme du geste ;
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
    à cadrer dans ADR-0082 ; A18 ajoute **une** constante dérivée, aucune branche.
  - `lead-art` (Nico) : R-3 ratifiée, ta §5 et ADR-0080 D5 sont le fait acquis ; la génération
    bande-par-bande n'est plus une option à évaluer.

---

## 12. LANE `dev-gameplay` — Amelia — 2026-08-05 — DONE (étape 1)

- **claim :** toute la logique pure de la story, en TDD, sur le périmètre exclusif §3.2.
- **release :** 5 commits atomiques, `tsc` propre, **1128 tests verts** sur `src/game` + `src/hooks`.

**File List (écrit par cette lane, et rien d'autre)**

| Fichier                                                             | Contenu                                                                                                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/game/systems/portraitRobotSystem.ts`                           | table de tuning gate §3, paliers (D9), tirage haché (ADR-0080 D4), `applyPortraitIntent` / `tickPortraitScene` / **`stepPortraitScene`** / `resolvePortraitScene`, `levelModifierFromPortrait` |
| `src/game/systems/swipeGestureSystem.ts`                            | `classifySwipe`, `accumulateDrag`, `DRAG_CRAN_DISTANCE` + les 3 constantes UX round 2                                                                                                          |
| `src/game/portraits/{faceCatalogue.data,validatePortrait,index}.ts` | catalogue 4×6, `validatePortrait` (11 invariants dont `decoy-profile` et `seed-sweep`), barreau public                                                                                         |
| `src/game/types/gameState.ts` · `systems/stateMachine.ts`           | `waveHoldRemaining`, `LevelParams.modifier`, la garde de hold                                                                                                                                  |
| `src/game/systems/assetManifest.ts` · `narrativeSystem.ts`          | cible `"portrait-robot"` (24 PNG), les 3 beats obligatoires                                                                                                                                    |
| `src/game/{systems,portraits}/__tests__/portrait*.test.ts`          | 90 tests, dont les 4 tests d'ordonnancement D8.3                                                                                                                                               |

**Ordre imposé tenu :** `stepPortraitScene` et ses quatre tests d'ordonnancement sont le **premier**
commit (`484fef93`), avant tout hook.

**Les 7 invariants du §3.4, vrais par construction**

1. `stepPortraitScene` est le seul point d'entrée — pinné par un test de contrat qui **lit les sites
   d'appel** de `src/hooks` et `src/render` (commentaires retirés : un hook qui _documente_ qu'il
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
  où _chaque_ ligne fait 2 forts + 3 moyens + 0 fin, donc **toute** variante est éligible. C'est ce
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

---

## 6. STAGE 6 — Triage du panel + revue d'intégration (senior-architect, Winston)

> Une seule passe, une seule lecture du diff (81 fichiers, `git diff origin/main...HEAD`).
> Ce triage EST la revue d'intégration.

### 6.0 Ce que la vérification a tué — et ce qu'elle laisse debout

Aucun des sept invariants du §3.4 n'est tombé. Site d'appel unique du fold, déterminisme,
`correctCount(initialSelection) === 0` **par arithmétique** (`(truthSlot + 1 + hash % (n-1)) % n`,
donc vrai pour tout seed sans rejection sampling), `validatePortrait` totale, aucun champ de vie,
aucun feedback par trait, aucun acte de validation, aucune constante de gate dans `App.tsx`. La
régression A16 (`data-correct` par bande) est corrigée en `7c4a8947`.

**Le cœur pur tient. Ce qui ne tient pas, c'est le câblage : la scène calcule ses sorties et les
abandonne avant qu'elles n'atteignent le joueur.** Quatre valeurs quittent
`resolvePortraitScene` — score, hold, beat, verdict visuel — et trois n'arrivent nulle part. Ce
n'est pas une somme de bugs indépendants : c'est une couture inter-lanes qui n'a jamais été
refermée, parce que chaque lane a livré son côté et déclaré l'autre côté « pas à moi ».

### 6.1 Tableau de triage

| #       | Finding                                                                                                                               | Prescription                                                                                                                                                                                                                                                                                                                                                                                                            | Lane                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **B1**  | `scoreDelta` calculé, jamais appliqué (AC5, gate §3)                                                                                  | **Arbitrage §6.2.** Ajouter `scoreDelta` à `LevelModifier` ; l'appliquer **dans `App.tsx` à `onDone`, avant le calcul de `pendingScore`**, en déplaçant le calcul de `pendingScore` de `LEVEL_COMPLETE` vers la sortie de `PORTRAIT_ROBOT`. Un test de séquencement obligatoire.                                                                                                                                        | `dev-r3f-render` (shell) + `dev-gameplay` (champ + table), coordonné — **fichier partagé `App.tsx`, sérialiser** |
| **B2**  | Le hold fait démarrer le niveau suivant en vague 2 : `every()` sur `[]` vaut `true`                                                   | Le garde `allDead` doit exiger une vague **effectivement jouée**. Correction prescrite : `allDead = waveHoldRemaining <= 0 && tickedEnemies.length > 0 && tickedEnemies.every(...)`. Le test `portraitLevelModifier.test.ts:103` **scelle le bug** : il est à réécrire (`wave === 1`, ennemis présents), pas à conserver.                                                                                               | `dev-gameplay`                                                                                                   |
| **B3**  | `narrativeBeat` sans consommateur (AC6, gate A1b)                                                                                     | Brancher la sélection de scène `PRE_LEVEL_NARRATIVE` sur `runModifier.narrativeBeat` au prochain `NARRATIVE_PRE`. Le shell choisit **une scène par clé**, il ne branche pas sur le sens du verdict. Test : `FAILED` ⇒ `portrait_robot_failed` joué au niveau suivant.                                                                                                                                                   | `dev-r3f-render` (+ clés côté `dev-gameplay` si absentes)                                                        |
| **B4**  | `validatePortrait` sans appelant ; le saut de phase D3 n'existe pas ; bande à 0 variante = **correcte en permanence**                 | Deux corrections, pas une : (a) appeler `validatePortrait(catalogue, plate)` **à l'entrée de phase** et sauter la phase sur `error` (ADR-0080 D3) ; (b) `resolvePortraitScene` doit traiter une bande sans variante comme **non résolue**, jamais comme juste — la dégradation par défaut doit être défavorable, pas favorable.                                                                                         | (a) `dev-r3f-render` ; (b) `dev-gameplay`                                                                        |
| **M5**  | `Escape` résout en un appui, divergence non actée avec §3                                                                             | **Arbitrage §6.3** : l'argument UX §2.8.4 est bon mais non acté ⇒ **faire amender §3 par `lead-game-designer` dans le même diff**. En attendant l'amendement, corriger l'aggravant : `EarlyExitButton` ne doit pas être le premier élément focusable, et son activation clavier suit le protocole en deux temps.                                                                                                        | `lead-game-designer` (amendement) + `dev-r3f-render` (ordre de focus)                                            |
| **M6**  | Reptation de révélation absente (AC4) : 4,8 s sur un visage faux, sans correction visible                                             | **Ne pas descoper en silence.** Deux issues acceptables : implémenter la reptation, ou descoper AC4 par décision écrite `pm` + `lead-game-designer`. Un joueur qui échoue sans jamais voir la bonne réponse perd la boucle d'apprentissage — c'est le sujet de la scène.                                                                                                                                                | `pm` / `lead-game-designer` (décision) puis `dev-r3f-render`                                                     |
| **M7**  | Timer reveal/hold en `setTimeout` mural, ignore `paused`                                                                              | Une seule horloge par phase. Le hold de révélation doit être un accumulateur `dt` **dans la scène pure** (comme le chrono), pas un `setTimeout` dans le composant. Corrige la pause **par construction** au lieu d'ajouter un garde.                                                                                                                                                                                    | `dev-gameplay` (champ de scène) + `dev-r3f-render` (retrait du `setTimeout`)                                     |
| **M8**  | `RESULT_HOLD_SECONDS = 2.2` redéclaré dans `PortraitRobotPhase.tsx`                                                                   | Supprimer, réutiliser `QTE_RESULT_HOLD` (ou exporter depuis `src/game`). **Violation directe d'ADR-0079 A5** : c'est exactement le nombre de gate dans `src/render` que j'interdis. Disparaît de fait avec M7.                                                                                                                                                                                                          | `dev-r3f-render`                                                                                                 |
| **M9**  | Manifeste de planche à deux formes : script écrit `{bands}`, `validatePortrait` lit `plate.assets` ⇒ `new Set(undefined)` ⇒ **throw** | La forme du **producteur** (`{bands}`) fait foi — c'est elle qui est versionnée et relisible. `validatePortrait` s'y aligne et **dérive** la liste d'assets. La fixture de test doit être **le fichier généré**, pas une fixture à la forme du consommateur (c'est ce qui a caché le bug). J'assume ici la signature élargie `validatePortrait(catalogue, plate?)` : elle reste, et **ADR-0080 D3 doit être rectifié**. | `dev-tooling-assets` (forme + fixture) + `dev-gameplay` (lecture)                                                |
| **M10** | `src` des bandes non préfixé par `BASE_URL` — casse en sous-chemin, donc la preview de branche                                        | Préfixer côté render comme partout ailleurs, et corriger le commentaire du type qui **affirme déjà** que la lane render le fait. Impact déploiement réel : la preview de branche est le support de la revue art/UX.                                                                                                                                                                                                     | `dev-r3f-render`                                                                                                 |

**Mineurs — tranchés en bloc.** À corriger dans le même passage, sans nouvelle boucle de revue :
`SET` absolu calculé sur un état non folded (**à corriger** : ordonnancement, pas cosmétique) ;
wrap sur `VARIANTS_PER_BAND` au lieu du total de la bande (**à corriger** : devient un vrai bug le
jour où une bande n'a pas 6 variantes, c'est-à-dire le jour de la vraie planche) ; handler clavier
sans garde sur les modificateurs (**à corriger** : `Ctrl+A` cycle une variante) ; `courierTimer` /
`timeRemaining` non gelés pendant le wave-hold (**à corriger** : le payoff dépense l'horloge du
niveau, la récompense se paie elle-même) ; `PORTRAIT_SEED` calculé au chargement de module
(**à corriger** : deux runs dans le même onglet = même planche, ça contredit le tirage) ;
bouton de sortie et chevrons non désactivés pendant la pause (**à corriger**) ; verdict
`PARTIAL`/`FAILED` non annoncé aux lecteurs d'écran (**à corriger**, accessibilité) ;
`aria-valuenow` réécrit ~2100 fois et exposant les secondes (**à corriger** : contredit D9, le
chrono est sans chiffre) ; `BAND_IDS` dupliqué de `PORTRAIT_BAND_ORDER` et `data-outcome` mort
(**à supprimer**) ; dépendance non déclarée à `POST_LEVEL_NARRATIVE` (**à déclarer** : la scène
n'est atteignable que si le niveau a une entrée dans une table de copie — c'est un couplage
invisible, il doit être écrit ou levé).

### 6.2 Arbitrage 1 — le séquencement du score (finding B1)

C'est ma décision, pas celle d'une lane, parce qu'elle porte sur l'ordre des phases de l'app-shell.

`pendingScore` est calculé au `LEVEL_COMPLETE`, donc **avant** `NARRATIVE_POST → PORTRAIT_ROBOT`.
Brancher naïvement `scoreDelta` dans `LevelModifier` et l'appliquer « au niveau suivant » produirait
un score de fin de run qui ignore 1500 points gagnés dans la dernière scène jouée — un bug de
high-score, la catégorie de bug la plus coûteuse en confiance joueur.

**Décision : le score du portrait-robot n'est pas un modificateur de niveau suivant, c'est le
règlement de la scène qui vient de se jouer.** Donc :

1. `scoreDelta` est ajouté à `LevelModifier` (le type reste la seule sortie de la scène — je ne
   veux pas de deuxième canal de retour).
2. Il est **appliqué au score du run à la sortie de `PORTRAIT_ROBOT`**, pas au `createInitialState`
   suivant. C'est le seul champ du modifier avec cette sémantique, et cela doit être écrit dans son
   JSDoc, faute de quoi quelqu'un le déplacera « par symétrie » dans six mois.
3. **Le calcul de `pendingScore` descend de `LEVEL_COMPLETE` à la sortie de `PORTRAIT_ROBOT`.**
   C'est le vrai changement, et il est structurel : la qualification au tableau des scores doit se
   décider sur le score final du run, et le portrait-robot fait désormais partie du run.
4. Un test de séquencement est **obligatoire** au merge : « un `IDENTIFIED` qui fait franchir le
   seuil du tableau déclenche `NAME_ENTRY` ». Sans lui, la régression revient au premier refactor.

Note de cohérence à ne pas manquer : `LevelModifier` porte désormais **deux temporalités** — un
champ qui règle le passé (`scoreDelta`) et deux qui préparent le futur (`energyDelta`,
`firstWaveDelaySeconds`). C'est acceptable, ce n'est pas gratuit, et ça se documente.

### 6.3 Arbitrage 2 — la divergence `Escape` (finding M5)

L'argument d'UX §2.8.4 est juste : empiler une précision temporelle et une précision spatiale sur
un joueur clavier ou lecteur d'écran est hostile, et le protocole en deux temps a été conçu pour le
**pouce sur tactile**, pas pour la touche `Échap`. Je ne demande pas à la lane render de dégrader
son accessibilité pour se conformer à la lettre d'un §3 écrit avant que la question ne se pose.

**Mais une divergence non actée est une dette de vérité, pas un choix.** Aujourd'hui, la §3
canonique dit une chose et le code en fait une autre, et rien n'enregistre pourquoi. Le prochain
reviewer relira ce même écart comme un bug, exactement comme quatre reviewers viennent de le faire.

**Décision : le code garde son comportement, et `lead-game-designer` amende §3 dans le même diff**
pour distinguer explicitement le régime tactile (deux temps) du régime clavier (action délibérée =
sa propre confirmation). Pas de merge avec l'amendement « à suivre ».

**L'aggravant, lui, est un vrai défaut et n'est couvert par aucun argument** : `EarlyExitButton`
est le premier élément focusable du DOM. Un joueur clavier qui tabule par réflexe et presse Entrée
termine la scène sans l'avoir jouée. À corriger indépendamment de l'arbitrage ci-dessus.

### 6.4 Revue d'intégration

**Loi de frontière — respectée sur le fond, une brèche à refermer.**
`src/game/` n'importe ni React ni Three (test de contrat sur l'arbre entier, y compris
`Math.random`/`Date.now`) ; `src/render` ne contient aucune règle de résolution ; `src/hooks` est
bien le seul pont, et le fold a un site d'appel unique. **La seule vraie brèche est M8** : une
constante de gate (`2.2`) redéclarée dans `src/render`. Elle est petite, et c'est précisément le
mode de fuite que l'ADR-0079 A5 nomme — un nombre qui traverse, puis deux, puis la table.
M7 est la variante temporelle du même problème : une horloge de règle qui vit dans le composant.
**Les deux se corrigent d'un coup en remontant le hold de révélation dans la scène pure.** C'est ma
prescription préférée du lot, parce qu'elle supprime une classe de bug au lieu d'un bug.

**Coutures inter-lanes — c'est là que la story a échoué.**
Les trois lanes ont livré des surfaces propres et **personne n'a possédé les jointures**. B1, B3 et
B4 ont la même forme : une valeur produite d'un côté, aucun lecteur de l'autre. M9 en est la version
tooling (deux formes de manifeste, invisibles parce que le consommateur n'appelle personne et que le
test fabrique sa propre fixture). C'est ma responsabilité de partition autant que la leur : j'ai
découpé les lanes par répertoire sans nommer un propriétaire pour chaque **valeur qui traverse**.
Correctif de méthode pour la suite : toute valeur franchissant une frontière de lane doit avoir un
test qui l'observe **à l'arrivée**, écrit par la lane réceptrice.

**Dépendances / déploiement.** Zéro dépendance ajoutée (le writer PNG du script est sans
dépendance — bon choix). Un nouveau workflow CI et une cible de manifeste `portrait-robot`.
**M10 est le seul risque de déploiement réel** : sans `BASE_URL`, les 24 bandes cassent en
sous-chemin, donc la preview de branche est aveugle — et la preview de branche est justement le
support des revues art et UX qui restent à faire.

### 6.5 Findings DOC → `tech-writer` (Otis)

- **ADR-0080 D3** — rectifier la signature : `validatePortrait(catalogue, plate?)` (élargissement
  assumé, §3.4) et fixer la forme du manifeste sur celle du producteur (`{bands}`, finding M9).
- **ADR-0079 D4** — documenter le nouveau champ `scoreDelta` et sa temporalité distincte (§6.2),
  ainsi que le déplacement du calcul de `pendingScore`.
- **Gate §3 / ADR-0082** — enregistrer l'amendement `Escape` une fois `lead-game-designer` PASS
  (§6.3). `tech-writer` transcrit, il ne décide pas.
- **JSDoc `PortraitBandAsset`** — le commentaire affirme que la lane render préfixe `BASE_URL`
  alors qu'elle ne le fait pas (M10) : à réaligner **après** la correction, pas à la place.
- **ADR-0080 D5** — la cible de manifeste annonce « 24 chemins + le médaillon » ; le médaillon
  n'existe pas et la cible est composée des quatre bandes vraies. Corriger l'ADR (24, pas 25).
- **Point resté muet, à acter** : le hold de vague est gelé pendant un QTE (retour anticipé des
  branches de gel). Comportement correct — « le beat est hors du temps » — mais non écrit.
  À ajouter à ADR-0079 D4.
- Les trois ADR restent `Proposed` : ils passent `Accepted` **après** merge, pas avant.

### 6.6 Verdict

**NO-MERGE.**

Bloquants, avec leur lane :

| Bloquant                                                                           | Lane propriétaire                                           |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **B1** — le score n'atteint jamais le joueur (+ séquencement `pendingScore`)       | `dev-r3f-render` + `dev-gameplay`, sérialisés sur `App.tsx` |
| **B2** — le payoff s'inverse en vague 2 ; le test qui scelle le bug est à réécrire | `dev-gameplay`                                              |
| **B3** — `narrativeBeat` sans consommateur (AC6, gate A1b)                         | `dev-r3f-render`                                            |
| **B4** — `validatePortrait` sans appelant + dégradation favorable au joueur        | `dev-r3f-render` (appel) + `dev-gameplay` (dégradation)     |
| **M9** — le manifeste jette dans le module qui promet de ne jamais jeter           | `dev-tooling-assets` + `dev-gameplay`                       |
| **M5-aggravant** — sortie anticipée au premier `Tab`+`Entrée`                      | `dev-r3f-render`                                            |
| **M10** — bandes cassées en sous-chemin (preview de branche aveugle)               | `dev-r3f-render`                                            |

M6 est bloquant **en tant que décision** : implémenté ou descopé par écrit, mais pas laissé
implicite. M5 est bloquant **en tant qu'amendement** : le comportement reste, la table s'aligne.

Parallélisation de la reprise — chemins non chevauchants :
`dev-gameplay` (`src/game/systems/`, `src/game/portraits/`), `dev-tooling-assets` (`scripts/`,
`portraitPlate.generated.json`), `dev-r3f-render` (`src/render/ui/portrait/`, `src/hooks/`).
**`App.tsx` est le fichier partagé de B1 et B3 : une seule lane à la fois, render en dernier.**
Un seul nouveau tour de panel à la reprise, pas un par bloquant.

Ce diff n'est pas loin. Il lui manque les quinze mètres de fil entre quatre pièces qui marchent.

---

## 12bis. LANE `dev-gameplay` — CORRECTIFS DU PANEL (stage 6) — Amelia — 2026-08-05 — DONE

- **claim :** `src/game/**` uniquement (systems, portraits, types + leurs tests). Aucun fichier de
  `src/render`, `src/hooks` ou `scripts/` touché — la lane render travaille **en parallèle sur le
  même arbre**, ses fichiers sont restés hors de mes 5 commits.
- **release :** 5 commits atomiques, **suite `src/game` : 53 fichiers / 1132 tests, 100 % verts**
  (chiffre observé, pas déclaré) ; `tsc` propre sur `src/game`, `eslint src/game` propre.

| Correctif            | Ce qui a changé                                                                                                                                                                                                                                                               | Test de non-régression                                                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **B2**               | `allDead` exige `tickedEnemies.length > 0` ; la **libération du hold** devient son propre événement (`holdReleased`) et fait asseoir la vague **1**, pas 2                                                                                                                    | `portraitLevelModifier.test.ts` — le test :103 réécrit (`wave === 1`) + « la vague 1 est une vraie vague et le rollover vers 2 exige qu'elle soit jouée » |
| **B2 (mineur)**      | Les **trois horloges de niveau** (`timeRemaining`, `elapsedSeconds`, `courierTimer`) sont **gelées** pendant le hold — le payoff donne du temps, il ne dépense pas celui du niveau                                                                                            | 2 tests : gel pendant le hold, reprise au tick de libération                                                                                              |
| **B4b**              | Une bande sans variante tire `NO_TRUTH_SLOT = -1` ⇒ **jamais correcte**. Avant : `truth = 0` et `selection = 0` ⇒ correcte en permanence, un catalogue à 3 bandes vides s'auto-résolvait en `IDENTIFIED`                                                                      | 3 tests : jamais créditée sur 200 graines, 3 bandes vides ⇒ au mieux `FAILED`, catalogue entièrement vide ⇒ `FAILED` à l'expiration                       |
| **B1 (moitié pure)** | `scoreDelta` ajouté à `LevelModifier`, alimenté par `levelModifierFromPortrait`. **JSDoc explicite sur les deux temporalités** : ce champ règle la scène écoulée, `energyDelta`/`firstWaveDelaySeconds` arment le niveau suivant                                              | 2 tests d'arrivée côté pur : le barème par verdict, et **`createInitialState` ne le dépense pas** (score du niveau suivant toujours à 0)                  |
| **M7 / M8**          | Le hold de révélation est un **accumulateur de `dt` sur la scène résolue** : une frame en pause ne passe pas de `dt`, la pause est honorée **par construction**. Le reste de la scène résolue reste gelé (l'identité D8.2 est scindée en deux tests)                          | 3 tests : décompte jusqu'à 0 exactement, pause = zéro avance sur 240 frames, valeur par issue lue sur la scène                                            |
| **M9**               | `PortraitPlateManifest` aligné sur **la forme du producteur** (`{gabaritId, plateChecksum, portraitSize, seams, bands}`) ; `plateAssets` **dérive** la liste. Avant : `new Set(plate.assets)` = `new Set(undefined)` ⇒ **throw** dans le module qui promet de ne jamais jeter | La **fixture est le fichier généré lui-même** + « le manifeste généré se lit sans jeter », + un manifeste sans bandes ⇒ issue, jamais throw               |

**Ce que la vraie fixture a immédiatement révélé** (et que la fixture maison cachait) : le
`plateChecksum` du catalogue livré (`PROVISIONAL-NO-PLATE-YET`) **ne correspondait pas** à celui de
`portraitPlate.generated.json` ⇒ `plate-provenance` (error) dès le premier appel réel. Aligné sur la
graine de la planche placeholder, **valeur autorisée, pas dérivée** : la dériver du manifeste rendrait
le contrôle vide de sens.

**Prescriptions impraticables : aucune.** Deux remarques, dites plutôt que déviées en silence :

1. **Le wrap sur `VARIANTS_PER_BAND` n'est pas dans `src/game`** — `applySelection` bornait déjà sur
   la longueur réelle de la bande. Le wrap fautif vit dans `src/hooks/usePortraitGestures.ts`
   (lane render). Le côté pur a fait sa part : `CYCLE.delta` est désormais **un entier quelconque**
   (et non `1 | -1`), donc un drag de N crans est **relatif** et n'a plus ni à lire un état non foldé
   ni à wrapper lui-même — c'est ce qui supprime les deux bugs (`SET` absolu + wrap sur 6) à la source.
2. **M8 disparaît sans constante à réutiliser.** La prescription disait « utiliser `QTE_RESULT_HOLD` » ;
   avec M7 la phase render n'a **plus aucune horloge ni aucun nombre** à déclarer — elle lit
   `scene.revealSeconds` et traite `0` comme « rends la main ». Emprunter la constante d'un autre
   système aurait été un troisième endroit où le nombre existe. `REVEAL_SECONDS_IDENTIFIED` /
   `_UNRESOLVED` (gate A15) restent les seules valeurs, dans `src/game`.

**Coordination** — la valeur qui traverse maintenant a un lecteur à écrire de l'autre côté :

- `dev-r3f-render` : appliquer `modifier.scoreDelta` **à la sortie de `PORTRAIT_ROBOT`** (§6.2), pas au
  `createInitialState` suivant ; supprimer le `setTimeout` et `RESULT_HOLD_SECONDS = 2.2` au profit de
  `scene.revealSeconds` ; appeler `validatePortrait(FACE_CATALOGUE, plate)` à l'entrée de phase (B4a).
- `dev-tooling-assets` : la forme du manifeste est désormais lue telle qu'écrite ; **tout changement de
  `plateChecksum` par une vraie passe de slicing doit être répercuté dans `faceCatalogue.data.ts`**,
  sinon `plate-provenance` passe rouge — c'est voulu.
- `tech-writer` : ADR-0080 D3 (signature + forme du manifeste), ADR-0079 D4 (`scoreDelta` et sa
  temporalité, gel des horloges pendant le hold, hold de révélation dans la scène pure).

- **next :** `dev-r3f-render` (B1 shell, B3, B4a, M5-aggravant, M10), puis un **seul** nouveau tour de
  panel.

---

## 14. LANE `dev-r3f-render` — correctifs du panel (reprise) — Amelia — 2026-08-05 — LIVRÉE

- **claim :** `src/render/ui/portrait/**`, `src/hooks/usePortrait*.ts`,
  `src/render/scene/App.tsx` (+ deux fichiers de tests neufs sous `src/render/scene/__tests__/`).
  Plus, sur demande explicite du coordinateur, la remise au vert de la CI ESLint sur les
  fichiers portrait-robot de `src/game/**`.
- **release :** deux commits — `f3dc6ec9` (lint CI, encaissé par la lane gameplay sur arbre de
  travail partagé, cf. « incident » plus bas) et `d42d34d8` (les correctifs render).

### 14.1 CI ESLint — 32 erreurs, 0 restante

Cause : le merge d'`origin/main` a apporté l'élargissement de couverture ESLint d'ADR-0077.
Deux rendus non mécaniques, plutôt qu'un `--fix` :

- **`non-nullable-type-assertion-style` et `no-non-null-assertion` sont l'un le fix de
  l'autre** (`as number` → `!` → refusé). `--fix` produisait donc 15 erreurs neuves. La
  troisième option est la seule honnête : un helper de test `at(xs, i)` qui **lève** sur un
  index absent. Un index manquant fait échouer le test au lieu d'être effacé par une
  assertion — exactement la famille d'assertions qui a caché deux bloquants de cette story.
- **`no-unnecessary-condition` ligne 324** : la garde `i === undefined` sur `BAND_INDEX`
  (Record TOTAL sur `PortraitBandId`) était **injoignable**. Supprimée, pas silenciée : une
  garde morte se lit comme un cas traité qui ne l'est pas. Les vraies dégradations (bande
  vide, index hors bornes) sont plus bas et restent en place — c'est d'ailleurs là que B4b
  vivait.

`PORTRAIT_BAND_ORDER` est devenu un tuple `as const` : la longueur que le littéral prouve
déjà payait un `!` côté système et une re-déclaration `BAND_IDS` côté render.

### 14.2 Les correctifs

| #           | État                              | Ce qui a été fait                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **B1**      | fait                              | `scoreDelta` dépensé **à la sortie de `PORTRAIT_ROBOT`**, et le calcul de `pendingScore` **descendu de `LEVEL_COMPLETE` à cette sortie** (§6.2). Un `IDENTIFIED` à 1500 points peut qualifier au tableau. **Test de séquencement livré** (`appPortraitSequencing.test.ts`, 5 cas dont « ne règle rien tant qu'un portrait est devant » et « paie exactement une fois »). |
| **B3**      | fait                              | `PRE_LEVEL_NARRATIVE` sélectionne la scène **par clé** depuis `runModifier.narrativeBeat`. Test `FAILED → portrait_robot_failed`, joué **avant** le briefing du niveau, + `IDENTIFIED`, + « aucun beat sur un run sans scène ».                                                                                                                                          |
| **B4a**     | fait                              | `validatePortrait` appelé à l'entrée de phase, **saut de la phase** sur `error`, mémoïsé par session (le sweep 1000 graines ne tourne qu'une fois). Test dédié en fichier séparé (`appPortraitSkip.test.ts`) — l'observation est négative, elle ne survit pas à une mémo partagée.                                                                                       |
| **M6**      | **implémenté** (Bertrand : GARDE) | `RESOLVING` déroule les 4 verdicts de haut en bas, **corrige visiblement chaque bande** (la bande bascule sur sa variante vraie + filet de recalage), puis tient le visage complet 0,8 s. `prefers-reduced-motion` coupe la **séquence**, jamais le contenu.                                                                                                             |
| **M7 / M8** | fait                              | `setTimeout` mural **supprimé**. La révélation est accumulée par le **même rAF que le chrono** ⇒ la pause la gèle par construction, le modifier ne peut plus être commis derrière `RotateOverlay`. `RESULT_HOLD_SECONDS = 2.2` **supprimé** (pas réutilisé : la queue de 0,8 s vit dans `src/game`).                                                                     |
| **M5-agg.** | fait                              | `EarlyExitButton` passe **en fin de DOM**, placé au coin par CSS. Un `Tab` + `Entrée` ne termine plus la scène. Aucun `tabindex` positif — l'ordre du DOM **est** le correctif.                                                                                                                                                                                          |
| **M10**     | fait                              | `BASE_URL` sur les 24 bandes **et** sur la cible. Test qui l'observe.                                                                                                                                                                                                                                                                                                    |

**Mineurs du même passage, tous traités :** `SET` absolu → **`CYCLE(delta)` relatif** (le drag
ne peut plus être calculé sur un état non folded, et le wrap se fait sur la vraie longueur de
la bande — deux mineurs d'un coup, `VARIANTS_PER_BAND` inclus) · chevrons et sortie désactivés
pendant la pause · `aria-valuenow` porte le **palier** (4 valeurs) et non les secondes ·
verdict `PARTIAL`/`FAILED` annoncé aux lecteurs d'écran · `PORTRAIT_SEED` tiré **à l'entrée en
phase** · garde sur les modificateurs clavier · `BAND_IDS` et `data-outcome` supprimés.

**Dépendance à `POST_LEVEL_NARRATIVE` : LEVÉE, pas documentée.** La scène est désormais
atteignable même sans entrée dans la table de copie (`portraitReachable` ne la teste plus, et
un beat dû route vers `NARRATIVE_PRE` même sur un niveau sans briefing). Elle était
silencieusement désactivée sur `niveau-final` et sur tous les niveaux générés.

### 14.3 Ce que j'ai touché hors de ma voie, et pourquoi

Trois éditions dans `src/game`, toutes minimales et toutes motivées par l'interdit
« pas de nombre de gate dans `src/render` » :

1. `PortraitIntent.CYCLE.delta` : `1 | -1` → `number`. C'est la **cause racine** du mineur
   « `SET` absolu sur un état non folded » : un geste relatif exprimé en absolu doit lire un
   état, et l'état qu'il lit n'est pas celui du fold. Le vocabulaire ne bouge pas (aucun
   membre neuf, aucun littéral de geste).
2. `REVEAL_HOLD_TAIL_SECONDS = 0.8` + `revealBandStepSeconds()` : la timeline d'AC4 dérivée
   des deux `revealSeconds` existants, écrite **une fois**, dans `src/game`.
3. La garde d'intégrité sur `delta` non entier.

**Incident de coordination à journaliser :** arbre de travail partagé avec `dev-gameplay`. Mon
index de correctifs lint a été emporté par leur commit `f3dc6ec9` (message B4b), et mes deux
ajouts ci-dessus par `83abd537`. Rien n'est perdu et tout est vert, mais **la règle
« committer par chemins explicites » ne suffit pas quand deux lanes partagent le même
`git index`** — il faut sérialiser les `git add`/`commit`, ou des worktrees séparés.

### 14.4 Vérification — le chiffre réel

- `yarn typecheck` : **propre**.
- `yarn lint` : **0 erreur, 0 warning** (les 32 de la CI incluses).
- `yarn test` : **147 fichiers / 2041 tests, 0 échec** (`Duration 50.95s`).
  Note : le premier passage donnait 2 fichiers rouges (`scripts/__tests__/mcpServer`,
  `mcpEntryPoint`) — `@modelcontextprotocol/sdk` déclaré dans `package.json` par le merge de
  `main` mais **absent de `node_modules`**. `yarn install` les remet au vert ; ce n'est pas du
  code, c'est un `node_modules` périmé. **Un runner CI froid n'aurait pas eu le problème.**
- `yarn build` : **OK** (8,09 s).

### 14.5 Impraticable / non fait

- **Captures `verify` non produites.** Les 24 PNG sont toujours des placeholders : une capture
  de la révélation prouverait le séquencement mais pas la correction _au trait_, qui est ce
  qui donne son sens à M6. À refaire dès la vraie planche (elle couvre aussi G7a/G7b/G7c).
- **M5, l'amendement de la table §3** (`Échap` en un appui) n'est pas de ma voie : le
  comportement est inchangé côté code, `lead-game-designer` doit amender §3 dans le même diff,
  faute de quoi le prochain reviewer relira le même écart comme un bug.
- **Durée totale de la scène résolue : 2,6 s** au lieu de 4,8 s (2,6 + 2,2). La queue de 0,8 s
  d'AC4 est **dans** `revealSeconds`, elle ne s'y ajoute plus. C'est un changement de rythme
  perceptible — à valider au playtest par `game-designer`.
- **`data-corrected` sur une bande** existe désormais dans le DOM, uniquement sur une scène
  `RESOLVED`. Gate A16 est intacte (rien à lire pendant que ça compte), mais c'est un attribut
  par bande : je le signale plutôt que de le laisser découvrir au panel.

- **next :** `lead-game-designer` (amendement §3 `Échap`) · `tech-writer` (ADR-0079 D4 :
  `scoreDelta`, la queue de révélation, la dépendance `POST_LEVEL_NARRATIVE` levée ; ADR-0082 D1 :
  `CYCLE.delta` relatif) · `game-designer` (rythme de la scène résolue) · puis **un seul** nouveau
  tour de panel.
