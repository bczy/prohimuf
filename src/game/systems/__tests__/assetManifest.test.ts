import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  manifestFor,
  enemyBaseFileKey,
  enemyAssetPath,
  enemyAssetPathsFor,
  courierAssetPath,
  courierAssetPaths,
  vehicleAssetPath,
  bulletAssetPath,
  bulletModelPath,
  bossAssetPaths,
  levelLayerPaths,
  facadeBackdropPath,
  menuBackdropPath,
  narrativeImagePaths,
  illustrationAssetPaths,
  audioAssetPaths,
} from "@game/systems/assetManifest";
import {
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
} from "@game/systems/narrativeSystem";
import levelArt from "@game/levels/levelArt.json";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";

// Real file assets, plus the synthetic `nearfg:<kind>` scheme for the code-drawn
// near-foreground props (ADR-0047) — no PNG on disk, warmed by building a texture.
// `nearfg:<kind>` for the 8 pool kinds, `nearfg:<levelId>:<name>` for a generated
// level's own prop (spec-level-harness-sp1 §4.5) — the shape invariant must cover
// the namespaced case too, or generated manifests silently escape it.
const ASSET_RE =
  /^(assets\/.+\.(png|jpg|webp|mp3|wav|glb)|nearfg:[a-zA-Z][a-zA-Z0-9-]*(:[a-zA-Z][a-zA-Z0-9-]*)?)$/;

// Every level id we build a full manifest for, plus the three non-level targets.
// "fixture" (generated, asset-less by design) keeps the generic shape invariant
// honest over generated-level manifests, not just shipped ones.
const LEVEL_IDS = ["belliard", "stalingrad", "vitry", "fixture"] as const;
const NON_LEVEL_TARGETS = ["menu", "tutorial-desktop", "tutorial-mobile"] as const;
const ALL_TARGETS = [...NON_LEVEL_TARGETS, ...LEVEL_IDS, "does-not-exist"] as const;

describe("assetManifest — global invariants", () => {
  it("is deterministic (same output on repeated calls)", () => {
    for (const t of ALL_TARGETS) {
      expect(manifestFor(t)).toEqual(manifestFor(t));
    }
  });

  it("is de-duplicated for every target", () => {
    for (const t of ALL_TARGETS) {
      const m = manifestFor(t);
      expect(new Set(m).size).toBe(m.length);
    }
  });

  it("every entry is a base-relative asset path (no leading slash, no BASE_URL)", () => {
    for (const t of ALL_TARGETS) {
      for (const path of manifestFor(t)) {
        expect(path).toMatch(ASSET_RE);
        expect(path.startsWith("/")).toBe(false);
        expect(path).not.toContain("://");
        expect(path).not.toContain("import.meta");
      }
    }
  });

  // Resurrection guard (ADR-0029): an archetype whose window art was deleted
  // must never re-enter any level's manifest. A future roster giving such a
  // kind a window weight fails HERE, forcing a conscious re-generation of the
  // art before the kind can ship (the manifest mirrors the real spawn pool, so
  // a runtime filter would only hide the 404 — this is the true gate).
  it("no manifest ever references an art-retired archetype's sprite files", () => {
    const retiredBases = Object.values(CORE_ARCHETYPES)
      .filter((a) => a.artRetired === true)
      .map((a) => a.spriteBase);
    expect(retiredBases).toContain("enemy_civilian"); // the guard actually guards
    for (const t of ALL_TARGETS) {
      for (const path of manifestFor(t)) {
        for (const base of retiredBases) {
          expect(path).not.toContain(base);
        }
      }
    }
  });
});

