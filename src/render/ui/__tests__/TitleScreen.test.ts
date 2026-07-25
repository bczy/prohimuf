import { describe, it, expect, vi, afterEach } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
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
});
