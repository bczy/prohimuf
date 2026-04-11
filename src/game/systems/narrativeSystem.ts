export interface NarrativeLine {
  readonly speaker: string; // character name
  readonly text: string;
}

export interface NarrativeScene {
  readonly id: string;
  readonly lines: readonly NarrativeLine[];
}

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
