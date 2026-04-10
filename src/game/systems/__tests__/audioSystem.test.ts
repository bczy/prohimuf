import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockHowlInstance, mockHowler } = vi.hoisted(() => {
  const mockHowlInstance = {
    play: vi.fn(),
    stop: vi.fn(),
    playing: vi.fn(() => false),
    rate: vi.fn(),
    volume: vi.fn(),
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

  it("setTension(0) sets rate to 0.9 and volume to 0.4", () => {
    const audio = createAudioSystem();
    audio.setTension(0);
    expect(mockHowlInstance.rate).toHaveBeenCalledWith(0.9);
    expect(mockHowlInstance.volume).toHaveBeenCalledWith(0.4);
  });

  it("setTension(1) sets rate to 1.2 and volume to 0.8", () => {
    const audio = createAudioSystem();
    audio.setTension(1);
    expect(mockHowlInstance.rate).toHaveBeenCalledWith(expect.closeTo(1.2, 5));
    expect(mockHowlInstance.volume).toHaveBeenCalledWith(expect.closeTo(0.8, 5));
  });

  it("playBgm calls play when not already playing", () => {
    const audio = createAudioSystem();
    audio.playBgm();
    expect(mockHowlInstance.play).toHaveBeenCalled();
  });

  it("playBgm does not call play when already playing", () => {
    mockHowlInstance.playing.mockReturnValue(true);
    const audio = createAudioSystem();
    audio.playBgm();
    expect(mockHowlInstance.play).not.toHaveBeenCalled();
  });

  it("stopBgm calls stop", () => {
    const audio = createAudioSystem();
    audio.stopBgm();
    expect(mockHowlInstance.stop).toHaveBeenCalled();
  });

  it("dispose calls Howler.stop and Howler.unload", () => {
    const audio = createAudioSystem();
    audio.dispose();
    expect(mockHowler.stop).toHaveBeenCalled();
    expect(mockHowler.unload).toHaveBeenCalled();
  });
});
