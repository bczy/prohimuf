# Bestiaire — spec de tuning des ennemis

**Date :** 2026-06-21
**Statut :** spec d'intention (source de vérité amont)
**Implémenté par :** `src/game/types/enemy.ts` (`EnemyKind`) + `src/game/types/enemyTypes.ts` (`ARCHETYPES`).

> Ce document décrit le **pourquoi** et fixe les **bornes** ; le code décrit le **quoi**. Règle de traçabilité : chaque champ de `ARCHETYPES` doit se justifier par une ligne d'ici. Toute modif de valeur passe d'abord par ce fichier, puis par une story, puis par le code + tests (TDD).

---

## 1. Roster existant (référence)

Valeurs actuelles de `ARCHETYPES`, avec le *rationale* à compléter/valider par l'équipe design (colonne « Intention »).

| Kind | hp | caché/visible (s) | tire ? | score | vies | temps | cible ? | poids | Intention |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `normal` (flic) | 1 | 1.5 / 3.2 | oui | +1 | 0 | 0 | oui | 52 | Cible de base, majorité du spawn, rythme « pop & shoot ». |
| `riot` (CRS) | 2 | 1.7 / 3.6 | oui | +2 | 0 | 0 | oui | 15 | Tank : 2 tirs, récompense double ; casse le rythme. |
| `biker` (moto) | 1 | 1.2 / 2.0 | oui | +1 | 0 | 0 | oui | 15 | Rapide et bref : test de réflexe. |
| `bonus` | 1 | 2.2 / 2.0 | non | +1 | 0 | +5 | non | 11 | Récompense en temps, rare, ne compte pas pour la victoire. |
| `civilian` (livreur) | 1 | 1.6 / 2.6 | non | −1 | −1 | 0 | non | 0 | À ne PAS tirer. Poids 0 : ne pop plus en fenêtre, il roule en rue via `courierSystem` et réutilise ces effets de pénalité. |

**Bornes générales :**
- `weight = 0` ⇒ retiré du tirage aléatoire des fenêtres (cas du livreur).
- `countsAsTarget` pilote la condition de victoire (`enemiesToWin`).
- Effets négatifs (`scoreDelta`/`livesDelta` < 0) ⇒ réservés aux cibles interdites (civils, otage).

---

## 2. Nouveau — Voiture ennemie (drive-by)

### 2.1 Nature
Entité de **rue mobile et directionnelle**, modelée sur le `Courier` (`x`, `y`, `dir: 1 | -1`, `speed`), **pas** un pop-up de fenêtre. Elle entre par un bord de la rue et sort par l'autre. Pendant la traversée, un occupant tire vers le joueur.

### 2.2 Règle des occupants (non-négociable)
- **Toujours exactement deux occupants** : un **conducteur** + un **tireur**.
- Le **conducteur conduit** : il ne tire jamais.
- Le tireur occupe soit le **siège passager avant** (à côté du conducteur), soit la **banquette arrière** — **jamais les deux** (un seul tireur).

### 2.3 Choix du poste de tir selon le sens de passage
Le conducteur occupe toujours le siège **en tête** dans le sens de la marche (il regarde devant). Pour que (a) le tir vise le joueur, (b) la ligne de feu ne soit pas masquée par le conducteur, le tireur occupe le **siège en retrait** (côté arrière de la marche), et tire vers l'arrière-bas.

| `dir` | Sens | Siège conducteur (tête) | Siège tireur (en retrait) | Le tireur vise vers |
| --- | --- | --- | --- | --- |
| `+1` | vers la droite → | avant-droit | arrière (banquette) **ou** passager-gauche selon modèle | bas-gauche (arrière) |
| `-1` | vers la gauche ← | avant-gauche | arrière (banquette) **ou** passager-droit selon modèle | bas-droit (arrière) |

**Conséquences rendu/asset :**
- Le sprite doit être **mirroré** selon `dir`, avec le **muzzle flash du bon côté** (côté en retrait).
- Deux poses au minimum par variante : `conduite` (pas de flash) et `tir` (flash côté tireur), comme `enemy_sprite` / `enemy_shooting`.
- Le tireur peut être en position « arrière » ou « passager avant » : prévoir au moins ces deux silhouettes pour la variété, mais une seule active par voiture.

> **Décision à valider :** la table ci-dessus fige le tireur sur le siège *en retrait*. Si on préfère un rendu « passager avant qui se penche par la vitre », inverser la colonne — mais alors documenter pourquoi le conducteur ne masque pas le tir.

### 2.4 Tuning proposé (archétype `car`)

| Champ | Valeur proposée | Intention |
| --- | --- | --- |
| `hp` | 2 | La caisse encaisse ; on vise l'occupant, pas la tôle. |
| `shoots` | oui (cadence pendant la traversée) | Menace mobile, fenêtre de tir limitée par la vitesse. |
| `scoreDelta` | +3 | Plus dur qu'un flic fixe (mobile + blindé). |
| `livesDelta` / `energyDelta` | 0 (au kill) | Récompense en score, pas en ressource. |
| `countsAsTarget` | oui | Compte pour la victoire. |
| `speed` | ~ `COURIER_SPEED` (7) ×0.8 à ×1.2 | Lisible mais pressant ; module par `enemySpeedMultiplier` du niveau. |
| poids / fréquence | rare (événementiel, pas pondéré comme les fenêtres) | Spawn via un timer de rue dédié (cf. `courierSpawnInterval`), pas via `pickKind`. |

