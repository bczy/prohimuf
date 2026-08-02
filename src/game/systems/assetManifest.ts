import { CORE_ARCHETYPES, archetype, buildWeightedFrom } from "@game/types/enemyTypes";
import type { CoreEnemyKind, EnemyKind } from "@game/types/enemy";
import type { VehicleType } from "@game/types/delivery";
import { ALL_LEVELS, LEVELS, FIRST_PLAYABLE_LEVEL } from "@game/levels/levels";
import type { LevelConfig } from "@game/levels/levels";
import { GENERATED_LEVEL_ART } from "@game/levels/generated";
import {
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
} from "@game/systems/narrativeSystem";
import type { DiagramKind, GestureKind, NarrativeScene } from "@game/systems/narrativeSystem";
import levelArt from "@game/levels/levelArt.json";

/**
 * Pure, deterministic asset manifest for the progressive loading screen. Builds
 * de-duplicated, stably-ordered BASE-RELATIVE asset paths (e.g.
 * `"assets/enemy_shooting_f2.png"`) — NO `import.meta.env.BASE_URL`, no leading
 * slash. The render lane prefixes `BASE_URL` at load time.
 *
 * The path builders here mirror the private builders in
 * `src/render/scene/enemyTextures.ts` and `src/render/scene/courierTextures.ts`
 * byte-for-byte minus the `BASE_URL` prefix; Lane B refactors those to import
 * these, so parity is load-bearing (pinned in the spec).
 *
 * Zero React / Three imports — this module stays in the pure game core.
 */

/**
 * What a caller asks a manifest for. The tutorial is DEVICE-FORKED: the render layer
 * already owns the device decision (it picks the scene it will draw via `IS_MOBILE`), so
 * it names the fork it wants and the game layer only maps string → scene. There is
 * deliberately NO bare `"tutorial"` target and no `isMobile` parameter — the device must
 * not leak into `src/game` (ADR-0015), and a device must not preload the other fork's
 * panels. Any other string is a level id.
 */
export type ManifestTarget = "menu" | "tutorial-desktop" | "tutorial-mobile" | (string & {});

// The three backdrop layers a level preloads, in draw order. Mirrors `LAYER_NAMES`
// in levelArt.ts (and what LevelBackdrop actually loads) — duplicated as a local
// literal rather than imported so this module carries NO import-time dependency on
// levelArt.ts, whose module body eagerly reads `levelArt.json` fields (a partial
// JSON mock in a unit test must not have to satisfy them just to import us).
const BACKDROP_LAYERS = ["sky", "facade", "street"] as const;

// Flipbook frame counts, keyed by the exact base filename the enemy path builder
// produces (asset root + variant suffix). Same shape as enemyTextures.ts.
interface FrameEntry {
  readonly frames: readonly string[];
}

// One courier layer as authored in levelArt.json (`courier.layers.<layer>`). Same
// shape as courierTextures.ts (extra fields are ignored here).
interface CourierLayerEntry {
  readonly asset: string;
  readonly frames: readonly string[];
}

// Global enemy fallbacks the renderer swaps in when a kind/variant sprite is
// missing (still generating in CI); always preloaded so no window is ever blank.
const ENEMY_FALLBACKS: readonly string[] = ["assets/enemy_sprite.png", "assets/enemy_shooting.png"];

// All `levelArt.json` reads are LAZY (inside functions) so that importing this
// module has no side effects — it never touches the JSON at load time.

/** De-duplicate preserving first-occurrence order. */
function dedupe(paths: readonly string[]): readonly string[] {
  return [...new Set(paths)];
}

/**
 * The base filename (no path, no `_f<N>` frame suffix, no extension) for an
 * enemy kind/variant/state. Mirrors `baseFileKey` in enemyTextures.ts: the
 * `enemy_sprite` root becomes `enemy_shooting` when shooting (the others append
 * `_shooting`), and a variant > 1 appends `_<variant>`.
 */
