import type { CSSProperties, JSX, ReactNode } from "react";
import {
  PaperSheet,
  HalftoneHero,
  Stamp,
  MarkerCircle,
  TapeCorner,
  INK,
  STOCK,
  MARK,
  ACID,
  FONT,
} from "@render/ui/print";
import { ScoreReadout } from "@render/ui/hud/ScoreReadout";
import { WaveReadout } from "@render/ui/hud/WaveReadout";
import { TimerReadout } from "@render/ui/hud/TimerReadout";
import { LivesReadout } from "@render/ui/hud/LivesReadout";
import { EnergyGauge } from "@render/ui/hud/EnergyGauge";
import { DeliveryIntegrityBanner } from "@render/ui/hud/DeliveryIntegrityBanner";
import { HostageQteOverlay } from "@render/ui/hud/HostageQteOverlay";
import { OffscreenArrowIndicator } from "@render/ui/hud/OffscreenArrowIndicator";
import { PhaseMessageBanner } from "@render/ui/hud/PhaseMessageBanner";
import { Overlay, SelectableListItem } from "@render/ui/controls";

/*
 * muf component catalog — the design-system's living doc (P2 step 2). A standalone,
 * offline page (its own Vite entry `catalog.html`, never imported by the game bundle)
 * that mounts every print primitive and HUD widget with representative mock props and
 * their key variant states. Presentation-only, render-layer: imports the SAME
 * components/CSS Modules the game ships, so it can't drift. No `src/game` rule.
 */

// A titled block of demo cells.
function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2
        style={{
          fontFamily: FONT.mono,
          fontSize: "13px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: INK.black,
          borderBottom: `2px solid ${INK.black}`,
          paddingBottom: "6px",
          marginBottom: "16px",
        }}
      >
        {title}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "flex-start" }}>
        {children}
      </div>
    </section>
  );
}

// A labelled cell around one specimen.
function Cell({
  label,
  children,
  width,
}: {
  label: string;
  children: ReactNode;
  width?: number;
}): JSX.Element {
  return (
    <figure style={{ margin: 0, width: width !== undefined ? `${String(width)}px` : "auto" }}>
      <div
        style={{
          background: STOCK.shell,
          border: `1px solid ${INK.black}`,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "48px",
        }}
      >
        {children}
      </div>
      <figcaption
        style={{
          fontFamily: FONT.mono,
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: INK.black,
          opacity: 0.75,
          marginTop: "5px",
        }}
      >
        {label}
      </figcaption>
    </figure>
  );
}

// Stage: a contained viewport for the `position: fixed` HUD overlays. The
// `transform` makes this box the containing block for its fixed descendants, so a
// banner/stamp/arrow-ring anchors to this cell instead of the real viewport.
function Stage({
  label,
  height = 150,
  children,
}: {
  label: string;
  height?: number;
  children: ReactNode;
}): JSX.Element {
  return (
    <figure style={{ margin: 0, width: "260px" }}>
      <div
        style={{
          position: "relative",
          transform: "translateZ(0)",
          overflow: "hidden",
          height: `${String(height)}px`,
          background: STOCK.shell,
          border: `1px solid ${INK.black}`,
        }}
      >
        {children}
      </div>
      <figcaption
        style={{
          fontFamily: FONT.mono,
          fontSize: "10px",
          letterSpacing: "0.08em",
          color: INK.black,
          opacity: 0.75,
          marginTop: "5px",
        }}
      >
        {label}
      </figcaption>
    </figure>
  );
}

const SWATCH: readonly { name: string; value: string }[] = [
  { name: "stock.jaune", value: STOCK.jaune },
  { name: "stock.rose", value: STOCK.rose },
  { name: "stock.vert", value: STOCK.vert },
  { name: "stock.orange", value: STOCK.orange },
  { name: "stock.manila", value: STOCK.manila },
  { name: "stock.newsprint", value: STOCK.newsprint },
  { name: "stock.shell", value: STOCK.shell },
  { name: "ink.black", value: INK.black },
  { name: "ink.full", value: INK.full },
  { name: "mark.green", value: MARK.green },
  { name: "mark.orange", value: MARK.orange },
  { name: "mark.pink", value: MARK.pink },
  { name: "acid.yellow", value: ACID.yellow },
];

