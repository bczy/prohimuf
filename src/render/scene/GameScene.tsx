import type { JSX } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { OrthographicCamera } from "three";
import { useGameLoop } from "@hooks/useGameLoop";
import {
  FACADE_ASPECT,
  getBackdropLayout,
  getIronworkSillOffset,
  getIronworkStyle,
  PANELS,
  WORLD_HEIGHT,
} from "@game/levels/levelArt";
import type { WindowSlot } from "@game/types/map";
import type { WindowZone } from "@game/levels/levelArt";
import { GENERATED_PLANS } from "@game/levels/generated";
import { CORE_ARCHETYPES } from "@game/types/enemyTypes";
import type { HudData, HudDelivery, HudHostageQte, HudBossQte } from "@render/ui/HUD";
import type { LevelParams } from "@game/systems/stateMachine";
import { isQteActive } from "@game/systems/qteSystem";
import { isBossQteActive } from "@game/systems/bossQteSystem";
import { ALL_LEVELS } from "@game/levels/levels";
import { LevelBackdrop } from "./LevelBackdrop";
import { ForegroundFrames } from "./ForegroundFrames";
import { WindowGrilles } from "./WindowGrilles";
import { NearForeground } from "./NearForeground";
import { facadeDrawScale, stretchAboutCentre } from "./facadeLayout";
import { CrosshairSprite } from "./CrosshairSprite";
import { EnemySprite, ENEMY_PLANE_SCALE, ENEMY_BODY_LIFT } from "./EnemySprite";
import { LootCrate } from "./LootCrate";
import { CourierSprite } from "./CourierSprite";
import { HostageQteSprite } from "./HostageQteSprite";
import { BossQteSprite } from "./BossQteSprite";
import { DeliveryVehicleSprite } from "./DeliveryVehicleSprite";
import { BulletSprite } from "./BulletSprite";
import { FeedbackLayer } from "./FeedbackLayer";
import type { Floater } from "./FeedbackLayer";
import { ImpactEffects } from "@render/effects/ImpactEffects";
import { PlayerHitEffects } from "@render/effects/PlayerHitEffects";
import { UrbanMotion } from "@render/effects/UrbanMotion";
import { CrtPass } from "@render/effects/CrtPass";
import type { ImpactChannel, PlayerHitChannel } from "@hooks/useGameLoop";
import { useMouse } from "@hooks/useMouse";
import { useTouchControls } from "@hooks/useTouchControls";
import { createCameraPan, driveEdgeScroll, edgeScrollRamp } from "@game/systems/cameraPanSystem";
import type { CameraPan } from "@game/types/cameraPan";

/**
 * Dev-only window-alignment harness surface (driven by scripts/, a separate
 * lane; NEVER set in production — same precedent as window.__MUF_FREEZE_COPS__
 * in useGameLoop). The harness boots belliard headless, pushes candidate window
 * zones, and reads back where each enemy sprite renders to check the invariant
 * "sprite feet seated at the sill" (the ENEMY_PLANE_SCALE plane deliberately
 * overshoots the opening's top and sides — see align-windows.mjs).
 */
