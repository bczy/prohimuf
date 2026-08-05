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

// HTTP statuses that no amount of retrying fixes: a rejected/authenticated
// request stays rejected until a HUMAN acts (recharge the account, fix the
// token, fix the prompt). Backoff exists for transient failures — real 5xx,
// timeouts, dropped connections — and burning it on one of these just delays
// the actionable message. 402 heads this list because it's the one that
// actually happened (empty Pollinations balance, see PollinationsFetchError
// below for the wrinkle in how it's reported).
const NON_RETRYABLE_STATUSES = new Set([400, 401, 402, 403]);

// One-line, human-actionable summaries for the statuses in
// NON_RETRYABLE_STATUSES. Anything not listed here falls back to a generic
// "won't retry" line that still includes the raw body for diagnosis.
const NON_RETRYABLE_ADVICE = {
  400: "request rejected as malformed (400 Bad Request) — check the prompt/URL, no retry will fix this",
  401: "authentication rejected (401 Unauthorized) — POLLINATIONS_TOKEN is missing or invalid, no retry will fix this",
  402: "Pollinations account balance is empty (402 Payment Required) — recharge the account; no image was generated",
  403: "authentication rejected (403 Forbidden) — POLLINATIONS_TOKEN lacks access, no retry will fix this",
};

/** Thrown by `fetchImage` on any non-2xx response. Carries both the literal
 * HTTP status and the "real" status the API actually meant — see
 * `extractRealStatus` — so `fetchWithRetry` can decide retryable vs. not
 * without callers re-parsing the message string. */
export class PollinationsFetchError extends Error {
  constructor(message, { httpStatus, realStatus, retryable }) {
    super(message);
    this.name = "PollinationsFetchError";
    this.httpStatus = httpStatus;
    this.realStatus = realStatus;
    this.retryable = retryable;
  }
}

// The API has been observed wrapping a real error status INSIDE an HTTP 500
// body rather than sending it as the HTTP status itself — e.g. a 402
// insufficient-balance rejection arrives as `HTTP 500` with the body
// `Gen Sana request failed with 402:\n {"message":"...","code":"PAYMENT_REQUIRED","status":402}`.
// Checking `res.statusCode` alone (or a fragile `body.includes("402")`, which
// would also false-positive on a 402 mentioned only in prose) never sees the
// real status. Pull `"status":<digits>` out of the JSON envelope wherever it
// appears in the body and prefer it over the literal HTTP status.
function extractRealStatus(httpStatus, body) {
  const match = /"status"\s*:\s*(\d{3})/.exec(body);
  return match ? Number(match[1]) : httpStatus;
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
            const realStatus = extractRealStatus(res.statusCode, body);
            const retryable = !NON_RETRYABLE_STATUSES.has(realStatus);
            const advice = NON_RETRYABLE_ADVICE[realStatus];
            const message = advice
              ? advice
              : `HTTP ${res.statusCode}${realStatus !== res.statusCode ? ` (real status ${realStatus} in body)` : ""}` +
                `${body ? ` — ${body}` : ""}`;
            reject(
              new PollinationsFetchError(message, {
                httpStatus: res.statusCode,
                realStatus,
                retryable,
              }),
            );
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
      if (e instanceof PollinationsFetchError && !e.retryable) {
        // A payment/auth/malformed-request rejection is not transient —
        // retrying just spends the backoff budget (previously up to 3m30s
        // across 4 waits) waiting out an error that never resolves itself.
        throw e;
      }
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

// Text-to-3D (ADR-0065): a DIFFERENT host (gen.pollinations.ai, not
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
