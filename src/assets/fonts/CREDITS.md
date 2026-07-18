# Embedded fonts — credits & licenses

All four families are **self-hosted** (woff2 in this folder, no CDN, offline-safe) and
licensed under the **SIL Open Font License 1.1** (full text in `OFL.txt`). They are wired
into the UI via `fonts.css` and the `FONT` token in `src/render/ui/print/tokens.ts`.

| Role (muf)                                 | Family             | Copyright                                                                          | Source                                           |
| ------------------------------------------ | ------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------ |
| Display / titres (techno-flyer headlines)  | **Rubik Mono One** | Copyright 2013–2015 Philipp Hubert & Sebastian Fischer (The Rubik Project Authors) | https://github.com/googlefonts/rubik             |
| Corps / mono (typewriter info blocks, HUD) | **Courier Prime**  | Copyright 2015 The Courier Prime Project Authors                                   | https://github.com/quoteunquoteapps/CourierPrime |
| Manuscrit / marqueur (flyer annotations)   | **Caveat**         | Copyright 2014 The Caveat Project Authors                                          | https://github.com/googlefonts/caveat            |
| HUD mono (in-game ticker legibility)       | **IBM Plex Mono**  | Copyright 2017 IBM Corp.                                                           | https://github.com/IBM/plex                      |

Weights/styles bundled: Rubik Mono One 400 · Courier Prime 400 / 700 · Caveat 400 · IBM Plex Mono 400 / 600.
Each family ships the `latin` + `latin-ext` unicode-range subsets (French accents covered).

woff2 files were generated from the Google Fonts `css2` API; `OFL.txt` is the shared
license body. Under OFL 1.1 the license and copyright notices are distributed alongside
the fonts (this file + `OFL.txt`); the fonts are bundled, not sold, and no Reserved Font
Name is altered.
