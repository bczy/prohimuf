import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MOTION, SMOKE_INK, SMOKE_SPRITE_PATH } from "@render/ui/print";
import { TitleScreen, pickTitleAnimation, type TitleAnimation } from "../TitleScreen";

const render = (): string =>
  renderToStaticMarkup(
    createElement(TitleScreen, {
      onEnter: () => {
        /* entry is not under test */
      },
    }),
  );

/** Force the draw by pinning the RNG the component reads. */
function renderWithDraw(draw: number): string {
  vi.spyOn(Math, "random").mockReturnValue(draw);
  return render();
}

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * The cover draws one of three reveal variants at each mount. The draw must be an EQUAL
 * three-way split (no variant that shows up twice as often), and it must be total: the
 * picker is fed `Math.random`, so a `1` — or a NaN from a broken stub — still has to yield
 * a real variant instead of leaving the wordmark with no animation at all.
 */
describe("pickTitleAnimation", () => {
  it("splits [0,1) into three equal, contiguous bands", () => {
    expect(pickTitleAnimation(() => 0)).toBe("spray");
    expect(pickTitleAnimation(() => 0.332)).toBe("spray");
    expect(pickTitleAnimation(() => 1 / 3)).toBe("paint");
    expect(pickTitleAnimation(() => 0.666)).toBe("paint");
    expect(pickTitleAnimation(() => 2 / 3)).toBe("blast");
    expect(pickTitleAnimation(() => 0.999)).toBe("blast");
  });

  it("is total — an out-of-contract draw still yields a variant", () => {
    expect(pickTitleAnimation(() => 1)).toBe("blast");
    expect(pickTitleAnimation(() => Number.NaN)).toBe("blast");
  });

  it("covers all three variants and nothing else", () => {
    const drawn = new Set([0.1, 0.5, 0.9].map((d) => pickTitleAnimation(() => d)));
    expect(drawn).toEqual(new Set<TitleAnimation>(["spray", "paint", "blast"]));
  });
});

/**
 * Whatever the draw, the cover renders the SAME wordmark — three letter spans carrying the
 * `data-char` its chrome-fill clone reads. Only the variant marker (which selects the
 * keyframes) and the blast's cloud node differ.
 */
describe("TitleScreen wordmark reveal", () => {
  const DRAWS: readonly (readonly [number, TitleAnimation])[] = [
    [0.1, "spray"],
    [0.5, "paint"],
    [0.9, "blast"],
  ];

  it("marks the wordmark with the drawn variant", () => {
    for (const [draw, variant] of DRAWS) {
      expect(renderWithDraw(draw)).toContain(`data-muf-title-anim="${variant}"`);
      vi.restoreAllMocks();
    }
  });

  it("renders the three letters for every variant", () => {
    for (const [draw] of DRAWS) {
      const html = renderWithDraw(draw);
      for (const char of ["M", "U", "F"]) {
        expect(html).toContain(`data-char="${char}"`);
      }
      vi.restoreAllMocks();
    }
  });

  it("mounts the smoke cloud only for the blast", () => {
    for (const [draw, variant] of DRAWS) {
      expect(renderWithDraw(draw).includes("data-muf-title-smoke"), variant).toBe(
        variant === "blast",
      );
      vi.restoreAllMocks();
    }
  });

  /**
   * The cloud is a FIELD, not a picture: every puff carries its own drift, growth, peak and
   * slice of the cloud's life (the boss veil's model). If a puff ever shipped without them the
   * CSS would fall back to an empty `var()` and the whole cloud would collapse onto one spot —
   * so the presence of the per-puff steering is what this asserts, not a pixel.
   */
  it("gives the blast's cloud a field of individually steered puffs", () => {
    const html = renderWithDraw(0.9);
    const puffs = html.split("--puff-x").length - 1;
    expect(puffs).toBeGreaterThanOrEqual(12);
    for (const prop of ["--puff-dx", "--puff-dy", "--puff-grow", "--puff-peak", "--puff-life"]) {
      expect(html.split(prop).length - 1, prop).toBe(puffs);
    }
  });

  /**
   * The puffs' texture is the boss veil's own sprite, handed to the CSS as `--puff-sprite`
   * because only the component can read Vite's BASE_URL. Drop that property and the mask
   * declaration becomes invalid at computed-value time — which does NOT hide the cloud, it
   * UNMASKS it: eighteen flat grey rectangles over the cover. A missing file degrades
   * gracefully (an unloadable mask hides its element); a missing variable does not, so it is
   * the variable that is asserted here.
   */
  it("paints the cloud with the boss veil's sprite and grey", () => {
    const html = renderWithDraw(0.9);
    expect(html).toContain(`--puff-sprite:url(`);
    expect(html).toContain(SMOKE_SPRITE_PATH);
    expect(html).toContain(`--puff-ink:${SMOKE_INK}`);
  });
});

/**
 * The paint variant's SILENCE is geometry, not a curve: each spray line grows at a constant
 * speed for its whole slot, but only the first third of that growth crosses the letter — the
 * rest happens outside the glyph, where nothing is revealed. So the CSS `--muf-line-on`
 * overshoot IS the spray/travel ratio of the motion tokens, expressed as a size, and the two
 * would drift apart silently on the next tuning pass. This binds them: retune the rhythm in
 * `tokens.ts` and this test tells you the CSS constant must follow.
 */
describe("TITLE paint line overshoot", () => {
  const css = readFileSync(resolve(process.cwd(), "src/render/ui/TitleScreen.module.css"), "utf8");

  it("derives --muf-line-on from the spray/travel split of the tokens", () => {
    const match = /--muf-line-on:\s*(\d+)%/.exec(css);
    expect(match, "--muf-line-on must be a percentage of the letter box").not.toBeNull();
    const overshoot = Number(match?.[1]);
    // A line has crossed the letter once it is ~the box wide; it must reach that at the end of
    // the spray and keep growing (invisibly) for the whole travel.
    const slotMs = MOTION.titlePaintLineMs + MOTION.titlePaintLineGapMs;
    const expected = (100 * slotMs) / MOTION.titlePaintLineMs;
    expect(overshoot).toBeGreaterThanOrEqual(expected * 0.95);
    expect(overshoot).toBeLessThanOrEqual(expected * 1.15);
  });

  it("opens one line per step, and never two at once", () => {
    const sweep = /@keyframes mufPaintSweep \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? "";
    const stops = [...sweep.matchAll(/([\d.]+)% \{[\s\S]*?mask-size:([^;]+);/g)].map((m) => ({
      at: Number(m[1] ?? ""),
      open: (m[2] ?? "").split("--muf-line-on").length - 1,
    }));
    expect(stops.length).toBeGreaterThan(2);
    stops.forEach((stop, i) => {
      expect(stop.open, `stop ${stop.at.toString()}%`).toBe(i);
    });
  });
});
