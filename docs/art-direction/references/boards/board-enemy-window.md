# Board — Enemy at the window

Hunt run by `graphic-references` (Ray). Family: `enemies` flipbook
(`src/game/levels/levelArt.json`). Relayed by the orchestrator to/from Bertrand.

## Hunt context — interview answers (Round 1)

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
   (B, E) et références directement traduisibles en prompt (A, C, D).

## Directions validées (Round 2 — KEEP sur les 5, verdict Bertrand : « Pas mal du tout,

on garde tout ça. » — pas de Round 3, clôture directe)

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

Traduction directe en prompt possible (posture, contraste, ligne).

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

### D — Blek le Rat, le pochoir comme grammaire de silhouette

**Direction la plus prometteuse pour la traduction prompt** — confirmé par le test de
génération (voir synthèse ci-dessous).

- [Blek le Rat — Wikipedia (EN)](https://en.wikipedia.org/wiki/Blek_le_Rat) — pionnier du
  pochoir parisien dès 1981, figures de policiers/CRS en confrontation.
- [Blek Le Rat: The Pioneer of Paris Street Art — Street Art Utopia](https://streetartutopia.com/2024/07/02/blek-le-rat-the-pioneer-of-paris-street-art-and-the-stencil-movement/) —
  panorama de motifs, dont les figures d'autorité en pochoir réduit.

**Licence** : Blek le Rat est un artiste vivant, trait de pochoir identifiable — référence
de lecture pour la _silhouette/pose_ uniquement, jamais de citation directe, aucun asset
dérivé direct (reference ≠ copy).

### E — Spiral Tribe, la figure-sentinelle des flyers

Mood-board périphérique (typo/iconographie HUD), pas la silhouette de l'ennemi lui-même —
déjà cité comme ancrage historique du house style (`docs/art-direction.md` §1).

- [10 ans de free party en Europe avec Spiral Tribe — Mixmag FR](https://mixmag.fr/feature/en-images-10-ans-de-free-party-en-europe-avec-spiral-tribe) —
  corpus photo + flyers.
- [L'esthétique des flyers de free party 1990-2000 — étude ESAD Pyrénées](https://ateliers.esad-pyrenees.fr/web/archives/2024-2025/3dgm-docs/margot/index.php) —
  analyse de l'iconographie récurrente (figures robotiques, formes géométriques, smiley
  Spiral Tribe).

**Licence** : pas de réutilisation d'asset direct envisagée pour cette direction (mood
seulement) ; si un détail périphérique (typo/HUD) en était tiré, revérifier la licence au
cas par cas.

## Test de génération (pipeline réel, post-Round 2)

Généré via `scripts/gen-enemy-types.mjs` → Pollinations/`flux`, `enhance=false`, sprite
256×256, seeds pinnés — 6 previews de l'ennemi-à-la-fenêtre.

- **D (pochoir) + rim néon acide à la fenêtre** tape le plus juste house-style ET
  silhouette-first (§2 loi 3) — direction la plus prometteuse pour la traduction en
  prompt FLUX.
- **C (fanzine/Bazooka)** donne une bonne posture frontale encrée, B&W xerox, cohérente
  avec le style partagé déjà en place dans `enemies.style`.
- **Risque politique sur D levé par le test** : la charge CRS redoutée en Round 2 n'est
  pas ressortie sur les previews — képi + blouson en civil gardent l'archétype
  flic-en-civil de Prohibition (cohérent avec les prompts déjà en place :
  `enemy_sprite`/`enemy_sprite_2`/`enemy_sprite_3`), pas une figure d'émeute identifiable.
  Le risque D reste noté ci-dessus (cloning-a-hand sur le trait Blek le Rat) mais la
  dérive politique/CRS n'est plus un risque actif à surveiller sur cette famille.
- A et B restent au registre attendu : A cadre le placement (fenêtre, popping unique), B
  cadre la typologie de fenêtre réelle (rue Belliard) — ni l'un ni l'autre n'a vocation à
  produire un preview de silhouette de figure.
- E reste un mood-board périphérique, non testé en génération (pas la vocation de cette
  direction).

---

**Hand-off** : `lead-art` curate ce board dans la bibliothèque
(`docs/references/art-culture.md`) — je n'y touche pas moi-même. `art-advisor` et
`concept-artist` peuvent consommer ce board directement pour l'itération de prompt sur la
famille `enemies` (direction D en priorité, C en second).

**VALIDATED by Bertrand (2026-07-18)**
