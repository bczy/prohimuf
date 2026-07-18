import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

// Black-box, subprocess-driven exercise of the REAL, unmodified
// scripts/check-hero-wiring.mjs (ADR-0043 §4 Layer B) over disposable
// fixtures — its failure paths, not just its happy path. The guard is not
// exported (it is a CLI script whose functions read from fixed
// `references/approved/**` paths resolved from ITS OWN file location, not
// argv/cwd), so instead of touching the repo's real fixtures (shared,
// risky under parallel test runs) or forking the script to add exports
// (out of this lane's file ownership for check-hero-wiring.mjs itself —
// ADR-0007 scope), each test builds a throwaway sandbox that mirrors just
// enough of the real tree — a COPY of the real check-hero-wiring.mjs and
// lib/heroes.mjs (so this test tracks the guard's actual current behaviour,
// never a hand-duplicated reimplementation that could silently drift) plus a
// tiny controllable `gen-vehicle-sprites.mjs` stub for the last-mile check —
// and runs it as a real child process, asserting exit code + stderr.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const tmpDirs = [];

afterEach(() => {
  for (const d of tmpDirs.splice(0)) {
    fs.rmSync(d, { recursive: true, force: true });
  }
});

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "check-hero-wiring-"));
  tmpDirs.push(dir);
  fs.mkdirSync(path.join(dir, "scripts", "lib"), { recursive: true });
  fs.mkdirSync(path.join(dir, "references", "approved", "vehicles"), { recursive: true });

  // Real, unmodified copies — this test exercises the ACTUAL guard/registry
  // logic, not a parallel reimplementation.
  fs.copyFileSync(
    path.join(REPO_ROOT, "scripts", "check-hero-wiring.mjs"),
    path.join(dir, "scripts", "check-hero-wiring.mjs"),
  );
  fs.copyFileSync(
    path.join(REPO_ROOT, "scripts", "lib", "heroes.mjs"),
    path.join(dir, "scripts", "lib", "heroes.mjs"),
  );

  return dir;
}

// Minimal, behaviour-controllable stand-in for gen-vehicle-sprites.mjs's
// `planRequests` export — check-hero-wiring.mjs only ever calls
// `mod.planRequests({ repo, sha, registry })`, so a tiny stub is enough to
// drive the last-mile ("does the hero actually reach image=") check without
// dragging in the real generator's network/canvas dependencies.
function writeVehicleStub(dir, planRequestsBody) {
  fs.writeFileSync(
    path.join(dir, "scripts", "gen-vehicle-sprites.mjs"),
    `export function planRequests({ repo, sha, registry }) {\n${planRequestsBody}\n}\n`,
  );
}

function writeHeroesJson(dir, registry) {
  fs.writeFileSync(
    path.join(dir, "references", "approved", "heroes.json"),
    JSON.stringify(registry, null, 2),
  );
}

function heroesMdEntry({ family, slot, slug, status = "REIGNING" }) {
  return [
    `### ${family}/${slot} — ${slug}`,
    "",
    `- Path: \`references/approved/${family}/${slug}.png\``,
    `- Family / slot: \`${family}\` / \`${slot}\``,
    `- Source trace: \`levelArt.json\` \`${family}.${slot}\`, pinned seed \`1\`; commit/PR \`#1\``,
    "- Verdict: PROMOTE — lead-art, 2026-01-01",
    "- Rationale: test fixture",
    `- Status: ${status}`,
    "",
  ].join("\n");
}

function writeHeroesMd(dir, entries) {
  fs.writeFileSync(path.join(dir, "references", "approved", "HEROES.md"), entries.join("\n"));
}

function touchApprovedFile(dir, family, slug) {
  fs.writeFileSync(path.join(dir, "references", "approved", family, `${slug}.png`), "fixture");
}

function runGuard(dir) {
  const result = spawnSync(process.execPath, [path.join(dir, "scripts", "check-hero-wiring.mjs")], {
    cwd: dir,
    encoding: "utf8",
  });
  return result;
}