export function enemyBaseFileKey(kind: EnemyKind, variant: number, shooting: boolean): string {
  const a = archetype(kind);
  const root = shooting
    ? a.spriteBase === "enemy_sprite"
      ? "enemy_shooting"
      : `${a.spriteBase}_shooting`
    : a.spriteBase;
  const suffix = variant > 1 ? `_${String(variant)}` : "";
  return `${root}${suffix}`;
}

/**
 * Base-relative asset path for an enemy kind/variant/state and 1-based flipbook
 * frame. Mirrors `fileFor` in enemyTextures.ts: the `_f<N>` frame suffix is
 * appended AFTER the variant suffix; frame 1 is the unsuffixed committed PNG.
 */
export function enemyAssetPath(
  kind: EnemyKind,
  variant: number,
  shooting: boolean,
  frame: number,
): string {
  const frameSuffix = frame > 1 ? `_f${String(frame)}` : "";
  return `assets/${enemyBaseFileKey(kind, variant, shooting)}${frameSuffix}.png`;
}

// Flipbook frames authored for a base key (safe default of 1 — idle-only or a
// manifest miss). Mirrors frameCountFor in enemyTextures.ts.
function frameCountForKey(key: string): number {
  const types: Record<string, FrameEntry> = levelArt.enemies.types;
  const entry = types[key];
  return entry !== undefined ? entry.frames.length : 1;
}

// Every idle + (if the archetype shoots) shooting path for one enemy kind, across
// all its variants and each state's authored frame count.
function enemyKindPaths(kind: EnemyKind): string[] {
  const a = archetype(kind);
  const states: boolean[] = a.shoots ? [false, true] : [false];
  const paths: string[] = [];
  for (let variant = 1; variant <= a.variants; variant++) {
    for (const shooting of states) {
      const frames = frameCountForKey(enemyBaseFileKey(kind, variant, shooting));
      for (let frame = 1; frame <= frames; frame++) {
        paths.push(enemyAssetPath(kind, variant, shooting, frame));
      }
    }
  }
  return paths;
}

// ALL_LEVELS, not LEVELS: a generated level is playable but outside the campaign,
// and resolving it to FIRST_PLAYABLE_LEVEL would preload belliard's roster (its
// enemy skins, its vehicle) instead of the level actually about to start.
function levelConfigFor(levelId: string): LevelConfig {
  return ALL_LEVELS.find((l) => l.id === levelId) ?? FIRST_PLAYABLE_LEVEL;
}

// The art of a generated level is a projection of its plan, NOT a levelArt.json
// entry — so every JSON lookup below must consult this first or fall through to
// the first declared level (belliard). `generated/index.ts` is game-pure and has
// no import-time dependency on levelArt.ts, which this module still refuses.
function generatedArtFor(levelId: string) {
  return GENERATED_LEVEL_ART.find((a) => a.id === levelId);
}

// Unique enemy kinds actually spawned in a level's windows, mirroring
// stateMachine.windowPoolFor: `buildWeightedFrom({ ...defaults, ...override })`
// (weight 0 removes a kind), de-duplicated to archetype declaration order.
function windowPoolKinds(level: LevelConfig): EnemyKind[] {
  const overrides = level.roster?.windowWeights;
  const defaults = Object.fromEntries(
    (Object.keys(CORE_ARCHETYPES) as CoreEnemyKind[]).map((k) => [k, CORE_ARCHETYPES[k].weight]),
  ) as Record<EnemyKind, number>;
  const pool = buildWeightedFrom({ ...defaults, ...overrides });
  return [...new Set(pool)];
}

/**
 * Every enemy sprite path a level needs: its window-spawn pool kinds PLUS the
 * two global fallbacks. De-duplicated, stably ordered.
 *
 * The street courier (livreur) is NOT pulled in here: it is drawn from the
 * courier flipbook (see `courierAssetPaths`), not from an enemy sprite. Its
 * legacy `enemy_civilian.png` pre-art fallback was retired with that sprite (see
 * ADR-0029), so `civilian` (window weight 0) never contributes an enemy path.
 */
export function enemyAssetPathsFor(levelId: string): readonly string[] {
  const level = levelConfigFor(levelId);
  const kinds = windowPoolKinds(level);
  return dedupe([...kinds.flatMap(enemyKindPaths), ...ENEMY_FALLBACKS]);
}

