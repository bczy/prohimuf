# Spec — Harness de level, SP1 : « un level est un objet composable »

> **Statut** — design validé par Bertrand le 2026-07-27, avant ouverture de story.
> **Périmètre** — sous-projet **1 sur 3** du harness de génération de level.
> **Lanes** — technique : `senior-architect` (la décision d'architecture appelle un ADR,
> numéro à allouer par `producer` / `adr-new`). Design : `lead-game-designer` gate la
> surface tuning/roster (archétypes, poids, courbe). Art : hors SP1.
> **Ne livre aucune image, aucun orchestrateur** — voir « Hors périmètre ».

## 1. Pourquoi ce sous-projet existe

L'objectif global est un harness qui produit un level **complet** à partir d'un pitch
d'une ligne : décor, ennemis, props, tuning, fiction, zones de fenêtres, preuves.

Un audit de la chaîne existante a montré que les briques de génération existent déjà
(13 workflows `gen-*.yml`, `levelArt.json` comme manifeste unique, les gates
`check-art-prompts` / `check-sprite-integrity` / `align-windows --check`), mais que
**la notion de « level » comme unité de production n'existe nulle part** : aucun fichier
ne connaît la séquence ni les dépendances entre ces briques.

Le périmètre complet couvre sept sous-systèmes indépendants. Il est découpé en trois
sous-projets à **ordre forcé**, chacun avec son propre cycle spec → plan → implémentation :

| Sous-projet | Livre                                                             | État           |
| ----------- | ----------------------------------------------------------------- | -------------- |
| **SP1**     | Le pouvoir de _décrire_ un level complet en données               | ce spec        |
| **SP2**     | Chaque phase de génération tourne seule en CI                     | à brainstormer |
| SP3         | L'orchestrateur pitch → candidat + tuning + fiction + gate packet | à brainstormer |

L'ordre n'est pas négociable : SP2 génère _dans_ le schéma que SP1 définit, SP3 orchestre
les phases que SP2 rend autonomes.

## 2. Décisions de cadrage (tranchées par Bertrand, 2026-07-27)

