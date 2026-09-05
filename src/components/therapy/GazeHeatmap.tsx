import React, { useRef, useEffect, useState } from "react";
import { Eye, Layers, Compass, Target, Sparkles } from "lucide-react";

export interface GazePoint {
  x: number; // Normalized 0.0 to 1.0
  y: number; // Normalized 0.0 to 1.0
  t?: number;
}

interface GazeHeatmapProps {
  points: GazePoint[];
  width?: number;
  height?: number;
  showBCEA?: boolean;
  showQuadrants?: boolean;
  className?: string;
  title?: string;
}

export const GazeHeatmap: React.FC<GazeHeatmapProps> = ({
  points,
  width = 440,
  height = 300,
  showBCEA = true,
  showQuadrants = true,
  className = "",
  title = "2D Gaze Fixation Density Heatmap",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [viewMode, setViewMode] = useState<"heatmap" | "trail">("heatmap");

  // Calculate Quadrant percentages & BCEA
  const validPoints = points.filter((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
  const total = Math.max(1, validPoints.length);

  let centerCount = 0;
  let tlCount = 0;
  let trCount = 0;
  let blCount = 0;
  let brCount = 0;

  validPoints.forEach((p) => {
    // Central foveal window (0.35 to 0.65)
    if (p.x >= 0.35 && p.x <= 0.65 && p.y >= 0.35 && p.y <= 0.65) {
      centerCount++;
    } else if (p.x < 0.5 && p.y < 0.5) {
      tlCount++;
    } else if (p.x >= 0.5 && p.y < 0.5) {
      trCount++;
    } else if (p.x < 0.5 && p.y >= 0.5) {
      blCount++;
    } else {
      brCount++;
    }
  });

  const centerPct = Math.round((centerCount / total) * 100);
  const tlPct = Math.round((tlCount / total) * 100);
  const trPct = Math.round((trCount / total) * 100);
  const blPct = Math.round((blCount / total) * 100);
  const brPct = Math.round((brCount / total) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Dark Screen Background
    ctx.fillStyle = "#0c121e";
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 40; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 40; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (validPoints.length === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No gaze telemetry points recorded", width / 2, height / 2);
      return;
    }

    if (viewMode === "heatmap") {
      // 2. Render Gaussian Density Heatmap
      // Create offscreen buffer for alpha intensity
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      const radius = 28;
      validPoints.forEach((pt) => {
        const px = pt.x * width;
        const py = pt.y * height;
        const grad = offCtx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0, "rgba(0, 0, 0, 0.18)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        offCtx.fillStyle = grad;
        offCtx.beginPath();
        offCtx.arc(px, py, radius, 0, Math.PI * 2);
        offCtx.fill();
      });

      // Colorize the density map using optical spectral ramp
      const imgData = offCtx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const output = ctx.createImageData(width, height);
      const outData = output.data;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha > 0) {
          const norm = alpha / 255;
          let r = 0;
          let g = 0;
          let b = 0;
          const a = Math.min(240, alpha * 2.2);

          if (norm < 0.25) {
            // Blue -> Cyan
            const t = norm / 0.25;
            r = Math.floor(20 * (1 - t) + 0 * t);
            g = Math.floor(100 * (1 - t) + 200 * t);
            b = Math.floor(240 * (1 - t) + 255 * t);
          } else if (norm < 0.55) {
            // Cyan -> Emerald
            const t = (norm - 0.25) / 0.3;
            r = Math.floor(0 * (1 - t) + 16 * t);
            g = Math.floor(200 * (1 - t) + 220 * t);
            b = Math.floor(255 * (1 - t) + 120 * t);
          } else if (norm < 0.8) {
            // Emerald -> Amber
            const t = (norm - 0.55) / 0.25;
            r = Math.floor(16 * (1 - t) + 250 * t);
            g = Math.floor(220 * (1 - t) + 180 * t);
            b = Math.floor(120 * (1 - t) + 20 * t);
          } else {
            // Amber -> Vibrant Hot Red
            const t = (norm - 0.8) / 0.2;
            r = Math.floor(250 * (1 - t) + 255 * t);
            g = Math.floor(180 * (1 - t) + 50 * t);
            b = Math.floor(20 * (1 - t) + 50 * t);
          }

          outData[i] = r;
          outData[i + 1] = g;
          outData[i + 2] = b;
          outData[i + 3] = a;
        }
      }

      ctx.putImageData(output, 0, 0);
    } else {
      // 2b. Trail View (Trajectory Vectors)
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "rgba(20, 184, 166, 0.6)";
      ctx.beginPath();
      validPoints.forEach((pt, idx) => {
        const px = pt.x * width;
        const py = pt.y * height;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Draw point markers
      validPoints.forEach((pt, idx) => {
        if (idx % 3 === 0) {
          const px = pt.x * width;
          const py = pt.y * height;
          ctx.fillStyle = idx === validPoints.length - 1 ? "#ef4444" : "#14b8a6";
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // 3. BCEA 68% Foveal Dispersion Ellipse Overlay
    if (showBCEA && validPoints.length > 5) {
      const meanX = (validPoints.reduce((s, p) => s + p.x, 0) / validPoints.length) * width;
      const meanY = (validPoints.reduce((s, p) => s + p.y, 0) / validPoints.length) * height;

      let varX = 0;
      let varY = 0;
      validPoints.forEach((p) => {
        const dx = p.x * width - meanX;
        const dy = p.y * height - meanY;
        varX += dx * dx;
        varY += dy * dy;
      });
      const radiusX = Math.max(14, Math.sqrt(varX / validPoints.length) * 1.5);
      const radiusY = Math.max(14, Math.sqrt(varY / validPoints.length) * 1.5);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(meanX, meanY, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center crosshair
      ctx.strokeStyle = "#14b8a6";
      ctx.beginPath();
      ctx.moveTo(meanX - 6, meanY);
      ctx.lineTo(meanX + 6, meanY);
      ctx.moveTo(meanX, meanY - 6);
      ctx.lineTo(meanX, meanY + 6);
      ctx.stroke();
    }

    // 4. Quadrant Guidelines
    if (showQuadrants) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [points, width, height, viewMode, showBCEA, showQuadrants]);

  return (
    <div className={`card-soft p-4 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Eye size={14} className="text-primary" /> {title}
        </h4>
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border">
          <button
            onClick={() => setViewMode("heatmap")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              viewMode === "heatmap" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setViewMode("trail")}
            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
              viewMode === "trail" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Trail
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative rounded-2xl overflow-hidden border border-border/80 shadow-inner flex items-center justify-center bg-black">
        <canvas ref={canvasRef} width={width} height={height} className="w-full h-auto max-h-[280px]" />

        {/* Quadrant Legend Badges */}
        {showQuadrants && (
          <>
            <span className="absolute top-2 left-2 text-[9px] font-mono text-white/60 bg-black/60 px-1.5 py-0.5 rounded">
              TL: {tlPct}%
            </span>
            <span className="absolute top-2 right-2 text-[9px] font-mono text-white/60 bg-black/60 px-1.5 py-0.5 rounded">
              TR: {trPct}%
            </span>
            <span className="absolute bottom-2 left-2 text-[9px] font-mono text-white/60 bg-black/60 px-1.5 py-0.5 rounded">
              BL: {blPct}%
            </span>
            <span className="absolute bottom-2 right-2 text-[9px] font-mono text-white/60 bg-black/60 px-1.5 py-0.5 rounded">
              BR: {brPct}%
            </span>
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 bg-black/80 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-lg pointer-events-none">
              Center: {centerPct}%
            </span>
          </>
        )}
      </div>

      {/* Dispersion Metrics Footer */}
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
        <div className="bg-muted/40 p-2 rounded-xl border border-border/60">
          <p className="text-muted-foreground text-[9px] font-bold uppercase">Center Fixation</p>
          <p className="font-extrabold text-foreground">{centerPct}%</p>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/60">
          <p className="text-muted-foreground text-[9px] font-bold uppercase">BCEA Contour</p>
          <p className="font-extrabold text-primary">68% Area</p>
        </div>
        <div className="bg-muted/40 p-2 rounded-xl border border-border/60">
          <p className="text-muted-foreground text-[9px] font-bold uppercase">Sampled Frames</p>
          <p className="font-extrabold text-foreground">{validPoints.length}</p>
        </div>
      </div>
    </div>
  );
};
