# Références — Direction artistique & culture (art crew)

Pour `art-advisor`, `concept-artist`, `lead-art`, `game-graphist`. Style maison :
« fanzine photocopié N&B + néon acide », Paris 1998. Voir [`README.md`](README.md).

## Docs internes (source de vérité)

- `docs/art-direction.md` — **la bible art** (le gate juge contre elle).
- [`docs/art-direction/references/`](../art-direction/references/) — références curatées et **license-noté** (le vrai dépôt : on étend là, via `lead-art`).
- `docs/art-direction/prompt-drafts.md` — brouillons de prompts en cours.
- ADR `docs/adr/0010`, `0013`, `0014`, `0019` — pipeline art, cutout, intégrité sprite, cleanup halo.

## Références externes (ancrage, pas dump — la curation vit dans le dossier interne)

- [Prohibition (1987) — MobyGames](https://www.mobygames.com/game/prohibition/) — la source : façade fixe, le jeu lit comme une affiche, pas un diorama.
- [MyAbandonware — Prohibition](https://www.myabandonware.com/) — captures d'écran d'époque de l'Atari ST.
- [Black Forest Labs — FLUX](https://github.com/black-forest-labs/flux) — comportement du modèle qui exécute les prompts (silhouette-first, positivement décrit).

## Repères période (à valider par `art-advisor`)

- Flyers/fanzines free-party 90s : générations de photocopie, collage cut-and-paste, trames de demi-teintes, **une** couleur d'accent sur papier bon marché.
- Mobilier urbain & véhicules Paris 1998 : Twingo mk1, C25/Master, mobs 103/Ciao, Decaux, lampes sodium.

## MCP / Skills à utiliser

- **Context7** (concept/graphist si besoin d'un point technique image).
- `sprite-hole-audit` — gate d'intégrité : aucun cutout poreux ne sort.
- `verify` — juger un visuel composé au runtime sur de vrais screenshots in-game.