/**
 * Base-relative asset path for a courier layer `asset` (already
 * `"assets/courier/<layer>.png"` in levelArt.json) and 1-based flipbook frame.
 * Mirrors `fileFor` in courierTextures.ts: `_f<N>` is inserted before `.png`;
 * frame 1 is unsuffixed.
 */
export function courierAssetPath(asset: string, frame: number): string {
  return frame > 1 ? asset.replace(/\.png$/, `_f${String(frame)}.png`) : asset;
}

// The courier layers CourierSprite actually draws. The `bike` layer was retired
// from the composite — the full-cyclist `rider` sprite carries the whole figure
// (see CourierSprite / courierArtReady, which likewise gates on `["rider"]`) and
// bike.png is not committed — so warming it would only 404. Preload the rendered
// set, `rider` only, so the manifest count matches what the scene loads.
const RENDERED_COURIER_LAYERS = ["rider"] as const;

/** Every frame of every RENDERED courier layer, de-duplicated, stably ordered. */
export function courierAssetPaths(): readonly string[] {
  const layers: Record<string, CourierLayerEntry> = levelArt.courier.layers;
  const paths: string[] = [];
  for (const key of RENDERED_COURIER_LAYERS) {
    const layer = layers[key];
    if (layer === undefined) continue;
    for (let frame = 1; frame <= layer.frames.length; frame++) {
      paths.push(courierAssetPath(layer.asset, frame));
    }
  }
  return dedupe(paths);
}

/** Base-relative delivery-vehicle sprite path (mirrors DeliveryVehicleSprite). */
export function vehicleAssetPath(type: VehicleType): string {
  return `assets/vehicles/${type}.png`;
}

/** Base-relative player-bullet sprite path (mirrors BulletSprite). */
export function bulletAssetPath(): string {
  return "assets/bullet_player.png";
}

/**
 * Base-relative enemy-bullet 3D model path (ADR-0065, mirrors `bulletModel.ts`).
 * Warming it only kicks off the async GLTF load — `BulletSprite` already renders
 * its code-drawn cylinder+cap instantly, so a missing/404 model (not yet
 * generated in CI) never stalls the gate.
 */
export function bulletModelPath(): string {
  return "assets/models/bullet.glb";
}

/**
 * Base-relative boss QTE figure + décor-prop assets for a level that authors a boss
 * ("le Commandant" — ADR-0051/0058): the canon `commander_*` poses plus the generated
 * hall props (lustre, speaker_wall) from levelArt.json's `boss` block, so the loading
 * screen preloads them and the duel never pops in from the riot-cop fallback. Entries
 * flagged `pending` (art not yet generated — e.g. `shield_cover_*`) are EXCLUDED so the
 * preloader never blocks on a 404. Empty for a boss-less level (the additive-and-optional
 * law). Mirrors `bossTextures.ts` / `levelArt.json` minus the `BASE_URL` prefix.
 */
export function bossAssetPaths(levelId: string): readonly string[] {
  const level = LEVELS.find((l) => l.id === levelId);
  if (level?.bossQteSpec === undefined) return [];
  const types = levelArt.boss.types as Record<
    string,
    { readonly asset: string; readonly pending?: boolean } | undefined
  >;
  const paths: string[] = [];
  for (const key of Object.keys(types)) {
    const entry = types[key];
    if (entry === undefined || entry.pending === true) continue;
    paths.push(entry.asset);
  }
  return dedupe(paths);
}

