import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * check-workflows.mjs guards four GitHub Actions traps that each cost a real
 * push → CI → red → fix cycle. It runs as a CLI over files on disk, so these
 * drive it the way CI and lint-staged do: write a workflow to a temp repo,
 * run the script, read the exit code and output.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, "..", "check-workflows.mjs");

let dir;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "chkwf-"));
  mkdirSync(join(dir, ".github/workflows"), { recursive: true });
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

/** @returns {{status: number, out: string}} */
function run(yaml, { path = ".github/workflows/t.yml" } = {}) {
  const file = join(dir, path);
  mkdirSync(join(file, ".."), { recursive: true });
  writeFileSync(file, yaml);
  // Warnings go to stderr and errors to stderr too, so both streams matter
  // regardless of exit code — capture them together.
  const r = spawnSync(process.execPath, [SCRIPT, path], { cwd: dir, encoding: "utf8" });
  return { status: r.status ?? 1, out: `${r.stdout ?? ""}${r.stderr ?? ""}` };
}

describe("trap 1 — local action without a root checkout", () => {
  it("fails a job that uses ./ with no checkout at all", () => {
    const r = run(`name: t
on: [push]
jobs:
  r:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/whatever
`);
    expect(r.status).toBe(1);
    expect(r.out).toContain("no preceding root");
  });

  it("still fails when the only checkout used path: — a subdir cannot resolve ./", () => {
    const r = run(`name: t
on: [push]
jobs:
  r:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          path: pr-head
      - uses: ./.github/actions/whatever
`);
    expect(r.status).toBe(1);
    expect(r.out).toContain("path:");
  });
});

describe("trap 2 — empty expression", () => {
  it("fails on an empty expression in a string VALUE", () => {
    const r = run(
      `name: x
description: y
inputs:
  a:
    description: "expressions like \${{ }} do not see env"
    required: true
runs:
  using: composite
  steps:
    - run: echo hi
      shell: bash
`,
      { path: ".github/actions/a/action.yml" },
    );
    expect(r.status).toBe(1);
    expect(r.out).toContain("empty expression");
  });

  it("ignores the same sequence inside a YAML COMMENT — GitHub strips those", () => {
    // Several real workflows here mention the syntax in comments while
    // explaining an injection guard. Flagging them trains people to ignore
    // the checker, so this must stay silent.
    const r = run(`name: t
on: [push]
jobs:
  r:
    runs-on: ubuntu-latest
    steps:
      # pass through env, never \${{ }} interpolation into the shell
      - run: echo hi
`);
    expect(r.status).toBe(0);
  });
});

describe("trap 4 — secret handed to PR-authored code", () => {
  const job = (ref) => `name: t
on: [pull_request]
jobs:
  skeptic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ ${ref} }}
      - name: Review
        uses: anthropics/claude-code-action@v1
        with:
          token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
`;

  // `github.head_ref` uses an underscore and was missed by the first version
  // of this rule — the exact idiom a panel review caught.
  it.each([
    "github.head_ref",
    "needs.prepare.outputs.head_sha",
    "github.event.pull_request.head.sha",
    "github.event.pull_request.head.ref",
  ])("warns when the root checkout is %s", (ref) => {
    const r = run(job(ref));
    expect(r.out).toContain("passes a secret");
  });

  it("stays silent on a base checkout with the PR tree under path:", () => {
    const r = run(`name: t
on: [pull_request]
jobs:
  reviewer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.event.pull_request.base.sha }}
      - uses: actions/checkout@v4
        with:
          ref: \${{ needs.prepare.outputs.head_sha }}
          path: pr-head
      - name: Review
        with:
          token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
`);
    expect(r.out).not.toContain("passes a secret");
    expect(r.status).toBe(0);
  });

  it("does not warn when the secret step runs BEFORE the untrusted checkout", () => {
    // Order matters: nothing PR-authored is on disk yet, so the secret is
    // not exposed. Over-warning here is what makes a checker get ignored.
    const r = run(`name: t
on: [pull_request]
jobs:
  r:
    runs-on: ubuntu-latest
    steps:
      - name: Early trusted step
        with:
          token: \${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.head_ref }}
`);
    expect(r.out).not.toContain("passes a secret");
  });

  it("is silent when no secret is involved at all", () => {
    const r = run(`name: t
on: [pull_request]
jobs:
  r:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: \${{ github.head_ref }}
      - run: yarn test
`);
    expect(r.out).not.toContain("passes a secret");
  });
});
