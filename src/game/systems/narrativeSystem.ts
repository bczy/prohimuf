export interface NarrativeLine {
  readonly speaker: string; // character name
  readonly text: string;
  /**
   * Optional illustration shown above the dialogue box (ADR-0012, D5). Path is
   * relative to `public/assets/` WITHOUT a leading slash (e.g. `"assets/enemy_civilian.png"`);
   * the render lane prefixes `import.meta.env.BASE_URL` for GitHub Pages. Only sprites
   * already shipped in `public/assets/` are referenced; text-only panels omit it, so
   * existing narrative scenes render exactly as before.
   */
  readonly image?: string;
  /**
   * Optional alt text for `image` (ADR-0012, D5 — accessibility). Short French
   * description of the informative sprite, consumed by the render lane as
   * `currentLine.imageAlt ?? ""`. Only meaningful alongside `image`.
   */
  readonly imageAlt?: string;
}

export interface NarrativeScene {
  readonly id: string;
  readonly lines: readonly NarrativeLine[];
}

/**
 * Optional scripted onboarding stage (ADR-0012, D4). A SEPARATE constant — never keyed
 * into `PRE_/POST_LEVEL_NARRATIVE` (whose keys must stay ⊆ level ids, and whose entries
 * drive the pre/post-level flow). Briefing register: DISPATCH/KENZA brief Muf directly,
 * short imperative lines, informative but fanzine — not the oblique intro voice. Covers
 * only mechanics live in a launchable level today (window cops + street courier): the
 * core loop, the controls (with the mobile two-axis swipe this stage exists for), the
 * two shipped enemies, and the HUD. Panels are illustrated only where a sprite already
 * ships; the HUD panel is text-only (no HUD art asset exists).
 */
export const TUTORIAL_NARRATIVE: NarrativeScene = {
  id: "tutorial",
  lines: [
    {
      speaker: "DISPATCH",
      text: "Écoute bien, Muf. La règle tient en trois mots : Récupérer, Livrer, Éviter.",
    },
    {
      speaker: "DISPATCH",
      text: "Le colis arrive par le véhicule. Tu le couvres pendant la livraison, tu le laisses repartir intact.",
      image: "assets/vehicles/truck.png",
      imageAlt: "Le camion de livraison",
    },
    {
      speaker: "KENZA",
      text: "Pour tirer : clic ou tap sur la fenêtre. Une seule action, rien de plus.",
    },
    {
      speaker: "KENZA",
      text: "La rue déborde de l'écran. Au bureau, bord ou glisser ; sur mobile, tu balaies — haut, bas, gauche, droite.",
    },
    {
      speaker: "KENZA",
      text: "Les flics aux fenêtres, c'est tes cibles. Ils dégainent avant toi si tu traînes.",
      image: "assets/enemy_shooting.png",
      imageAlt: "Un flic qui dégaine à la fenêtre",
    },
    {
      speaker: "KENZA",
      text: "Le livreur dans la rue, lui, tu le touches JAMAIS. Un civil à terre et c'est fini pour nous.",
      image: "assets/enemy_civilian.png",
      imageAlt: "Le livreur civil dans la rue",
    },
    {
      speaker: "DISPATCH",
      text: "En haut : le chrono, tes vies, ton score, le compteur d'éliminations à atteindre, et la fenêtre de livraison.",
    },
    {
      speaker: "DISPATCH",
      text: "Compris ? Alors bouge. Rue Belliard t'attend.",
    },
  ],
};

/** Dialogue shown BEFORE a level starts */
export const PRE_LEVEL_NARRATIVE: Record<string, NarrativeScene> = {
  belliard: {
    id: "belliard_pre",
    lines: [
      { speaker: "DISPATCH", text: "Muf. T'as une livraison rue Belliard. 19e." },
      { speaker: "MUF", text: "C'est chaud là-bas non ?" },
      { speaker: "DISPATCH", text: "Les flics patrouillent depuis la manif. Reste sur les toits." },
      { speaker: "MUF", text: "...t'as dit quoi ?" },
      { speaker: "DISPATCH", text: "Les fenêtres, Muf. Les fenêtres." },
    ],
  },
  stalingrad: {
    id: "stalingrad_pre",
    lines: [
      { speaker: "MUF", text: "Stalingrad. Le grand immeuble sur le canal." },
      { speaker: "KENZA", text: "Fais gaffe aux RG. Ils ont des planques là-dedans depuis '95." },
      { speaker: "MUF", text: "Combien de fenêtres ?" },
      { speaker: "KENZA", text: "Trop. Tu peux pas toutes les surveiller." },
      { speaker: "MUF", text: "On va voir." },
    ],
  },
  vitry: {
    id: "vitry_pre",
    lines: [
      { speaker: "KENZA", text: "Vitry. Le 94. Tu connais ?" },
      { speaker: "MUF", text: "J'ai grandi là-bas." },
      { speaker: "KENZA", text: "Alors tu sais que les barres ont des yeux partout." },
      { speaker: "MUF", text: "Ouais. Et les yeux ils me connaissent." },
      { speaker: "KENZA", text: "Pas les nouveaux." },
    ],
  },
};

/** Dialogue shown AFTER a level (win only) */
export const POST_LEVEL_NARRATIVE: Record<string, NarrativeScene> = {
  belliard: {
    id: "belliard_post",
    lines: [
      { speaker: "MUF", text: "Livraison faite. Rue Belliard." },
      { speaker: "DISPATCH", text: "La rave commence dans deux heures. Stalingrad." },
      { speaker: "MUF", text: "Ils changent pas." },
      { speaker: "DISPATCH", text: "C'est pour ça qu'on les aime." },
    ],
  },
  stalingrad: {
    id: "stalingrad_post",
    lines: [
      { speaker: "MUF", text: "Canal propre. Personne a suivi." },
      { speaker: "KENZA", text: "Le son tient jusqu'à l'aube. Tu viens ?" },
      { speaker: "MUF", text: "J'ai encore Vitry." },
      { speaker: "KENZA", text: "Après Vitry." },
      { speaker: "MUF", text: "Après Vitry." },
    ],
  },
  vitry: {
    id: "vitry_post",
    lines: [
      { speaker: "MUF", text: "..." },
      { speaker: "MUF", text: "Les barres. L'odeur du béton chaud la nuit." },
      { speaker: "MUF", text: "Ma mère habitait au 9e. Fenêtre du coin." },
      { speaker: "MUF", text: "J'aurais pas dû revenir." },
      { speaker: "KENZA", text: "...Muf ?" },
      { speaker: "MUF", text: "On rentre." },
    ],
  },
};
