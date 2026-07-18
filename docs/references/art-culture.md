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

## MCP / Skills à utiliser

- **Context7** (concept/graphist si besoin d'un point technique image).
- `flux-prompt` (concept-artist) — écrire/réparer un prompt FLUX gate-ready (silhouette-first, style maison).
- `sprite-hole-audit` — gate d'intégrité : aucun cutout poreux ne sort.
- `verify` — juger un visuel composé au runtime sur de vrais screenshots in-game.
