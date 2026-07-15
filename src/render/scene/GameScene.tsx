import type { JSX } from "react";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import {
  computeSlotsFromZones,
  FACADE_ASPECT,
  getLevelPanelZones,
  PANELS,
  tilePanelZones,
  WORLD_HEIGHT,
} from "@game/levels/levelArt";
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

// Edge zones and speed (mouse-at-edge scrolling when the level is larger than the view)
const EDGE_ZONE = 0.12;
const SCROLL_SPEED = 6;
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

  // Each facade panel has its own art-derived window zones, so cops and railings
  // line up with that panel's real windows. The per-panel zones drive the
  // per-panel foreground; tiled together they place the enemy slots across the
  // whole wide street.
  const panelZones = useMemo(() => getLevelPanelZones(levelId), [levelId]);
  const mergedFacade = useMemo(() => {
    const slots = computeSlotsFromZones(tilePanelZones(panelZones), fullW, facadeH);
    return { width: slots.length, height: 1, slots };
  }, [panelZones, fullW, facadeH]);

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

    let scrollX = 0;
    if (mouseX < EDGE_ZONE) scrollX = -1;
    else if (mouseX > 1 - EDGE_ZONE) scrollX = 1;
    if (scrollX !== 0 && rangeX > 0) {
      camera.position.x = Math.max(
        -rangeX,
        Math.min(rangeX, camera.position.x + scrollX * SCROLL_SPEED * delta),
      );
    }

    let scrollY = 0;
    if (mouseY < EDGE_ZONE) scrollY = 1;
    else if (mouseY > 1 - EDGE_ZONE) scrollY = -1;
    if (scrollY !== 0 && rangeY > 0) {
      camera.position.y = Math.max(
        -rangeY,
        Math.min(rangeY, camera.position.y + scrollY * SCROLL_SPEED * delta),
      );
    }
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
        />
      ))}
      {panelZones.map((zones, p) => (
        <group key={`fg-${String(p)}`} position={[(p - (PANELS - 1) / 2) * panelW, 0, 0]}>
          <ForegroundFrames zones={zones} facadeW={panelW} facadeH={facadeH} />
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