/**
 * Base-relative QTE photo paparazzi set-piece assets (STORY-QTE-PHOTO-PAPARAZZI) for a level
 * that authors `photoQte` (mirrors `bossAssetPaths`' shape: additive-and-optional, `[]` for a
 * photoQte-less level). Reads `levelArt.json`'s `photoQte.plateAsset` + `photoQte.types`
 * (dev-tooling-assets' structure fields — the sibling `photoQte.plate` STRING is the
 * concept-artist's gated prompt and is never read here).
 *
 * Desktop is the loading-screen default (mirrors every other preloaded PNG in this file);
 * the ruling's mobile `_mobile.png` variant is a same-session pipeline downsample of the
 * SAME desktop file (never a second generation, docs/art-direction/gates/
 * photo-qte-resolution-and-sweep-ruling.md §1.6) and is fetched by the render lane only once
 * device is known, so it is intentionally NOT warmed here (would double the download on the
 * device that never draws it).
 *
 * `enabledOnFirstRun: false` (ruling §1.6, gpu-specialist's D2) means an ordinary level entry
 * must NOT warm this group — only a level whose `LevelConfig.photoQte` is actually authored
 * does, so the first Belliard run never downloads a set-piece it will not draw.
 */
export function photoAssetPaths(levelId: string): readonly string[] {
  const level = LEVELS.find((l) => l.id === levelId);
  if (level?.photoQte === undefined) return [];
  const photoQte = levelArt.photoQte as {
    readonly plateAsset?: { readonly asset: string };
    readonly types: Record<string, { readonly asset: string } | undefined>;
  };
  const paths: string[] = [];
  if (photoQte.plateAsset?.asset !== undefined) paths.push(photoQte.plateAsset.asset);
  for (const key of Object.keys(photoQte.types)) {
    const entry = photoQte.types[key];
    if (entry?.asset !== undefined) paths.push(entry.asset);
  }
  return dedupe(paths);
}

// The level-art id to build layer paths from: the requested level when it has
// art, else the first declared level — same fallback as `getLevelArt`, but read
// straight from the JSON so we avoid levelArt.ts's import-time side effects.
function resolveLevelArtId(levelId: string): string {
  const first = levelArt.levels[0];
  const found = levelArt.levels.find((l) => l.id === levelId) ?? first;
  return found?.id ?? levelId;
}

/**
 * The three backdrop layers (sky / facade / street) for a level, base-relative.
 * Mirrors `levelLayerUrl` for the backdrop-layer set; an unknown id resolves to
 * the first declared level (same fallback as `getLevelArt`).
 *
 * The optional `foreground.png` décor layer (ForegroundImage) is intentionally
 * EXCLUDED: it has a guaranteed code-drawn fallback (ForegroundFrames /
 * drawForegroundIronwork) and stays hidden if the PNG is absent, so it is not
 * required for a complete playable frame and need not gate the loading screen.
 */
export function levelLayerPaths(levelId: string): readonly string[] {
  const generated = generatedArtFor(levelId)?.backdrop;
  // A generated level is single-wide by contract (`LevelPlan.backdrop`): one opaque
  // image, warmed alone — the same branch the JSON path takes below.
  if (generated?.mode === "single-wide") {
    return [`assets/levels/${levelId}/${generated.file}.png`];
  }
  const id = resolveLevelArtId(levelId);
  const lvl = levelArt.levels.find((l) => l.id === id) as
    | { backdrop?: { mode?: string; file?: string; tiles?: readonly { file: string }[] } }
    | undefined;
  // Single-wide levels (ADR-0057) bake ciel+immeubles+sol into ONE opaque image
  // and draw nothing else — warm that image alone, not the sky/facade/street trio
  // (suppressed by the single-wide render branch) which would pop nothing useful.
  if (lvl?.backdrop?.mode === "single-wide") {
    // Key on mode alone, mirroring the render (which suppresses sky/facade/street
    // whenever the mode is single-wide): a single-wide level never warms the trio.
    return lvl.backdrop.file ? [`assets/levels/${id}/${lvl.backdrop.file}.png`] : [];
  }
  // Tronçon-sequence levels (ADR-0048) render their tile PNGs + the continuous
  // ground strip — warm THOSE, not the sky/facade/street trio the tronçon path
  // never draws (which would let the gate open onto fallback-colour planes and
  // the whole street pop in mid-play on a slow connection).
  if (lvl?.backdrop?.mode === "troncon-sequence") {
    const tiles = lvl.backdrop.tiles ?? [];
    return dedupe([
      ...tiles.map((t) => `assets/levels/${id}/${t.file}.png`),
      `assets/levels/${id}/ground.png`,
    ]);
  }
  return BACKDROP_LAYERS.map((layer) => `assets/levels/${id}/${layer}.png`);
}

