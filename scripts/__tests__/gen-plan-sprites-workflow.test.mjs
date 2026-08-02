import { it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { parse } from "yaml";

/**
 * Dry-run of gen-plan-sprites.yml's "[props] Style gate" step (SP2 T5) — the
 * loop reads `gen-nearfg-sprites.mjs --plan <id> --list` and calls
 * check-nearfg-style.mjs per prop. Two bash traps are pinned here:
 *   - `cmd | while read; do fail=1; done` runs the loop body in a SUBSHELL,
 *     so `fail=1` never reaches the `exit "$fail"` after the loop;
 *   - `done < <(cmd)` hides cmd's exit status from `set -e`, so a crashed
 *     --list would gate ZERO props and exit 0 — a silent vacuous PASS
 *     (PR #156 panel finding). The list is captured via a plain assignment
 *     (errexit-visible) and fed to the loop with a here-string instead.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOW = path.join(REPO_ROOT, ".github", "workflows", "gen-plan-sprites.yml");

function loadStep(stepName) {
  const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
  const steps = doc.jobs.generate.steps;
  const step = steps.find((s) => s.name === stepName);
  if (!step) throw new Error(`step "${stepName}" not found in ${WORKFLOW}`);
  return step.run;
}

const STYLE_GATE_SCRIPT = loadStep("[props] Style gate (grey/C1 + silhouette) — one per plan prop");

it("never pipes the per-prop loop into a subshell (fail=1 must survive the loop)", () => {
  // Static guard against the exact regression this test exists for: a pipe
  // into `while read` — `| while read` — silently drops `fail=1`.
  expect(STYLE_GATE_SCRIPT).not.toMatch(/\|\s*while\s+read/);
});

it("never feeds the loop from a process substitution (--list's own failure must be seen)", () => {
  // `done < <(cmd)` hides cmd's exit status from errexit — the list must be
  // captured as a plain assignment first, then fed to the loop.
  expect(STYLE_GATE_SCRIPT).not.toMatch(/<\s*<\(/);
  expect(STYLE_GATE_SCRIPT).toMatch(/list=\$\(node scripts\/gen-nearfg-sprites\.mjs/);
});

it("FAILS (non-zero) when the --list subprocess itself fails — no vacuous PASS", () => {
  // A level id with no plan makes `gen-nearfg-sprites.mjs --plan … --list`
  // itself exit non-zero before printing a single prop line. The gate must
  // fail loudly, not iterate zero times and exit 0.
  const res = spawnSync("bash", ["-c", STYLE_GATE_SCRIPT], {
    cwd: REPO_ROOT,
    env: { ...process.env, LEVEL_ID: "no-such-generated-level" },
    encoding: "utf8",
  });
  expect(res.status).not.toBe(0);
});

it("gates a prop whose kind contains a SPACE — never a silent skip (panel run-2)", () => {
  // `GeneratedPropSpec.kind` is any `<id>:<name>` string, so a space in the
  // name segment ("fixture:vieux kiosque") is legal. The old loop split the
  // --list line on whitespace (`read -r kind _size arrow asset`): the shifted
  // fields missed the arrow and `continue`d — check-nearfg-style.mjs was
  // NEVER invoked for that prop and the step exited 0, a vacuous pass. Stubs
  // stand in for both node scripts so the dry run proves the LOOP's parsing,
  // not the scripts.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-sprites-space-"));
  try {
    const scriptsDir = path.join(tmp, "scripts");
    fs.mkdirSync(scriptsDir, { recursive: true });
    // Stub --list: byte-for-byte the real script's line format (2-space
    // indent, padEnd(16), WxH, arrow) with a space-carrying kind.
    fs.writeFileSync(
      path.join(scriptsDir, "gen-nearfg-sprites.mjs"),
      `console.log("Defined near-foreground props:");
console.log(\`  \${"fixture:vieux kiosque".padEnd(16)} 307x512  → assets/nearfg/fixture/vieux-kiosque.png\`);
`,
    );
    // Stub the style check: record its exact argv, exit per CHECK_EXIT.
    fs.writeFileSync(
      path.join(scriptsDir, "check-nearfg-style.mjs"),
      `import fs from "fs";
fs.appendFileSync(process.env.CHECK_LOG, JSON.stringify(process.argv.slice(2)) + "\\n");
process.exit(Number(process.env.CHECK_EXIT ?? "0"));
`,
    );
    const log = path.join(tmp, "calls.log");
    const run = (checkExit) =>
      spawnSync("bash", ["-c", STYLE_GATE_SCRIPT], {
        cwd: tmp,
        env: { ...process.env, LEVEL_ID: "fixture", CHECK_LOG: log, CHECK_EXIT: checkExit },
        encoding: "utf8",
      });

    // The check receives the FULL kind (space included) and the right file.
    const pass = run("0");
    expect(pass.status).toBe(0);
    const calls = fs
      .readFileSync(log, "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
    expect(calls).toEqual([
      [
        "--file",
        "public/assets/nearfg/fixture/vieux-kiosque.png",
        "--kind",
        "fixture:vieux kiosque",
      ],
    ]);

    // Mutation half: the SAME prop failing its check must fail the gate —
    // a skipped line would exit 0 without ever calling the check.
    fs.rmSync(log, { force: true });
    const fail = run("1");
    expect(fail.status).not.toBe(0);
    expect(fs.readFileSync(log, "utf8")).toContain("vieux kiosque");
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

it("FAILS (non-zero) when the plan's prop file is missing — real bash run", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-plan-sprites-"));
  try {
    // Exercise the REAL script against the real fixture plan (no PNG on disk
    // for it — never generated, per its own doc comment) from the repo root,
    // so the relative `node scripts/...` calls resolve exactly as they would
    // on the runner (working-directory == repo root).
    const res = spawnSync("bash", ["-c", STYLE_GATE_SCRIPT], {
      cwd: REPO_ROOT,
      env: { ...process.env, LEVEL_ID: "fixture" },
      encoding: "utf8",
    });
    expect(res.status).not.toBe(0);
    expect(res.stdout).toMatch(/MISSING/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

/**
 * Garde anti-dérive doc↔code (panel #156 run 10) : SCRIPTS.md décrivait le gate
 * props comme utilisant `done < <(cmd)` — exactement l'anti-pattern que le step
 * refuse (il masquerait le code de sortie de --list, donc un PASS creux). Un
 * mainteneur suivant la doc aurait réintroduit la régression. La doc ne peut plus
 * recommander ce que le test interdit.
 */
it("SCRIPTS.md ne recommande pas la substitution de process pour le gate props", () => {
  const doc = fs.readFileSync(path.join(REPO_ROOT, "scripts", "SCRIPTS.md"), "utf8");
  const section = doc.slice(doc.indexOf("- **props** —"), doc.indexOf("Never on `main`"));
  expect(section).not.toMatch(/substitution\s*—?\s*`done < <\(/);
  expect(section).toMatch(/here-string|<<</);
});

/**
 * Le step de commit des props ne doit PAS conditionner son `git add` à un glob
 * non récursif : un asset d'un niveau plus profond ne serait jamais commité et le
 * job sortirait en vert, l'art perdu avec le runner (panel #156 run 12).
 */
it("le commit des props n'est pas gardé par un glob de présence non récursif", () => {
  const doc = parse(fs.readFileSync(WORKFLOW, "utf8"));
  const step = Object.values(doc.jobs)
    .flatMap((j) => j.steps ?? [])
    .find((s) => String(s.name ?? "").includes("[props] Commit"));
  expect(step, "step de commit des props introuvable").toBeDefined();
  expect(step.run).not.toMatch(/compgen -G "public\/assets\/nearfg/);
  expect(step.run).toMatch(/git add -f "public\/assets\/nearfg/);
});
