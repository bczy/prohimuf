import { describe, it, expect } from "vitest";
import { isMobileUA } from "@utils/platform";

const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_CLASSIC =
  "Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1";
const DESKTOP_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
const MACOS_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";

describe("isMobileUA", () => {
  it("detects Android Chrome", () => {
    expect(isMobileUA(ANDROID_CHROME)).toBe(true);
  });

  it("detects iPhone Safari", () => {
    expect(isMobileUA(IPHONE_SAFARI)).toBe(true);
  });

  it("detects iPads that still announce themselves", () => {
    expect(isMobileUA(IPAD_CLASSIC)).toBe(true);
  });

  it("rejects desktop Chrome", () => {
    expect(isMobileUA(DESKTOP_CHROME)).toBe(false);
  });

  it("rejects macOS Safari — which also means iPadOS in desktop-UA mode (documented ADR-0003 limitation)", () => {
    expect(isMobileUA(MACOS_SAFARI)).toBe(false);
  });
});
