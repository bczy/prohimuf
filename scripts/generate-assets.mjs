#!/usr/bin/env node
/**
 * Asset generator — Underground Paris
 *
 * Generates game sprites and UI textures via Pollinations.ai (free, no API key).
 * Images are saved as PNG to src/assets/generated/ and skipped if they already exist.
 *
 * Usage:
 *   node scripts/generate-assets.mjs              # generate all missing assets
 *   node scripts/generate-assets.mjs --list        # list available asset names
 *   node scripts/generate-assets.mjs --asset <name> # generate one specific asset
 *
 * Model: Flux (via Pollinations.ai)
 * Style: black & white fanzine, acid neon highlights, flat 2D sprite, 90s Paris rave
 *
 * Rate limiting: 5s pause between assets, up to 5 retries with exponential backoff.
 * Each retry waits (attempt × 15s) before retrying.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../src/assets/generated");

const BASE_STYLE =
  "black and white fanzine style, acid neon highlights, flat 2D game sprite, 90s Paris rave aesthetic";

const ASSETS = [
  // --- Player ---
  {
    name: "player_idle",
    description: "Player character — standing idle",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, standing idle pose. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_walk",
    description: "Player character — walking",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, mid-walk pose. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_run",
    description: "Player character — running fast",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, full sprint running pose, motion blur effect. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_crouch",
    description: "Player character — crouching",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, crouching low hiding pose. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_talking",
    description: "Player character — talking to NPC",
    prompt: `2D game sprite of a young Parisian courier, hoodie, backpack, sneakers, hand gesturing talking pose, speech bubble. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_caught",
    description: "Player character — caught by police",
    prompt: `2D game sprite of a young Parisian courier, hands up in surrender pose, panicked expression, flashlight beam on them. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "player_female",
    description: "Player character (female variant) — standing idle",
    prompt: `2D game sprite of a young Parisian woman courier, bomber jacket, beret, sneakers, standing idle pose, confident stance. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- Contacts ---
  {
    name: "contact_dj_masta_klem",
    description: "DJ Masta Klem — sonorisateur, Vitry 94",
    prompt: `2D game sprite of a Black DJ character carrying a crate of vinyl records, 90s streetwear, cap, oversized jacket. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_dj_masta_klem_talking",
    description: "DJ Masta Klem — dialogue pose",
    prompt: `2D game sprite of a Black DJ character, animated talking pose, gesturing with hands, vinyl records visible. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_faiza",
    description: "Faïza La Logiste — organisation, Stalingrad 19e",
    prompt: `2D game sprite of a French-North African woman organizer, clipboard in hand, practical clothing, sharp eyes, 90s style. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_faiza_stressed",
    description: "Faïza La Logiste — stressed variant",
    prompt: `2D game sprite of a French-North African woman organizer, stressed expression, clipboard dropped, hands in hair, urgent situation. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_seb_le_blond",
    description: "Seb le Blond — Châtelet",
    prompt: `2D game sprite of a scruffy blond French guy, unreliable vibe, 90s casual clothes, cigarette behind ear. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_seb_scared",
    description: "Seb le Blond — scared/hiding variant",
    prompt: `2D game sprite of a scruffy blond French guy, terrified expression, hiding against wall, looking over shoulder nervously. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_oxane",
    description: "Oxane — photographe, Belleville 20e",
    prompt: `2D game sprite of a young woman photographer, 35mm camera around neck, artsy 90s clothes, Belleville aesthetic. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_oxane_shooting",
    description: "Oxane — taking a photo",
    prompt: `2D game sprite of a young woman photographer actively taking a photo, camera raised to eye, flash effect, artsy 90s clothes. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_karim",
    description: "Karim Le Mécano — générateurs, Pantin 93",
    prompt: `2D game sprite of a mechanic man with generator equipment, work clothes, Pantin banlieue 90s style, sturdy build. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_karim_working",
    description: "Karim Le Mécano — repairing equipment",
    prompt: `2D game sprite of a mechanic man bent over generator, wrench in hand, sparks flying, work clothes, focused expression. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- New Contacts / NPCs ---
  {
    name: "contact_mamie_rosa",
    description: "Mamie Rosa — logeuse complice, Barbès",
    prompt: `2D game sprite of an elderly Algerian French woman landlady, headscarf, warm smile, holding keys, sturdy figure, 90s Paris banlieue. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_pierrot_le_tech",
    description: "Pierrot Le Tech — sono & lumières, Nation",
    prompt: `2D game sprite of a nerdy French technician, round glasses, multiple pockets on vest, carrying cables and equipment, 90s underground. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_yasmine",
    description: "Yasmine — avocate militante, République",
    prompt: `2D game sprite of a sharp French-Algerian woman lawyer, business attire mixed with street style, briefcase, determined expression. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_djibril",
    description: "Djibril — dealer de flyers, Oberkampf",
    prompt: `2D game sprite of a young Senegalese French man, street-smart look, hands full of flyers, baseball cap turned back, cool demeanor. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_nathalie",
    description: "Nathalie — barwoman complice, Ménilmontant",
    prompt: `2D game sprite of a French barmaid, tough vibe, apron, short hair, bottle in hand, knowing wink, 90s Paris bar. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_marco",
    description: "Marco — videur underground, Oberkampf",
    prompt: `2D game sprite of a big stocky French bouncer, arms crossed, shaved head, tight black t-shirt, earpiece, 90s nightclub vibe. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_leila_graf",
    description: "Leila — graffiti artist, Canal Saint-Martin",
    prompt: `2D game sprite of a young French-Moroccan graffiti artist woman, paint-stained clothes, spray can in belt, streetwear 90s Paris. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "contact_rene_imprimeur",
    description: "René — imprimeur clandestin, 11e",
    prompt: `2D game sprite of an old French printer, ink-stained hands, glasses on nose, suspicious expression, underground press worker. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- Antagonists ---
  {
    name: "cop_bac",
    description: "BAC de nuit — patrouille visible",
    prompt: `2D game sprite of a French BAC night police officer, dark uniform, visible patrol stance, threatening. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_bac_radio",
    description: "BAC de nuit — appel radio",
    prompt: `2D game sprite of a French BAC night police officer, dark uniform, radio to mouth, calling for backup, urgent expression. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_rg",
    description: "RG en civil — détective discret",
    prompt: `2D game sprite of a plainclothes French intelligence officer, subtle tells, trench coat, 90s Paris street, blending in. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_rg_watching",
    description: "RG en civil — en surveillance",
    prompt: `2D game sprite of a plainclothes French intelligence officer, newspaper as cover, watching from corner, trench coat, 90s Paris. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_prefecture",
    description: "Préfecture — fonctionnaire zélé",
    prompt: `2D game sprite of a French prefecture bureaucrat official, suit, glasses, briefcase, smug expression, 90s state official. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "cop_crs",
    description: "CRS — intervention anti-rave",
    prompt: `2D game sprite of a French CRS riot police officer, full riot gear, helmet visor, baton, anti-rave operation. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "informer",
    description: "Indic — balance du quartier",
    prompt: `2D game sprite of a shifty French neighborhood informer, shady look, whispering, 90s Paris street rat, cannot be trusted. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- UI ---
  {
    name: "ui_menu_cover",
    description: "Menu principal — couverture de fanzine",
    prompt: `Underground Paris rave fanzine cover, hand-drawn lettering, black and white photocopied texture, acid neon highlights, 90s Paris underground rave scene. Full page layout. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_gameover",
    description: "Game over — une de journal fictif",
    prompt: `Fictional French newspaper front page, big dramatic headline about a failed rave, black and white newspaper texture with photocopied grain, neon highlights. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_flyer_rave",
    description: "Sélection de niveau — flyer de rave",
    prompt: `Underground rave party flyer, Paris 1990s, hand-stamped typography, black and white photocopied with acid neon color accents, torn edges. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_flyer_techno",
    description: "Flyer de rave — soirée techno warehouse",
    prompt: `Techno warehouse party flyer, Paris 1993, industrial aesthetic, typewriter font, black and white with electric blue neon, torn photocopied edges, illegal rave. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_flyer_jungle",
    description: "Flyer de rave — soirée jungle",
    prompt: `Jungle breakbeat party flyer, Paris 1994, chaotic typography layered, black and white photocopied with green acid neon, xerox art style. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_victory_fanzine",
    description: "Victoire — une de fanzine festive",
    prompt: `Underground Paris rave success fanzine spread, celebration, ecstatic crowd silhouettes, black and white with gold neon accents, 90s photocopy style. ${BASE_STYLE}`,
    width: 512,
    height: 910,
  },
  {
    name: "ui_dialogue_box",
    description: "Boîte de dialogue — style fanzine",
    prompt: `Speech bubble and dialogue box frame, hand-cut fanzine style, torn paper edges, black and white photocopied texture, game UI element. ${BASE_STYLE}`,
    width: 512,
    height: 256,
  },
  {
    name: "ui_inventory_bg",
    description: "Fond d'inventaire — carnet de notes",
    prompt: `Game inventory background as a battered notebook, hand-drawn sections, sticky notes, torn pages, fanzine collage aesthetic, 90s underground. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "ui_map_paris",
    description: "Carte de Paris — plan clandestin",
    prompt: `Hand-drawn underground Paris map, key rave locations marked, arrondissements sketched, notebook paper texture, fanzine style, black and white. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },
  {
    name: "ui_tension_meter",
    description: "Jauge de tension — élément UI",
    prompt: `Game UI tension meter bar, police siren aesthetic, escalating from green to red neon, fanzine style, black and white with color accents. ${BASE_STYLE}`,
    width: 512,
    height: 128,
  },
  {
    name: "ui_chapter_card",
    description: "Carte de chapitre — style fanzine",
    prompt: `Chapter title card, fanzine cover page style, bold hand-stamped typography, black and white photocopied, Paris underground scene illustration. ${BASE_STYLE}`,
    width: 512,
    height: 256,
  },

  // --- Tiles bitmaps ───────────────────────────────────────────────────────
  // Utilisés comme overlays sur les tiles procédurales du TiledFacade.
  {
    name: "tile_shop_boucherie",
    description: "Vitrine boucherie — enseigne néon rouge",
    prompt: `Storefront tile for a Paris 90s butcher shop, red neon sign, dark glass window, photocopied xerox look, flat 2D game tile, dark background. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_shop_tabac",
    description: "Vitrine tabac — losange doré",
    prompt: `Storefront tile for a Paris 90s tabac tobacco shop, golden diamond sign on window, dark glass, flat 2D game tile, dark background, fanzine style. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_shop_bar",
    description: "Vitrine bar de nuit — néon bleu",
    prompt: `Storefront tile for a Paris 90s night bar, blue neon sign in window, dark interior glimpsed, wet pavement reflection, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_shop_pharmacie",
    description: "Vitrine pharmacie — croix verte",
    prompt: `Storefront tile for a Paris 90s pharmacy, glowing green cross sign in window, dark glass, flat 2D game tile, dark background. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_fire_escape",
    description: "Escalier de secours métallique",
    prompt: `Fire escape staircase tile on a Paris building wall, rusted metal structure, grating, handrail, flat 2D game tile top-down orthographic view, dark background. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_arch_haussmann",
    description: "Arcade haussmannienne — pilastres et arc",
    prompt: `Haussmann style architectural arch tile, stone pilasters, rounded arch, key stone, flat ornamental facade element, 2D game tile, Paris building, dark background. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_rooftop_zinc",
    description: "Toiture zinc parisienne — antenne et cheminée",
    prompt: `Paris zinc rooftop tile, TV antenna, chimney pot, mansard silhouette, flat 2D game tile, dark stormy sky background. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_balcony_ironwork",
    description: "Balcon en fer forgé haussmannien",
    prompt: `Haussmann building balcony tile, ornate black iron railing, stone slab, potted plant or laundry, flat 2D game tile, Paris 90s night. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_wall_graffiti",
    description: "Pan de mur avec graffiti fanzine",
    prompt: `Paris building wall tile covered in graffiti tags and stencils, xerox fanzine aesthetic, layered street art, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_wall_poster",
    description: "Pan de mur avec affiches arrachées",
    prompt: `Paris building wall tile covered in torn underground party posters, layered paper remnants, paste residue, flat 2D game tile, night. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },

  {
    name: "tile_window_lit_orange",
    description: "Fenêtre éclairée — lumière orange chaude",
    prompt: `Paris building window tile, warm orange interior light glowing through curtains, night, flat 2D game tile, dark stone facade surround. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_window_lit_blue",
    description: "Fenêtre éclairée — TV froide bleue",
    prompt: `Paris building window tile, cold blue TV flicker light through closed blinds, night, flat 2D game tile, dark stone surround. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_window_lit_neon_green",
    description: "Fenêtre éclairée — néon vert underground",
    prompt: `Paris building window tile, eerie green neon light from inside, underground vibe, night, flat 2D game tile, dark stone surround. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_window_dark_shutters",
    description: "Fenêtre sombre — volets fermés",
    prompt: `Paris building window tile, wooden shutters tightly closed, night, flat 2D game tile, dark stone surround, fanzine style. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_window_dark_curtain",
    description: "Fenêtre sombre — rideau tiré",
    prompt: `Paris building window tile, heavy dark curtain drawn, faint light edge, night, flat 2D game tile, stone surround. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_door_main",
    description: "Porte principale haussmannienne",
    prompt: `Paris Haussmann building main entrance door tile, large double wooden doors, arched top, intercom, night, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 512,
  },
  {
    name: "tile_wall_pipe",
    description: "Pan de mur — descente de gouttière",
    prompt: `Paris building wall tile with a drainpipe running vertically, iron clamps, water stains, night, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_wall_damp",
    description: "Pan de mur — tache d'humidité",
    prompt: `Paris building wall tile with damp stain, efflorescence, peeling paint edge, night, flat 2D game tile, stone wall. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_wall_clean",
    description: "Pan de mur — pierre propre haussmannienne",
    prompt: `Paris Haussmann building clean stone wall tile, limestone texture, subtle joints, night ambient light, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_rooftop_chimney",
    description: "Toiture — groupe de cheminées",
    prompt: `Paris rooftop tile, cluster of terracotta chimney pots, zinc flashing, dark sky, flat 2D game tile, fanzine style. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_rooftop_antenna",
    description: "Toiture — antenne télé années 90",
    prompt: `Paris 90s rooftop tile, tall TV antenna with herringbone arms, zinc sheet roof, dark sky, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_balcony_plant",
    description: "Balcon — pot de plante envahi",
    prompt: `Paris building balcony tile, overgrown potted plant spilling through iron railings, night, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },
  {
    name: "tile_balcony_laundry",
    description: "Balcon — linge qui sèche",
    prompt: `Paris building balcony tile, laundry hanging on a line between railings, shirts and sheets, night, flat 2D game tile. ${BASE_STYLE}`,
    width: 256,
    height: 256,
  },

  // --- Road & Street textures ---
  {
    name: "street_road_egout",
    description: "Texture de route — asphalte parisien avec plaque d'égout",
    prompt: `Top-down texture of a Paris street, wet black asphalt, round cast-iron sewage manhole cover with ornate grating in the center, faint painted road markings, photocopied xerox grain, flat 2D game texture seamless tile, dark background. ${BASE_STYLE}`,
    width: 512,
    height: 512,
  },

  // --- Items & Objects ---
  {
    name: "item_vinyl_record",
    description: "Vinyle — objet collectible",
    prompt: `2D game item sprite of a vinyl record, fanzine illustration style, white label hand-written tracklist, top-down view. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_flyers_bundle",
    description: "Liasse de flyers — à distribuer",
    prompt: `2D game item sprite of a bundle of photocopied rave flyers tied with elastic, viewed from above, xerox texture. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_walkie_talkie",
    description: "Talkie-walkie — communication équipe",
    prompt: `2D game item sprite of a 90s walkie-talkie radio, antenna up, neon indicator light, viewed from front. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_cassette_tape",
    description: "Cassette audio — mix de DJ",
    prompt: `2D game item sprite of a cassette tape, hand-written label, 90s style, top-down view, compact flat sprite. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_generator_key",
    description: "Clé de générateur — objet clé",
    prompt: `2D game item sprite of a heavy industrial key, tagged with cable tie label, worn metal, top-down view. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_spray_can",
    description: "Bombe de peinture — graffiti",
    prompt: `2D game item sprite of a spray paint can, neon accents, flat side view, 90s graffiti culture. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_lockpick",
    description: "Crochets de serrure — effraction",
    prompt: `2D game item sprite of a lockpick set on cloth roll, slim tools, flat top-down view, fanzine illustration. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
  {
    name: "item_fake_id",
    description: "Faux papiers — identité de couverture",
    prompt: `2D game item sprite of a fake French ID card, slightly worn, viewed from front, 90s French document aesthetic. ${BASE_STYLE}`,
    width: 128,
    height: 128,
  },
];

/** @param {number} ms */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetches an image buffer from a URL, following up to one redirect (301/302).
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          fetchImage(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

/**
 * Calls Pollinations.ai to generate an image for the given asset descriptor.
 * A random seed is chosen per call so each run produces a fresh result.
 * @param {{ name: string, prompt: string, width: number, height: number }} asset
 * @param {number} retries
 * @returns {Promise<Buffer>}
 */
async function generateImage(asset, retries = 5) {
  const encodedPrompt = encodeURIComponent(asset.prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${asset.width}&height=${asset.height}&nologo=true&model=flux&seed=${seed}`;

  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 15000;
        console.log(`  [retry ${i + 1}] ${e.message} — waiting ${wait / 1000}s...`);
        await sleep(wait);
      } else {
        throw e;
      }
    }
  }
}

/**
 * Generates a single asset and writes it to OUTPUT_DIR.
 * No-ops if the file already exists (idempotent).
 * @param {{ name: string, description: string, prompt: string, width: number, height: number }} asset
 */
async function generateAsset(asset) {
  const outPath = path.join(OUTPUT_DIR, `${asset.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${asset.name} — already exists`);
    return;
  }
  console.log(`  [gen]  ${asset.name} — ${asset.description}`);
  try {
    const imageBuffer = await generateImage(asset);
    fs.writeFileSync(outPath, imageBuffer);
    console.log(`  [ok]   saved → src/assets/generated/${asset.name}.png`);
  } catch (e) {
    console.log(`  [fail] ${asset.name} — ${e.message} (skipped)`);
  }
  await sleep(5000); // pause between assets to avoid rate limiting
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available assets:");
    ASSETS.forEach((a) => console.log(`  ${a.name.padEnd(32)} ${a.description}`));
    return;
  }

  const targetIndex = args.indexOf("--asset");
  const target = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const toGenerate = target ? ASSETS.filter((a) => a.name === target) : ASSETS;

  if (target && toGenerate.length === 0) {
    console.error(`Asset "${target}" not found. Use --list to see available assets.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Generating ${toGenerate.length} asset(s) → src/assets/generated/\n`);
  for (const asset of toGenerate) {
    await generateAsset(asset);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
