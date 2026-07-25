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
//
// The credential is attached ONLY when the request host is Pollinations itself
// — never replayed to a redirect target on another host (fetchImage follows up
// to 5 hops, and a cross-host Location must not receive the account token). A
// whitespace-only token is treated as unset (honours the "empty → anonymous"
// contract).
function authHeaders(url) {
  const token = process.env.POLLINATIONS_TOKEN;
  if (!token || !token.trim()) return {};
  try {
    const host = new URL(url).hostname;
    if (host === "pollinations.ai" || host.endsWith(".pollinations.ai")) {
      return { Authorization: `Bearer ${token.trim()}` };
    }
  } catch {
    // unparseable URL — attach nothing
  }
  return {};
}

export function fetchImage(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, { headers: authHeaders(url) }, (res) => {
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
          // Surface the response body (JSON error envelope on this API, e.g.
          // {"error":{"code":"...","message":"..."}}) instead of discarding it —
          // a bare "HTTP 422" gave no way to diagnose a validation failure.
          const errChunks = [];
          res.on("data", (c) => errChunks.push(c));
          res.on("end", () => {
            const body = Buffer.concat(errChunks).toString("utf8").slice(0, 500);
            reject(new Error(`HTTP ${res.statusCode}${body ? ` — ${body}` : ""}`));
          });
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
//
// generic model-agnostic builder; flux/kontext delegate to it. `model` required.
export function modelUrl({ prompt, seed, width, height, model, imageUrl }) {
  let u =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&nologo=true&model=${encodeURIComponent(model)}` +
    `&seed=${seed}&enhance=false&private=true&safe=false`;
  if (imageUrl) u += `&image=${encodeURIComponent(imageUrl)}`;
  return u;
}

export function fluxUrl(prompt, seed, width, height) {
  return modelUrl({ prompt, seed, width, height, model: "flux" });
}

// Text-to-3D (ADR-0064): a DIFFERENT host (gen.pollinations.ai, not
// image.pollinations.ai) and a DIFFERENT auth contract — the 3D endpoint
// requires an API key (401 with none; there is no anonymous tier like flux),
// so this is CI-only (`POLLINATIONS_TOKEN` secret; authHeaders() above already
// attaches it to any *.pollinations.ai host, so no change was needed there).
// `hyper3d-rodin` is the only listed model that accepts a bare text prompt —
// `trellis-2-*` are image-to-3D and require a reference `image` URL instead.
// Returns a GLB (`model/gltf-binary`).
export function gen3dUrl(prompt, seed, model = "hyper3d-rodin") {
  return (
    `https://gen.pollinations.ai/3d/${encodeURIComponent(prompt)}` +
    `?model=${encodeURIComponent(model)}&seed=${seed}`
  );
}

// kontext img2img (art bible §3.12, style-lock): same query plus `image=` set to
// the committed frame-1 raw URL so the new pose stays the SAME character.
export function kontextUrl(prompt, seed, width, height, imageUrl) {
  return modelUrl({ prompt, seed, width, height, model: "kontext", imageUrl });
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
