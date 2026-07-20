# Prompt draft — niveau-final venue backdrop : « l'Éden » (ancien dancing)

Craft per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md). Sujet : la façade/backdrop
du niveau final (story 2, `story-boss-niveau-final-live`) — l'intérieur du **grand dancing
désaffecté l'Éden**, la salle de la teuf du siècle du 31/12/1999, contre laquelle se joue le
tableau QTE du Commandant.
Canon venue : [`spec-niveau-final-fiction.md`](../../game-design/spec-niveau-final-fiction.md) §1
(l'Éden, ancien dancing). Registre décor : advisory `art-advisor` (Estelle) §7.
**Statut : DRAFT — READY-FOR-STRUCTURE ; game-graphist PRE-PROD PASS puis lead-art PROMPT GATE requis
avant tout commit/génération. Chaîne identique aux 9 du Commandant.**

## Décision de structure — je ne touche PAS `levels[]` dans levelArt.json (concurrent-edit)

`dev-tooling-assets` travaille **en ce moment** dans `src/game/levels/levelArt.json` — risque de
conflit d'édition. Je porte donc les strings ici, marquées **READY-FOR-STRUCTURE**. Pattern à suivre
(calqué sur les entrées `levels[]` existantes belliard/stalingrad/vitry) :

- Chaque niveau porte un objet `prompts` avec des **strings autonomes** (le bloc `levels` n'a **pas**
  de `opening`/`style` partagé comme vehicles/enemies — chaque layer est un prompt complet envoyé au
  générateur de façade).
- Contrat lint (`check-art-prompts.mjs` → `checkLevels`) : chaque prompt **non-vide**, et le layer
  **`foreground` DOIT contenir la phrase `magenta chroma-key`** (le pipeline de découpe la keye). **Pas
  de word-band ni de budget-négation machine-vérifiés sur `levels`** (contrairement aux autres
  familles) — je les tiens quand même à la main comme discipline craft.
- `size` : les façades utilisent le `facade` global (1280×768) ; `dev-tooling` câble ids/paths/`size`/
  `backdrop` mode. Chemin attendu (narrative wiring flag B, ADR-0023) :
  `assets/levels/niveau-final/facade.png`.

> **Ce que `dev-tooling-assets` ajoute (pas moi) :** l'entrée `levels[]` (`id` `niveau-final`,
> `name`/`label`, `backdrop`/`parallax`/`ironwork`/`nearForeground`/`windowGrid`), le `size`, et le
> choix de jeu de layers. Moi je porte **les strings `prompts.*`** + rationale.

## Registre — l'intérieur d'un dancing 1900-30 déchu (Estelle §7), PAS warehouse, PAS horror

- **Dancing/salle de bal déchue** : parquet à danser rapiécé, corniches et moulures dorées écaillées,
  hautes fenêtres cintrées condamnées qui laissent fuir la lumière, bord de mezzanine/balcon.
- **Superposition graffiti/pochoirs + flyers scotchés** PAR-DESSUS les vieilles moulures **à hauteur
  d'homme** (axis 1 de `board-belliard-decor-v2`), le haut des murs **plus calme** — la fête a colonisé
  le bas du mur, pas les plafonds.
