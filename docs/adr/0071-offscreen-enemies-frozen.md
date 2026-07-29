# 0071 — Un ennemi hors-champ est gelé : il ne peut pas tirer

- **Status:** Accepted
- **Date:** 2026-07-26 (ratifié le 2026-07-29)
- **Number:** 0071, auto-alloué (aucun `producer` dans la boucle : demande directe de
  Bertrand en session). Vérifié contre les fichiers locaux, `docs/adr/README.md` ET
  `origin/main` — c'est ce contrôle qui a révélé que la branche de départ avait 64 commits
  de retard et que les ADR 0064–0068 existaient déjà en amont. **Re-vérifié au merge :** le
  panel round 2 a trouvé la collision restante (l'ADR portait encore 0069, déjà pris et
  `Accepted` en amont par « Energy-rim signalling contract ») et l'a fermée : renumérotation
  et 80 références en prose recorrigées (`84e782ba`, `9648a6b5`).
- **Ratification :** `senior-architect` (Winston), 2026-07-29, après le panel de merge-gate
  round 2 (4 reviewers, verdict **MERGE**, aucun BLOQUANT/MAJEUR non résolu). Les deux
  conditions posées au round 1 avant ce flip sont tenues : le garde géométrique auto-promis
  est livré (voir §Négatif) et la conséquence « objectif camionnette gratuit » est résolue,
  pas seulement divulguée. Journal : `docs/handoffs/story-offscreen-enemies-frozen.md`.
- **Suite :** [ADR-0072](./0072-delivery-assault-reserved-slots.md) — l'assaut de livraison,
  qui remplace la règle de dégât ayant motivé le §Négatif ci-dessous.

## Context

La façade d'un niveau est nettement plus large que le cadre : `FACADE_01` s'étale sur
~38 unités monde pour un viewport de `VIEW_W = 18`, et les niveaux livrés composent leurs
slots depuis les zones de tuiles (`GameScene.tsx`). À tout instant, **plus de la moitié des
fenêtres est hors-champ**, et le joueur balaie la rue avec le pan caméra
(`cameraPanSystem`).

Jusqu'ici la machine à états de l'ennemi (`tickEnemy`) tournait indépendamment de la
caméra : un ennemi hors-champ traversait `HIDDEN → APPEARING → VISIBLE → SHOOTING` et
tirait normalement. Deux conséquences :

1. Depuis ADR-0065, les balles ennemies **visent le joueur** (`aimBulletVelocity` + jitter)
   au lieu de tomber à la verticale, et le disque de collision est ancré sur la caméra. Un
   tireur invisible est donc une menace réelle, non esquivable et non lisible — le joueur
   perd des vies (fractionnaires depuis ADR-0066) sans jamais voir d'où.
