import { describe, it, expect, vi } from "vitest";
import { callPanelModel } from "../panelLlm.mjs";

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
    });
    expect(res.text).toBe("");
    expect(res.provider).toBe("github-models");
  });
});
