import type { TopdownMap } from "@game/maps/topdown_test";

/**
 * Vitry-sur-Seine — vue topdown
 * Deux barres HLM parallèles, couloir central, hall d'entrée nord et sud.
 *
 * Layout (40×24 units) :
 *
 *   ┌──────────────────────────────────────────┐
 *   │          BARRE HLM NORD (mur)            │  y=+10..+12
 *   │                                          │
 *   │  [PICKUP]   couloir libre    [DELIVERY]  │  y=-2..+2
 *   │                                          │
 *   │          BARRE HLM SUD (mur)            │  y=-12..-10
 *   └──────────────────────────────────────────┘
 *
 *  Player spawn : couloir centre
 *  Pickup  : hall nord-ouest  x=-14, y=0
 *  Delivery: hall sud-est     x=+14, y=0
 *  2 cops patrouillent le couloir
 */
export const VITRY_94_TOPDOWN: TopdownMap = {
  name: "Vitry 94",
  widthUnits: 40,
  heightUnits: 24,
  playerStart: { x: 0, y: 0 },
  pickupPosition: { x: -14, y: 0 },
  deliveryPosition: { x: 14, y: 0 },
  copWaypoints: [
    // Cop 1 — patrouille couloir ouest ↔ centre
    [
      { x: -12, y: 3 },
      { x: 0, y: 3 },
      { x: 0, y: -3 },
      { x: -12, y: -3 },
    ],
    // Cop 2 — patrouille couloir centre ↔ est
    [
      { x: 0, y: -3 },
      { x: 12, y: -3 },
      { x: 12, y: 3 },
      { x: 0, y: 3 },
    ],
  ],
  solidRects: [
    // Bordures extérieures
    { x: 0, y: 12, w: 20, h: 0.5 }, // mur nord
    { x: 0, y: -12, w: 20, h: 0.5 }, // mur sud
    { x: 20, y: 0, w: 0.5, h: 12 }, // mur est
    { x: -20, y: 0, w: 0.5, h: 12 }, // mur ouest

    // Barre HLM nord (bloc solide, sauf ouvertures halls)
    { x: -8, y: 9, w: 10, h: 2 }, // aile nord-ouest
    { x: 10, y: 9, w: 8, h: 2 }, // aile nord-est
    // Hall nord centre ouvert entre x=-2 et x=+2

    // Barre HLM sud (bloc solide, sauf ouvertures halls)
    { x: -8, y: -9, w: 10, h: 2 }, // aile sud-ouest
    { x: 10, y: -9, w: 8, h: 2 }, // aile sud-est
    // Hall sud centre ouvert entre x=-2 et x=+2

    // Piliers / obstacles intérieurs dans le couloir
    { x: -6, y: 0, w: 0.5, h: 1.5 },
    { x: 6, y: 0, w: 0.5, h: 1.5 },
  ],
};
