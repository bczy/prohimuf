import { describe, it, expect } from "vitest";
import path from "path";
import { fileURLToPath } from "url";
import { loadNearForegroundArtFromPlan } from "../gen-nearfg-sprites.mjs";
import { loadPlan } from "../lib/loadPlan.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

describe("loadNearForegroundArtFromPlan (gen-nearfg-sprites.mjs --plan wiring, T5)", () => {
  it("maps the fixture plan's one prop, output path namespaced under the level id", async () => {
    const plan = await loadPlan("fixture");
    const props = loadNearForegroundArtFromPlan(plan, { opening: "OPEN ", style: " STYLE" });
    expect(props).toHaveLength(1);
    const [p] = props;
    expect(p.kind).toBe("fixture:kiosque");
    expect(p.asset).toBe("assets/nearfg/fixture/kiosque.png");
    expect(p.outFile).toBe(path.resolve(REPO_ROOT, "public", "assets/nearfg/fixture/kiosque.png"));
    // The output path derives from the PLAN's own id, not the shared
    // levelArt.json nearfg root (public/assets/nearfg/<kind>.png) — the file
    // for a different plan's kiosque prop can never collide with this one.
    expect(p.outFile).toContain(`${path.sep}fixture${path.sep}`);
  });

  it("strips the plan's own namespace out of the prompt (never leaks 'fixture:')", async () => {
    const plan = await loadPlan("fixture");
    const [p] = loadNearForegroundArtFromPlan(plan);
    expect(p.prompt).not.toContain("fixture:");
    expect(p.prompt).toContain("kiosque");
  });

  it("assembles opening + prompt + style like the hand-authored table", async () => {
    const plan = await loadPlan("fixture");
    const [p] = loadNearForegroundArtFromPlan(plan, { opening: "OPEN ", style: " STYLE" });
    expect(p.assembled).toBe(`OPEN ${p.prompt} STYLE`);
  });

  it("uses a free (non-pinned) seed", async () => {
    const plan = await loadPlan("fixture");
    const [p] = loadNearForegroundArtFromPlan(plan);
    expect(p.seed).toBeNull();
  });

  it("derives width from the declared aspect (round(512 * aspect)), height fixed at 512", async () => {
    const plan = await loadPlan("fixture");
    const [p] = loadNearForegroundArtFromPlan(plan);
    expect(p.height).toBe(512);
    expect(p.width).toBe(Math.round(512 * plan.props[0].aspect));
  });
});
