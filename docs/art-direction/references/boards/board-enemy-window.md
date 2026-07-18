# Board — Enemy at the window

Hunt run by `graphic-references` (Ray). Family: `enemies` flipbook
(`src/game/levels/levelArt.json`). Relayed by the orchestrator to/from Bertrand.

**Status note (2026-07-18, same day as the original close):** this board was
`VALIDATED` once already on direction **D — Blek le Rat pochoir**, generated to
completion. Bertrand was not satisfied with the result and asked for a **reprise from
references** (technical keying/retouch pipeline kept; visual direction reopened). This
file has been **amended in place** (not duplicated) to record both passes: the original
Round 1/2 interview and directions stay below as history, D is marked **ABANDONED**, and
a new reprise hunt (Round 1bis → 3) replaces it with a BD-register production direction.
Final validated set: **A, B, C, E** (unchanged) + the new fused direction **"Noir à
aplats francs, lignée Caniff → Eisner → Toth"**.

## Hunt context — interview answers (Round 1, original pass)

1. **Famille d'assets** : les ennemis — le flipbook `enemies` de `levelArt.json`.
2. **Écran** : in-game, la galerie de tir. Soumis à la loi du glow (`docs/art-direction.md`
   §2 law 1) — pas au régime papier des menus (§2bis).
3. **Ancrage Prohibition** : fidèle au jeu source — les hostiles apparaissent **à une
   fenêtre** d'une façade, popping unique, un hostile à la fois. Pas d'extension hors
   cahier des charges.
4. **Lieu / époque** : **rue Belliard, Paris 18e**, ancrage sur le n°87 (immeuble
   résidentiel), reste du Paris fin de siècle / terrains vagues du nord — cohérent avec
   `stock-rose` = flyer Belliard, playable idx 0 (§2bis.1 du house style).
