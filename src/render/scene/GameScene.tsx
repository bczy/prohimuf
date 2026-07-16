import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import {
  computeSlotsFromZones,
  FACADE_ASPECT,
  getIronworkStyle,
  getLevelPanelZones,
  PANELS,
  tilePanelZones,
  WORLD_HEIGHT,
} from "@game/levels/levelArt";
import type { WindowZone } from "@game/levels/levelArt";
import { ARCHETYPES } from "@game/types/enemyTypes";
import type { HudData, HudDelivery } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import { LEVELS } from "@game/levels/levels";
import { LevelBackdrop } from "./LevelBackdrop";
import { ForegroundFrames } from "./ForegroundFrames";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite } from "./EnemySprite";
import { CourierSprite } from "./CourierSprite";
import { DeliveryVehicleSprite } from "./DeliveryVehicleSprite";
import { BulletSprite } from "./BulletSprite";
import { FeedbackLayer } from "./FeedbackLayer";
import type { Floater } from "./FeedbackLayer";
import { ImpactEffects } from "@render/effects/ImpactEffects";
import type { ImpactChannel } from "@hooks/useGameLoop";
import { useMouse } from "@hooks/useMouse";
import { useTouchControls } from "@hooks/useTouchControls";
import { createCameraPan, driveEdgeScroll, edgeScrollRamp } from "@game/systems/cameraPanSystem";
import type { CameraPan } from "@game/types/cameraPan";

/**
 * Dev-only window-alignment harness surface (driven by scripts/, a separate
 * lane; NEVER set in production — same precedent as window.__MUF_FREEZE_COPS__
 * in useGameLoop). The harness boots belliard headless, pushes candidate window
 * zones, and reads back where each enemy sprite renders to check the invariant
 * "sprite plane box ⊆ window opening".
 */
interface HarnessWindow extends Window {
  /** Per-panel WindowZone arrays that override the level's own zones. */
  __MUF_ZONES__?: readonly (readonly WindowZone[])[];
  /** Force the scene to re-read __MUF_ZONES__ without a full remount. */
  __MUF_APPLY_ZONES__?: () => void;
  /**
   * Each current slot's rendered sprite box, in PER-PANEL facade-normalized
   * coords: x,y = box CENTRE, w,h = box SIZE, all 0..1 within one panel — the
   * exact coordinate space of a WindowZone, so the harness can test containment.
   */
  __MUF_SLOT_RECTS__?: () => {
    panel: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

// Widest sprite aspect across all archetypes. The harness box reports this
// conservative worst case (if the widest occupant fits the opening, every kind
// fits); __MUF_FREEZE_COPS__ cycles every kind — incl. the wide civilian —
// through the windows.
const WIDEST_ASPECT = Math.max(...Object.values(ARCHETYPES).map((a) => a.aspect));

// Edge zones and speed (mouse-at-edge scrolling when the level is larger than the view)
const EDGE_ZONE = 0.12;
// Max speed reached at the very screen edge. The edge scroll now ramps linearly
// across the zone (0 at the inner boundary → full at the edge), so the zone's
// midpoint scrolls at 4 — matching the old constant 6 felt slow at the edge and
// too abrupt at the boundary; 8-at-the-edge / 4-at-mid restores that average feel
// while adding progressive control and an inertial glide on exit.
const EDGE_SCROLL_MAX_SPEED = 8;
// Mobile zooms in past the desktop cover framing so targets stay finger-sized;
// the swipe pan (ADR-0003) reaches the overflow this creates.
const MOBILE_ZOOM_FACTOR = 1.7;

interface Props {
  onHudUpdate: (data: HudData) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  playSfx: (name: "shoot" | "hit" | "death" | "win") => void;
  levelParams?: LevelParams;
  levelId?: string;
  paused?: boolean;
  /** Surfaces delivery HUD state (phase + integrity) to the DOM HUD. */
  onDelivery?: (delivery: HudDelivery) => void;
  /** Mobile mode (ADR-0003): touch controls + stronger zoom; replaces edge-scroll. */
  isMobile?: boolean;
}

export function GameScene({
  onHudUpdate,
  canvasRef,
  playSfx,
  levelParams,
  levelId,
  paused,
  onDelivery,
  isMobile = false,
}: Props): JSX.Element {
  // The level is an image now: size the playfield from the facade art's native
  // aspect ratio, and place enemy windows from the level's hand-authored zones.
  const facadeH = WORLD_HEIGHT;
  const panelW = WORLD_HEIGHT * FACADE_ASPECT;
  const fullW = panelW * PANELS;

  // Dev harness override for the level's window zones (never set in production).
  // The harness pushes candidate zones into window.__MUF_ZONES__ then calls
  // window.__MUF_APPLY_ZONES__() (registered below) to fold them into state so
  // the scene re-derives its slots live, no remount required.
  const [zoneOverride, setZoneOverride] = useState<readonly (readonly WindowZone[])[] | null>(null);

  // Each facade panel has its own art-derived window zones, so cops and railings
  // line up with that panel's real windows. The per-panel zones drive the
  // per-panel foreground; tiled together they place the enemy slots across the
  // whole wide street.
  const panelZones = useMemo(
    () => zoneOverride ?? getLevelPanelZones(levelId),
    [zoneOverride, levelId],
  );
  // Code-drawn foreground style matched to the level's architecture.
  const ironworkStyle = useMemo(() => getIronworkStyle(levelId), [levelId]);
  const mergedFacade = useMemo(() => {
    const slots = computeSlotsFromZones(tilePanelZones(panelZones), fullW, facadeH);
    return { width: slots.length, height: 1, slots };
  }, [panelZones, fullW, facadeH]);

  // Register the harness apply hook: read the current __MUF_ZONES__ global into
  // React state (bumping a render). Also picks up zones set BEFORE mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as HarnessWindow;
    const apply = (): void => {
      setZoneOverride(w.__MUF_ZONES__ ?? null);
    };
    w.__MUF_APPLY_ZONES__ = apply;
    apply();
    return () => {
      if (w.__MUF_APPLY_ZONES__ === apply) delete w.__MUF_APPLY_ZONES__;
    };
  }, []);