1. **Ennemis** — skins propres à chaque level, **plus un archétype inédit au maximum**
   par level, gaté par la boucle design. Un « archétype inédit » est une nouvelle
   combinaison de primitives mécaniques **existantes** (endurance, cadence, fenêtre
   d'exposition, effets), pas du code nouveau. Une règle réellement neuve reste une
   story, pas une sortie de harness.
2. **Props** — propres à chaque level eux aussi, et non plus seulement piochés dans le
   pool global de 8 kinds. Conséquence : SP1 livre **un mécanisme de scoping d'assets**
   appliqué à deux familles d'un coup, pas deux rustines.
3. **Décor** — le contrat canonique d'un level généré est **`single-wide` payé**
   (ADR-0057) : une image opaque complète, produite par le pipeline `ideogram-v4-quality`
   de `gen-street-paid.mjs` (`POLLINATIONS_TOKEN`), pas par le flux anonyme plafonné
   à ~0,59 MP. Le mode `single-wide` n'a ni `sky`, ni `street`, ni tronçons : la
   géométrie du monde se déduit de `world.heightUnits * aspect`.
4. **Migration** — **additif seulement**. `belliard`, `stalingrad`, `vitry` et
   `niveau-final` gardent leurs données et leur art byte-for-byte. C'est la façon dont
   le repo s'est toujours étendu (`kind?`, `roster?`, `bossQteSpec?` tous optionnels).

## 3. Ce que l'état des lieux a révélé

Trois faits ont rendu ce sous-projet beaucoup moins cher que prévu, et un quatrième
impose une contrainte non négociable.

**`ARCHETYPES` est déjà une table de données pures** (`src/game/types/enemyTypes.ts`).
Chaque paramètre d'un ennemi y est une valeur : `hp`, `bulletDamage`,
`hiddenDuration`, `visibleDuration`, `shoots`, `scoreDelta`, `livesDelta`, `timeDelta`,
`countsAsTarget`, `weight`, `spriteBase`, `variants`, `tint`, `aspect`. Et il n'y a
**aucun `switch (kind)` dans `src/game`** — les seuls switchs sont render-side, sur les
armes du HUD et le dessin procédural des props. Un archétype inédit est donc déjà
exprimable comme _une entrée de table_.

**`spriteBase` est un champ string de l'archétype**, et `enemyBaseFileKey()` le lit via
`ARCHETYPES[kind]` (`src/game/systems/assetManifest.ts`). Dès que la table connaît les
archétypes d'un level, **les skins par level viennent gratuitement** : ni
`enemyAssetPath()` ni le préchargeur ne changent, et le nouvel axe `skin` initialement
envisagé est inutile.

**Les deux sites qui typent `Record<EnemyKind, number>`** (`stateMachine.ts` /
`assetManifest.ts`) construisent leur table de défauts par `Object.keys(ARCHETYPES)`.
Élargir la clé ne casse donc pas leur typage.

**Mais `WEIGHTED` est un ordre gelé.** `hostage_taker` est explicitement « declared LAST
so the frozen `WEIGHTED` order (and thus `pickKind` determinism) holds ». Le déterminisme
des spawns de fenêtre est garanti contre cette constante. Un archétype level-authored ne
doit donc **jamais** entrer dans le pool par défaut.

## 4. Architecture retenue

### 4.1 Table fusionnée statiquement, pas de résolution dynamique

Les levels sont des **données statiques** : tous les archétypes level-authored sont
connus à l'import. Aucune résolution par level n'est nécessaire.

- `CORE_ARCHETYPES: Record<CoreEnemyKind, Archetype>` — les 6 kinds actuels, exhaustivité
  TypeScript préservée.
- `ARCHETYPES: Readonly<Record<string, Archetype>>` — la fusion figée
  `{ ...CORE_ARCHETYPES, ...levelAuthored }`, construite une fois à l'import.
- `WEIGHTED` continue d'itérer **`CORE_ARCHETYPES` seul** ⇒ byte-for-byte identique.
- `EnemyKind = CoreEnemyKind | GeneratedEnemyKind`, où `GeneratedEnemyKind` est le type
  des ids **namespacés** `` `${string}:${string}` `` (`pigalle:vigile`). Ce motif garde la
  table plate sans collision possible, et le `:` est interdit dans les 6 ids core, donc
  les deux espaces de noms ne peuvent jamais se recouvrir.
- `LevelRoster.windowWeights`, aujourd'hui `Partial<Record<EnemyKind, number>>`, accepte
  de ce fait les ids générés sans changement de forme — c'est le seam d'activation de
  §4.2, et il existe déjà.

L'alternative écartée était une résolution dynamique `archetypeFor(kind, levelId)` :
elle touche tous les call sites render, injecte un `levelId` dans des fonctions qui n'en
ont pas, et introduit de l'état global mutable dans un core aujourd'hui purement
fonctionnel — pour un besoin (deux levels réutilisant le même id avec un tuning
différent) que rien n'indique.

### 4.2 La règle `weight: 0`, non négociable

Un archétype level-authored **doit** déclarer `weight: 0`, et le level qui le veut
l'active via son propre `roster.windowWeights`.

Sans cette règle, la table étant globale, le pool par défaut de _chaque_ level inclurait
les kinds custom de _tous_ les autres — `windowPoolFor` bâtit ses défauts sur
`Object.keys(ARCHETYPES)`. La règle a un précédent direct et documenté dans le repo :
`civilian` et `hostage_taker` sont exactement cela, des entrées `weight: 0` conservées
comme descripteurs d'art, rappelées explicitement par qui en a besoin.

Elle garantit trois choses d'un coup : `WEIGHTED` inchangé, le pool par défaut de chaque
level shippé inchangé, et `windowPoolKinds` continue de refléter le pool réel pour le
préchargement.

### 4.3 Un module généré par level

Chaque level généré vit dans **son propre fichier**, `src/game/levels/generated/<id>.ts`,
agrégé par `generated/index.ts`. Le harness **crée** des fichiers, ne modifie jamais
l'existant.

C'est la seule forme qui rend le harness sûr par construction. `levelArt.json` contient
des commentaires _load-bearing_ qui documentent des bugs évités — l'ordre des props face
au halving mobile, le déterminisme de `WEIGHTED`, les zones placées à la main de
belliard. Un générateur qui reformate ce fichier les détruit. Bénéfices annexes : diff
lisible en revue, deux levels générables en parallèle sans conflit, et un level raté se
supprime en effaçant un fichier.

### 4.4 Le plan est la source unique ; `LevelConfig` et `LevelArt` en sont des projections

`LevelPlan` n'est pas une quatrième façon de décrire un level. Le module généré déclare
**un** plan, et deux fonctions pures en dérivent le `LevelConfig` (gameplay) et le
`LevelArt` (art). Zéro duplication, une seule vérité par level.

```ts
// src/game/levels/generated/pigalle.ts — écrit par le harness, jamais à la main
import type { LevelPlan } from "@game/levels/levelPlan";

export const plan: LevelPlan = {
  id: "pigalle",
  fiction: { name: "Pigalle", label: "Pigalle, Paris 9e, 1998", district: "9e", year: "1998" },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [
    {
      kind: "pigalle:vigile",
      weight: 0, // obligatoire — voir §4.2
      spriteBase: "enemy_pigalle_vigile",
      variants: 1,
      hp: 2,
      shoots: true,
      // … le reste des primitives mécaniques existantes
    },
  ],
  props: [
    {
      kind: "pigalle:kiosque",
      asset: "assets/nearfg/pigalle/kiosque.png",
      aspect: 0.6, // même triplet que NEAR_KIND_SPECS, mais en données — voir §4.5
      heightFrac: 0.28, // fraction de la hauteur de façade, pas une hauteur absolue
      footPadFrac: 0.15,
      x: 0.22,
      row: "far",
    },
  ],
  gameplay: {
    enemiesToWin: 12,
    timeSeconds: 95,
    enemySpeedMultiplier: 1.1,
    windowWeights: { "pigalle:vigile": 18, normal: 40 },
  },
};
```

### 4.5 Props scopés

Un prop généré porte son sizing monde **en données** — le même triplet
`{ aspect, heightFrac, footPadFrac }` que `NearKindSpec`, où `heightFrac` est une
fraction de la hauteur de façade et non une hauteur absolue — au lieu de
`NEAR_KIND_SPECS`, qui reste en code pour les 8 kinds du pool global, inchangés.

Il n'a **pas** de dessin procédural de secours : `nearForegroundArt.ts` porte un
`switch (kind)` pour le fallback des kinds connus, et un prop inventé n'y figure pas.
Absent son PNG, un prop généré **ne s'affiche pas** — silencieusement, jamais en crash.

## 5. Fichiers touchés

**Nouveaux**

- `src/game/levels/levelPlan.ts` — le type `LevelPlan`, son validateur, et les deux
  projections vers `LevelConfig` / `LevelArt`.
- `src/game/levels/generated/index.ts` — agrégation des modules générés.
- `src/game/levels/generated/<id>.ts` — un par level généré.

**Modifiés**

- `src/game/types/enemyTypes.ts` — scission `CORE_ARCHETYPES` / `ARCHETYPES` fusionné,
  ajout de l'accesseur `archetype(kind)`, `WEIGHTED` restreint au core.
- `src/game/types/enemy.ts` — `EnemyKind = CoreEnemyKind | GeneratedEnemyKind`.
- Les **14** call sites `ARCHETYPES[kind]` de production → `archetype(kind)` : sous
  `noUncheckedIndexedAccess`, une clé string rend l'accès direct possiblement `undefined`.
  L'accesseur replie sur `normal`, exactement comme `pickKind` le fait déjà.
- `src/game/levels/levels.ts` — concaténation des levels générés à `LEVELS`.

## 6. Gestion d'erreur

| Cas                          | Comportement                                                    |
| ---------------------------- | --------------------------------------------------------------- |
| Sprite d'ennemi manquant     | Repli sur `enemy_sprite` (mécanisme existant d'`enemyTextures`) |
| PNG de prop généré manquant  | Le prop ne s'affiche pas, silencieusement                       |
| Kind inconnu dans un pool    | `archetype()` replie sur `normal`, **et** un test l'interdit    |
| Plan incomplet ou incohérent | Échec **CI** via le validateur, jamais au runtime               |

