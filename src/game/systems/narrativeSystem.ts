import type {
  DiagramKind,
  GestureKind,
  NarrativeLine,
  NarrativeScene,
} from "@game/types/narrative";

// The narrative authoring TYPES live in `@game/types/narrative` (types/ must not depend on
// systems/, and `PhotoQteSpec.briefingLines` needs `NarrativeLine`). Re-exported here so
// every existing consumer keeps importing them from this module.
export type { DiagramKind, GestureKind, NarrativeLine, NarrativeScene };

/** Rider sprite = Muf the courier; alt kept constant everywhere it illustrates a MUF line. */
const MUF_RIDER_IMAGE = "assets/courier/rider.png";
const MUF_RIDER_ALT = "Muf, le coursier à moto";

/**
 * Optional scripted onboarding stage (ADR-0012, D4). A SEPARATE constant — never keyed
 * into `PRE_/POST_LEVEL_NARRATIVE` (whose keys must stay ⊆ level ids, and whose entries
 * drive the pre/post-level flow). Briefing register: DISPATCH/KENZA brief Muf directly,
 * short imperative lines, informative but fanzine — not the oblique intro voice. Covers
 * only mechanics live in a launchable level today: the core loop, the controls, the five
 * shipped Belliard enemies (normal cop / riot cop / biker / bonus / civilian courier), and
 * the HUD. Bestiary panels are illustrated by already-shipped sprites; the two control panels
 * by code-drawn gesture icons (ADR-0020); the HUD panel is text-only (no HUD art asset exists).
 *
 * Per ADR-0015 (amending ADR-0012 D4) the stage forks into two variants —
 * `TUTORIAL_NARRATIVE_DESKTOP` and `TUTORIAL_NARRATIVE_MOBILE` — that differ ONLY on the
 * two control panels; every other segment is composed from the same shared objects by
 * reference, so opening/field copy stays authored once. The render layer picks the
 * variant once at load via `IS_MOBILE`; the game layer never sees the device.
 */
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
    // C2 (spec D2.2): the crate diagram animates the LOOT loop but never shows the HUD
    // `arme` readout that reports it — so the bullets teach the instrument, not the loop.
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
    // Same rider art as the Muf panels, but a different diegetic subject — keep
    // the civilian alt (the retired enemy_civilian.png sprite was replaced by the
    // shipped rider flipbook frame 1).
    image: MUF_RIDER_IMAGE,
    imageAlt: "Le livreur civil dans la rue",
    // C3 (spec D2.2): a punished action (−1 vie, −1 point) illustrated by Muf's OWN
    // rider art — the bullet gives the rule that resolves the identity confusion.
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
    // C3 (spec D2.2): the line reads as a TIMING sequence ("passe rouge, jaune, vert"),
    // but the ring colour is a POSITION readout — a mis-timed shot costs the QTE.
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
    // C1 (spec D2.2): text-only panel enumerating the whole ticker strip — the bullets
    // supply the scannable structure prose cannot, `arme` included (the readout panel 5
    // teaches, listed here where the strip is enumerated).
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

export const TUTORIAL_NARRATIVE_DESKTOP: NarrativeScene = {
  id: "tutorial_desktop",
  backdrop: "assets/levels/belliard/facade.png",
  lines: [...TUTORIAL_OPENING_LINES, ...DESKTOP_CONTROL_LINES, ...TUTORIAL_FIELD_LINES],
};

export const TUTORIAL_NARRATIVE_MOBILE: NarrativeScene = {
  id: "tutorial_mobile",
  backdrop: "assets/levels/belliard/facade.png",
  lines: [...TUTORIAL_OPENING_LINES, ...MOBILE_CONTROL_LINES, ...TUTORIAL_FIELD_LINES],
};

