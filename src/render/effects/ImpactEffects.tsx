import { useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, AdditiveBlending } from "three";
import type { Texture, Mesh, MeshBasicMaterial, OrthographicCamera } from "three";
import type { ImpactChannel } from "@hooks/useGameLoop";

// Transient player-shot impact effects (ADR-0020): acid-neon explosion, inert
// B&W wall marks, optional static tracer. Single consumer of the ImpactChannel
// — mirrors the FeedbackLayer pooled-mesh pattern (no React churn per shot).
// This layer reads the drained event queue; it never re-resolves a hit.

// --- Tuning constants (transcribed verbatim from spec §5) ---
const EXPLOSION_DURATION = 250; // ms — impact burst life, hit and miss
const EXPLOSION_SIZE_HIT = 1.4; // world diameter — full body burst
const EXPLOSION_SIZE_MISS = 0.7; // world diameter — lesser wall spark
const TARGET_BASE_DROP = 0.45; // world — hit burst drop below slot centre
const TRACER_DURATION = 50; // ms — static muzzle→impact flash life
const TRACER_WIDTH = 0.06; // world — thin beam
const WALL_MARK_CAP = 16; // FIFO bound — oldest evicted past this
const WALL_MARK_SIZE = 0.35; // world diameter — small inert scuff

// Pool sizes: comfortably absorb rapid fire within each effect's short life.
const EXPLOSION_POOL = 12;
const TRACER_POOL = 12;

// renderOrder layering (all scene materials are depthWrite:false, so paint order
// is governed by renderOrder). Backdrop panels 0..3, enemies 4, foreground 5,
// courier/vehicle 6..7, crosshair 16384.
const MARK_RENDER_ORDER = 3.5; // in front of facade panels, behind enemies
const TRACER_RENDER_ORDER = 7.5; // in front of enemies, below the explosion
const EXPLOSION_RENDER_ORDER = 8; // frames/engulfs the target, above the scene

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

// Soft-edged neon beam: transparent → bright core → transparent across the width
// (a crack of light, not a hard bar). Additive.
let tracerTex: Texture | null = null;
function getTracerTexture(): Texture | null {
  if (tracerTex !== null) return tracerTex;
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 1;
  const g = c.getContext("2d");
  if (g === null) return null;
  const grad = g.createLinearGradient(0, 0, 16, 0);
  grad.addColorStop(0, "rgba(40,240,255,0)");
  grad.addColorStop(0.5, "rgba(210,255,255,1)");
  grad.addColorStop(1, "rgba(40,240,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 1);
  tracerTex = new CanvasTexture(c);
  return tracerTex;
}

interface Burst {
  active: boolean;
  born: number;
  x: number;
  y: number;
  diameter: number;
  peak: number;
}

interface Tracer {
  active: boolean;
  born: number;
  x: number;
  midY: number;
  length: number;
}

interface Mark {
  active: boolean;
  x: number;
  y: number;
}

export function ImpactEffects({
  channelRef,
}: {
  channelRef: React.RefObject<ImpactChannel>;
}): JSX.Element {
  const { camera, size } = useThree();

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

  const tracerMeshes = useRef<(Mesh | null)[]>(Array.from({ length: TRACER_POOL }, () => null));
  const tracers = useRef<Tracer[]>(
    Array.from({ length: TRACER_POOL }, () => ({
      active: false,
      born: 0,
      x: 0,
      midY: 0,
      length: 0,
    })),
  );

  const markMeshes = useRef<(Mesh | null)[]>(Array.from({ length: WALL_MARK_CAP }, () => null));
  const marks = useRef<Mark[]>(
    Array.from({ length: WALL_MARK_CAP }, () => ({ active: false, x: 0, y: 0 })),
  );
  // FIFO write cursor: overwriting marks[markCursor] then advancing evicts the
  // oldest mark once the ring is full (spec D4.2).
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
      for (const m of marks.current) m.active = false;
      for (const b of bursts.current) b.active = false;
      for (const t of tracers.current) t.active = false;
      markCursor.current = 0;
    }

    // Muzzle origin Y — derived from the live viewport, never hardcoded (§4 note 2):
    // the bottom edge of the current view so the tracer reads as fired up from street.
    const ortho = camera as OrthographicCamera;
    const viewH = size.height / ortho.zoom;
    const muzzleY = ortho.position.y - viewH / 2;

    // Drain the per-frame queue (single consumer, like Floater[]).
    for (const ev of channel.queue.splice(0)) {
      // Wall mark: at the struck point for BOTH hit and miss (spec D4.1).
      const mark = marks.current[markCursor.current];
      if (mark !== undefined) {
        mark.active = true;
        mark.x = ev.impactPoint.x;
        mark.y = ev.impactPoint.y;
        markCursor.current = (markCursor.current + 1) % WALL_MARK_CAP;
      }

      // Explosion: HIT bursts at the target base; MISS puffs at the impact point.
      const bi = bursts.current.findIndex((b) => !b.active);
      const burst = bi >= 0 ? bursts.current[bi] : undefined;
      if (burst !== undefined) {
        burst.active = true;
        burst.born = now;
        if (ev.classification === "hit" && ev.hit !== undefined) {
          burst.x = ev.hit.slotPosition.x;
          burst.y = ev.hit.slotPosition.y - TARGET_BASE_DROP;
          burst.diameter = EXPLOSION_SIZE_HIT;
          burst.peak = 1;
        } else {
          burst.x = ev.impactPoint.x;
          burst.y = ev.impactPoint.y;
          burst.diameter = EXPLOSION_SIZE_MISS;
          burst.peak = 0.7;
        }
      }

      // Tracer (optional, droppable at the art gate): a static vertical beam from
      // the muzzle up to the impact point. Full length on frame 1, opacity-fade only.
      const length = ev.impactPoint.y - muzzleY;
      if (length > 0) {
        const ti = tracers.current.findIndex((t) => !t.active);
        const tracer = ti >= 0 ? tracers.current[ti] : undefined;
        if (tracer !== undefined) {
          tracer.active = true;
          tracer.born = now;
          tracer.x = ev.impactPoint.x;
          tracer.midY = (ev.impactPoint.y + muzzleY) / 2;
          tracer.length = length;
        }
      }
    }

    // Wall marks: static, no fade — position only.
    marks.current.forEach((m, i) => {
      const mesh = markMeshes.current[i];
      if (!mesh) return;
      if (!m.active) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(m.x, m.y, -0.5);
    });

    // Explosions: quick scale pop, opacity attack then fade over the burst life.
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
      mat.opacity = b.peak * (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85);
    });

    // Tracers: geometry fixed for the whole life; only opacity fades out.
    tracers.current.forEach((tr, i) => {
      const mesh = tracerMeshes.current[i];
      if (!mesh) return;
      if (!tr.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - tr.born) / TRACER_DURATION;
      if (t >= 1) {
        tr.active = false;
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(tr.x, tr.midY, 0.7);
      mesh.scale.set(TRACER_WIDTH, tr.length, 1);
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = 0.7 * (1 - t);
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
      {Array.from({ length: TRACER_POOL }).map((_, i) => (
        <mesh
          key={`tracer-${String(i)}`}
          ref={(m) => {
            tracerMeshes.current[i] = m;
          }}
          visible={false}
          renderOrder={TRACER_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={getTracerTexture()}
            transparent
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