describe("assetManifest — menu & tutorial", () => {
  it("menu manifest is exactly the belliard facade backdrop", () => {
    expect(manifestFor("menu")).toEqual(["assets/levels/belliard/facade.png"]);
    expect(menuBackdropPath()).toBe("assets/levels/belliard/facade.png");
  });

  // The tutorial manifest is DEVICE-FORKED (MAJEUR-R2-01): the render layer picks the
  // fork it will actually render (ADR-0015 — the game layer never sees the device) and
  // asks for THAT target, so a device never pays for the other fork's panels. Pinned as
  // exact ORDERED arrays, not supersets: every extra entry here is a download a real
  // player makes before the onboarding screen opens.
  const TUTORIAL_SHARED_HEAD = [
    // Menu backdrop; both forks author the same one, so it dedupes to a single entry.
    "assets/levels/belliard/facade.png",
    // `image:` panels — shared opening + shared bestiary/field lines.
    "assets/vehicles/truck.png",
    "assets/enemy_shooting.png",
    "assets/enemy_riot_shooting.png",
    "assets/enemy_biker_shooting.png",
    "assets/enemy_bonus.png",
    "assets/courier/rider.png",
  ] as const;
  // Bitmaps embedded in the SHARED code-drawn diagrams (hostage-ring, boss-finale-switch).
  const TUTORIAL_SHARED_DIAGRAM_ASSETS = [
    "assets/enemy_hostage.png",
    "assets/hostage/girl.png",
    "assets/boss/commander_shielded.png",
  ] as const;
  // The desktop-only `edge-scroll` gesture panel frames the REAL Belliard street inside its
  // mini-screen: 5.7 MB on disk, ~30 MB decoded, for a ~96×76 px strip mobile never draws.
  const EDGE_SCROLL_BITMAP = "assets/levels/belliard/street-wide.png";

  it("tutorial-desktop manifest is exactly the desktop fork's assets (edge-scroll bitmap included)", () => {
    expect(manifestFor("tutorial-desktop")).toEqual([
      ...TUTORIAL_SHARED_HEAD,
      EDGE_SCROLL_BITMAP,
      ...TUTORIAL_SHARED_DIAGRAM_ASSETS,
    ]);
  });

  it("tutorial-mobile manifest is exactly the mobile fork's assets — NO desktop street bitmap", () => {
    const m = manifestFor("tutorial-mobile");
    expect(m).toEqual([...TUTORIAL_SHARED_HEAD, ...TUTORIAL_SHARED_DIAGRAM_ASSETS]);
    // The regression this fork exists for: 93.5 % of the old mobile tutorial preload was
    // this one file, for a panel only the desktop fork authors.
    expect(m).not.toContain(EDGE_SCROLL_BITMAP);
  });

  // ADR-0073 D5 (preload-explicitness): a "code-drawn" panel is only vector-pure when it
  // draws nothing but vectors. The edge-scroll gesture icon frames the REAL Belliard street
  // inside its mini-screen and the hostage-ring diagram embeds the REAL captor + girl
  // sprites, so those bitmaps are tutorial-panel assets like any `image:` — the gate must
  // warm them for the fork that draws them, or they fetch cold while the panel is up.
  it("warms each fork's own code-drawn gesture/diagram bitmaps, and its authored channels", () => {
    for (const [target, scene] of [
      ["tutorial-desktop", TUTORIAL_NARRATIVE_DESKTOP],
      ["tutorial-mobile", TUTORIAL_NARRATIVE_MOBILE],
    ] as const) {
      const m = manifestFor(target);
      expect(m).toContain(menuBackdropPath());
      if (scene.backdrop !== undefined) expect(m).toContain(scene.backdrop);
      for (const path of narrativeImagePaths(scene)) expect(m).toContain(path);
      // boss-finale-switch shows the Commandant in his SHIELDED QTE pose — the real boss
      // sprite, no longer the CRS one it used to borrow (render-lane sprite-identity fix).
      // The tutorial branch is the only thing that warms it: bossAssetPaths runs on the
      // level branch, which a tutorial target never reaches.
      for (const path of illustrationAssetPaths(scene)) expect(m).toContain(path);
    }
  });

  // Footgun pin (panel run 2, §3): `LEVELS` carries the onboarding stage as a REAL entry
  // with `id: "tutorial"` (levels.ts:90) whose gameplay fields are inert. So a bare
  // "tutorial" string is a LEVEL id, never a tutorial target: it falls through to the level
  // branch and silently builds a full level manifest (audio + enemy sprites + backdrop).
  // Nothing calls it that way — App.tsx passes one of the two device targets — and this
  // test is what keeps it that way: re-introducing a bare "tutorial" tutorial case, or a
  // caller typo'ing one, turns red here instead of loading the wrong set at runtime.
  it("dispatches only the two device targets to the tutorial manifest; bare 'tutorial' is the level id", () => {
    const bare = manifestFor("tutorial");
    expect(bare).not.toEqual(manifestFor("tutorial-desktop"));
    expect(bare).not.toEqual(manifestFor("tutorial-mobile"));
    // Level-branch fingerprints, absent from every tutorial manifest.
    expect(bare).toContain("assets/audio/bgm_loop.mp3");
    expect(bare).toContain("assets/bullet_player.png");
    for (const t of ["tutorial-desktop", "tutorial-mobile"] as const) {
      expect(manifestFor(t)).not.toContain("assets/audio/bgm_loop.mp3");
      expect(manifestFor(t)).not.toContain("assets/bullet_player.png");
    }
  });

  // The map states what the diagrams DRAW, so it must move when they do. This is the pin
  // that goes red if the Commandant pose is swapped again without the manifest following.
  it("states the diagram bitmaps by their current sprite, and every one of them ships", () => {
    const embedded = illustrationAssetPaths(TUTORIAL_NARRATIVE_DESKTOP);
    expect(embedded).toContain("assets/boss/commander_shielded.png");
    expect(embedded).not.toContain("assets/enemy_riot_shooting.png"); // stale Commandant pose
    for (const path of embedded) {
      expect(existsSync(resolve(process.cwd(), "public", path))).toBe(true);
    }
  });

  it("illustrationAssetPaths reads the gesture/diagram channels, not the image channel", () => {
    // Desktop-only gesture (`edge-scroll`) vs mobile-only gestures: the fork that does not
    // author edge-scroll must not claim its bitmap. The `manifestFor` twin above enforces
    // the same exclusion one level up, where it is actually consumed.
    expect(illustrationAssetPaths(TUTORIAL_NARRATIVE_DESKTOP)).toContain(
      "assets/levels/belliard/street-wide.png",
    );
    expect(illustrationAssetPaths(TUTORIAL_NARRATIVE_MOBILE)).not.toContain(
      "assets/levels/belliard/street-wide.png",
    );
    // `image:` panels stay the business of narrativeImagePaths (no double bookkeeping).
    expect(illustrationAssetPaths(TUTORIAL_NARRATIVE_DESKTOP)).not.toContain(
      "assets/vehicles/truck.png",
    );
    // A scene with no gesture/diagram panel contributes nothing.
    expect(illustrationAssetPaths({ id: "empty", lines: [] })).toEqual([]);
  });

  // The illustration warming above is applied to the tutorial branch ONLY, which is honest
  // exactly as long as no pre/post-level scene authors a gesture or a diagram. If one ever
  // does, this fails and the warming must be extended to the level branch too.
  it("no pre/post-level scene authors a gesture or diagram channel", () => {
    for (const scene of [
      ...Object.values(PRE_LEVEL_NARRATIVE),
      ...Object.values(POST_LEVEL_NARRATIVE),
    ]) {
      for (const line of scene.lines) {
        expect(line.gesture).toBeUndefined();
        expect(line.diagram).toBeUndefined();
      }
    }
  });
});

