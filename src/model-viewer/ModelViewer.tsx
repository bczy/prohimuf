import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  Box3,
  CanvasTexture,
  Color,
  TextureLoader,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type Texture,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { createEnemyRimMaterial } from "@render/scene/enemyRimMaterial";
import { WORLD_HEIGHT, getBackdropLayout, levelLayerUrl } from "@game/levels/levelArt";

const DEFAULT_MODEL_PATH = "assets/models/bullet.glb";

type ViewerMode = "single" | "loot-live";
type SpinAxis = "x" | "y" | "z";
type ModelStatus = "idle" | "pending" | "loaded" | "failed";
type RewardType = "money" | "hearts" | "mixed";
type Tier = "base" | "premium" | "objective";

type LiveItem = {
  readonly id: string;
  readonly path: string;
  readonly tier: Tier;
  readonly reward: RewardType;
  readonly rewardLabel: string;
};

const LIVE_ITEMS: readonly LiveItem[] = [
  {
    id: "attache-case",
    path: "assets/models/loot/attache-case.glb",
    tier: "premium",
    reward: "hearts",
    rewardLabel: "+2 hearts",
  },
  {
    id: "backpack",
    path: "assets/models/loot/backpack.glb",
    tier: "base",
    reward: "money",
    rewardLabel: "+150 score",
  },
  {
    id: "flight-case",
    path: "assets/models/loot/flight-case.glb",
    tier: "objective",
    reward: "mixed",
    rewardLabel: "+500 score +3 hearts",
  },
];

type ViewerConfig = {
  readonly mode: ViewerMode;
  readonly spinAxis: SpinAxis;
  readonly items: readonly { id: string; url: string; tier: Tier; reward: RewardType; rewardLabel: string }[];
};

type LoadedModel = { scene: Group; size: Vector3; minY: number };

type BurstRequest = {
  readonly reward: RewardType;
  readonly x: number;
  readonly y: number;
  readonly z: number;
};

type ParticleState = {
  active: boolean;
  born: number;
  maxLife: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  spin: number;
  rot: number;
  size: number;
  tex: "money" | "heart";
};

const PARTICLE_POOL = 96;
const PARTICLES_PER_BURST = 18;
const LEVITATION_AMPLITUDE = 0.08;
const LEVITATION_SPEED = 1.4;
const HALO_INTENSITY_BOOST = 1.22;
const HALO_RAY_SCALE_MULTIPLIER = 0.7;
const VIEWER_FLOOR_Y = -0.02;
const BELLIARD_BACKDROP_Y = 5.45;

const BODY_LENGTH = 0.28;
const BODY_RADIUS = 0.06;
const CAP_RADIUS = 0.08;
const ENEMY_BULLET_COLOR = "#ff4444";
const ENEMY_BULLET_EMISSIVE = "#ff2222";
const ENEMY_BULLET_EMISSIVE_INTENSITY = 0.7;

let haloTexture: CanvasTexture | null = null;
let moneyTexture: CanvasTexture | null = null;
let heartTexture: CanvasTexture | null = null;

function createTokenTexture(symbol: "$" | "♥", fill: string, stroke: string): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  ctx.clearRect(0, 0, 96, 96);
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, 96, 96);
  ctx.font = "bold 64px 'IBM Plex Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 10;
  ctx.strokeStyle = stroke;
  ctx.strokeText(symbol, 48, 52);
  ctx.fillStyle = fill;
  ctx.fillText(symbol, 48, 52);
  return new CanvasTexture(canvas);
}

function getMoneyTexture(): CanvasTexture | null {
  if (moneyTexture !== null) return moneyTexture;
  moneyTexture = createTokenTexture("$", "#98ff6f", "#17360f");
  return moneyTexture;
}

function getHeartTexture(): CanvasTexture | null {
  if (heartTexture !== null) return heartTexture;
  heartTexture = createTokenTexture("♥", "#ff6f9f", "#3a1323");
  return heartTexture;
}

function getHaloTexture(): CanvasTexture | null {
  if (haloTexture !== null) return haloTexture;
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx === null) return null;
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.7)");
  grad.addColorStop(0.4, "rgba(150,255,90,0.35)");
  grad.addColorStop(1, "rgba(120,255,60,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  haloTexture = new CanvasTexture(canvas);
  return haloTexture;
}

function viewerConfigFromQuery(): ViewerConfig {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") === "loot-live" ? "loot-live" : "single";
  const axisRaw = params.get("axis");
  const spinAxis: SpinAxis = axisRaw === "x" || axisRaw === "z" ? axisRaw : "y";

  if (mode === "loot-live") {
    return {
      mode,
      spinAxis,
      items: LIVE_ITEMS.map((item) => ({
        ...item,
        url: `${import.meta.env.BASE_URL}${item.path}`,
      })),
    };
  }

  const raw = params.get("url");
  const path = raw?.trim() ?? DEFAULT_MODEL_PATH;
  return {
    mode,
    spinAxis,
    items: [
      {
        id: "single",
        url: `${import.meta.env.BASE_URL}${path}`,
        tier: "base",
        reward: "money",
        rewardLabel: "preview",
      },
    ],
  };
}

