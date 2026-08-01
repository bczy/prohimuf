#!/usr/bin/env node
// MCP level-editor server — stdio transport, dev-only tooling process.
//
// Scope per ADR-0077: this file is a thin transport. It registers the closed
// set of tools (`validate`, `inspect`, `scaffold`, `dryrun`, `preview`, added
// in T3-T5) and delegates all logic to `core.mjs` — no validation rule, no
// disk write, no game knowledge lives here. `ping` is a liveness probe only.
//
// Not part of the app: nothing under src/** imports this file, no build
// references it. Registered in `.mcp.json` on the `codegraph` entry's model.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { dryrun, inspect, preview, scaffold, validate } from "./core.mjs";

export const SERVER_NAME = "level-editor";
export const SERVER_VERSION = "0.1.0";

// Loose on purpose: the SHAPE of a `LevelPlan` is `core.mjs`'s business
// (`validateLevelPlan` is the actual schema check) — the server only needs
// enough of a zod shape to accept an arbitrary plan object over MCP's JSON-RPC
// wire without re-declaring the type here.
const planShape = z.record(z.string(), z.unknown());

function jsonResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function errorResult(error) {
  return {
    content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }],
    isError: true,
  };
}

export function createServer() {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "ping",
    {
      title: "Ping",
      description: "Liveness probe: replies pong with the server version.",
    },
    async () => ({
      content: [{ type: "text", text: `pong ${SERVER_VERSION}` }],
    }),
  );

  server.registerTool(
    "validate",
    {
      title: "Validate",
      description:
        "Validate a level plan (or an already-registered level id) against every " +
        "game-side invariant: validateLevelPlan + validateLevel + validateCatalogue. " +
        "Returns { issues } — empty when the plan is sound.",
      inputSchema: {
        plan: planShape.optional(),
        levelId: z.string().optional(),
      },
    },
    async (input) => {
      try {
        return jsonResult(validate(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "inspect",
    {
      title: "Inspect",
      description:
        "Inspect an already-registered generated level: its plan, its gameplay/art " +
        "projections, and which conventional asset paths are present vs missing on disk.",
      inputSchema: {
        levelId: z.string(),
      },
    },
    async (input) => {
      try {
        return jsonResult(inspect(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "scaffold",
    {
      title: "Scaffold",
      description:
        "Write a NEW generated level module (src/game/levels/generated/<id>.ts) from a " +
        "sound plan. Refuses before touching disk: an unsafe id (path separator, '..', " +
        "outside the filesystem-safe namespace) or any `validate` issue. Never edits " +
        "generated/index.ts, never runs git — { overwrite: true } is required to replace " +
        "an existing module. Returns { ok, path, issues, reminder }.",
      inputSchema: {
        plan: planShape,
        overwrite: z.boolean().optional(),
      },
    },
    async (input) => {
      try {
        return jsonResult(scaffold(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "dryrun",
    {
      title: "Dryrun",
      description:
        "Boot an already-registered generated level headless (?preview=level&level=<id> " +
        "seam), read the HUD/timer twice and report any uncaught page error. Starts (or " +
        "reuses) a local vite dev server and a local headless Chromium — no secret, no " +
        "network beyond localhost. Slow (real browser + real server): expect several " +
        "seconds. Returns { url, pageErrors, tempsFirstRead, tempsSecondRead, " +
        "timerTicking, hudSnippet }.",
      inputSchema: {
        levelId: z.string(),
      },
    },
    async (input) => {
      try {
        return jsonResult(await dryrun(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    "preview",
    {
      title: "Preview",
      description:
        "Start (or reuse) a local vite dev server and return the ?preview=level&level=<id> " +
        "URL for an already-registered generated level, to open in a real browser. Never " +
        "stops the server after returning.",
      inputSchema: {
        levelId: z.string(),
      },
    },
    async (input) => {
      try {
        return jsonResult(await preview(input));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("[level-editor] fatal:", error);
  process.exitCode = 1;
});
