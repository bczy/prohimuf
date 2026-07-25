import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion, Vector3, type Group } from "three";
import type { GameState } from "@game/types/gameState";
import { bulletModelPath } from "@game/systems/assetManifest";
import { warmBulletModel, getBulletModel } from "./bulletModel";
import { ProceduralBullet } from "./ProceduralBullet";
import {
  bulletForwardAxis,
  attachBulletModel,
  BULLET_DEPTH_RATIO,
  BULLET_Z,
} from "./bulletGeometry";

const MAX_BULLETS = 20;

// Renders enemy return fire only. Player shots are instant hitscan (ADR-0040)
// and never enter state.bullets, so every bullet here is an enemy projectile.
//
// The bullet is a 3D projectile — a small cylinder body with a sphere cap —
// oriented per frame from its velocity so the body always points along its
// actual flight direction (not just a flat, direction-less disc). The group's
// uniform scale still grows as the bullet closes on the camera (depth cue).
//
// ADR-0064: this code-drawn mesh is the GUARANTEED fallback. `bulletModel.ts`
// async-loads a generated textured GLB (public/assets/models/bullet.glb); once it
// resolves, each slot swaps its visible child from the procedural group to a
// clone of the loaded model the next time useFrame revisits it (at most once
// per slot — see `modelAttached`). A missing/404 GLB keeps the procedural mesh
// forever, so this fallback path is exercised on every build until the asset
// is generated in CI.

const ENEMY_BULLET_COLOR = "#ff4444";
const ENEMY_BULLET_EMISSIVE = "#ff2222";
const ENEMY_BULLET_EMISSIVE_INTENSITY = 0.7;

// The cylinderGeometry's principal axis in Three is +Y; FORWARD is the local axis
// we rotate FROM — per frame we compute the quaternion mapping it onto the
// bullet's velocity direction. See bulletGeometry.ts (shared with the player's
// own visual shot in ImpactEffects.tsx).
const FORWARD = bulletForwardAxis();

const DEPTH_RATIO = BULLET_DEPTH_RATIO;

// Distance-to-scale ramp — under an ORTHOGRAPHIC camera this is the only depth
// cue there is (no perspective foreshortening), so it carries the whole
// "incoming round" read on its own. A bullet spawns roughly SCALE_FAR_DIST world
// units away and lands on the camera, so `dist` is remapped to [0, 1] over that
// span and drives the scale from SCALE_MIN (just fired) to SCALE_MIN+SCALE_SPAN
// (about to hit).
//
// The impact end is large because the round is seen NOSE-ON: what reaches the
// player is the bullet's cross-section (0.463 × MODEL_SCALE ≈ 0.088 world units,
// a mere ~4px at zoom 50), not its 0.36-long silhouette. Roughly 4× more scale is
// therefore needed than a broadside presentation would want — ×16 puts a ~70px
// ogive dead centre of the screen.
//
// The ramp is QUADRATIC: linear growth reads as a sprite calmly sliding across
// the facade, whereas t² holds the round small for most of its flight then blows
// it up over the last couple of metres, which is what sells "it's about to hit
// me".
const SCALE_FAR_DIST = 8;
const SCALE_MIN = 1.4;
const SCALE_SPAN = 14.6;

interface Props {
  stateRef: React.RefObject<GameState>;
}

export function BulletSprite({ stateRef }: Props): JSX.Element {
  const groupRefs = useRef<(Group | null)[]>(Array.from({ length: MAX_BULLETS }, () => null));
  // The procedural (cylinder+cap) mesh's own wrapper group per slot, so it can be
  // hidden once a slot swaps to the generated-model clone without touching the
  // outer group's position/rotation/scale (still driven every frame below).
  const proceduralRefs = useRef<(Group | null)[]>(Array.from({ length: MAX_BULLETS }, () => null));
  // Whether a slot has already swapped in a generated-model clone — checked once
  // per frame per slot so cloning is attempted at most once per slot ever.
  const modelAttached = useRef<boolean[]>(Array.from({ length: MAX_BULLETS }, () => false));
  const camera = useThree((state) => state.camera);
  // Scratch objects allocated once — hot path runs 60fps × MAX_BULLETS.
  const scratch = useMemo(
    () => ({
      dir: new Vector3(),
      quat: new Quaternion(),
    }),
    [],
  );

  // Kick off the (at most once, ADR-0064) async GLB load. Never throws; a
  // missing/404 model just leaves every slot on its procedural fallback.
  useEffect(() => {
    void warmBulletModel(`${import.meta.env.BASE_URL}${bulletModelPath()}`);
  }, []);

  useFrame(() => {
    const bullets = stateRef.current.bullets;
    const model = getBulletModel();
    for (let i = 0; i < MAX_BULLETS; i++) {
      const group = groupRefs.current[i] ?? null;
      if (group === null) continue;
      const bullet = bullets[i];
      if (bullet === undefined) {
        group.visible = false;
        continue;
      }
      group.visible = true;

      // Swap in the generated model the first frame it's available for this
      // slot (see bulletGeometry.ts for the calibration). The clone becomes a plain
      // child of `group`, so it inherits the same per-frame position/
      // orientation/scale driven below — no separate transform logic needed.
      if (model !== null && !modelAttached.current[i]) {
        modelAttached.current[i] = true;
        attachBulletModel(group, model);
        const procedural = proceduralRefs.current[i] ?? null;
        if (procedural !== null) procedural.visible = false;
      }

      group.position.x = bullet.position.x;
      group.position.y = bullet.position.y;
      group.position.z = BULLET_Z;

      // Orient the round along its own fixed 3D travel direction, so it is seen
      // nose-on (red ogive toward the player). Derived ONLY from the bullet's
      // velocity — which `tickBullets` never re-steers — so the orientation is
      // locked at spawn: it does not swivel during the flight, and panning the
      // camera does not re-aim a round already in the air. (Deriving it from the
      // live camera position, as an earlier revision did, made bullets visibly
      // rotate mid-flight and contradicted their actual trajectory.)
      // `setFromUnitVectors` handles the zero-velocity degenerate case.
      const vx = bullet.velocity.x;
      const vy = bullet.velocity.y;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > 0) {
        const vz = speed * DEPTH_RATIO;
        const len = Math.sqrt(vx * vx + vy * vy + vz * vz);
        scratch.dir.set(vx / len, vy / len, vz / len);
        scratch.quat.setFromUnitVectors(FORWARD, scratch.dir);
        group.quaternion.copy(scratch.quat);
      }

      // Scale grows as bullet travels toward camera for 3D depth feel.
      const dx = bullet.position.x - camera.position.x;
      const dy = bullet.position.y - camera.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.max(0, Math.min(1, 1 - dist / SCALE_FAR_DIST));
      group.scale.setScalar(SCALE_MIN + t * t * SCALE_SPAN);
    }
  });

  return (
    <>
      {Array.from({ length: MAX_BULLETS }, (_, i) => (
        <group
          key={i}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
          visible={false}
        >
          {/* Procedural fallback (ADR-0064): hidden, not unmounted, once a slot
              swaps to the generated-model clone — see modelAttached above. */}
          <group
            ref={(el) => {
              proceduralRefs.current[i] = el;
            }}
          >
            <ProceduralBullet
              color={ENEMY_BULLET_COLOR}
              emissive={ENEMY_BULLET_EMISSIVE}
              emissiveIntensity={ENEMY_BULLET_EMISSIVE_INTENSITY}
            />
          </group>
        </group>
      ))}
    </>
  );
}
