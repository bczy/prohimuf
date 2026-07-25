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
- Le test porte sur le **centre du slot**, pas sur l'étendue du sprite : un ennemi à moitié
  clippé par le bord tire encore. Simple et prévisible, sans constante de tuning.

La règle est appliquée **à la transition, pas à la bouche du canon**. `VISIBLE → SHOOTING`
étant la seule porte d'entrée d'un tir, un ennemi non vu ne peut jamais y entrer : le spawn
de balle dans `tickGameState` n'a besoin d'aucun garde.

**Corollaire à ne pas oublier :** un ennemi peut être gelé _dans_ `SHOOTING` (il tirait, la
caméra a panné). Tout consommateur lisant `SHOOTING` **en continu** plutôt qu'à la
transition doit donc filtrer lui-même sur `isOnScreen`. C'est le cas du grignotage de la
camionnette, filtré explicitement — sans quoi un tireur gelé hors-champ rongerait la jauge
à 8/s indéfiniment.

## Consequences

**Positif**

- Le joueur ne perd plus de vies au profit d'un tireur qu'il ne peut pas voir. Avec les
  balles visées d'ADR-0065, la règle relève de l'équité, pas de la cosmétique.
- Un seul invariant remplace N filtres : « aucune transition d'état hors-champ » couvre
  gratuitement balles, son et animation.
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
- Les slots gelés en `APPEARING`/`VISIBLE`/`SHOOTING` bloquent plus longtemps le spawn d'une
  caisse d'armement (`lootSystem`). Sans effet pratique : les slots sont bien plus nombreux
  que les ennemis d'une vague.
