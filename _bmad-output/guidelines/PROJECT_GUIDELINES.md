# Underground Paris — Project Guidelines

> Ces guidelines sont **non-négociables**. Toute décision technique ou de design doit être validée contre elles. En cas de doute, on revient à ces principes.

**Version :** 1.0
**Date :** 2026-04-10
**Session :** Brainstorming initial

---

## 1. Vision Produit

### Le Jeu

Remake de **Prohibition (Atari ST)** dans un univers **Paris rave clandestin années 90-2000**.

### Boucle de Gameplay Core (intouchable)

```
Récupérer → Livrer → Éviter
```

C'est tout. Toute feature qui ne sert pas directement cette boucle est hors scope.

### Le Test du Cahier des Charges

Avant d'ajouter une feature, poser la question :

> "Est-ce que Prohibition Atari ST avait ça ?"

- **Oui** → on l'implémente fidèlement
- **Non** → c'est une extension consciente, documentée et justifiée

---

## 2. Principes de Développement

### TDD — Test-Driven Development

- **Règle :** Les tests s'écrivent AVANT l'implémentation, toujours
- **Outil :** Vitest
- **Périmètre :** Tout ce qui est dans `src/game/` doit être couvert
- **Vérification :** Aucun merge sans tests verts

### YAGNI — You Aren't Gonna Need It

- Ne pas implémenter ce qui n'est pas requis maintenant
- Pas de config pour des cas hypothétiques
- Pas d'abstraction pour une utilisation future incertaine
- Si ce n'est pas dans les guidelines ou la story courante, ça n'existe pas

### DRY — Don't Repeat Yourself

- Une seule source de vérité pour chaque concept
- Extraire en système réutilisable dès la 2ème occurrence
- Pas de copier-coller de logique entre systèmes

### KISS — Keep It Simple

- La solution la plus simple qui fonctionne est la bonne
- Pas de sur-ingénierie
- Une mission = 3-5 minutes de jeu maximum

---

## 3. Stack Technique

```
Language    : TypeScript (strict mode)
Renderer    : React Three Fiber (Three.js)
Tests       : Vitest
Lint        : ESLint
Format      : Prettier
Build       : Vite
Deploy      : GitHub Pages (static)
Audio       : Howler.js
Assets IA   : Gemini Image Generation (Google) — génération des sprites, textures, éléments visuels
```

### Règles TypeScript

- `strict: true` — pas d'exceptions
- Pas de `any` — jamais
- Interfaces explicites pour tous les états de jeu
- Types dans `src/game/types/` — source unique de vérité

### Règles ESLint / Prettier

- Config commitée, appliquée en pre-commit hook
- Aucun warning ignoré sans commentaire justificatif
- Format automatique avant chaque commit

---

## 4. Architecture

### Séparation Stricte Logique / Rendu

```
src/
  game/           ← PURE LOGIC — zéro import React/R3F ici
    entities/     ← player, contacts, cops (types + logic)
    systems/      ← movement, detection, delivery, recruitment
    state/        ← game state machine
    types/        ← toutes les interfaces TypeScript
  render/         ← R3F ONLY — consomme game state, ne le produit pas
    scene/        ← scène 3D, camera, lights
    ui/           ← HUD, menus, fanzine UI
    effects/      ← Paper Mario dépliage, néons, shaders
  assets/         ← sprites, audio, fonts
  hooks/          ← bridge game loop ↔ React (useFrame etc.)
```

### Règle d'Or de l'Architecture

> `src/game/` ne connaît pas React. `src/render/` ne contient pas de logique de jeu.

- Le game state est une structure de données pure
- Le rendu est une vue de cet état — rien de plus
- `useFrame` dans les hooks = le seul pont autorisé

### Game Loop

- Game loop dans `useFrame` de R3F — pas de `setInterval`, pas de `setTimeout`
- État du jeu dans une ref ou un store Zustand — pas dans `useState`
- Pas de re-render React pour chaque frame

---

## 5. Design Rules — UX & Visuel

### Identité Visuelle

- **Palette :** Noir et blanc "photocopié" + néons acides (jaune fluo, rose fuchsia, vert acide, orange brûlé)
- **Règle :** Ce qui brille est interactif. Ce qui est gris est décor.
- **Texture :** Grain photocopie, légèrement sale, style fanzine

### Paper Mario Rules

- Les personnages et éléments interactifs se "déplient" à l'apparition
- Les quartiers se déploient comme des pages pop-up à la première visite
- Effets de profondeur via inclinaison des plans — pas de vraie 3D

### UI Fanzine