describe("assetManifest — belliard level manifest", () => {
  const m = manifestFor("belliard");

  it("warms the single wide décor image it actually renders (ADR-0057)", () => {
    // belliard is now a single-wide level: ciel+immeubles+sol are baked into ONE
    // opaque image, so the gate warms THAT image alone — NOT the sky/facade/street
    // trio (suppressed by the single-wide render branch) nor the retired tronçons.
    expect(levelLayerPaths("belliard")).toEqual(["assets/levels/belliard/street-wide.png"]);
    for (const layer of levelLayerPaths("belliard")) expect(m).toContain(layer);
  });

  it("keeps the classic sky/facade/street trio for single-facade levels", () => {
    expect(levelLayerPaths("stalingrad")).toEqual([
      "assets/levels/stalingrad/sky.png",
      "assets/levels/stalingrad/facade.png",
      "assets/levels/stalingrad/street.png",
    ]);
  });

  it("contains the truck vehicle, bullet, facade backdrop, menu backdrop and fallbacks", () => {
    expect(m).toContain(vehicleAssetPath("truck"));
    expect(vehicleAssetPath("truck")).toBe("assets/vehicles/truck.png");
    expect(m).toContain(bulletAssetPath());
    expect(bulletAssetPath()).toBe("assets/bullet_player.png");
    expect(m).toContain(bulletModelPath());
    expect(bulletModelPath()).toBe("assets/models/bullet.glb");
    expect(m).toContain(facadeBackdropPath());
    expect(facadeBackdropPath()).toBe("assets/facade_bg.png");
    expect(m).toContain(menuBackdropPath());
    expect(m).toContain("assets/enemy_sprite.png");
    expect(m).toContain("assets/enemy_shooting.png");
  });

  it("contains every courier frame", () => {
    for (const p of courierAssetPaths()) expect(m).toContain(p);
  });

  it("preloads the boss QTE poses + décor props (pending shield-cover art excluded)", () => {
    const boss = bossAssetPaths("belliard");
    // Belliard authors a boss (BELLIARD_BOSS_ENABLED) → the canon commander poses + the generated
    // hall props are in the manifest, so the duel never pops in from the riot-cop fallback.
    expect(boss).toContain("assets/boss/commander_shielded.png");
    expect(boss).toContain("assets/boss/commander_exposed.png");
    expect(boss).toContain("assets/boss/commander_down.png");
    expect(boss).toContain("assets/boss/speaker_wall.png");
    // Not-yet-generated art (pending) is never preloaded — it would 404 the loading screen.
    expect(boss).not.toContain("assets/boss/shield_cover_raised.png");
    expect(boss).not.toContain("assets/boss/shield_cover_lowered.png");
    for (const p of boss) expect(m).toContain(p);
  });

  it("a boss-less level preloads no boss assets", () => {
    expect(bossAssetPaths("stalingrad")).toEqual([]);
  });

  it("contains the pre- and post-level narrative illustrations when defined", () => {
    const pre = PRE_LEVEL_NARRATIVE.belliard;
    const post = POST_LEVEL_NARRATIVE.belliard;
    expect(pre).toBeDefined();
    expect(post).toBeDefined();
    if (pre !== undefined) {
      for (const img of narrativeImagePaths(pre)) expect(m).toContain(img);
    }
    if (post !== undefined) {
      for (const img of narrativeImagePaths(post)) expect(m).toContain(img);
    }
  });
});