/** Dialogue shown BEFORE a level starts */
export const PRE_LEVEL_NARRATIVE: Record<string, NarrativeScene> = {
  belliard: {
    id: "belliard_pre",
    backdrop: "assets/levels/belliard/facade.png",
    lines: [
      {
        speaker: "DISPATCH",
        text: "Muf. T'as une livraison rue Belliard. 19e.",
        image: "assets/vehicles/truck.png",
        imageAlt: "Le camion de livraison",
      },
      {
        speaker: "MUF",
        text: "C'est chaud là-bas non ?",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      {
        speaker: "DISPATCH",
        text: "Les flics patrouillent depuis la manif. Reste sur les toits.",
        image: "assets/enemy_shooting.png",
        imageAlt: "Un flic qui dégaine à la fenêtre",
      },
      { speaker: "MUF", text: "...t'as dit quoi ?" },
      { speaker: "DISPATCH", text: "Les fenêtres, Muf. Les fenêtres." },
    ],
  },
  stalingrad: {
    id: "stalingrad_pre",
    backdrop: "assets/levels/stalingrad/facade.png",
    lines: [
      { speaker: "MUF", text: "Stalingrad. Le grand immeuble sur le canal." },
      {
        speaker: "KENZA",
        text: "Fais gaffe aux RG. Ils ont des planques là-dedans depuis '95.",
        image: "assets/enemy_shooting.png",
        imageAlt: "Un RG en planque à la fenêtre",
      },
      {
        speaker: "MUF",
        text: "Combien de fenêtres ?",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "KENZA", text: "Trop. Tu peux pas toutes les surveiller." },
      { speaker: "MUF", text: "On va voir.", image: MUF_RIDER_IMAGE, imageAlt: MUF_RIDER_ALT },
    ],
  },
  vitry: {
    id: "vitry_pre",
    backdrop: "assets/levels/vitry/facade.png",
    lines: [
      { speaker: "KENZA", text: "Vitry. Le 94. Tu connais ?" },
      {
        speaker: "MUF",
        text: "J'ai grandi là-bas.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "KENZA", text: "Alors tu sais que les barres ont des yeux partout." },
      {
        speaker: "MUF",
        text: "Ouais. Et les yeux ils me connaissent.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "KENZA", text: "Pas les nouveaux." },
    ],
  },
  // Niveau Final — l'Éden (STORY-BOSS-NIVEAU-FINAL-LIVE / ADR-0053). The gated `final_pre` script
  // (spec-boss-encounter-fiction §4.1), wired VERBATIM under the concrete level id. Only the scene
  // id (flag A: `niveau-final_pre`, test A2) and the mandatory backdrop (flag B: ADR-0023, test A5)
  // are new — not one French line changes. The venue is set up player-facing by the title, the
  // flyer and this l'Éden-interior backdrop, never by naming it in-dialogue (gate ruling Q1 = NO).
  "niveau-final": {
    id: "niveau-final_pre",
    backdrop: "assets/levels/niveau-final/facade.png",
    lines: [
      {
        speaker: "DISPATCH",
        text: "31 décembre. Tout Paris est dehors. Le dernier son du siècle, Muf.",
      },
      { speaker: "MUF", text: "Et les flics ?", image: MUF_RIDER_IMAGE, imageAlt: MUF_RIDER_ALT },
      {
        speaker: "DISPATCH",
        text: "Débordés. Partout à la fois. Sauf un.",
        image: "assets/enemy_shooting.png",
        imageAlt: "Un flic qui dégaine à la fenêtre",
      },
      {
        speaker: "MUF",
        text: "...le Commandant.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      {
        speaker: "DISPATCH",
        text: "Cette nuit il n'a plus personne pour le couvrir. Il descend lui-même.",
      },
      {
        speaker: "DISPATCH",
        text: "Il tire le premier. C'est là qu'il est à découvert. Nulle part ailleurs.",
      },
      {
        speaker: "MUF",
        text: "Une seule fenêtre.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "DISPATCH", text: "Une. Livre le son, Muf. Qu'il danse jusqu'en 2000." },
    ],
  },
};

/** Dialogue shown AFTER a level (win only) */
export const POST_LEVEL_NARRATIVE: Record<string, NarrativeScene> = {
  belliard: {
    id: "belliard_post",
    backdrop: "assets/levels/belliard/facade.png",
    lines: [
      {
        speaker: "MUF",
        text: "Livraison faite. Rue Belliard.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "DISPATCH", text: "La rave commence dans deux heures. Stalingrad." },
      {
        speaker: "MUF",
        text: "Ils changent pas.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "DISPATCH", text: "C'est pour ça qu'on les aime." },
    ],
  },
  stalingrad: {
    id: "stalingrad_post",
    backdrop: "assets/levels/stalingrad/facade.png",
    lines: [
      {
        speaker: "MUF",
        text: "Canal propre. Personne a suivi.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "KENZA", text: "Le son tient jusqu'à l'aube. Tu viens ?" },
      {
        speaker: "MUF",
        text: "J'ai encore Vitry.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "KENZA", text: "Après Vitry." },
      { speaker: "MUF", text: "Après Vitry." },
    ],
  },
  vitry: {
    id: "vitry_post",
    backdrop: "assets/levels/vitry/facade.png",
    lines: [
      // The Vitry grief monologue stays imageless — the barres facade carries it alone;
      // only the closing "On rentre." reopens the loop with Muf back on the bike.
      { speaker: "MUF", text: "..." },
      { speaker: "MUF", text: "Les barres. L'odeur du béton chaud la nuit." },
      { speaker: "MUF", text: "Ma mère habitait au 9e. Fenêtre du coin." },
      { speaker: "MUF", text: "J'aurais pas dû revenir." },
      { speaker: "KENZA", text: "...Muf ?" },
      { speaker: "MUF", text: "On rentre.", image: MUF_RIDER_IMAGE, imageAlt: MUF_RIDER_ALT },
    ],
  },
  // Niveau Final — l'Éden (win). The gated `final_post` script (spec-boss-encounter-fiction §4.2),
  // wired VERBATIM. Only the scene id (`niveau-final_post`, test A2) and the backdrop (test A5) are
  // new. The emotional beat is the city holding into 2000, not the kill (the boss's fall stays flat,
  // one line). The only level with the right to conclude — closes the loop on l'an 2000.
  "niveau-final": {
    id: "niveau-final_post",
    backdrop: "assets/levels/niveau-final/facade.png",
    lines: [
      { speaker: "MUF", text: "Le son passe.", image: MUF_RIDER_IMAGE, imageAlt: MUF_RIDER_ALT },
      { speaker: "DISPATCH", text: "Et le Commandant ?" },
      {
        speaker: "MUF",
        text: "À terre. Ses hommes l'ont pas vu tomber.",
        image: MUF_RIDER_IMAGE,
        imageAlt: MUF_RIDER_ALT,
      },
      { speaker: "DISPATCH", text: "Minuit dans deux minutes. Écoute la ville." },
      { speaker: "MUF", text: "...ça tient.", image: MUF_RIDER_IMAGE, imageAlt: MUF_RIDER_ALT },
      { speaker: "DISPATCH", text: "Bonne année, Muf." },
    ],
  },
};