- Tous les écrans UI sont des artefacts de l'univers (pages de fanzine, flyers, unes de journaux)
- Le menu principal est une couverture de zine
- L'écran de game over est une "UNE" de journal fictif
- La sélection de niveau est une pile de flyers de raves

### Règles UX Non-Négociables

1. Temps entre lancement et gameplay : **< 10 secondes**
2. Une mission : **3-5 minutes maximum**
3. Toutes les cutscenes : **skippables en un bouton**
4. Chaque mort/échec : **raison explicite affichée**
5. Contrôles : **déplacement + une action** — appris en 10 secondes
6. Jamais de mort "bullshit" — les règles des flics sont visibles et cohérentes

---

## 6. Audio

- Boucles instrumentales **boom bap / rap français 90s** — samples vinyle, scratches
- **Minimum 10 tracks** en rotation
- La musique est **le seul indicateur de tension** — pas de barre de stress
  - Tempo s'accélère quand les flics approchent
  - Tempo ralentit quand safe
- Lib : **Howler.js** — rien de plus

---

## 7. Univers & Contenu

### Personnages (5 contacts recrutables)

| Nom                | Rôle                     | Zone             | Risque                                      |
| ------------------ | ------------------------ | ---------------- | ------------------------------------------- |
| DJ Masta Klem      | Sonorisateur             | Vitry (94)       | Lent (caisse de vinyles)                    |
| Faïza "La Logiste" | Organisation / Lieux     | Stalingrad (19e) | Bavarde, visée par les RG                   |
| Seb le Blond       | "Le reste"               | Châtelet         | Peu fiable, indispensable                   |
| Oxane              | Photographe / Réputation | Belleville (20e) | Photos peuvent tomber en de mauvaises mains |
| Karim "Le Mécano"  | Générateurs              | Pantin (93)      | Van repérable, jamais chopé                 |

### Antagonistes

- **BAC de nuit** — patrouilles visibles, règles claires
- **RG en civil** — micro-tells visuels, détectables à l'œil (pas de jauge)
- **Indics** — un contact retourné garde une apparence normale

### Niveau Final

- **31 décembre 1999** — bug de l'an 2000, Paris en délire, flics débordés

---

## 8. Scope Control

### Ce qui EST dans le scope

- Boucle récupérer → livrer → éviter
- Carte de Paris (arrondissements périphériques)
- 5 contacts recrutables
- BAC + RG comme antagonistes
- Full feature set original (score, vies, timer, minimap, barre de vie, jauge détection, menu, cutscenes, inventaire, leaderboard, niveaux de difficulté, game over)
- Esthétique fanzine néon
- Audio boom bap adaptatif
- Niveau inversé RG (1 niveau sur 10)

### Ce qui N'EST PAS dans le scope

- Mode multijoueur
- Système de dialogue élaboré
- Physics engine complexe
- ECS framework (trop lourd pour ce gameplay)
- Internationalisation
- Mobile-first (desktop browser)
- Backend / serveur / base de données

---

## 9. Qualité & Process

### Definition of Done (par feature)

- [ ] Tests Vitest écrits et verts
- [ ] TypeScript sans erreur (`tsc --noEmit`)
- [ ] ESLint sans warning
- [ ] Prettier appliqué
- [ ] Validé contre le Test du Cahier des Charges
- [ ] Feature testée dans le browser

### Revue Architecturale

Avant toute implémentation non-triviale, répondre à :

1. Cette feature appartient-elle à `game/` ou `render/` ?
2. Est-ce que ça ajoute de la logique dans le rendu ? (interdit)
3. Est-ce que ça ajoute du rendu dans la logique ? (interdit)
4. Est-ce couvert par des tests ?
5. Est-ce que YAGNI valide ce choix ?

---

## 10. MVP — Séquence de Build

### Sprint 0 — Setup

- Init projet Vite + React + TypeScript + R3F
- Config ESLint + Prettier + Vitest
- Architecture de dossiers
- CI basique (lint + tests)

### Sprint 1 — Boucle Core

- Player entity (position, mouvement)
- Une carte simple (un arrondissement)
- Un point de pickup + un point de livraison
- Un type de flic (patrouille simple)
- Détection basique
- Vitest sur tous les systèmes game/

### Sprint 2 — Habillage

- Esthétique fanzine noir/blanc + néons
- Effets Paper Mario dépliage
- Audio boom bap + tension

### Sprint 3+ — Enrichissement

- Contacts recrutables (un par sprint)
- Nouveaux arrondissements
- Features UI (flyers, fanzine, leaderboard narratif)
- Antagonistes supplémentaires

---

_Ces guidelines évoluent — toute modification doit être documentée et justifiée._