describe("assetManifest — enemy path parity pins", () => {
  it("builds enemy base file keys the same way as enemyTextures.baseFileKey", () => {
    expect(enemyBaseFileKey("normal", 1, false)).toBe("enemy_sprite");
    expect(enemyBaseFileKey("normal", 1, true)).toBe("enemy_shooting");
    expect(enemyBaseFileKey("normal", 2, false)).toBe("enemy_sprite_2");
    expect(enemyBaseFileKey("normal", 2, true)).toBe("enemy_shooting_2");
    expect(enemyBaseFileKey("riot", 1, true)).toBe("enemy_riot_shooting");
    expect(enemyBaseFileKey("riot", 1, false)).toBe("enemy_riot");
  });

  it("builds enemy asset paths the same way as enemyTextures.fileFor", () => {
    expect(enemyAssetPath("normal", 1, false, 1)).toBe("assets/enemy_sprite.png");
    expect(enemyAssetPath("normal", 1, true, 1)).toBe("assets/enemy_shooting.png");
    expect(enemyAssetPath("riot", 1, true, 1)).toBe("assets/enemy_riot_shooting.png");
    expect(enemyAssetPath("normal", 2, false, 1)).toBe("assets/enemy_sprite_2.png");
    expect(enemyAssetPath("normal", 1, true, 2)).toBe("assets/enemy_shooting_f2.png");
    // Frame suffix comes AFTER the variant suffix.
    expect(enemyAssetPath("normal", 2, true, 2)).toBe("assets/enemy_shooting_2_f2.png");
  });
});

describe("assetManifest — enemy coverage for belliard", () => {
  // Belliard uses the default window pool (normal/riot/biker/bonus — civilian is
  // weight 0 and its retired sprite is no longer pulled in as a courier fallback)
  // plus the two globals. The hostage taker is not rostered either — it drives
  // the cinematic QTE (ADR-0030), whose art is not an enemy path.
  const EXPECTED = [
    "assets/enemy_sprite.png",
    "assets/enemy_sprite_f2.png",
    "assets/enemy_shooting.png",
    "assets/enemy_shooting_f2.png",
    "assets/enemy_sprite_2.png",
    "assets/enemy_sprite_2_f2.png",
    "assets/enemy_shooting_2.png",
    "assets/enemy_shooting_2_f2.png",
    "assets/enemy_sprite_3.png",
    "assets/enemy_sprite_3_f2.png",
    "assets/enemy_shooting_3.png",
    "assets/enemy_shooting_3_f2.png",
    "assets/enemy_riot.png",
    "assets/enemy_riot_f2.png",
    "assets/enemy_riot_shooting.png",
    "assets/enemy_riot_shooting_f2.png",
    "assets/enemy_biker.png",
    "assets/enemy_biker_f2.png",
    "assets/enemy_biker_shooting.png",
    "assets/enemy_biker_shooting_f2.png",
    "assets/enemy_bonus.png",
  ];

  it("enumerates exactly the expected enemy sprites (frame/variant coverage)", () => {
    expect(enemyAssetPathsFor("belliard")).toEqual(EXPECTED);
  });

  it("covers frame counts declared in levelArt.json for each variant/state", () => {
    // enemy_sprite has 2 frames, enemy_bonus has 1 — assert the manifest reflects
    // those authored counts.
    const paths = enemyAssetPathsFor("belliard");
    const normalFrames = levelArt.enemies.types.enemy_sprite.frames.length;
    const shootingFrames = levelArt.enemies.types.enemy_shooting.frames.length;
    expect(paths).toContain("assets/enemy_sprite_f2.png"); // frame 2 exists
    expect(normalFrames).toBe(2);
    expect(shootingFrames).toBe(2);
    // enemy_bonus is a single committed frame — no _f2.
    expect(levelArt.enemies.types.enemy_bonus.frames.length).toBe(1);
    expect(paths).not.toContain("assets/enemy_bonus_f2.png");
  });
});

