import { describe, it, expect, vi, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";

// Opt into React's act() environment so the client-render cycle tests do not warn.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MOTION, SMOKE_INK, SMOKE_SPRITE_PATH } from "@render/ui/print";
import {
  TitleScreen,
  TITLE_REVEAL_MS,
  nextTitleAnimation,
  pickTitleAnimation,
  type TitleAnimation,
} from "../TitleScreen";

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

/**
 * TITLE reveal: the motion tokens are a BUDGET, not decoration. `TitleScreen.module.css`
 * derives each letter's delay as `index × stagger`, so a staggered variant's wall-clock total
 * for the 3-letter wordmark is `2 × stagger + duration`; the blast fires all three letters at
 * once, so its total is its cloud's life.
 *
 * The three variants used to be held to ONE shared ~2s window, so the player could not feel
 * from its length which one they had drawn. That parity was traded away on 2026-07-25
 * (Bertrand): the paint variant now has to READ as a hand with a can — one line at a time, a
 * silence while the arm travels, a second pass in the other colour — and a gesture that long
 * cannot be squeezed into a spray's budget. So each variant gets its OWN window instead, and
 * the "no tell" guard now covers only the two that reveal on the spot. The bounds still stop a
 * later "make it more dramatic" tweak from pushing a variant out of its lane, and the hard cap
 * (6s) is what keeps the cover from holding a player who wants to get on with it — the surface
 * is click-through at any instant, but the wordmark must be finished before they wonder.
 */
describe("TITLE reveal budget", () => {
  // The component's own map — the same numbers the cycle waits on, not a copy of them.
  const totals = TITLE_REVEAL_MS;
  // Per-variant windows (ms). The paint's is deliberately the long one.
  const WINDOWS = {
    spray: [1500, 2500],
    blast: [1500, 3500],
    paint: [3000, 6000],
  } as const;

  it("keeps one can-stroke under the 1s ceiling", () => {
    // The spray lays a letter in one stroke; the paint's unit of gesture is one PASS (the
    // four lines of a single colour over one letter — TITLE_PAINT_LINES). Neither may
    // outstay a second.
    expect(MOTION.titleSprayMs).toBeLessThanOrEqual(1000);
    expect(MOTION.titlePaintPassMs).toBeLessThanOrEqual(1000);
  });

  it("finishes every variant inside its own window", () => {
    for (const [variant, totalMs] of Object.entries(totals)) {
      const [min, max] = WINDOWS[variant as keyof typeof WINDOWS];
      expect(totalMs, variant).toBeGreaterThanOrEqual(min);
      expect(totalMs, variant).toBeLessThanOrEqual(max);
    }
  });

  it("keeps the two on-the-spot variants within a second of each other (no tell)", () => {
    expect(Math.abs(totals.spray - totals.blast)).toBeLessThanOrEqual(1000);
  });

  it("makes the paint the slowest variant, and caps it at 6s", () => {
    expect(totals.paint).toBeGreaterThan(Math.max(totals.spray, totals.blast));
    expect(totals.paint).toBeLessThanOrEqual(6000);
  });

  it("settles the blast's letters well before its cloud clears", () => {
    expect(MOTION.titleBlastSettleMs).toBeLessThan(MOTION.titleBlastMs);
  });
});

/**
 * The paint variant's RHYTHM (Bertrand, 2026-07-25: "c'est ce rythme qui vend le réalisme,
 * plus encore que la vitesse du trait"). A can that never stops is a printer, not a hand: the
 * silences — arm travel between two lines, can swap between two colours, the step across to
 * the next letter — are load-bearing, so each is asserted to exist and to be longer than the
 * gesture it separates. Everything here is derived arithmetic inside `tokens.ts`; these
 * assertions are what stops a "just make it faster" edit from collapsing the pauses to zero
 * and turning the fill back into a wipe.
 */
describe("TITLE paint rhythm", () => {
  /**
   * The first cut of this variant sprayed a line in 45ms. Frame-by-frame capture of the built
   * cover (60fps) showed why that failed the brief: a line was laid in under three frames, so
   * it never READ as a stroke crossing the letter — it popped, and because one horizontal line
   * crosses several strokes of a glyph (the M's two stems), a popping line lights up two or
   * three disjoint places at the same instant. A stroke has to last long enough to be SEEN
   * travelling; six frames at 60fps is the floor. This is the assertion that keeps the next
   * "make it snappier" edit from bringing the popping back.
   */
  it("sprays a line slowly enough to be seen crossing (≥6 frames at 60fps)", () => {
    expect(MOTION.titlePaintLineMs).toBeGreaterThanOrEqual(100);
  });

  it("stops the can between two lines, long enough to register", () => {
    expect(MOTION.titlePaintLineGapMs).toBeGreaterThanOrEqual(60);
  });

  it("spends a pass on whole lines only (four of them, spray + travel)", () => {
    expect(MOTION.titlePaintPassMs % (MOTION.titlePaintLineMs + MOTION.titlePaintLineGapMs)).toBe(
      0,
    );
  });

  it("pauses to swap cans between the two colour passes", () => {
    const passGap = MOTION.titlePaintPassStepMs - MOTION.titlePaintPassMs;
    expect(passGap).toBeGreaterThan(MOTION.titlePaintLineGapMs);
    // A letter is both passes AND the swap between them, so no two colours overlap.
    expect(MOTION.titlePaintMs).toBe(MOTION.titlePaintPassStepMs + MOTION.titlePaintPassMs);
  });

  it("pauses again before stepping across to the next letter", () => {
    expect(MOTION.titlePaintStaggerMs).toBeGreaterThan(MOTION.titlePaintMs);
  });
});

/**
 * The cover CYCLES (Bertrand, 2026-07-26): it paints a variant, holds the finished wordmark
 * long enough to be read, wipes it and starts the next one, for as long as the title screen is
 * up. The rotation is fixed rather than re-drawn so a player who waits is shown all three
 * rather than the same coin-flip twice.
 */
describe("nextTitleAnimation", () => {
  it("walks the three variants in a fixed order and wraps", () => {
    expect(nextTitleAnimation("spray")).toBe("paint");
    expect(nextTitleAnimation("paint")).toBe("blast");
    expect(nextTitleAnimation("blast")).toBe("spray");
  });

  it("returns to its starting point after one full turn, from any start", () => {
    for (const start of ["spray", "paint", "blast"] as const) {
      const seen = new Set<TitleAnimation>([start]);
      let at: TitleAnimation = start;
      for (let i = 0; i < 3; i++) {
        at = nextTitleAnimation(at);
        seen.add(at);
      }
      expect(at, start).toBe(start);
      expect(seen.size, start).toBe(3);
    }
  });
});

/**
 * The loop, driven for real: mounted client-side, with the clock under our control. What is
 * pinned here is the SHAPE of a turn — paint, hold, wipe, next — because each of those beats
 * is a promise to the player (the mark stays up long enough to read; the cover never cuts to
 * black; the variant actually changes), and all three are invisible to a static render.
 */
describe("TitleScreen reveal cycle", () => {
  const noop = (): void => {
    /* entry is not under test */
  };

  function mount(): { host: HTMLElement; unmount: () => void } {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    act(() => {
      root.render(createElement(TitleScreen, { onEnter: noop }));
    });
    return {
      host,
      unmount: () => {
        act(() => {
          root.unmount();
        });
        host.remove();
      },
    };
  }

  const variantOf = (host: HTMLElement): string | null =>
    host.querySelector("[data-muf-title-anim]")?.getAttribute("data-muf-title-anim") ?? null;

  const wordmarkClass = (host: HTMLElement): string =>
    host.querySelector("[data-muf-title-anim]")?.className ?? "";

  const tick = (ms: number): void => {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  };

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.removeAttribute("data-reduced-motion");
    document.body.innerHTML = "";
  });

  it("holds the finished wordmark, wipes it, then paints the next variant", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1); // start on "spray"
    const { host, unmount } = mount();
    expect(variantOf(host)).toBe("spray");

    // Still the finished spray while it is being read: no wipe, no variant change.
    tick(TITLE_REVEAL_MS.spray + MOTION.titleCycleHoldMs - 50);
    expect(variantOf(host)).toBe("spray");
    expect(wordmarkClass(host)).not.toContain("clearing");

    // Hold over: the mark is wiped, and it is still the spray that is being wiped.
    tick(100);
    expect(wordmarkClass(host)).toContain("clearing");
    expect(variantOf(host)).toBe("spray");

    // Wipe over: the next variant starts, on a fresh mount (no leftover wipe class).
    tick(MOTION.titleCycleClearMs);
    expect(variantOf(host)).toBe("paint");
    expect(wordmarkClass(host)).not.toContain("clearing");
    unmount();
  });

  it("keeps cycling — three turns bring the third variant up", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const { host, unmount } = mount();
    // Two beats per turn, because that is how the component schedules them: the wipe's timer
    // only exists once React has committed the end of the hold.
    const turn = (animation: TitleAnimation): void => {
      tick(TITLE_REVEAL_MS[animation] + MOTION.titleCycleHoldMs);
      tick(MOTION.titleCycleClearMs);
    };
    turn("spray");
    expect(variantOf(host)).toBe("paint");
    turn("paint");
    expect(variantOf(host)).toBe("blast");
    turn("blast");
    expect(variantOf(host)).toBe("spray");
    unmount();
  });

  /**
   * The whole point of the toggle. A reduced-motion player gets the finished wordmark and then
   * NOTHING: no wipe, no repaint, not even a timer — which is why this is asserted on the
   * mounted component and not on the stylesheet, where `animation: none` could only ever hide
   * a loop that kept running underneath.
   */
  it("never cycles under the in-app reduced-motion trigger", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    document.documentElement.setAttribute("data-reduced-motion", "true");
    const { host, unmount } = mount();
    expect(variantOf(host)).toBe("spray");
    tick((TITLE_REVEAL_MS.spray + MOTION.titleCycleHoldMs + MOTION.titleCycleClearMs) * 4);
    expect(variantOf(host)).toBe("spray");
    expect(wordmarkClass(host)).not.toContain("clearing");
    expect(vi.getTimerCount()).toBe(0);
    unmount();
  });

  it("stops cycling when the cover goes away (no timer outlives the screen)", () => {
    vi.useFakeTimers();
    const { unmount } = mount();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
