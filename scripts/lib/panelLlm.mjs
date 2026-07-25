// Panel LLM transport with provider fallback (ADR-0067).
//
// The merge-gate panel (ADR-0063) called Anthropic directly from each reviewer
// script. When that account ran out of credit every reviewer got a 400, wrote
// zero findings, and the panel published "PASS — no blocking or major finding".
// A billing outage was indistinguishable from a clean review, so the gate was
// silently decorative.
//
// This module makes the transport provider-agnostic and ordered:
//   1. Anthropic  (`ANTHROPIC_API_KEY`) — the primary reviewer.
//   2. GitHub Models (`GITHUB_TOKEN` + `permissions: models: read`) — the
//      Copilot-side fallback, always available inside Actions with no extra
//      secret to provision.
//
// A provider is only skipped when it is not configured; a configured provider
// that ERRORS is tried, logged, and handed over to the next one. When every
// provider fails the call throws — callers must surface that as a DEGRADED
// verdict rather than an empty (and therefore green) findings list.
//
// Providers do NOT have comparable request budgets. Measured 2026-07-25 against
// the live API: GitHub Models caps EVERY model at 8000 input tokens per request
// (gpt-4o, gpt-4.1 and gpt-4.1-mini all answer 413 `tokens_limit_reached`),
// where Anthropic takes a whole 200 KB diff in one call. The budget is therefore
// a property of the PROVIDER, and `callPanelModelBatched` splits oversized input
// across as many calls as the chosen one needs — a fallback that read 8 KB of a
// 200 KB diff and reported "no findings" would be the very failure this ADR
// exists to kill.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GITHUB_MODELS_URL = "https://models.github.ai/inference/chat/completions";

/** Carry the server's own pacing hint into the error string, for withRetry. */
function retryAfterTag(res) {
  const after = res.headers?.get?.("retry-after");
  return after ? `[retry-after=${after}] ` : "";
}

/** Non-retryable: the request itself is malformed, another provider won't help. */
function isConfigError(status) {
  return status === 404 || status === 422;
}