2. Le grignotage d'intégrité de la camionnette (`deliverySystem`,
   `DAMAGE_PER_SHOOTER_PER_SECOND`) compte **tous** les ennemis en `SHOOTING`, y compris
   ceux que le joueur ne peut ni voir ni neutraliser. (État du code au moment de la
   décision : cette règle — et la constante — n'existent plus, voir ADR-0072.)

Bertrand a posé la règle : « si un ennemi n'est pas sur l'écran alors il ne peut pas
tirer », et a tranché la question du comportement de substitution : hors écran, l'ennemi
**ne bouge pas d'état, il se met en pause** — le compte à rebours est gelé.

## Decision

Un ennemi dont le **centre du slot** est hors du rectangle caméra est **entièrement gelé** :
`tickEnemy` retourne l'ennemi inchangé, état tenu et timer en pause.

- Nouveau module `src/game/systems/viewport.ts` : `isOnScreen(point, cameraOffsetX,
cameraOffsetY, viewW, viewH)`. Même cadrage que `crosshairToWorld` — visée et visibilité
  partagent une seule définition de l'écran, pas deux sources de vérité. Bornes inclusives ;
  une coordonnée `NaN` est hors écran (fail-safe).
- `tickEnemy(enemy, delta, onScreen = true)` : le défaut `true` laisse tous les appels
  existants inchangés.
- Le test porte sur le **centre du slot**, pas sur l'étendue du sprite. Simple et prévisible,
  sans constante de tuning — mais le centre n'est pas la limite de ce qui est **affiché** :
  le plane de l'ennemi mesure ~2,1 unités et Three.js ne cull que ce qui est entièrement
  hors cadre, donc une bande de ~1 unité au-delà du bord reste visible à moitié tout en
  étant gelée. Dans cette bande l'ennemi est tuable (`HIT_RADIUS` 0,8) sans pouvoir riposter.
- **`HIT` est EXEMPTÉ du gel**, et cette exception est porteuse. Le flash de coup est une
  réaction que le joueur a déjà payée — le kill est encaissé à la résolution du tir et un
  ennemi en `HIT` n'est plus ciblable (`bulletSystem`) — donc le geler laisserait un cadavre
  à hp 0 incapable d'atteindre `DEAD` : `allDead` ne devient jamais vrai et **les vagues
  cessent de tourner** pour le reste du niveau. Exempter `HIT` ne coûte rien à la règle :
  `nextState("HIT")` vaut `DEAD` ou `VISIBLE`, jamais `SHOOTING`.

La règle est appliquée **à la transition, pas à la bouche du canon**. `VISIBLE → SHOOTING`
étant la seule porte d'entrée d'un tir, un ennemi non vu ne peut jamais y entrer : le spawn
de balle dans `tickGameState` n'a besoin d'aucun garde.

**Corollaire à ne pas oublier :** un ennemi peut être gelé _dans_ `SHOOTING` (il tirait, la
caméra a panné). Tout consommateur lisant `SHOOTING` **en continu** plutôt qu'à la
transition doit donc filtrer lui-même sur `isOnScreen`. Les lecteurs continus recensés **à
la ratification (2026-07-29)** :

- `EnemySprite` (flash de bouche) et `neonHeatColor` (teinte de chaleur) : **non filtrés**,
  cosmétique assumée. Un ennemi gelé mi-`SHOOTING` rend donc un flash allumé en permanence
  jusqu'au dégel, sans balle en vol (elle a été tirée à la transition, il y a longtemps).
- **Plus aucun lecteur continu porteur de règle.** Le diff d'origine en avait un — le
  grignotage de la camionnette dans `stateMachine`, filtré sur `isOnScreen` pour qu'un
  tireur gelé hors-champ ne ronge pas la jauge indéfiniment. ADR-0072 l'a **supprimé** :
  les dégâts comptent les assaillants d'assaut **vivants**, sans terme caméra ni terme
  d'état. `isOnScreen` n'a donc plus qu'un seul appelant côté règles
  (`stateMachine.ts:373`, le gel lui-même) ; l'autre appelant, `useGameLoop.ts:177`, est un
  repère HUD qui lit le **même** prédicat pour ne jamais contredire le gel.

## Consequences

**Positif**

- Le joueur ne perd plus de vies au profit d'un tireur qu'il ne peut pas voir. Avec les
  balles visées d'ADR-0065, la règle relève de l'équité, pas de la cosmétique.
- L'invariant « aucune transition d'état hors-champ » couvre gratuitement le **spawn de
  balle**, qui n'a donc aucun garde propre. Il ne couvre en revanche PAS les lecteurs
  continus de `SHOOTING` : ceux-là sont recensés un par un ci-dessus, et depuis ADR-0072 il
  n'en reste aucun qui porte une règle — seulement deux lecteurs cosmétiques. (Aucun SFX de
  tir ennemi n'existe — `playSfx` ne sert que `shoot` côté joueur et `death` — donc rien à
  couvrir de ce côté.)
- Le monde ne vit que là où le joueur regarde : panner puis revenir retrouve la scène
  exactement où elle a été laissée, sans reset gratuit du tir en préparation.

**Négatif / à surveiller**

- **Les vagues exigent désormais un balayage de la rue.** Un ennemi gelé ne meurt jamais
  seul, et le passage de vague exige `every(e => e.state === "DEAD")`. Mesuré sur Rue
  Belliard, caméra au repos : vague 1 pose 2 ennemis, l'un cycle à l'écran, l'autre reste
  gelé en `HIDDEN` hors-champ pour toute la durée de l'échantillon. Sur `FACADE_01` c'est
  plus marqué encore — la vague 1 s'y pose _entièrement_ hors-champ (x = −10 et −12, bord à
  ±9). Le panel de merge-gate a re-mesuré plus durement : caméra au repos, **3 niveaux sur 4
  n'ont aucun ennemi actif** de tout le niveau (le pan est entièrement joueur, sans
  autoscroll). Changement réel de rythme de niveau, **accepté en connaissance de cause à la
  ratification** ; si le démarrage à vide devient gênant, l'option est de privilégier les
  slots visibles au spawn — au prix du déterminisme de `spawnWave`, largement épinglé par
  les tests. Deux notes pour qui rouvrira le sujet : la réservation d'ADR-0072 vide en plus
  **deux** fenêtres près du point de dépôt sur les niveaux à livraison (assumé là-bas comme
  télégraphe diégétique), et la lecture de rythme au playtest reste à la main du
  `game-designer` — c'est une propriété de design ouverte, pas un défaut de la règle.
