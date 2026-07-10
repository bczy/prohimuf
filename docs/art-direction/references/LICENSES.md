# Art-direction reference sources & licenses

Status (2026-07-10): **no binary files downloaded** — the sandbox's outbound proxy
rejects CONNECT to `upload.wikimedia.org`, `commons.wikimedia.org`, `kenney.nl`,
`opengameart.org` and most media hosts (403 policy denial, see
`$HTTPS_PROXY/__agentproxy/status`). This file records the vetted source URLs and
their licenses so the images can be pulled in CI or on a dev machine.

Rule of thumb: everything on Wikimedia Commons is under a free license
(CC0 / CC BY / CC BY-SA / PD) — verify the exact license on each file page before
committing a copy, and keep author attribution here.

## 1. Prohibition (Atari ST, 1987, Infogrames) — DO NOT DOWNLOAD (copyrighted)

Reference URLs only; describe, never commit screenshots.

- Atarimania (screenshots, scans, ads): https://www.atarimania.com/game-atari-st-prohibition_21733.html
- Atari Legend: https://www.atarilegend.com/games/prohibition
- MobyGames: https://www.mobygames.com/game/atari-st/prohibition
- Games Database: https://www.gamesdatabase.org/game/atari-st/prohibition
- Giant Bomb: https://giantbomb.com/wiki/Games/Prohibition
- Longplay video (Atari ST): https://www.youtube.com/watch?v=JrV-6Elbbdc
- Internet Archive (ZX/DOS playable versions): https://archive.org/details/zx_Prohibition_1987_Infogrames , https://archive.org/details/msdos_Prohibition_1987

## 2. Rave-flyer / xerox-fanzine aesthetic — reference pages (do not commit scans)

- "Paris Rave Flyers 1991–1994" (Antoine Molkhou / REX Club, Colpa Press):
  https://dalezineshop.com/products/paris-rave-flyers-1991-1994 ,
  https://www.printedmatter.org/catalog/tables/31693/60651
- Margot Hitou, « L'esthétique des flyers de free party des années 1990-2000 » (ESAD Pyrénées, French, analytical):
  https://ateliers.esad-pyrenees.fr/web/archives/2024-2025/3dgm-docs/margot/index.php
- Gallery 98, "Photocopy Machines: Xerox Flyers, Zines & Other Art Ephemera":
  https://gallery98.org/news/photocopy-machines-xerox-flyers-zines-and-other-art-ephemera/
- Rave Preservation Project (~1000 digitized late-80s/90s flyers): https://ravepreservationproject.com/
- Phatmedia UK rave flyer archive (21k flyers): https://phatmedia.co.uk/
- French free-party/teknival flyer collection: http://parties.are.free.fr/flyers.html
- Spiral Tribe visual identity background: https://en.wikipedia.org/wiki/Spiral_Tribe ,
  https://www.goodtroublemag.com/home/spiral-baby-utopia-now

## 3. Vehicle silhouette references (Wikimedia Commons — free licenses, attribution required)

Download via file page ("Original file" link) on a machine with Commons access;
record author + exact license next to each file when committed.

| Subject                                                       | Commons file page                                                                                                   | License (as reported; verify on page) |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Renault Twingo I, side view (facelift, same one-box mk1 body) | https://commons.wikimedia.org/wiki/File:Renault_Twingo_phase_II_(side).jpg                                          | CC BY-SA (verify)                     |
| Renault Twingo I (1995)                                       | https://commons.wikimedia.org/wiki/File:Renault_Twingo_1995_(46203156402).jpg                                       | CC BY-SA 2.0 (Flickr)                 |
| Renault Twingo I (1997)                                       | https://commons.wikimedia.org/wiki/File:Renault_Twingo_1997_(50067090772).jpg                                       | CC BY-SA 2.0 (Flickr)                 |
| Citroën AX, white, side view                                  | https://commons.wikimedia.org/wiki/File:Citroen_AX_white_1.JPG                                                      | CC BY-SA (verify)                     |
| Citroën AX category (more angles)                             | https://commons.wikimedia.org/wiki/Category:Citro%C3%ABn_AX                                                         | per file                              |
| Renault Trafic I (1993, T328)                                 | https://commons.wikimedia.org/wiki/File:1993_Renault_Trafic_T328_1.7.jpg                                            | CC (verify)                           |
| Renault Trafic I (1995)                                       | https://commons.wikimedia.org/wiki/File:1995_Renault_Trafic_(14102104971).jpg                                       | CC BY 2.0 (Flickr, verify)            |
| Renault Trafic category                                       | https://commons.wikimedia.org/wiki/Category:Renault_Trafic                                                          | per file                              |
| Citroën C25 van                                               | https://commons.wikimedia.org/wiki/File:Citroen_C25_(25724751148).jpg (+ `_(cropped).jpg` variant)                  | CC (Flickr, verify)                   |
| Citroën C25 van (Florenville)                                 | https://commons.wikimedia.org/wiki/File:Citro%C3%ABn_C25_Florenville.jpg                                            | CC BY-SA (verify)                     |
| Peugeot 103 moped                                             | https://commons.wikimedia.org/wiki/File:PEUGEOT_103.jpg and https://commons.wikimedia.org/wiki/Category:Peugeot_103 | per file                              |
| MBK scooters (Booster etc.)                                   | https://commons.wikimedia.org/wiki/Category:MBK_scooters                                                            | per file                              |

## 4. CC0 game-art packs (neon-on-dark sprite reference)

All CC0 — safe to download and commit samples when network allows.

- Kenney — Space Shooter Redux (CC0, ~295 sprites, glow lasers on dark):
  https://kenney.nl/assets/space-shooter-redux (mirror: https://opengameart.org/content/space-shooter-redux)
- Kenney — Space Shooter Extension (CC0, 270 assets): https://kenney.nl/assets/space-shooter-extension
- OpenGameArt — "Neon Node" (CC0, dark sci-fi vector neon tiles/sprites): https://opengameart.org/content/neon-node
- OpenGameArt — "Neon Town" (CC0, neon lights + cars): https://opengameart.org/content/neon-town
