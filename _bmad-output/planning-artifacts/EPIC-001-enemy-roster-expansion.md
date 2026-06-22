# Epic 1 — Expansion du roster d'ennemis & features associées

Status: ready-for-dev

**Source :** `_bmad-output/planning-artifacts/PLAN-enemies-and-features.md`
**Spec de tuning :** `_bmad-output/guidelines/enemy-bestiary.md`
**Contraintes :** `_bmad-output/guidelines/PROJECT_GUIDELINES.md` (TDD, YAGNI, DRY, séparation logique/rendu, Test du Cahier des Charges).

## Objectif de l'épic

Ajouter deux ennemis (voiture drive-by, preneur d'otage) et l'infrastructure minimale pour les déployer niveau par niveau, en commençant par `belliard`, sans régression sur le roster existant.

## Stories & dépendances

```
1.1 Doc cleanup ─┐
                 ├─> 1.2 Asset voiture ─> 1.3 Système voiture (Belliard) ─┐
                 │                                                        ├─> 1.6 Composition par niveau + rollout
                 └─> 1.4 Énergie + otage fenêtre ─> 1.5 Otage rue ────────┘
```

- **1.1** est prérequis (doc propre avant d'empiler).
- **1.2 → 1.3** : l'asset avant le rendu.
- **1.4 → 1.5** : le stat `energy` et la double-hitbox d'abord en fenêtre, réutilisés en rue.
- **1.6** clôt l'épic : extension à `stalingrad`/`vitry` une fois Belliard validé.

---

# Story 1.1 : Assainir et restructurer la documentation

Status: ready-for-dev

## Story

As a mainteneur AIDD du projet,
I want une documentation aux tableaux markdown valides et aux faits cohérents,
so that les agents (et moi) partent d'une source de vérité fiable avant d'ajouter des features.

## Acceptance Criteria

1. Tous les tableaux markdown de `docs/` et `_bmad-output/guidelines/PROJECT_GUIDELINES.md` se rendent correctement (plus de retours à la ligne parasites après les virgules).
2. Les contradictions factuelles sont résolues ou explicitement annotées : générateur d'assets (« Gemini » dans les guidelines §3 vs « Pollinations.ai » dans `docs`/scripts → trancher sur Pollinations.ai, qui est ce que le code utilise), et `ENEMIES_TO_WIN = 10` en dur vs `enemiesToWin` par niveau (documenter lequel fait foi).
3. `docs/index.md` liste les nouveaux artefacts (`enemy-bestiary.md`, plan, cet épic).
4. Aucune modification de code de jeu ; uniquement de la doc.

## Tasks / Subtasks

- [ ] Réparer le formatage des tableaux (AC #1)
  - [ ] `docs/index.md`, `docs/game-systems.md`, `docs/roadmap.md`, `PROJECT_GUIDELINES.md`
- [ ] Réconcilier les faits contradictoires (AC #2)
  - [ ] Aligner la mention du générateur d'assets sur Pollinations.ai
  - [ ] Noter la source de vérité de la condition de victoire (par-niveau `enemiesToWin`)
- [ ] Mettre à jour l'index de doc (AC #3)

## Dev Notes

- Les tableaux ont été cassés par un reformateur insérant un `\n` après chaque virgule. Reconstituer les lignes.
- Ne pas réécrire le fond, juste la forme et les incohérences signalées (YAGNI).

### References
- `docs/`, `_bmad-output/guidelines/PROJECT_GUIDELINES.md`

---

# Story 1.2 : Script de génération d'asset « voiture ennemie »

Status: ready-for-dev

## Story

As a pipeline d'assets,
I want un script qui génère les sprites de voiture (conduite + tir, par sens de passage),
so that le rendu dispose des PNG détourés sans intervention manuelle.

## Acceptance Criteria

1. Nouveau `scripts/gen-vehicle-enemies.mjs`, aligné sur le style et le mécanisme de `gen-enemy-types.mjs` (Pollinations.ai FLUX, fond noir pur, idempotent, `FORCE=1` pour régénérer).
2. Génère au minimum : `enemy_car` (conduite) et `enemy_car_shooting` (flash côté tireur), sur fond noir pur pour détourage par `cutout-enemies.mjs`.
3. Les variantes couvrent les deux postes de tir décrits dans le bestiaire §2.3 (tireur arrière / tireur passager) ; le mirroring par `dir` est géré au rendu (story 1.3), pas dupliqué en assets.
4. Documenté dans `scripts/SCRIPTS.md`.
5. Re-run sans `FORCE` ne régénère rien d'existant.

## Tasks / Subtasks

- [ ] Copier la structure de `gen-enemy-types.mjs` (fetch, retry, skip-if-exists) (AC #1, #5)
- [ ] Définir les prompts voiture, fond noir pur, sans civil à bord (AC #2, #3)
- [ ] Vérifier le détourage via `cutout-enemies.mjs` (AC #2)
- [ ] Documenter dans `SCRIPTS.md` (AC #4)

## Dev Notes

- Précédent : `scripts/gen-enemy-types.mjs` (PIXEL_STYLE, `OUT_DIR=public/assets`, fond noir, retries Pollinations).
- Génération normalement en CI, pas dans le sandbox local (cf. CLAUDE.md).
- `enemyTextures.ts` déduit les chemins depuis `spriteBase` et retombe sur le sprite flic si le fichier manque : aucune image ⇒ pas d'invisible.

### References
- `scripts/gen-enemy-types.mjs`, `scripts/cutout-enemies.mjs`, `src/render/scene/enemyTextures.ts`

---

# Story 1.3 : Ennemi voiture (drive-by) — logique, rendu, intégration Belliard

Status: ready-for-dev

## Story

As a joueur,
I want une voiture qui traverse la rue avec un tireur dont le poste dépend du sens,
so that j'aie une cible mobile pressante et lisible.

## Acceptance Criteria

1. Type `Car` pur (`src/game/types/`) modelé sur `Courier` : `id`, `x`, `y`, `dir: 1 | -1`, `speed`, état de tir.
2. Système pur `carSystem.ts` : spawn depuis un bord selon `dir`, `tickCars` (avance + cull hors champ), cadence de tir, neutralisation. **Tests Vitest écrits d'abord.**
3. Toujours exactement 2 occupants (conducteur + tireur) ; le conducteur ne tire jamais ; le poste de tir (arrière vs passager) est déterminé par `dir` selon le bestiaire §2.3.
4. Détection de tir : `hp = 2`, kill = `+3` score, comptée comme cible (`countsAsTarget`).
5. Le tir ennemi de la voiture peut toucher le joueur (réutilise la pénalité joueur existante).
6. Rendu `CarSprite.tsx` : sprite mirroré selon `dir`, muzzle flash du bon côté ; aucune règle de jeu dans le rendu.
7. Active **uniquement sur `belliard`** (via story 1.6 ou flag temporaire), validée en navigateur.

## Tasks / Subtasks

- [ ] Écrire les tests de `carSystem` (spawn par dir, tick/cull, choix du poste de tir, neutralisation) (AC #2, #3)
- [ ] Implémenter `Car` + `carSystem` purs (AC #1–#4)
- [ ] Brancher le tir voiture → joueur dans le tick principal (AC #5)
- [ ] `CarSprite.tsx` + cache texture, mirroring par `dir` (AC #6)
- [ ] Câbler dans `GameScene`/hooks, activer sur Belliard (AC #7)
- [ ] Ajouter `car` à `EnemyKind` + entrée `ARCHETYPES` (tracée bestiaire) (AC #4)

## Dev Notes

- Précédent fort : `courierSystem.ts` (spawn directionnel, `tickCouriers`, `MARGIN`, cull) et `CourierSprite`.
- Spawn via timer de rue dédié (cf. `courierSpawnInterval`), **pas** via `pickKind`.
- `src/game/` sans import React/Three. Pont uniquement dans `src/hooks/`.

### References
- `src/game/systems/courierSystem.ts`, `src/game/types/courier.ts`, `src/render/scene/CourierSprite.tsx`, `src/game/types/enemyTypes.ts`

---

# Story 1.4 : Stat « énergie » + preneur d'otage (version fenêtre)

Status: ready-for-dev

## Story

As a joueur,
I want pouvoir libérer un otage par un tir précis (gros bonus) en évitant de le toucher,
so that j'aie une cible à enjeu où la précision et le tempo comptent.

## Acceptance Criteria

1. Décision « énergie » tranchée : si validée, ajout d'un stat `energy` (0–100) au `GameState`, affiché au HUD ; sinon fallback documenté sur `lives`. **Bloquée tant que non confirmée (décision ouverte du plan).**
2. `hostage_taker` ajouté à `EnemyKind` + `ARCHETYPES` (tuning tracé bestiaire §3.4).
3. Double hitbox : toucher le **ravisseur** → `+5` score, otage libéré ; toucher l'**otage** → `−3` score + perte d'énergie marquée.
4. Timeout : à l'expiration du délai, état `EXECUTES`, l'otage meurt → `−1` score + petite perte d'énergie.
5. Chaque issue émet un `PointHitEvent` (score + énergie) ; règle visuellement lisible (otage distinct, au premier plan, compte à rebours perceptible).
6. Tests Vitest écrits d'abord couvrant les 3 issues (kill propre / otage touché / timeout).
7. Actif sur `belliard` uniquement.

## Tasks / Subtasks

- [ ] (Si validé) introduire `energy` dans `GameState` + HUD + clamps (AC #1)
- [ ] Écrire les tests des 3 issues (AC #6)
- [ ] Étendre la machine d'états enemy pour l'état `EXECUTES` (AC #4)
- [ ] Implémenter la double-hitbox dans la détection de tir (AC #3)
- [ ] Feedbacks `PointHitEvent` + rendu otage/ravisseur distinct (AC #5)
- [ ] `EnemyKind` + `ARCHETYPES` (AC #2)

## Dev Notes

- Réutiliser la mécanique de fenêtre/`enemySystem` (états, slots) ; ajouter `EXECUTES` plutôt qu'un nouveau système.
- `energy` touche HUD, game-over, peut-être difficulté → garder le changement isolé et additif.
- Feedbacks : `src/game/types/feedback.ts` (`PointHitEvent`).

### References
- `src/game/systems/enemySystem.ts`, `src/game/systems/bulletSystem.ts`, `src/game/types/gameState.ts`, `src/game/types/feedback.ts`

---

# Story 1.5 : Preneur d'otage (version rue)

Status: ready-for-dev

## Story

As a joueur,
I want que le preneur d'otage puisse aussi traverser la rue,
so that la menace existe en mobile, pas seulement en fenêtre.

## Acceptance Criteria

1. Mode de spawn « rue » pour `hostage_taker`, réutilisant l'entité mobile directionnelle (modèle voiture/courier) et le **même** scoring/énergie que la version fenêtre (DRY).
2. Double hitbox conservée en mouvement (ravisseur exposé vs otage au premier plan).
3. Timeout = délai fixe pendant la traversée (bestiaire §3.3) → exécution de l'otage, mêmes pénalités.
4. Tests Vitest écrits d'abord (issues en contexte mobile).
5. Actif sur `belliard` uniquement.

## Tasks / Subtasks

- [ ] Tests : kill propre / otage touché / timeout en mode rue (AC #4)
- [ ] Réutiliser le socle d'entité de rue + la logique de scoring de 1.4 (AC #1, #3)
- [ ] Adapter la double-hitbox au déplacement (AC #2)
- [ ] Rendu mobile (mirroring par `dir`, otage devant le ravisseur) (AC #2)

## Dev Notes

- S'appuie sur 1.3 (entité de rue) et 1.4 (scoring/énergie + double-hitbox). Ne pas dupliquer la logique de score.

### References
- Stories 1.3 et 1.4 ; `src/game/systems/courierSystem.ts`

---

# Story 1.6 : Composition d'ennemis par niveau + rollout

Status: ready-for-dev

## Story

As a game designer,
I want décrire par niveau quels ennemis sont actifs,
so that je puisse valider chaque feature sur Belliard avant de l'étendre aux autres stages.

## Acceptance Criteria

1. `LevelConfig` gagne un champ **optionnel** `roster` (poids fenêtre + entités de rue actives) ; champ absent = comportement actuel (aucune régression).
2. `belliard` active `car` puis `hostage_taker` (fenêtre + rue) une fois 1.3/1.4/1.5 validées.
3. `stalingrad` et `vitry` n'activent ces ennemis qu'après validation sur Belliard.
4. Le spawn (fenêtre via `pickKind`, rue via timers) lit la composition du niveau courant.
5. Tests Vitest : un niveau sans `roster` se comporte comme aujourd'hui ; un niveau avec `roster` n'active que les ennemis listés.

## Tasks / Subtasks

- [ ] Étendre `LevelConfig` (champ optionnel) + tests de non-régression (AC #1, #5)
- [ ] Faire lire la composition par les spawns fenêtre/rue (AC #4)
- [ ] Configurer Belliard, puis Stalingrad/Vitry (AC #2, #3)

## Dev Notes

- Aujourd'hui `LevelConfig` ne pilote que vitesse/cible/temps ; l'ajout doit être additif et rétrocompatible.
- C'est l'enabler du rollout Belliard-first demandé.

### References
- `src/game/levels/levels.ts`, `src/game/types/enemyTypes.ts` (`pickKind`/`WEIGHTED`), `src/game/systems/courierSystem.ts`
