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

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const GITHUB_MODELS_URL = "https://models.github.ai/inference/chat/completions";

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
    throw new Error(`anthropic ${String(res.status)}: ${text.slice(0, 300)}`);
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
    throw new Error(`github-models ${String(res.status)}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * Ask the panel's LLM, trying each configured provider in order.
 *
 * @returns {Promise<{ text: string, provider: string, attempts: {provider: string, error: string}[] }>}
 *   `provider` is the one that answered; `attempts` lists the providers that
 *   failed before it (empty on a first-try success) so the caller can report a
 *   fallback in the job log and in the panel comment.
 * @throws when every configured provider fails, or none is configured.
 */
export async function callPanelModel({
  system,
  user,
  maxTokens = 8192,
  env = process.env,
  fetchImpl = fetch,
  log = console.error,
} = {}) {
  const providers = [
    {
      name: "anthropic",
      configured: Boolean(env.ANTHROPIC_API_KEY),
      run: () =>
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
      run: () =>
        callGitHubModels({
          token: env.GITHUB_TOKEN,
          model: env.GITHUB_MODELS_MODEL || "openai/gpt-4o",
          system,
          user,
          maxTokens,
          fetchImpl,
        }),
    },
  ];

  const attempts = [];
  const available = providers.filter((p) => p.configured);
  if (available.length === 0) {
    throw new Error("no LLM provider configured (set ANTHROPIC_API_KEY or GITHUB_TOKEN)");
  }

  for (const provider of available) {
    try {
      const text = await provider.run();
      if (attempts.length > 0) {
        log(`[panel-llm] ${provider.name} answered after ${String(attempts.length)} failure(s)`);
      }
      return { text, provider: provider.name, attempts };
    } catch (err) {
      attempts.push({ provider: provider.name, error: err.message });
      log(`[panel-llm] ${provider.name} failed: ${err.message}`);
      // A malformed request fails identically everywhere — don't burn the
      // fallback's quota re-sending it.
      const status = Number(/\s(\d{3}):/.exec(err.message)?.[1]);
      if (isConfigError(status)) break;
    }
  }

  throw new Error(
    `every LLM provider failed — ${attempts.map((a) => `${a.provider}: ${a.error}`).join(" | ")}`,
  );
}