async function callAnthropic({ apiKey, model, system, user, maxTokens, fetchImpl }) {
  const res = await fetchImpl(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`anthropic ${String(res.status)}: ${retryAfterTag(res)}${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

async function callGitHubModels({ token, model, system, user, maxTokens, fetchImpl }) {
  const res = await fetchImpl(GITHUB_MODELS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `github-models ${String(res.status)}: ${retryAfterTag(res)}${text.slice(0, 300)}`,
    );
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Providers in preference order, configured ones only. `maxInputChars` is the
 * whole-request budget (system + user) in CHARACTERS — a deliberately
 * conservative ~2.6 chars/token against the measured 8000-token cap, because
 * diff text tokenizes far worse than prose.
 */
export function providersFor(env, fetchImpl) {
  return [
    {
      name: "anthropic",
      configured: Boolean(env.ANTHROPIC_API_KEY),
      maxInputChars: 600_000,
      maxOutputTokens: 8192,
      pacingMs: 0,
      send: ({ system, user, maxTokens }) =>
        callAnthropic({
          apiKey: env.ANTHROPIC_API_KEY,
          model: env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
          system,
          user,
          maxTokens,
          fetchImpl,
        }),
    },
    {
      name: "github-models",
      configured: Boolean(env.GITHUB_TOKEN),
      maxInputChars: 21_000,
      maxOutputTokens: 4000,
      pacingMs: 1500,
      send: ({ system, user, maxTokens }) =>
        callGitHubModels({
          token: env.GITHUB_TOKEN,
          model: env.GITHUB_MODELS_MODEL || "openai/gpt-4.1",
          system,
          user,
          maxTokens,
          fetchImpl,
        }),
    },
  ].filter((p) => p.configured);
}

/**
 * Pack `parts` into as few batches as fit `budget` characters. A part larger
 * than the budget on its own is hard-truncated with a visible marker rather
 * than dropped — losing a whole file silently is worse than reading a prefix.
 */
export function packParts(parts, budget) {
  const batches = [];
  let current = "";
  for (const part of parts) {
    const piece =
      part.length > budget
        ? `${part.slice(0, Math.max(1, budget - 40))}\n[TRUNCATED — part exceeds budget]`
        : part;
    if (current === "") {
      current = piece;
    } else if (current.length + piece.length + 1 <= budget) {
      current = `${current}\n${piece}`;
    } else {
      batches.push(current);
      current = piece;
    }
  }
  if (current !== "") batches.push(current);
  return batches.length > 0 ? batches : [""];
}

/**
 * Split a unified diff into one part per file, so batching never cuts a hunk
 * in half. Anything before the first `diff --git` (rare) is kept as its own
 * leading part rather than dropped.
 */
export function splitUnifiedDiff(diff) {
  if (diff.trim() === "") return [];
  const parts = [];
  let current = null;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      if (current !== null) parts.push(current);
      current = line;
    } else if (current === null) {
      current = line;
    } else {
      current = `${current}\n${line}`;
    }
  }
  if (current !== null) parts.push(current);
  return parts;
}

/**
 * Index a unified diff by the path of the file it touches, so a consumer can
 * pull just the hunks a finding actually refers to instead of shipping the
 * whole diff on every request.
 */
export function indexDiffByFile(diff) {
  const index = new Map();
  for (const part of splitUnifiedDiff(diff)) {
    const path = / b\/(.+)$/m.exec(part.split("\n")[0])?.[1];
    if (path !== undefined) index.set(path, part);
  }
  return index;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Transient: the provider is throttling or wobbling, the SAME call may work. */
function isTransient(err) {
  return /\s(429|5\d\d):/.test(err.message);
}

/**
 * Longest `retry-after` we will actually sleep. A burst-shaping 429 clears in
 * seconds; a *quota* 429 reports the seconds until the window resets — measured
 * 2026-07-25 on GitHub Models: 67435s, ~19h. Honouring that parks the runner
 * until the job times out, so beyond this cap the provider is written off for
 * the run and the fallback (or the degraded verdict) takes over at once.
 */
const MAX_RETRY_WAIT_MS = 60_000;

/**
 * Retry a throttled or wobbling provider. Measured 2026-07-25: GitHub Models
 * allows 1000 requests/min, yet answers 429 to a burst of 16 back-to-back
 * calls — the wall is burst shaping, not quota, so pacing clears it. Honours
 * the server's own `retry-after` when it sends one, up to MAX_RETRY_WAIT_MS.
 */
async function withRetry(send, { log, provider, sleepImpl }) {
  const backoff = [2000, 5000, 15000, 30000];
  for (let i = 0; ; i += 1) {
    try {
      return await send();
    } catch (err) {
      if (i >= backoff.length || !isTransient(err)) throw err;
      const hinted = Number(/retry-after=(\d+)/.exec(err.message)?.[1]) * 1000;
      if (hinted > MAX_RETRY_WAIT_MS) {
        log(
          `[panel-llm] ${provider} is rate-limited for ${String(Math.round(hinted / 1000))}s — giving up on it`,
        );
        throw err;
      }
      const wait = Number.isFinite(hinted) && hinted > 0 ? hinted : backoff[i];
      log(`[panel-llm] ${provider} throttled, retrying in ${String(wait / 1000)}s`);
      await sleepImpl(wait);
    }
  }
}

/** The 413 GitHub Models answers when the request overflows its token cap. */
function isTooLarge(err) {
  return /\s413:|tokens_limit_reached/.test(err.message);
}

/**
 * Run `attempt(budget)` and, on a token-limit 413, retry the SAME provider with
 * a halved budget. A character budget can only approximate a token budget —
 * measured 2026-07-25, our own diff runs at 3.9 chars/token, but base64 or
 * minified content tokenizes several times worse. Shrinking beats failing the
 * whole reviewer over one pathological file.
 */
async function withShrink(attempt, budget, log, provider) {
  let current = budget;
  for (let i = 0; ; i += 1) {
    try {
      return await attempt(current);
    } catch (err) {
      if (i >= 3 || !isTooLarge(err) || current <= 2000) throw err;
      current = Math.floor(current / 2);
      log(
        `[panel-llm] ${provider} rejected the payload size, retrying at ${String(current)} chars`,
      );
    }
  }
}

async function attemptProviders({ providers, log, run }) {
  if (providers.length === 0) {
    throw new Error("no LLM provider configured (set ANTHROPIC_API_KEY or GITHUB_TOKEN)");
  }
  const attempts = [];
  for (const provider of providers) {
    try {
      const value = await run(provider);
      if (attempts.length > 0) {
        log(`[panel-llm] ${provider.name} answered after ${String(attempts.length)} failure(s)`);
      }
      return { value, provider: provider.name, attempts };
    } catch (err) {
      attempts.push({ provider: provider.name, error: err.message });
      log(`[panel-llm] ${provider.name} failed: ${err.message}`);
      const status = Number(/\s(\d{3}):/.exec(err.message)?.[1]);
      if (isConfigError(status)) break;
    }
  }
  throw new Error(
    `every LLM provider failed — ${attempts.map((a) => `${a.provider}: ${a.error}`).join(" | ")}`,
  );
}

/**
 * One question, one answer. `user` is trimmed to the chosen provider's budget.
 *
 * @returns {Promise<{ text: string, provider: string, truncated: boolean }>}
 * @throws when every configured provider fails, or none is configured.
 */
export async function callPanelModel({
  system,
  user,
  env = process.env,
  fetchImpl = fetch,
  log = console.error,
  sleepImpl = sleep,
} = {}) {
  let truncated = false;
  const { value, provider, attempts } = await attemptProviders({
    providers: providersFor(env, fetchImpl),
    log,
    run: (p) => {
      const full = Math.max(1000, p.maxInputChars - system.length);
      return withShrink(
        (budget) => {
          truncated = user.length > budget;
          if (truncated) {
            log(
              `[panel-llm] input trimmed to ${p.name}'s budget (${String(user.length)} → ${String(budget)} chars)`,
            );
          }
          return withRetry(
            () =>
              p.send({
                system,
                user: truncated
                  ? `${user.slice(0, budget)}\n[TRUNCATED to fit provider budget]`
                  : user,
                maxTokens: p.maxOutputTokens,
              }),
            { log, provider: p.name, sleepImpl },
          );
        },
        full,
        log,
        p.name,
      );
    },
  });
  return { text: value, provider, attempts, truncated };
}

