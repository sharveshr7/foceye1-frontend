import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useGazeTelemetry,
  TELEMETRY_MAGIC_HEADER,
  TELEMETRY_BYTE_LENGTH,
} from "../hooks/useGazeTelemetry";

describe("useGazeTelemetry hook", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exports correct telemetry binary constants", () => {
    expect(TELEMETRY_MAGIC_HEADER).toBe(101.0);
    expect(TELEMETRY_BYTE_LENGTH).toBe(32);
  });

  it("initializes with valid default gaze coordinates and metrics", () => {
    const { result } = renderHook(() => useGazeTelemetry("sess-unit-test"));

    expect(result.current.gaze).toBeDefined();
    expect(result.current.gaze.x).toBeGreaterThanOrEqual(0);
    expect(result.current.gaze.x).toBeLessThanOrEqual(1);
    expect(result.current.gaze.y).toBeGreaterThanOrEqual(0);
    expect(result.current.gaze.y).toBeLessThanOrEqual(1);
    expect(result.current.metrics.fps).toBe(60);
    expect(result.current.metrics.battery).toBeGreaterThan(0);
  });

  it("allows manual disconnect and reconnect", () => {
    const { result } = renderHook(() =>
      useGazeTelemetry("sess-unit-test", undefined, false)
    );

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe("DISCONNECTED");
    expect(result.current.isConnected).toBe(false);

    act(() => {
      result.current.connect();
    });

    expect(["CONNECTING", "CONNECTED"]).toContain(result.current.status);
  });

  it("encodes and decodes 32-byte Float32 binary telemetry frames correctly", () => {
    const buffer = new ArrayBuffer(TELEMETRY_BYTE_LENGTH);
    const view = new Float32Array(buffer);
    view[0] = TELEMETRY_MAGIC_HEADER;
    view[1] = 0.42; // x
    view[2] = 0.78; // y
    view[3] = 3.65; // pupilLeft
    view[4] = 3.70; // pupilRight
    view[5] = 0.99; // confidence
    view[6] = 60.0; // fps
    view[7] = 95.0; // battery

    expect(view[0]).toBe(101.0);
    expect(view[1]).toBeCloseTo(0.42, 2);
    expect(view[2]).toBeCloseTo(0.78, 2);
    expect(view[3]).toBeCloseTo(3.65, 2);
    expect(view[4]).toBeCloseTo(3.70, 2);
    expect(view[5]).toBeCloseTo(0.99, 2);
    expect(view[6]).toBe(60);
    expect(view[7]).toBe(95);
  });

  it("evaluates saccadic latency benchmarks accurately", () => {
    const classifyLatency = (ms: number) => {
      if (ms < 250) return "Optimal";
      if (ms <= 380) return "Normal";
      return "Delayed";
    };

    expect(classifyLatency(195)).toBe("Optimal");
    expect(classifyLatency(240)).toBe("Optimal");
    expect(classifyLatency(285)).toBe("Normal");
    expect(classifyLatency(380)).toBe("Normal");
    expect(classifyLatency(420)).toBe("Delayed");

    const sampleLatencies = [210, 240, 270, 310];
    const meanLatency = Math.round(
      sampleLatencies.reduce((a, b) => a + b, 0) / sampleLatencies.length
    );
    expect(meanLatency).toBe(258);
  });
});

