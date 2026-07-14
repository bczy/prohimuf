#!/usr/bin/env node
/**
 * Audio downloader — Prohibition remake
 *
 * Downloads the five background-music tracks shipped with the game. ALL FIVE are
 * Kevin MacLeod cuts from incompetech.com, licensed under Creative Commons:
 * By Attribution 4.0 (CC-BY 4.0). This licence is free to use BUT attribution
 * is MANDATORY — see `public/assets/audio/CREDITS.md` (the canonical, shipped
 * provenance/licence record) and the README "Audio credits / licences" section.
 *
 * The per-track records below (title, author, source, licence, licenceUrl,
 * attribution) are the machine-readable provenance the audio gate requires
 * (ADR-0018). They MUST stay consistent with CREDITS.md and the README.
 *
 * Usage:
 *   node scripts/download-audio.mjs
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/assets/audio");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    // Both protocols are needed: incompetech redirects (301/302) may hop
    // between https and http, and the recursive call re-selects here.
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = proto.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        download(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${String(res.statusCode)}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => {
        file.close();
        const size = fs.statSync(destPath).size;
        if (size < 10000) {
          fs.unlinkSync(destPath);
          reject(new Error(`File too small (${String(size)} bytes) — likely an error page`));
          return;
        }
        resolve(size);
      });
    });

    req.on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error("Timeout"));
    });
  });
}

async function downloadTrack(name, description, url, retries = 3) {
  const destPath = path.join(OUTPUT_DIR, `${name}.mp3`);

  if (fs.existsSync(destPath)) {
    console.log(`  [skip] ${name} — already exists`);
    return true;
  }

  console.log(`\n  [dl]   ${name} — ${description}`);
  console.log(`         ${url.slice(0, 80)}...`);

  for (let i = 0; i < retries; i++) {
    try {
      const size = await download(url, destPath);
      const kb = Math.round(size / 1024);
      console.log(`  [ok]   ${name}.mp3 (${String(kb)} KB)`);
      return true;
    } catch (e) {
      if (i < retries - 1) {
        console.log(`  [retry ${String(i + 1)}] ${e.message} — waiting 5s...`);
        await sleep(5000);
      } else {
        console.log(`  [fail] ${name} — ${e.message}`);
        return false;
      }
    }
  }
  return false;
}

// The five in-game BGM tracks. Every entry is Kevin MacLeod / incompetech.com,
// licensed CC-BY 4.0 (attribution required). Titles verified against the ID3
// tags of the shipped .mp3 files. This list is the canonical provenance record
// for the sourcing pipeline; it MUST match public/assets/audio/CREDITS.md.
const LICENCE = "CC-BY 4.0";
const LICENCE_URL = "https://creativecommons.org/licenses/by/4.0/";
const AUTHOR = "Kevin MacLeod";

/** Build the CC-BY 4.0 attribution norm string for a track title. */
function attributionFor(title) {
  return `"${title}" Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 — ${LICENCE_URL}`;
}

const CURATED = [
  {
    name: "bgm_loop",
    title: "Funky Chunk",
    description: "Main BGM — Funky Chunk (boom bap groove)",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Chunk.mp3",
    author: AUTHOR,
    source: "https://incompetech.com/",
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    attribution: attributionFor("Funky Chunk"),
  },

  {
    name: "bgm_loop2",
    title: "Ouroboros",
    description: "Secondary BGM — Ouroboros (dark groove)",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ouroboros.mp3",
    author: AUTHOR,
    source: "https://incompetech.com/",
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    attribution: attributionFor("Ouroboros"),
  },

  {
    name: "bgm_tension",
    title: "Sneaky Snitch",
    description: "Tension BGM — Sneaky Snitch (suspense)",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3",
    author: AUTHOR,
    source: "https://incompetech.com/",
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    attribution: attributionFor("Sneaky Snitch"),
  },

  {
    name: "bgm_danger",
    title: "Darkest Child",
    description: "Danger BGM — Darkest Child (high tension)",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkest%20Child.mp3",
    author: AUTHOR,
    source: "https://incompetech.com/",
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    attribution: attributionFor("Darkest Child"),
  },

  {
    name: "bgm_win",
    title: "Reformat",
    description: "Victory BGM — Reformat (upbeat)",
    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Reformat.mp3",
    author: AUTHOR,
    source: "https://incompetech.com/",
    licence: LICENCE,
    licenceUrl: LICENCE_URL,
    attribution: attributionFor("Reformat"),
  },
];

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Downloading ${String(CURATED.length)} audio tracks → public/assets/audio/\n`);

  let downloaded = 0;
  let failed = [];

  for (const track of CURATED) {
    const ok = await downloadTrack(track.name, track.description, track.url);
    if (ok) {
      downloaded++;
    } else {
      failed.push(track.name);
    }
    await sleep(1000);
  }

  console.log(`\nDone. ${String(downloaded)}/${String(CURATED.length)} tracks downloaded.`);

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.join(", ")}`);
    console.log("These files need to be added manually to public/assets/audio/");
  }

  // Print what Howler expects
  console.log("\nHowler paths:");
  CURATED.forEach((t) => {
    console.log(`  /assets/audio/${t.name}.mp3`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