const TYPE_SPECIMENS: readonly { name: string; stack: string }[] = [
  { name: "FONT.display", stack: FONT.display },
  { name: "FONT.mono", stack: FONT.mono },
  { name: "FONT.hand", stack: FONT.hand },
  { name: "FONT.hudMono", stack: FONT.hudMono },
];

// The readouts are `.item` flex cells (not fixed); a paper strip mimics the HUD ground.
const stripStyle: CSSProperties = {
  background: STOCK.shell,
  border: `1px solid ${INK.black}`,
  padding: "10px 16px",
  display: "flex",
  gap: "20px",
  alignItems: "flex-start",
};

export function Catalog(): JSX.Element {
  return (
    <main
      style={{
        maxWidth: "1040px",
        margin: "0 auto",
        padding: "32px 24px 64px",
        color: INK.black,
        fontFamily: FONT.mono,
      }}
    >
      <header style={{ marginBottom: "36px" }}>
        <h1
          style={{
            fontFamily: FONT.display,
            fontSize: "30px",
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          muf — component catalog
        </h1>
        <p style={{ fontSize: "12px", opacity: 0.75, marginTop: "8px", lineHeight: 1.5 }}>
          Living design-system doc (ADR-0046). Print primitives + in-game HUD widgets, each with
          representative mock props and key variant states. Offline, separate Vite entry — never
          bundled into the game.
        </p>
      </header>

      <Section title="Tokens — colour">
        {SWATCH.map((s) => (
          <figure key={s.name} style={{ margin: 0, width: "104px" }}>
            <div
              style={{ height: "56px", background: s.value, border: `1px solid ${INK.black}` }}
            />
            <figcaption style={{ fontSize: "10px", marginTop: "4px", lineHeight: 1.4 }}>
              {s.name}
              <br />
              {s.value}
            </figcaption>
          </figure>
        ))}
      </Section>

      <Section title="Tokens — type">
        {TYPE_SPECIMENS.map((t) => (
          <Cell key={t.name} label={t.name} width={240}>
            <span style={{ fontFamily: t.stack, fontSize: "22px" }}>Paris 1998 — 42</span>
          </Cell>
        ))}
      </Section>

      <Section title="Print primitives">
        <Cell label="PaperSheet (stock.newsprint)" width={240}>
          <PaperSheet
            stock={STOCK.newsprint}
            fullBleed={false}
            style={{ width: "200px", height: "110px" }}
          >
            <div style={{ padding: "12px", fontFamily: FONT.mono, fontSize: "12px" }}>
              toner + halftone + fold
            </div>
          </PaperSheet>
        </Cell>

        <Cell label="HalftoneHero (belliard facade)" width={240}>
          <div
            style={{ position: "relative", width: "200px", height: "110px", overflow: "hidden" }}
          >
            <HalftoneHero src={`${import.meta.env.BASE_URL}assets/levels/belliard/facade.png`} />
          </div>
        </Cell>

        <Cell label="Stamp box / oval / diagonal">
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <Stamp label="FACILE" ink={MARK.green} shape="box" />
            <Stamp label="NORMAL" ink={MARK.orange} shape="oval" />
            <Stamp label="DIFFICILE" ink={MARK.pink} shape="diagonal" />
          </div>
        </Cell>

        <Cell label="Stamp struck">
          <Stamp label="VERROUILLÉ" ink={MARK.pink} shape="box" struck={true} />
        </Cell>

        <Cell label="MarkerCircle active / idle">
          <div
            style={{ display: "flex", gap: "28px", alignItems: "center", fontFamily: FONT.mono }}
          >
            <MarkerCircle active={true}>
              <span style={{ fontSize: "14px" }}>JOUER</span>
            </MarkerCircle>
            <MarkerCircle active={false}>
              <span style={{ fontSize: "14px" }}>OPTIONS</span>
            </MarkerCircle>
          </div>
        </Cell>

        <Cell label="TapeCorner (4 corners)" width={240}>
          <div
            style={{
              position: "relative",
              width: "150px",
              height: "80px",
              background: STOCK.rose,
              border: `1px solid ${INK.black}`,
            }}
          >
            <TapeCorner />
          </div>
        </Cell>
      </Section>

      <Section title="HUD — readouts (ticker strip)">
        <div style={stripStyle}>
          <ScoreReadout score={1240} isHighScore={false} />
          <ScoreReadout score={9990} isHighScore={true} />
          <WaveReadout wave={3} />
          <TimerReadout timeRemaining={92} />
          <TimerReadout timeRemaining={32} />
          <TimerReadout timeRemaining={11} />
          <LivesReadout lives={3} />
          <LivesReadout lives={1} />
          <EnergyGauge energy={100} />
          <EnergyGauge energy={45} />
          <EnergyGauge energy={14} />
        </div>
      </Section>

      <Section title="HUD — delivery banner">
        <Stage label="DELIVERING (integrity full)">
          <DeliveryIntegrityBanner
            delivery={{ phase: "DELIVERING", integrity: 100, integrityMax: 100 }}
          />
        </Stage>
        <Stage label="DELIVERING (integrity low)">
          <DeliveryIntegrityBanner
            delivery={{ phase: "DELIVERING", integrity: 18, integrityMax: 100 }}
          />
        </Stage>
        <Stage label="SUCCESS">
          <DeliveryIntegrityBanner
            delivery={{ phase: "SUCCESS", integrity: 100, integrityMax: 100 }}
          />
        </Stage>
        <Stage label="FAILED">
          <DeliveryIntegrityBanner
            delivery={{ phase: "FAILED", integrity: 0, integrityMax: 100 }}
          />
        </Stage>
      </Section>

      <Section title="HUD — hostage QTE overlay">
        <Stage label="OTAGE warning (ZOOMING)">
          <HostageQteOverlay hostageQte={{ phase: "ZOOMING", warning: true }} />
        </Stage>
        <Stage label="WON">
          <HostageQteOverlay hostageQte={{ phase: "WON", warning: false }} />
        </Stage>
        <Stage label="LOST">
          <HostageQteOverlay hostageQte={{ phase: "LOST", warning: false }} />
        </Stage>
      </Section>

      <Section title="HUD — off-screen arrows & phase stamps">
        <Stage label="OffscreenArrowIndicator (up+right active)">
          <OffscreenArrowIndicator
            targetIndicator={{ up: true, down: false, left: false, right: true }}
            topCentreOccupied={false}
          />
        </Stage>
        <Stage label="OffscreenArrowIndicator (up glyph aside — delivery call-out up)">
          <OffscreenArrowIndicator
            targetIndicator={{ up: true, down: false, left: false, right: true }}
            topCentreOccupied={true}
          />
        </Stage>
        <Stage label="PhaseMessageBanner — GAME_OVER">
          <PhaseMessageBanner phase="GAME_OVER" />
        </Stage>
        <Stage label="PhaseMessageBanner — LEVEL_COMPLETE">
          <PhaseMessageBanner phase="LEVEL_COMPLETE" />
        </Stage>
      </Section>

      <Section title="Controls — menu primitives">
        <Stage label="Overlay (fixed inset-0 flex-centre frame)">
          <Overlay style={{ background: "rgba(215,210,198,0.9)" }}>
            <div
              style={{
                border: `2px solid ${INK.black}`,
                background: STOCK.shell,
                padding: "12px 18px",
                fontFamily: FONT.mono,
                fontSize: "12px",
              }}
            >
              centred child
            </div>
          </Overlay>
        </Stage>

        <Cell label="SelectableListItem (active / idle)">
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <SelectableListItem active={true} style={SELECTABLE_DEMO}>
              NIVEAUX
            </SelectableListItem>
            <SelectableListItem active={false} style={SELECTABLE_DEMO}>
              SCORES
            </SelectableListItem>
          </div>
        </Cell>
      </Section>
    </main>
  );
}

// Demo-only styling for the SelectableListItem specimens (each real surface supplies
// its own tab/édition/ballot class; the primitive itself carries no visual).
const SELECTABLE_DEMO: CSSProperties = {
  padding: "8px 14px",
  background: "transparent",
  border: `1px solid ${INK.black}`,
  color: INK.black,
  fontFamily: FONT.mono,
  fontSize: "13px",
  letterSpacing: "0.2em",
  cursor: "pointer",
};
