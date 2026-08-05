import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ONLY import from core.mjs — this file must never import server.mjs (or the MCP
// SDK) anywhere, which is itself half the proof below.
import { validate } from "../mcp-level-editor/core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE_SOURCE = readFileSync(
  path.resolve(__dirname, "..", "mcp-level-editor", "core.mjs"),
  "utf8",
);

/**
 * spec-mcp-level-editor §6's acceptance criterion, made EXPLICIT (plan T6):
 * "a script CI appelle `validate` EN BIBLIOTHÈQUE (import direct de core.mjs,
 * zéro serveur)". `mcpCore.test.mjs` already does this incidentally for every
 * tool; this file exists ONLY to name the criterion and assert the "zero
 * server" half on top of the functional call — a static proof (`core.mjs`'s
 * own source never references the server/SDK) plus a dynamic one (this test
 * file's own module graph never touches `server.mjs`, so nothing in the
 * process ever spoke MCP's stdio transport to produce this result).
 *
 * Runs under `yarn vitest run scripts` (and `yarn test:coverage` in CI,
 * `.github/workflows/ci.yml`), same as every other `scripts/**\/*.test.mjs` —
 * the "vitest scripts already runs in CI" half of §6 the plan points at.
 */
describe("library surface — no server (spec-mcp-level-editor §6)", () => {
  it("core.mjs never IMPORTS server.mjs or the MCP SDK (doc comments may still name them)", () => {
    expect(CORE_SOURCE).not.toMatch(/from\s+["'].*server\.mjs["']/);
    expect(CORE_SOURCE).not.toMatch(/from\s+["']@modelcontextprotocol\/sdk/);
  });

  it("validates the fixture level through a bare `import … from core.mjs` — zero server, zero process", () => {
    // No McpServer, no StdioServerTransport, no client, no subprocess anywhere
    // above this line in this file's module graph.
    expect(validate({ levelId: "fixture" })).toEqual({ issues: [] });
  });
});