## 7. Tests — les sept invariants

1. `WEIGHTED` est identique à un tableau golden figé.
2. Tout archétype généré déclare `weight: 0`.
3. Aucun kind généré n'apparaît dans le pool d'un level qui ne le possède pas.
4. Tout prop généré déclare son triplet `aspect` / `heightFrac` / `footPadFrac` complet.
5. L'ordre du tableau de props survit au **halving mobile** : `NearForeground.tsx`
   supprime un élément sur deux de l'ordre de la liste sur mobile. C'est le bug
   documenté deux fois dans `levelArt.json`, qui a fait disparaître les panneaux PARIS
   de belliard puis de stalingrad. Un générateur qui trie par `x` le reproduirait.
6. `enemyAssetPathsFor(<id généré>)` inclut les chemins des skins générés.
7. Les 4 levels shippés dérivent des données **byte-for-byte identiques** à aujourd'hui.

## 8. Critère d'acceptation de SP1

SP1 se prouve avec **un level fixture écrit à la main** dans `generated/`, **sans aucun
asset** — donc tous les replis actifs : ennemis en `enemy_sprite`, props invisibles,
décor absent (le `LevelBackdrop` retombe déjà sur des couleurs plates).

**Amendement (2026-07-29, aligné sur ADR-0075 §6)** : un level généré vit HORS du menu
par décision d'architecture — « apparaît au menu » contredisait cette décision. Le
critère est donc : bootable par le seam de vérification `?preview=level&level=<id>`,
démarre, et se joue. La preuve déroulée est dans
`docs/qa/evidence/story-level-harness-sp1/`.

