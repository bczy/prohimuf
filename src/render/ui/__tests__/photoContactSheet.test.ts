import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { PhotoFrameRecord, PhotoSheetView } from "@render/ui/photo/photoSeam";
import { ContactSheet } from "@render/ui/photo/ContactSheet";

function frame(over: Partial<PhotoFrameRecord> & { ordinal: number }): PhotoFrameRecord {
  return {
    verdict: "REJECTED",
    instantId: null,
    rejectReason: "blurred",
    inCover: true,
    ...over,
  };
}

function sheet(over: Partial<PhotoSheetView> = {}): PhotoSheetView {
  return {
    frames: [frame({ ordinal: 1 })],
    outcome: "none",
    leavingCta: "decline",
    retryOffered: true,
    hasPlaque: false,
    ...over,
  };
}

function markup(view: PhotoSheetView | null, filmCount = 6): string {
  return renderToStaticMarkup(
    createElement(ContactSheet, {
      sheet: view,
      filmCount,
      onCta: () => {
        /* noop */
      },
    }),
  );
}

/** The rendered CTA labels, in DOM order. */
function ctaLabels(html: string): string[] {
  return [...html.matchAll(/>(\[ [^<]+ \])</g)].map((m) => m[1] ?? "");
}

describe("ContactSheet — the second beat only", () => {
  it("draws nothing before the sheet exists (photoSheetView returns null)", () => {
    expect(markup(null)).toBe("");
  });

  it("keeps ONE FULL ROLL of windows, exposed or not (T-11)", () => {
    const full = markup(sheet({ frames: [1, 2, 3, 4, 5, 6].map((o) => frame({ ordinal: o })) }));
    expect(full.match(/<li /g)).toHaveLength(6);
    const truncated = markup(sheet({ frames: [frame({ ordinal: 1 }), frame({ ordinal: 2 })] }));
    expect(truncated.match(/<li /g)).toHaveLength(6);
  });

  it("T-11 — a SCENE_END at zero releases draws six empty windows and the right CTA", () => {
    const html = markup(sheet({ frames: [], leavingCta: "decline", retryOffered: true }));
    expect(html.match(/<li /g)).toHaveLength(6);
    // Empty windows, not failed ones: no verdict stamp anywhere on an untouched roll.
    expect(html).not.toMatch(/LA PREUVE|BONUS|RATÉE/);
    expect(ctaLabels(html)).toEqual(["[ RECOMMENCER ]", "[ LAISSER TOMBER ]"]);
  });

  it("never invents windows a roll never had (a hostile film count cannot go negative)", () => {
    const html = markup(sheet({ frames: [frame({ ordinal: 1 })] }), 0);
    expect(html.match(/<li /g)).toHaveLength(1);
  });

  it("never paginates or scrolls: no nav control is rendered (A12)", () => {
    const html = markup(sheet({ frames: [1, 2, 3, 4, 5, 6].map((o) => frame({ ordinal: o })) }));
    expect(ctaLabels(html)).toHaveLength(2);
    expect(html).not.toMatch(/page|suivant|précédent/i);
  });
});

describe("ContactSheet — verdict stamps (A13, grayscale-legible)", () => {
  it("gives the three verdicts three distinct texts", () => {
    const html = markup(
      sheet({
        frames: [
          frame({ ordinal: 1, verdict: "MASTER", instantId: "ECHANGE", rejectReason: null }),
          frame({ ordinal: 2, verdict: "BONUS", instantId: "PLAQUE", rejectReason: null }),
          frame({ ordinal: 3 }),
        ],
      }),
    );
    expect(html).toContain("LA PREUVE");
    expect(html).toContain("BONUS");
    expect(html).toContain("RATÉE");
  });

  it("gives the three verdicts three distinct stamp classes (shape, not hue)", () => {
    const classesFor = (verdict: PhotoFrameRecord["verdict"]): string => {
      const html = markup(sheet({ frames: [frame({ ordinal: 1, verdict, rejectReason: null })] }));
      return /class="([^"]*stamp[^"]*)"/.exec(html)?.[1] ?? "";
    };
    const master = classesFor("MASTER");
    const bonus = classesFor("BONUS");
    const rejected = classesFor("REJECTED");
    expect(new Set([master, bonus, rejected]).size).toBe(3);
    // …and no inline colour carries any of the three reads.
    expect(master + bonus + rejected).not.toMatch(/color:/);
  });
});

describe("ContactSheet — the R2-5 CTA shape", () => {
  it("shows EXACTLY ONE control on a master roll with the budget spent", () => {
    const html = markup(sheet({ leavingCta: "continue", retryOffered: false }));
    expect(ctaLabels(html)).toEqual(["[ CONTINUER ]"]);
  });

  it("shows two controls on the no-master branch while retry is offered", () => {
    expect(ctaLabels(markup(sheet()))).toEqual(["[ RECOMMENCER ]", "[ LAISSER TOMBER ]"]);
  });

  it("drops the retry once the attempt budget is spent, leaving control alone", () => {
    expect(ctaLabels(markup(sheet({ retryOffered: false })))).toEqual(["[ LAISSER TOMBER ]"]);
  });

  it("styles the two controls as PEERS — same class, no primary modifier (R2-5)", () => {
    const classes = [...markup(sheet()).matchAll(/<button[^>]*class="([^"]*)"/g)].map((m) => m[1]);
    expect(classes).toHaveLength(2);
    expect(classes[0]).toBe(classes[1]);
  });

  it("reads the CTA branch off the projection, never off the frames it drew", () => {
    // A roll FULL of rejected frames but flagged `continue` still shows the leaving
    // control the tick asked for: the render never re-derives the outcome (D-D).
    const html = markup(
      sheet({ leavingCta: "continue", retryOffered: false, frames: [frame({ ordinal: 1 })] }),
    );
    expect(ctaLabels(html)).toEqual(["[ CONTINUER ]"]);
  });
});

describe("ContactSheet — thumbnails are two DOM layers (lead-art ruling)", () => {
  const crop = { x: 0.25, y: 0.5, w: 0.2, h: 0.2 } as const;

  function withThumb(poseUrl: string | null): string {
    return renderToStaticMarkup(
      createElement(ContactSheet, {
        sheet: sheet({ frames: [frame({ ordinal: 1, verdict: "MASTER", rejectReason: null })] }),
        filmCount: 6,
        thumbnails: new Map([[1, { plateUrl: "assets/plate.png", poseUrl, crop }]]),
        onCta: () => {
          /* noop */
        },
      }),
    );
  }

  it("prints the plate AND the pose on the same rectangle — never the plate alone", () => {
    const html = withThumb("assets/pose.png");
    expect(html).toContain("url(assets/plate.png)");
    expect(html).toContain("url(assets/pose.png)");
    // Same crop on both layers: two identical background-position declarations.
    expect(html.match(/background-position:25% 50%/g)).toHaveLength(2);
  });

  it("crops with CSS only — no canvas, no readback, no pre-rendered sheet bitmap", () => {
    const html = withThumb("assets/pose.png");
    expect(html).not.toMatch(/<canvas|toDataURL|data:image/);
    expect(html).toContain("background-size");
  });

  it("falls back to the toner placeholder when a frame has no imagery yet", () => {
    const html = markup(sheet({ frames: [frame({ ordinal: 1 })] }));
    expect(html).not.toContain("url(");
  });
});