- **PAS de registre warehouse-industriel 2010s** (pas de béton nu/structure métallique/néons de rave
  génériques bakés) ; **PAS de décrépitude horreur** (pas de ruine/pourriture/toile d'araignée) — c'est
  une **grandeur fanée**, élégante et morte, pas un décor d'épouvante.

## Contrainte de composition binding (Karim advisory 6 + restatement Nico, loi du gate)

Le backdrop doit :

1. **Cadrer l'ancre boss `{0,-5}` SANS dead sky-gap** — le mur remplit le cadre **du plafond au sol**,
   aucune bande de ciel vide derrière le boss (précédent Vitry x:9.9 : une façade qui ne remplissait
   pas laissait un trou de ciel derrière le boss). → clause `the back wall filling the frame ceiling
to floor`.
2. **Laisser une position de lustre lisible et shootable en `{0.2,1.5}`** — le lustre **shootable** est
   le prop `lustre` render-side (décorProp armé, famille Commandant, déjà FAMILY PASS), **PAS baké dans
   la façade**. La façade laisse un **point d'accroche de plafond propre** (rosace/crochet nu) haut, là
   où le lustre se pose ; aucun lustre baké (sinon doublon + faux affordance). → clause `a bare ceiling
hook high where a chandelier once hung`.
3. **Le mur d'enceintes présent en set-dressing qui NE lit PAS comme un affordance shootable en V1** —
   le `mur d'enceintes` est le **2ᵉ décorProp RÉSERVÉ** (promotion `decorProps[]` déférée, spec
   game-designer §2-A ; Karim : ne doit pas lire comme false-affordance interactif en V1). Je le rends
   **baké plat et sombre dans la façade**, bas dans un coin — donc **sans liséré néon render-side**,
   donc **non-interactif par la loi du glow** (§2 loi 1 : seul ce qui a un rim render-side est
   interactif). C'est la garantie la plus forte contre le false-affordance. → clause `plywood speaker
cabinets low in one corner as flat set-dressing`.

> **Prop enceintes — RULING Serge (PRE-PROD, CONFIRMÉ) : bake-in-facade, alternative sprite-autonome
> REJETÉE.** Deux raisons production par-dessus l'anti-false-affordance : (1) le layer `facade` est un
> backdrop **composité directement, jamais chroma-keyé** (seul `foreground` porte l'exigence
> `magenta chroma-key`) → les enceintes bakées ne sont jamais découpées ni câblées à un render-path
> per-object, donc **aucun chemin de code ne peut leur donner un rim glow** plus tard (contrairement à
> un sprite/decorProp discret) ; (2) un `speaker_wall` autonome à re-keyer sur noir **rouvrirait le
> risque de trou grande-masse-near-black** ([S10] de la passe Commandant) pour zéro gain (ce venue n'a
> pas besoin du prop interactif). Le sprite `speaker_wall` autonome (famille Commandant, PASS) reste
> l'**asset de promotion** si un futur venue le rend interactif ; en V1 il n'est PAS rendu — le mur est
> baké set-dressing dans cette façade.

## Layers

Vénue **INTÉRIEURE** → les layers extérieurs `sky`/`street` des niveaux-rue **tombent** (pas de ciel :
c'est justement ce qui satisfait « no dead sky-gap » — la façade porte elle-même le plafond/les
corniches). Je livre `facade` (porteur) + `foreground` (requis-lint : magenta chroma-key) ; +1 layer
`ceiling` **optionnel** au cas où le générateur exige un slot haut séparé (sinon la façade le couvre).

### `facade` (porteur) — READY-FOR-STRUCTURE

> front-elevation interior of a derelict 1930s parisian dancing-hall ballroom, the back wall filling
> the frame ceiling to floor, a row of exactly 5 tall arched windows, evenly spaced and identical in
> size, each a dark recessed cavity, their lower panes crudely boarded, the upper arch left open, warm
> light spilling through, peeling gilded cornices high up, a mezzanine balcony with an ornate cast-iron
> balustrade, a patched sprung-parquet floor below, party stencils and taped rave flyers layered over
> the lower mouldings at arm height, the upper walls calmer, plywood speaker cabinets low in one corner
> as flat set-dressing, a bare ceiling hook high where a chandelier once hung, dim warm night light,
> faded decayed grandeur

Rationale (clause → ce que ça verrouille) :

- `front-elevation interior of a derelict 1930s parisian dancing-hall ballroom` → grammaire Prohibition
  (façade frontale plate, « poster not diorama ») + le venue canon (**ancien dancing** l'Éden), registre
  1900-30 d'Estelle. « dancing-hall ballroom » exclut par la forme le warehouse-industriel.
- `the back wall filling the frame ceiling to floor` → **contrainte 1** : aucun dead sky-gap derrière le
  boss `{0,-5}` (positif — « filling … ceiling to floor », pas « no sky », 0 négation).
- `a row of exactly 5 tall arched windows, evenly spaced and identical in size, each a dark recessed
cavity, their lower panes crudely boarded, the upper arch left open, warm light spilling through` →
  les **positions de pop** de la galerie pré-boss (grille Prohibition) + le tell Estelle « fenêtres
  cintrées condamnées », **corrigé par Serge [E3]+[E4]** :
  - **[E4] — fenêtre OCCUPABLE, pas une planche pleine.** « boarded » seul lisait comme une surface
    opaque scellée → (a) signal faible pour le harness de détection de fenêtres (`align-windows.mjs` :
    il snappe les zones sur des blobs chaud-lumière / cavités sombres réelles ; une planche uniforme ne
    lui donne rien) et (b) un flic qui pop DANS une planche scellée = silhouette cassée (§2 loi 3, FAIL,
    appliqué au backdrop). Fix positif : on ne scelle que le **bas** — `each a dark recessed cavity,
their lower panes crudely boarded, the upper arch left open, warm light spilling through` → chaque
    fenêtre reste une cavité sombre/lumineuse détectable ET une ouverture qu'un flic occupe dans l'arche
    haute, les planches gardant le read « condamnées » comme détail de décrépitude partielle.
  - **[E3] — count + evenness (formule belliard éprouvée).** `exactly 5 … evenly spaced and identical
in size` reprend la clause de régularité que belliard portait (« exactly 7 identical evenly
    spaced »). **Pourquoi 5 (et pas 7 comme belliard) :** les arches de grande salle de bal sont
    **larges** (≠ étroites fenêtres françaises d'immeuble), donc 5 remplissent un **seul mur 1280×768**
    avec des **piliers de maçonnerie visibles entre elles** — ce qui **atténue directement le risque
    [E5] de fusion** (belliard `bb6404f` : deux fenêtres trop serrées ont fait fusionner les rails).
    Belliard = 7 fenêtres étroites sur un troncon LARGE pané ; l'Éden = 5 arches larges sur un cadre
    unique statique, l'équivalent period-true et merge-safe. → **dev-tooling cale `windowGrid.cols = 5`
    sur ce count** (évite le mismatch grille-rigide-vs-art de belliard `8933c03`).
- `peeling gilded cornices high up` → dorures écaillées (Estelle) ; grandeur fanée, pas ruine horreur.
- `a mezzanine balcony with an ornate cast-iron balustrade` → bord de mezzanine/balcon (Estelle) ;
  ferronnerie = cohérent avec le foreground.
- `a patched sprung-parquet floor below` → parquet à danser rapiécé (Estelle, le tell « dancing »).
- `party stencils and taped rave flyers layered over the lower mouldings at arm height, the upper walls
calmer` → **axis 1 board-belliard-decor-v2** : la fête colonise le bas à hauteur d'homme, le haut reste
  calme (lisibilité + vérité).
- `plywood speaker cabinets low in one corner as flat set-dressing` → **contrainte 3** : enceintes bakées
  plates, basses, en coin = set-dressing sans rim = non-interactif (loi du glow), pas de false-affordance.
- `a bare ceiling hook high where a chandelier once hung` → **contrainte 2** : point d'accroche propre en
  haut pour le lustre shootable render-side `{0.2,1.5}` ; **aucun lustre baké** (évite doublon + faux
  affordance).
- `dim warm night light, faded decayed grandeur` → nuit clandestine (§1 identité), grandeur fanée — pas
  horror-decay, pas néon-rave générique baké.

### `foreground` (requis-lint : `magenta chroma-key`) — READY-FOR-STRUCTURE

> row of ornate cast-iron ballroom balustrade railings, thick black silhouettes seen up close, evenly
> spaced, isolated on a solid flat uniform bright magenta chroma-key background, fully magenta empty
> surroundings, sharp silhouette edges, pixel art, no wall, no floor

Rationale :

- `row of ornate cast-iron ballroom balustrade railings … thick black silhouettes seen up close` → le
  near-foreground par-dessus lequel le viseur vise (calqué sur les foregrounds rue), version intérieure
  = la balustrade du balcon/mezzanine (cohérent avec la corniche/ferronnerie de la façade).
- `isolated on a solid flat uniform bright magenta chroma-key background, fully magenta empty
surroundings, sharp silhouette edges, pixel art` → **discipline de découpe** identique aux foregrounds
  rue (magenta chroma-key = phrase requise par `checkLevels`).
- `no wall, no floor` → isolation (empêche le générateur d'attacher un mur/sol) — **adapté intérieur** :
  la famille rue finit « no building, no wall, no sky » (3 négations) ; ici « no wall, no floor » (2)
  colle mieux à un intérieur **et** rentre dans le budget ≤2 (déviation family assumée, isolation
  identique).

### `ceiling` — OPTIONNEL (uniquement si le générateur exige un slot haut séparé)

> cracked peeling plaster ceiling of a derelict ballroom with faded gilt rosettes and dark water stains,
> dim and empty, a single bare hook high where a chandelier once hung

- À n'utiliser **que** si la structure niveau exige un layer haut distinct (la `facade` porte déjà le
  plafond/corniches ; par défaut ce layer **tombe**). Garde le point d'accroche propre (contrainte 2),
  aucun lustre baké.

## Comptes (assemblés à la main contre les règles du bloc `levels`)

| layer            | mots | négations | notes contrat                                                                                                                                                                                                                     |
| ---------------- | ---- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `facade`         | 114  | 0         | après [E3]+[E4] (clause fenêtre count+evenness+occupable, +22 mots) ; **sous** le plafond dur 120 ; chaque clause load-bearing (registre Estelle + 3 contraintes de compo + la rangée de pop mécanique). `levels` non word-linté. |
| `foreground`     | 38   | 2         | PASS-AS-IS Serge [E6] ; porte `magenta chroma-key` (requis `checkLevels`) ; ≤2 négations.                                                                                                                                         |
| `ceiling` (opt.) | 29   | 0         | PASS-AS-IS Serge (si utilisé) ; optionnel.                                                                                                                                                                                        |

- **Pas de style-tail** sur `levels` (chaque string est autonome) — donc pas de contradiction tail-vs-
  sujet à gérer ici (contrairement au bloc `boss`).
- **Aucune couleur/hue-néon bakée** dans la façade : le décor est en valeur (nuit chaude, dorures
  fanées) ; le néon acide reste render-side (loi du glow), et rien d'interactif n'est baké.

## PRE-PROD Serge — statut (2026-07-20)

- `facade` PASS-WITH-CORRECTION → **[E3]+[E4] intégrés** (rangée de fenêtres : count `exactly 5` +
  `evenly spaced and identical in size`, ouvertures dé-scellées — arche haute ouverte, seul le bas
  planché). `foreground` PASS-AS-IS [E6], `ceiling` PASS-AS-IS. Contraintes de compo 1/2/3 CONFIRMÉES ;
  **contrainte 3 (enceintes) : bake-in-facade RULED** par Serge (voir la note prop enceintes ci-dessus).
- **[E5] — merged-railing (post-art, PAS un fix de prompt)** : belliard `bb6404f` a vu deux fenêtres
  trop serrées faire déborder/fusionner le dessin des rails (largeur fixe > écart de meneau). Ici la
  façade bake AUSSI une balustrade fer forgé (mezzanine) ET le `foreground` porte un motif ferronnerie
  quasi-identique → si les arches sortent serrées dans l'art généré, le même risque de fusion
  s'applique. **C'est de la géométrie de rail render-side vs. positions-x de zones détectées** (comme
  sur belliard, `align-windows.mjs` lineage), **à vérifier au check d'alignement post-art / au gate**,
  pas dans le prompt. Le count `5` (arches larges, piliers visibles) est mon atténuation côté prompt.

## Reste à trancher par le gate (Nico PROMPT GATE)

1. **PASS / corrections** sur `facade` (corrigée) + `foreground` + `ceiling` (si retenu).
2. **Lustre `{0.2,1.5}`** : confirmer que la façade laisse la zone d'accroche assez propre/haute pour
   que le lustre render-side shootable lise, sans dead-gap autour (contrôle compo Nico).
3. **[E5] alignment** : au check post-art, vérifier que les 5 arches ne fusionnent pas (rails/meneaux)
   et que `windowGrid.cols = 5` snappe propre sur les cavités détectées.
4. **Structure** (`dev-tooling-assets`) : entrée `levels[]` `niveau-final`, jeu de layers (drop
   sky/street intérieur ?), `size`, **`windowGrid.cols = 5`** calé sur la rangée d'arches, chemin
   `assets/levels/niveau-final/facade.png` (narrative wiring flag B).
