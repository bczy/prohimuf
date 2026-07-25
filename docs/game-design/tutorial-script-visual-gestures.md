# Tutorial script — visual gestures + 16-panel contract lock

**Author:** Yasmine (`narrative-designer`) · **Date:** 2026-07-25  
**Target:** `src/game/systems/narrativeSystem.ts`  
**Normative refs:**

- `docs/game-design/tutorial-immersion-teaching-spec.md` (accepted 16-panel map)
- `docs/game-design/ux/spec-tutorial-narrative-presentation.md` (channel + bullets rules)

## Alignment contract (must hold)

- **16 panels per variant** (desktop 16, mobile 16).
- **Fork only at indices [2,3]** (controls only).
- Dedicated shared panels for:
  - `diagram: threat-hierarchy-ladder` (index 11),
  - `diagram: boss-finale-switch` (index 13).
- Mechanic cues use accepted **diagram tokens** where mapped by spec.
- Bullet reinforcement only on **high-risk** panels, **max 2 bullets**.
- Device wording constraints explicit:
  - desktop control lines: `souris` / `clic`, no `doigt` / `balay`;
  - mobile control lines: `doigt` / `deux doigts`, no `souris` / `clic`;
  - shared lines: no device-control vocabulary.

---

## Panel map (index-locked)

| #   | Segment         | Desktop                                     | Mobile                    |
| --- | --------------- | ------------------------------------------- | ------------------------- |
| 0   | Opening         | text                                        | same                      |
| 1   | Opening         | image camion                                | same                      |
| 2   | Controls (fork) | `gesture: mouse-click`                      | `gesture: two-finger-tap` |
| 3   | Controls (fork) | `gesture: edge-scroll`                      | `gesture: swipe-pan`      |
| 4   | Field           | `diagram: shot-read-player-vs-enemy-bullet` | same                      |
| 5   | Field           | `diagram: weapon-crate-loop`                | same                      |
| 6   | Bestiary        | image flic                                  | same                      |
| 7   | Bestiary        | image CRS                                   | same                      |
| 8   | Bestiary        | image motard                                | same                      |
| 9   | Bestiary        | image bonus                                 | same                      |
| 10  | Bestiary        | image livreur civil                         | same                      |
| 11  | Field           | `diagram: threat-hierarchy-ladder`          | same                      |
| 12  | Field           | `diagram: hostage-ring`                     | same                      |
| 13  | Field           | `diagram: boss-finale-switch`               | same                      |
| 14  | HUD             | text                                        | same                      |
| 15  | Outro           | text                                        | same                      |

---

## Transcription-ready script block

