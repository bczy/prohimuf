# story-boss-tableau-kerb-occlusion — les props de trottoir masqués pendant le tableau boss

> Shard ouvert **rétroactivement** au merge gate de la PR #143. Le correctif avait été
> livré par une session concurrente sur une branche partagée, sans story ni entrée
> d'index — le panel l'a relevé trois passages de suite (BLOQUANT, puis MAJEUR). Bertrand
> a tranché le 29/07 : **on l'assume comme chantier de plein droit** plutôt que de le
> sortir du diff. Ce document lui donne la traçabilité qui lui manquait.

## Le bug

Rapport Bertrand, 2026-07-26, sur Rue Belliard : pendant le tableau figé du Commandant,
un prop de trottoir — le `lamppost` — **peint par-dessus le boss**, lui coupant le torse.

Le tableau boss est un moment de lecture : l'écran se fige, le joueur doit lire la pose du
Commandant pour jouer le QTE. Un élément de décor qui traverse sa silhouette n'est pas une
imperfection cosmétique, il casse la lisibilité de la seule chose que le joueur doit voir.

## La cause

La rangée near a son propre `renderOrder` (`STREET_DEPTH.nearRow.order`, 5.75), indépendant
de celui du tableau boss. Rien ne garantissait l'ordre entre les deux.

## La décision

**Masquer, pas ré-ordonner.** `NearForeground` reçoit une prop optionnelle
`stateRef?: RefObject<GameState>` ; quand un boss QTE est actif, les deux rangées de props
(near et far) passent en `visible = false` :

```ts
const bossActive = isBossQteActive(stateRef?.current.bossQte ?? null);
if (nearRef.current) nearRef.current.visible = !bossActive;
if (farRef.current) farRef.current.visible = !bossActive;
if (bossActive) return;
```

Le `return` anticipé coupe aussi le calcul de parallaxe par frame pendant le tableau — rien
à animer sur des objets invisibles.

Pourquoi masquer plutôt que remonter un `renderOrder` : un ajustement d'ordre se rejoue à
chaque ajout de couche et redevient faux silencieusement. Une porte de visibilité binaire,
adossée à `isBossQteActive`, dit ce qu'elle fait et ne dérive pas.

**La prop est optionnelle par nécessité** : la preview near-foreground de Vitry et tout
appelant sans boucle de jeu vivante ne passent rien — la rangée reste alors visible, comme
avant l'existence de la prop. Aucun appelant existant ne change de comportement.

## Périmètre

| Fichier                               | Change                                           |
| ------------------------------------- | ------------------------------------------------ |
| `src/render/scene/NearForeground.tsx` | +35/−1 — la prop, sa doc, la porte de visibilité |
| `src/render/scene/GameScene.tsx`      | +1 — câblage du `stateRef`                       |

Lane : `dev-r3f-render`. Frontière inchangée : `src/render` lit un état, ne le décide pas ;
`isBossQteActive` est déjà le prédicat public de `src/game/systems/bossQteSystem`.

## État

**open** — visible par le joueur, à relire au passage de panel de la PR #143.

Ce qui a échoué autour de ce correctif, et qui vaut d'être retenu : il a été décrit **deux
fois faussement** dans les shards de la branche — d'abord comme du câblage de télégraphe
de livraison, puis comme une « erreur ESLint pré-existante, 1 ligne ». Les deux descriptions
faisaient passer du code de rendu jamais relu pour du travail déjà gaté. Le correctif ESLint
existe bel et bien (`no-unnecessary-condition` sur `stateRef?.current?.bossQte`), mais il ne
représente qu'une ligne des trente-cinq.
