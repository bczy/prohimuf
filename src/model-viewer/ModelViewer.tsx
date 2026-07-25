import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box3, Vector3, type Group } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  warmBulletModel,
  getBulletModel,
  getBulletModelStatus,
  type BulletModelStatus,
} from "@render/scene/bulletModel";

/*
 * Standalone 3D model viewer (ADR-0064 dev tool) — a bare page to actually LOOK at
 * `assets/models/bullet.glb` once the CI generation workflow has produced it,
 * before wiring `BulletSprite.tsx`'s `MODEL_SCALE`/orientation. It reuses the same
 * `bulletModel.ts` loader the game uses (no separate loading code to drift), and
 * shows the identical procedural cylinder+cap fallback while the GLB is missing or
 * still loading, so the "nothing to see yet" state is self-explanatory.
 *
 * Not part of the game bundle: its own Vite entry (model-viewer.html), dev-only.
 * `?url=<path>` overrides the model path for viewing any other generated GLB with
 * the same tool (defaults to the bullet model).
 */

const DEFAULT_MODEL_PATH = "assets/models/bullet.glb";

// Same dimensions/colors as BulletSprite.tsx's guaranteed fallback, so the
// viewer's "nothing generated yet" state matches what actually renders in-game.
const BODY_LENGTH = 0.28;
const BODY_RADIUS = 0.06;
const CAP_RADIUS = 0.08;
const ENEMY_BULLET_COLOR = "#ff4444";
const ENEMY_BULLET_EMISSIVE = "#ff2222";
const ENEMY_BULLET_EMISSIVE_INTENSITY = 0.7;

function modelUrlFromQuery(): string {
  const raw = new URLSearchParams(window.location.search).get("url");
  const path = raw?.trim() ?? DEFAULT_MODEL_PATH;
  return `${import.meta.env.BASE_URL}${path}`;
}

// Thin bridge to three's own OrbitControls (no @react-three/drei dependency,
// same "use the loader/control three already ships" choice as bulletModel.ts).
function OrbitRig(): null {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    return () => { controls.dispose(); };
  }, [controls]);

  useFrame(() => controls.update());
  return null;
}

// The exact fallback geometry BulletSprite.tsx mounts — kept in sync manually
// (small, unlikely-to-drift constants) rather than exported/shared, to avoid
// coupling a dev-only tool's import graph to the live gameplay component.
function ProceduralFallback(): JSX.Element {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh position={[0, BODY_LENGTH / 2, 0]}>
        <cylinderGeometry args={[BODY_RADIUS, BODY_RADIUS, BODY_LENGTH, 16]} />
        <meshStandardMaterial
          color={ENEMY_BULLET_COLOR}
          emissive={ENEMY_BULLET_EMISSIVE}
          emissiveIntensity={ENEMY_BULLET_EMISSIVE_INTENSITY}
        />
      </mesh>
      <mesh position={[0, BODY_LENGTH, 0]}>
        <sphereGeometry args={[CAP_RADIUS, 16, 16]} />
        <meshStandardMaterial
          color={ENEMY_BULLET_COLOR}
          emissive={ENEMY_BULLET_EMISSIVE}
          emissiveIntensity={ENEMY_BULLET_EMISSIVE_INTENSITY}
        />
      </mesh>
    </group>
  );
}

// Mounts the generated GLB the first frame it becomes available, and reports its
// (unscaled) bounding-box size back up so the HUD can help pick MODEL_SCALE.
function GeneratedModel({
  onSize,
}: {
  onSize: (size: Vector3 | null) => void;
}): JSX.Element | null {
  const groupRef = useRef<Group | null>(null);
  const attached = useRef(false);

  useFrame(() => {
    if (attached.current) return;
    const model = getBulletModel();
    if (model === null || groupRef.current === null) return;
    attached.current = true;
    const clone = model.clone(true);
    groupRef.current.add(clone);
    const box = new Box3().setFromObject(clone);
    onSize(box.getSize(new Vector3()));
  });

  return <group ref={groupRef} />;
}

function Scene({
  status,
  onStatus,
  onSize,
}: {
  status: BulletModelStatus;
  onStatus: (s: BulletModelStatus) => void;
  onSize: (size: Vector3 | null) => void;
}): JSX.Element {
  // Mirrors the last status pushed via onStatus so useFrame can diff against
  // it without re-subscribing; the actual render-driving value is the
  // `status` prop (React state owned by ModelViewer), not this ref.
  const lastStatus = useRef<BulletModelStatus>(status);

  useFrame(() => {
    const next = getBulletModelStatus();
    if (next !== lastStatus.current) {
      lastStatus.current = next;
      onStatus(next);
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <directionalLight position={[-3, -2, -4]} intensity={0.4} />
      <gridHelper args={[4, 16]} />
      <axesHelper args={[1]} />
      {status !== "loaded" && <ProceduralFallback />}
      <GeneratedModel onSize={onSize} />
      <OrbitRig />
    </>
  );
}

export function ModelViewer(): JSX.Element {
  const url = useMemo(modelUrlFromQuery, []);
  const [status, setStatus] = useState<BulletModelStatus>("idle");
  const [size, setSize] = useState<Vector3 | null>(null);

  useEffect(() => {
    void warmBulletModel(url);
  }, [url]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [1.2, 1, 1.2], fov: 45, near: 0.01, far: 100 }}>
        <color attach="background" args={["#1a1a1a"]} />
        <Scene status={status} onStatus={setStatus} onSize={setSize} />
      </Canvas>
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "10px 14px",
          background: "rgba(0,0,0,0.65)",
          color: "#eee",
          font: "12px/1.5 monospace",
          borderRadius: 4,
          maxWidth: 360,
          pointerEvents: "none",
        }}
      >
        <div>
          <strong>muf — 3D model viewer</strong>
        </div>
        <div>url: {url}</div>
        <div>
          status:{" "}
          <span
            style={{
              color: status === "loaded" ? "#7CFF7C" : status === "failed" ? "#FF7C7C" : "#FFD37C",
            }}
          >
            {status}
          </span>
          {status === "failed" && " (GLB missing/404 — trigger gen-bullet-3d.yml, then reload)"}
          {status === "pending" && " (loading…)"}
        </div>
        {size !== null && (
          <div>
            bbox size: {size.x.toFixed(3)} × {size.y.toFixed(3)} × {size.z.toFixed(3)} (unscaled —
            compare to the ~{(BODY_LENGTH + CAP_RADIUS).toFixed(2)} tall fallback for MODEL_SCALE)
          </div>
        )}
        <div style={{ marginTop: 6, opacity: 0.7 }}>
          drag = orbit · scroll = zoom · red/green/blue = local X/Y/Z axes
        </div>
        <div style={{ marginTop: 6, opacity: 0.7 }}>
          ?url=assets/models/&lt;other&gt;.glb to view another model
        </div>
      </div>
    </div>
  );
}
