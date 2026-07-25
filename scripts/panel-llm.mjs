#!/usr/bin/env node
// Shared LLM transport for the CI code-review panel.
//
// Uses the GitHub Models inference API (OpenAI-compatible) authenticated with
// the workflow's own GITHUB_TOKEN — no third-party API key, no external
// billing. The calling job needs `permissions: models: read`.
//
// Inputs (env):
//   GITHUB_TOKEN — required (Actions provides it).
//   PANEL_MODEL  — optional, defaults to openai/gpt-4.1.

const ENDPOINT = "https://models.github.ai/inference/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4.1";

export async function callPanelModel({ system, user, maxTokens = 8192 }) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN missing");

  const model = process.env.PANEL_MODEL || DEFAULT_MODEL;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
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
    throw new Error(`github-models ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function extractJsonArray(text) {
  // Try direct parse first, then extract the first [...] block.
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    /* fall through */
  }
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
