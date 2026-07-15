/**
 * Intent token for a code-drawn animated gesture illustration (ADR-0020). Pure data:
 * the four values map 1:1 to render-side icons in `src/render/ui/GestureIcon.tsx`. The
 * game layer never draws — it only names the gesture. Device-correctness is STRUCTURAL:
 * `mouse-click`/`edge-scroll` live only on the desktop control segment, `two-finger-tap`/
 * `swipe-pan` only on the mobile one (ADR-0015 D1/D2) — the game layer never sees the device.
 */
export type GestureKind = "mouse-click" | "edge-scroll" | "two-finger-tap" | "swipe-pan";

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
   * décor; the panel renders exactly as before (both tutorial variants omit it).
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
    text: "Écoute bien, Muf. La règle tient en trois mots : Récupérer, Livrer, Éviter.",
  },
  {
    speaker: "DISPATCH",
    text: "Le colis arrive par le véhicule. Couvre-le pendant la livraison, puis laisse-le repartir intact.",
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
    text: "Pour tirer : tape à DEUX doigts en même temps, bref et net — la balle part pile entre tes doigts. Ou tape deux fois d'un seul doigt, un double-tap, là où tu vises.",
    gesture: "two-finger-tap",
    gestureAlt: "Deux doigts en un tap simultané, ou un double-tap d'un seul doigt, pour tirer.",
  },
  {
    speaker: "KENZA",
    text: "La rue déborde de l'écran. Un doigt pour balayer — haut, bas, gauche, droite. Une pichenette, et ça glisse tout seul.",
    gesture: "swipe-pan",
    gestureAlt: "Un doigt balaye l'écran pour déplacer la vue.",
  },
];

const TUTORIAL_FIELD_LINES: readonly NarrativeLine[] = [
  {
    speaker: "KENZA",
    text: "Le flic à la fenêtre, c'est ta cible. Une balle suffit — mais il dégaine avant toi si tu traînes.",
    image: "assets/enemy_shooting.png",
    imageAlt: "Un flic qui dégaine à la fenêtre",
  },
  {
    speaker: "KENZA",
    text: "Le CRS en tenue anti-émeute encaisse DEUX balles. Un seul tir le fait pas tomber — insiste.",
    image: "assets/enemy_riot_shooting.png",
    imageAlt: "Un CRS anti-émeute qui dégaine",
  },
  {
    speaker: "KENZA",
    text: "Le motard surgit vite et repart vite. Il reste jamais longtemps — vise dès qu'il paraît.",
    image: "assets/enemy_biker_shooting.png",
    imageAlt: "Un motard qui dégaine à la fenêtre",
  },
  {
    speaker: "KENZA",
    text: "Celui-là ne tire jamais. Descends-le pour +5 secondes au chrono — mais il compte pas dans ton quota d'éliminations.",
    image: "assets/enemy_bonus.png",
    imageAlt: "Une cible bonus qui donne du temps",
  },
  {
    speaker: "KENZA",
    text: "Le livreur civil dans la rue, tu le touches JAMAIS. Un tir sur lui : une vie et un point en moins.",
    image: "assets/enemy_civilian.png",
    imageAlt: "Le livreur civil dans la rue",
  },
  {
    speaker: "DISPATCH",
    text: "En haut : ton score, le niveau, la vague, le chrono et tes vies. Quand le colis passe, la jauge de livraison s'affiche au centre — tiens-la au vert.",
  },
  {
    speaker: "DISPATCH",
    text: "Compris ? Alors bouge. Rue Belliard t'attend.",
  },
];

export const TUTORIAL_NARRATIVE_DESKTOP: NarrativeScene = {
  id: "tutorial_desktop",
  lines: [...TUTORIAL_OPENING_LINES, ...DESKTOP_CONTROL_LINES, ...TUTORIAL_FIELD_LINES],
};

export const TUTORIAL_NARRATIVE_MOBILE: NarrativeScene = {
  id: "tutorial_mobile",
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
};
