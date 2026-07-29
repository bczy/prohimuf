# Spike — flyers R3F (mur + livre)

**Statut : EXPLORATION MISE DE CÔTÉ. Rien ici n'est branché sur le jeu.**
Aucun fichier de `src/` n'est modifié par cette branche : ces deux pages vivent sous
`spikes/` et ne sont importées par rien.

Exploration menée avec Bertrand (juillet 2026) : à quoi ressemblerait l'écran NIVEAUX
si les flyers étaient de vraies feuilles de papier en 3D plutôt que des cartes DOM.

## Lancer

```bash
yarn vite --port 4180 --strictPort
```

- mur → <http://localhost:4180/prohimuf/spikes/r3f-flyers/wall.html>
- livre → <http://localhost:4180/prohimuf/spikes/r3f-flyers/book.html>

Vérification headless (Playwright + Chromium en SwiftShader, capture les erreurs
console et écrit des captures dans le scratchpad) :

```bash
node spikes/r3f-flyers/probe-book.mjs
```

## Ce que le spike démontre

- **Froissé réel** : la feuille est un maillage subdivisé (128×170) déplacé par une
  croix de pliage en quatre + plis incidents. Les plis sont des arêtes vives
  (`exp(-|d|·k)`), pas des bosses douces — c'est ce qui fait lire « froissé ».
- **Déchirures sur les 4 bords** : les sommets du bord sont ramenés sur une courbe de
  bruit apériodique. Le bruit est essentiel : des `abs(sin)` empilés restent périodiques
  et l'œil les lit comme une courbe dessinée, pas comme un dégât.
- **Fentes traversantes** : faces supprimées — un vrai trou (on voit le fond au travers,
  et il perce l'ombre portée). Aucun déplacement de sommets ne peut créer ça.
- **Quatre gabarits de flyer** + motifs à une seule encre (spirale, smiley, cercles,
  trame, invader), tracés procéduralement : les flyers d'époque étaient sérigraphiés ou
  photocopiés en une encre, donc des formes pleines au pochoir sont plus justes — et
  moins chères — que de l'image générée.
- **Livre** : chaque feuille pivote autour de la tranche, recto = flyer, verso = fausse
  BD / petites annonces / plan / notes griffonnées.

Le texte des flyers est repris de `PLAYABLE_COPY` dans
`src/render/ui/menu/LevelFlyer.tsx`, pas du lorem.

## Pourquoi ce n'est PAS parti en production

Trois coûts réels, à trancher par `senior-architect` + `ux-designer` si le sujet est
rouvert :

1. **Frontière d'architecture** — la charte du projet garde les menus en DOM ; seul
   `src/render/scene` est R3F. Passer NIVEAUX en WebGL demande un ADR.
2. **Accessibilité** — la version DOM a le focus clavier roving, `role="button"`,
   `aria-disabled`, du texte lisible par lecteur d'écran et le double garde-fou
   reduced-motion. Dans un canvas, le texte n'est plus que des pixels : tout est à
   reconstruire.
3. **Poids de chargement** — ADR-0068 charge Three.js paresseusement pour que le menu
   n'en dépende pas. Mettre R3F dans le menu annule cette optimisation.

**Piste intermédiaire non explorée** : garder le menu en DOM et pré-calculer les
feuilles froissées/déchirées en images. On garderait le froissé, les plis et les bords
arrachés sans toucher à l'accessibilité, au poids ni à la frontière — on perdrait la
parallaxe et la culbute 3D pendant l'entrée.

## Pièges rencontrés (à ne pas refaire)

- `ExtrudeGeometry` génère ses UV en unités-monde, pas en 0..1 → la texture sortait
  microscopique. Il faut un `UVGenerator` qui normalise.
- Les noms de `@keyframes` sont hashés par CSS Modules ; les **valeurs** de custom
  properties, non. (Vaut pour la version DOM.)
- Le verso d'une feuille ne doit PAS être une copie pivotée de 180° : un trou en `+x`
  se retrouve en `−x` et les deux faces ne coïncident jamais. Utiliser la même
  géométrie en `BackSide`, avec la texture pré-inversée.
- Le relief du froissé doit rester inférieur à l'écart entre feuilles empilées, sinon
  les pages se traversent (`LEAF_GAP` dans `book.tsx`).
- `state.clock.getDelta()` dans `useFrame` consomme l'horloge et corrompt le temps des
  autres composants du même frame — utiliser le `delta` fourni en argument.