function OrbitRig({
  cameraPosition,
  target,
}: {
  cameraPosition: [number, number, number];
  target: [number, number, number];
}): null {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new OrbitControls(camera, gl.domElement), [camera, gl]);

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);
    controls.target.set(target[0], target[1], target[2]);
    controls.update();
    return () => {
      controls.dispose();
    };
  }, [camera, cameraPosition, controls, target]);

  useFrame(() => controls.update());
  return null;
}

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

function tierHalo(tier: Tier): { color: string; intensity: number; scale: number } {
  if (tier === "objective") return { color: "#8cff44", intensity: 1.45 * HALO_INTENSITY_BOOST, scale: 2.35 };
  if (tier === "premium") return { color: "#72ff4c", intensity: 1.15 * HALO_INTENSITY_BOOST, scale: 2.1 };
  return { color: "#5eff40", intensity: 0.9 * HALO_INTENSITY_BOOST, scale: 1.9 };
}

function RotatingModel({
  model,
  position,
  axis,
  yOffset,
  tier,
  onShoot,
  reward,
  phase,
}: {
  model: Group;
  position: [number, number, number];
  axis: SpinAxis;
  yOffset: number;
  tier: Tier;
  onShoot: (reward: RewardType, x: number, y: number, z: number) => void;
  reward: RewardType;
  phase: number;
}): JSX.Element {
  const ref = useRef<Group>(null);
  const haloRef = useRef<Mesh>(null);
  const rimMat = useMemo(() => createEnemyRimMaterial(), []);
  const haloCfg = useMemo(() => tierHalo(tier), [tier]);

  useEffect(() => {
    const tex = getHaloTexture();
    if (tex !== null) {
      rimMat.uniforms.uMap.value = tex;
    }
    rimMat.uniforms.uColor.value = new Color(haloCfg.color);
    rimMat.uniforms.uOpacity.value = 0.75;
    rimMat.uniforms.uIntensity.value = haloCfg.intensity;
    return () => {
      rimMat.material.dispose();
    };
  }, [haloCfg.color, haloCfg.intensity, rimMat]);

  useFrame((state, delta) => {
    if (ref.current === null) return;
    const step = delta * 0.7;
    if (axis === "x") ref.current.rotation.x += step;
    else if (axis === "z") ref.current.rotation.z += step;
    else ref.current.rotation.y += step;

    const hover = Math.sin(state.clock.elapsedTime * LEVITATION_SPEED + phase) * LEVITATION_AMPLITUDE;
    ref.current.position.set(position[0], yOffset + hover, position[2]);

    if (haloRef.current !== null) {
      const pulse = 0.88 + (Math.sin(state.clock.elapsedTime * 1.8 + phase) + 1) * 0.2;
      rimMat.uniforms.uIntensity.value = haloCfg.intensity * pulse;
      const s = haloCfg.scale * HALO_RAY_SCALE_MULTIPLIER * pulse;
      haloRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group
      ref={ref}
      onPointerDown={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        onShoot(reward, event.point.x, event.point.y, event.point.z);
      }}
    >
      <mesh ref={haloRef} position={[0, 0.35, -0.18]} renderOrder={7}>
        <planeGeometry args={[2.2, 2.2]} />
        <primitive object={rimMat.material} attach="material" />
      </mesh>
      <primitive object={model} />
    </group>
  );
}

function RewardParticles({ requests }: { requests: React.RefObject<BurstRequest[]> }): JSX.Element {
  const meshes = useRef<(Mesh | null)[]>(Array.from({ length: PARTICLE_POOL }, () => null));
  const particles = useRef<ParticleState[]>(
    Array.from({ length: PARTICLE_POOL }, () => ({
      active: false,
      born: 0,
      maxLife: 0,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      spin: 0,
      rot: 0,
      size: 0.25,
      tex: "money",
    })),
  );

  useFrame(() => {
    const now = performance.now();
    const queue = requests.current;
    while (queue !== null && queue.length > 0) {
      const req = queue.shift();
      if (req === undefined) break;
      for (let i = 0; i < PARTICLES_PER_BURST; i++) {
        const p = particles.current.find((x) => !x.active);
        if (p === undefined) break;
        p.active = true;
        p.born = now;
        p.maxLife = 520 + Math.random() * 360;
        p.x = req.x + (Math.random() - 0.5) * 0.4;
        p.y = req.y + 0.1 + Math.random() * 0.35;
        p.z = req.z + 0.1 + Math.random() * 0.25;
        p.vx = (Math.random() - 0.5) * 2.1;
        p.vy = 0.8 + Math.random() * 2.2;
        p.spin = (Math.random() - 0.5) * 7;
        p.rot = Math.random() * Math.PI * 2;
        p.size = 0.11 + Math.random() * 0.12;
        if (req.reward === "hearts") p.tex = "heart";
        else if (req.reward === "money") p.tex = "money";
        else p.tex = i % 2 === 0 ? "money" : "heart";
      }
    }

    particles.current.forEach((p, i) => {
      const mesh = meshes.current[i];
      if (mesh == null) return;
      if (!p.active) {
        mesh.visible = false;
        return;
      }
      const t = (now - p.born) / p.maxLife;
      if (t >= 1) {
        p.active = false;
        mesh.visible = false;
        return;
      }
      const mat = mesh.material as MeshBasicMaterial;
      const tex = p.tex === "heart" ? getHeartTexture() : getMoneyTexture();
      if (tex !== null && mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
      const drift = Math.max(0, 1 - t);
      // Quicker tail-off: less visual intensity near the end of lifetime.
      const fadeTail = drift * drift;
      mesh.visible = true;
      mesh.position.set(p.x + p.vx * t * 0.3, p.y + p.vy * t * 0.6 - t * t * 0.2, p.z);
      mesh.rotation.z = p.rot + p.spin * t;
      mesh.scale.setScalar(p.size * (0.82 + fadeTail * 0.85));
      mat.opacity = fadeTail * 0.82;
    });
  });

  return (
    <group>
      {particles.current.map((_, i) => (
        <mesh key={i} ref={(m) => (meshes.current[i] = m)} renderOrder={9}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            opacity={0}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({
  mode,
  status,
  items,
  models,
  axis,
  yOffsets,
  onShoot,
  burstRequests,
  cameraPosition,
  cameraTarget,
  showBelliardBackdrop,
  belliardTexture,
  belliardBackdropSize,
  belliardBackdropY,
}: {
  mode: ViewerMode;
  status: ModelStatus;
  items: readonly { tier: Tier; reward: RewardType }[];
  models: Group[];
  axis: SpinAxis;
  yOffsets: number[];
  onShoot: (reward: RewardType, x: number, y: number, z: number) => void;
  burstRequests: React.RefObject<BurstRequest[]>;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  showBelliardBackdrop: boolean;
  belliardTexture: Texture | null;
  belliardBackdropSize: { width: number; height: number };
  belliardBackdropY: number;
}): JSX.Element {
  const spacing = 2.9;
  const positions: [number, number, number][] =
    mode === "loot-live" ? [[-spacing, 0, 0], [0, 0, 0], [spacing, 0, 0]] : [[0, 0, 0]];

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 4, 5]} intensity={1.3} />
      <directionalLight position={[-3, -2, -4]} intensity={0.6} />
      <hemisphereLight args={["#ffffff", "#6a6a6a", 1.0]} />
      {showBelliardBackdrop && (
        <mesh position={[0, belliardBackdropY, -2.6]} renderOrder={0}>
          <planeGeometry args={[belliardBackdropSize.width, belliardBackdropSize.height]} />
          <meshBasicMaterial
            map={belliardTexture}
            color={belliardTexture === null ? "#232232" : "#ffffff"}
            transparent={belliardTexture !== null}
            depthWrite={false}
          />
        </mesh>
      )}
      <gridHelper args={[11, 30]} position={[0, VIEWER_FLOOR_Y, 0]} />
      <axesHelper args={[1.4]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, VIEWER_FLOOR_Y, 0]}>
        <planeGeometry args={[11, 11]} />
        <meshStandardMaterial color="#2d2d2d" roughness={0.95} metalness={0.05} />
      </mesh>
      {status !== "loaded" && <ProceduralFallback />}
      {models.map((model, index) => (
        <RotatingModel
          key={index}
          model={model}
          position={positions[index] ?? [0, 0, 0]}
          axis={axis}
          yOffset={yOffsets[index] ?? 0}
          tier={items[index]?.tier ?? "base"}
          reward={items[index]?.reward ?? "money"}
          onShoot={onShoot}
          phase={index * 1.73}
        />
      ))}
      <RewardParticles requests={burstRequests} />
      <OrbitRig cameraPosition={cameraPosition} target={cameraTarget} />
    </>
  );
}

export function ModelViewer(): JSX.Element {
  const config = useMemo(viewerConfigFromQuery, []);
  const [status, setStatus] = useState<ModelStatus>("idle");
  const [loaded, setLoaded] = useState<LoadedModel[]>([]);
  const [showBelliardBackdrop, setShowBelliardBackdrop] = useState(true);
  const [belliardTexture, setBelliardTexture] = useState<Texture | null>(null);
  const [belliardBackdropY, setBelliardBackdropY] = useState(BELLIARD_BACKDROP_Y);
  const belliardBackdropSize = useMemo(() => {
    const layout = getBackdropLayout("belliard");
    if (layout.mode === "single-wide") {
      const [tile] = layout.tiles;
      if (tile !== undefined) {
        return { width: tile.width, height: WORLD_HEIGHT };
      }
    }
    return { width: 22, height: 12 };
  }, []);
  const belliardIngameBackdropUrl = useMemo(() => {
    const layout = getBackdropLayout("belliard");
    if (layout.mode === "single-wide") {
      const [tile] = layout.tiles;
      if (tile !== undefined) {
        return `${import.meta.env.BASE_URL}assets/levels/belliard/${tile.file}.png`;
      }
    }
    return levelLayerUrl("belliard", "facade");
  }, []);
  const sizes = useMemo(() => loaded.map((item) => item.size), [loaded]);
  const yOffsets = useMemo(() => loaded.map((item) => -item.minY + 0.01), [loaded]);
  const models = useMemo(() => loaded.map((item) => item.scene.clone(true)), [loaded]);
  const burstRequests = useRef<BurstRequest[]>([]);

  const cameraConfig = useMemo(() => {
    if (config.mode !== "loot-live" || sizes.length === 0) {
      return {
        position: [1.2, 1, 1.2] as [number, number, number],
        target: [0, 0.45, 0] as [number, number, number],
        fov: 45,
      };
    }
    const maxX = Math.max(...sizes.map((s) => s.x));
    const maxY = Math.max(...sizes.map((s) => s.y));
    const maxZ = Math.max(...sizes.map((s) => s.z));
    const spanX = 2 * 2.9 + maxX;
    const z = Math.max(spanX * 2.0, maxZ * 5.2, 13.5);
    const y = Math.max(maxY * 1.22, 2.5);
    return {
      position: [0, y, z] as [number, number, number],
      target: [0, Math.max(maxY * 0.45, 0.8), 0] as [number, number, number],
      fov: 50,
    };
  }, [config.mode, sizes]);

  useEffect(() => {
    let cancelled = false;
    const loader = new GLTFLoader();
    setStatus("pending");
    setLoaded([]);

    Promise.all(
      config.items.map(
        (item) =>
          new Promise<Group>((resolve, reject) => {
            loader.load(item.url, (gltf) => resolve(gltf.scene), undefined, reject);
          }),
      ),
    )
      .then((scenes) => {
        if (cancelled) return;
        setLoaded(
          scenes.map((scene) => {
            const box = new Box3().setFromObject(scene);
            return {
              scene,
              size: box.getSize(new Vector3()),
              minY: box.min.y,
            };
          }),
        );
        setStatus("loaded");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("failed");
      });

    return () => {
      cancelled = true;
    };
  }, [config]);

  useEffect(() => {
    const loader = new TextureLoader();
    loader.load(
      belliardIngameBackdropUrl,
      (t) => setBelliardTexture(t),
      undefined,
      () => setBelliardTexture(null),
    );
  }, [belliardIngameBackdropUrl]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{
          position: cameraConfig.position,
          fov: cameraConfig.fov,
          near: 0.01,
          far: 240,
        }}
      >
        <color attach="background" args={["#1a1a1a"]} />
        <Scene
          mode={config.mode}
          status={status}
          items={config.items}
          models={models}
          axis={config.spinAxis}
          yOffsets={yOffsets}
          onShoot={(reward, x, y, z) => burstRequests.current.push({ reward, x, y, z })}
          burstRequests={burstRequests}
          cameraPosition={cameraConfig.position}
          cameraTarget={cameraConfig.target}
          showBelliardBackdrop={showBelliardBackdrop}
          belliardTexture={belliardTexture}
          belliardBackdropSize={belliardBackdropSize}
          belliardBackdropY={belliardBackdropY}
        />
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
          maxWidth: 620,
          pointerEvents: "none",
        }}
      >
        <div style={{ opacity: 0.95, pointerEvents: "auto" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showBelliardBackdrop}
              onChange={(e) => setShowBelliardBackdrop(e.target.checked)}
            />
            fond Belliard
          </label>
          <label style={{ display: "grid", gridTemplateColumns: "82px 1fr 44px", gap: 8, marginTop: 6 }}>
            <span>Y fond</span>
            <input
              type="range"
              min={-6}
              max={8}
              step={0.05}
              value={belliardBackdropY}
              onChange={(e) => setBelliardBackdropY(Number(e.target.value))}
            />
            <span>{belliardBackdropY.toFixed(2)}</span>
          </label>
        </div>
      </div>
    </div>
  );
}
