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

**Canonical input:** `docs/game-design/design-gate-portrait-robot.md` **§3 + A4-bis**. Every
tuning value below comes from there; where `spec-portrait-robot.md` disagrees, §3 wins.

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
- **ADR-0080** — `docs/adr/0080-portrait-robot-face-data-model.md`.
  Catalogue in **`src/game/portraits/`** (mirrors `src/game/levels/`, ADR-0074 shape): 4 bands ×
  6 variants × 1 gabarit, plus a **pairwise distance matrix** (15 entries/band) that makes the
  gate's decoy composition (2 strong + 3 medium + 0 fine) *executable*. `validatePortrait`
  is the single source of invariants (never throws; an invalid catalogue **skips the phase**,
  never bricks the run). Assets: **24 sliced PNGs**, one plate, **atomic** — a single writer
  script with no per-band mode + `plateChecksum` + a consistency test. Preloaded through a new
  `"portrait-robot"` manifest target during `NARRATIVE_POST`.
- **ADR-0081** — `docs/adr/0081-portrait-robot-input-and-presentation-layer.md`
  (**renamed** from `…-atari-st-render.md`; the ST framing is void per AC7 — index regenerated).
  The pure layer speaks **intents** (`CYCLE / SET / FOCUS / SUBMIT / ABANDON`), never gestures:
  the desktop mapping is one row in `usePortraitGestures`, and `src/game` does not change when
  the Figma lands. Swipe *classification* is pure (`swipeGestureSystem.ts`, angle/distance
  constants — the numbers `ux-designer` round 2 tunes), swipe *binding* is a hook. V1 =
  discrete swipe (1 swipe = 1 cran). CSS Modules + `print/tokens.ts` (ADR-0046), runtime values
  as inline CSS custom properties. `RotateOverlay` pause = the hook stops ticking.

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

### 3.3 Order and seams

1. **Step 0 — serialised, blocking (≤1 h, `dev-gameplay`).** Land the two contract files —
   `types/portraitRobot.ts` and `types/levelModifier.ts` — plus the asset **path convention**
   (`assets/portrait/<band>-<nn>.png`) agreed with `dev-tooling-assets`. Nothing else starts
   before these exist; everyone else imports them read-only. This is ADR-0076 C7's pattern.
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
   the swipe on a real touch device; the wave-hold's effect on quota difficulty (ADR-0079 D4)
   is a named tuning check.

### 3.4 Boundary risks I am watching at stage 6

- **The −20 energy or the +20 s computed in `App.tsx`.** The single most likely breach (it looks
  like "just a switch"). Rejected in advance: ADR-0079 A5.
- **A life lost anywhere.** Structurally impossible — `LevelModifier` has no field for it. Any
  diff that adds one is a gate failure, not a tuning call (gate A1, story AC5).
- **A drift back to dithered/photo faces** (story Risk 4, AC7).
- **A gesture literal inside `src/game`.** ADR-0081 D1 — if `SWIPE` appears in the intent union,
  the abstraction has failed and the desktop Figma will cost a game-layer change.
- **A hand-patched single band** breaking the seam rule — caught by `plateChecksum`, not by eyes.

### 3.5 Descended to other lanes (non-blocking)

- **`lead-art`:** his §4 and §7.3 Q5 assume CRT + the world's glow law. The scene is an
  **interactive DOM surface**: no CRT (structurally outside `CrtPass`), selection liseré as a
  CSS falloff on the focused band, xerox grain as **one post-composition layer**. His §7.3 Q1/Q3
  are answered: **24 PNGs**, sliced from one plate, **atomicity granted and mechanised**.
  His §4's "chrono qui coûte une vie" is false since A1 and must be corrected.
- **`game-graphist`:** the comparison plate (§7.2) is now a **hard dependency** — it is the
  source of the 60 distance values.
- **`ux-designer`:** round 2 (angle threshold, trigger distance, discrete vs inertial, band
  height) lands as constants, on no critical path (ADR-0081 D3).
- **`game-designer`:** the wave hold reduces pressure *and* kill time on a quota level — a real
  tuning consequence to re-check at playtest.

---

## 4. BUILD LANES — *awaiting dev start (plan in §3.2/§3.3)*

- **dev-gameplay (Amelia):** pure scene state machine + catalogue + `validatePortrait` + the
  three additive seams in the tick. TDD.
- **dev-r3f-render (Amelia):** `PORTRAIT_ROBOT` DOM screen (CSS Modules + tokens), the two
  bridge hooks, `App.tsx` phase + `pendingModifier` wiring.
- **dev-tooling-assets (Victor):** plate → registration → slicing script (atomic, checksummed),
  placeholders day 1, FLUX prompt family, generated seam JSON.

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