describe("assetManifest — courier paths", () => {
  it("courierAssetPath inserts _f<N> before .png, frame 1 unsuffixed", () => {
    expect(courierAssetPath("assets/courier/rider.png", 1)).toBe("assets/courier/rider.png");
    expect(courierAssetPath("assets/courier/rider.png", 2)).toBe("assets/courier/rider_f2.png");
    expect(courierAssetPath("assets/courier/bike.png", 3)).toBe("assets/courier/bike_f3.png");
  });

  it("covers the rider strip and excludes the retired bike layer", () => {
    const paths = courierAssetPaths();
    // Only the rendered `rider` layer is preloaded — the `bike` layer is retired
    // from the composite and its PNGs are uncommitted, so warming it would 404.
    expect(paths.length).toBe(levelArt.courier.layers.rider.frames.length);
    expect(new Set(paths).size).toBe(paths.length);
    for (let f = 1; f <= levelArt.courier.layers.rider.frames.length; f++) {
      expect(paths).toContain(courierAssetPath(levelArt.courier.layers.rider.asset, f));
    }
    // Regression guard: no bike frame may leak into the manifest.
    expect(paths.some((p) => p.startsWith("assets/courier/bike"))).toBe(false);
  });
});

describe("assetManifest — gameplay audio in level manifests", () => {
  it("audioAssetPaths() is exactly the 4 committed files, BGM tiers then shoot SFX", () => {
    // Pins the committed set and excludes the uncommitted hit/death/win SFX that
    // audioSystem.ts references but which are not under public/assets/audio/.
    expect(audioAssetPaths()).toEqual([
      "assets/audio/bgm_loop.mp3",
      "assets/audio/bgm_tension.mp3",
      "assets/audio/bgm_danger.mp3",
      "assets/audio/shoot.wav",
    ]);
  });

  it("every level manifest contains all 4 audio paths", () => {
    for (const id of LEVEL_IDS) {
      const m = manifestFor(id);
      for (const audio of audioAssetPaths()) expect(m).toContain(audio);
    }
  });

  it("menu and tutorial manifests contain NONE of the audio paths", () => {
    for (const t of NON_LEVEL_TARGETS) {
      const m = manifestFor(t);
      for (const audio of audioAssetPaths()) expect(m).not.toContain(audio);
    }
  });

  it("never leaks the uncommitted hit/death/win SFX", () => {
    for (const id of LEVEL_IDS) {
      const m = manifestFor(id);
      expect(m).not.toContain("assets/audio/hit.mp3");
      expect(m).not.toContain("assets/audio/death.mp3");
      expect(m).not.toContain("assets/audio/win.mp3");
    }
  });
});

describe("assetManifest — vehicle per level & unknown-id fallback", () => {
  it("picks the delivery vehicle of each level", () => {
    expect(manifestFor("belliard")).toContain("assets/vehicles/truck.png");
    expect(manifestFor("stalingrad")).toContain("assets/vehicles/car.png");
    expect(manifestFor("vitry")).toContain("assets/vehicles/moto.png");
  });

  it("falls back sensibly for an unknown level id", () => {
    const m = manifestFor("does-not-exist");
    // Layers + config both fall back to the first declared/playable level.
    expect(m).toContain("assets/levels/belliard/facade.png");
    expect(m).toContain(bulletAssetPath());
    expect(m.length).toBeGreaterThan(0);
  });
});
