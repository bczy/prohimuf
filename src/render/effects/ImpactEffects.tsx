import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial } from "three";
import type { ImpactChannel } from "@hooks/useGameLoop";
import { writeMarkRing } from "./markRing";

// Transient player-shot impact effects (ADR-0020): acid-neon explosion over a
// brief dark backing disc (so additive neon reads against a bright facade), a
// categorical white HIT flash, and inert B&W wall marks. Single consumer of the
// ImpactChannel — mirrors the FeedbackLayer pooled-mesh pattern (no React churn
// per shot). This layer reads the drained event queue; it never re-resolves a hit.

// --- Tuning constants (transcribed from spec §5 + stage-5→4 rework amendments) ---
const EXPLOSION_DURATION = 250; // ms — impact burst life, hit and miss
const EXPLOSION_SIZE_HIT = 1.4; // world diameter — full body burst
const EXPLOSION_SIZE_MISS = 0.9; // world diameter — lesser wall spark (was 0.7)
const TARGET_BASE_DROP = 0.45; // world — hit burst drop below slot centre
const WALL_MARK_CAP = 16; // FIFO bound — oldest evicted past this
const WALL_MARK_SIZE = 0.35; // world diameter — small inert scuff

// Dark backing disc: a brief NORMAL-blended dark radial ground painted UNDER each
// burst so the additive neon has dark ground to read against on a lit facade.
const BACKING_DURATION = 140; // ms — dark ground fade
const BACKING_SIZE_FACTOR = 1.25; // disc diameter = burst diameter * 1.25

// White HIT flash: a 1-frame high-luminance white punch at the burst centre on a
// HIT only. Binary glance-read — white punch = hit, cyan spark = miss.
const FLASH_DURATION = 33; // ms — ~1–2 frame categorical hit cue
const FLASH_DIAMETER = 1.4; // world — high-luminance white core reads ≥ ~1.0 world

// Pool sizes: comfortably absorb rapid fire within each effect's short life.
const EXPLOSION_POOL = 12;
const BACKING_POOL = 12;
const FLASH_POOL = 12;

// renderOrder layering (all scene materials are depthWrite:false, so paint order
// is governed by renderOrder). Backdrop panels 0..3, enemies 4, foreground 5,
// courier/vehicle 6..7, crosshair 16384.
const MARK_RENDER_ORDER = 3.5; // in front of facade panels, behind enemies
const BACKING_RENDER_ORDER = 7.9; // just below the explosion — dark ground
const EXPLOSION_RENDER_ORDER = 8; // frames/engulfs the target, above the scene
const FLASH_RENDER_ORDER = 8.1; // above the explosion — hit-only white punch