/** Base-relative facade backdrop (mirrors FacadeBackground). */
export function facadeBackdropPath(): string {
  return "assets/facade_bg.png";
}

/**
 * The code-drawn near-foreground props (ADR-0047) a level declares, as synthetic
 * `nearfg:<kind>` manifest entries so the loading gate warms their shared textures
 * (there is no PNG on disk — warmAssets builds the CanvasTexture for this scheme).
 * De-duplicated; empty for a level that opts out (no `nearForeground` field).
 */
export function nearForegroundPaths(levelId: string): readonly string[] {
  const generated = generatedArtFor(levelId);
  const id = resolveLevelArtId(levelId);
  const lvl = levelArt.levels.find((l) => l.id === id) as
    | { nearForeground?: { objects: readonly { kind: string }[] } }
    | undefined;
  // The generated props come from the plan, never from the JSON (whose fallback
  // would hand the level belliard's kerb).
  const objects = (generated ?? lvl)?.nearForeground?.objects;
  if (objects === undefined) return [];
  return dedupe(objects.map((o) => `nearfg:${o.kind}`));
}

/** Base-relative gameplay audio warmed by the level loader. ONLY committed files:
 *  the 3 BGM tiers + the shoot SFX. audioSystem.ts also references hit/death/win
 *  SFX, but those .mp3 are not committed (would 404) — add them here once they land.
 *  A local literal, NOT imported from audioSystem.ts (which pulls Howler +
 *  import.meta and would poison this pure module). */
export function audioAssetPaths(): readonly string[] {
  return [
    "assets/audio/bgm_loop.mp3",
    "assets/audio/bgm_tension.mp3",
    "assets/audio/bgm_danger.mp3",
    "assets/audio/shoot.wav",
  ];
}

/** Base-relative menu / start / end / narrative-screen backdrop. */
export function menuBackdropPath(): string {
  return "assets/levels/belliard/facade.png";
}

/**
 * The illustration sprites a narrative scene references, base-relative and
 * de-duplicated. Scene `image` fields are already stored base-relative (the
 * render lane prefixes BASE_URL), so no normalization is needed here.
 */
export function narrativeImagePaths(scene: NarrativeScene): readonly string[] {
  const paths: string[] = [];
  for (const line of scene.lines) {
    if (line.image !== undefined) paths.push(line.image);
  }
  return dedupe(paths);
}

/**
 * Bitmaps embedded INSIDE the code-drawn gesture icons (`src/render/ui/GestureIcon.tsx`),
 * keyed by the `GestureKind` a panel authors. "Code-drawn" means the icon is vector line
 * art, NOT that it references no asset: `edge-scroll` frames the real Belliard street in
 * its mini-screen (5.9 MB), so that panel costs a fetch like any `image:` panel and must be
 * warmed (ADR-0073 D5, preload-explicitness). The other three icons are pure vector — an
 * empty list, not an omission. Exhaustive over the closed union: a fifth `GestureKind`
 * fails the build here until someone states what it loads (same guard as GestureIcon's own
 * `Record<GestureKind, …>`), so the manifest cannot silently fall behind the icons.
 */
const GESTURE_EMBEDDED_ASSETS: Record<GestureKind, readonly string[]> = {
  "mouse-click": [],
  "edge-scroll": ["assets/levels/belliard/street-wide.png"],
  "two-finger-tap": [],
  "swipe-pan": [],
};

/**
 * Same contract for the code-drawn MECHANIC diagrams (`src/render/ui/DiagramIcon.tsx`):
 * `hostage-ring` and `boss-finale-switch` show the REAL in-game sprites so the tutorial
 * teaches the true silhouettes; the three flow/ladder diagrams are pure vector. The
 * Commandant is his SHIELDED QTE pose (`commander_shielded.png`) — the tutorial branch is
 * the ONLY thing that warms it here, since `bossAssetPaths` runs on the level branch.
 */
