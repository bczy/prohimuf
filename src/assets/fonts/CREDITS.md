# Embedded fonts — credits & licenses

All three families are **self-hosted** (woff2 in this folder, no CDN, offline-safe) and
licensed under the **SIL Open Font License 1.1** (full text in `OFL.txt`). They are wired
into the UI via `fonts.css` and the `FONT` token in `src/render/ui/print/tokens.ts`.

| Role (muf)                                 | Family            | Copyright                                        | Source                                           |
| ------------------------------------------ | ----------------- | ------------------------------------------------ | ------------------------------------------------ |
| Display / titres (ransom-note headlines)   | **Anton**         | Copyright 2020 The Anton Project Authors         | https://github.com/googlefonts/AntonFont         |
| Corps / mono (typewriter info blocks, HUD) | **Courier Prime** | Copyright 2015 The Courier Prime Project Authors | https://github.com/quoteunquoteapps/CourierPrime |
| Manuscrit / marqueur (flyer annotations)   | **Caveat**        | Copyright 2014 The Caveat Project Authors        | https://github.com/googlefonts/caveat            |

Weights/styles bundled: Anton 400 · Courier Prime 400 / 700 / italic-400 · Caveat 400.
Each family ships the `latin` + `latin-ext` unicode-range subsets (French accents covered).

woff2 files were generated from the Google Fonts `css2` API; `OFL.txt` is the shared
license body. Under OFL 1.1 the license and copyright notices are distributed alongside
the fonts (this file + `OFL.txt`); the fonts are bundled, not sold, and no Reserved Font
Name is altered.
