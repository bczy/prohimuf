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

  it("keeps every street ACTOR above the facade-attached ironwork", () => {
    // ForegroundFrames / WindowGrilles are painted ON the facade (z 0.5), i.e.
    // PHYSICALLY BEHIND the couriers and the van (z >= 0.65). All these materials
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

  it("keeps the delivery vehicle in front of the entire décor", () => {
    for (const key of ["farRow", "courier", "nearRow"] as const) {
      expect(STREET_DEPTH.vehicle.order).toBeGreaterThan(STREET_DEPTH[key].order);
      expect(STREET_DEPTH.vehicle.z).toBeGreaterThan(STREET_DEPTH[key].z);
    }
    // The van's neon rim rides just behind its body but still above both rows.
    expect(STREET_DEPTH.vehicleRim.order).toBeGreaterThan(STREET_DEPTH.nearRow.order);
    expect(STREET_DEPTH.vehicleRim.order).toBeLessThan(STREET_DEPTH.vehicle.order);
  });

  it("gives the courier and the near row slots no other scene layer claims", () => {
    // Same-renderOrder transparent meshes fall back to distance sorting, which is
    // exactly the ambiguity we removed. `others` is DERIVED from the source tree,
    // so a future module taking 5.5 / 5.75 fails here.
    const literals = literalRenderOrders();
    for (const key of ["courier", "nearRow"] as const) {
      const clashes = literals.get(STREET_DEPTH[key].order) ?? [];
      expect(clashes, `${key} slot ${String(STREET_DEPTH[key].order)} is claimed`).toEqual([]);
    }
    // Sanity: the scan really sees the tree (it must find the van's 6 and 7).
    expect(literals.has(STREET_DEPTH.vehicle.order)).toBe(true);
    expect(literals.has(STREET_DEPTH.facadeOverlay.order)).toBe(true);
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
    // The van keeps its own literals (unchanged by this amendment) — assert they
    // still match the table so the two can never drift apart silently.
    const van = read("DeliveryVehicleSprite.tsx");
    expect(van).toContain(`renderOrder={${String(STREET_DEPTH.vehicleRim.order)}}`);
    expect(van).toContain(`renderOrder={${String(STREET_DEPTH.vehicle.order)}}`);
    expect(van).toContain(`const VEHICLE_Z = ${String(STREET_DEPTH.vehicle.z)};`);
  });
});