/**
 * One question asked over as many calls as the chosen provider's budget needs.
 * `preamble` is repeated in every call (it carries the instructions); `parts`
 * is the splittable payload — for a reviewer, one entry per changed file.
 *
 * A provider that dies on any batch fails over as a whole: a half-reviewed diff
 * must never be reported as a complete review.
 *
 * @returns {Promise<{ texts: string[], provider: string, calls: number }>}
 */
export async function callPanelModelBatched({
  system,
  preamble = "",
  parts,
  env = process.env,
  fetchImpl = fetch,
  log = console.error,
  sleepImpl = sleep,
} = {}) {
  const { value, provider, attempts } = await attemptProviders({
    providers: providersFor(env, fetchImpl),
    log,
    run: async (p) => {
      const full = Math.max(1000, p.maxInputChars - system.length - preamble.length);
      return withShrink(
        async (budget) => {
          const batches = packParts(parts, budget);
          if (batches.length > 1) {
            log(`[panel-llm] payload split into ${String(batches.length)} calls for ${p.name}`);
          }
          const texts = [];
          for (const batch of batches) {
            // Space the calls out: the provider shapes bursts even well inside
            // quota, and a paced reviewer is cheaper than a retried one.
            if (texts.length > 0) await sleepImpl(p.pacingMs);
            texts.push(
              await withRetry(
                () => p.send({ system, user: `${preamble}${batch}`, maxTokens: p.maxOutputTokens }),
                { log, provider: p.name, sleepImpl },
              ),
            );
          }
          return texts;
        },
        full,
        log,
        p.name,
      );
    },
  });
  return { texts: value, provider, attempts, calls: value.length };
}