- Panner loin d'une zone y suspend toute menace : c'est un abri sûr, à assumer comme
  propriété de design.
- Un ennemi gelé en `VISIBLE` avec un timer proche de zéro tire dès la première frame où la
  caméra arrive sur lui, sans télégraphe. Jugé mineur (la balle met encore le temps de vol à
  arriver, et l'invulnérabilité d'ADR-0066 absorbe le doublé) ; un délai de grâce reste
  possible si le jeu le réclame.
- ~~**L'objectif « protéger la camionnette » devient gratuit.**~~ Le filtre du grignotage
  étant positionnel, pointer la caméra sur n'importe quelle portion de rue sans ennemi
  donnait `shootingCount === 0` pendant toute la fenêtre `DELIVERING` : l'intégrité ne
  descendait jamais, `SUCCESS` et le bonus (500) tombaient à tous les coups.

  > **RÉSOLU dans la même PR (#143), et livré — ne plus lire cette puce comme un défaut
  > ouvert.** L'arbitrage `game-designer` appelé ici a été rendu, gaté (`lead-game-designer`,
  > 2 rounds) et implémenté, et il a supprimé la règle plutôt que de vivre avec :
  > `src/game/systems/deliveryAssault.ts` introduit des assaillants scriptés sur slots
  > réservés, et `deliverySystem` remplace `DAMAGE_PER_SHOOTER_PER_SECOND` par
  > `DAMAGE_PER_ASSAILANT_PER_SECOND` compté sur les assaillants **vivants** — **le terme
  > caméra disparaît entièrement**, et le terme d'état gelable avec lui. Regarder ailleurs ne
  > protège donc plus rien : épinglé par AC2 (aucune position caméra gratuite, 4 niveaux ×
  > `{0, ±9, ±18, 25}`) et par une assertion **structurelle** — le helper de comptage ne prend
  > aucun argument caméra. Décision de design :
  > [`docs/game-design/spec-delivery-van-assault.md`](../game-design/spec-delivery-van-assault.md)
  > (Rev.2) · décision d'architecture :
  > [ADR-0072](./0072-delivery-assault-reserved-slots.md) · traçabilité :
  > [`docs/handoffs/story-delivery-van-assault.md`](../handoffs/story-delivery-van-assault.md).

- Le blocage de slot pour les caisses d'armement (`lootSystem`) dure plus longtemps. La règle
  effective est `state !== "DEAD"` (le garde de co-location), donc un slot gelé en `HIDDEN`
  bloque autant qu'un `VISIBLE` — pas seulement les trois états de la règle d'écart de
  colonnes. Sans effet pratique : les slots sont bien plus nombreux que les ennemis d'une
  vague.
- La marge géométrique est mince et non épinglée : le centre de slot le plus éloigné
  atteignable vaut exactement `fullW/2`, donc la borne **inclusive** d'`isOnScreen` est
  porteuse à cette limite. Mesuré sur les niveaux livrés, vitry est à 39,4586 contre 40 —
  0,54 unité de marge, mangée par le draw-scale 1,08 du mode `single-facade`. Une retouche
  de zones de fenêtres poussant un centre au-delà rendrait son ennemi **définitivement** hors
  d'atteinte : le gel transformerait alors ce cas en blocage dur de progression.
  **Épinglé** depuis : `src/game/levels/__tests__/slotGeometryGuards.test.ts` teste
  `max |slotX| <= fullW/2` sur tous les niveaux livrés (plus le harnais boss-QTE) et fixe en
  plus la marge la plus fine — vitry, 0,54 — sur la géométrie **réellement** reçue par le
  tick, draw-scale `single-facade` compris. Une retouche de zones qui franchit la borne
  rougit CI au lieu de livrer un blocage de progression.
