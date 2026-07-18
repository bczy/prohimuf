import { describe, it, expect } from "vitest";
import {
  manifestFor,
  enemyBaseFileKey,
  enemyAssetPath,
  enemyAssetPathsFor,
  courierAssetPath,
  courierAssetPaths,
  vehicleAssetPath,
  bulletAssetPath,
  levelLayerPaths,
  facadeBackdropPath,
  menuBackdropPath,
  narrativeImagePaths,
  audioAssetPaths,
} from "@game/systems/assetManifest";
import {
  TUTORIAL_NARRATIVE_DESKTOP,
  TUTORIAL_NARRATIVE_MOBILE,
  PRE_LEVEL_NARRATIVE,
  POST_LEVEL_NARRATIVE,
} from "@game/systems/narrativeSystem";
import levelArt from "@game/levels/levelArt.json";
import { ARCHETYPES } from "@game/types/enemyTypes";

// Real file assets, plus the synthetic `nearfg:<kind>` scheme for the code-drawn
// near-foreground props (ADR-0045) — no PNG on disk, warmed by building a texture.
const ASSET_RE = /^(assets\/.+\.(png|jpg|webp|mp3|wav)|nearfg:[a-zA-Z]+)$/;

// Every level id we build a full manifest for, plus the two special targets.
const LEVEL_IDS = ["belliard", "stalingrad", "vitry"] as const;
const ALL_TARGETS = ["menu", "tutorial", ...LEVEL_IDS, "does-not-exist"] as const;

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
    const retiredBases = Object.values(ARCHETYPES)
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

  it("tutorial manifest = menu backdrop ∪ both tutorial forks' illustrations", () => {
    const m = manifestFor("tutorial");
    const expected = new Set([
      menuBackdropPath(),
      ...narrativeImagePaths(TUTORIAL_NARRATIVE_DESKTOP),
      ...narrativeImagePaths(TUTORIAL_NARRATIVE_MOBILE),
    ]);
    expect(new Set(m)).toEqual(expected);
    // The desktop and mobile forks share the same illustration set (they differ
    // only on code-drawn gesture panels), and both must be present.
    for (const img of narrativeImagePaths(TUTORIAL_NARRATIVE_DESKTOP)) {
      expect(m).toContain(img);
    }
    for (const img of narrativeImagePaths(TUTORIAL_NARRATIVE_MOBILE)) {
      expect(m).toContain(img);
    }
    expect(m).toContain("assets/vehicles/truck.png"); // the opening panel's image
    expect(m).toContain(menuBackdropPath());
  });
});

describe("assetManifest — belliard level manifest", () => {
  const m = manifestFor("belliard");

  it("contains the three backdrop layers in sky/facade/street order", () => {
    expect(levelLayerPaths("belliard")).toEqual([
      "assets/levels/belliard/sky.png",
      "assets/levels/belliard/facade.png",
      "assets/levels/belliard/street.png",
    ]);
    for (const layer of levelLayerPaths("belliard")) expect(m).toContain(layer);
  });

  it("contains the truck vehicle, bullet, facade backdrop, menu backdrop and fallbacks", () => {
    expect(m).toContain(vehicleAssetPath("truck"));
    expect(vehicleAssetPath("truck")).toBe("assets/vehicles/truck.png");
    expect(m).toContain(bulletAssetPath());
    expect(bulletAssetPath()).toBe("assets/bullet_player.png");
    expect(m).toContain(facadeBackdropPath());
    expect(facadeBackdropPath()).toBe("assets/facade_bg.png");
    expect(m).toContain(menuBackdropPath());
    expect(m).toContain("assets/enemy_sprite.png");
    expect(m).toContain("assets/enemy_shooting.png");
  });

  it("contains every courier frame", () => {
    for (const p of courierAssetPaths()) expect(m).toContain(p);
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
    for (const t of ["menu", "tutorial"] as const) {
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
