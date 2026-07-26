# 0071 — Un ennemi hors-champ est gelé : il ne peut pas tirer

- **Status:** Proposed
- **Date:** 2026-07-26
- **Number:** 0071, auto-alloué (aucun `producer` dans la boucle : demande directe de
  Bertrand en session). Vérifié contre les fichiers locaux, `docs/adr/README.md` ET
  `origin/main` — c'est ce contrôle qui a révélé que la branche de départ avait 64 commits
  de retard et que les ADR 0064–0068 existaient déjà en amont. À re-vérifier au merge.

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
   ceux que le joueur ne peut ni voir ni neutraliser.

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
transition doit donc filtrer lui-même sur `isOnScreen`. Les lecteurs continus recensés :

- `stateMachine` — grignotage de la camionnette : **filtré**, sans quoi un tireur gelé
  hors-champ rongerait la jauge à 8/s indéfiniment.
- `EnemySprite` (flash de bouche) et `neonHeatColor` (teinte de chaleur) : **non filtrés**,
  cosmétique assumée. Un ennemi gelé mi-`SHOOTING` rend donc un flash allumé en permanence
  jusqu'au dégel, sans balle en vol (elle a été tirée à la transition, il y a longtemps).

## Consequences

**Positif**

- Le joueur ne perd plus de vies au profit d'un tireur qu'il ne peut pas voir. Avec les
  balles visées d'ADR-0065, la règle relève de l'équité, pas de la cosmétique.
- L'invariant « aucune transition d'état hors-champ » couvre gratuitement le **spawn de
  balle**, qui n'a donc aucun garde propre. Il ne couvre en revanche PAS les lecteurs
  continus de `SHOOTING` : ceux-là sont recensés un par un ci-dessus, dont un filtré
  explicitement dans ce même diff. (Aucun SFX de tir ennemi n'existe — `playSfx` ne sert
  que `shoot` côté joueur et `death` — donc rien à couvrir de ce côté.)
- Le monde ne vit que là où le joueur regarde : panner puis revenir retrouve la scène
  exactement où elle a été laissée, sans reset gratuit du tir en préparation.

**Négatif / à surveiller**

- **Les vagues exigent désormais un balayage de la rue.** Un ennemi gelé ne meurt jamais
  seul, et le passage de vague exige `every(e => e.state === "DEAD")`. Mesuré sur Rue
  Belliard, caméra au repos : vague 1 pose 2 ennemis, l'un cycle à l'écran, l'autre reste
  gelé en `HIDDEN` hors-champ pour toute la durée de l'échantillon. Sur `FACADE_01` c'est
  plus marqué encore — la vague 1 s'y pose _entièrement_ hors-champ (x = −10 et −12, bord à
  ±9). Changement réel de rythme de niveau, accepté en connaissance de cause ; si le
  démarrage à vide devient gênant, l'option est de privilégier les slots visibles au spawn
  — au prix du déterminisme de `spawnWave`, largement épinglé par les tests.
- Panner loin d'une zone y suspend toute menace : c'est un abri sûr, à assumer comme
  propriété de design.
- Un ennemi gelé en `VISIBLE` avec un timer proche de zéro tire dès la première frame où la
  caméra arrive sur lui, sans télégraphe. Jugé mineur (la balle met encore le temps de vol à
  arriver, et l'invulnérabilité d'ADR-0066 absorbe le doublé) ; un délai de grâce reste
  possible si le jeu le réclame.
- **L'objectif « protéger la camionnette » devient gratuit.** Le filtre du grignotage étant
  positionnel, pointer la caméra sur n'importe quelle portion de rue sans ennemi donne
  `shootingCount === 0` pendant toute la fenêtre `DELIVERING` : l'intégrité ne descend
  jamais, `SUCCESS` et le bonus (500) tombent à tous les coups. C'est la conséquence directe
  de la règle, pas un bug — mais elle vide un objectif de son enjeu et mérite un arbitrage
  `game-designer` plutôt qu'un choix implicite. Une piste : faire dépendre le grignotage de
  la proximité du tireur au véhicule plutôt que de la caméra.
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
  d'atteinte : le gel transformerait alors ce cas en blocage dur de progression. Aucun test
  n'épingle `max |slotX| <= fullW/2` — à ajouter.
