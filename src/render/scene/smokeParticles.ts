import {
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PlaneGeometry,
  TextureLoader,
} from "three";
import type { Texture } from "three";

// L2 smoke veil, RE-IMPLEMENTED as a real drifting PARTICLE FIELD (Bertrand direct order,
// shard §17 — supersedes the gpu pre-build 4-quad-veil constraint; Ben re-verdicts in parallel).
// A pool of soft-puff billboards over the boss tableau: each particle spawns low, drifts up +
// sideways, expands, fades in-then-out, then respawns — so many overlapping soft puffs read as
// smoke rolling through the hall, not a static veil. Pure cosmetics (Math.random at mount is fine,
// per the order). ONE texture fetch (the CC0 sprite), NormalBlending, desaturated (never additive),
// world-space layer 0 (rides the CRT composite pass 1 for free — NO new render target / pass,
// `CrtPass` untouched), renderOrder BELOW the parry halo/glyph (13/14). Reduced-motion: frozen at a
// scattered static arrangement, opacity held (no drift / rotation / strobe).

// The CC0 sprite (see `public/assets/fx/LICENSES.md`). Loaded ONCE, shared by every material.
const SMOKE_URL = `${import.meta.env.BASE_URL}assets/fx/smoke.png`;
const SMOKE_TINT = "#9a9a9a"; // desaturated haze; never bright (would trip the CRT bloom gate)
export const SMOKE_RENDER_ORDER = 10; // in front of boss(6)/rings(8), below parry halo/glyph(13/14)

// The world region the field fills, anchor-relative (the boss tableau is ~2.2 units wide).
const REGION_HALF_W = 1.5;
const SPAWN_Y_MIN = -0.7;
const SPAWN_Y_MAX = 0.3;
const Z_MIN = 0.6;
const Z_SPREAD = 0.18;

const rand = (a: number, b: number): number => a + Math.random() * (b - a);

interface Particle {
  ox: number; // anchor-relative offset (drifts each frame under motion)
  oy: number;
  z: number;
  vx: number;
  vy: number;
  scale: number;
  growth: number;
  rot: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  peakOpacity: number;
  // Frozen static arrangement used under prefers-reduced-motion (no advancement).
  staticOx: number;
  staticOy: number;
  staticScale: number;
  staticRot: number;
  staticOpacity: number;
}

function spawn(p: Particle, initial: boolean): void {
  p.ox = rand(-REGION_HALF_W, REGION_HALF_W);
  p.oy = rand(SPAWN_Y_MIN, SPAWN_Y_MAX);
  p.vx = rand(-0.16, 0.16);
  p.vy = rand(0.1, 0.34);
  p.scale = rand(0.5, 0.95);
  p.growth = rand(0.14, 0.4);
  p.rot = rand(0, Math.PI * 2);
  p.rotSpeed = rand(-0.45, 0.45);
  p.maxLife = rand(2.6, 5.2);
  // Stagger initial lives so the field doesn't pulse in unison on the first frame.
  p.life = initial ? rand(0, p.maxLife) : 0;
  p.peakOpacity = rand(0.24, 0.5);
}

function makeParticle(): Particle {
  const p: Particle = {
    ox: 0,
    oy: 0,
    z: rand(Z_MIN, Z_MIN + Z_SPREAD),
    vx: 0,
    vy: 0,
    scale: 1,
    growth: 0,
    rot: 0,
    rotSpeed: 0,
    life: 0,
    maxLife: 1,
    peakOpacity: 0.4,
    staticOx: rand(-REGION_HALF_W, REGION_HALF_W),
    staticOy: rand(SPAWN_Y_MIN, SPAWN_Y_MAX + 0.6),
    staticScale: rand(0.7, 1.3),
    staticRot: rand(0, Math.PI * 2),
    staticOpacity: rand(0.2, 0.42),
  };
  spawn(p, true);
  return p;
}

export interface SmokeUpdate {
  readonly activeCount: number;
  readonly reducedMotion: boolean;
  readonly centreX: number;
  readonly centreY: number;
  readonly envelope: number; // 0..1 fade tied to smokeActive
}