```ts
// Shared opening (indices 0-1)
const TUTORIAL_OPENING_LINES: readonly NarrativeLine[] = [
  {
    speaker: "DISPATCH",
    text: "Muf, écoute. Façades fermées, rue sous tension : Récupérer, Livrer, Éviter.",
  },
  {
    speaker: "DISPATCH",
    text: "Le camion porte le son. Couvre son arrêt, puis laisse-le repartir intact.",
    image: "assets/vehicles/truck.png",
    imageAlt: "Le camion de livraison",
  },
];

// Desktop controls (indices 2-3, fork)
const DESKTOP_CONTROL_LINES: readonly NarrativeLine[] = [
  {
    speaker: "KENZA",
    text: "Le viseur suit ta souris. Clic gauche : un tir, net.",
    gesture: "mouse-click",
    gestureAlt: "Souris : un clic gauche déclenche un tir.",
  },
  {
    speaker: "KENZA",
    text: "Pousse le curseur au bord de l'écran : la vue glisse dans la rue.",
    gesture: "edge-scroll",
    gestureAlt: "Curseur poussé au bord de l'écran : la vue défile.",
  },
];

// Mobile controls (indices 2-3, fork)
const MOBILE_CONTROL_LINES: readonly NarrativeLine[] = [
  {
    speaker: "KENZA",
    text: "Tap à deux doigts pour tirer. Double-tap d'un doigt possible là où tu vises.",
    gesture: "two-finger-tap",
    gestureAlt: "Tap simultané à deux doigts, ou double-tap d'un doigt, pour tirer.",
    teachingBullets: ["Action : tap à deux doigts", "Raté ici = pas de tir"],
  },
  {
    speaker: "KENZA",
    text: "Un doigt balaie la rue : haut, bas, gauche, droite.",
    gesture: "swipe-pan",
    gestureAlt: "Un doigt balaye l'écran pour déplacer la vue.",
  },
];

// Shared field / threats / systems (indices 4-15)
const TUTORIAL_FIELD_LINES: readonly NarrativeLine[] = [
  {
    speaker: "DISPATCH",
    text: "Ton tir frappe instantané. Leurs balles voyagent : lis la trajectoire et décale-toi.",
    diagram: "shot-read-player-vs-enemy-bullet",
    diagramAlt:
      "Comparaison tir joueur et balle ennemie : impact immédiat côté joueur, projectile visible côté ennemi avec trajectoire à éviter.",
  },
  {
    speaker: "DISPATCH",
    text: "Caisse d'armement : tire dessus, arme spéciale active, stock fini puis retour calibre de base.",
    diagram: "weapon-crate-loop",
    diagramAlt:
      "Boucle d'armement : tir sur caisse, arme spéciale active, munitions spéciales épuisées, retour automatique à l'arme de base.",
  },
  {
    speaker: "KENZA",
    text: "Flic fenêtre : cible directe. Une balle suffit, mais il tire vite.",
    image: "assets/enemy_shooting.png",
    imageAlt: "Un flic qui dégaine à la fenêtre",
  },
  {
    speaker: "KENZA",
    text: "CRS : deux balles minimum. Tu lâches pas après la première.",
    image: "assets/enemy_riot_shooting.png",
    imageAlt: "Un CRS anti-émeute qui dégaine",
  },
  {
    speaker: "KENZA",
    text: "Motard : apparition éclair. Tu vois, tu tires.",
    image: "assets/enemy_biker_shooting.png",
    imageAlt: "Un motard qui dégaine à la fenêtre",
  },
  {
    speaker: "KENZA",
    text: "Bonus : il tire pas. Tu le prends pour +5 secondes, pas pour le quota.",
    image: "assets/enemy_bonus.png",
    imageAlt: "Une cible bonus qui donne du temps",
  },
  {
    speaker: "KENZA",
    text: "Livreur civil dans la rue : intouchable. Un tir dessus, vie et point en moins.",
    image: "assets/courier/rider.png",
    imageAlt: "Le livreur civil dans la rue",
    teachingBullets: ["Action : ne tire jamais", "Sinon : -1 vie et pénalité score"],
  },
  {
    speaker: "DISPATCH",
    text: "Priorité menace : CRS d'abord, puis motard, puis flic. Bonus et livreur en bas.",
    diagram: "threat-hierarchy-ladder",
    diagramAlt:
      "Échelle de priorité des menaces : CRS en tête, puis motard, puis flic standard ; bonus et livreur en bas de l'échelle.",
  },
  {
    speaker: "DISPATCH",
    text: "Prise d'otage : l'anneau passe rouge, jaune, vert. Tire au vert.",
    diagram: "hostage-ring",
    diagramAlt:
      "Un anneau de visée passe du rouge au jaune puis au vert sur le preneur d'otage ; on tire au vert.",
    teachingBullets: ["Action : tirer au vert", "Sinon : otage en danger"],
  },
  {
    speaker: "DISPATCH",
    text: "Niveau boss : chrono à zéro, bascule finale Commandant. Le quota ne ferme plus la manche.",
    diagram: "boss-finale-switch",
    diagramAlt:
      "Bascule de fin de niveau boss : expiration du chrono active la phase finale Commandant et remplace la fin par quota.",
  },
  {
    speaker: "DISPATCH",
    text: "En haut : score, niveau, vague, chrono, vies. Au passage du camion, garde la jauge livraison au vert.",
  },
  {
    speaker: "DISPATCH",
    text: "Compris ? Bouge. Rue Belliard t'attend.",
  },
];
```

---

## Bullet discipline checklist

- Bullets used only on high-risk panels: **mobile shoot**, **never shoot courier**, **hostage green shot**.
- Each panel using bullets has **2 max**, action-oriented.
- No bullets on already one-glance decode panels.
