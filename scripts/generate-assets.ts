#!/usr/bin/env npx tsx
/**
 * Asset generator — Underground Paris
 * Uses Gemini Imagen API to generate game sprites and textures.
 *
 * Usage:
 *   GOOGLE_AI_API_KEY=your_key npx tsx scripts/generate-assets.ts
 *   npx tsx scripts/generate-assets.ts --asset player
 *   npx tsx scripts/generate-assets.ts --list
 */

import fs from "fs";
import path from "path";
import https from "https";

const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
  console.error("Missing GOOGLE_AI_API_KEY environment variable.");
  console.error("  export GOOGLE_AI_API_KEY=your_key");
  process.exit(1);
}

const OUTPUT_DIR = path.resolve("src/assets/generated");

// Base style injected into every prompt
const BASE_STYLE =
  "black and white photocopy fanzine style,
 acid neon highlights (yellow,
 fuchsia,
 acid green),
 " +
  "grain texture,
 slightly dirty,
 flat 2D sprite,
 transparent background,
 " +
  "Paris underground rave 90s aesthetic,
 Paper Mario pop-up style";

type Asset = {
  name: string;
  description: string;
  prompt: string;
  size: "1024x1024" | "1024x1792" | "1792x1024";
};

const ASSETS: Asset[] = [
  // --- Player ---
  {
    name: "player_idle",

    description: "Player character — standing idle",

    prompt: `2D game sprite of a young Parisian courier,
 hoodie,
 backpack,
 sneakers,
 standing idle pose. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "player_walk",

    description: "Player character — walking",

    prompt: `2D game sprite of a young Parisian courier,
 hoodie,
 backpack,
 sneakers,
 mid-walk pose. ${BASE_STYLE}`,

    size: "1024x1024",

  },


  // --- Contacts ---
  {
    name: "contact_dj_masta_klem",

    description: "DJ Masta Klem — sonorisateur,
 Vitry 94",

    prompt: `2D game sprite of a Black DJ character carrying a crate of vinyl records,
 90s streetwear,
 cap,
 oversized jacket. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "contact_faiza",

    description: "Faïza La Logiste — organisation,
 Stalingrad 19e",

    prompt: `2D game sprite of a French-North African woman organizer,
 clipboard in hand,
 practical clothing,
 sharp eyes,
 90s style. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "contact_seb_le_blond",

    description: "Seb le Blond — Châtelet",

    prompt: `2D game sprite of a scruffy blond French guy,
 unreliable vibe,
 90s casual clothes,
 cigarette behind ear,
 Châtelet area. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "contact_oxane",

    description: "Oxane — photographe,
 Belleville 20e",

    prompt: `2D game sprite of a young woman photographer,
 35mm camera around neck,
 artsy 90s clothes,
 Belleville aesthetic. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "contact_karim",

    description: "Karim Le Mécano — générateurs,
 Pantin 93",

    prompt: `2D game sprite of a mechanic man with generator equipment,
 work clothes,
 Pantin banlieue 90s style,
 sturdy build. ${BASE_STYLE}`,

    size: "1024x1024",

  },


  // --- Antagonists ---
  {
    name: "cop_bac",

    description: "BAC de nuit — patrouille visible",

    prompt: `2D game sprite of a French BAC night police officer,
 dark uniform,
 visible patrol stance,
 threatening. ${BASE_STYLE}`,

    size: "1024x1024",

  },

  {
    name: "cop_rg",

    description: "RG en civil — détective discret",

    prompt: `2D game sprite of a plainclothes French intelligence officer RG,
 subtle tells,
 trench coat,
 90s Paris street,
 blending in. ${BASE_STYLE}`,

    size: "1024x1024",

  },


  // --- UI ---
  {
    name: "ui_menu_cover",

    description: "Menu principal — couverture de fanzine",

    prompt: `Underground Paris rave fanzine cover,
 hand-drawn lettering,
 black and white photocopied texture,
 acid neon highlights,
 90s Paris underground rave scene. Full page layout. ${BASE_STYLE}`,

    size: "1024x1792",

  },

  {
    name: "ui_gameover",

    description: "Game over — une de journal fictif",

    prompt: `Fictional French newspaper front page,
 big dramatic headline about a failed rave,
 black and white newspaper texture with photocopied grain,
 neon highlights. ${BASE_STYLE}`,

    size: "1024x1792",

  },

  {
    name: "ui_flyer_rave",

    description: "Sélection de niveau — flyer de rave",

    prompt: `Underground rave party flyer,
 Paris 1990s,
 hand-stamped typography,
 black and white photocopied with acid neon color accents,
 torn edges. ${BASE_STYLE}`,

    size: "1024x1792",

  },

];

async function generateImage(asset: Asset): Promise<Buffer> {
  return new Promise((resolve,
 reject) => {
    const body = JSON.stringify({
      instances: [{ prompt: asset.prompt }],

      parameters: {
        sampleCount: 1,

        aspectRatio:
          asset.size === "1792x1024" ? "16:9" : asset.size === "1024x1792" ? "9:16" : "1:1",

      },

    });

    const options = {
      hostname: "us-central1-aiplatform.googleapis.com",

      path: `/v1/projects/placeholder/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict`,

      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${API_KEY}`,

      },

    };

    // Use Gemini Developer API instead (simpler,
 works with API key)
    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: asset.prompt }] }],

      generationConfig: { responseModalities: ["IMAGE",
 "TEXT"] },

    });

    const geminiOptions = {
      hostname: "generativelanguage.googleapis.com",

      path: `/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${API_KEY}`,

      method: "POST",

      headers: {
        "Content-Type": "application/json",

      },

    };

    const req = https.request(geminiOptions,
 (res) => {
      const chunks: Buffer[] = [];
      res.on("data",
 (chunk) => chunks.push(chunk));
      res.on("end",
 () => {
        const raw = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(raw);
          if (json.error) {
            reject(new Error(`API error: ${json.error.message}`));
            return;
          }
          const parts = json.candidates?.[0]?.content?.parts ?? [];
          const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith("image/"));
          if (!imagePart) {
            reject(new Error(`No image in response. Full response: ${raw.slice(0,
 500)}`));
            return;
          }
          resolve(Buffer.from(imagePart.inlineData.data,
 "base64"));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${raw.slice(0,
 500)}`));
        }
      });
    });

    req.on("error",
 reject);
    req.write(geminiBody);
    req.end();
  });
}

async function generateAsset(asset: Asset) {
  const outPath = path.join(OUTPUT_DIR,
 `${asset.name}.png`);
  if (fs.existsSync(outPath)) {
    console.log(`  [skip] ${asset.name} — already exists`);
    return;
  }
  console.log(`  [gen]  ${asset.name} — ${asset.description}`);
  const imageBuffer = await generateImage(asset);
  fs.writeFileSync(outPath,
 imageBuffer);
  console.log(`  [ok]   saved → ${outPath}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    console.log("Available assets:");
    ASSETS.forEach((a) => console.log(`  ${a.name.padEnd(30)} ${a.description}`));
    return;
  }

  const targetIndex = args.indexOf("--asset");
  const target = targetIndex !== -1 ? args[targetIndex + 1] : null;
  const toGenerate = target ? ASSETS.filter((a) => a.name === target) : ASSETS;

  if (target && toGenerate.length === 0) {
    console.error(`Asset "${target}" not found. Run with --list to see available assets.`);
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR,
 { recursive: true });

  console.log(`Generating ${toGenerate.length} asset(s) → ${OUTPUT_DIR}\n`);
  for (const asset of toGenerate) {
    await generateAsset(asset);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Fatal:",
 err.message);
  process.exit(1);
});