// Acid-neon burst: radial white-hot core → cyan (#28F0FF) → transparent. A true
// dégradé (loi du glow — never an aplat); additive so it reads as light.
let explosionTex: Texture | null = null;
function getExplosionTexture(): Texture | null {
  if (explosionTex !== null) return explosionTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(235,255,255,1)");
  grad.addColorStop(0.35, "rgba(40,240,255,0.75)");
  grad.addColorStop(1, "rgba(40,240,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  explosionTex = new CanvasTexture(c);
  return explosionTex;
}

// Dark backing disc: NORMAL-blended dark radial ground (rgba(10,10,12,0.55) →
// transparent). Peak alpha 0.55 is baked here; the per-frame material opacity
// fades it 1→0 over BACKING_DURATION so additive neon always has dark ground.
let backingTex: Texture | null = null;
function getBackingTexture(): Texture | null {
  if (backingTex !== null) return backingTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(10,10,12,0.55)");
  grad.addColorStop(0.5, "rgba(10,10,12,0.5)");
  grad.addColorStop(1, "rgba(10,10,12,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  backingTex = new CanvasTexture(c);
  return backingTex;
}

// White HIT flash: high-luminance white core → transparent. Additive, so it
// punches as light; pure white reads categorically distinct from the cyan reticle.
let flashTex: Texture | null = null;
function getFlashTexture(): Texture | null {
  if (flashTex !== null) return flashTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.42, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  flashTex = new CanvasTexture(c);
  return flashTex;
}

// Inert B&W scorch: dark toner centre softening to a transparent edge. Normal
// blending, no additive — a spent mark does NOT glow (loi du glow §5 / D4.4).
let markTex: Texture | null = null;
function getWallMarkTexture(): Texture | null {
  if (markTex !== null) return markTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(15,15,15,0.9)");
  grad.addColorStop(0.55, "rgba(28,28,28,0.55)");
  grad.addColorStop(1, "rgba(28,28,28,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  markTex = new CanvasTexture(c);
  return markTex;
}

interface Burst {
  active: boolean;
  born: number;
  x: number;
  y: number;
  diameter: number;
  peak: number;
}

interface Backing {
  active: boolean;
  born: number;
  x: number;
  y: number;
  diameter: number;
}

interface Flash {
  active: boolean;
  born: number;
  x: number;
  y: number;
}

interface MarkPos {
  x: number;
  y: number;
}

export function ImpactEffects({
  channelRef,
}: {
  channelRef: React.RefObject<ImpactChannel>;
}): JSX.Element {
  const burstMeshes = useRef<(Mesh | null)[]>(Array.from({ length: EXPLOSION_POOL }, () => null));
  const bursts = useRef<Burst[]>(
    Array.from({ length: EXPLOSION_POOL }, () => ({
      active: false,
      born: 0,
      x: 0,
      y: 0,
      diameter: 0,
      peak: 0,
    })),
  );

  const backingMeshes = useRef<(Mesh | null)[]>(Array.from({ length: BACKING_POOL }, () => null));
  const backings = useRef<Backing[]>(
    Array.from({ length: BACKING_POOL }, () => ({
      active: false,
      born: 0,
      x: 0,
      y: 0,
      diameter: 0,
    })),
  );

  const flashMeshes = useRef<(Mesh | null)[]>(Array.from({ length: FLASH_POOL }, () => null));
  const flashes = useRef<Flash[]>(
    Array.from({ length: FLASH_POOL }, () => ({ active: false, born: 0, x: 0, y: 0 })),
  );

  const markMeshes = useRef<(Mesh | null)[]>(Array.from({ length: WALL_MARK_CAP }, () => null));
  // Persistent wall-mark decal set as a pure FIFO ring (spec D4.2 / AC4): each
  // impact writes at markCursor and advances; past the cap the oldest is evicted.
  // The ring math lives in markRing.ts so the cap invariant is unit-asserted.
  const markSlots = useRef<readonly (MarkPos | null)[]>(
    Array.from({ length: WALL_MARK_CAP }, () => null),
  );
  const markCursor = useRef(0);
  const lastNonce = useRef(0);

  useFrame(() => {
    const now = performance.now();
    const channel = channelRef.current;

    // Level scope (spec D4.3): a restart/new level bumps resetNonce — clear the
    // persistent wall-mark FIFO and any in-flight transient pools.
    if (channel.resetNonce !== lastNonce.current) {
      lastNonce.current = channel.resetNonce;
      channel.queue.length = 0;
      markSlots.current = Array.from({ length: WALL_MARK_CAP }, () => null);
      for (const b of bursts.current) b.active = false;
      for (const d of backings.current) d.active = false;
      for (const f of flashes.current) f.active = false;
      markCursor.current = 0;
    }

    // Drain the per-frame queue (single consumer, like Floater[]).
    for (const ev of channel.queue.splice(0)) {
      // Wall mark: at the struck point for BOTH hit and miss (spec D4.1). One
      // FIFO write into the bounded ring (helper keeps live marks ≤ cap).
      const written = writeMarkRing(markSlots.current, markCursor.current, {
        x: ev.impactPoint.x,
        y: ev.impactPoint.y,
      });
      markSlots.current = written.slots;
      markCursor.current = written.cursor;

      // Explosion anchor + size: HIT bursts at the target base; MISS puffs at the
      // impact point. Hit and miss both peak at 1.0 — the hierarchy is carried by
      // the 1.55× larger hit diameter plus the hit-only white flash.
      const isHit = ev.classification === "hit" && ev.hit !== undefined;
      const ex = isHit ? ev.hit.slotPosition.x : ev.impactPoint.x;
      const ey = isHit ? ev.hit.slotPosition.y - TARGET_BASE_DROP : ev.impactPoint.y;
      const ediam = isHit ? EXPLOSION_SIZE_HIT : EXPLOSION_SIZE_MISS;

      const bi = bursts.current.findIndex((b) => !b.active);
      const burst = bi >= 0 ? bursts.current[bi] : undefined;
      if (burst !== undefined) {
        burst.active = true;
        burst.born = now;
        burst.x = ex;
        burst.y = ey;
        burst.diameter = ediam;
        burst.peak = 1;
      }

      // Dark backing disc under the burst — dark ground for the additive neon.
      const di = backings.current.findIndex((d) => !d.active);
      const backing = di >= 0 ? backings.current[di] : undefined;
      if (backing !== undefined) {
        backing.active = true;
        backing.born = now;
        backing.x = ex;
        backing.y = ey;
        backing.diameter = ediam * BACKING_SIZE_FACTOR;
      }

      // White flash: HIT only — a categorical one-frame punch at the burst centre.
      if (isHit) {
        const fi = flashes.current.findIndex((f) => !f.active);
        const flash = fi >= 0 ? flashes.current[fi] : undefined;
        if (flash !== undefined) {
          flash.active = true;
          flash.born = now;
          flash.x = ex;
          flash.y = ey;
        }
      }
    }

    // Wall marks: static, no fade — position only.
    markSlots.current.forEach((pos, i) => {
      const mesh = markMeshes.current[i];
      if (!mesh) return;
      if (pos === null) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(pos.x, pos.y, -0.5);
    });

    // Dark backing discs: fixed size, opacity fades 1→0 over BACKING_DURATION
    // (the texture carries the 0.55 peak alpha).
    backings.current.forEach((d, i) => {
      const mesh = backingMeshes.current[i];
      if (!mesh) return;
      if (!d.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - d.born) / BACKING_DURATION;
      if (t >= 1) {
        d.active = false;
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(d.x, d.y, 0.78);
      mesh.scale.set(d.diameter, d.diameter, 1);
      (mesh.material as MeshBasicMaterial).opacity = 1 - t;
    });

    // Explosions: quick scale pop; opacity attack → wide plateau → decay over life.
    bursts.current.forEach((b, i) => {
      const mesh = burstMeshes.current[i];
      if (!mesh) return;
      if (!b.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - b.born) / EXPLOSION_DURATION;
      if (t >= 1) {
        b.active = false;
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(b.x, b.y, 0.8);
      const scale = b.diameter * (0.6 + 0.4 * Math.min(1, t / 0.3));
      mesh.scale.set(scale, scale, 1);
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = b.peak * (t < 0.1 ? t / 0.1 : t < 0.4 ? 1 : 1 - (t - 0.4) / 0.6);
    });

    // White HIT flash: full-opacity punch for its ~1-frame life, then gone.
    flashes.current.forEach((f, i) => {
      const mesh = flashMeshes.current[i];
      if (!mesh) return;
      if (!f.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - f.born) / FLASH_DURATION;
      if (t >= 1) {
        f.active = false;
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(f.x, f.y, 0.82);
      mesh.scale.set(FLASH_DIAMETER, FLASH_DIAMETER, 1);
      (mesh.material as MeshBasicMaterial).opacity = 1;
    });
  });

  return (
    <>
      {Array.from({ length: WALL_MARK_CAP }).map((_, i) => (
        <mesh
          key={`mark-${String(i)}`}
          ref={(m) => {
            markMeshes.current[i] = m;
          }}
          visible={false}
          scale={[WALL_MARK_SIZE, WALL_MARK_SIZE, 1]}
          renderOrder={MARK_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={getWallMarkTexture()} transparent depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: BACKING_POOL }).map((_, i) => (
        <mesh
          key={`backing-${String(i)}`}
          ref={(m) => {
            backingMeshes.current[i] = m;
          }}
          visible={false}
          renderOrder={BACKING_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={getBackingTexture()} transparent depthWrite={false} />
        </mesh>
      ))}
      {Array.from({ length: EXPLOSION_POOL }).map((_, i) => (
        <mesh
          key={`burst-${String(i)}`}
          ref={(m) => {
            burstMeshes.current[i] = m;
          }}
          visible={false}
          renderOrder={EXPLOSION_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getExplosionTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
      {Array.from({ length: FLASH_POOL }).map((_, i) => (
        <mesh
          key={`flash-${String(i)}`}
          ref={(m) => {
            flashMeshes.current[i] = m;
          }}
          visible={false}
          renderOrder={FLASH_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getFlashTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
