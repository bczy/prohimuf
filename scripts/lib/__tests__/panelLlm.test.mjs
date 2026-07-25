import { describe, it, expect, vi } from "vitest";
import {
  callPanelModel,
  callPanelModelBatched,
  indexDiffByFile,
  packParts,
  splitUnifiedDiff,
} from "../panelLlm.mjs";

/**
 * The panel's provider fallback (ADR-0067).
 *
 * Regression under test: a merge gate whose reviewers all failed on an
 * exhausted Anthropic balance still published "PASS — no blocking or major
 * finding", because a failed call and a clean review both produced zero
 * findings. These tests lock the two halves of the fix — fall back to GitHub
 * Models, and THROW when nothing answers (never return an empty result that a
 * caller could mistake for a clean review).
 */

const ok = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => "" });
const err = (status, message) => ({
  ok: false,
  status,
  text: async () => JSON.stringify({ error: { message } }),
  json: async () => ({}),
});

const anthropicOk = ok({ content: [{ type: "text", text: "from-anthropic" }] });
const githubOk = ok({ choices: [{ message: { content: "from-github" } }] });

const CREDIT = "Your credit balance is too low to access the Anthropic API";
const silent = () => {};

describe("callPanelModel — provider fallback", () => {
  it("uses Anthropic when it answers, without touching the fallback", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(anthropicOk);
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("anthropic");
    expect(res.text).toBe("from-anthropic");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to GitHub Models when the Anthropic balance is exhausted", async () => {
    // The exact production failure: HTTP 400, credit balance too low.
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(err(400, CREDIT))
      .mockResolvedValueOnce(githubOk);
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
    expect(res.text).toBe("from-github");
    expect(res.attempts).toHaveLength(1);
    expect(res.attempts[0].provider).toBe("anthropic");
    expect(fetchImpl.mock.calls[1][0]).toContain("models.github.ai");
  });

  it("sends the GitHub call as a bearer-authorised OpenAI-shaped chat request", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(err(400, CREDIT))
      .mockResolvedValueOnce(githubOk);
    await callPanelModel({
      system: "SYS",
      user: "USR",
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "ghs_tok" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    const [, init] = fetchImpl.mock.calls[1];
    expect(init.headers.authorization).toBe("Bearer ghs_tok");
    const body = JSON.parse(init.body);
    expect(body.messages).toEqual([
      { role: "system", content: "SYS" },
      { role: "user", content: "USR" },
    ]);
  });

  it("uses GitHub Models directly when no Anthropic key is configured", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(githubOk);
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("THROWS when every provider fails — never a silent empty answer", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(err(400, CREDIT))
      .mockResolvedValueOnce(err(500, "upstream exploded"));
    await expect(
      callPanelModel({
        system: "s",
        user: "u",
        env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
        fetchImpl,
        log: silent,
        sleepImpl: async () => {},
      }),
    ).rejects.toThrow(/every LLM provider failed/);
  });

  it("names both providers in the failure so the log says what actually broke", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(err(400, CREDIT))
      .mockResolvedValueOnce(err(401, "bad token"));
    const failure = await callPanelModel({
      system: "s",
      user: "u",
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
    }).catch((e) => e);
    expect(failure.message).toContain("anthropic");
    expect(failure.message).toContain("credit balance");
    expect(failure.message).toContain("github-models");
  });

  it("throws when no provider is configured at all", async () => {
    await expect(
      callPanelModel({ system: "s", user: "u", env: {}, fetchImpl: vi.fn(), log: silent }),
    ).rejects.toThrow(/no LLM provider configured/);
  });

  it("does not burn the fallback on a malformed request (404 model name)", async () => {
    // A bad model id fails identically everywhere — retrying is pure waste.
    const fetchImpl = vi.fn().mockResolvedValueOnce(err(404, "unknown model"));
    await expect(
      callPanelModel({
        system: "s",
        user: "u",
        env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
        fetchImpl,
        log: silent,
        sleepImpl: async () => {},
      }),
    ).rejects.toThrow(/every LLM provider failed/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("propagates a network throw (not just an HTTP error) to the fallback", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(githubOk);
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
  });

  it("returns empty text rather than throwing when a provider answers with no content", async () => {
    // An empty-but-successful answer is a legitimate 'no findings' review.
    const fetchImpl = vi.fn().mockResolvedValue(ok({ choices: [] }));
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.text).toBe("");
    expect(res.provider).toBe("github-models");
  });
});

/**
 * Budget awareness (ADR-0067, second half).
 *
 * Regression under test: the fallback DID reach GitHub Models in CI, and got
 * `413 tokens_limit_reached — Max size: 8000 tokens` on a real 200 KB diff.
 * Measured against the live API: every model carries that same cap, so the
 * payload must be split, not merely re-routed to a bigger model.
 */
