import { describe, it, expect } from "vitest";
import { buildRequestUrl } from "../pollinations.mjs";
import { heroForSlot, heroRawUrl } from "../heroes.mjs";

// Layer A (ADR-0043 §4) — end-to-end PROOF that a resolved hero reaches the
// diffusion model's `image=` parameter, over the exact same builder the
// generators and scripts/check-hero-wiring.mjs use (buildRequestUrl +
// heroRawUrl). Not a proof that "a field exists" — a proof of causality: the
// resolved URL changes when the hero it is derived from changes.
const repoSha = { repo: "bczy/prohimuf", sha: "deadbeef1234" };

describe("hero → image= end-to-end (ADR-0043 Layer A)", () => {
  it("hero present ⇒ built URL contains image=<heroRawUrl(approved)> exactly", () => {
    const registry = {
      vehicles: {
        truck: { slug: "truck-v1", approved: "references/approved/vehicles/truck-v1.png" },
      },
    };
    const hero = heroForSlot(registry, "vehicles", "truck");
    const imageUrl = heroRawUrl(hero.approved, repoSha);

    const url = buildRequestUrl({
      prompt: "a delivery truck",
      seed: 12345,
      width: 256,
      height: 160,
      imageUrl,
    });

    expect(url).toContain(`image=${encodeURIComponent(imageUrl)}`);
    expect(url).toContain("model=kontext");
  });

  it("causality — changing the approved slug changes the resolved image= value", () => {
    const urlForSlug = (slug) => {
      const registry = {
        vehicles: { truck: { slug, approved: `references/approved/vehicles/${slug}.png` } },
      };
      const hero = heroForSlot(registry, "vehicles", "truck");
      const imageUrl = heroRawUrl(hero.approved, repoSha);
      return buildRequestUrl({
        prompt: "a delivery truck",
        seed: 12345,
        width: 256,
        height: 160,
        imageUrl,
      });
    };

    const urlV1 = urlForSlug("truck-v1");
    const urlV2 = urlForSlug("truck-v2");

    expect(urlV1).not.toEqual(urlV2);
    expect(urlV1).toContain(encodeURIComponent("truck-v1.png"));
    expect(urlV2).toContain(encodeURIComponent("truck-v2.png"));
    expect(urlV1).not.toContain(encodeURIComponent("truck-v2.png"));
  });

  it("no hero for the slot ⇒ model=flux and no image= param (AC4 — today's behaviour)", () => {
    const registry = {}; // absent/empty registry ⇒ heroForSlot returns null everywhere
    const hero = heroForSlot(registry, "vehicles", "truck");
    expect(hero).toBeNull();

    const url = buildRequestUrl({
      prompt: "a delivery truck",
      seed: 12345,
      width: 256,
      height: 160,
      imageUrl: hero ? heroRawUrl(hero.approved, repoSha) : undefined,
    });

    expect(url).toContain("model=flux");
    expect(url).not.toContain("image=");
  });
});

describe("heroForSlot", () => {
  it("returns null when the family is present but the slot is not", () => {
    const registry = {
      vehicles: { truck: { slug: "x", approved: "references/approved/vehicles/x.png" } },
    };
    expect(heroForSlot(registry, "vehicles", "car")).toBeNull();
  });

  it("returns null when the family itself is absent", () => {
    expect(heroForSlot({}, "enemies", "enemy_sprite")).toBeNull();
  });
});

describe("heroRawUrl", () => {
  it("builds a raw.githubusercontent.com URL at the given repo/sha", () => {
    const url = heroRawUrl("references/approved/vehicles/truck-v1.png", repoSha);
    expect(url).toBe(
      "https://raw.githubusercontent.com/bczy/prohimuf/deadbeef1234/references/approved/vehicles/truck-v1.png",
    );
  });
});
