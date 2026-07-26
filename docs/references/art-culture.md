# Références — Direction artistique & culture (art crew)

Pour `art-advisor`, `concept-artist`, `lead-art`, `game-graphist`. Style maison :
« fanzine photocopié N&B + néon acide », Paris 1998. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/art-direction.md` — **la bible art** (le gate juge contre elle).
- [`docs/art-direction/references/`](../art-direction/references/) — références curatées et **license-noté** (le vrai dépôt : on étend là, via `lead-art`).
- `docs/art-direction/prompt-drafts.md` — brouillons de prompts en cours.
- ADR `docs/adr/0010`, `0013`, `0014`, `0019` — pipeline art, cutout, intégrité sprite, cleanup halo.
- ADR `docs/adr/0044` (kontext ad-hoc) et `docs/adr/0043` (boucle de promotion
  validée) — pipeline de référence kontext.

## Une bibliothèque, deux voies d'entrée (ADR-0043 §1 et §"Coexistence")

La bibliothèque de références se lit comme **une seule bibliothèque avec deux
intakes**, toutes deux curatées par `lead-art` :

- **Externe** — les boards validés de `graphic-references` (Ray) sous
  [`docs/art-direction/references/boards/`](../art-direction/references/boards/)
  (mood/culture/époque/technique) : informent **comment une famille doit lire**
  avant qu'un seul pixel n'existe. `lead-art` les curate ici même, dans ce fichier.
- **Interne** — [`references/approved/`](../../references/approved/) : un pixel
  **déjà généré et déjà validé** (verdict `PROMOTE` du gate `lead-art`), promu en
  **hero** qui style-locke ses siblings à la génération suivante via `kontext`
  `image=`. Registre humain : [`HEROES.md`](../../references/approved/HEROES.md) ;
  registre machine (le seul lu par les générateurs) :
  [`heroes.json`](../../references/approved/heroes.json) ; mécanique de promotion
  network-free : `scripts/promote-hero.mjs` ; garde-fou CI permanent :
  `scripts/check-hero-wiring.mjs`. Voir
  [`references/README.md`](../../references/README.md) pour la distinction
  scratch (`references/`, éphémère) vs `approved/` (permanent, superseded jamais
  supprimé).

Un lecteur de l'un des deux doit pouvoir retrouver l'autre — pas deux registres
concurrents.

## Références externes (ancrage, pas dump — la curation vit dans le dossier interne)

- [Prohibition (1987) — MobyGames](https://www.mobygames.com/game/prohibition/) — la source : façade fixe, le jeu lit comme une affiche, pas un diorama (captures d'écran d'époque Atari ST incluses).
- [Black Forest Labs — FLUX](https://github.com/black-forest-labs/flux) — comportement du modèle qui exécute les prompts (silhouette-first, positivement décrit).

## Repères période (à valider par `art-advisor`)

- Flyers/fanzines free-party 90s : générations de photocopie, collage cut-and-paste, trames de demi-teintes, **une** couleur d'accent sur papier bon marché.
- Mobilier urbain & véhicules Paris 1998 : Twingo mk1, C25/Master, mobs 103/Ciao, Decaux, lampes sodium.

## Décor de niveau — façade Rue Belliard (board VALIDÉ 2026-07-18)

Curé depuis `docs/art-direction/references/boards/board-belliard-decor.md` (hunt
`graphic-references`, validé Bertrand). Registre **crade-documentaire** : grain photocopie,
N&B contrasté, sale/réel — le néon reste la couche d'accent du style maison, **pas** la note
dominante de cette façade. Le layer graphique free-party (flyers, pochoirs) est **déjà banké**
en `docs/art-direction/references/LICENSES.md` §2 : on ne le re-cure pas ici, il n'entre sur ce
décor que **collé/peint sur la façade** (flyer agrafé sur un rideau, pochoir sur un mur).

- [Paris Tonkar (Ben Yakhlef & Doriath, Massot, 1991) — scan Internet Archive](https://archive.org/details/paris-tonkar-4-ans-de-graffitis) — livre fondateur du graffiti parisien : photo-doc N&B des murs et **rideaux de fer** tagués 1987–91 ; référence directe de densité de lettrage et de texture pour les rideaux de la devanture Belliard. **Licence : livre sous droits (réédition Massot 2024) — étude/référence seulement, jamais scanner-coller dans un asset** (même régime que _Prohibition_, LICENSES §1). Datation : l'« Opération Murs propres » de Tibéri (1999) a effacé ce look ; en 1998 il est encore vivant — soit juste avant le nettoyage.
- [Wikipédia FR — Rue Belliard (Paris)](<https://fr.wikipedia.org/wiki/Rue_Belliard_(Paris)>) — rue de 1868, 18e arrondissement, longe l'ancienne Petite Ceinture ; ancre la façade dans le tissu ordinaire artisan/résidentiel du 18e bordant du ferroviaire à l'abandon, pas le Paris touristique. Garde-fou : l'immeuble Deneux (185 rue Belliard, 1913, façade carrelée) est le **seul** ornement de la rue — inspiration massing/carrelage seulement, **jamais de ressemblance directe** (bâtiment réel, protégé).
- [Wikipédia FR — Billy la Banlieue](https://fr.wikipedia.org/wiki/Billy_la_Banlieue) — jeu Amstrad CPC 1986 (Loriciels), un loubard qui écume le métro parisien ; cousin français de la génération console de _Prohibition_, touchstone de **mood** pour la silhouette loubard/banlieue et la vie de rue RER. **Licence : jeu commercial sous droits — évoquer le mood seulement, jamais tracer sprites/screens (LICENSES §1).** Décalage de décennie (1986 vs 1998) : garde-fou anti-anachronisme « trop rétro » autant que « trop moderne ».

> **Écarté à la curation** (redondant ou non pérenne) : archives de flyers rave (Dizonord,
> Printed Matter — **déjà en LICENSES §2**) ; banques stock commerciales Alamy/Getty et archive
> Le Parisien de la direction D2 (mood-only, liens non pérennes) — le **pare-feu anachronisme**
> qu'elles servent (typo d'enseigne, silhouettes de voitures période, signalétique RER/métro)
> reste un **garde-fou de prompt**, pas un lien banké ; blogs (drips.fr, urbaneez, Paris ZigZag,
> PSS-Archi) et site fan (billy-la-banlieue.com) écartés comme éphémères.

## FX tag live-paint — process de peinture & alphabet (board VALIDÉ 2026-07-26)

Curé depuis `docs/art-direction/references/boards/board-tag-live-paint.md` (hunt
`graphic-references`, validé Bertrand : « Ok good refs, we keep that »). Sert un effet de
rendu **futur** — un graff qui se peint en direct devant le joueur — et rien d'autre : ni
spec, ni timing, ni asset (la mécanique reste à `dev-r3f-render`, le lettrage à
`concept-artist`).

**Registre tranché (Bertrand, 2026-07-26) : throw-up / petite pièce**, construction
multi-couches **contour → fill → highlights/3D → contour final** — pas une signature tag à
geste unique. Ne pas re-litiger : c'est la cible que l'alphabet comme la mécanique servent.

**Axe A — process de peinture (la mécanique : ordre des passes, gestuelle, durée)**

- [INA — « Rap et Tag » (France 2, _Envoyé spécial_, 19 avril 1990)](https://www.ina.fr/ina-eclaire-actu/video/cab90016065/rap-et-tag) — la **seule** référence de ce board correcte en époque **et** en lieu : Paris 1990, tags en ville et session murale filmée (Mode 2, Paris 8). À ce titre la seule admissible aussi en **LOOK**, pas seulement en mécanique : montée en couches visible, distance au mur, différence de tempo entre pièce tolérée et tag illégal expédié. Datation : même logique que Paris Tonkar §Belliard — l'« Opération Murs propres » (1999) n'a pas encore effacé ce look en 1998. **Licence : archive nationale sous droits — décrire/lier seulement, jamais télécharger ni ré-encoder une image (régime LICENSES §1).**
- [Style Wars (1983, Tony Silver & Henry Chalfant) — site officiel](https://www.stylewars.com/) / [Folkstreams](https://www.folkstreams.net/films/style-wars) — **document-source, jamais un modèle à cloner** (même statut que _Prohibition_) : la démonstration documentaire la plus nette de l'ordre des passes (contour → fill → highlight/3D → keyline noir final) en plans longs. **MÉCANIQUE seulement** : NYC, début 80s — mauvaise ville, mauvaise décennie, hors registre visuel maison. **Licence : documentaire sous droits — uniquement le site officiel / le distributeur ; les uploads pirates existants sont volontairement non liés.**
- [« Writers, 20 ans de graffiti à Paris » (Marc-Aurèle Vecchione, 2004)](https://www.film-documentaire.fr/4DACTION/w_fiche_film/12443_0) — **piste non confirmée** : bonne scène (Paris 1983–2003, Bando, Mode 2, JonOne), mais aucun extrait légalement citable montrant un process en cours n'a été localisé. À chasser (projections, bonus DVD) si l'INA 1990 ne suffit pas — pas une source acquise. **Licence : DVD commercial — page de référence seulement.**
- [SOFLES — LIMITLESS (Selina Miles / Ironlak, 2013)](https://ironlak.com/sofles-limitless/) — **explicitement anachronique et hors-scope pour le look** (2013, Brisbane, quatre artistes vivants nommés). Retenu pour **une** chose : voir le _séquencement_ d'une grande pièce (sketch → contour → fill → highlights/3D → détails) à une vitesse qu'une caméra suit. **Jamais une référence de mood ni de lettrage ; si ce lien approche un prompt ou un shot list, il est signalé et écarté.** **Licence : œuvre commerciale contemporaine sous droits — décrire/lier seulement.**
- [Wikipedia — Throw-up](<https://en.wikipedia.org/wiki/Throw_up_(graffiti)>) et [Piece (graffiti)](<https://en.wikipedia.org/wiki/Piece_(graffiti)>) — l'ossature **textuelle** stable de l'ordre des passes, indépendante de tout auteur : throw-up = 2 couches (contour + fill à plat, « hollow » si le fill est sauté) ; pièce = jusqu'à 5, avec keyline noir re-coupé par-dessus le fill. C'est la source qui documente le registre tranché ci-dessus. **Licence : CC BY-SA.**

**Axe B — alphabet (le look : comment une lettre est construite pour lire comme du graff)**

- [Art in Context — « How to Draw Graffiti Bubble Letters »](https://artincontext.org/how-to-draw-graffiti-bubble-letters/) — référence de **construction structurelle**, pédagogique et générique (aucune main d'auteur identifiable) : squelette/guides → contour arrondi → formes de highlight → fill → keyline noir, déroulé sur un alphabet quasi complet. C'est de là qu'on tire un système de lettres maison décomposable en passes animables. Site contemporain mais décrivant une technique non datée. **Licence : site éditorial commercial, tous droits réservés — étude seulement.**
- [Bombing Science — « 23 Mind-Blowing Graffiti Alphabets »](https://www.bombingscience.com/graffiti-alphabets-will-blow-mind/) — sert **uniquement de calibrage de gamme** : jusqu'où une lettre peut être stylisée (bubble / wildstyle / straight-letter) avant de cesser de lire comme son caractère de base. **Risque de clonage explicite, le plus vif du board : chaque alphabet montré est la main d'un writer vivant, crédité nommément — jamais tracer, jamais citer un set nommé dans un prompt**, exactement le régime déjà appliqué à Paris Tonkar (densité/texture, jamais scan-collé). **Licence : œuvres individuelles sous droits d'auteurs nommés — étude de gamme seulement.**
- [Wikipedia — Glossary of graffiti](https://en.wikipedia.org/wiki/Glossary_of_graffiti) — vocabulaire commun (tag, throw-up, piece, burner, wildstyle, fill-in, hollow, keyline) pour que `concept-artist`, `dev-r3f-render` et `art-advisor` parlent du même objet. **Licence : CC BY-SA.**
- [Art Crimes / graffiti.org](https://www.graffiti.org/) — fondé mai 1994 (Susan Farrell), première grande archive photo graffiti du web ouvert : **touchstone in-universe plausible 1994-1998** — le site était vivant l'année où muf se passe, pas une rétrospective moderne. **À vérifier avant de s'appuyer dessus** : `WebFetch` renvoie 403 via le proxy sortant (même blocage que `board-bench.md`, pas un défaut de source) — les constats du board viennent d'une synthèse de recherche, aucune page d'alphabet n'a été lue. **Licence : contenus détenus par les photographes/contributeurs, CGU non lues — référence/étude jusqu'à re-vérification.**
- **Renvoi, non re-curé** : Paris Tonkar (§« Décor de niveau — façade Rue Belliard » ci-dessus) reste le seul ancrage qui montre **ce à quoi un vrai graff parisien d'époque ressemblait sur un mur** — l'axe B ci-dessus donne une méthode et une gamme, pas le look période. On lit les deux ensemble.

> **Garde-fous de curation (valent pour tout prompt ou spec issus de ce board)**
> — **Hiérarchie des sources** : un seul item est période+lieu corrects (INA 1990) et donc
> seul admissible en LOOK ; Style Wars, Vecchione et Sofles sont **MÉCANIQUE seulement**, et
> Sofles est signalé anachronique à chaque réutilisation. — **Anti-clonage** : aucune main de
> writer vivant nommé n'entre dans un prompt ni dans un lettrage ; la construction vient de
> l'axe structurel (Art in Context), la gamme de stylisation est une jauge, pas un modèle. —
> **Contenu du graff in-game** : ce qui se peint à l'écran écrit la fiction muf (crews et
> noms du jeu), jamais le tag ni le blaze d'une personne réelle. — **Anti-anachronisme** :
> pas de mur légal 2020s, pas de vinyle découpé, pas de « graffiti font » vectoriel présenté
> comme 1998 ; le geste est bombe + mur sale, sous lampe sodium. — **Rien de tout ceci n'est
> un asset** : aucune image, frame vidéo ou planche d'alphabet n'est téléchargée ou scannée
> (régime LICENSES §1/§5) — on décrit et on lie.

## MCP / Skills à utiliser

- **Context7** (concept/graphist si besoin d'un point technique image).
- `flux-prompt` (concept-artist) — écrire/réparer un prompt FLUX gate-ready (silhouette-first, style maison).
- `sprite-hole-audit` — gate d'intégrité : aucun cutout poreux ne sort.
- `verify` — juger un visuel composé au runtime sur de vrais screenshots in-game.
