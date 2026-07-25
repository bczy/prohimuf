import { useEffect, useMemo, useRef } from "react";
import type { JSX } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture } from "three";
import type { Mesh, MeshBasicMaterial, Texture } from "three";
import type { GameState } from "@game/types/gameState";
import { isBossQteActive } from "@game/systems/bossQteSystem";
import { isQteActive } from "@game/systems/qteSystem";
import { createSmokeField } from "@render/scene/smokeParticles";
import { DEBRIS_KINDS, debrisY, makeDebris, stepDebris } from "./urbanDebris";
import type { DebrisItem } from "./urbanDebris";

/**
 * Ambient "mouvement urbain" layer: steam creeping out of the métro vents plus
 * papers and leaves blowing along the street. Pure décor — it drives nothing, is
 * never a target, and holds no rule; it only READS the game state to know when to
 * get out of the way.
 *
 * Suppression contract:
 *  - HIDDEN for the whole boss fight (`isBossQteActive`): the duel tableau owns
 *    the frame, and it runs its own smoke veil — ambient litter would fight it;
 *  - FROZEN (drawn, but not advanced) while paused or while the hostage QTE holds
 *    the scene, matching how `CourierSprite` and `useGameLoop` freeze the street:
 *    a cinematic hold with leaves still blowing through it reads as a bug;
 *  - FROZEN under the effective reduced-motion signal (ADR-0054 §3), which leaves
 *    a static, strobe-free arrangement rather than an empty street.
 *
 * Render band: everything here draws at {@link AMBIENT_RENDER_ORDER}, above the
 * backdrop panels (0..3) and below the enemies (4), the near-foreground props
 * (4/5), the courier (6) and the delivery van (7) — so no ambient pixel can ever
 * mask a target the player must hit or must not hit.
 */

/** Above the facade panels (0..3), strictly below every actor and target. */
const AMBIENT_RENDER_ORDER = 3.6;
const DEBRIS_Z = 0.42;
const VENT_Z = 0.4;

/** Debris population. Halved on mobile, like every other ambient density. */
const DEBRIS_COUNT_DESKTOP = 14;
const DEBRIS_COUNT_MOBILE = 7;

/**
 * Vent positions along the street, as fractions of the full width. Fixed and
 * deterministic: métro grates are level ART, and no vent entity exists in
 * `levelArt.json`, so placing them render-side (rather than inventing level data
 * in another lane's file) keeps the change inside this lane. See the summary.
 */
const VENT_XS: readonly number[] = [0.27, 0.71];
/** Vent line, facade-normalized and y-down: the pavement at the facade base. */
const VENT_LINE = 0.93;
/** Puffs per vent — a thin creeping wisp, not a fire. */
const VENT_PARTICLES_DESKTOP = 10;
const VENT_PARTICLES_MOBILE = 5;
/** Plume opacity envelope. Low: this is haze behind the action, never a curtain. */
const VENT_ENVELOPE = 0.45;

/** Debris baseline, facade-normalized and y-down: the road, in front of the base. */
const DEBRIS_LINE = 1.02;

// ── Silhouettes: B&W fanzine scraps, drawn once per session ──────────────────
// Toner-dark and unsaturated on purpose: the CRT bright-pass keys on saturation ×
// brightness, so a grey scrap can never trip the bloom and haze the street.
const debrisTextures: (Texture | null)[] = Array.from({ length: DEBRIS_KINDS }, () => null);
let debrisBuilt = false;

function buildDebrisTextures(): void {
  if (debrisBuilt || typeof document === "undefined") return;
  debrisBuilt = true;
  // 0 — crumpled paper scrap: an irregular quad with a fold line.
  const paper = document.createElement("canvas");
  paper.width = 32;
  paper.height = 32;
  const pg = paper.getContext("2d");
  if (pg !== null) {
    pg.fillStyle = "rgba(232,230,224,0.92)";
    pg.beginPath();
    pg.moveTo(4, 10);
    pg.lineTo(19, 3);
    pg.lineTo(29, 16);
    pg.lineTo(14, 29);
    pg.closePath();
    pg.fill();
    pg.strokeStyle = "rgba(40,40,44,0.75)";
    pg.lineWidth = 1.5;
    pg.stroke();
    pg.beginPath();
    pg.moveTo(8, 12);
    pg.lineTo(24, 20);
    pg.stroke();
    debrisTextures[0] = new CanvasTexture(paper);
  }
  // 1 — dead leaf: a pointed blade with a midrib.
  const leaf = document.createElement("canvas");
  leaf.width = 32;
  leaf.height = 32;
  const lg = leaf.getContext("2d");
  if (lg !== null) {
    lg.fillStyle = "rgba(58,52,44,0.92)";
    lg.beginPath();
    lg.moveTo(3, 16);
    lg.quadraticCurveTo(16, 2, 29, 16);
    lg.quadraticCurveTo(16, 30, 3, 16);
    lg.fill();
    lg.strokeStyle = "rgba(18,16,14,0.9)";
    lg.lineWidth = 1.2;
    lg.beginPath();
    lg.moveTo(4, 16);
    lg.lineTo(28, 16);
    lg.stroke();
    debrisTextures[1] = new CanvasTexture(leaf);
  }
}

