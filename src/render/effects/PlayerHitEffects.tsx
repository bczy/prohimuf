import { useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { Mesh, MeshBasicMaterial } from "three";
import type { PlayerHitChannel } from "@hooks/useGameLoop";

// ADR-0064 D4 — Player-hit render feedback: full-screen red flash + a decaying
// translational camera shake. Categorical, unmissable "I've been hit" cue that
// stands independent from the HUD lives counter. Cosmetic-only; the `lives`
// rule stays in stateMachine.ts. Mirror of ImpactEffects (enemy → player).
//
// Two effects, both keyed off the drained PlayerHitEvent queue:
//   - A wide plane in front of the ortho camera, additive red, opacity fades
//     0.55 → 0 over FLASH_MS. Colour cue = "hit".
//   - The default camera's position is nudged by a decaying random offset
//     over SHAKE_MS. Motion cue = "hit". Skipped when reducedMotion is set —
//     accessibility. The red flash stays regardless (colour, not motion).

const FLASH_MS = 150;
const FLASH_PEAK_OPACITY = 0.55;
const FLASH_COLOR = "#ff2020";

const SHAKE_MS = 200;
const SHAKE_AMPLITUDE = 0.15; // world units

// Pool of 6 flashes covers rapid-fire safety (multiple bullets same tick).
const FLASH_POOL = 6;

// Render order: sit above the impact FX layer (which caps around 8.1) and
// above the HUD-adjacent overlays but below the crosshair (16384).
const FLASH_RENDER_ORDER = 100;

// Plane sized generously so it covers the ortho viewport at any zoom we ship.
// The ortho camera's frustum is at most a few dozen world units wide.
const FLASH_QUAD_SIZE = 200;

interface FlashSlot {
  active: boolean;
  startedAt: number;
}

interface ShakeState {
  startedAt: number;
  ox: number;
  oy: number;
}

interface Props {
  channelRef: React.RefObject<PlayerHitChannel>;
  reducedMotion?: boolean;
}

export function PlayerHitEffects({ channelRef, reducedMotion = false }: Props): JSX.Element {
  const meshRefs = useRef<(Mesh | null)[]>(Array.from({ length: FLASH_POOL }, () => null));
  const flashes = useRef<FlashSlot[]>(
    Array.from({ length: FLASH_POOL }, () => ({ active: false, startedAt: 0 })),
  );
  const shake = useRef<ShakeState | null>(null);
  const lastNonce = useRef(0);
  const { camera } = useThree();
  // Track camera's undisturbed position so we can restore between shakes.
  // Updated whenever we're not actively shaking, so parallax/zoom changes
  // elsewhere are honoured. Seeded at 0 on mount — the first frame overwrites
  // it from the live camera before any shake can start.
  const restX = useRef(0);
  const restY = useRef(0);

  useFrame(() => {
    const now = performance.now();
    const channel = channelRef.current;

    // Level restart: same reset contract as ImpactChannel.
    if (channel.resetNonce !== lastNonce.current) {
      lastNonce.current = channel.resetNonce;
      channel.queue.length = 0;
      for (const f of flashes.current) f.active = false;
      shake.current = null;
    }

    // Capture rest pose whenever we're not actively shaking, so parallax/pan
    // changes elsewhere are honoured. During a shake we keep the previously
    // captured pose as the reference.
    if (shake.current === null) {
      restX.current = camera.position.x;
      restY.current = camera.position.y;
    }

    // Drain the per-frame queue. The event's worldPoint is unused — the flash
    // and shake are whole-screen effects (no positional anchor needed).
    // Presence alone triggers a new instance.
    const drained = channel.queue.splice(0);
    for (const _ev of drained) {
      void _ev;
      // Allocate one pooled flash.
      const slot = flashes.current.find((s) => !s.active);
      if (slot !== undefined) {
        slot.active = true;
        slot.startedAt = now;
      }
      // (Re)start the shake — random 2D unit vector × amplitude, decay from now.
      if (!reducedMotion) {
        const theta = Math.random() * Math.PI * 2;
        shake.current = {
          startedAt: now,
          ox: Math.cos(theta) * SHAKE_AMPLITUDE,
          oy: Math.sin(theta) * SHAKE_AMPLITUDE,
        };
      }
    }

    // Update flash meshes.
    for (let i = 0; i < FLASH_POOL; i++) {
      const slot = flashes.current[i];
      if (slot === undefined) continue;
      const mesh = meshRefs.current[i] ?? null;
      if (mesh === null) continue;
      if (!slot.active) {
        mesh.visible = false;
        continue;
      }
      const t = (now - slot.startedAt) / FLASH_MS;
      if (t >= 1) {
        slot.active = false;
        mesh.visible = false;
        continue;
      }
      const mat = mesh.material as MeshBasicMaterial;
      mat.opacity = FLASH_PEAK_OPACITY * (1 - t);
      // Follow the camera so the plane always covers the viewport, even after
      // pan/parallax. Ortho camera → constant z offset in front is enough.
      mesh.position.x = camera.position.x;
      mesh.position.y = camera.position.y;
      mesh.position.z = camera.position.z - 1; // in front of the camera
      mesh.visible = true;
    }

    // Update shake — decaying triangle envelope, terminate when done.
    if (shake.current !== null && !reducedMotion) {
      const s = shake.current;
      const t = (now - s.startedAt) / SHAKE_MS;
      if (t >= 1) {
        // Restore rest pose exactly and clear the shake.
        camera.position.x = restX.current;
        camera.position.y = restY.current;
        shake.current = null;
      } else {
        const decay = 1 - t;
        // Zig-zag sign per frame so the shake reads jittery, not drifty.
        const sign = Math.floor(t * 12) % 2 === 0 ? 1 : -1;
        camera.position.x = restX.current + s.ox * decay * sign;
        camera.position.y = restY.current + s.oy * decay * sign;
      }
    }
  });

  return (
    <>
      {Array.from({ length: FLASH_POOL }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshRefs.current[i] = el;
          }}
          visible={false}
          renderOrder={FLASH_RENDER_ORDER}
        >
          <planeGeometry args={[FLASH_QUAD_SIZE, FLASH_QUAD_SIZE]} />
          <meshBasicMaterial
            color={FLASH_COLOR}
            transparent
            depthWrite={false}
            depthTest={false}
            opacity={0}
          />
        </mesh>
      ))}
    </>
  );
}
