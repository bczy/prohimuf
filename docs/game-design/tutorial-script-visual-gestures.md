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

> **Source of truth : `src/game/systems/narrativeSystem.ts`.** Ce bloc en est le miroir
> littéral (commentaires de code omis, constante `MUF_RIDER_IMAGE` inlinée) — toute
> évolution du code doit être répercutée ici dans le même cycle, sinon ce document ment.
> Aligné sur le code shippé le 2026-07-27 (post-amendement §D2.2 : puces sur les index
> 5, 10, 12, 14).

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
    text: "Pour tirer : le viseur suit ta souris. Clic gauche, un coup part — une seule action, rien de plus.",
    gesture: "mouse-click",
    gestureAlt: "Souris : un clic gauche, un tir.",
  },
  {
    speaker: "KENZA",
    text: "La rue déborde de l'écran. Pousse le curseur au bord — la vue suit, dans les deux sens.",
    gesture: "edge-scroll",
    gestureAlt: "Curseur poussé au bord de l'écran : la vue défile.",
  },
];

// Mobile controls (indices 2-3, fork)
const MOBILE_CONTROL_LINES: readonly NarrativeLine[] = [
  {
    speaker: "KENZA",
    text: "Tire au tap à deux doigts, en même temps. Ou double-tap d'un doigt là où tu vises.",
    gesture: "two-finger-tap",
    gestureAlt: "Tap simultané à deux doigts, ou double-tap d'un doigt, pour tirer.",
  },
  {
    speaker: "KENZA",
    text: "Un doigt balaie la rue : haut, bas, gauche, droite. Pichenette, ça continue seul.",
    gesture: "swipe-pan",
    gestureAlt: "Un doigt balaye l'écran pour déplacer la vue avec inertie.",
  },
];

// Shared field / threats / systems (indices 4-15)
const TUTORIAL_FIELD_LINES: readonly NarrativeLine[] = [
  {
    speaker: "DISPATCH",
    text: "Ton tir frappe instantané à l'impact. Leurs balles voyagent : lis la trajectoire et décale-toi.",
    diagram: "shot-read-player-vs-enemy-bullet",
    diagramAlt:
      "Comparaison tir joueur et balle ennemie : impact immédiat côté joueur, projectile visible côté ennemi avec trajectoire à éviter.",
  },
  {
    speaker: "DISPATCH",
    text: "Caisse d'armement : tire dessus pour équiper spécial. Stock fini, retour automatique au calibre de base.",
    diagram: "weapon-crate-loop",
    diagramAlt:
      "Boucle d'armement : tir sur caisse, arme spéciale active, munitions spéciales épuisées, retour automatique à l'arme de base.",
    teachingBullets: [
      "HUD arme : A = calibre, stock ∞",
      "B/C = spécial : compteur, clignote sur réserve",
    ],
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
    text: "Le livreur civil dans la rue, tu le touches JAMAIS. Un tir sur lui : une vie et un point en moins.",
    image: "assets/courier/rider.png", // MUF_RIDER_IMAGE
    imageAlt: "Le livreur civil dans la rue",
    teachingBullets: ["On tire aux fenêtres, jamais dans la rue"],
  },
  {
    speaker: "DISPATCH",
    text: "Priorité menace : CRS d'abord, puis motard, puis flic. Bonus et livreur ne font pas monter le danger.",
    diagram: "threat-hierarchy-ladder",
    diagramAlt:
      "Échelle de priorité des menaces : CRS en tête, puis motard, puis flic standard ; bonus et livreur en bas de l'échelle.",
  },
  {
    speaker: "DISPATCH",
    text: "Parfois, prise d'otage : l'anneau passe rouge, jaune, vert. Tu tires au vert.",
    diagram: "hostage-ring",
    diagramAlt:
      "Un anneau de visée passe du rouge au jaune puis au vert sur le preneur d'otage ; on tire au vert.",
    teachingBullets: [
      "La couleur suit la zone sous l'anneau",
      "Vert = tête, jaune = torse, rouge = 0 dégât",
    ],
  },
  {
    speaker: "DISPATCH",
    text: "En niveau boss, chrono à zéro : bascule finale Commandant. Le quota ne termine plus la manche.",
    diagram: "boss-finale-switch",
    diagramAlt:
      "Bascule de fin de niveau boss : expiration du chrono active la phase finale Commandant et remplace la fin par quota.",
  },
  {
    speaker: "DISPATCH",
    text: "En haut : score, niveau, vague, chrono, vies. Au passage du camion, la jauge de livraison doit rester au vert.",
    teachingBullets: [
      "HUD: score/niveau/vague/temps/vies/arme",
      "Livraison: jauge verte pendant le passage",
    ],
  },
  {
    speaker: "DISPATCH",
    text: "Compris ? Bouge. Rue Belliard t'attend.",
  },
];
```

---

## Bullet discipline checklist

- Bullets used only on the amended §D2.2 whitelist (spec-tutorial-narrative-presentation.md):
  **weapon-crate-loop** (index 5), **never shoot courier** (index 10),
  **hostage green shot** (index 12), **HUD recap** (index 14).
- Each panel using bullets has **2 max**, action-oriented.
- No bullets on already one-glance decode panels (the mobile shoot gesture decodes in
  one glance with its icon — its former bullets were removed by the amendment).
