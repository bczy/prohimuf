import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockHowlInstance, mockHowler } = vi.hoisted(() => {
  const mockHowlInstance = {
    play: vi.fn(),
    stop: vi.fn(),
    playing: vi.fn(() => false),
    rate: vi.fn(),
    volume: vi.fn(() => 0),
    fade: vi.fn(),
  };
  const mockHowler = {
    stop: vi.fn(),
    unload: vi.fn(),
  };
  return { mockHowlInstance, mockHowler };
});

vi.mock("howler", () => ({
  Howl: vi.fn(() => mockHowlInstance),
  Howler: mockHowler,
}));

import { createAudioSystem } from "@game/systems/audioSystem";

describe("createAudioSystem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHowlInstance.playing.mockReturnValue(false);
  });

  it("returns an object with all required methods", () => {
    const audio = createAudioSystem();
    expect(typeof audio.playBgm).toBe("function");
    expect(typeof audio.stopBgm).toBe("function");
    expect(typeof audio.setTension).toBe("function");
    expect(typeof audio.playSfx).toBe("function");
    expect(typeof audio.dispose).toBe("function");
  });

  it("setTension(0) does not crash", () => {
    const audio = createAudioSystem();
    expect(() => {
      audio.setTension(0);
    }).not.toThrow();
  });

  it("setTension(1) does not crash", () => {
    const audio = createAudioSystem();
    expect(() => {
      audio.setTension(1);
    }).not.toThrow();
  });

  it("setTension(0) triggers crossfade (fade called)", () => {
    const audio = createAudioSystem();
    audio.setTension(0);
    expect(mockHowlInstance.fade).toHaveBeenCalled();
  });

  it("setTension(1) triggers crossfade to danger tier", () => {
    const audio = createAudioSystem();
    audio.setTension(1);
    expect(mockHowlInstance.fade).toHaveBeenCalled();
  });

  it("setTension adjusts rate on current track", () => {
    const audio = createAudioSystem();
    audio.playBgm();
    audio.setTension(0.5);
    expect(mockHowlInstance.rate).toHaveBeenCalled();
  });

  it("playBgm calls play when not already playing", () => {
    const audio = createAudioSystem();
    audio.playBgm();
    expect(mockHowlInstance.play).toHaveBeenCalled();
  });

  it("playBgm does not call play when already playing", () => {
    mockHowlInstance.playing.mockReturnValue(true);
    const audio = createAudioSystem();
    // First playBgm starts tier 0 — play is called once (not playing → play)
    audio.playBgm();
    vi.clearAllMocks();
    mockHowlInstance.playing.mockReturnValue(true);
    // Second call — same tier, crossfadeTo no-ops
    audio.playBgm();
    expect(mockHowlInstance.play).not.toHaveBeenCalled();
  });

  it("stopBgm calls fade on all tracks", () => {
    const audio = createAudioSystem();
    audio.stopBgm();
    expect(mockHowlInstance.fade).toHaveBeenCalled();
  });

  it("dispose calls Howler.stop and Howler.unload", () => {
    const audio = createAudioSystem();
    audio.dispose();
    expect(mockHowler.stop).toHaveBeenCalled();
    expect(mockHowler.unload).toHaveBeenCalled();
  });
});
