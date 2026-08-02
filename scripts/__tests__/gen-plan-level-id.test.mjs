import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { parse } from "yaml";

/**
 * The `level_id` allowlist step shared by the three gen-plan-*.yml workflows
 * (panel run-2 on PR #156, security finding): the workflow_dispatch input ends
 * up in filesystem paths, git commands AND a jiti dynamic import that EXECUTES
 * the resolved module, inside jobs holding `contents: write` (and, for two of
 * them, a paid-API secret). The step must exist, run FIRST, and reject
 * anything that is not a plain plan id — dry-run here with the exact `run:`
 * block the runner would execute.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WORKFLOWS = ["gen-plan-backdrop.yml", "gen-plan-sprites.yml", "gen-plan-verify.yml"];
const STEP_NAME = "Validate level_id (allowlist)";

function jobsOf(file) {
  const doc = parse(fs.readFileSync(path.join(REPO_ROOT, ".github", "workflows", file), "utf8"));
  return Object.values(doc.jobs);
}

function validateScriptOf(file) {
  for (const job of jobsOf(file)) {
    const step = (job.steps ?? []).find((s) => s.name === STEP_NAME);
    if (step) return step.run;
  }
  throw new Error(`step "${STEP_NAME}" not found in ${file}`);
}

function runValidate(script, levelId) {
  return spawnSync("bash", ["-c", script], {
    env: { ...process.env, LEVEL_ID: levelId },
    encoding: "utf8",
  });
}

describe.each(WORKFLOWS)("%s — level_id allowlist", (file) => {
  it("declares the allowlist as the FIRST step of every job (before any use of the id)", () => {
    for (const job of jobsOf(file)) {
      expect(job.steps[0].name).toBe(STEP_NAME);
    }
  });

  it("accepts well-formed plan ids", () => {
    const script = validateScriptOf(file);
    for (const id of ["fixture", "porte-de-vanves", "level2"]) {
      const res = runValidate(script, id);
      expect(res.status, id).toBe(0);
    }
  });

  it("rejects traversal, separators, uppercase, spaces, multiline and empty ids", () => {
    const script = validateScriptOf(file);
    for (const id of [
      "../levelPlan",
      "generated/fixture",
      "/etc/passwd",
      "..",
      "Fixture",
      "fixture plan",
      "fixture\n../evil", // a multi-line value must not pass on its first line
      "",
    ]) {
      const res = runValidate(script, id);
      expect(res.status, JSON.stringify(id)).not.toBe(0);
      expect(res.stdout, JSON.stringify(id)).toMatch(/invalid level_id/);
    }
  });
});

describe("l'allowlist vaut aussi sur le chemin d'échec (panel #156 run 4)", () => {
  it.each(WORKFLOWS)("%s : le step de validation porte id: validate", (file) => {
    const steps = jobsOf(file).flatMap((j) => j.steps ?? []);
    const validate = steps.find((s) => String(s.name ?? "").startsWith("Validate level_id"));
    expect(validate?.id, `${file}: id: validate manquant`).toBe("validate");
  });

  it.each(WORKFLOWS)(
    "%s : AUCUN step ne survit au chemin d'échec sans être gaté sur la validation",
    (file) => {
      // failure()/always() sont les deux conditions qui font tourner un step alors
      // que « Validate level_id » a échoué : chacune doit porter le gate (ADR-0078 §2).
      const steps = jobsOf(file).flatMap((j) => j.steps ?? []);
      const survivors = steps.filter((s) => /failure\(\)|always\(\)/.test(String(s.if ?? "")));
      expect(survivors.length, `${file}: aucun step survivant trouvé`).toBeGreaterThan(0);
      for (const s of survivors) {
        expect(String(s.if), `${file} / "${s.name}"`).toContain(
          "steps.validate.outcome == 'success'",
        );
      }
    },
  );

  it.each([
    ["gen-plan-backdrop.yml", "plan-backdrop-unpushed"],
    ["gen-plan-sprites.yml", "plan-sprites-unpushed"],
  ])("%s : le step d'upload est gaté sur le succès de la validation", (file, artifactName) => {
    const steps = jobsOf(file).flatMap((j) => j.steps ?? []);
    const validate = steps.find((s) => String(s.name ?? "").startsWith("Validate level_id"));
    expect(validate?.id).toBe("validate");
    const upload = steps.find((s) => String(s.with?.name ?? "").startsWith(artifactName));
    expect(upload, `${file}: step d'upload introuvable`).toBeDefined();
    // if: failure() SEUL laisserait tourner ce step alors que l'id a été refusé
    expect(upload.if).toContain("steps.validate.outcome == 'success'");
  });
});