describe("provider budgets", () => {
  const bigDiff = [
    `diff --git a/a.ts b/a.ts\n${"+a\n".repeat(6000)}`,
    `diff --git a/b.ts b/b.ts\n${"+b\n".repeat(6000)}`,
  ].join("\n");

  it("splits an oversized diff into several GitHub Models calls", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(githubOk);
    const res = await callPanelModelBatched({
      system: "s",
      preamble: "p",
      parts: splitUnifiedDiff(bigDiff),
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
    expect(res.calls).toBeGreaterThan(1);
    expect(res.texts).toHaveLength(res.calls);
    for (const [url, init] of fetchImpl.mock.calls) {
      expect(url).toContain("models.github.ai");
      const sent = JSON.parse(init.body)
        .messages.map((m) => m.content)
        .join("");
      // The budget is on the CONTENT the model tokenizes, not on JSON escaping.
      expect(sent.length).toBeLessThanOrEqual(21_000);
    }
  });

  it("keeps the same diff in a single Anthropic call", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(anthropicOk);
    const res = await callPanelModelBatched({
      system: "s",
      parts: splitUnifiedDiff(bigDiff),
      env: { ANTHROPIC_API_KEY: "k" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("anthropic");
    expect(res.calls).toBe(1);
  });

  it("caps max_tokens at the GitHub Models output limit", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(githubOk);
    await callPanelModel({
      system: "s",
      user: "u",
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body).max_tokens).toBe(4000);
  });

  it("falls over to GitHub Models and still covers the whole diff", async () => {
    const fetchImpl = vi.fn(async (url) =>
      url.includes("anthropic") ? err(400, CREDIT) : githubOk,
    );
    const res = await callPanelModelBatched({
      system: "s",
      parts: splitUnifiedDiff(bigDiff),
      env: { ANTHROPIC_API_KEY: "k", GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
    const sent = fetchImpl.mock.calls
      .filter(([url]) => url.includes("models.github.ai"))
      .map(([, init]) => JSON.parse(init.body).messages[1].content)
      .join("");
    expect(sent).toContain("a/a.ts");
    expect(sent).toContain("a/b.ts");
  });

  it("throws — never half-reviews — when the fallback 413s mid-batch", async () => {
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n += 1;
      return n === 1
        ? githubOk
        : err(413, "Request body too large for gpt-4.1 model. Max size: 8000 tokens.");
    });
    await expect(
      callPanelModelBatched({
        system: "s",
        parts: splitUnifiedDiff(bigDiff),
        env: { GITHUB_TOKEN: "t" },
        fetchImpl,
        log: silent,
        sleepImpl: async () => {},
      }),
    ).rejects.toThrow(/tokens_limit_reached|every LLM provider failed/);
  });

  it("retries the same provider with a halved payload on a token-limit 413", async () => {
    // A char budget can only approximate a token budget; pathological content
    // (base64, minified) still overflows. Shrink instead of failing the review.
    let n = 0;
    const fetchImpl = vi.fn(async () => {
      n += 1;
      return n <= 2
        ? err(413, "Request body too large for gpt-4.1 model. Max size: 8000 tokens.")
        : githubOk;
    });
    const res = await callPanelModelBatched({
      system: "s",
      parts: splitUnifiedDiff(bigDiff),
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async () => {},
    });
    expect(res.provider).toBe("github-models");
    expect(res.texts.every((t) => t === "from-github")).toBe(true);
  });

  it("backs off and retries when the provider throttles a burst", async () => {
    // Measured 2026-07-25: 16 back-to-back calls draw a 429 despite a
    // 1000 req/min quota — burst shaping, cleared by pacing.
    let n = 0;
    const waits = [];
    const fetchImpl = vi.fn(async () => {
      n += 1;
      return n === 1 ? err(429, "Too many requests.") : githubOk;
    });
    const res = await callPanelModel({
      system: "s",
      user: "u",
      env: { GITHUB_TOKEN: "t" },
      fetchImpl,
      log: silent,
      sleepImpl: async (ms) => void waits.push(ms),
    });
    expect(res.text).toBe("from-github");
    expect(waits).toEqual([2000]);
  });

  it("truncates a single oversized part rather than dropping the file", () => {
    const packed = packParts(["x".repeat(5000), "short"], 1000);
    expect(packed[0]).toContain("[TRUNCATED — part exceeds budget]");
    expect(packed.join("")).toContain("short");
  });

  it("indexes diff hunks by the file they touch", () => {
    const index = indexDiffByFile(bigDiff);
    expect([...index.keys()]).toEqual(["a.ts", "b.ts"]);
    expect(index.get("a.ts")).toContain("+a");
  });
});
