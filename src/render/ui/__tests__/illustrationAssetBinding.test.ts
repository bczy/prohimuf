import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { illustrationAssetPaths } from "@game/systems/assetManifest";
import type { DiagramKind, GestureKind, NarrativeScene } from "@game/systems/narrativeSystem";
import { DiagramIcon } from "../DiagramIcon";
import { GestureIcon } from "../GestureIcon";

/**
 * BINDING TEST — the missing contract between the preload manifest and what the code-drawn
 * illustrations actually fetch.
 *
 * `GESTURE_EMBEDDED_ASSETS` / `DIAGRAM_EMBEDDED_ASSETS` (game side, `assetManifest.ts`) declare
 * which bitmaps `GestureIcon` / `DiagramIcon` (render side) embed, so the loading gate can warm
 * them (ADR-0071 D5). Their exhaustive `Record<Kind, …>` types guard the KEYS only: adding a
 * bitmap to a kind whose entry is already `[]` compiles, ships, and cold-fetches mid-panel. That
 * seam has drifted twice (stage-6 run-1 MAJEUR 5, then the Commandant sprite swap).
 *
 * This closes it mechanically: render every kind, read back every asset the markup actually
 * fetches, and assert SET-EQUALITY with what the game side declares for that kind. Both
 * directions fail loudly — an undeclared bitmap (cold fetch) and a declared-but-unused path
 * (dead weight in every fork's manifest).
 *
 * Render may import game (never the reverse), so the two halves legally meet here.
 */

const DIAGRAM_KINDS: readonly DiagramKind[] = [
  "shot-read-player-vs-enemy-bullet",
  "weapon-crate-loop",
  "threat-hierarchy-ladder",
  "hostage-ring",
  "boss-finale-switch",
];

const GESTURE_KINDS: readonly GestureKind[] = [
  "mouse-click",
  "edge-scroll",
  "two-finger-tap",
  "swipe-pan",
];

const BASE_URL: string = import.meta.env.BASE_URL;

/**
 * Every asset an SVG markup string fetches, base-relative (the `BASE_URL` prefix the components
 * add is stripped back off, mirroring what the manifest stores). Scans `href` / `xlink:href` on
 * ANY element, not just `<image>`, so a future `<use>`/`<pattern>`/`<feImage>` pointing at a real
 * file is caught too; fragment references (`#gi-sp-hand`, GestureIcon's shared hand `<defs>`)
 * resolve inside the same document and fetch nothing, so they are excluded.
 */
function fetchedAssets(html: string): readonly string[] {
  const found = new Set<string>();
  for (const [, value] of html.matchAll(/(?:xlink:)?href="([^"]*)"/g)) {
    const href = value ?? "";
    if (href === "" || href.startsWith("#")) continue;
    found.add(href.startsWith(BASE_URL) ? href.slice(BASE_URL.length) : href);
  }
  return [...found].sort();
}

/** What the game side declares for one kind, via the public helper the manifest itself uses. */
function declaredAssets(line: { readonly gesture?: GestureKind; readonly diagram?: DiagramKind }) {
  const scene: NarrativeScene = {
    id: "probe",
    lines: [{ speaker: "KENZA", text: "", ...line }],
  };
  return [...illustrationAssetPaths(scene)].sort();
}

describe("illustration asset binding — manifest declaration vs rendered markup", () => {
  it.each(DIAGRAM_KINDS)("DIAGRAM_EMBEDDED_ASSETS matches what %s renders", (diagram) => {
    const html = renderToStaticMarkup(createElement(DiagramIcon, { kind: diagram }));
    expect(fetchedAssets(html)).toEqual(declaredAssets({ diagram }));
  });

  it.each(GESTURE_KINDS)("GESTURE_EMBEDDED_ASSETS matches what %s renders", (gesture) => {
    const html = renderToStaticMarkup(createElement(GestureIcon, { kind: gesture }));
    expect(fetchedAssets(html)).toEqual(declaredAssets({ gesture }));
  });

  // Guards the guard: if `fetchedAssets` ever stopped seeing hrefs (a React change, a regex slip)
  // every case above would pass vacuously on two empty sets. At least one kind per channel MUST
  // fetch something, and these are the two that carry real bitmaps today.
  it("is not vacuous: the bitmap-carrying kinds report non-empty sets", () => {
    const diagram = renderToStaticMarkup(createElement(DiagramIcon, { kind: "hostage-ring" }));
    const gesture = renderToStaticMarkup(createElement(GestureIcon, { kind: "edge-scroll" }));
    expect(fetchedAssets(diagram)).toEqual(["assets/enemy_hostage.png", "assets/hostage/girl.png"]);
    expect(fetchedAssets(gesture)).toEqual(["assets/levels/belliard/street-wide.png"]);
  });

  // The `#`-fragment exclusion is load-bearing (swipe-pan reuses one `<defs>` hand four times);
  // pin that those `<use href="#…">` never leak in as phantom asset paths.
  it("ignores in-document fragment references", () => {
    const html = renderToStaticMarkup(createElement(GestureIcon, { kind: "swipe-pan" }));
    expect(html).toContain('href="#gi-sp-hand"');
    expect(fetchedAssets(html)).toEqual([]);
  });
});
