import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { STREET_DEPTH, STREET_DEPTH_BACK_TO_FRONT, STREET_ACTOR_LAYERS } from "../streetDepth";

const SCENE_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
const RENDER_DIR = join(SCENE_DIR, "..");
const read = (file: string): string => readFileSync(join(SCENE_DIR, file), "utf8");

/** Every `.ts`/`.tsx` source file under `src/render` (tests excluded). */
function renderSources(): { path: string; src: string }[] {
  return readdirSync(RENDER_DIR, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && /\.tsx?$/.test(e.name))
    .map((e) => join(e.parentPath, e.name))
    .filter((p) => !p.includes("__tests__"))
    .map((p) => ({ path: relative(RENDER_DIR, p), src: readFileSync(p, "utf8") }));
}

/**
 * Every numeric renderOrder literal actually written in `src/render`, whatever the
 * spelling: `renderOrder={4}`, `renderOrder = 3.5`, `mesh.renderOrder = 10`.
 * Derived by scanning the tree rather than hand-listed, so a future module that
 * grabs the courier's slot IS detected.
 */
function literalRenderOrders(): Map<number, string[]> {
  const found = new Map<number, string[]>();
  for (const { path, src } of renderSources()) {
    for (const m of src.matchAll(/renderOrder\s*(?:=|=\s*\{|\{)\s*(-?\d+(?:\.\d+)?)/g)) {
      const value = Number(m[1]);
      found.set(value, [...(found.get(value) ?? []), path]);
    }
    // `const FOO_RENDER_ORDER = 3.5;` style constants (ImpactEffects, smokeParticles).
    for (const m of src.matchAll(/RENDER_ORDER\s*=\s*(-?\d+(?:\.\d+)?)/g)) {
      const value = Number(m[1]);
      found.set(value, [...(found.get(value) ?? []), path]);
    }
  }
  return found;
}

describe("street depth stack (ADR-0047 amendment 4)", () => {
  it("orders the street layers strictly back-to-front by renderOrder", () => {
    const orders = STREET_DEPTH_BACK_TO_FRONT.map((k) => STREET_DEPTH[k].order);
    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThan(orders[i - 1] as number);
    }
  });

  it("keeps z monotonic with renderOrder, so depth agrees with paint order", () => {
    const zs = STREET_DEPTH_BACK_TO_FRONT.map((k) => STREET_DEPTH[k].z);
    for (let i = 1; i < zs.length; i++) {
      expect(zs[i]).toBeGreaterThan(zs[i - 1] as number);
    }
  });

  it("puts the courier BETWEEN the two kerb rows (Bertrand, 2026-07-25)", () => {
    // Far row never masks the courier; the near row may partially mask it.
    expect(STREET_DEPTH.farRow.order).toBeLessThan(STREET_DEPTH.courier.order);
    expect(STREET_DEPTH.courier.order).toBeLessThan(STREET_DEPTH.nearRow.order);
    expect(STREET_DEPTH.farRow.z).toBeLessThan(STREET_DEPTH.courier.z);
    expect(STREET_DEPTH.courier.z).toBeLessThan(STREET_DEPTH.nearRow.z);
  });

  it("puts the courier IN FRONT OF the delivery van (Bertrand, 2026-07-25)", () => {
    // « le cycliste devrait être aussi devant le camion, là il passe derrière ».
    // Both axes: paint order AND world depth, or the two stories contradict.
    expect(STREET_DEPTH.courier.order).toBeGreaterThan(STREET_DEPTH.vehicle.order);
    expect(STREET_DEPTH.courier.z).toBeGreaterThan(STREET_DEPTH.vehicle.z);
    // ...rim included: the whole van assembly is behind the rider.
    expect(STREET_DEPTH.courier.order).toBeGreaterThan(STREET_DEPTH.vehicleRim.order);
    expect(STREET_DEPTH.courier.z).toBeGreaterThan(STREET_DEPTH.vehicleRim.z);
  });

  it("keeps every street ACTOR above the facade-attached ironwork", () => {
    // ForegroundFrames / WindowGrilles are painted ON the facade (z 0.5), i.e.
    // PHYSICALLY BEHIND the couriers and the van (z >= 0.61). All these materials
    // are transparent + depthWrite:false in one sort list, so renderOrder alone
    // decides: an actor below slot 5 gets its head painted over by a balcony slab
    // (measured on `vitry`: slab world y -4.17..-4.55, rider centred at -4.8 with
    // a 2.6-unit sprite). This is the regression the 4.5 slot shipped.
    for (const key of STREET_ACTOR_LAYERS) {
      expect(STREET_DEPTH[key].order).toBeGreaterThan(STREET_DEPTH.facadeOverlay.order);
      expect(STREET_DEPTH[key].z).toBeGreaterThan(STREET_DEPTH.facadeOverlay.z);
    }
    // The near row too — it is in front of the courier, so it must clear the
    // ceiling the courier clears.
    expect(STREET_DEPTH.nearRow.order).toBeGreaterThan(STREET_DEPTH.facadeOverlay.order);
  });

  it("keeps the delivery van a STREET actor: above the facade, below the near row", () => {
    // ASSUMED CONSEQUENCE of `vehicle < courier < nearRow` (see streetDepth.ts):
    // the van cannot be in front of the near props while staying behind a
    // courier that is itself behind them. So the near row may now partially mask
    // BOTH "Livrer" targets. Explicit Bertrand arbitration, asserted here so a
    // future "put the van back on top" is a red test, not a silent regression.
    for (const key of ["farRow", "facadeOverlay"] as const) {
      expect(STREET_DEPTH.vehicle.order).toBeGreaterThan(STREET_DEPTH[key].order);
      expect(STREET_DEPTH.vehicleRim.order).toBeGreaterThan(STREET_DEPTH[key].order);
    }
    expect(STREET_DEPTH.vehicle.order).toBeLessThan(STREET_DEPTH.nearRow.order);
    expect(STREET_DEPTH.vehicle.z).toBeLessThan(STREET_DEPTH.nearRow.z);
  });

  it("keeps the van's neon rim glued just behind its body (same relative gap)", () => {
    // The rim is an additive glow drawn BEHIND the sprite: strictly lower slot,
    // and exactly the historical 0.01 world-depth setback (was 0.71 vs 0.72).
    expect(STREET_DEPTH.vehicleRim.order).toBeLessThan(STREET_DEPTH.vehicle.order);
    expect(STREET_DEPTH.vehicle.z - STREET_DEPTH.vehicleRim.z).toBeCloseTo(0.01, 10);
    // Nothing may slip between the rim and its body.
    for (const key of ["farRow", "courier", "nearRow", "facadeOverlay"] as const) {
      const order = STREET_DEPTH[key].order;
      expect(
        order > STREET_DEPTH.vehicleRim.order && order < STREET_DEPTH.vehicle.order,
        `${key} sits between the van rim and its body`,
      ).toBe(false);
    }
  });

  it("paints the QTE aura above EVERY street layer, under its own host body", () => {
    // Finding I1. The aura shipped at a bare 5: it TIED facadeOverlay and sat below
    // the van (5.2/5.25), the courier (5.5) and the near row (5.75) — all painted
    // after it — while its host body is painted at 6. So the balcony ironwork and a
    // QTE-frozen courier bit into a rim that is supposed to sit behind its figure
    // and in front of the street. Nothing the street stack owns may follow it.
    for (const key of STREET_DEPTH_BACK_TO_FRONT) {
      expect(
        STREET_DEPTH.qteAura.order,
        `${key} paints after the QTE aura and can bite the rim`,
      ).toBeGreaterThan(STREET_DEPTH[key].order);
    }
    expect(STREET_DEPTH.qteAura.order).toBeGreaterThan(STREET_DEPTH.facadeOverlay.order);
    // ...and strictly under the hostage-QTE tableau bodies (captor 6, hostage 7),
    // the "rim one slot below its body" idiom the van rim already uses.
    expect(STREET_DEPTH.qteAura.order).toBeLessThan(6);
    // Its z stays behind those bodies (both at 0.5) so the sprite occludes the
    // silhouette's interior and only the outward margin reads.
    expect(STREET_DEPTH.qteAura.z).toBeLessThan(0.5);
  });

  it("keeps the ambient band below every actor and target", () => {
    // UrbanMotion is décor: no ambient pixel may mask something the player must hit
    // (enemies/LootCrate at 4) or must not hit (the courier).
    for (const key of STREET_DEPTH_BACK_TO_FRONT) {
      expect(STREET_DEPTH.ambient.order).toBeLessThan(STREET_DEPTH[key].order);
    }
    expect(STREET_DEPTH.ambient.order).toBeLessThan(STREET_DEPTH.facadeOverlay.order);
    // Above the backdrop panels (0..3), which it must be visible over.
    expect(STREET_DEPTH.ambient.order).toBeGreaterThan(3);
    // Below the enemies + LootCrate band (4).
    expect(STREET_DEPTH.ambient.order).toBeLessThan(4);
  });

  it("registers the bands the modules actually use, so the table stays the registry", () => {
    // Finding I2: the table omitted both, which is exactly what let slot 5 look
    // free. Each entry must match the literal its owning module ships.
    const literals = literalRenderOrders();
    expect(
      literals.get(STREET_DEPTH.ambient.order),
      "no module claims the registered ambient band",
    ).toContain("effects/UrbanMotion.tsx");
    // The QTE aura is table-sourced, so it must NOT appear as a literal anywhere.
    expect(literals.get(STREET_DEPTH.qteAura.order) ?? []).toEqual([]);
    for (const file of ["HostageQteSprite.tsx", "BossQteSprite.tsx"]) {
      expect(read(file)).toContain("STREET_DEPTH.qteAura.order");
    }
  });

  it("gives every street layer a slot no other scene module claims", () => {
    // Same-renderOrder transparent meshes fall back to distance sorting, which is
    // exactly the ambiguity we removed. The claimed set is DERIVED from the source
    // tree, so a future module taking 5.2 / 5.25 / 5.5 / 5.75 fails here.
    const literals = literalRenderOrders();
    for (const key of ["vehicleRim", "vehicle", "courier", "nearRow"] as const) {
      const clashes = literals.get(STREET_DEPTH[key].order) ?? [];
      expect(clashes, `${key} slot ${String(STREET_DEPTH[key].order)} is claimed`).toEqual([]);
    }
    // Sanity: the scan really sees the tree (it must find the enemies' 4 and the
    // hostage-QTE tableau's 6/7, which are genuine literals elsewhere).
    expect(literals.has(4)).toBe(true);
    expect(literals.has(6)).toBe(true);
    expect(literals.has(7)).toBe(true);
  });

  it("wires each NearForeground row to ITS OWN table entry (no swap possible)", () => {
    const src = read("NearForeground.tsx");
    const rows = [...src.matchAll(/<Row\b[\s\S]*?\/>/g)].map((m) => m[0]);
    expect(rows).toHaveLength(2);
    const [far, near] = rows as [string, string];
    // The far <Row> must carry the far objects AND the far slot, and mention the
    // near slot nowhere — swapping the two call sites flips these assertions.
    expect(far).toContain('objects={split("far")}');
    expect(far).toContain("renderOrder={STREET_DEPTH.farRow.order}");
    expect(far).toContain("z={STREET_DEPTH.farRow.z}");
    expect(far).not.toContain("nearRow");
    expect(near).toContain('objects={split("near")}');
    expect(near).toContain("renderOrder={STREET_DEPTH.nearRow.order}");
    expect(near).toContain("z={STREET_DEPTH.nearRow.z}");
    expect(near).not.toContain("farRow");
  });

  it("is the single source of truth for the street + facade-overlay layers", () => {
    for (const file of [
      "NearForeground.tsx",
      "CourierSprite.tsx",
      "DeliveryVehicleSprite.tsx",
      "ForegroundFrames.tsx",
      "WindowGrilles.tsx",
    ]) {
      const src = read(file);
      expect(src).toContain("STREET_DEPTH");
      expect(src).not.toMatch(/renderOrder=\{\d/);
    }
    // The courier plane reads its slot from the table, not from a literal.
    const courier = read("CourierSprite.tsx");
    expect(courier).toContain("renderOrder={STREET_DEPTH.courier.order}");
    expect(courier).toContain("const RIDER_Z = STREET_DEPTH.courier.z;");
    // The van too, now that it moved below the courier: body, rim slot and both
    // z values are table-sourced, so the two can never drift apart silently.
    const van = read("DeliveryVehicleSprite.tsx");
    expect(van).toContain("renderOrder={STREET_DEPTH.vehicleRim.order}");
    expect(van).toContain("renderOrder={STREET_DEPTH.vehicle.order}");
    expect(van).toContain("const VEHICLE_Z = STREET_DEPTH.vehicle.z;");
    expect(van).toContain("STREET_DEPTH.vehicleRim.z");
    expect(van).not.toMatch(/VEHICLE_Z\s*-\s*0\.01/);
  });
});
