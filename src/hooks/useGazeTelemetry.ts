import { useState, useEffect, useRef, useCallback } from "react";

export interface GazePoint {
  x: number;
  y: number;
  pupilLeft: number;
  pupilRight: number;
  confidence: number;
}

export interface DeviceMetrics {
  battery: number;
  fps: number;
}

export type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR"
  | "RECONNECTING";

export const TELEMETRY_MAGIC_HEADER = 101.0;
export const TELEMETRY_BYTE_LENGTH = 32;

/**
 * Robust Client-Side Gaze Telemetry Hook.
 * Supports live bidirectional WebSocket gaze streaming (JSON and binary 32-byte Float32Array frames)
 * with graceful fallback to client-side simulated tracking if offline.
 */
export function useGazeTelemetry(
  sessionId = "default_session",
  wsUrl?: string,
  enableSimulationFallback = true
) {
  const [gaze, setGaze] = useState<GazePoint>({
    x: 0.5,
    y: 0.5,
    pupilLeft: 3.8,
    pupilRight: 3.8,
    confidence: 1.0,
  });

  const [metrics, setMetrics] = useState<DeviceMetrics>({
    battery: 98,
    fps: 60,
  });

  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Initializing telemetry...");

  const wsRef = useRef<WebSocket | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSimulatingRef = useRef<boolean>(false);

  // Compute target WS URL
  const resolvedWsUrl = (() => {
    if (wsUrl) return wsUrl;
    const customWs = typeof import.meta !== "undefined" ? import.meta.env?.VITE_WS_URL : undefined;
    if (customWs) {
      return customWs.includes("/ws/gaze") ? customWs : `${customWs.replace(/\/+$/, "")}/ws/gaze/${sessionId}`;
    }
    const apiUrl = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_API_URL || "").trim() : "";
    if (apiUrl) {
      const clean = apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/+$/, "");
      const proto = clean.startsWith("https") ? "wss" : "ws";
      const host = clean.replace(/^https?:\/\//, "");
      return `${proto}://${host}/ws/gaze/${sessionId}`;
    }
    return `wss://foceye1-backend-only.onrender.com/ws/gaze/${sessionId}`;
  })();

  // Start simulation loop (used when WS is unavailable or disconnected)
  const startSimulation = useCallback(() => {
    if (isSimulatingRef.current) return;
    isSimulatingRef.current = true;
    let t = 0;

    const loop = () => {
      if (!isMountedRef.current || !isSimulatingRef.current) return;
      t += 0.03;

      // Smooth lissajous pursuit curve with micro-saccadic jitter
      const cx = 0.5 + Math.sin(t * 0.7) * 0.28 + (Math.random() - 0.5) * 0.015;
      const cy = 0.5 + Math.cos(t * 0.5) * 0.22 + (Math.random() - 0.5) * 0.015;
      const pupil = 3.8 + Math.sin(t * 0.2) * 0.15;

      setGaze({
        x: Math.max(0.05, Math.min(0.95, cx)),
        y: Math.max(0.05, Math.min(0.95, cy)),
        pupilLeft: Number(pupil.toFixed(2)),
        pupilRight: Number((pupil + (Math.random() - 0.5) * 0.05).toFixed(2)),
        confidence: 0.98,
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  const stopSimulation = useCallback(() => {
    isSimulatingRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Connect to WebSocket
  const connectWs = useCallback(() => {
    if (!resolvedWsUrl) return;

    try {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setStatus("CONNECTING");
      setStatusMessage("Connecting to real-time gaze telemetry...");
      const ws = new WebSocket(resolvedWsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("CONNECTED");
        setStatusMessage("Live WebSocket Telemetry (60 FPS)");
        setErrorMessage(null);
        stopSimulation();
      };

      ws.onmessage = (event: MessageEvent) => {
        if (!isMountedRef.current) return;

        // 1. Binary telemetry decoding (Float32Array 32-byte frame)
        if (event.data instanceof ArrayBuffer) {
          if (event.data.byteLength === TELEMETRY_BYTE_LENGTH) {
            const floats = new Float32Array(event.data);
            if (Math.abs(floats[0] - TELEMETRY_MAGIC_HEADER) < 0.1) {
              setGaze({
                x: Math.max(0, Math.min(1, floats[1])),
                y: Math.max(0, Math.min(1, floats[2])),
                pupilLeft: Number(floats[3].toFixed(2)),
                pupilRight: Number(floats[4].toFixed(2)),
                confidence: Number(floats[5].toFixed(2)),
              });
              setMetrics({
                fps: Math.round(floats[6]) || 60,
                battery: Math.round(floats[7]) || 100,
              });
            }
          }
          return;
        }

        // 2. JSON telemetry decoding
        if (typeof event.data === "string") {
          try {
            const data = JSON.parse(event.data);
            if (data.x !== undefined || data.gaze_x !== undefined) {
              setGaze({
                x: data.x ?? data.gaze_x ?? 0.5,
                y: data.y ?? data.gaze_y ?? 0.5,
                pupilLeft: data.pupilLeft ?? data.pupil_mm ?? data.pupil_left ?? 3.8,
                pupilRight: data.pupilRight ?? data.pupil_mm ?? data.pupil_right ?? 3.8,
                confidence: data.confidence ?? 1.0,
              });
            }
            if (data.fps !== undefined || data.battery !== undefined) {
              setMetrics((prev) => ({
                fps: data.fps ?? prev.fps,
                battery: data.battery ?? prev.battery,
              }));
            }
          } catch {
            // Ignore non-json text
          }
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setErrorMessage("WebSocket connection error. Using local fallback.");
        if (enableSimulationFallback) {
          setStatus("CONNECTED");
          setStatusMessage("Local Telemetry Active (Fallback Mode)");
          startSimulation();
        } else {
          setStatus("ERROR");
        }
      };

      ws.onclose = () => {
        if (!isMountedRef.current) return;
        if (enableSimulationFallback) {
          setStatus("CONNECTED");
          setStatusMessage("Local Telemetry Active (Fallback Mode)");
          startSimulation();
        } else {
          setStatus("DISCONNECTED");
          setStatusMessage("Disconnected");
        }
      };
    } catch {
      if (enableSimulationFallback) {
        setStatus("CONNECTED");
        setStatusMessage("Local Telemetry Active");
        startSimulation();
      }
    }
  }, [resolvedWsUrl, enableSimulationFallback, startSimulation, stopSimulation]);

  useEffect(() => {
    isMountedRef.current = true;
    connectWs();

    return () => {
      isMountedRef.current = false;
      stopSimulation();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWs, stopSimulation]);

  const connect = useCallback(() => {
    connectWs();
  }, [connectWs]);

  const disconnect = useCallback(() => {
    stopSimulation();
    if (wsRef.current) {
      wsRef.current.close();
    }
    setStatus("DISCONNECTED");
    setStatusMessage("Disconnected");
  }, [stopSimulation]);

  const sendGazePoint = useCallback(
    (point: Partial<GazePoint> & { fps?: number; battery?: number }) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(point));
        return true;
      }
      return false;
    },
    []
  );

  const sendBinaryTelemetry = useCallback(
    (x: number, y: number, pLeft = 3.8, pRight = 3.8, conf = 1.0, fps = 60, bat = 100) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const buffer = new ArrayBuffer(TELEMETRY_BYTE_LENGTH);
        const view = new Float32Array(buffer);
        view[0] = TELEMETRY_MAGIC_HEADER;
        view[1] = x;
        view[2] = y;
        view[3] = pLeft;
        view[4] = pRight;
        view[5] = conf;
        view[6] = fps;
        view[7] = bat;
        wsRef.current.send(buffer);
        return true;
      }
      return false;
    },
    []
  );

  const sendCommand = useCallback((command: Record<string, unknown>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
      return true;
    }
    return false;
  }, []);

  return {
    gaze,
    metrics,
    status,
    errorMessage,
    statusMessage,
    isConnected: status === "CONNECTED",
    connect,
    disconnect,
    sendGazePoint,
    sendBinaryTelemetry,
    sendCommand,
  };
}