Ce critère est délibérément indépendant de toute génération d'image : il isole SP1 de la
disponibilité du réseau, des quotas et du token payant.

## 9. Hors périmètre

- Toute génération d'image, la généralisation de `gen-street-paid.mjs`, la calibration
  automatique du détecteur d'ouvertures → **SP2**.
- L'orchestrateur (DAG, `needs:`, `--resume`), le générateur de courbe de difficulté, la
  fiction automatique, les tests d'invariants générés, le gate packet → **SP3**.
- Toute modification des 4 levels shippés (décision de cadrage n°4).

## 10. Points à vérifier à l'implémentation

- ~~Le comptage exact des call sites~~ — **fait** : 14 en production
  (`EnemySprite.tsx` ×1, `enemyTypes.ts` ×2, `stateMachine.ts` ×2, `assetManifest.ts` ×3,
  `enemySystem.ts` ×3, `bulletSystem.ts` ×1, `deliveryAssault.ts` ×2) plus 5 dans les
  tests. Reste à confirmer l'absence d'autre dépendance à l'exhaustivité de
  `Record<EnemyKind, …>`.
- La forme exacte du bloc `nearForegroundArt` de `levelArt.json` et de `NEAR_KIND_SPECS`,
  pour dimensionner le passage du sizing en données.
- L'ordre d'import entre `generated/index.ts`, `levels.ts` et `enemyTypes.ts` : la fusion
  de la table doit rester sans cycle, et `assetManifest.ts` documente explicitement
  qu'il ne veut **aucune** dépendance d'import-time sur `levelArt.ts`.
