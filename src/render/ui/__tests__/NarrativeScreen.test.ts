import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { NarrativeScene } from "@game/systems/narrativeSystem";
import { NarrativeScreen } from "../NarrativeScreen";

interface TestLineTeachingBullets {
  readonly teachingBullets?: readonly string[];
}

function sceneWithLine(line: NarrativeScene["lines"][number]): NarrativeScene {
  return { id: "test-scene", lines: [line] };
}

function renderNarrative(scene: NarrativeScene): string {
  return renderToStaticMarkup(
    createElement(NarrativeScreen, {
      scene,
      onDone: () => {
        /* noop */
      },
    }),
  );
}

describe("NarrativeScreen teachingBullets", () => {
  it("renders at most two bullets in transcript area", () => {
    const line = {
      speaker: "DISPATCH",
      text: "",
      teachingBullets: ["Tire en premier.", "Protège le colis.", "Ne tire pas sur le civil."],
    } as NarrativeScene["lines"][number] & TestLineTeachingBullets;

    const html = renderNarrative(sceneWithLine(line));
    expect((html.match(/<li/g) ?? []).length).toBe(2);
    expect(html).toContain("Tire en premier.");
    expect(html).toContain("Protège le colis.");
    expect(html).not.toContain("Ne tire pas sur le civil.");
  });

  it("drops empty bullet strings before applying the max-2 clamp", () => {
    const line = {
      speaker: "DISPATCH",
      text: "",
      teachingBullets: [" ", "Fenêtre rouge = menace active.", " ", "Attends le vert."],
    } as NarrativeScene["lines"][number] & TestLineTeachingBullets;

    const html = renderNarrative(sceneWithLine(line));
    expect((html.match(/<li/g) ?? []).length).toBe(2);
    expect(html).toContain("Fenêtre rouge = menace active.");
    expect(html).toContain("Attends le vert.");
  });
});

describe("NarrativeScreen cue exclusivity", () => {
  it("does not stack diagram with image/gesture channels", () => {
    const line = {
      speaker: "KENZA",
      text: "",
      image: "assets/enemy_shooting.png",
      imageAlt: "Un flic qui dégaine",
      gesture: "mouse-click",
      gestureAlt: "Clic gauche pour tirer",
      diagram: "weapon-crate-loop",
      diagramAlt: "Boucle caisse-armes",
    } as NarrativeScene["lines"][number];

    const html = renderNarrative(sceneWithLine(line));
    expect(html).toContain("assets/enemy_shooting.png");
    expect(html).not.toContain("data-diagram-kind=");
  });
});
