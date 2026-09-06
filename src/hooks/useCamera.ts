import { useState, useEffect, useRef, useCallback } from "react";

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export type CameraFacingMode = "user" | "environment";
export type CameraPermissionState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export interface UseCameraOptions {
  autoStart?: boolean;
  facingMode?: CameraFacingMode;
  preferredDeviceId?: string;
  idealWidth?: number;
  idealHeight?: number;
}

export function useCamera(options: UseCameraOptions = {}) {
  const {
    autoStart = false,
    facingMode = "user",
    preferredDeviceId,
    idealWidth = 1280,
    idealHeight = 720,
  } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permission, setPermission] = useState<CameraPermissionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | undefined>(preferredDeviceId);
  const [currentFacingMode, setCurrentFacingMode] = useState<CameraFacingMode>(facingMode);
  const [isReady, setIsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop active stream tracks safely
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore track stop error
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStream(null);
    setIsReady(false);
  }, []);

  // Enumerate video devices
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((d) => d.kind === "videoinput")
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${index + 1}`,
        }));
      setDevices(videoDevices);
    } catch {
      // ignore enumeration errors
    }
  }, []);

  // Request & start camera stream
  const startCamera = useCallback(
    async (overrideFacingMode?: CameraFacingMode, overrideDeviceId?: string) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermission("unsupported");
        setError("Camera access is not supported by your browser or environment.");
        return;
      }

      stopCamera();
      setPermission("requesting");
      setError(null);

      const targetFacingMode = overrideFacingMode ?? currentFacingMode;
      const targetDeviceId = overrideDeviceId ?? activeDeviceId;

      const isMobileClient =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
      const targetWidth = isMobileClient ? Math.min(idealWidth, 640) : idealWidth;
      const targetHeight = isMobileClient ? Math.min(idealHeight, 480) : idealHeight;

      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId
          ? {
              deviceId: { exact: targetDeviceId },
              width: { ideal: targetWidth },
              height: { ideal: targetHeight },
            }
          : {
              facingMode: targetFacingMode,
              width: { ideal: targetWidth },
              height: { ideal: targetHeight },
            },
      };

      try {
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);
        setPermission("granted");
        setError(null);
        setCurrentFacingMode(targetFacingMode);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            void videoRef.current?.play().catch(() => {});
            setIsReady(true);
          };
        } else {
          setIsReady(true);
        }

        await refreshDevices();
      } catch (err: unknown) {
        stopCamera();
        const domErr = err as { name?: string; message?: string };
        if (domErr.name === "NotAllowedError" || domErr.name === "PermissionDeniedError") {
          setPermission("denied");
          setError("Camera permission was denied. Please allow camera access in your browser settings.");
        } else if (domErr.name === "NotFoundError" || domErr.name === "DevicesNotFoundError") {
          setPermission("unsupported");
          setError("No camera device found on this system.");
        } else if (domErr.name === "NotReadableError" || domErr.name === "TrackStartError") {
          setPermission("denied");
          setError("Camera is currently in use by another application.");
        } else {
          setPermission("denied");
          setError(domErr.message || "Failed to initialize camera.");
        }
      }
    },
    [activeDeviceId, currentFacingMode, idealHeight, idealWidth, refreshDevices, stopCamera]
  );

  // Switch facing mode (e.g. front vs back on mobile)
  const flipCamera = useCallback(async () => {
    const nextMode: CameraFacingMode = currentFacingMode === "user" ? "environment" : "user";
    setActiveDeviceId(undefined);
    await startCamera(nextMode, undefined);
  }, [currentFacingMode, startCamera]);

  // Switch specific device
  const switchDevice = useCallback(
    async (deviceId: string) => {
      setActiveDeviceId(deviceId);
      await startCamera(undefined, deviceId);
    },
    [startCamera]
  );

  // Capture current video frame to canvas / base64 image
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !isReady) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  }, [isReady]);

  // Attach video ref handler
  const setVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && streamRef.current) {
        node.srcObject = streamRef.current;
        node.onloadedmetadata = () => {
          void node.play().catch(() => {});
          setIsReady(true);
        };
      }
    },
    []
  );

  useEffect(() => {
    if (autoStart) {
      void startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef: setVideoRef,
    rawVideoRef: videoRef,
    stream,
    isReady,
    permission,
    error,
    devices,
    activeDeviceId,
    currentFacingMode,
    startCamera,
    stopCamera,
    flipCamera,
    switchDevice,
    captureFrame,
    refreshDevices,
  };
}
