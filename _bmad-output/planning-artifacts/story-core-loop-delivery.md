# Story: Boucle Core `Récupérer → Livrer → Éviter` — slice MVP cargaison

**Type:** New gameplay (core loop) · **Scope guard:** ceci EST le core loop du cahier des
charges Prohibition ST. Slice minimal, branché sur le proto shooting-gallery existant.
**Date:** 2026-07-02 · **PM:** John · **Statut:** prête-pour-dev (attend lane assignment `senior-architect`)

## Why

Le proto ne couvre aujourd'hui qu'un seul des trois verbes de la boucle (`Éviter`, via la
phase de tir). `Récupérer` et `Livrer` n'existent pas. Cette story ajoute le plus petit
incrément vérifiable qui met les trois verbes en jeu **dans le niveau existant**, sans
réécrire le proto : une **cargaison** apparaît à un point de collecte ; le joueur la
récupère, la porte, puis la dépose à un point de dépôt — pendant que la menace (ennemis
fenêtre + ripostes) continue. On réutilise `gameState`, `stateMachine`, le crosshair, le
HUD et le pattern de feedback ; on n'ajoute que le strict nécessaire (`deliverySystem` pur
+ état `cargo` + marqueurs de rendu + indicateur HUD).

**Fidélité cahier des charges :** oui — récupérer une cargaison à un point, la livrer à un
dépôt en gérant la menace est la boucle originale. Aucune extension consciente ici.

**Interaction (pas de nouvel input) :** la collecte/le dépôt se font par **proximité du
crosshair** (survol dans un rayon), pas via une nouvelle touche. On ne surcharge pas le
tir. `stateMachine` convertit déjà la position crosshair en monde pour les balles
(`fireBullet`) ; on réutilise cette conversion pour alimenter `tickDelivery` — le système
reste agnostique de la caméra.

**Bornes MVP (YAGNI) :** une seule cargaison par niveau ; points pickup/dépôt en dur pour
`belliard` ; la livraison octroie un **bonus de score + confirmation HUD**. Faire de la
livraison la *condition de victoire* (rewire `enemiesToWin` / `LevelConfig` / difficulté)
est HORS scope de ce slice — story de suivi.

---

## Lane A — dev-gameplay : `deliverySystem` pur + types + tests

**Chemins (exclusivement `src/game/**`) :**
- `src/game/types/cargo.ts` (nouveau — types, zéro fonction)
- `src/game/systems/deliverySystem.ts` (nouveau — fonctions pures)
- `src/game/systems/__tests__/deliverySystem.test.ts` (nouveau)
- `src/game/types/gameState.ts` (édition — nouveau champ `cargo`)
- `src/game/systems/stateMachine.ts` (édition — seed `cargo` + appel `tickDelivery`)

**Acceptance criteria (A) — testables, purs :**
- A1. `Cargo` expose `status: "TO_PICKUP" | "CARRYING" | "DELIVERED"`, `pickup: Vec2`,
  `depot: Vec2`. Aucune fonction dans `types/`.
- A2. `tickDelivery(cargo, crosshairWorld: Vec2, radius: number)` : si `status==="TO_PICKUP"`
  et `distance(crosshairWorld, cargo.pickup) <= radius` → renvoie `status: "CARRYING"` avec
  `justPickedUp: true`.
- A3. Si `status==="CARRYING"` et `distance(crosshairWorld, cargo.depot) <= radius` →
  renvoie `status: "DELIVERED"`, `justDelivered: true`, `scoreDelta > 0`.
- A4. Idempotence : une fois `DELIVERED`, aucune transition ni `scoreDelta` supplémentaire
  aux ticks suivants.
- A5. Hors rayon (ou mauvaise cible pour l'état courant) : `cargo` inchangé, `scoreDelta 0`,
  aucun flag.
- A6. `GameState` gagne `readonly cargo: Cargo` ; `createInitialState` le seed en
  `TO_PICKUP` avec des `pickup`/`depot` Vec2 fixes (MVP belliard) ; `tickGameState` appelle
  `tickDelivery` chaque tick, replie `scoreDelta` dans `score`, et pousse un `HitEvent`/
  feedback sur pickup et sur livraison (réutilise le canal `feedback` existant).
- A7. Tests couvrant A2–A5 verts (`yarn test --run`) ; `src/game/` sans import React/Three ;
  `tsc --noEmit` OK ; ESLint clean.

## Lane B — dev-r3f-render : rendu marqueurs + indicateur HUD

**Chemins (exclusivement `src/render/**`) :**
- `src/render/scene/CargoMarkers.tsx` (nouveau)
- `src/render/scene/GameScene.tsx` (édition — monte `CargoMarkers`)
- `src/render/ui/HUD.tsx` (édition — indicateur cargaison)

**Acceptance criteria (B) :**
- B1. `CargoMarkers` affiche un marqueur au point `cargo.pickup` visible tant que
  `status==="TO_PICKUP"`, et un marqueur au point `cargo.depot` qui s'illumine quand
  `status==="CARRYING"`. Néons acides — « ce qui brille est interactif » (règle guidelines).
- B2. Une fois `DELIVERED`, les deux marqueurs disparaissent (ou passent en gris décor).
- B3. `GameScene` monte `CargoMarkers` et lit `cargo` depuis la ref d'état (même pattern que
  `CourierSprite`) — aucun re-render par frame.
- B4. `HUD` affiche l'état cargaison : « Cargaison : à récupérer / en cours / livrée ».
- B5. Rendu = pure vue : lit `GameState.cargo` ; **aucune règle de jeu** ; n'importe que le
  type `Cargo`, jamais la logique de `deliverySystem`. Pas de nouveau hook nécessaire
  (`useGameLoop` propage déjà `GameState`).

## Lane C — dev-tooling-assets : SKIP

Aucun asset PNG ni config requis : les marqueurs sont des primitives néon R3F. Si un sprite
de cargaison dédié est souhaité plus tard, il fera l'objet d'une story séparée.

---

## Non-chevauchement des lanes

Lane A n'écrit que `src/game/**` ; Lane B n'écrit que `src/render/**`. `gameState.ts`
(champ `cargo`) est écrit par A ; B ne fait que **lire** ce champ via la ref propagée par
`useGameLoop`. Ensembles de chemins disjoints → PARALLEL-SAFE candidat (verdict final :
`senior-architect`). Log du hand-off dans `docs/agent-handoffs.md`.

## Out of scope

Livraison comme condition de victoire (rewire `enemiesToWin`/`LevelConfig`/difficulté) ·
cargaisons multiples ou file de livraisons · avatar joueur mobile / déplacement sur carte ·
pickup/dépôt data-driven par niveau (positions en dur MVP) · nouvel input dédié · assets
sprite cargaison · timer/pénalité de livraison · recrutement de contacts.