**Pénalité de tir manqué :** la voiture **ne contient pas de civil** ; rater n'a pas de coût direct, mais le tir ennemi pendant la traversée peut toucher le joueur (`energy`/`lives`). Tuer le **conducteur** plutôt que la voiture : option future (kill = la voiture part en vrille) — hors scope V1 (YAGNI).

---

## 3. Nouveau — Preneur d'otage

### 3.1 Nature & placements
Un **ravisseur** apparaît en tenant un **otage** devant lui (bouclier humain partiel). Deux modes de spawn (même archétype, DRY) :
- **Fenêtre** (V1, priorité) — pop-up dans une fenêtre, machine à états type `enemySystem`.
- **Rue** (V1 aussi, demandée) — entité mobile type voiture/courier, le ravisseur traverse en tenant l'otage.

### 3.2 Mécanique de tir de précision (double hitbox)
La cible expose deux zones de collision distinctes :
- **Hitbox ravisseur** (zone exposée : tête/épaule qui dépasse) → **récompense**.
- **Hitbox otage** (corps au premier plan) → **pénalité**.

| Événement | Score | Énergie | Notes |
| --- | --- | --- | --- |
| Toucher le **ravisseur** sans toucher l'otage | **+5** (gros bonus) | 0 | Récompense la précision ; le ravisseur tombe, l'otage est libéré. |
| Toucher l'**otage** | **−3** | **− beaucoup** (≈ −25 sur 100) | Bavure : on a tué l'otage. |
| **Timeout** : ne pas neutraliser à temps | **−1** | **− un peu** (≈ −10) | Le ravisseur exécute l'otage puis disparaît (ou se replie). |

> Les magnitudes « beaucoup » / « un peu » justifient l'introduction d'un stat **`energy`** continu (0–100). Un compteur de vies discret ne peut pas exprimer la nuance. Voir décision ouverte du plan (Phase 2).

### 3.3 Timer & état
- Réutilise `visibleDuration` comme **délai d'exécution** : à l'expiration, transition vers un état `EXECUTES` (l'otage meurt) au lieu d'un simple retour `HIDDEN`.
- En rue : le timeout peut être la sortie d'écran **ou** un délai fixe — proposition : délai fixe pour garder la règle lisible (« on a le temps de la traversée »).

### 3.4 Tuning proposé (archétype `hostage_taker`)

| Champ | Valeur proposée | Intention |
| --- | --- | --- |
| `hp` | 1 | Un bon tir précis suffit. |
| `shoots` | non (vers le joueur) | La menace est l'otage, pas un tir sortant. |
| `scoreDelta` (kill propre) | +5 | Plus gros gain du roster : prime à la précision. |
| `countsAsTarget` | oui | Le kill propre compte pour la victoire. |
| effets « otage touché » | score −3, energy −≈25 | Sanction forte d'une bavure. |
| effets « timeout » | score −1, energy −≈10 | Sanction modérée de la lenteur. |
| `visibleDuration` | ~3.5 s (fenêtre), traversée (rue) | Fenêtre de décision tendue mais jouable. |
| poids (fenêtre) | faible (~8) | Événement spécial, pas du remplissage. |

### 3.5 Lisibilité (règle anti-mort "bullshit")
- L'otage doit être **visuellement distinct** (civil, pas d'arme, posture de captif) et clairement **au premier plan** du ravisseur.
- Le compte à rebours avant exécution doit être **perceptible** (tint/animation montant en tension), cohérent avec la règle audio (tempo).
- Chaque issue affiche son feedback chiffré via `PointHitEvent` (score + énergie).

---

## 4. Impact sur `EnemyKind` et le spawn

Ajouts au type union (`src/game/types/enemy.ts`) :
```ts
export type EnemyKind =
  | "normal" | "riot" | "biker" | "civilian" | "bonus"
  | "car"            // drive-by, entité de rue
  | "hostage_taker"; // ravisseur + otage (fenêtre et/ou rue)
```
- `car` et la version *rue* de `hostage_taker` **ne passent pas** par `pickKind`/`WEIGHTED` (timer de rue dédié, comme `courierSystem`).
- La version *fenêtre* de `hostage_taker` peut entrer dans `WEIGHTED` avec un poids faible **mais uniquement quand le niveau l'autorise** (cf. composition par niveau).

---

## 5. Composition par niveau (prérequis du rollout)

`LevelConfig` doit gagner une description **optionnelle** de composition pour respecter le rollout Belliard-first :
```ts
// proposition — champ optionnel, défaut = comportement actuel
readonly roster?: {
  readonly windowWeights?: Partial<Record<EnemyKind, number>>; // override des poids fenêtre
  readonly streetSpawns?: readonly ("courier" | "car" | "hostage_taker")[]; // entités de rue actives
};
```
- `belliard` : active `car`, puis `hostage_taker` (fenêtre + rue) une fois validés.
- `stalingrad`, `vitry` : héritent une fois la feature validée sur Belliard.
- Défaut (champ absent) = roster actuel — aucune régression sur l'existant.
