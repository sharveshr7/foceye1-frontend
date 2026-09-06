import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  Maximize,
  Minimize,
  SunMedium,
  Moon,
  Zap,
  CheckCircle2,
  AlertCircle,
  Target,
  Crosshair,
} from "lucide-react";
import type { TherapyExercise } from "@/lib/therapies";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";
import { soundEffects } from "@/utils/audioSynth";
import { voiceCoach, type GazeEvaluation } from "@/utils/voiceCoach";

export interface TherapyCanvasProps {
  exercise: TherapyExercise;
  isPlaying: boolean;
  timeLeft: number;
  gazeFrame?: EyeTrackingFrame | null;
  pediatricMode?: boolean;
  pediatricTheme?: "space" | "safari" | "ocean" | "magic";
  onMetricUpdate?: (metrics: { accuracy: number; blinks: number; confidence: number; hits: number }) => void;
  onGazePoint?: (pt: { x: number; y: number }) => void;
}

export const TherapyCanvas: React.FC<TherapyCanvasProps> = ({
  exercise,
  isPlaying,
  timeLeft,
  gazeFrame,
  pediatricMode = false,
  pediatricTheme = "space",
  onMetricUpdate,
  onGazePoint,
}) => {
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [hits, setHits] = useState(0);
  const [streak, setStreak] = useState(0);
  const [flashPosition, setFlashPosition] = useState<{ x: number; y: number } | null>(null);
  const [convergenceDepth, setConvergenceDepth] = useState(1);
  const [hitFeedback, setHitFeedback] = useState<{ id: number; x: number; y: number }[]>([]);

  // Live Eye Tracking & Biofeedback States
  const [isGazeLocked, setIsGazeLocked] = useState(false);
  const [gazeDistancePx, setGazeDistancePx] = useState(0);
  const [gazeLockScore, setGazeLockScore] = useState(85);
  const [fixationHoldProgress, setFixationHoldProgress] = useState(0);
  const [detectedBlinksCount, setDetectedBlinksCount] = useState(0);

  // Synchronized Voice Coach Biofeedback States
  const [coachFeedback, setCoachFeedback] = useState<GazeEvaluation | null>(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => voiceCoach.getMuted());

  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const lastBlinkStateRef = useRef<boolean>(false);
  const lastChimeTimeRef = useRef<number>(0);

  // Initial Voice Cue on session launch
  useEffect(() => {
    if (isPlaying && exercise) {
      if (exercise.id === "blink-master") {
        voiceCoach.speak("Blink your eyes completely on each cue.");
      } else if (exercise.id === "focus-hold") {
        voiceCoach.speak("Look straight ahead and keep your head still.");
      } else if (exercise.id === "reaction-speed" || exercise.id === "saccade-jumps") {
        voiceCoach.speak("Look at the target as quickly as possible.");
      } else {
        voiceCoach.speak("Follow the moving target.");
      }
    }
  }, [isPlaying, exercise.id]);

  // Saccadic Latency & Reaction Measurement States (in milliseconds)
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const targetSpawnTimeRef = useRef<number>(performance.now());

  // Toggle audio chime mute
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  // Trigger manual or automatic gaze hit with reaction latency calculation
  const handleTargetHit = useCallback((screenX?: number, screenY?: number) => {
    if (!isPlaying) return;
    const now = performance.now();
    const elapsedMs = Math.round(now - targetSpawnTimeRef.current);
    
    // Only register plausible reaction times (>= 80ms)
    if (elapsedMs >= 80) {
      setLastLatencyMs(elapsedMs);
      setLatencyHistory((prev) => [...prev.slice(-19), elapsedMs]);
    }

    setHits((prev) => prev + 1);
    setStreak((prev) => prev + 1);
    soundEffects.playTargetCatch();

    if (screenX && screenY && containerRef.current) {
      const newHit = { id: Date.now(), x: screenX, y: screenY };
      setHitFeedback((prev) => [...prev.slice(-4), newHit]);
      setTimeout(() => {
        setHitFeedback((prev) => prev.filter((h) => h.id !== newHit.id));
      }, 600);
    }
  }, [isPlaying]);

  // Keyboard spacebar listener for reaction exercises
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isPlaying) {
        e.preventDefault();
        handleTargetHit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, handleTargetHit]);

  // 1. Saccades & Peripheral flash generator with millisecond timing
  useEffect(() => {
    if (!isPlaying) return;

    if (
      exercise.id === "reaction-speed" ||
      exercise.id === "peripheral-vision" ||
      exercise.id === "saccade-jumps"
    ) {
      const spawnTarget = () => {
        const x = Math.floor(15 + Math.random() * 70);
        const y = Math.floor(18 + Math.random() * 64);
        setFlashPosition({ x, y });
        targetPosRef.current = { x: x / 100, y: y / 100 };
        targetSpawnTimeRef.current = performance.now();
      };

      spawnTarget();
      const interval = setInterval(spawnTarget, Math.max(1600, 3200 / speed));
      return () => clearInterval(interval);
    }
  }, [isPlaying, speed, exercise.id]);

  // 2. Continuous Real-Time Eye & Gaze Tracking Integration Loop
  useEffect(() => {
    if (!isPlaying || !gazeFrame || !containerRef.current) return;

    // Accumulate gaze points for 2D heatmap
    if (onGazePoint) {
      onGazePoint({ x: gazeFrame.gazeX, y: gazeFrame.gazeY });
    }

    const rect = containerRef.current.getBoundingClientRect();
    const gazePixelX = gazeFrame.gazeX * rect.width;
    const gazePixelY = gazeFrame.gazeY * rect.height;

    // Calculate current target screen coordinates
    let targetPixelX = rect.width * 0.5;
    let targetPixelY = rect.height * 0.5;

    if (exercise.id === "target-tracking" || exercise.id === "circular-tracking" || exercise.id === "figure-eight") {
      // Dynamic orbital position based on timestamp
      const now = performance.now() / 1000;
      const angle = (now * (0.8 * speed)) % (Math.PI * 2);
      const orbitRadiusX = Math.min(180, rect.width * 0.28);
      const orbitRadiusY = Math.min(90, rect.height * 0.20);
      targetPixelX = rect.width * 0.5 + Math.sin(angle) * orbitRadiusX;
      targetPixelY = rect.height * 0.5 + Math.cos(angle * 2) * (orbitRadiusY * 0.6);
      targetPosRef.current = { x: targetPixelX / rect.width, y: targetPixelY / rect.height };
    } else if (flashPosition) {
      targetPixelX = (flashPosition.x / 100) * rect.width;
      targetPixelY = (flashPosition.y / 100) * rect.height;
    }

    // Measure Euclidean distance between gaze cursor and target center
    const dx = gazePixelX - targetPixelX;
    const dy = gazePixelY - targetPixelY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    setGazeDistancePx(Math.round(distance));

    // Synchronized Voice Coaching & Directional Guidance
    const normTargetX = targetPixelX / rect.width;
    const normTargetY = targetPixelY / rect.height;
    const evalResult = voiceCoach.evaluateGazeAndCoach(
      normTargetX,
      normTargetY,
      gazeFrame.gazeX,
      gazeFrame.gazeY,
      gazeFrame.confidence,
      gazeFrame.isBlinking
    );
    setCoachFeedback(evalResult);

    // Determine lock threshold based on exercise mode
    const lockThreshold = exercise.id === "focus-hold" ? 75 : 95;
    const locked = distance < lockThreshold;
    setIsGazeLocked(locked);

    const nowTime = performance.now();

    // A. Focus Hold Fixation Charging
    if (exercise.id === "focus-hold" || exercise.id === "fusion-circles") {
      if (locked) {
        setFixationHoldProgress((prev) => Math.min(100, prev + 1.2));
        if (nowTime - lastChimeTimeRef.current > 1800) {
          soundEffects.playStreakChime(Math.floor(fixationHoldProgress / 20));
          lastChimeTimeRef.current = nowTime;
        }
      } else {
        setFixationHoldProgress((prev) => Math.max(0, prev - 0.6));
      }
    }

    // B. Target Tracking Lock Audio & Score
    if (exercise.id === "target-tracking" || exercise.id === "circular-tracking") {
      if (locked) {
        setGazeLockScore((prev) => Math.min(99, prev + 0.3));
        if (nowTime - lastChimeTimeRef.current > 2200) {
          soundEffects.playTargetCatch();
          lastChimeTimeRef.current = nowTime;
        }
      } else {
        setGazeLockScore((prev) => Math.max(60, prev - 0.2));
      }
    }

    // C. Saccade Flash Auto-Hit on Gaze Arrival
    if (flashPosition && distance < 85) {
      handleTargetHit(targetPixelX, targetPixelY);
      // Spawn new flash position
      const x = Math.floor(15 + Math.random() * 70);
      const y = Math.floor(18 + Math.random() * 64);
      setFlashPosition({ x, y });
      targetPosRef.current = { x: x / 100, y: y / 100 };
      targetSpawnTimeRef.current = performance.now();
    }

    // D. Real-Time Blink Tracking for Blink Master
    if (gazeFrame.isBlinking && !lastBlinkStateRef.current) {
      lastBlinkStateRef.current = true;
      setDetectedBlinksCount((prev) => prev + 1);
      soundEffects.playSoftClick();
    } else if (!gazeFrame.isBlinking) {
      lastBlinkStateRef.current = false;
    }

    // Calculate running average saccadic latency
    const avgLatency =
      latencyHistory.length > 0
        ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length)
        : undefined;

    // Send updated metrics to parent
    if (onMetricUpdate) {
      onMetricUpdate({
        accuracy: Math.round(gazeLockScore),
        blinks: gazeFrame.blinkRatePerMin,
        confidence: Math.round(gazeFrame.confidence * 100),
        hits,
        saccadicLatencyMs: avgLatency,
      });
    }
  }, [
    isPlaying,
    gazeFrame,
    speed,
    exercise.id,
    flashPosition,
    hits,
    gazeLockScore,
    fixationHoldProgress,
    onMetricUpdate,
    onGazePoint,
    handleTargetHit,
  ]);

  const pediatricEmojis = {
    space: "🚀",
    safari: "🦁",
    ocean: "🐢",
    magic: "🦄",
  };
  const currentThemeEmoji = pediatricEmojis[pediatricTheme || "space"] || "🚀";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[460px] md:h-[540px] rounded-[2.5rem] border overflow-hidden flex items-center justify-center select-none transition-colors ${
        highContrast
          ? "bg-black text-white border-white/20"
          : "bg-slate-900/90 dark:bg-card/70 text-foreground border-border/80 shadow-2xl"
      }`}
    >
      {/* Top Controls & Live Gaze Precision HUD */}
      <div className="absolute top-4 inset-x-6 z-40 flex items-center justify-between pointer-events-none">
        {/* Live Gaze Biofeedback Lock Pill */}
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs font-semibold text-white shadow-xl pointer-events-auto">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              isGazeLocked ? "bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" : "bg-amber-400"
            }`}
          />
          <span className={isGazeLocked ? "text-emerald-300 font-bold" : "text-white/80"}>
            {isGazeLocked ? "GAZE LOCKED ON TARGET" : "TRACKING EYE MOVEMENT"}
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/90">Acc: {Math.round(gazeLockScore)}%</span>
          {gazeFrame && (
            <>
              <span className="text-white/30">|</span>
              <span className="text-primary font-mono">{gazeFrame.leftEye.diameterMm}mm</span>
            </>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setSpeed((prev) => (prev >= 2 ? 0.5 : prev + 0.5))}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs font-bold border border-white/10 transition-colors shadow-lg"
            title="Adjust target speed"
          >
            {speed}x
          </button>
          <button
            onClick={toggleMute}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-colors shadow-lg"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setHighContrast((prev) => !prev)}
            className="w-9 h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-colors shadow-lg"
            title="Toggle high-contrast photophobia mode"
          >
            {highContrast ? <SunMedium size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      {/* Live On-Screen Eye Gaze Reticle Overlay */}
      {gazeFrame && isPlaying && (
        <div
          className="absolute z-30 pointer-events-none transition-transform duration-75 ease-out"
          style={{
            left: `${gazeFrame.gazeX * 100}%`,
            top: `${gazeFrame.gazeY * 100}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative flex items-center justify-center">
            {/* Gaze Crosshair */}
            <div
              className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center ${
                isGazeLocked ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]" : "border-teal-400/80 shadow-[0_0_12px_rgba(20,184,166,0.6)]"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isGazeLocked ? "bg-emerald-400" : "bg-teal-300 animate-ping"}`} />
            </div>
            <span className="absolute -bottom-4 text-[9px] font-black tracking-widest text-emerald-300 uppercase bg-black/70 px-1.5 py-0.2 rounded">
              EYE GAZE
            </span>
          </div>
        </div>
      )}

      {/* Hit feedback floaters */}
      {hitFeedback.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.8, y: 0 }}
          animate={{ opacity: 0, scale: 1.8, y: -40 }}
          transition={{ duration: 0.55 }}
          className="absolute z-40 pointer-events-none text-emerald-400 font-extrabold text-sm flex items-center gap-1 shadow-lg"
          style={{ left: h.x, top: h.y }}
        >
          <Sparkles size={16} /> +10 GAZE LOCK!
        </motion.div>
      ))}

      {/* --- EXERCISE 1: SMOOTH PURSUIT & TARGET TRACKING --- */}
      {(exercise.id === "target-tracking" ||
        exercise.id === "circular-tracking" ||
        exercise.id === "figure-eight" ||
        exercise.id === "spiral-inward") && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Orbital path guides */}
          <div className="absolute w-56 h-56 md:w-72 md:h-72 rounded-full border border-dashed border-primary/20 pointer-events-none" />
          <div className="absolute w-80 h-80 md:w-96 md:h-96 rounded-full border border-dashed border-primary/10 pointer-events-none" />

          {/* Dynamic Moving Target */}
          {isPlaying && (
            <motion.div
              animate={{
                x: [-140, 140, -140],
                y: [-60, 60, -60],
              }}
              transition={{
                duration: 8 / speed,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              onClick={(e) => {
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  handleTargetHit(e.clientX - rect.left, e.clientY - rect.top);
                }
              }}
              className="absolute z-20 cursor-pointer group"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Gaze Lock Active Glow Ring */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-150 ${
                    isGazeLocked
                      ? "bg-emerald-400/40 blur-xl scale-125 animate-pulse"
                      : "bg-primary/30 blur-lg"
                  }`}
                />
                {pediatricMode ? (
                  <div className="w-14 h-14 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(251,191,36,0.8)] hover:scale-125 transition-transform">
                    {currentThemeEmoji}
                  </div>
                ) : (
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-2 border-white transition-all shadow-2xl ${
                      isGazeLocked ? "bg-emerald-500 shadow-[0_0_35px_rgba(52,211,153,1)] scale-110" : "bg-primary shadow-[0_0_25px_rgba(20,184,166,0.8)]"
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white animate-ping opacity-80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground absolute" />
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Central Fixation Reference Dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 pointer-events-none" />
        </div>
      )}

      {/* --- EXERCISE 2: FOCUS STABILITY & CENTRAL FIXATION HOLD --- */}
      {(exercise.id === "focus-hold" || exercise.id === "fusion-circles") && (
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <motion.div
            animate={{
              scale: isPlaying ? [1, 1.15, 1] : 1,
            }}
            transition={{
              duration: 5 / speed,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={(e) => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                handleTargetHit(e.clientX - rect.left, e.clientY - rect.top);
              }
            }}
            className="relative w-44 h-44 flex items-center justify-center cursor-pointer"
          >
            {/* Fixation Hold Charging Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="88" cy="88" r="74" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="88"
                cy="88"
                r="74"
                fill="none"
                stroke={isGazeLocked ? "#10b981" : "#14b8a6"}
                strokeWidth="6"
                strokeDasharray="465"
                strokeDashoffset={465 - (465 * fixationHoldProgress) / 100}
                strokeLinecap="round"
                className="transition-all duration-150"
              />
            </svg>

            <div className="w-28 h-28 rounded-full border-2 border-primary/60 flex items-center justify-center bg-primary/10">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                  isGazeLocked
                    ? "bg-emerald-500 shadow-[0_0_40px_rgba(52,211,153,1)] scale-110"
                    : "bg-primary shadow-[0_0_25px_rgba(20,184,166,0.7)]"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white animate-ping" />
              </div>
            </div>
          </motion.div>

          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-white uppercase tracking-widest">
              {isGazeLocked ? "✨ Foveal Focus Locked!" : "Fixate gaze steadily on central target"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Stability Charge: <span className="text-emerald-400 font-bold">{Math.round(fixationHoldProgress)}%</span>
            </p>
          </div>
        </div>
      )}

      {/* --- EXERCISE 3: REACTION SPEED & SACCADE JUMPS --- */}
      {(exercise.id === "reaction-speed" ||
        exercise.id === "peripheral-vision" ||
        exercise.id === "saccade-jumps") && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top Real-Time Saccadic Latency HUD */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-amber-400 animate-pulse" />
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Saccadic Latency:
              </span>
            </div>

            {lastLatencyMs !== null ? (
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide border flex items-center gap-1.5 ${
                  lastLatencyMs < 250
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    : lastLatencyMs <= 380
                    ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}
              >
                <span>{lastLatencyMs} ms</span>
                <span className="text-[10px] font-semibold opacity-80">
                  {lastLatencyMs < 250 ? "(Optimal)" : lastLatencyMs <= 380 ? "(Normal)" : "(Delayed)"}
                </span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground italic">Acquiring target...</span>
            )}

            {latencyHistory.length > 1 && (
              <span className="text-[11px] text-muted-foreground border-l border-white/10 pl-3">
                Mean:{" "}
                <b className="text-white">
                  {Math.round(
                    latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length
                  )}{" "}
                  ms
                </b>
              </span>
            )}
          </div>

          {/* Central Anchor Dot */}
          <div className="w-5 h-5 rounded-full bg-primary/40 border-2 border-primary flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>

          {/* Flash Target */}
          {isPlaying && flashPosition && (
            <motion.button
              key={`${flashPosition.x}-${flashPosition.y}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ left: `${flashPosition.x}%`, top: `${flashPosition.y}%` }}
              onClick={(e) => {
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  handleTargetHit(e.clientX - rect.left, e.clientY - rect.top);
                }
              }}
              className={`absolute z-20 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-125 transition-transform ${
                isGazeLocked
                  ? "bg-emerald-500 shadow-[0_0_35px_rgba(52,211,153,1)]"
                  : "bg-accent shadow-[0_0_30px_rgba(59,130,246,0.9)]"
              }`}
            >
              <Zap size={24} className="animate-pulse" />
            </motion.button>
          )}

          <div className="absolute bottom-6 bg-black/75 backdrop-blur-md px-4 py-2 rounded-full text-xs text-white/90 border border-white/10 font-semibold flex items-center gap-2">
            <Eye size={14} className="text-emerald-400 animate-pulse" />
            <span>Look directly at the flash target to trigger automatic saccadic hit!</span>
          </div>
        </div>
      )}

      {/* --- EXERCISE 4: CONVERGENCE PUSHUPS --- */}
      {exercise.id === "convergence-pushup" && (
        <div className="relative flex flex-col items-center justify-center space-y-4">
          <motion.div
            animate={{
              scale: isPlaying ? [1, 2.2, 1] : 1,
            }}
            transition={{
              duration: 4 / speed,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            onClick={(e) => {
              if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                handleTargetHit(e.clientX - rect.left, e.clientY - rect.top);
              }
            }}
            className="w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center shadow-2xl cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-primary animate-pulse flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
          </motion.div>
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-white">Follow target as it approaches near-point fusion</p>
            <p className="text-[11px] text-emerald-400 font-semibold">
              {isGazeLocked ? "✓ Binocular Convergence Aligned" : "Maintain Single Unified Target"}
            </p>
          </div>
        </div>
      )}

      {/* --- EXERCISE 5: BLINK MASTER / DIGITAL REST 20-20-20 --- */}
      {(exercise.id === "blink-master" || exercise.id === "visual-rest") && (
        <div className="relative flex flex-col items-center justify-center space-y-6">
          <motion.div
            animate={{
              scale: gazeFrame?.isBlinking ? [1, 0.8, 1] : [1, 1.05, 1],
            }}
            transition={{ duration: 0.3 }}
            className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all shadow-2xl ${
              gazeFrame?.isBlinking
                ? "bg-emerald-500/20 border-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.8)]"
                : "bg-blue-500/10 border-blue-400/60"
            }`}
          >
            <Eye size={48} className={gazeFrame?.isBlinking ? "text-emerald-400" : "text-blue-400"} />
          </motion.div>

          <div className="text-center space-y-2 max-w-sm">
            <p className="text-sm font-bold text-white">
              {gazeFrame?.isBlinking ? "✓ Complete Blink Detected!" : "Perform Full, Deliberate Eye Closures"}
            </p>
            <div className="inline-flex gap-4 bg-black/60 px-4 py-2 rounded-2xl text-xs text-white/90">
              <span>Blinks: <b className="text-emerald-400">{detectedBlinksCount}</b></span>
              <span className="text-white/30">|</span>
              <span>EAR: <b className="text-primary">{gazeFrame?.ear ?? 0.32}</b></span>
              <span className="text-white/30">|</span>
              <span>BPM: <b className="text-secondary">{gazeFrame?.blinkRatePerMin ?? 16}</b></span>
            </div>
          </div>
        </div>
      )}

      {/* --- SYNCHRONIZED VOICE COACH & REAL-TIME BIOFEEDBACK HUD --- */}
      {isPlaying && (
        <div className="absolute bottom-4 left-6 z-40 flex items-center gap-2 pointer-events-auto">
          <div
            className={`px-3.5 py-1.5 rounded-full border text-xs font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transition-all ${
              coachFeedback?.status === "aligned"
                ? "bg-emerald-950/85 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : coachFeedback?.status === "correcting"
                ? "bg-amber-950/85 border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-black/85 border-white/15 text-white/90"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  coachFeedback?.status === "aligned" ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  coachFeedback?.status === "aligned" ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
            </span>
            <span className="uppercase tracking-wider text-[10px] text-white/50 font-semibold">
              Voice Coach:
            </span>
            <span className="font-bold">
              {coachFeedback?.instruction || "Follow the moving target."}
            </span>
          </div>

          <button
            onClick={() => {
              const next = !voiceCoach.getMuted();
              voiceCoach.setMuted(next);
              setIsVoiceMuted(next);
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all ${
              isVoiceMuted
                ? "bg-black/80 border-white/10 text-muted-foreground hover:text-white"
                : "bg-primary/20 border-primary/40 text-primary hover:bg-primary/30"
            }`}
            title={isVoiceMuted ? "Unmute Voice Coach Guidance" : "Mute Voice Coach Guidance"}
          >
            {isVoiceMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="text-[10px] uppercase font-bold">{isVoiceMuted ? "Muted" : "Voice Active"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