const DIAGRAM_EMBEDDED_ASSETS: Record<DiagramKind, readonly string[]> = {
  "shot-read-player-vs-enemy-bullet": [],
  "weapon-crate-loop": [],
  "threat-hierarchy-ladder": [],
  "hostage-ring": ["assets/enemy_hostage.png", "assets/hostage/girl.png"],
  "boss-finale-switch": ["assets/levels/belliard/facade.png", "assets/boss/commander_shielded.png"],
};

/**
 * The bitmaps a scene's code-drawn illustrations embed, base-relative and de-duplicated.
 * Twin of `narrativeImagePaths`, for the other two illustration channels (`gesture` /
 * `diagram`) — together they cover every asset a panel can put on screen.
 */
export function illustrationAssetPaths(scene: NarrativeScene): readonly string[] {
  const paths: string[] = [];
  for (const line of scene.lines) {
    if (line.gesture !== undefined) paths.push(...GESTURE_EMBEDDED_ASSETS[line.gesture]);
    if (line.diagram !== undefined) paths.push(...DIAGRAM_EMBEDDED_ASSETS[line.diagram]);
  }
  return dedupe(paths);
}

/**
 * Everything ONE tutorial fork puts on screen: the menu backdrop the narrative screen
 * shares, the scene's own backdrop, its `image:` panels and the bitmaps its code-drawn
 * gesture/diagram panels embed. Takes the already-selected scene, so no fork ever warms
 * the other's assets — the desktop-only `edge-scroll` panel embeds the 5.7 MB Belliard
 * street image, which a mobile player never draws and must not download.
 */
function tutorialManifest(scene: NarrativeScene): readonly string[] {
  return dedupe([
    menuBackdropPath(),
    ...(scene.backdrop !== undefined ? [scene.backdrop] : []),
    ...narrativeImagePaths(scene),
    ...illustrationAssetPaths(scene),
  ]);
}

/**
 * The full de-duplicated, stably-ordered manifest to preload for a target:
 * - `"menu"` — just the menu backdrop.
 * - `"tutorial-desktop"` / `"tutorial-mobile"` — the corresponding tutorial fork's
 *   assets (see `tutorialManifest`). The caller names the fork; this layer never
 *   looks at the device.
 * - any other string is treated as a level id — its backdrop layers, enemy
 *   sprites, couriers, delivery vehicle, bullet, facade + menu backdrops, the
 *   boss QTE poses + décor props (when the level authors a boss), the photo paparazzi
 *   set-piece plate/poses/stamps (when the level authors `photoQte`), and its
 *   pre/post-level narrative illustrations. Unknown ids fall back to the first
 *   playable level. NOTE: `LEVELS` holds the onboarding stage as a real entry with
 *   `id: "tutorial"`, so a bare `"tutorial"` lands HERE, on the level branch — it is a
 *   level id, not a tutorial target (behaviour pinned in `assetManifest.test.ts`).
 */
export function manifestFor(target: ManifestTarget): readonly string[] {
  if (target === "menu") {
    return dedupe([menuBackdropPath()]);
  }
  if (target === "tutorial-desktop") return tutorialManifest(TUTORIAL_NARRATIVE_DESKTOP);
  if (target === "tutorial-mobile") return tutorialManifest(TUTORIAL_NARRATIVE_MOBILE);

  const level = levelConfigFor(target);
  const paths: string[] = [
    ...levelLayerPaths(target),
    ...enemyAssetPathsFor(target),
    ...courierAssetPaths(),
    ...nearForegroundPaths(target),
    ...bossAssetPaths(target),
    ...photoAssetPaths(target),
  ];
  const delivery = level.deliveries[0];
  if (delivery !== undefined) paths.push(vehicleAssetPath(delivery.vehicleType));
  paths.push(bulletAssetPath(), bulletModelPath(), facadeBackdropPath(), menuBackdropPath());
  paths.push(...audioAssetPaths());

  const pre = PRE_LEVEL_NARRATIVE[level.id];
  if (pre !== undefined) paths.push(...narrativeImagePaths(pre));
  const post = POST_LEVEL_NARRATIVE[level.id];
  if (post !== undefined) paths.push(...narrativeImagePaths(post));

  return dedupe(paths);
}
