# Plan d'implémentation — Harness de level, SP1

> **Pour les lanes agentiques :** ce plan s'exécute tâche par tâche. Les étapes utilisent
> des cases à cocher (`- [ ]`). Spec de référence :
> [`spec-level-harness-sp1.md`](./spec-level-harness-sp1.md).

**Objectif** — rendre un level intégralement descriptible en données (décor, skins
d'ennemis, un archétype inédit, props propres, tuning, fiction), de façon **additive**,
sans toucher aux 4 levels shippés.

**Architecture** — la table `ARCHETYPES` est scindée en un cœur exhaustif
(`CORE_ARCHETYPES`) et une fusion figée qui y ajoute les archétypes déclarés par les
levels générés, tous à `weight: 0` et à ids namespacés. Chaque level généré vit dans son
propre module sous `src/game/levels/generated/`, déclare **un** `LevelPlan`, et deux
projections pures en dérivent son `LevelConfig` et son `LevelArt`.

**Stack** — TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`),
Vitest, aucune dépendance nouvelle.

## Contraintes globales

Elles s'appliquent implicitement à **toutes** les tâches.

- **Loi de frontière** — `src/game/**` n'importe ni React ni Three. `levelPlan.ts` et
  `generated/**` sont du game pur.
- **Additif** — les 4 levels shippés (`belliard`, `stalingrad`, `vitry`, `niveau-final`)
  et `tutorial` dérivent des données byte-for-byte identiques. C'est l'invariant n°7 et il
  est vérifié à chaque tâche.
- **`WEIGHTED` est gelé** — son contenu et son ordre ne changent jamais. `pickKind` en
  dépend pour le déterminisme des spawns.
- **`weight: 0` obligatoire** sur tout archétype level-authored. L'activation passe
  exclusivement par `roster.windowWeights`.
- **Pas de `any`**, pas de `--no-verify`. Le hook pre-commit (`lint-staged` + `lint` +
  `format:check`) tourne à chaque commit.
- **Ids namespacés** — un kind généré s'écrit `` `${levelId}:${nom}` ``. Le `:` est absent
  des 6 ids cœur, donc les deux espaces de noms ne se recouvrent jamais.
- **Commandes** — tests : `yarn vitest run <chemin>` (ou `rtk vitest`). Typecheck :
  `yarn typecheck` (ou `rtk tsc`). Ne pas lancer de passe de vérification globale avant
  commit : le hook s'en charge.

## Structure de fichiers

| Fichier                                        | Responsabilité                                    |
| ---------------------------------------------- | ------------------------------------------------- |
| `src/game/types/enemyTypes.ts` _(modifié)_     | Cœur exhaustif + fusion + accesseur `archetype()` |
| `src/game/types/enemy.ts` _(modifié)_          | Élargissement de `EnemyKind`                      |
| `src/game/levels/levelPlan.ts` _(nouveau)_     | Type `LevelPlan`, validateur, projections         |
| `src/game/levels/generated/index.ts` _(nouv.)_ | Agrégation des plans + dérivés                    |
| `src/game/levels/generated/<id>.ts` _(nouv.)_  | Un level généré (données seules)                  |
| `src/render/scene/nearForegroundArt.ts` _(m.)_ | Résolution du sizing des props, cœur + générés    |

---

### Tâche 1 : scinder la table d'archétypes

**Fichiers**

- Modifier : `src/game/types/enemyTypes.ts`
- Test : `src/game/types/__tests__/archetypeRegistry.test.ts` _(nouveau)_

**Interfaces**

- Produit : `CORE_ARCHETYPES: Record<CoreEnemyKind, Archetype>`,
  `ARCHETYPES: Readonly<Record<string, Archetype>>`,
  `archetype(kind: EnemyKind): Archetype`,
  `registerGeneratedArchetypes(entries: readonly Archetype[]): void`.

- [ ] **Étape 1 : écrire le test qui échoue**

Créer `src/game/types/__tests__/archetypeRegistry.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { ARCHETYPES, CORE_ARCHETYPES, WEIGHTED, archetype } from "@game/types/enemyTypes";

describe("registre d'archétypes", () => {
  it("expose les 6 kinds cœur, et eux seuls, dans CORE_ARCHETYPES", () => {
    expect(Object.keys(CORE_ARCHETYPES).sort()).toEqual(
      ["biker", "bonus", "civilian", "hostage_taker", "normal", "riot"].sort(),
    );
  });

  it("WEIGHTED n'est bâti que sur le cœur et garde son ordre gelé", () => {
    const expected = (Object.keys(CORE_ARCHETYPES) as (keyof typeof CORE_ARCHETYPES)[]).flatMap(
      (k) => Array.from({ length: CORE_ARCHETYPES[k].weight }, () => k),
    );
    expect(WEIGHTED).toEqual(expected);
    expect(WEIGHTED).toHaveLength(93);
  });

  it("archetype() replie sur normal pour un kind inconnu", () => {
    expect(archetype("pigalle:inexistant").spriteBase).toBe("enemy_sprite");
  });

  it("ARCHETYPES contient au moins tout le cœur", () => {
    for (const k of Object.keys(CORE_ARCHETYPES)) {
      expect(ARCHETYPES[k]).toBeDefined();
    }
  });
});
```

- [ ] **Étape 2 : lancer le test, vérifier qu'il échoue**

Lancer : `yarn vitest run src/game/types/__tests__/archetypeRegistry.test.ts`
Attendu : ÉCHEC — `CORE_ARCHETYPES` et `archetype` ne sont pas exportés.

> Si `toHaveLength(93)` ne correspond pas, corriger la valeur attendue avec la somme réelle
> des `weight` du cœur (52 + 15 + 15 + 11 + 0 + 0). Le test doit épingler la valeur réelle,
> pas l'inverse.

- [ ] **Étape 3 : implémenter**

Dans `src/game/types/enemyTypes.ts`, renommer la constante existante et ajouter la fusion.
Ne **rien** changer au contenu des 6 entrées.

```ts
import type { CoreEnemyKind, EnemyKind } from "@game/types/enemy";

/** Les 6 archétypes du cœur. Exhaustif : l'ajout d'un kind cœur est une erreur TS ici. */
export const CORE_ARCHETYPES: Record<CoreEnemyKind, Archetype> = {
  /* … les 6 entrées existantes, inchangées … */
};

// Archétypes déclarés par les levels générés. Peuplé une seule fois à l'import par
// `generated/index.ts`; jamais muté ensuite. Tous portent `weight: 0` (validé côté
// levelPlan), donc ils ne peuvent pas entrer dans un pool par défaut.
const generated = new Map<string, Archetype>();

/**
 * Enregistre les archétypes d'un level généré. Idempotent par clé : réenregistrer le
 * même id écrase la même valeur, ce qui rend l'ordre d'import sans effet.
 */
export function registerGeneratedArchetypes(entries: readonly Archetype[]): void {
  for (const entry of entries) generated.set(entry.kind, entry);
}

/** Vue fusionnée cœur + générés. Lecture seule côté appelants. */
export const ARCHETYPES: Readonly<Record<string, Archetype>> = new Proxy(
  {} as Record<string, Archetype>,
  {
    get: (_t, prop: string) => generated.get(prop) ?? CORE_ARCHETYPES[prop as CoreEnemyKind],
    has: (_t, prop: string) => generated.has(prop) || prop in CORE_ARCHETYPES,
    ownKeys: () => [...Object.keys(CORE_ARCHETYPES), ...generated.keys()],
    getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
  },
);

/**
 * L'archétype d'un kind, avec repli sur `normal` — le même repli que `pickKind`. Sous
 * `noUncheckedIndexedAccess` un accès direct à la table fusionnée serait
 * `Archetype | undefined`; cet accesseur est le seul point qui tranche.
 */
export function archetype(kind: EnemyKind): Archetype {
  return generated.get(kind) ?? CORE_ARCHETYPES[kind as CoreEnemyKind] ?? CORE_ARCHETYPES.normal;
}
```

`WEIGHTED` et `buildWeightedFrom` passent de `ARCHETYPES` à `CORE_ARCHETYPES` :

```ts
export const WEIGHTED: readonly EnemyKind[] = (
  Object.keys(CORE_ARCHETYPES) as CoreEnemyKind[]
).flatMap((k) => Array.from({ length: CORE_ARCHETYPES[k].weight }, () => k));
```

> **Note d'implémentation.** Si le `Proxy` gêne (débogage, coût, ou une règle ESLint), le
> replier sur un objet figé construit après l'enregistrement est acceptable **à condition**
> que l'ordre d'import garantisse que `generated/index.ts` s'exécute avant le premier
> lecteur. Le `Proxy` évite précisément cette dépendance d'ordre ; c'est pourquoi il est
> proposé par défaut.

- [ ] **Étape 4 : lancer le test, vérifier qu'il passe**

Lancer : `yarn vitest run src/game/types/__tests__/archetypeRegistry.test.ts`
Attendu : SUCCÈS, 4 tests.

- [ ] **Étape 5 : committer**

```bash
git add src/game/types/enemyTypes.ts src/game/types/__tests__/archetypeRegistry.test.ts
git commit -m "refactor(game): scinde ARCHETYPES en cœur exhaustif et vue fusionnée"
```

---

### Tâche 2 : élargir `EnemyKind` et migrer les call sites

**Fichiers**

- Modifier : `src/game/types/enemy.ts`
- Modifier (14 call sites) : `src/render/scene/EnemySprite.tsx:126` ·
  `src/game/types/enemyTypes.ts:160,177` · `src/game/systems/stateMachine.ts:59,504` ·
  `src/game/systems/assetManifest.ts:70,106,130` ·
  `src/game/systems/enemySystem.ts:10,28,125` · `src/game/systems/bulletSystem.ts:207` ·
  `src/game/systems/deliveryAssault.ts:113,119`
- Test : la suite existante sert de filet ; aucun test neuf.

**Interfaces**

- Consomme : `archetype()` de la tâche 1.
- Produit : `CoreEnemyKind` (l'union fermée d'avant), `GeneratedEnemyKind`, `EnemyKind`.

- [ ] **Étape 1 : élargir le type**

Dans `src/game/types/enemy.ts` :

```ts
/** Les 6 archétypes du cœur, union fermée : l'exhaustivité TS tient dessus. */
export type CoreEnemyKind = "normal" | "riot" | "biker" | "civilian" | "bonus" | "hostage_taker";

/**
 * Un archétype déclaré par un level généré. Toujours namespacé `<levelId>:<nom>` — le
 * `:` est absent des ids cœur, donc les deux espaces de noms sont disjoints par
 * construction.
 */
export type GeneratedEnemyKind = `${string}:${string}`;

export type EnemyKind = CoreEnemyKind | GeneratedEnemyKind;
```

- [ ] **Étape 2 : lancer le typecheck pour cartographier les ruptures**

Lancer : `yarn typecheck`
Attendu : ÉCHEC sur les accès `ARCHETYPES[…]` devenus `Archetype | undefined`. La liste
des erreurs doit couvrir les 14 sites listés ci-dessus — si un site supplémentaire
apparaît, l'ajouter à la liste plutôt que de le contourner.

- [ ] **Étape 3 : migrer chaque site**

Substitution mécanique : `ARCHETYPES[x]` → `archetype(x)`, en ajoutant `archetype` à
l'import existant de `@game/types/enemyTypes` (et en retirant `ARCHETYPES` de l'import
quand il n'y reste plus d'usage). Exemple, `src/game/systems/enemySystem.ts:10` :

```ts
// avant
const a = ARCHETYPES[enemy.kind];
// après
const a = archetype(enemy.kind);
```

Deux sites gardent `Object.keys(...)` et changent de source — `stateMachine.ts:59` et
`assetManifest.ts:130` doivent itérer **`CORE_ARCHETYPES`**, pas la vue fusionnée, sinon
les kinds d'un level fuiraient dans le pool par défaut d'un autre :

```ts
const defaults = Object.fromEntries(
  (Object.keys(CORE_ARCHETYPES) as CoreEnemyKind[]).map((k) => [k, CORE_ARCHETYPES[k].weight]),
) as Record<EnemyKind, number>;
```

- [ ] **Étape 4 : vérifier**

Lancer : `yarn typecheck` puis `yarn vitest run src/game`
Attendu : typecheck propre, suite `src/game` verte sans modification de test.

- [ ] **Étape 5 : committer**

```bash
git add src/game src/render/scene/EnemySprite.tsx
git commit -m "refactor(game): passe les lectures d'archétype par l'accesseur à repli"
```

---

### Tâche 3 : le type `LevelPlan` et son validateur

**Fichiers**

- Créer : `src/game/levels/levelPlan.ts`
- Test : `src/game/levels/__tests__/levelPlan.test.ts`

**Interfaces**

- Produit : `LevelPlan`, `GeneratedPropSpec`, `validateLevelPlan(plan): string[]`.
- **Imports de type uniquement** vers `levels.ts` et `levelArt.ts` (`import type`), pour
  ne pas créer de dépendance d'import-time — `assetManifest.ts` documente explicitement
  qu'il n'en veut aucune vers `levelArt.ts`.

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
import { describe, expect, it } from "vitest";
import { validateLevelPlan, type LevelPlan } from "@game/levels/levelPlan";

const base: LevelPlan = {
  id: "fixture",
  fiction: { name: "Fixture", label: "Fixture, Paris, 1998", district: "Test", year: "1998" },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [],
  props: [],
  gameplay: { enemiesToWin: 5, timeSeconds: 60, enemySpeedMultiplier: 1, windowWeights: {} },
};

describe("validateLevelPlan", () => {
  it("accepte un plan minimal", () => {
    expect(validateLevelPlan(base)).toEqual([]);
  });

  it("refuse un archétype dont le poids n'est pas nul", () => {
    const plan = {
      ...base,
      archetypes: [{ kind: "fixture:vigile", weight: 3, spriteBase: "enemy_sprite" }],
    } as LevelPlan;
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("weight"));
  });

  it("refuse un id d'archétype non namespacé sur son level", () => {
    const plan = {
      ...base,
      archetypes: [{ kind: "autre:vigile", weight: 0, spriteBase: "enemy_sprite" }],
    } as LevelPlan;
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("namespace"));
  });

  it("refuse un prop au sizing incomplet", () => {
    const plan = {
      ...base,
      props: [{ kind: "fixture:kiosque", asset: "a.png", aspect: 0.6, x: 0.2 }],
    } as unknown as LevelPlan;
    expect(validateLevelPlan(plan)).toContainEqual(expect.stringContaining("heightFrac"));
  });
});
```

- [ ] **Étape 2 : lancer, vérifier l'échec**

Lancer : `yarn vitest run src/game/levels/__tests__/levelPlan.test.ts`
Attendu : ÉCHEC — le module `levelPlan` n'existe pas.

- [ ] **Étape 3 : implémenter**

```ts
import type { Archetype } from "@game/types/enemyTypes";
import type { EnemyKind } from "@game/types/enemy";

/** Sizing d'un prop généré : le même triplet que `NearKindSpec`, mais en données. */
export interface GeneratedPropSpec {
  readonly kind: `${string}:${string}`;
  readonly asset: string;
  readonly aspect: number;
  /** Fraction de la hauteur de façade — pas une hauteur absolue. */
  readonly heightFrac: number;
  readonly footPadFrac: number;
  /** Ancre x normalisée sur toute la rue (0 = gauche, 1 = droite). */
  readonly x: number;
  readonly row?: "near" | "far";
}

export interface LevelPlan {
  readonly id: string;
  readonly fiction: {
    readonly name: string;
    readonly label: string;
    readonly district: string;
    readonly year: string;
  };
  readonly backdrop: {
    readonly mode: "single-wide";
    readonly file: string;
    readonly aspect: number;
  };
  readonly archetypes: readonly Archetype[];
  readonly props: readonly GeneratedPropSpec[];
  readonly gameplay: {
    readonly enemiesToWin: number;
    readonly timeSeconds: number;
    readonly enemySpeedMultiplier: number;
    readonly windowWeights: Partial<Record<EnemyKind, number>>;
  };
}

/**
 * Vérifie les invariants qu'un plan doit tenir. Retourne la liste des violations —
 * vide si le plan est bon. Appelé par un test, donc une violation casse la CI et
 * jamais le runtime.
 */
export function validateLevelPlan(plan: LevelPlan): string[] {
  const errors: string[] = [];
  const ns = `${plan.id}:`;

  for (const a of plan.archetypes) {
    if (a.weight !== 0) {
      errors.push(`archétype ${a.kind}: weight doit être 0 (activation via windowWeights)`);
    }
    if (!a.kind.startsWith(ns)) {
      errors.push(`archétype ${a.kind}: namespace attendu "${ns}"`);
    }
  }

  for (const p of plan.props) {
    if (!p.kind.startsWith(ns)) errors.push(`prop ${p.kind}: namespace attendu "${ns}"`);
    for (const field of ["aspect", "heightFrac", "footPadFrac"] as const) {
      if (!Number.isFinite(p[field])) errors.push(`prop ${p.kind}: ${field} manquant ou non fini`);
    }
  }

  return errors;
}
```

- [ ] **Étape 4 : vérifier**

Lancer : `yarn vitest run src/game/levels/__tests__/levelPlan.test.ts`
Attendu : SUCCÈS, 4 tests.

- [ ] **Étape 5 : committer**

```bash
git add src/game/levels/levelPlan.ts src/game/levels/__tests__/levelPlan.test.ts
git commit -m "feat(game): introduit le schéma LevelPlan et son validateur"
```

---

### Tâche 4 : les projections vers `LevelConfig` et `LevelArt`

**Fichiers**

- Modifier : `src/game/levels/levelPlan.ts`
- Test : `src/game/levels/__tests__/levelPlan.test.ts` _(complété)_

**Interfaces**

- Produit : `planToLevelConfig(plan): LevelConfig`, `planToLevelArt(plan): LevelArt`.

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
it("projette le plan en LevelConfig jouable", () => {
  const cfg = planToLevelConfig(base);
  expect(cfg.id).toBe("fixture");
  expect(cfg.kind).toBe("playable");
  expect(cfg.enemiesToWin).toBe(5);
  expect(cfg.unlocked).toBe(false);
  expect(cfg.deliveries).toHaveLength(1);
});

it("projette le plan en LevelArt single-wide", () => {
  const art = planToLevelArt(base);
  expect(art.backdrop).toEqual({ mode: "single-wide", file: "street-wide", aspect: 5.14 });
  expect(art.prompts).toEqual({});
});
```

- [ ] **Étape 2 : lancer, vérifier l'échec**

Lancer : `yarn vitest run src/game/levels/__tests__/levelPlan.test.ts`
Attendu : ÉCHEC — `planToLevelConfig` n'est pas exporté.

- [ ] **Étape 3 : implémenter**

`deliveries` est requis et non vide sur un level jouable (le seed de
`GameState.deliveryVehicle` lit `deliveries[0]`), donc la projection en fabrique une par
défaut plutôt que de laisser un tableau vide sur un chemin non testé.

```ts
import type { LevelConfig } from "@game/levels/levels";
import type { LevelArt } from "@game/levels/levelArt";

/** Livraison par défaut d'un level généré, calquée sur celle de belliard. */
const DEFAULT_DELIVERY = {
  vehicleType: "truck",
  triggerAtElapsedSeconds: 20,
  integrity: 100,
  windowSeconds: 8,
  bonus: 500,
  entrySide: "left",
  stopPosition: { x: 0, y: -4.5 },
} as const;

export function planToLevelConfig(plan: LevelPlan): LevelConfig {
  return {
    id: plan.id,
    kind: "playable",
    name: plan.fiction.name,
    district: plan.fiction.district,
    year: plan.fiction.year,
    enemySpeedMultiplier: plan.gameplay.enemySpeedMultiplier,
    enemiesToWin: plan.gameplay.enemiesToWin,
    timeSeconds: plan.gameplay.timeSeconds,
    // Un level généré n'est jamais déverrouillé d'office : il s'ouvre par la
    // progression, comme stalingrad et vitry.
    unlocked: false,
    deliveries: [DEFAULT_DELIVERY],
    roster: { windowWeights: plan.gameplay.windowWeights, streetSpawns: ["courier"] },
  };
}

export function planToLevelArt(plan: LevelPlan): LevelArt {
  return {
    id: plan.id,
    name: plan.fiction.name,
    label: plan.fiction.label,
    // `single-wide` ignore le parallaxe par couche (tout est cuit dans l'image),
    // mais le champ est requis par le type.
    parallax: { sky: 0, facade: 0, street: 0 },
    backdrop: plan.backdrop,
    // Aucun prompt par couche : le décor vient du pipeline payé, pas de gen-level-art.
    prompts: {},
    nearForeground: {
      factor: -0.38,
      objects: plan.props.map((p) => ({
        kind: p.kind as never, // élargi en tâche 6
        x: p.x,
        ...(p.row === undefined ? {} : { row: p.row }),
      })),
    },
  };
}
```

> `exactOptionalPropertyTypes` est actif : un champ optionnel s'omet par spread
> conditionnel, jamais en passant `undefined`.

- [ ] **Étape 4 : vérifier**

Lancer : `yarn vitest run src/game/levels/__tests__/levelPlan.test.ts`
Attendu : SUCCÈS, 6 tests.

- [ ] **Étape 5 : committer**

```bash
git add src/game/levels/levelPlan.ts src/game/levels/__tests__/levelPlan.test.ts
git commit -m "feat(game): projette un LevelPlan en LevelConfig et LevelArt"
```

---

### Tâche 5 : le level fixture et son câblage

**Fichiers**

- Créer : `src/game/levels/generated/fixture.ts`, `src/game/levels/generated/index.ts`
- Modifier : `src/game/levels/levels.ts` (concaténation), `src/game/levels/levelArt.ts`
  (concaténation)
- Test : `src/game/levels/__tests__/generatedLevels.test.ts`

**Interfaces**

- Consomme : `validateLevelPlan`, `planToLevelConfig`, `planToLevelArt`,
  `registerGeneratedArchetypes`.
- Produit : `GENERATED_PLANS`, `GENERATED_LEVEL_CONFIGS`, `GENERATED_LEVEL_ART`.

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
import { describe, expect, it } from "vitest";
import { LEVELS } from "@game/levels/levels";
import { GENERATED_PLANS } from "@game/levels/generated";
import { validateLevelPlan } from "@game/levels/levelPlan";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";
import { buildWeightedFrom } from "@game/types/enemyTypes";

const SHIPPED = ["tutorial", "belliard", "stalingrad", "vitry", "niveau-final"];

describe("levels générés", () => {
  it("tous les plans passent leur validateur", () => {
    for (const plan of GENERATED_PLANS) expect(validateLevelPlan(plan)).toEqual([]);
  });

  it("les levels shippés restent en tête et inchangés", () => {
    expect(LEVELS.slice(0, SHIPPED.length).map((l) => l.id)).toEqual(SHIPPED);
  });

  it("le fixture apparaît dans LEVELS", () => {
    expect(LEVELS.map((l) => l.id)).toContain("fixture");
  });

  it("aucun kind généré ne fuit dans le pool d'un level qui ne le possède pas", () => {
    const defaults = Object.fromEntries(
      (Object.keys(CORE_ARCHETYPES) as (keyof typeof CORE_ARCHETYPES)[]).map((k) => [
        k,
        CORE_ARCHETYPES[k].weight,
      ]),
    );
    for (const level of LEVELS) {
      const pool = buildWeightedFrom({ ...defaults, ...level.roster?.windowWeights });
      for (const kind of new Set(pool)) {
        if (kind.includes(":")) expect(kind.startsWith(`${level.id}:`)).toBe(true);
      }
    }
  });
});
```

- [ ] **Étape 2 : lancer, vérifier l'échec**

Lancer : `yarn vitest run src/game/levels/__tests__/generatedLevels.test.ts`
Attendu : ÉCHEC — le module `generated` n'existe pas.

- [ ] **Étape 3 : implémenter le fixture**

`src/game/levels/generated/fixture.ts` — aucun asset n'existe pour ce level, c'est
délibéré : il prouve que tous les replis tiennent.

```ts
import type { LevelPlan } from "@game/levels/levelPlan";

/**
 * Level FIXTURE — écrit à la main, sans le moindre asset. Il n'existe que pour prouver
 * que le schéma tient de bout en bout : ennemis repliés sur `enemy_sprite`, props
 * invisibles faute de PNG, décor absent (LevelBackdrop retombe sur des aplats). Ne pas
 * générer d'art pour lui.
 */
export const plan: LevelPlan = {
  id: "fixture",
  fiction: {
    name: "Fixture",
    label: "Level de vérification, hors fiction",
    district: "Test",
    year: "1998",
  },
  backdrop: { mode: "single-wide", file: "street-wide", aspect: 5.14 },
  archetypes: [
    {
      kind: "fixture:vigile",
      hp: 2,
      bulletDamage: 0.5,
      hiddenDuration: 1.6,
      visibleDuration: 3.0,
      shoots: true,
      scoreDelta: 2,
      livesDelta: 0,
      timeDelta: 0,
      countsAsTarget: true,
      weight: 0,
      spriteBase: "enemy_fixture_vigile",
      variants: 1,
      tint: "#ffffff",
      aspect: 1,
    },
  ],
  props: [
    {
      kind: "fixture:kiosque",
      asset: "assets/nearfg/fixture/kiosque.png",
      aspect: 0.6,
      heightFrac: 0.28,
      footPadFrac: 0.15,
      x: 0.22,
      row: "far",
    },
  ],
  gameplay: {
    enemiesToWin: 5,
    timeSeconds: 60,
    enemySpeedMultiplier: 1,
    windowWeights: { "fixture:vigile": 20 },
  },
};
```

`src/game/levels/generated/index.ts` :

```ts
import { plan as fixture } from "./fixture";
import { planToLevelArt, planToLevelConfig, type LevelPlan } from "@game/levels/levelPlan";
import { registerGeneratedArchetypes } from "@game/types/enemyTypes";

/** Tous les plans générés, en ordre de déclaration. Ajouter un level = une ligne ici. */
export const GENERATED_PLANS: readonly LevelPlan[] = [fixture];

// Enregistrement des archétypes AVANT toute lecture : c'est le seul effet de bord du
// module, et il est idempotent.
for (const plan of GENERATED_PLANS) registerGeneratedArchetypes(plan.archetypes);

export const GENERATED_LEVEL_CONFIGS = GENERATED_PLANS.map(planToLevelConfig);
export const GENERATED_LEVEL_ART = GENERATED_PLANS.map(planToLevelArt);
```

Câblage — dans `levels.ts`, renommer le littéral existant en `SHIPPED_LEVELS` et exporter
la concaténation (les shippés d'abord, pour que l'ordre du menu ne bouge pas) :

```ts
const SHIPPED_LEVELS: readonly LevelConfig[] = [
  /* … inchangé … */
];
export const LEVELS: readonly LevelConfig[] = [...SHIPPED_LEVELS, ...GENERATED_LEVEL_CONFIGS];
```

Même schéma dans `levelArt.ts` pour `LEVEL_ART_LIST` et `LEVEL_ART`.

- [ ] **Étape 4 : vérifier**

Lancer : `yarn vitest run src/game && yarn typecheck`
Attendu : suite verte, y compris les tests d'invariants existants des levels shippés.

- [ ] **Étape 5 : committer**

```bash
git add src/game/levels
git commit -m "feat(game): câble les levels générés et ajoute le fixture de vérification"
```

---

### Tâche 6 : sizing des props générés (lane render)

**Fichiers**

- Modifier : `src/render/scene/nearForegroundArt.ts` (résolution du spec),
  `src/render/scene/nearForegroundTextures.ts:50` (`isKnownKind`)
- Test : `src/render/scene/__tests__/nearForegroundSizing.test.ts` _(complété)_

- [ ] **Étape 1 : écrire le test qui échoue**

```ts
it("résout le spec d'un prop généré depuis les données du plan", () => {
  expect(nearKindSpec("fixture:kiosque")).toEqual({
    aspect: 0.6,
    heightFrac: 0.28,
    footPadFrac: 0.15,
  });
});

it("un prop généré sans PNG n'est pas considéré comme dessinable", () => {
  expect(isDrawableKind("fixture:kiosque")).toBe(false);
});
```

- [ ] **Étape 2 : lancer, vérifier l'échec**

Lancer : `yarn vitest run src/render/scene/__tests__/nearForegroundSizing.test.ts`
Attendu : ÉCHEC — `nearKindSpec` n'existe pas.

- [ ] **Étape 3 : implémenter**

```ts
import { GENERATED_PLANS } from "@game/levels/generated";

const GENERATED_SPECS: Readonly<Record<string, NearKindSpec>> = Object.fromEntries(
  GENERATED_PLANS.flatMap((p) =>
    p.props.map((prop) => [
      prop.kind,
      { aspect: prop.aspect, heightFrac: prop.heightFrac, footPadFrac: prop.footPadFrac },
    ]),
  ),
);

/**
 * Le sizing d'un prop : les 8 kinds du pool global le tiennent du code
 * (`NEAR_KIND_SPECS`), un prop généré le tient de son plan. Repli sur `bollard` — le
 * plus neutre — pour qu'un kind inconnu ne fasse jamais planter le calcul de plan.
 */
export function nearKindSpec(kind: string): NearKindSpec {
  return (
    GENERATED_SPECS[kind] ?? NEAR_KIND_SPECS[kind as NearForegroundKind] ?? NEAR_KIND_SPECS.bollard
  );
}
```

Les 4 lecteurs de `NEAR_KIND_SPECS[…]` passent par `nearKindSpec(…)`. `isKnownKind`
(`nearForegroundTextures.ts:50`) reste inchangé : il ne connaît que les 8 kinds
dessinables procéduralement, donc un prop généré y répond `false` — c'est exactement le
comportement voulu (pas de fallback dessiné, invisible sans PNG).

- [ ] **Étape 4 : vérifier**

Lancer : `yarn vitest run src/render && yarn typecheck`
Attendu : suite verte.

- [ ] **Étape 5 : committer**

```bash
git add src/render/scene
git commit -m "feat(render): résout le sizing des props générés depuis leur plan"
```

---

### Tâche 7 : préchargement des skins générés et invariant mobile

**Fichiers**

- Modifier : `src/game/systems/assetManifest.ts` (si besoin après vérification)
- Test : `src/game/levels/__tests__/generatedLevels.test.ts` _(complété)_

- [ ] **Étape 1 : écrire les deux derniers invariants**

```ts
it("les chemins de préchargement incluent les skins générés", () => {
  const paths = enemyAssetPathsFor("fixture");
  expect(paths.some((p) => p.includes("enemy_fixture_vigile"))).toBe(true);
});

it("chaque level généré garde un prop sur index pair de sa rangée", () => {
  // NearForeground.tsx supprime un élément sur deux de l'ORDRE DE LISTE sur mobile.
  // Un level dont tous les props d'une rangée sont sur index impair n'affiche rien.
  for (const plan of GENERATED_PLANS) {
    for (const row of ["near", "far"] as const) {
      const inRow = plan.props.filter((p) => (p.row ?? "near") === row);
      if (inRow.length === 0) continue;
      const survivors = inRow.filter((_, i) => i % 2 === 0);
      expect(survivors.length).toBeGreaterThan(0);
    }
  }
});
```

- [ ] **Étape 2 : lancer et constater**

Lancer : `yarn vitest run src/game/levels/__tests__/generatedLevels.test.ts`
Attendu : le test de préchargement passe **si** `enemyAssetPathsFor` traverse déjà la vue
fusionnée via `archetype()` (tâche 2). S'il échoue, corriger `enemyKindPaths` —
`assetManifest.ts:106` — pour lire l'accesseur, pas la table cœur.

- [ ] **Étape 3 : committer**

```bash
git add src/game
git commit -m "test(game): épingle le préchargement des skins générés et l'ordre mobile"
```

---

## Auto-revue du plan

**Couverture du spec.** Les 7 invariants sont couverts : n°1 (tâche 1), n°2 et n°3
(tâches 3 et 5), n°4 (tâche 3), n°5 (tâche 7), n°6 (tâche 7), n°7 (tâche 5). §4.1 →
tâches 1 et 2 · §4.2 → tâches 3 et 5 · §4.3 → tâche 5 · §4.4 → tâche 4 · §4.5 → tâche 6.
§8 (critère d'acceptation) → tâche 5 pour les données, plus la vérification manuelle
ci-dessous.

**Cohérence des noms.** `archetype()`, `CORE_ARCHETYPES`, `registerGeneratedArchetypes`,
`validateLevelPlan`, `planToLevelConfig`, `planToLevelArt`, `nearKindSpec`,
`GENERATED_PLANS` sont employés à l'identique de leur définition dans toutes les tâches.

**Point non couvert par les tests, à faire à la main.** Le critère d'acceptation §8 exige
que le fixture **démarre et se joue**. Aucun test unitaire ne le prouve : après la
tâche 5, lancer la skill `verify` (build + navigateur headless) et jouer le fixture
jusqu'à sa condition de victoire.

**Ordre et parallélisme.** 1 → 2 sont séquentielles. 3 → 4 → 5 sont séquentielles. 6 est
la seule tâche de la lane render et ne dépend que de 5. 7 clôt.
