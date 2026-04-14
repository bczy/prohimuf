#!/usr/bin/env node
/**
 * Audio downloader — Prohibition remake
 * Downloads boom bap / hip-hop instrumental tracks from Internet Archive (public domain / CC)
 * No login required — all files are freely accessible.
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
const OUTPUT_DIR = path.resolve(__dirname,
 "../public/assets/audio");

// All tracks from Internet Archive — public domain or CC licensed,
 direct MP3 links
const TRACKS = [
  // BGM tracks (loops for in-game music)
  {
    name: "bgm_loop",

    description: "Main BGM — boom bap instrumental (primary loop)",

    url: "https://archive.org/download/78_honeysuckle-rose_fats-waller-and-his-rhythm-fats-waller-ed-kirkeby_gbia0001280b/Honeysuckle%20Rose%20-%20Fats%20Waller%20and%20his%20Rhythm.mp3",

    // Fallback: use a simpler known-good IA track
    fallback: "https://archive.org/download/testmp3testfile/mpthreetest.mp3",

  },

  {
    name: "bgm_tension",

    description: "Tension BGM — faster tempo when danger",

    url: "https://archive.org/download/78_honeysuckle-rose_fats-waller-and-his-rhythm-fats-waller-ed-kirkeby_gbia0001280b/Honeysuckle%20Rose%20-%20Fats%20Waller%20and%20his%20Rhythm.mp3",

    fallback: "https://archive.org/download/testmp3testfile/mpthreetest.mp3",

  },

];

// For the real boom bap tracks,
 we'll use these IA identifiers
// and construct direct download URLs from their known file structure
const IA_TRACKS = [
  {
    name: "bgm_loop",

    description: "Boom bap instrumental 1",

    identifier: "LukHash_-_Hard_Impact",

    file: "LukHash_-_05_-_Hard_Impact.mp3",

  },

  {
    name: "bgm_loop2",

    description: "Boom bap instrumental 2",

    identifier: "LukHash_-_War_Inside_My_Head",

    file: "LukHash_-_01_-_War_Inside_My_Head.mp3",

  },

];

function sleep(ms) {
  return new Promise((r) => setTimeout(r,
 ms));
}

function download(url,
 destPath) {
  return new Promise((resolve,
 reject) => {
    const proto = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);

    const req = proto.get(url,
 (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(destPath);
        download(res.headers.location,
 destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${String(res.statusCode)}`));
        return;
      }
      res.pipe(file);
      file.on("finish",
 () => {
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

    req.on("error",
 (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    req.setTimeout(30000,
 () => {
      req.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error("Timeout"));
    });
  });
}

// Fetch the IA item metadata to find actual MP3 files
async function getIAFiles(identifier) {
  return new Promise((resolve,
 reject) => {
    const url = `https://archive.org/metadata/${identifier}/files`;
    https
      .get(url,
 (res) => {
        const chunks = [];
        res.on("data",
 (c) => chunks.push(c));
        res.on("end",
 () => {
          try {
            const data = JSON.parse(Buffer.concat(chunks).toString());
            resolve(data.result ?? []);
          } catch {
            resolve([]);
          }
        });
      })
      .on("error",
 reject);
  });
}

async function downloadTrack(name,
 description,
 url,
 retries = 3) {
  const destPath = path.join(OUTPUT_DIR,
 `${name}.mp3`);

  if (fs.existsSync(destPath)) {
    console.log(`  [skip] ${name} — already exists`);
    return true;
  }

  console.log(`\n  [dl]   ${name} — ${description}`);
  console.log(`         ${url.slice(0,
 80)}...`);

  for (let i = 0; i < retries; i++) {
    try {
      const size = await download(url,
 destPath);
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

// Curated list of boom bap / hip-hop instrumental tracks on Internet Archive
// All are public domain or CC licensed
// All Kevin MacLeod — CC-BY 4.0 (attribution required,
 free to use)
// incompetech.com — URLs verified 2026-04-10
const CURATED = [
  {
    name: "bgm_loop",

    description: "Main BGM — Funky Chunk (boom bap groove)",

    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Chunk.mp3",

  },

  {
    name: "bgm_loop2",

    description: "Secondary BGM — Ouroboros (dark groove)",

    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ouroboros.mp3",

  },

  {
    name: "bgm_tension",

    description: "Tension BGM — Sneaky Snitch (suspense)",

    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3",

  },

  {
    name: "bgm_danger",

    description: "Danger BGM — Darkest Child (high tension)",

    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkest%20Child.mp3",

  },

  {
    name: "bgm_win",

    description: "Victory BGM — Reformat (upbeat)",

    url: "https://incompetech.com/music/royalty-free/mp3-royaltyfree/Reformat.mp3",

  },

];

const FALLBACKS = {};

async function main() {
  fs.mkdirSync(OUTPUT_DIR,
 { recursive: true });

  console.log(`Downloading ${String(CURATED.length)} audio tracks → public/assets/audio/\n`);

  let downloaded = 0;
  let failed = [];

  for (const track of CURATED) {
    const ok = await downloadTrack(track.name,
 track.description,
 track.url);
    if (ok) {
      downloaded++;
    } else {
      // Try fallback
      const fallbackUrl = FALLBACKS[track.name];
      if (fallbackUrl) {
        console.log(`  [fallback] trying ${fallbackUrl.slice(0,
 60)}...`);
        const ok2 = await downloadTrack(track.name,
 track.description,
 fallbackUrl);
        if (ok2) {
          downloaded++;
        } else {
          failed.push(track.name);
        }
      } else {
        failed.push(track.name);
      }
    }
    await sleep(1000);
  }

  console.log(`\nDone. ${String(downloaded)}/${String(CURATED.length)} tracks downloaded.`);

  if (failed.length > 0) {
    console.log(`\nFailed: ${failed.join(",
 ")}`);
    console.log("These files need to be added manually to public/assets/audio/");
  }

  // Print what Howler expects
  console.log("\nHowler paths:");
  CURATED.forEach((t) => {
    console.log(`  /assets/audio/${t.name}.mp3`);
  });
}

main().catch((err) => {
  console.error("Fatal:",
 err.message);
  process.exit(1);
});