5. **Mood / registre** : laissé à la hunt (voir directions ci-dessous).
6. **À éviter** : laissé à la hunt — voir notes de risque par direction.
7. **Contrainte de production** : laissée à la main de la hunt — le board mixe mood-board
   (B, E) et références directement traduisibles en prompt (A, C, D à l'époque).

## Directions — Round 2 initial proposition (historique, A/B/C/E toujours valides)

### A — Prohibition (1987), la grammaire de la fenêtre-hostile

Le document source, jamais un objet de style à cloner — la référence de _composition/
placement_.

- [Prohibition — MobyGames, galerie de screenshots](https://www.mobygames.com/game/atari-st/prohibition) —
  la disposition canonique : hostile encadré dans l'ouverture de fenêtre, popping unique,
  silhouette plein cadre.
- [Prohibition — Atari Legend](https://www.atarilegend.com/games/prohibition) — fiche +
  captures additionnelles, angle façade complète (grille de fenêtres, un hostile à la fois).
- [Prohibition — Atari Mania (scans, pub, doc)](https://www.atarimania.com/game-atari-st-prohibition_25261.html) —
  matériel d'époque (jaquette, pub) pour le ton "police procedural pulp".

**Licence** : captures d'un jeu commercial (Infogrames, 1987). Usage strictement
documentaire/interne (fidélité de structure), jamais republié tel quel ni utilisé comme
asset dérivé.

### B — Rue Belliard 18e, l'ancrage réel de la fenêtre

Mood-board d'ancrage géographique/architectural, pas une source de prompt directe.

- [Rue Belliard — Wikipédia FR](<https://fr.wikipedia.org/wiki/Rue_Belliard_(Paris)>) —
  contexte du quartier Grandes Carrières, tracé de la rue.
- [87 rue Belliard — Base Adresse Nationale](https://adresse.data.gouv.fr/base-adresse-nationale/75118_0838_00087) —
  l'immeuble exact cité par Bertrand : construit 1910, 7 étages, proche Porte de
  Clignancourt.
- [Immeuble Deneux, 185 rue Belliard — Wikipédia FR](https://fr.wikipedia.org/wiki/Immeuble_Deneux_au_185_rue_Belliard_%C3%A0_Paris)
  - [photo Flickr](https://www.flickr.com/photos/140051458@N06/34133129644) — typologie de
    fenêtres/bow-windows du même trottoir, repère architectural plus marquant à 200m si un
    visuel plus photogénique est nécessaire.

**Licence** : texte Wikipédia CC-BY-SA ; la photo Flickr est à revérifier au cas par cas
si jamais réutilisée hors mood-board (pas de licence de réutilisation confirmée ici).

### C — Bazooka, le geste graphique punk français

Traduction directe en prompt possible (posture, contraste, ligne). Confirmé par le test
de génération de l'époque : "bonne posture frontale encrée, B&W xerox, cohérente avec le
style partagé déjà en place dans `enemies.style`" — reste un pilier de la nouvelle
direction fusionnée (le traitement xerox/fanzine se combine avec les aplats francs, voir
plus bas).

- [Bazooka (collectif d'artistes) — Wikipédia FR](<https://fr.wikipedia.org/wiki/Bazooka_(collectif_d%27artistes)>) —
  collectif fondé 1974 aux Beaux-Arts de Paris, publié dans _Actuel_ dès 1975.
- [Bazooka, un regard punk — BnF](https://www.bnf.fr/fr/bazooka-un-regard-punk) — page
  institutionnelle, contexte d'exposition et sources d'archive.
- [Bazooka, un regard moderne — Paris Art](https://www.paris-art.com/bazooka-un-regard-moderne/) —
  analyse du style : collages de collages, mépris des règles, production de masse.

**Licence** : Bazooka est un collectif dont certains membres (Kiki Picasso, Loulou
Picasso, Electric Clito) sont des artistes vivants au trait reconnaissable — référence
de lecture (posture, contraste) uniquement, jamais de traits de visage identifiables,
aucun asset dérivé direct (reference ≠ copy).

### D — Blek le Rat, le pochoir comme grammaire de silhouette — **ABANDONNÉE (2026-07-18)**

**Statut : ABANDONNÉE après génération complète.** Motif de l'abandon, remonté par
Bertrand après revue des sprites finaux (pas seulement les previews de test) : **le
rendu FLUX trahit le pochoir sans jamais l'égaler** — le style généré n'atteint pas le
niveau attendu, et la morsure du keying sur le grain de pochoir/spray n'est pas
résolvable à un coût raisonnable dans le pipeline actuel. La leçon retenue pour la
reprise : ne proposer que des traitements dont le rendu FLUX est **structurellement**
propre à la taille sprite (aplats nets, zéro dégradé/texture bruitée), pas seulement
plausible sur le papier.

- [Blek le Rat — Wikipedia (EN)](https://en.wikipedia.org/wiki/Blek_le_Rat) — pionnier du
  pochoir parisien dès 1981, figures de policiers/CRS en confrontation.
- [Blek Le Rat: The Pioneer of Paris Street Art — Street Art Utopia](https://streetartutopia.com/2024/07/02/blek-le-rat-the-pioneer-of-paris-street-art-and-the-stencil-movement/) —
  panorama de motifs, dont les figures d'autorité en pochoir réduit.

**Licence** : Blek le Rat est un artiste vivant, trait de pochoir identifiable — n'a
jamais dépassé le stade de référence de lecture ; aucun asset dérivé n'a été conservé
au-delà de ce test.

### E — Spiral Tribe, la figure-sentinelle des flyers

Mood-board périphérique (typo/iconographie HUD), pas la silhouette de l'ennemi lui-même —
déjà cité comme ancrage historique du house style (`docs/art-direction.md` §1). Toujours
valide, inchangé par la reprise.

- [10 ans de free party en Europe avec Spiral Tribe — Mixmag FR](https://mixmag.fr/feature/en-images-10-ans-de-free-party-en-europe-avec-spiral-tribe) —
  corpus photo + flyers.
- [L'esthétique des flyers de free party 1990-2000 — étude ESAD Pyrénées](https://ateliers.esad-pyrenees.fr/web/archives/2024-2025/3dgm-docs/margot/index.php) —
  analyse de l'iconographie récurrente (figures robotiques, formes géométriques, smiley
  Spiral Tribe).

**Licence** : pas de réutilisation d'asset direct envisagée pour cette direction (mood
seulement) ; si un détail périphérique (typo/HUD) en était tiré, revérifier la licence au
cas par cas.

## Test de génération (pipeline réel, post-Round 2 original — archive)

Généré via `scripts/gen-enemy-types.mjs` → Pollinations/`flux`, `enhance=false`, sprite
256×256, seeds pinnés — 6 previews de l'ennemi-à-la-fenêtre.

- Sur les previews de test, **D (pochoir) + rim néon acide** avait semblé la direction la
  plus prometteuse et **C (fanzine/Bazooka)** une bonne alternative. **Ce jugement de
  preview ne s'est pas confirmé à la génération complète** — voir l'abandon de D
  ci-dessus. C reste valide et intègre la nouvelle direction fusionnée.
- A et B restent au registre attendu : A cadre le placement (fenêtre, popping unique), B
  cadre la typologie de fenêtre réelle (rue Belliard) — ni l'un ni l'autre n'a vocation à
  produire un preview de silhouette de figure.
- E reste un mood-board périphérique, non testé en génération (pas la vocation de cette
  direction).

---

## Reprise hunt — registre BD (2026-07-18)

Rescope demandé par Bertrand après l'abandon de D : même famille, même cadre (`enemies`,
fenêtre-hostile, Belliard, Paris fin de siècle) — **on ne change que le registre
graphique de la silhouette**, en tirant la leçon de l'échec pochoir.

### Hunt context — interview answers (Round 1bis)

1. **Motif du rejet de D** : (b)/(c) — le rendu FLUX **trahit le pochoir sans jamais
   l'égaler**. Contrainte dure retenue : ne proposer que des traitements que FLUX rend
   proprement à la taille sprite (silhouette nette, détourable).
2. **Périmètre** : inchangé — famille `enemies`, fenêtre-hostile, Belliard, Paris fin de
   siècle. Seul le registre graphique bouge.
3. **Acquis confirmés** : A, B, C, E gardés tels quels ; seule D est éliminée.
4. **Direction demandée** : la BD — couvrant le spectre franco-belge (polar noir N&B) et
   comics US (noir/crime N&B haut-contraste).
5. **Cause de l'échec pochoir** : le traitement graphique, pas la pose/silhouette (jugée
   correcte) — on garde l'approche pose, on change le médium.
6. **Arbitrage lisibilité/ambiance** : 50/50.
7. **Contrainte de production** : laissée à la main de la hunt (mix prompt-traduisible /
   mood-board).

### Round 2 — propositions BD (F, G, H, I, J)

#### F — Tardi / Nestor Burma, le polar franco-belge parisien — **DROP (confirmé)**

- [Bibliographie Tardi — Bedetheque](https://www.bedetheque.com/auteur-141-BD-Tardi-Jacques.html) —
  série Nestor Burma (1982-2000), polar noir dessiné dans les rues réelles de Paris.
- [Nestor Burma — série, Bedetheque](https://www.bedetheque.com/serie-28-BD-Nestor-Burma.html)
- [Avec Nestor Burma, Tardi célèbre Paris — France Info](https://www.franceinfo.fr/culture/bd/jacques-tardi/avec-nestor-burma-tardi-celebre-paris-et-son-20e-arrondissement-dans-son-nouvel-album-du-rififi-a-menilmontant_6892757.html)

**Motif du DROP** : le trait Tardi vit de hachures denses et d'aplats de gris crayonnés —
même piège structurel que le pochoir. Confirmé par les previews FLUX (le "piège
hachures/gris" s'est reproduit). Trait signature très identifiable, auteur vivant.

#### G — Sin City / Frank Miller → recentré sur la lignée technique Caniff/Eisner — **DIG, fusionné dans la direction finale**

Voir la synthèse post-refine ci-dessous ; conservé comme repère d'intensité de contraste
uniquement, jamais nommé dans un prompt.

#### H — Alex Toth, l'économie de trait — **DIG, favori (++), fusionné dans la direction finale**

Voir la synthèse post-refine ci-dessous.

#### I — Pulp crime US 1950s (EC Comics / Crime SuspenStories) — **DROP (anachronisme)**

- [Crime SuspenStories — Wikipedia](https://en.wikipedia.org/wiki/Crime_SuspenStories) —
  anthologie crime EC 1950-1955, esthétique film noir.
- [EC Comics — Wikipedia](https://en.wikipedia.org/wiki/EC_Comics)

**Motif du DROP** : anachronisme frontal — costumes/voitures/typo américaines 1950s n'ont
rien à faire dans un Paris 1998, malgré la parenté de ton avec le matériel Prohibition
("police procedural pulp", cf. direction A).

#### J — Baru, le noir urbain français — **DROP du traitement de figure, gardé en mood périphérique**

- [Baru — Wikipédia FR](https://fr.m.wikipedia.org/wiki/Baru) — auteur français, classe
  ouvrière/immigration, banlieues fin de siècle (thématiquement proche de Belliard/rave).
- [Bella ciao, tome 1 — Babelio](https://www.babelio.com/livres/Baru-Bella-ciao-tome-1/1253132) —
  confirme la technique : "plus d'une trentaine de pages réalisées en lavis gris".
- [Le noir, la couleur et lavis — Bedetheque](https://www.bedetheque.com/serie-3123-BD-Noir-la-couleur-et-lavis.html) —
  le lavis comme catégorie technique à part, ton continu.

**Motif du DROP (traitement)** : vérifié sur planches réelles — Baru travaille **au
lavis** (encre diluée, ton continu), pas en aplats francs. Même famille de piège que
Tardi/pochoir : un ton continu que FLUX approxime en bruit gris, imkeyable proprement
contre un fond chroma. **Décision de Bertrand : pas de retrait complet** — J reste une
**note mood périphérique** (thématique banlieue/immigration/fin de siècle, même statut
que E), mais n'entre plus dans le traitement de figure ni dans les clauses de prompt.

### Round 3 — refine (G, H, J) et synthèse finale

**J tranché** : lavis confirmé rédhibitoire pour le rendu de figure (voir ci-dessus) —
statut final = mood périphérique seulement.

**G recentré** : la puissance des aplats noirs francs est remontée à sa source technique
plutôt qu'à la signature Miller — moins verrouillée en IP, plus ancienne.

- [Milton Caniff — Wikipedia](https://en.wikipedia.org/wiki/Milton_Caniff) — "Caniff
  lighting" / chiaroscuro développé avec Noel Sickles dans les années 1930 : masses
  noires au pinceau, plume pour les bords de lumière — origine technique du procédé.
- Spotting blacks chez Will Eisner (_The Spirit_) — silhouette posée en noir plein contre
  l'espace négatif (sources croisées en Round 2 du reprise hunt).

**H creusé (favori de Bertrand)** : la référence la plus précise identifiée est **Alex
Toth dessinant lui-même les deux premiers récits de _Torpedo 1936_ (1981-82)** — un
homme de main en trench-coat et chapeau, exactement le registre "figure d'autorité/
menace en civil" cherché pour l'ennemi, avant que Jordi Bernet ne reprenne le titre.

- [Alex Toth's Torpedo 1936: Masterclass in Mood and Composition — Comics Odyssey](https://comicsodyssey.substack.com/p/alex-toths-torpedo-1936-masterclass) —
  analyse dédiée de ces deux récits, composition et pose.
- [Torpedo (comics) — Wikipedia](<https://en.wikipedia.org/wiki/Torpedo_(comics)>) —
  confirme la paternité Toth sur les deux premiers récits (1981), Bernet ensuite.
- [Alex Toth — Wikipedia](https://en.wikipedia.org/wiki/Alex_Toth) — repère biographique,
  principe d'économie de trait ("tear it down to its essence using incredibly bold
  blacks and whites").

**Fusion validée par Bertrand** : G et H ne sont pas deux pistes concurrentes — Toth est
l'héritier direct de la lignée Caniff → Sickles → Eisner que G documente. Une seule
direction de production en résulte.

---

## Directions finales retenues (post-reprise, validées)

- **A** — grammaire de composition Prohibition (fenêtre, popping unique).
- **B** — ancrage réel rue Belliard.
- **C** — geste Bazooka/fanzine encré (traitement xerox déjà testé et concluant).
- **E** — mood Spiral Tribe (typo/HUD périphérique).
- **J (dégradé)** — mood périphérique uniquement (thème banlieue/fin de siècle), **hors
  traitement de figure**.
- **F, I** — DROP complet (hachures/gris signature Tardi ; anachronisme pulp US 1950s).

### Direction de production — « Noir à aplats francs, lignée Caniff → Eisner → Toth »

**La direction de traitement de la figure `enemies` retenue pour la production.**

- Masses noires dures, espace négatif contrôlé, **zéro gris, zéro hachure, zéro
  dégradé/wash** — le critère qui a coulé pochoir/Tardi/Baru.
- Silhouette d'autorité menaçante : chapeau à large bord ombrant les yeux, col de
  trench-coat relevé, arme tenue à hauteur de hanche, posture figée avant tir —
  ancrée sur les pages de _Torpedo 1936_ dessinées par Toth (1981-82).
- **Décrite en vocabulaire technique, jamais en noms propres dans le prompt** —
  anti-clonage : "bold flat black ink masses with hard-edged silhouette, high-contrast
  noir ink shading, no gradient, no crosshatching, no midtone grey, minimal interior
  linework, sharp negative-space cutout".
- Se combine sans conflit avec C (le halftone xerox dégrade des noirs pleins, pas des
  gris) et avec A/B pour l'ancrage 1998 Paris (que le sprite figure-only ne porte pas
  lui-même — la fenêtre/façade est rendue par le jeu).

**Contrainte de production ferme actée** : le **sprite est la figure seule** (pas de
décor/barreaux/fenêtre dans le sprite — la fenêtre est rendue par le jeu) ; génération
sur fond chroma, pipeline de keying/retouche existant conservé tel quel ; **FLUX-safe**
signifie aplats francs uniquement.

**Licence / reference ≠ copy** : Milton Caniff (mort en 1988) et Will Eisner (mort en 2005) et Alex Toth (mort en 2006) sont tous cités en **vocabulaire technique de
composition** (masses noires, espace négatif, économie de trait) — jamais un nom cité
dans un prompt, jamais un trait de visage ou une case identifiable reproduite, aucun
asset dérivé direct. Le fait que les trois soient décédés ne lève pas le droit d'auteur
sur leurs œuvres (toujours protégées) — la règle reference ≠ copy s'applique
identiquement à un artiste vivant ou non.

---

**Hand-off** : `lead-art` curate ce board (version amendée) dans la bibliothèque
(`docs/references/art-culture.md`) — je n'y touche pas moi-même. `concept-artist`
consomme la direction fusionnée pour écrire `enemies.style` en "aplats francs" (voir
clause de prompt ci-dessus) ; `art-advisor` reste consultée sur l'ancrage 1998 Paris (A/B).

**VALIDATED by Bertrand (2026-07-18)** — amendement en place du même board suite à la
reprise ; D formellement ABANDONNÉE, direction de production finale = « Noir à aplats
francs, lignée Caniff → Eisner → Toth ».
