# Prompt drafts — famille `enemies` (pochoir, direction D)

Craft per [`flux-prompt`](../../../.claude/skills/flux-prompt/SKILL.md). Issu du board
validé [`references/boards/board-enemy-window.md`](../references/boards/board-enemy-window.md)
(direction D — pochoir Blek-le-Rat / silhouette-first — prioritaire ; C fanzine xerox en
second). **PROMPT GATE lead-art : PASS (Nico, 2026-07-18).** Génération testée, non
encore livrée en assets — voir le blocage keying ci-dessous.

## Décision d'architecture — le rim néon reste render-side

Le néon acide des ennemis n'est **pas** peint dans le PNG : ADR-0025 bake une silhouette
blanche (`buildNeonSilhouette(image, "#ffffff")`) que `enemyRimMaterial` recolore live sur
la heat-ramp `heatColor()` (green `#78FF3C` → orange → red), et seulement quand
`shoots===true`. Le sprite doit donc rester un **pochoir neutre blanc/gris sur noir** —
peindre l'acide dedans donnerait un double rim, un body-flood FLUX (§2 loi 1) et un fringe
sur le key `#000000`. La révision retire aussi le `pale neon tones figure` baké de
l'ancienne style tail (même faute que les batches véhicules) et le `16-bit / retro snes`
(hors-bible §3.4 : « Xerox is the law »).

## Style tail (gatée, appliquée à `enemies.style` + `hostages.style`)

```
, hand-cut two-tone stencil pochoir, Paris street-stencil look, bold flat high-contrast
silhouette, the figure rendered in paper-white and pale grey ink carrying heavy
photocopied fanzine xerox toner grain, set on a solid uniform perfectly smooth clean matte
pure black background (#000000) filling the whole frame edge to edge, the same flat pure
black in every gap between the figure's limbs, sharp cutout edges, centered game sprite, no
text, no watermark
```

Rationale (clause → l'échec verrouillé) :

- `hand-cut two-tone stencil pochoir` → direction D ; le deux-tons force la lecture
  silhouette-first (§2 loi 3) et tue l'ancien registre snes qui se battait avec §1.
- `Paris street-stencil look` → vérité d'époque/lieu **sans nommer Blek le Rat** (le risque
  clone-a-hand du board sur un artiste vivant) — tradition générique seulement.
- `paper-white and pale grey ink` → remplace `pale neon tones` baké ; garde le sprite
  neutre pour que ADR-0025 recolore proprement.
- `matte pure black background (#000000)` + `the same flat pure black in every gap` →
  satisfait le token fond-noir du lint et le chroma-key `cutout-enemies.mjs` ; la clause de
  gap est l'assurance `sprite-hole-audit` (jambes de pochoir sombres ≠ trous).
- `photocopied fanzine xerox toner grain` → direction C, loi xerox (§3.4).
- `no text, no watermark` → 2 négations, budget bible respecté.

## Sujets par variante (3 cops de base)

| type             | seed     | sujet                                                                                                                                                     |
| ---------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enemy_sprite`   | 4801     | a menacing plainclothes french cop, a flat peaked cap breaking the crown of the head, standing squarely facing forward, arms straight at the sides        |
| `enemy_sprite_2` | **4822** | a menacing plainclothes french cop, broad squared-off shoulders in a boxy hip-length leather jacket, hands at the sides, standing squarely facing forward |
| `enemy_sprite_3` | 4803     | a menacing plainclothes french cop, a raised hood cowl rounding the head, a dark band of sunglasses across the eyes, standing squarely facing forward     |

Les 3 tells se différencient à taille de jeu : visière anguleuse / épaules cuir carrées /
cowl arrondi + bande de lunettes. Seed `enemy_sprite_2` passé de 4802 → **4822** (4802
sortait un fond taupe). Les autres types (`enemy_shooting*`, `enemy_riot*`, `enemy_biker*`,
`enemy_bonus`, `enemy_hostage`) gardent leur sujet et héritent de la nouvelle tail.

## Fix couplé — `gen-enemy-types.mjs:170`

Le prompt kontext des frames ≥2 codait en dur `same … pixel art style` : sous pochoir il
ferait dériver la frame 2 en pixel-art. Corrigé en `same hand-cut stencil pochoir style`.

## ⚠️ Blocage keying — assets NON régénérés (à traiter par `game-graphist`)

Le test de génération (18 rolls distincts, seeds canoniques + bloc 4841-4860) échoue le
critère de détourage `max coin < 24` **à 100 %** (coins mesurés 31→196). Cause diagnostiquée
et **systémique, pas de la variance** : l'esthétique « photocopie / xerox / pochoir » évoque
une **page scannée** — FLUX pose un liseré/vignettage papier plus clair que le void voulu,
et le grain « xerox » déborde sur le fond malgré `smooth clean pure black`. Le liseré n'est
pas éliminable par re-roll ni par un flood naïf : monter le seuil **troue la figure** (encre
grise du pochoir ≈ fond gris).

Piste retenue pour la prochaine passe (lane `game-graphist`, retouche scriptée type
`scripts/retouch-*.mjs`) : **isolation de fond spatiale** — flood de l'extérieur connecté
depuis les bords vers noir pur, borné par le contour haut-contraste de la figure (jamais un
seuil de luminance global, qui trouerait le pochoir), + suppression du cadre-photocopie par
inset. Tant que cette retouche n'est pas prête et gatée (asset gate lead-art + hole-audit),
les PNG committés restent SNES — **pas de régression en jeu, pas d'état mixte visible**,
seulement `levelArt.json` qui décrit déjà le pochoir.

**Statut : direction + prompt VALIDÉS ; livraison des sprites en attente de la retouche
d'isolation de fond.**