  // Register the harness slot-rects reader. For each current slot it reports the
  // enemy sprite's rendered plane box in PER-PANEL facade-normalized coords,
  // mirroring EnemySprite's world layout:
  //   planeH    = size.y * 0.8            (window-height plane, grid-only ⇒ 1.3)
  //   planeW    = planeH * WIDEST_ASPECT  (square plane scaled on X)
  //   centreX   = slot.screenPosition.x   (mesh.position.x)
  //   centreY   = slot.screenPosition.y - planeH * 0.28  (bodyY: feet at sill)
  // World → global-normalized (inverse of computeSlotsFromZones):
  //   globalXNorm = centreX / fullW + 0.5          (x∈[-fullW/2,fullW/2], x-right)
  //   yNorm       = 0.5 - centreY / facadeH        (facade y is top-down)
  // Then split the global x into panel + local (panels tile horizontally only):
  //   panel  = floor(globalXNorm * PANELS)
  //   localX = globalXNorm * PANELS - panel
  //   w(local) = planeW / panelW  (global-norm width × PANELS; y/h unaffected)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as HarnessWindow;
    const panelW = fullW / PANELS;
    const reader = (): { panel: number; x: number; y: number; w: number; h: number }[] =>
      mergedFacade.slots.map((slot) => {
        const planeH = slot.size !== undefined ? slot.size.y * 0.8 : 1.3;
        const planeW = planeH * WIDEST_ASPECT;
        const bodyY = slot.screenPosition.y - planeH * 0.28;
        const globalXNorm = slot.screenPosition.x / fullW + 0.5;
        const panel = Math.floor(globalXNorm * PANELS);
        return {
          panel,
          x: globalXNorm * PANELS - panel,
          y: 0.5 - bodyY / facadeH,
          w: planeW / panelW,
          h: planeH / facadeH,
        };
      });
    w.__MUF_SLOT_RECTS__ = reader;
    return () => {
      if (w.__MUF_SLOT_RECTS__ === reader) delete w.__MUF_SLOT_RECTS__;
    };
  }, [mergedFacade, fullW, facadeH]);

  // Couriers ride the road below the windows, across the whole wide street.
  const courierField = useMemo(
    () => ({ halfWidth: fullW / 2, streetY: -facadeH * 0.4 }),
    [fullW, facadeH],
  );

  // Per-level roster gate (ADR-0004): drives the window pool + street spawns.
  // Absent ⇒ legacy behaviour (stalingrad / vitry carry no roster).
  const roster = useMemo(() => LEVELS.find((l) => l.id === levelId)?.roster, [levelId]);

  const feedbackRef = useRef<Floater[]>([]);
  const impactChannelRef = useRef<ImpactChannel>({ queue: [], resetNonce: 0 });
  const { camera, size } = useThree();

  // Cover framing: fill the wider axis with ONE panel, letting the other
  // overflow a little. Mobile zooms in further (bigger, finger-sized targets)
  // and this is the *max* zoom — the pinch gesture backs out from here.
  const baseZoom =
    Math.max(size.width / panelW, size.height / facadeH) * (isMobile ? MOBILE_ZOOM_FACTOR : 1);

  const touchRef = useTouchControls(canvasRef, isMobile);
  const stateRef = useGameLoop(
    mergedFacade,
    canvasRef,
    onHudUpdate,
    playSfx,
    levelParams,
    paused,
    feedbackRef,
    courierField,
    roster,
    isMobile
      ? { touchRef, halfWorldWidth: fullW / 2, halfWorldHeight: facadeH / 2, baseZoom }
      : undefined,
    impactChannelRef,
  );
  const mouseRef = useMouse(canvasRef);
  // Desktop edge-scroll pan carried across frames so the camera can glide to rest
  // (inertial exit) after the pointer leaves the edge zone.
  const panRef = useRef<CameraPan>(createCameraPan());

  // Frame the facade to *cover* the viewport (no background bars on the sides).
  // On mobile the loop re-applies zoom each frame (base × pinch fraction); this
  // sets the initial framing and drives the desktop static zoom. Centred at origin.
  useEffect(() => {
    const ortho = camera as OrthographicCamera;
    ortho.zoom = baseZoom;
    ortho.position.set(0, 0, 100);
    ortho.updateProjectionMatrix();
  }, [camera, baseZoom]);

  useFrame((_state, delta) => {
    // On mobile the camera is driven by the inertial swipe pan in useGameLoop.
    if (isMobile) return;
    const { x: mouseX, y: mouseY } = mouseRef.current;
    const ortho = camera as OrthographicCamera;

    const viewW = size.width / ortho.zoom;
    const viewH = size.height / ortho.zoom;
    const rangeX = Math.max(0, (fullW - viewW) / 2);
    const rangeY = Math.max(0, (facadeH - viewH) / 2);

    // Screen y grows down, world y grows up — negate the y ramp to keep the old
    // sign convention (pointer at top scrolls the camera up).
    const ramp = { x: edgeScrollRamp(mouseX, EDGE_ZONE), y: -edgeScrollRamp(mouseY, EDGE_ZONE) };
    panRef.current = driveEdgeScroll(panRef.current, ramp, EDGE_SCROLL_MAX_SPEED, delta, {
      x: rangeX,
      y: rangeY,
    });
    camera.position.x = panRef.current.x;
    camera.position.y = panRef.current.y;
  });

  return (
    <>
      <LevelBackdrop levelId={levelId} panelW={panelW} facadeH={facadeH} panels={PANELS} />
      {mergedFacade.slots.map((slot, idx) => (
        <EnemySprite
          key={`slot-${String(idx)}`}
          stateRef={stateRef}
          slotIndex={idx}
          screenPosition={slot.screenPosition}
          size={slot.size}
          baseZoom={baseZoom}
        />
      ))}
      {panelZones.map((zones, p) => (
        <group key={`fg-${String(p)}`} position={[(p - (PANELS - 1) / 2) * panelW, 0, 0]}>
          <ForegroundFrames
            zones={zones}
            facadeW={panelW}
            facadeH={facadeH}
            style={ironworkStyle}
          />
        </group>
      ))}
      <CourierSprite stateRef={stateRef} paused={paused} />
      <DeliveryVehicleSprite stateRef={stateRef} onHudChange={onDelivery} />
      <BulletSprite stateRef={stateRef} />
      <ImpactEffects channelRef={impactChannelRef} />
      <FeedbackLayer queueRef={feedbackRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} />
    </>
  );
}
