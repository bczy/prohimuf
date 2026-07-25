/**
 * Intent token for a code-drawn animated gesture illustration (ADR-0020). Pure data:
 * the four values map 1:1 to render-side icons in `src/render/ui/GestureIcon.tsx`. The
 * game layer never draws — it only names the gesture. Device-correctness is STRUCTURAL:
 * `mouse-click`/`edge-scroll` live only on the desktop control segment, `two-finger-tap`/
 * `swipe-pan` only on the mobile one (ADR-0015 D1/D2) — the game layer never sees the device.
 */
export type GestureKind = "mouse-click" | "edge-scroll" | "two-finger-tap" | "swipe-pan";

/**
 * Intent token for a code-drawn animated MECHANIC diagram (distinct from the control
 * `GestureKind`: a diagram teaches a game rule, not a device input, so it is NOT
 * device-forked). Pure data: each value maps 1:1 to a render-side illustration in
 * `src/render/ui/DiagramIcon.tsx`; the game layer only NAMES it, never draws. `hostage-ring`
 * = the spatial-colour reticle of the hostage QTE (the ring sweeps the captor and changes
 * colour by the anatomy under it — vital/limb/off); the render lane draws it in the exact
 * `hostageCue` hues so the tutorial teaches the true in-game colours.
 */
export type DiagramKind =
  | "shot-read-player-vs-enemy-bullet"
  | "weapon-crate-loop"
  | "threat-hierarchy-ladder"
  | "hostage-ring"
  | "boss-finale-switch";

export interface NarrativeLine {
  readonly speaker: string; // character name
  readonly text: string;
  /**
   * Optional illustration shown above the dialogue box (ADR-0012, D5). Path is
   * relative to `public/assets/` WITHOUT a leading slash (e.g. `"assets/enemy_bonus.png"`);
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
  /**
   * Optional code-drawn gesture icon shown in the same slot as `image` (ADR-0020).
   * MUTUALLY EXCLUSIVE with `image` — a panel sets one or the other, never both. The
   * render layer draws the matching animated SVG/CSS icon; no sprite is referenced, so
   * this triggers no asset generation (ADR-0012 D5 guarantee preserved).
   */
  readonly gesture?: GestureKind;
  /**
   * Accessible French label for `gesture`, parallel to `imageAlt` (ADR-0020). Consumed by
   * the render lane as `gestureAlt ?? ""`. Only meaningful alongside `gesture`.
   */
  readonly gestureAlt?: string;
  /**
   * Optional code-drawn animated MECHANIC diagram shown in the SAME slot as `image`/`gesture`.
   * MUTUALLY EXCLUSIVE with them — a panel sets at most one illustration channel. The render
   * layer draws the matching animated SVG; no sprite is referenced (no asset generation). Used
   * to teach a rule that has no shipped sprite (e.g. the hostage-QTE colour ring).
   */
  readonly diagram?: DiagramKind;
  /**
   * Accessible French label for `diagram`, parallel to `gestureAlt`. Consumed by the render
   * lane as `diagramAlt ?? ""`. Only meaningful alongside `diagram`.
   */
  readonly diagramAlt?: string;
  /**
   * Optional concise textual reinforcement bullets for a tutorial panel. Additive and
   * render-agnostic: at most 2 short non-empty strings when authored.
   */
  readonly teachingBullets?: readonly string[];
}

export interface NarrativeScene {
  readonly id: string;
  readonly lines: readonly NarrativeLine[];
  /**
   * Optional per-scene location décor (ADR-0023, amending ADR-0021 D5). A facade path
   * under `public/assets/` WITHOUT a leading slash (e.g. `"assets/levels/belliard/facade.png"`).
   * The render lane prefixes `import.meta.env.BASE_URL` and paints it as a full-bleed
   * halftone-B&W wash BEHIND the (unchanged) transcript — grayscale via `HalftoneHero`,
   * zero glow. Structural twin of `NarrativeLine.image`, lifted to scene scope. Absent ⇒ no
   * décor; authored tutorial/pre/post scenes may set it.
   */
  readonly backdrop?: string;
}

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
    teachingBullets: ["Ton tir: impact direct", "Leur tir: projectile à esquiver"],
  },
  {
    speaker: "DISPATCH",
    text: "Caisse d'armement : tire dessus pour équiper spécial. Stock fini, retour automatique au calibre de base.",
    diagram: "weapon-crate-loop",
    diagramAlt:
      "Boucle d'armement : tir sur caisse, arme spéciale active, munitions spéciales épuisées, retour automatique à l'arme de base.",
    teachingBullets: ["LOOT → spécial actif", "Stock épuisé → arme de base (∞)"],
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
  },
  {
    speaker: "DISPATCH",
    text: "Priorité menace : CRS d'abord, puis motard, puis flic. Bonus et livreur ne font pas monter le danger.",
    diagram: "threat-hierarchy-ladder",
    diagramAlt:
      "Échelle de priorité des menaces : CRS en tête, puis motard, puis flic standard ; bonus et livreur en bas de l'échelle.",
    teachingBullets: ["CRS > motard > flic", "Bonus/livreur = non prioritaires"],
  },
  {
    speaker: "DISPATCH",
    text: "Parfois, prise d'otage : l'anneau passe rouge, jaune, vert. Tu tires au vert.",
    diagram: "hostage-ring",
    diagramAlt:
      "Un anneau de visée passe du rouge au jaune puis au vert sur le preneur d'otage ; on tire au vert.",
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
      "HUD: score/niveau/vague/temps/vies",
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
