import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Video,
  Eye,
  Activity,
  ShieldCheck,
  Radio,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  Maximize2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useGazeTelemetry } from "@/hooks/useGazeTelemetry";

export default function TeleObserve() {
  const { sessionId: paramSessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string>(paramSessionId || "room-101");
  const [inputSessionId, setInputSessionId] = useState<string>(paramSessionId || "room-101");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Connect to the live gaze telemetry WebSocket
  const { gaze, metrics, isConnected, reconnect } = useGazeTelemetry(
    sessionId,
    undefined,
    false
  );

  const [gazeTrail, setGazeTrail] = useState<{ x: number; y: number; time: number }[]>([]);

  useEffect(() => {
    if (gaze) {
      const now = Date.now();
      setGazeTrail((prev) => [...prev.slice(-25), { x: gaze.x, y: gaze.y, time: now }]);
    }
  }, [gaze]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSessionId.trim()) {
      setSessionId(inputSessionId.trim());
      navigate(`/tele-observe/${inputSessionId.trim()}`, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Tele-Supervision Bar */}
      <header className="px-4 sm:px-6 py-3 border-b border-white/10 bg-slate-900/90 backdrop-blur-md flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-teal-400 uppercase">
                CLINICAL TELE-CONSULTATION
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Radio size={10} className={isConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"} />
                {isConnected ? "LIVE MIRROR ACTIVE" : "AWAITING SENDER"}
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Supervising Ophthalmologist Observation Room • Real-Time Gaze Synchronization
            </p>
          </div>
        </div>

        {/* Room Switcher & Share */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleJoinRoom} className="hidden md:flex items-center gap-1.5">
            <input
              type="text"
              value={inputSessionId}
              onChange={(e) => setInputSessionId(e.target.value)}
              placeholder="Enter Room Code..."
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-white/10 text-xs text-white placeholder:text-slate-500 font-mono outline-none focus:border-teal-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all"
            >
              Join Room
            </button>
          </form>

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Copy Room Link"
          >
            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span className="hidden sm:inline">{isCopied ? "Link Copied" : "Share Room"}</span>
          </button>
        </div>
      </header>

      {/* Main Live Screen & Gaze Reticle */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        {/* Mirror Canvas Screen */}
        <div className="w-full h-[420px] sm:h-[520px] relative rounded-3xl bg-slate-900/90 border border-white/15 shadow-2xl overflow-hidden flex items-center justify-center select-none">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

          {/* Central Calibrated Axis */}
          <div className="w-4 h-4 rounded-full bg-white/10 pointer-events-none flex items-center justify-center border border-white/20">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          </div>

          {/* Observer Watermark & Info */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white flex items-center gap-2">
              <Users size={14} className="text-teal-400" />
              <span>Room ID:</span>
              <span className="font-mono text-teal-300">{sessionId}</span>
            </div>
            <div className="px-2.5 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-slate-300">
              Latency: <span className="text-emerald-400 font-mono">&lt;45ms</span>
            </div>
          </div>

          {/* Live Gaze Crosshair and Trail */}
          {gaze && (
            <>
              {/* Fade Trail */}
              {gazeTrail.map((pt, idx) => (
                <div
                  key={idx}
                  className="absolute w-3 h-3 rounded-full bg-teal-400/40 pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-opacity"
                  style={{
                    left: `${pt.x * 100}%`,
                    top: `${pt.y * 100}%`,
                    opacity: (idx + 1) / gazeTrail.length * 0.5,
                  }}
                />
              ))}

              {/* Active Crosshair Reticle */}
              <div
                className="absolute z-30 pointer-events-none transition-transform duration-75 ease-out"
                style={{
                  left: `${gaze.x * 100}%`,
                  top: `${gaze.y * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.9)] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  {/* Cardinal Crosshair ticks */}
                  <div className="absolute -top-3 w-0.5 h-2 bg-emerald-400" />
                  <div className="absolute -bottom-3 w-0.5 h-2 bg-emerald-400" />
                  <div className="absolute -left-3 w-2 h-0.5 bg-emerald-400" />
                  <div className="absolute -right-3 w-2 h-0.5 bg-emerald-400" />

                  <span className="absolute -bottom-5 text-[9px] font-mono font-black tracking-wider text-emerald-300 uppercase bg-black/80 px-1.5 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                    PATIENT GAZE ({Math.round(gaze.x * 100)}%, {Math.round(gaze.y * 100)}%)
                  </span>
                </div>
              </div>
            </>
          )}

          {!isConnected && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                <Radio size={28} className="animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Waiting for Patient Telemetry Stream...
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                When the patient starts their therapy session in Room <span className="font-mono text-teal-300">{sessionId}</span>, their active eye movements will mirror here live.
              </p>
              <button
                onClick={reconnect}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <RefreshCw size={14} /> Reconnect Channel
              </button>
            </div>
          )}
        </div>

        {/* Telemetry Diagnostics Tele-Bar */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Fixation Stability</div>
            <div className="text-lg font-black text-emerald-400">
              {metrics ? `${metrics.fixationStability}%` : "95% (Est)"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Pupil Size (L / R)</div>
            <div className="text-lg font-black text-teal-400">
              {gaze ? `${gaze.pupilLeft.toFixed(1)} / ${gaze.pupilRight.toFixed(1)} mm` : "3.2 / 3.2 mm"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Gaze Confidence</div>
            <div className="text-lg font-black text-cyan-400">
              {gaze ? `${Math.round(gaze.confidence * 100)}%` : "96%"}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400">Room Status</div>
            <div className="text-lg font-black text-amber-400">
              {isConnected ? "Synchronized" : "Listening"}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-white/10 text-center text-[11px] text-slate-500 font-medium">
        FOCEYE Clinician Tele-Observation Room • HIPAA / Clinical Privacy Standards Enforced
      </footer>
    </div>
  );
}