describe("check-hero-wiring.mjs (ADR-0043 Layer B) — failure paths over fixtures", () => {
  it("PASSES on an empty registry (AC4 — nothing declared, nothing to guard)", () => {
    const dir = makeSandbox();
    writeHeroesJson(dir, {});
    writeHeroesMd(dir, ["# HEROES.md fixture\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/PASSED|nothing declared/i);
  });

  it("FAILS a machine entry for a DEFERRED family (levels/courier)", () => {
    const dir = makeSandbox();
    writeHeroesJson(dir, {
      levels: { belliard: { slug: "x", approved: "references/approved/levels/x.png" } },
    });
    writeHeroesMd(dir, ["# HEROES.md fixture\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/DEFERRED family "levels"/);
  });

  it("FAILS an unrecognised family", () => {
    const dir = makeSandbox();
    writeHeroesJson(dir, {
      widgets: { foo: { slug: "x", approved: "references/approved/widgets/x.png" } },
    });
    writeHeroesMd(dir, ["# HEROES.md fixture\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/unrecognised family "widgets"/);
  });

  it("FAILS a malformed entry (missing slug/approved shape)", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    writeHeroesJson(dir, { vehicles: { truck: { slug: "only-slug-no-approved" } } });
    writeHeroesMd(dir, ["# HEROES.md fixture\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/entry must be \{ slug: string, approved: string \}/);
  });

  it("FAILS when the approved path is not the canonical references/approved/<family>/<slug>.png", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    writeHeroesJson(dir, {
      vehicles: { truck: { slug: "truck-v1", approved: "public/assets/vehicles/truck.png" } },
    });
    writeHeroesMd(dir, ["# HEROES.md fixture\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/does not equal the canonical/);
  });

  it("FAILS when the frozen hero file is missing on disk", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    // No touchApprovedFile call — the frozen PNG is deliberately absent.
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/frozen hero file missing on disk/);
  });

  it("FAILS when no HEROES.md entry matches the heroes.json declaration", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, ["# HEROES.md fixture — no matching entry\n"]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/no HEROES\.md entry found/);
  });

  it("FAILS when the matching HEROES.md entry is SUPERSEDED, not REIGNING", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, [
      heroesMdEntry({
        family: "vehicles",
        slot: "truck",
        slug: "truck-v1",
        status: "SUPERSEDED-by-truck-v2",
      }),
    ]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/is not REIGNING/);
  });

  it("FAILS when two HEROES.md entries are REIGNING for the same family/slot", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, [
      heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" }),
      heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v0" }),
    ]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(
      /REIGNING HEROES\.md entries for "vehicles\/truck" — must be exactly one/,
    );
  });

  it("FAILS an external-sourced entry with no resolved license (license firewall)", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];");
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: {
          slug: "truck-v1",
          approved: "references/approved/vehicles/truck-v1.png",
          source: "external",
        },
      },
    });
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/external-sourced hero missing a resolved "license" field/);
  });

  it("FAILS the last-mile check when planRequests yields no request for the slot", () => {
    const dir = makeSandbox();
    writeVehicleStub(dir, "return [];"); // no request for ANY slot
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/produced NO request for slot "truck"/);
  });

  it("FAILS the last-mile check when the generated request's url omits the expected image=", () => {
    const dir = makeSandbox();
    // Wired for the slot, but the URL never carries the hero's image= — the
    // exact "declared but not used" defect ADR-0043 exists to catch.
    writeVehicleStub(
      dir,
      'return [{ type: "truck", url: "https://image.pollinations.ai/prompt/x?model=flux" }];',
    );
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(
      /hero declared but NOT threaded into every generated request's image=/,
    );
  });

  it("PASSES end-to-end when every layer (registry, HEROES.md, last-mile url) agrees", () => {
    const dir = makeSandbox();
    writeVehicleStub(
      dir,
      [
        "const hero = registry?.vehicles?.truck;",
        "const imageUrl = `https://raw.githubusercontent.com/${repo}/${sha}/${hero.approved}`;",
        'return [{ type: "truck", url: `https://image.pollinations.ai/prompt/x?model=kontext&image=${encodeURIComponent(imageUrl)}` }];',
      ].join("\n"),
    );
    touchApprovedFile(dir, "vehicles", "truck-v1");
    writeHeroesJson(dir, {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    });
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "truck", slug: "truck-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/PASSED/);
  });

  it("FAILS the reverse-wiring check — a REIGNING HEROES.md entry with no heroes.json entry", () => {
    const dir = makeSandbox();
    // Registry entirely empty (no heroes.json entry for vehicles/car at all);
    // main() skips forward checking on an empty registry but the reverse scan
    // still runs (MINEUR-7), so no generator stub is even needed here.
    writeHeroesJson(dir, {});
    writeHeroesMd(dir, [heroesMdEntry({ family: "vehicles", slot: "car", slug: "car-v1" })]);
    const r = runGuard(dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/declared but NOT threaded \(reverse check\)/);
  });

  it("reverse-wiring is exempt for a DEFERRED family (a human-only HEROES.md record is fine there)", () => {
    const dir = makeSandbox();
    writeHeroesJson(dir, {});
    writeHeroesMd(dir, [
      heroesMdEntry({ family: "levels", slot: "belliard", slug: "belliard-v1" }),
    ]);
    const r = runGuard(dir);
    expect(r.status).toBe(0);
  });
});
