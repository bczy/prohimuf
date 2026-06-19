import { useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture } from "three";
import type { Mesh, MeshBasicMaterial, Texture } from "three";

// A floating feedback label spawned at a world position (e.g. "+5s", "-1 ♥").
export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
}

const POOL = 16;
const LIFE = 1.1; // seconds on screen
const RISE = 2.2; // world units it floats up over its life

const texCache = new Map<string, Texture>();
function textTexture(text: string, color: string): Texture | null {
  const key = `${color}|${text}`;
  const cached = texCache.get(key);
  if (cached) return cached;
  if (typeof document === "undefined") return null;
  const cv = document.createElement("canvas");
  cv.width = 256;
  cv.height = 128;
  const g = cv.getContext("2d");
  if (g === null) return null;
  g.font = "bold 70px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineJoin = "round";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(0,0,0,0.9)";
  g.strokeText(text, 128, 64);
  g.fillStyle = color;
  g.fillText(text, 128, 64);
  const tex = new CanvasTexture(cv);
  tex.needsUpdate = true;
  texCache.set(key, tex);
  return tex;
}

interface Slot {
  active: boolean;
  born: number;
  x: number;
  baseY: number;
}

// Renders transient floating combat text from a shared queue. Uses a fixed pool
// of reusable meshes (no React churn); the game loop pushes Floaters each tick.
export function FeedbackLayer({ queueRef }: { queueRef: React.RefObject<Floater[]> }): JSX.Element {
  const meshRefs = useRef<(Mesh | null)[]>([]);
  const slots = useRef<Slot[]>(
    Array.from({ length: POOL }, () => ({ active: false, born: 0, x: 0, baseY: 0 })),
  );

  useFrame(() => {
    const now = performance.now() / 1000;

    const queue = queueRef.current;
    if (queue.length > 0) {
      for (const f of queue.splice(0)) {
        const i = slots.current.findIndex((s) => !s.active);
        if (i < 0) break;
        const slot = slots.current[i];
        if (slot === undefined) break;
        slot.active = true;
        slot.born = now;
        slot.x = f.x;
        slot.baseY = f.y;
        const mesh = meshRefs.current[i];
        if (mesh) {
          const mat = mesh.material as MeshBasicMaterial;
          mat.map = textTexture(f.text, f.color);
          mat.needsUpdate = true;
        }
      }
    }

    slots.current.forEach((s, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      if (!s.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - s.born) / LIFE;
      if (t >= 1) {
        s.active = false;
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.set(s.x, s.baseY + RISE * t, 0.85);
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.88;
    });
  });

  return (
    <>
      {Array.from({ length: POOL }).map((_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshRefs.current[i] = m;
          }}
          visible={false}
          position={[0, 0, 0.85]}
        >
          <planeGeometry args={[2.4, 1.2]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
