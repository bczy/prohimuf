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

## MCP / Skills à utiliser

- **Context7** (concept/graphist si besoin d'un point technique image).
- `flux-prompt` (concept-artist) — écrire/réparer un prompt FLUX gate-ready (silhouette-first, style maison).
- `sprite-hole-audit` — gate d'intégrité : aucun cutout poreux ne sort.
- `verify` — juger un visuel composé au runtime sur de vrais screenshots in-game.
