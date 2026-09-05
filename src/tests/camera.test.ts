import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCamera } from "../hooks/useCamera";

describe("useCamera hook", () => {
  beforeEach(() => {
    // Mock navigator.mediaDevices
    const mockMediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [
          {
            stop: vi.fn(),
          },
        ],
      }),
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          deviceId: "cam-1",
          kind: "videoinput",
          label: "FaceTime HD Camera",
        },
      ]),
    };

    Object.defineProperty(global.navigator, "mediaDevices", {
      value: mockMediaDevices,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with idle permission state by default", () => {
    const { result } = renderHook(() => useCamera({ autoStart: false }));
    expect(result.current.permission).toBe("idle");
    expect(result.current.isReady).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("requests camera stream and updates permission state on startCamera", async () => {
    const { result } = renderHook(() => useCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.permission).toBe("granted");
    expect(result.current.stream).not.toBeNull();
    expect(result.current.devices.length).toBe(1);
    expect(result.current.devices[0].deviceId).toBe("cam-1");
  });

  it("stops media tracks properly on stopCamera", async () => {
    const { result } = renderHook(() => useCamera({ autoStart: false }));

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.stream).not.toBeNull();

    act(() => {
      result.current.stopCamera();
    });
    expect(result.current.stream).toBeNull();
    expect(result.current.isReady).toBe(false);
  });
});
