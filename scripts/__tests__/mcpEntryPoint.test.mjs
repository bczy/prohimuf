import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The ONE thing every other test in this suite bypasses: that `yarn mcp:level-editor`
 * — the exact command `.mcp.json` runs — actually brings a speaking server up.
 *
 * `mcpServer.test.mjs` drives `createServer()` over an in-memory transport, so it
 * never touches `main()` or the is-main-module guard. And that guard rests on a
 * genuinely surprising fact (panel r9): under plain `vite-node <file>`, vite-node
 * REWRITES `process.argv` to its own bin path, the guard reads false, `main()` never
 * runs, and the process exits having printed nothing at all. The `--script` flag in
 * `package.json` is what prevents that — a flag that looks redundant next to every
 * other `scripts/**` entry (they all run under plain `node`) and is therefore exactly
 * the kind of thing a future cleanup deletes. Without this test, the whole feature
 * this story ships could regress to silence while tsc, vitest, lint and the panel all
 * stay green.
 *
 * So: spawn the real command, speak real JSON-RPC over its real stdio, and require a
 * real answer.
 */
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Minimal newline-delimited JSON-RPC exchange against the spawned server. */
async function initializeOverStdio(command, args, waitMs = 60000) {
  const proc = spawn(command, args, { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
  try {
    proc.stdin.write(
      `${JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "entry-point-smoke", version: "0.0.0" },
        },
      })}\n`,
    );

    let out = "";
    return await new Promise((resolve) => {
      const done = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      const timer = setTimeout(() => {
        done(null);
      }, waitMs);
      proc.stdout.on("data", (chunk) => {
        out += String(chunk);
        for (const line of out.split("\n")) {
          if (line.trim() === "") continue;
          try {
            const message = JSON.parse(line);
            if (message.id === 1) done(message);
          } catch {
            // partial line — keep buffering
          }
        }
      });
      proc.on("exit", () => {
        done(null);
      });
    });
  } finally {
    proc.kill();
  }
}

describe("the real MCP entry point (`yarn mcp:level-editor`)", () => {
  it("answers a JSON-RPC initialize on stdio, identifying itself as level-editor", async () => {
    const response = await initializeOverStdio("yarn", ["mcp:level-editor"]);
    expect(response).not.toBeNull();
    expect(response.result.serverInfo.name).toBe("level-editor");
  }, 90000);

  it("stays SILENT without the --script flag — the trap this guard exists for", async () => {
    // Pinning the surprise itself: if a future vite-node makes plain invocation work,
    // this goes red and the `--script` flag in package.json can be revisited on
    // evidence instead of folklore.
    //
    // Proving an ABSENCE gets its own short budget (panel r11): the positive case may
    // legitimately need a slow cold start, but waiting a full minute to conclude
    // "nothing came" would tax every default `yarn vitest` run. Observed silence here
    // is ~2s (the child exits on its own), so 10s is generous without being a stall.
    const response = await initializeOverStdio(
      "yarn",
      ["vite-node", "scripts/mcp-level-editor/server.mjs"],
      10000,
    );
    expect(response).toBeNull();
  }, 20000);
});