interface HarnessWindow extends Window {
  /** Per-panel WindowZone arrays that override the level's own zones. */
  __MUF_ZONES__?: readonly (readonly WindowZone[])[];
  /** Force the scene to re-read __MUF_ZONES__ without a full remount. */
  __MUF_APPLY_ZONES__?: () => void;
  /**
   * When truthy, the scene skips the foreground railing overlays entirely so a
   * screenshot shows the bare composited facade — the screen-space window
   * detector's source of truth. Reactive via __MUF_APPLY_RAILING_VIS__.
   */
  __MUF_HIDE_RAILINGS__?: boolean;
  /** Force the scene to re-read __MUF_HIDE_RAILINGS__ without a full remount. */
  __MUF_APPLY_RAILING_VIS__?: () => void;
  /**
   * Each current slot's rendered sprite box, in PER-PANEL facade-normalized
   * coords: x,y = box CENTRE, w,h = box SIZE, all 0..1 within one panel — the
   * exact coordinate space of a WindowZone, so the harness can test the feet
   * seating (and calibrate its h→size / y→placement mapping).
   */
  __MUF_SLOT_RECTS__?: () => {
    panel: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
  /**
   * Project an art-normalized per-panel facade point to CSS pixels through the
   * PRODUCTION render path (facade stretch + live camera), so the scripts/
   * SCREEN pass can gate on-screen alignment. Inputs: `panel` index, local
   * `x ∈ [0,1]` (left→right within the panel) and `y ∈ [0,1]` (top→bottom,
   * y-down). Output: `{ sx, sy }` in CSS pixels from the canvas top-left.
   */
  __MUF_PROJECT__?: (panel: number, x: number, y: number) => { sx: number; sy: number };
}

// Widest sprite aspect across all archetypes — core AND level-authored (a
// generated level may declare an archetype wider than any core kind, and the
// harness box must keep reporting the true worst case: if the widest occupant
// fits the opening, every kind fits). __MUF_FREEZE_COPS__ cycles every window
// kind through the windows (civilian excluded since its window art was
// retired — ADR-0029).
const WIDEST_ASPECT = Math.max(
  ...Object.values(CORE_ARCHETYPES).map((a) => a.aspect),
  ...GENERATED_PLANS.flatMap((p) => p.archetypes.map((a) => a.aspect)),
);

// Edge zones and speed (mouse-at-edge scrolling when the level is larger than the view)
const EDGE_ZONE = 0.12;
// Max speed reached at the very screen edge. The edge scroll ramps linearly
// across the zone (0 at the inner boundary → full at the edge): slower than the
// old constant 6 in the inner half, faster at the edge — traded for progressive
// control and the inertial glide on exit. Tuning value for the designer playtest.
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
  /** Surfaces hostage-taker QTE HUD state (gauges + warning) to the DOM HUD. */
  onHostageQte?: (qte: HudHostageQte | null) => void;
  /** Surfaces boss-QTE HUD state (the "le Commandant" HP bar) to the DOM HUD. */
  onBossQte?: (qte: HudBossQte | null) => void;
  /** Mobile mode (ADR-0003): touch controls + stronger zoom; replaces edge-scroll. */
  isMobile?: boolean;
  /** CRT post-process toggle (prefs.crt). When true, mounts the composite pass
   *  and moves the crosshair to the flat overlay layer (ADR-0031). */
  crt?: boolean;
  /** VHS scan-line travel toggle (prefs.vhs). Only bites while `crt` is on — it
   *  makes the CRT composite's existing scanline comb crawl slowly upward. */
  vhs?: boolean;
  /** Effective reduced motion (ADR-0054 §3): the shared derived signal, forwarded
   *  to CrtPass so the CRT grain/flicker freeze honours the in-app toggle + OS. */
  reducedMotion?: boolean;
}

