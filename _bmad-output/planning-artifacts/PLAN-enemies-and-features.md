# Plan — Expansion du roster d'ennemis & nouvelles features

**Date :** 2026-06-21
**Statut :** proposé (à valider)
**Branche de travail :** `claude/grid-system-architecture-agnz64` → cible `main`
**Périmètre :** nettoyage doc, ennemi *voiture* (drive-by), ennemi *preneur d'otage*, rollout par niveau.

> Ce plan est piloté par les guidelines non-négociables (`_bmad-output/guidelines/PROJECT_GUIDELINES.md`) et par le bestiaire (`_bmad-output/guidelines/enemy-bestiary.md`). Le code n'est que l'implémentation de ces intentions. Toute valeur de tuning ajoutée à `src/game/types/enemyTypes.ts` doit tracer vers une ligne du bestiaire.

---

## 1. Objectifs

1. **Assainir la documentation** avant d'empiler de la feature dessus : les tableaux markdown de `docs/` et des guidelines sont cassés (retours à la ligne parasites après chaque virgule), et plusieurs faits sont contradictoires (générateur d'assets « Gemini » vs « Pollinations.ai », `ENEMIES_TO_WIN = 10` en dur vs `enemiesToWin` par niveau).
2. **Ajouter une voiture ennemie** qui traverse la rue, avec conducteur + tireur, le poste de tir dépendant du sens de passage.
3. **Ajouter un preneur d'otage** (deux placements : pop-up de fenêtre *et* entité de rue) avec une mécanique de tir de précision et de pénalité.
4. **Déployer prudemment** : chaque feature est d'abord intégrée et validée sur `belliard`, puis étendue à `stalingrad` et `vitry`.

---

## 2. Principes de conduite (rappel guidelines)

