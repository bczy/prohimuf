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

export const SERVER_NAME = "level-editor";
export const SERVER_VERSION = "0.1.0";

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