export function GameScene({
  onHudUpdate,
  canvasRef,
  playSfx,
  levelParams,
  levelId,
  paused,
  onDelivery,
  onHostageQte,
  onBossQte,
  isMobile = false,
  crt = false,
  vhs = false,
  reducedMotion = false,
}: Props): JSX.Element {
  // The level is an image now: size the playfield from the facade art. The
  // backdrop composition (ADR-0048) is the single grid abstraction — enemy slots,
  // railings and the harness all derive from it, in either mode.
  const facadeH = WORLD_HEIGHT;
  const layout = useMemo(() => getBackdropLayout(levelId), [levelId]);
  const fullW = layout.fullW;
  // Camera-framing unit only (baseZoom below): the "typical building block" width
  // — one single-facade panel — so the on-screen target size is mode-independent
  // (a tronçon street sums to ≈ the same fullW, so the zoom/pan feel is unchanged).
  const panelW = WORLD_HEIGHT * FACADE_ASPECT;
  // Facade horizontal draw-scale: single-facade panels stretch by 1+BLEND (the
  // feathered overlap); tronçon tiles draw at native width (1) — the seam is a
  // real transparent gap, so there is nothing to stretch (ADR-0048).
  const drawScale = useMemo(() => facadeDrawScale(layout.mode), [layout.mode]);

  // Dev harness override for the level's window zones (never set in production).
  // The harness pushes candidate zones into window.__MUF_ZONES__ then calls
  // window.__MUF_APPLY_ZONES__() (registered below) to fold them into state so
  // the scene re-derives its slots live, no remount required. One entry per
  // backdrop tile (single-facade panel or tronçon), in tile order.
  const [zoneOverride, setZoneOverride] = useState<readonly (readonly WindowZone[])[] | null>(null);

  // Dev harness override to hide the foreground railings (never set in
  // production). The screen-space window detector needs the bare composited
  // facade; the harness sets window.__MUF_HIDE_RAILINGS__ then calls
  // window.__MUF_APPLY_RAILING_VIS__() to fold it into state (next frame, no
  // remount).
  const [hideRailings, setHideRailings] = useState(false);

  // Each backdrop tile carries its own window zones (per-tronçon or, for the
  // fixed levels, per-panel), so cops and railings line up with that tile's real
  // windows. The harness override replaces zones tile-by-tile.
  const tiles = useMemo(
    () =>
      layout.tiles.map((tile, i) => ({
        centreX: tile.centreX,
        width: tile.width,
        zones: zoneOverride?.[i] ?? tile.zones,
      })),
    [layout, zoneOverride],
  );
  // Code-drawn foreground style matched to the level's architecture.
  const ironworkStyle = useMemo(() => getIronworkStyle(levelId), [levelId]);
  const ironworkSillOffset = useMemo(() => getIronworkSillOffset(levelId), [levelId]);
  // Compose enemy slots + the harness slot-rects from the tiles in one pass. Each
  // tile-local zone (x,y,w,h) maps to world space at the tile's centre/width and
  // is remapped through the facade stretch (identity in tronçon mode) so cops and
  // railings re-seat into the windows as the facade image draws them. ONLY x
  // moves — the sprite width is untouched: the openings move, the sprites follow.
  const facade = useMemo(() => {
    const slots: WindowSlot[] = [];
    // Per-slot harness rect, in tile-local facade-normalized coords: x,y = box
    // CENTRE, w,h = box SIZE, all 0..1 within one tile (a WindowZone's space), so
    // the alignment harness can test the feet seating. Mirrors EnemySprite's
    // layout via the shared ENEMY_PLANE_SCALE / ENEMY_BODY_LIFT constants.
    const rects: { panel: number; x: number; y: number; w: number; h: number }[] = [];
    let col = 0;
    tiles.forEach((tile, i) => {
      for (const z of tile.zones) {
        const exactX = tile.centreX + (z.x - 0.5) * tile.width;
        const worldX = stretchAboutCentre(exactX, tile.centreX, drawScale);
        const worldY = (0.5 - z.y) * facadeH;
        const sizeY = z.h * facadeH;
        slots.push({
          col: col++,
          row: 0,
          screenPosition: { x: worldX, y: worldY },
          size: { x: z.w * tile.width, y: sizeY },
        });
        const planeH = sizeY * ENEMY_PLANE_SCALE; // window-height plane (EnemySprite)
        const planeW = planeH * WIDEST_ASPECT; // square plane scaled on X
        const bodyY = worldY + planeH * ENEMY_BODY_LIFT; // feet at sill
        rects.push({
          panel: i,
          x: z.x,
          y: 0.5 - bodyY / facadeH,
          w: planeW / tile.width,
          h: planeH / facadeH,
        });
      }
    });
    return { slots, rects };
  }, [tiles, drawScale, facadeH]);
  const mergedFacade = useMemo(
    () => ({ width: facade.slots.length, height: 1, slots: facade.slots }),
    [facade],
  );

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

  // Register the harness railing-visibility hook: read __MUF_HIDE_RAILINGS__ into
  // React state (bumping a render). Also picks up a flag set BEFORE mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as HarnessWindow;
    const apply = (): void => {
      setHideRailings(w.__MUF_HIDE_RAILINGS__ === true);
    };
    w.__MUF_APPLY_RAILING_VIS__ = apply;
    apply();
    return () => {
      if (w.__MUF_APPLY_RAILING_VIS__ === apply) delete w.__MUF_APPLY_RAILING_VIS__;
    };
  }, []);

  // Register the harness slot-rects reader. Each slot's rendered sprite box is
  // pre-computed alongside the slots (see `facade.rects`) in TILE-local facade-
  // normalized coords, so the reader is a pass-through. ADR-0048: `panel` is now
  // the backdrop-tile index (located by cumulative offset during composition, not
  // `floor(x·PANELS)`), so this generalizes to the variable-width tronçon layout
  // while staying byte-identical for the fixed equal-width panels.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as HarnessWindow;
    const reader = (): { panel: number; x: number; y: number; w: number; h: number }[] =>
      facade.rects.map((r) => ({ ...r }));
    w.__MUF_SLOT_RECTS__ = reader;
    return () => {
      if (w.__MUF_SLOT_RECTS__ === reader) delete w.__MUF_SLOT_RECTS__;
    };
  }, [facade]);

  // Couriers ride the road below the windows, across the whole wide street.
  const courierField = useMemo(
    () => ({ halfWidth: fullW / 2, streetY: -facadeH * 0.4 }),
    [fullW, facadeH],
  );

  // Per-level roster gate (ADR-0004): drives the window pool + street spawns.
  // Absent ⇒ legacy behaviour (stalingrad / vitry carry no roster). Resolved off
  // ALL_LEVELS (shipped first, so shipped ids resolve identically) because a
  // generated level's roster is the ONE thing that activates its level-authored
  // archetypes (ADR-0074 §3) — reading LEVELS here silently played a generated
  // level on the default pool (panel run-2 MAJEUR on PR #149).
  const roster = useMemo(() => ALL_LEVELS.find((l) => l.id === levelId)?.roster, [levelId]);

  const feedbackRef = useRef<Floater[]>([]);
  const impactChannelRef = useRef<ImpactChannel>({ queue: [], resetNonce: 0 });
  const playerHitChannelRef = useRef<PlayerHitChannel>({ queue: [], resetNonce: 0 });
  const { camera, size } = useThree();

  // Register the harness screen-projection hook (never set in production). It
  // maps a tile-local facade point to CSS pixels through the SAME production path
  // the railings/slots use: the addressed tile (ADR-0048 — located by index, not
  // by fixed pitch) gives world x = tile.centreX + (x-0.5)·tile.width, remapped by
  // the shared stretch (identity in tronçon mode), world y = (0.5-y)·facadeH, then
  // camera.project() → NDC → CSS px (y-down). Lets the scripts/ SCREEN pass gate
  // on-screen railing alignment, not just art pixels. Out-of-range tile ⇒ (0,0).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as HarnessWindow;
    const project = (panel: number, x: number, y: number): { sx: number; sy: number } => {
      const tile = tiles[panel];
      if (tile === undefined) return { sx: 0, sy: 0 };
      const exactX = tile.centreX + (x - 0.5) * tile.width;
      const worldX = stretchAboutCentre(exactX, tile.centreX, drawScale);
      const worldY = (0.5 - y) * facadeH;
      const ndc = new Vector3(worldX, worldY, 0).project(camera);
      return {
        sx: (ndc.x * 0.5 + 0.5) * size.width,
        sy: (1 - (ndc.y * 0.5 + 0.5)) * size.height,
      };
    };
    w.__MUF_PROJECT__ = project;
    return () => {
      if (w.__MUF_PROJECT__ === project) delete w.__MUF_PROJECT__;
    };
  }, [camera, size, tiles, drawScale, facadeH]);

  // Cover framing: fill the wider axis with ONE panel, letting the other
  // overflow a little. Mobile zooms in further (bigger, finger-sized targets)
  // and this is the *max* zoom — the pinch gesture backs out from here.
  // Belliard dezoom test: factor to reduce zoom and show roof of building
  const baseZoom =
    Math.max(size.width / panelW, size.height / facadeH) *
    (isMobile ? MOBILE_ZOOM_FACTOR : 1) *
    (levelId === "belliard" ? 0.85 : 1);

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
    playerHitChannelRef,
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
    // The desktop frame loop writes camera x/y from panRef every frame, so the
    // recenter above only sticks if the pan resets with it (resize = re-frame).
    panRef.current = createCameraPan();
  }, [camera, baseZoom]);

  useFrame((_state, delta) => {
    // On mobile the camera is driven by the inertial swipe pan in useGameLoop.
    // On pause the whole scene freezes (game loop, couriers, flipbooks) — the
    // camera must not keep edge-scrolling or gliding behind the pause sheet.
    if (isMobile || paused === true) return;
    // While EITHER QTE holds the scene frozen the cinematic zoom (useGameLoop) owns
    // the camera; skip edge-scroll so the two don't fight over its position.
    if (isQteActive(stateRef.current.qte) || isBossQteActive(stateRef.current.bossQte)) return;
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
      <LevelBackdrop levelId={levelId} facadeH={facadeH} />
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
      {/* single-wide (ADR-0057): the drawn décor bakes its own balcony ironwork,
          so the code-drawn foreground railings would double it up — suppressed. */}
      {!hideRailings &&
        layout.mode !== "single-wide" &&
        tiles.map((tile, i) => (
          <group key={`fg-${String(i)}`} position={[tile.centreX, 0, 0]}>
            <ForegroundFrames
              zones={tile.zones}
              facadeW={tile.width}
              facadeH={facadeH}
              style={ironworkStyle}
              sillOffset={ironworkSillOffset}
              drawScale={drawScale}
              varyPerBuilding={layout.mode === "troncon-sequence"}
              tileIndex={i}
            />
          </group>
        ))}
      {/* single-wide (ADR-0057): overlay the generated grille sprite in front of
          the cops, bottom edge on the feet line — the image ironwork replacing
          the wrong baked grids in street-wide.png. */}
      {!hideRailings &&
        layout.mode === "single-wide" &&
        tiles.map((tile, i) => (
          <group key={`grille-${String(i)}`} position={[tile.centreX, 0, 0]}>
            <WindowGrilles
              levelId={levelId}
              zones={tile.zones}
              facadeW={tile.width}
              facadeH={facadeH}
            />
          </group>
        ))}
      <NearForeground
        levelId={levelId}
        isMobile={isMobile}
        facadeW={layout.mode === "single-facade" ? panelW : fullW}
        facadeH={facadeH}
        panels={layout.mode === "single-facade" ? PANELS : 1}
        reducedMotion={reducedMotion}
        stateRef={stateRef}
      />
      {/* Armament crate (ADR-0055 → ADR-0056): the single LOOT entity is now a static
          SIDEWALK object at LOOT_STREET_Y — it reads only its world-X from the slot
          (`slot.screenPosition.x`, keyed by `loot.slotIndex`); its Y is decoupled to the
          street constant inside LootCrate, so it is no longer a window occupant. */}
      <LootCrate stateRef={stateRef} slots={mergedFacade.slots} />
      <CourierSprite stateRef={stateRef} paused={paused} />
      <HostageQteSprite
        stateRef={stateRef}
        onHostageQte={onHostageQte}
        reducedMotion={reducedMotion}
      />
      <BossQteSprite stateRef={stateRef} onBossQte={onBossQte} reducedMotion={reducedMotion} />
      <DeliveryVehicleSprite stateRef={stateRef} onHudChange={onDelivery} />
      <BulletSprite stateRef={stateRef} />
      {/* Ambient street life (vent steam + blowing litter). Suppressed for the
          whole boss fight and frozen on pause / hostage QTE / reduced motion. */}
      <UrbanMotion
        stateRef={stateRef}
        fullW={fullW}
        facadeH={facadeH}
        isMobile={isMobile}
        paused={paused === true}
        reducedMotion={reducedMotion}
      />
      <ImpactEffects channelRef={impactChannelRef} />
      <PlayerHitEffects channelRef={playerHitChannelRef} reducedMotion={reducedMotion} />
      <FeedbackLayer queueRef={feedbackRef} />
      <CrosshairSprite stateRef={stateRef} cameraRef={camera} crtEnabled={crt} />
      {crt && (
        <CrtPass
          tier={isMobile ? "lite" : "full"}
          paused={paused === true}
          reducedMotion={reducedMotion}
          vhs={vhs}
        />
      )}
    </>
  );
}