export interface SmokeField {
  readonly group: Group;
  /** True once the CC0 sprite has loaded. Consumers gate the veil envelope on this so no
   * fairness cost (e.g. the parry-glyph smoke degrade) is paid while the veil is absent. */
  isReady(): boolean;
  update(dt: number, opts: SmokeUpdate): void;
  dispose(): void;
}

/**
 * Build a pooled smoke particle field of `maxParticles` billboards (shared geometry, per-particle
 * material so each puff fades independently). The sprite loads once, shared by every material; the
 * field stays hidden until it arrives so no untextured square ever flashes.
 *
 * `renderOrder` defaults to {@link SMOKE_RENDER_ORDER} (the boss veil's band, unchanged). The
 * street-vent plumes pass a LOWER band so ambient smoke can never drift in front of the courier
 * or the delivery van — the "Livrer" targets it must never mask.
 */
export function createSmokeField(
  maxParticles: number,
  renderOrder: number = SMOKE_RENDER_ORDER,
): SmokeField {
  const group = new Group();
  const geometry = new PlaneGeometry(1, 1);
  const meshes: Mesh[] = [];
  const particles: Particle[] = [];

  for (let i = 0; i < maxParticles; i++) {
    const material = new MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      opacity: 0,
    });
    material.color.set(SMOKE_TINT);
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    mesh.visible = false;
    group.add(mesh);
    meshes.push(mesh);
    particles.push(makeParticle());
  }

  let texture: Texture | null = null;
  let ready = false;
  let disposed = false;
  let errored = false;
  new TextureLoader().load(
    SMOKE_URL,
    (t) => {
      if (disposed) {
        // Arrived after dispose() — never stamp it onto disposed materials; release it now.
        t.dispose();
        return;
      }
      texture = t;
      for (const m of meshes) {
        const mat = m.material as MeshBasicMaterial;
        mat.map = t;
        mat.needsUpdate = true;
      }
      ready = true;
    },
    undefined,
    () => {
      // The CC0 sprite failed to load (e.g. 404). Log ONCE and leave the field hidden — the veil
      // simply never appears and isReady() stays false, so no consumer pays a fairness cost (the
      // parry-glyph smoke degrade) for a veil that is not on screen.
      if (!errored) {
        errored = true;
        console.warn(`[smokeParticles] smoke sprite failed to load (${SMOKE_URL}); veil disabled`);
      }
    },
  );

  const update = (dt: number, opts: SmokeUpdate): void => {
    const visible = ready && opts.envelope > 0.02;
    group.visible = visible;
    if (!visible) return;
    const active = Math.max(0, Math.min(maxParticles, Math.floor(opts.activeCount)));
    // Clamp dt so a stalled/2 fps sandbox frame can't teleport the whole field.
    const step = Math.min(dt, 0.1);
    for (let i = 0; i < maxParticles; i++) {
      const mesh = meshes[i];
      const p = particles[i];
      if (mesh === undefined || p === undefined) continue;
      if (i >= active) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
      const mat = mesh.material as MeshBasicMaterial;
      if (opts.reducedMotion) {
        mesh.position.set(opts.centreX + p.staticOx, opts.centreY + p.staticOy, p.z);
        mesh.rotation.z = p.staticRot;
        mesh.scale.set(p.staticScale, p.staticScale, 1);
        mat.opacity = p.staticOpacity * opts.envelope;
        continue;
      }
      p.life += step;
      if (p.life >= p.maxLife) spawn(p, false);
      p.ox += p.vx * step;
      p.oy += p.vy * step;
      p.scale += p.growth * step;
      p.rot += p.rotSpeed * step;
      const lifeT = p.life / p.maxLife; // 0..1
      const fade = Math.sin(lifeT * Math.PI); // fade in then out
      mesh.position.set(opts.centreX + p.ox, opts.centreY + p.oy, p.z);
      mesh.rotation.z = p.rot;
      mesh.scale.set(p.scale, p.scale, 1);
      mat.opacity = p.peakOpacity * fade * opts.envelope;
    }
  };

  const dispose = (): void => {
    disposed = true; // a texture still in flight is disposed on arrival (see the load callback)
    for (const m of meshes) (m.material as MeshBasicMaterial).dispose();
    geometry.dispose();
    texture?.dispose();
  };

  return { group, isReady: () => ready, update, dispose };
}