interface Props {
  stateRef: React.RefObject<GameState>;
  /** Full street width in world units — the debris wrap boundary. */
  fullW: number;
  /** Facade height in world units — vent/debris lines are fractions of it. */
  facadeH: number;
  isMobile: boolean;
  paused: boolean;
  /** Effective reduced motion (ADR-0054 §3), threaded from App via GameScene. */
  reducedMotion: boolean;
}

export function UrbanMotion({
  stateRef,
  fullW,
  facadeH,
  isMobile,
  paused,
  reducedMotion,
}: Props): JSX.Element {
  buildDebrisTextures();

  const halfWidth = fullW / 2;
  const debrisCount = isMobile ? DEBRIS_COUNT_MOBILE : DEBRIS_COUNT_DESKTOP;
  const debrisBaseY = (0.5 - DEBRIS_LINE) * facadeH;
  const ventY = (0.5 - VENT_LINE) * facadeH;

  // Each item's parameters are drawn ONCE at mount (cosmetics — Math.random is
  // fine here, same licence as the boss smoke field), then only stepped.
  const items = useRef<DebrisItem[]>([]);
  if (items.current.length !== debrisCount) {
    items.current = Array.from({ length: debrisCount }, () =>
      makeDebris(Math.random, halfWidth, debrisBaseY),
    );
  }
  const meshes = useRef<(Mesh | null)[]>(Array.from({ length: debrisCount }, () => null));

  // One pooled plume per vent, reusing the boss veil's field (same drifting puff
  // model) but in the ambient render band so it can never mask a target.
  const ventParticles = isMobile ? VENT_PARTICLES_MOBILE : VENT_PARTICLES_DESKTOP;
  const vents = useMemo(
    () => VENT_XS.map(() => createSmokeField(ventParticles, AMBIENT_RENDER_ORDER)),
    [ventParticles],
  );
  useEffect(
    () => () => {
      for (const v of vents) v.dispose();
    },
    [vents],
  );

  useFrame((_state, delta) => {
    const bossFight = isBossQteActive(stateRef.current.bossQte);
    // Frozen, not hidden: the street keeps its arrangement through a hold.
    const frozen = paused || reducedMotion || isQteActive(stateRef.current.qte);
    const step = bossFight || frozen ? 0 : delta;

    for (let i = 0; i < items.current.length; i++) {
      const mesh = meshes.current[i];
      const item = items.current[i];
      if (mesh === null || mesh === undefined || item === undefined) continue;
      if (bossFight) {
        mesh.visible = false;
        continue;
      }
      const next = stepDebris(item, step, halfWidth);
      items.current[i] = next;
      const tex = debrisTextures[next.kind] ?? null;
      const mat = mesh.material as MeshBasicMaterial;
      if (tex !== null && mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
      mesh.visible = tex !== null;
      mesh.position.set(next.x, debrisY(next), DEBRIS_Z);
      mesh.rotation.z = next.rot;
      mesh.scale.set(next.size, next.size, 1);
    }

    for (let v = 0; v < vents.length; v++) {
      const field = vents[v];
      const frac = VENT_XS[v];
      if (field === undefined || frac === undefined) continue;
      field.update(step, {
        activeCount: ventParticles,
        // The field's own reduced-motion branch holds a static scatter; a boss
        // fight zeroes the envelope instead, which hides the group outright.
        reducedMotion: frozen,
        centreX: (frac - 0.5) * fullW,
        centreY: ventY,
        envelope: bossFight ? 0 : VENT_ENVELOPE,
      });
      field.group.position.z = VENT_Z;
    }
  });

  return (
    <>
      {vents.map((field, i) => (
        <primitive key={`vent-${String(i)}`} object={field.group} />
      ))}
      {Array.from({ length: debrisCount }, (_, i) => (
        <mesh
          key={`debris-${String(i)}`}
          ref={(m) => {
            meshes.current[i] = m;
          }}
          visible={false}
          renderOrder={AMBIENT_RENDER_ORDER}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