- **TDD d'abord** — tout système dans `src/game/` a son test Vitest écrit avant l'implémentation. Aucun merge sans tests verts.
- **Séparation logique / rendu** — `src/game/` n'importe ni React ni R3F. La voiture et l'otage sont des données + fonctions pures ; `src/render/` ne fait que les afficher.
- **YAGNI / KISS** — pas d'abstraction « moteur de véhicules » générique. On modèle la voiture sur le précédent concret le plus proche (le `Courier`).
- **DRY** — réutiliser : `Courier`/`courierSystem` pour le mouvement de rue, `ARCHETYPES` pour le tuning, `enemyTextures`/`cutout-enemies.mjs` pour le pipeline sprite, `PointHitEvent` pour les feedbacks de score.
- **Test du Cahier des Charges** — « Prohibition Atari ST avait-il ça ? ». La voiture drive-by et la prise d'otage sont des **extensions conscientes** : assumées et documentées ici.
- **Mort jamais "bullshit"** — règles de tir visibles et cohérentes (qui tire, quand l'otage meurt) ; chaque pénalité affichée via le HUD/feedback.

---

## 3. Architecture — points d'ancrage existants

| Besoin | Précédent à réutiliser | Fichier |
| --- | --- | --- |
| Entité de rue mobile et directionnelle | `Courier` (`x/y/dir/speed`) + `tickCouriers` | `src/game/types/courier.ts`, `src/game/systems/courierSystem.ts` |
| Tuning d'archétype par données | `ARCHETYPES` (`Record<EnemyKind, Archetype>`) | `src/game/types/enemyTypes.ts`, `src/game/types/enemy.ts` |
| Pop-up de fenêtre + machine à états | `enemySystem`, états `HIDDEN→…→DEAD` | `src/game/systems/enemySystem.ts` |
| Détection de tir | `checkBulletHits`, `checkCourierHits` | `src/game/systems/bulletSystem.ts`, `courierSystem.ts` |
| Effets de score/vie flottants | `PointHitEvent` | `src/game/types/feedback.ts` |
| Pipeline sprite (fond noir → détourage) | `gen-enemy-types.mjs` → `cutout-enemies.mjs` ; cache lazy `enemyTextures.ts` | `scripts/`, `src/render/scene/` |
| Réglage par niveau | `LevelConfig` (vitesse, cible, temps) | `src/game/levels/levels.ts` |

**Écart connu à combler :** `LevelConfig` ne pilote pas aujourd'hui la *composition* d'ennemis (quels archétypes, quels poids). Le rollout Belliard-first impose d'ajouter cette capacité (story dédiée), sinon tout nouvel ennemi apparaîtrait d'emblée sur tous les niveaux — ce qui violerait la consigne de validation progressive.

---

## 4. Décisions ouvertes (à trancher avant dev)

1. **« Énergie » vs « vies ».** L'otage fait « perdre un peu d'énergie », ce qu'un compteur de vies discret (3) ne peut pas exprimer. Le scope (§8 guidelines) prévoit une *barre de vie*. → Proposition : introduire un stat `energy` (0–100) dont l'otage est le premier consommateur, les `lives` restant pour les pertes nettes. **À confirmer.**
2. **Règle de poste de tir de la voiture** (rear vs front-passenger selon `dir`). Proposition détaillée dans le bestiaire §Voiture ; à valider visuellement.
3. **L'otage dans la rue** partage-t-il le même `energy`/scoring que la version fenêtre ? Proposition : oui, même archétype, deux modes de spawn (DRY).
4. **Génération d'asset voiture** : script dédié `scripts/gen-vehicle-enemies.mjs` (la voiture est composite : caisse + 2 occupants + côté variable), aligné sur le style de `gen-enemy-types.mjs`. **Confirmé par défaut** (DRY sur le style, pas sur la composition).

---

## 5. Phasage

### Phase 0 — Documentation (prérequis)
Assainir et restructurer `docs/` + guidelines, créer le bestiaire. Aucune logique de jeu. → *Story 1.1*.

### Phase 1 — Voiture sur Belliard
Asset → type/archetype → système de rue → rendu → détection de tir → intégration `belliard` uniquement. Validé en navigateur + tests. → *Stories 1.2, 1.3*.

### Phase 2 — Preneur d'otage sur Belliard
Stat `energy` (si validé) → archétype otage → version fenêtre → version rue → double hitbox (otage/ravisseur) → exécution sur timeout. Belliard uniquement. → *Stories 1.4, 1.5*.

### Phase 3 — Composition par niveau & extension
Étendre `LevelConfig` à la composition d'ennemis ; activer voiture + otage sur `stalingrad` puis `vitry` une fois Belliard validé. → *Story 1.6*.

### Cadence inter-phases
Synchronisation avec `main` ~toutes les heures : `git fetch origin` → si `origin/main` a avancé et arbre propre → `git rebase origin/main` (jamais de push auto ; en cas de conflit, on s'arrête et on signale). Une tâche planifiée (`prohimuf-main-drift-check`) effectue ce contrôle de dérive chaque heure et signale aussi les autres branches/worktrees en retard.

---

## 6. Definition of Done (par story)

- [ ] Tests Vitest écrits **avant**, et verts (`yarn test --run`).
- [ ] `tsc --noEmit` sans erreur ; ESLint sans warning ; Prettier appliqué.
- [ ] `src/game/` sans import React/R3F.
- [ ] Toute valeur de tuning tracée vers `enemy-bestiary.md`.
- [ ] Feature testée en navigateur sur `belliard`.
- [ ] Chaque pénalité/récompense affichée (HUD/feedback), règle de tir lisible.
- [ ] Branche rebasée sur `main`, commits conventionnels (`feat:`, `test:`, `docs:`…).

---

## 7. Risques

| Risque | Mitigation |
| --- | --- |
| Le stat `energy` touche HUD, game-over, difficulté → portée plus large que prévu | L'isoler dans une story socle ; fallback : mapper sur `lives` si `energy` non validé |
| Le détourage fond-noir échoue sur une caisse de voiture détaillée | Prompt « pure flat black background » strict + revue visuelle ; fallback sprite cop existant déjà géré par `enemyTextures` |
| Composition par niveau = refacto de `levels.ts` consommé partout | Story dédiée, additive (champ optionnel, défaut = comportement actuel) |
| Dérive de `main` entre agents parallèles | Routine de rebase horaire + tâche planifiée de détection |

---

## 8. Livrables de ce plan

- Ce document (séquencement).
- `_bmad-output/guidelines/enemy-bestiary.md` — spec d'intention du roster (existant + voiture + otage).
- `_bmad-output/planning-artifacts/EPIC-001-enemy-roster-expansion.md` — épic + stories prêtes-pour-dev.
