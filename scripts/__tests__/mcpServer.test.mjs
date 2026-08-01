import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

import { createServer } from "../mcp-level-editor/server.mjs";

/**
 * The server stays a thin facade (ADR-0077 D3): this suite drives it exactly
 * like a real MCP client would (JSON-RPC over an in-memory transport pair, no
 * stdio needed) and asserts only that `validate`/`inspect` DISPATCH to
 * `core.mjs` correctly — the actual validation rules are `core.mjs`'s test
 * suite (`mcpCore.test.mjs`), not duplicated here.
 */
async function connectedClient() {
  const server = createServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client;
}

function jsonOf(result) {
  return JSON.parse(result.content[0].text);
}

describe("level-editor MCP server", () => {
  it("lists ping, validate, inspect and scaffold among its tools", async () => {
    const client = await connectedClient();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(
      expect.arrayContaining(["ping", "validate", "inspect", "scaffold"]),
    );
  });

  it("validate({ levelId: 'fixture' }) round-trips through the wire to core.mjs", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "validate", arguments: { levelId: "fixture" } });
    expect(jsonOf(result)).toEqual({ issues: [] });
  });

  it("validate reports an unknown levelId as an issue, not a JSON-RPC error", async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: "validate",
      arguments: { levelId: "does-not-exist" },
    });
    expect(result.isError).not.toBe(true);
    expect(jsonOf(result).issues[0].code).toBe("plan/unknown-level-id");
  });

  it("inspect({ levelId: 'fixture' }) rends the plan/config/art/assets shape", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "inspect", arguments: { levelId: "fixture" } });
    const parsed = jsonOf(result);
    expect(parsed.plan.id).toBe("fixture");
    expect(parsed.assets.missing.length).toBeGreaterThan(0);
  });

  it("inspect on an unknown levelId surfaces the thrown error as an MCP tool error", async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: "inspect",
      arguments: { levelId: "does-not-exist" },
    });
    expect(result.isError).toBe(true);
  });

  it("scaffold refuses an unsafe id over the wire, before any disk access", async () => {
    const client = await connectedClient();
    const result = await client.callTool({
      name: "scaffold",
      arguments: { plan: { id: "../escape" } },
    });
    expect(result.isError).not.toBe(true);
    const parsed = jsonOf(result);
    expect(parsed.ok).toBe(false);
    expect(parsed.issues[0].code).toBe("scaffold/invalid-id");
  });
});
