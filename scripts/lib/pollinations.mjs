/**
 * Shared Pollinations.ai fetch helpers (ADR-0044) — the single source of the
 * `flux` (text-to-image) and `kontext` (reference-conditioned img2img) URL
 * contract, lifted verbatim out of gen-enemy-types.mjs so gen-from-reference.mjs
 * and gen-enemy-types.mjs no longer carry two copies. Pure URL builders + a
 * Node `https` fetch with retry — no I/O beyond the network call itself.
 */
import https from "https";

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Optional authentication (Pollinations tiers): when POLLINATIONS_TOKEN is set
// (CI secret), send it as a Bearer header so the request runs on the account's
// tier — faster rate limit (down from the anonymous 1 req / 15s) and `nologo`
// actually honoured (anonymous nologo is no longer guaranteed post-2025-03).
// Kept in the header, NOT the URL, so it never leaks into the URLs the
// generators log. Anonymous (no token) stays the default and is unchanged.
function authHeaders() {
  const token = process.env.POLLINATIONS_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function fetchImage(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, { headers: authHeaders() }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (redirects >= 5 || !res.headers.location) {
            res.resume();
            reject(new Error(`too many redirects (or no location) fetching ${url}`));
            return;
          }
          const next = new URL(res.headers.location, url).toString();
          fetchImage(next, redirects + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
    req.setTimeout(120000, () => req.destroy(new Error("request timeout")));
  });
}

export async function fetchWithRetry(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchImage(url);
    } catch (e) {
      if (i < retries - 1) {
        const wait = (i + 1) * 8000;
        console.log(`  [retry ${i + 1}] ${e.message} — wait ${wait / 1000}s`);
        await sleep(wait);
      } else throw e;
    }
  }
}

// enhance=false is load-bearing (art bible §3.11): Pollinations' enhancer
// rewrites the prompt through an LLM and destroys the verbatim style block the
// set consistency depends on. private=true keeps assets out of the public feed.
// safe=false is pinned explicitly (not left to the server default): the house
// register — clandestine-rave / police / raw-fanzine subject matter — must not
// be silently rejected if Pollinations ever flips its NSFW-filter default.
export function fluxUrl(prompt, seed, width, height) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=flux&seed=${seed}&enhance=false&private=true&safe=false`;
}

// kontext img2img (art bible §3.12, style-lock): same query plus `image=` set to
// the committed frame-1 raw URL so the new pose stays the SAME character.
export function kontextUrl(prompt, seed, width, height, imageUrl) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(
    prompt,
  )}?width=${width}&height=${height}&nologo=true&model=kontext&seed=${seed}&enhance=false&private=true&safe=false&image=${encodeURIComponent(
    imageUrl,
  )}`;
}

// THE single "hero ⇒ image=" decision point (ADR-0043 §2): every caller that
// may or may not have a reference image routes through here instead of
// choosing between fluxUrl/kontextUrl itself, so a generator and
// scripts/check-hero-wiring.mjs's guard always compute the SAME request URL
// for the same inputs and cannot silently diverge.
export function buildRequestUrl({ prompt, seed, width, height, imageUrl }) {
  return imageUrl
    ? kontextUrl(prompt, seed, width, height, imageUrl)
    : fluxUrl(prompt, seed, width, height);
}
