# muf

**muf** est un remake navigateur de _Prohibition_ (Atari ST, 1987), transposé
dans la **scène rave clandestine parisienne de la fin des années 90**. On y
incarne un coursier d'un réseau de fêtes underground qui livre matériel son,
flyers et groupes électrogènes à travers Paris, en évitant la BAC, les CRS et
les RG en civil.

L'identité visuelle est celle d'un **fanzine photocopié noir & blanc** rehaussé
de **néons acides** — des sprites 2D plats façon _Paper Mario_ dans un monde 3D
React Three Fiber.

> **État actuel :** le prototype implémente la **phase de tir** (_shooting
> gallery_) : des cibles apparaissent aux fenêtres des façades, ripostent, et
> doivent être éliminées avant la fin du chrono.

---

## Stack technique

| Couche                  | Technologie                            |
| ----------------------- | -------------------------------------- |
| Framework               | React 19                               |
| Rendu 3D                | React Three Fiber + Three.js           |
| Langage                 | TypeScript (strict)                    |
| Build / dev             | Vite                                   |
| Tests                   | Vitest                                 |
| Audio                   | Howler.js                              |
| Gestionnaire de paquets | Yarn 4 (Plug'n'Play)                   |
| Génération d'assets     | Pollinations.ai (modèle FLUX, gratuit) |

---

## Démarrage rapide

Prérequis : **Node.js** et **Yarn 4** (activé via Corepack).

```bash
corepack enable          # active Yarn 4 si nécessaire
yarn install             # installe les dépendances
yarn dev                 # lance le serveur de dev Vite
```

Ouvrez ensuite l'URL affichée par Vite (par défaut `http://localhost:5173`).

---

## Scripts disponibles

| Commande             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `yarn dev`           | Serveur de développement Vite (HMR)              |
| `yarn build`         | Vérification de types puis build de production   |
| `yarn preview`       | Prévisualise le build de production              |
| `yarn typecheck`     | Vérification TypeScript sans émettre de fichiers |
| `yarn lint`          | Analyse ESLint                                   |
| `yarn lint:fix`      | ESLint avec correction automatique               |
| `yarn format`        | Formatage Prettier                               |
| `yarn format:check`  | Vérifie le formatage sans modifier               |
| `yarn test`          | Lance la suite de tests Vitest                   |
| `yarn test:watch`    | Tests en mode watch                              |
| `yarn test:coverage` | Tests avec rapport de couverture                 |

---

## Architecture

Le projet impose une **séparation stricte entre logique de jeu et rendu**.

```
src/
├── game/        # Logique de jeu pure — zéro dépendance React/Three
│   ├── types/   # Définitions de types partagées (GameState, Enemy, Bullet…)
│   ├── systems/ # Fonctions pures (state-in / state-out) + tests Vitest
│   ├── maps/    # Fixtures de façade (FacadeMap) pour les tests
│   ├── levels/  # Définition des niveaux (art PNG + zones de fenêtres)
│   ├── entities/ & state/  # Fabriques d'entités et d'état
├── hooks/       # Hooks React — pont entre logique de jeu et R3F (useFrame)
├── render/
│   ├── scene/   # Composants de scène R3F (App, GameScene, LevelBackdrop, sprites…)
│   └── ui/      # Overlays HTML (HUD, StartScreen, EndScreen…)
├── assets/      # Audio + sprites générés (PNG)
└── main.tsx     # Point d'entrée
```

### Principes de conception

- **Logique pure :** tout dans `src/game/` est du TypeScript sans import React
  ni Three.js — testable sans DOM/WebGL, déterministe, portable.
- **État immuable :** `GameState` est en lecture seule ; chaque tick renvoie un
  nouvel objet d'état, sans mutation.
- **TDD / YAGNI / DRY :** tests écrits avant les fonctions système ; pas de
  fonctionnalité ni d'abstraction prématurée.

Les hooks React (`src/hooks/`) sont l'unique pont : ils s'abonnent à la boucle
`useFrame` de R3F, appellent les fonctions système pures, puis mettent à jour
des refs lues par les composants de rendu (sans déclencher de re-render).

---

## Documentation

La documentation détaillée se trouve dans [`docs/`](./docs) :

- [`overview.md`](./docs/overview.md) — vision, univers, boucle de gameplay
- [`architecture.md`](./docs/architecture.md) — architecture, data flow, caméra, stack
- [`game-systems.md`](./docs/game-systems.md) — systèmes de jeu (state machine, ennemis, balles, viseur)
- [`render-layer.md`](./docs/render-layer.md) — scène R3F, décor de niveau (LevelBackdrop), sprites, HUD
- [`audio-system.md`](./docs/audio-system.md) — audio Howler.js, paliers de tension, BGM/SFX
- [`asset-pipeline.md`](./docs/asset-pipeline.md) — génération d'assets (Pollinations.ai)
- [`dev-guidelines.md`](./docs/dev-guidelines.md) — standards de code (TDD, YAGNI, DRY)
- [`roadmap.md`](./docs/roadmap.md) — sprints réalisés, fonctionnalités prévues, manques connus

---

## Génération d'assets

Les sprites sont générés via `scripts/generate-assets.mjs` (API Pollinations.ai,
modèle FLUX gratuit). Copiez `.env.example` vers `.env` et renseignez la clé si
nécessaire :

```bash
cp .env.example .env
```

---

## Licence

Projet personnel / prototype — voir le dépôt pour les détails.
