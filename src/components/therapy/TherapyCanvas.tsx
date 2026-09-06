import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  SunMedium,
  Moon,
  Zap,
  CheckCircle2,
  AlertCircle,
  Target,
  RefreshCw,
} from "lucide-react";
import type { TherapyExercise } from "@/lib/therapies";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";
import { soundEffects } from "@/utils/audioSynth";
import { voiceCoach, type SupportedLanguage, type VoicePromptKey } from "@/utils/voiceCoach";

export type TherapyStateMachineState =
  | "READY"
  | "INSTRUCTION"
  | "WAITING"
  | "TRACKING"
  | "CORRECT"
  | "INCORRECT"
  | "FEEDBACK"
  | "NEXT_STEP"
  | "COMPLETE";

export interface ExerciseStepDef {
  name: string;
  targetX: number; // 0..1 normalized coordinate
  targetY: number; // 0..1 normalized coordinate
  voicePrompt: VoicePromptKey;
  tolerance: number; // radius in normalized space
  holdDurationMs: number;
  timeoutMs: number;
  isBlinkRequired?: boolean;
}

export interface TherapyCanvasProps {
  exercise: TherapyExercise;
  isPlaying: boolean;
  timeLeft: number;
  gazeFrame?: EyeTrackingFrame | null;
  pediatricMode?: boolean;
  pediatricTheme?: "space" | "safari" | "ocean" | "magic";
  onMetricUpdate?: (metrics: {
    accuracy: number;
    blinks: number;
    confidence: number;
    hits: number;
    correctMovements: number;
    incorrectMovements: number;
    repetitions: number;
    saccadicLatencyMs?: number;
    currentInstruction: string;
    trackingState: TherapyStateMachineState;
    trackingQuality: "optimal" | "acceptable" | "poor";
  }) => void;
  onGazePoint?: (pt: { x: number; y: number }) => void;
  onSessionComplete?: () => void;
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
  onSessionComplete,
}) => {
  const [speed, setSpeed] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => voiceCoach.getMuted());

  // State Machine State
  const [therapyState, setTherapyState] = useState<TherapyStateMachineState>("READY");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [instructionText, setInstructionText] = useState("");
  const [correctMovements, setCorrectMovements] = useState(0);
  const [incorrectMovements, setIncorrectMovements] = useState(0);
  const [repetitions, setRepetitions] = useState(0);
  const [detectedBlinksCount, setDetectedBlinksCount] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);

  // Visual Target & Gaze Tracking Lock
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isGazeLocked, setIsGazeLocked] = useState(false);
  const [hitFeedback, setHitFeedback] = useState<{ id: number; x: number; y: number; text: string }[]>([]);

  // References for timing & high-performance tracking loop
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<TherapyStateMachineState>("READY");
  stateRef.current = therapyState;

  const currentStepIdxRef = useRef<number>(0);
  currentStepIdxRef.current = currentStepIndex;

  const stepStartTimeRef = useRef<number>(performance.now());
  const onTargetHoldStartRef = useRef<number | null>(null);
  const lastStateChangeTimeRef = useRef<number>(performance.now());
  const lastBlinkStateRef = useRef<boolean>(false);
  const lastGazePointTimeRef = useRef<number>(0);
  const lastMetricUpdateTimeRef = useRef<number>(0);

  // Define structured, deterministic exercise steps based on exercise category & id
  const exerciseSteps: ExerciseStepDef[] = useMemo(() => {
    switch (exercise.id) {
      case "target-tracking": // Horizontal smooth tracking
        return [
          { name: "Center", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 600, timeoutMs: 3200 },
          { name: "Right", targetX: 0.82, targetY: 0.5, voicePrompt: "look_right", tolerance: 0.18, holdDurationMs: 700, timeoutMs: 3600 },
          { name: "Center", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 600, timeoutMs: 3200 },
          { name: "Left", targetX: 0.18, targetY: 0.5, voicePrompt: "look_left", tolerance: 0.18, holdDurationMs: 700, timeoutMs: 3600 },
        ];

      case "reaction-speed":
      case "saccade-jumps":
      case "peripheral-vision": // Cardinal Saccades & Vertical Excursion
        return [
          { name: "Center", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 400, timeoutMs: 2800 },
          { name: "Up", targetX: 0.5, targetY: 0.22, voicePrompt: "look_up", tolerance: 0.18, holdDurationMs: 500, timeoutMs: 3200 },
          { name: "Center", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 400, timeoutMs: 2800 },
          { name: "Down", targetX: 0.5, targetY: 0.78, voicePrompt: "look_down", tolerance: 0.18, holdDurationMs: 500, timeoutMs: 3200 },
          { name: "Right", targetX: 0.80, targetY: 0.5, voicePrompt: "look_right", tolerance: 0.18, holdDurationMs: 500, timeoutMs: 3200 },
          { name: "Left", targetX: 0.20, targetY: 0.5, voicePrompt: "look_left", tolerance: 0.18, holdDurationMs: 500, timeoutMs: 3200 },
        ];

      case "focus-hold":
      case "fusion-circles": // Fixation Stability & Foveal Hold
        return [
          { name: "Fixation Hold", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight_screen", tolerance: 0.14, holdDurationMs: 2200, timeoutMs: 4500 },
        ];

      case "blink-master":
      case "visual-rest": // Deliberate Blinking & Tearfilm Refresh
        return [
          { name: "Straight Gaze", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 800, timeoutMs: 3000 },
          { name: "Blink Complete", targetX: 0.5, targetY: 0.5, voicePrompt: "blink_eyes", tolerance: 0.35, holdDurationMs: 200, timeoutMs: 4000, isBlinkRequired: true },
        ];

      case "convergence-pushup": // Vergence & Near Point
        return [
          { name: "Distant Target", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.18, holdDurationMs: 800, timeoutMs: 3500 },
          { name: "Near Target", targetX: 0.5, targetY: 0.5, voicePrompt: "follow_target", tolerance: 0.20, holdDurationMs: 1400, timeoutMs: 4000 },
        ];

      case "circular-tracking":
      case "figure-eight":
      case "spiral-inward": // Smooth Pursuit Vectors
      default:
        return [
          { name: "Upper Right", targetX: 0.75, targetY: 0.32, voicePrompt: "follow_target", tolerance: 0.20, holdDurationMs: 600, timeoutMs: 3500 },
          { name: "Lower Right", targetX: 0.75, targetY: 0.68, voicePrompt: "follow_target", tolerance: 0.20, holdDurationMs: 600, timeoutMs: 3500 },
          { name: "Lower Left", targetX: 0.25, targetY: 0.68, voicePrompt: "follow_target", tolerance: 0.20, holdDurationMs: 600, timeoutMs: 3500 },
          { name: "Upper Left", targetX: 0.25, targetY: 0.32, voicePrompt: "follow_target", tolerance: 0.20, holdDurationMs: 600, timeoutMs: 3500 },
          { name: "Center", targetX: 0.5, targetY: 0.5, voicePrompt: "look_straight", tolerance: 0.16, holdDurationMs: 600, timeoutMs: 3000 },
        ];
    }
  }, [exercise.id]);

  // Sync current step target coordinates to state
  useEffect(() => {
    const step = exerciseSteps[currentStepIndex] || exerciseSteps[0];
    if (step) {
      setTargetPos({ x: step.targetX, y: step.targetY });
    }
  }, [currentStepIndex, exerciseSteps]);

  // Audio effect toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  // Trigger floating visual feedback
  const triggerHitFeedback = (screenX: number, screenY: number, text: string) => {
    const newHit = { id: Date.now(), x: screenX, y: screenY, text };
    setHitFeedback((prev) => [...prev.slice(-3), newHit]);
    setTimeout(() => {
      setHitFeedback((prev) => prev.filter((h) => h.id !== newHit.id));
    }, 700);
  };

  // =========================================================================
  // THERAPY STATE MACHINE EXECUTION ENGINE
  // Transitions: READY -> INSTRUCTION -> WAITING -> TRACKING -> CORRECT / INCORRECT -> FEEDBACK -> NEXT_STEP -> COMPLETE
  // =========================================================================
  useEffect(() => {
    if (!isPlaying) {
      if (therapyState !== "READY" && therapyState !== "COMPLETE") {
        setTherapyState("READY");
      }
      return;
    }

    const currentStep = exerciseSteps[currentStepIndex] || exerciseSteps[0];
    if (!currentStep) return;

    let timeoutId: NodeJS.Timeout | null = null;

    if (therapyState === "READY") {
      setTherapyState("INSTRUCTION");
    } else if (therapyState === "INSTRUCTION") {
      const promptText = voiceCoach.getPromptText(currentStep.voicePrompt);
      setInstructionText(promptText);
      voiceCoach.speakPrompt(currentStep.voicePrompt, true);
      stepStartTimeRef.current = performance.now();
      onTargetHoldStartRef.current = null;
      lastStateChangeTimeRef.current = performance.now();

      // Brief buffer for voice initiation and cognitive response
      timeoutId = setTimeout(() => {
        setTherapyState("WAITING");
      }, 450);
    } else if (therapyState === "WAITING") {
      timeoutId = setTimeout(() => {
        setTherapyState("TRACKING");
        lastStateChangeTimeRef.current = performance.now();
      }, 250);
    } else if (therapyState === "CORRECT") {
      soundEffects.playTargetCatch();
      const praiseText = voiceCoach.getPromptText("good_short");
      setInstructionText(praiseText);
      voiceCoach.speakPrompt("good_short", true);

      // Trigger floating feedback in container center or target position
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        triggerHitFeedback(rect.width * currentStep.targetX, rect.height * currentStep.targetY, `✓ ${praiseText}`);
      }

      timeoutId = setTimeout(() => {
        setTherapyState("FEEDBACK");
      }, 650);
    } else if (therapyState === "INCORRECT") {
      // Determine directionally accurate corrective voice instruction
      let correctivePrompt: VoicePromptKey = "try_again";
      if (currentStep.isBlinkRequired) {
        correctivePrompt = "blink_eyes";
      } else if (currentStep.targetX > 0.65) {
        correctivePrompt = "look_further_right";
      } else if (currentStep.targetX < 0.35) {
        correctivePrompt = "look_further_left";
      } else if (currentStep.targetY < 0.35) {
        correctivePrompt = "look_higher";
      } else if (currentStep.targetY > 0.65) {
        correctivePrompt = "look_lower";
      }

      const correctiveText = voiceCoach.getPromptText(correctivePrompt);
      setInstructionText(correctiveText);
      voiceCoach.speakPrompt(correctivePrompt, true);

      timeoutId = setTimeout(() => {
        setTherapyState("FEEDBACK");
      }, 950);
    } else if (therapyState === "FEEDBACK") {
      timeoutId = setTimeout(() => {
        setTherapyState("NEXT_STEP");
      }, 350);
    } else if (therapyState === "NEXT_STEP") {
      onTargetHoldStartRef.current = null;
      const nextIdx = currentStepIndex + 1;
      if (nextIdx >= exerciseSteps.length) {
        setCurrentStepIndex(0);
        setRepetitions((r) => r + 1);
      } else {
        setCurrentStepIndex(nextIdx);
      }

      if (timeLeft <= 0) {
        setTherapyState("COMPLETE");
      } else {
        setTherapyState("INSTRUCTION");
      }
    } else if (therapyState === "COMPLETE") {
      const compText = voiceCoach.getPromptText("session_complete");
      setInstructionText(compText);
      voiceCoach.speakPrompt("session_complete", true);
      onSessionComplete?.();
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [
    isPlaying,
    therapyState,
    currentStepIndex,
    exerciseSteps,
    timeLeft,
    onSessionComplete,
  ]);

  // =========================================================================
  // CONTINUOUS GAZE FRAME EVALUATION LOOP (Active during TRACKING state)
  // =========================================================================
  useEffect(() => {
    if (!isPlaying || therapyState !== "TRACKING") return;
    const nowTime = performance.now();

    // 1. Accumulate 2D Gaze Points for Heatmap
    if (gazeFrame && onGazePoint && nowTime - lastGazePointTimeRef.current >= 100) {
      lastGazePointTimeRef.current = nowTime;
      onGazePoint({ x: gazeFrame.gazeX, y: gazeFrame.gazeY });
    }

    // 2. Track Blink Dynamics
    if (gazeFrame?.isBlinking && !lastBlinkStateRef.current) {
      lastBlinkStateRef.current = true;
      setDetectedBlinksCount((prev) => prev + 1);
      soundEffects.playSoftClick();
    } else if (!gazeFrame?.isBlinking) {
      lastBlinkStateRef.current = false;
    }

    const currentStep = exerciseSteps[currentStepIndex] || exerciseSteps[0];
    if (!currentStep) return;

    // A. Blink Exercise Target Verification
    if (currentStep.isBlinkRequired) {
      if (gazeFrame?.isBlinking) {
        const elapsed = Math.round(nowTime - stepStartTimeRef.current);
        if (elapsed >= 100) {
          setLastLatencyMs(elapsed);
          setLatencyHistory((h) => [...h.slice(-19), elapsed]);
        }
        setCorrectMovements((c) => c + 1);
        setIsGazeLocked(true);
        setTherapyState("CORRECT");
        return;
      }

      // Check timeout
      if (nowTime - stepStartTimeRef.current > currentStep.timeoutMs / speed) {
        setIncorrectMovements((i) => i + 1);
        setIsGazeLocked(false);
        setTherapyState("INCORRECT");
        return;
      }
      return;
    }

    // B. Eye Gaze Target Distance & Lock Verification
    if (gazeFrame) {
      const dx = gazeFrame.gazeX - currentStep.targetX;
      const dy = gazeFrame.gazeY - currentStep.targetY;
      const distance = Math.hypot(dx, dy);
      const isWithinTolerance = distance <= currentStep.tolerance;
      setIsGazeLocked(isWithinTolerance);

      if (isWithinTolerance) {
        if (onTargetHoldStartRef.current === null) {
          onTargetHoldStartRef.current = nowTime;
        } else if (nowTime - onTargetHoldStartRef.current >= currentStep.holdDurationMs / speed) {
          // Success: Gaze held on target for the required duration!
          const reactionTime = Math.max(120, Math.round(nowTime - stepStartTimeRef.current));
          setLastLatencyMs(reactionTime);
          setLatencyHistory((h) => [...h.slice(-19), reactionTime]);
          setCorrectMovements((c) => c + 1);
          setTherapyState("CORRECT");
          return;
        }
      } else {
        // Displaced from target
        onTargetHoldStartRef.current = null;
        if (nowTime - stepStartTimeRef.current > currentStep.timeoutMs / speed) {
          // Failure: Target acquisition timed out or missed
          setIncorrectMovements((i) => i + 1);
          setTherapyState("INCORRECT");
          return;
        }
      }
    } else {
      // Camera feed unavailable or no face detected during tracking
      if (nowTime - stepStartTimeRef.current > currentStep.timeoutMs / speed) {
        setIncorrectMovements((i) => i + 1);
        setTherapyState("INCORRECT");
      }
    }
  }, [
    isPlaying,
    therapyState,
    gazeFrame,
    currentStepIndex,
    exerciseSteps,
    speed,
    onGazePoint,
  ]);

  // =========================================================================
  // PERIODIC METRIC BROADCAST TO PARENT HUD (Twice per second)
  // =========================================================================
  useEffect(() => {
    if (!onMetricUpdate) return;
    const nowTime = performance.now();
    if (nowTime - lastMetricUpdateTimeRef.current < 500) return;
    lastMetricUpdateTimeRef.current = nowTime;

    const totalDecisions = correctMovements + incorrectMovements;
    const computedAccuracy =
      totalDecisions > 0
        ? Math.round((correctMovements / totalDecisions) * 100)
        : isGazeLocked
        ? 90
        : 75;

    const avgLatency =
      latencyHistory.length > 0
        ? Math.round(latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length)
        : undefined;

    const confidenceVal = gazeFrame ? Math.round(gazeFrame.confidence * 100) : 0;
    const quality: "optimal" | "acceptable" | "poor" =
      confidenceVal >= 75 ? "optimal" : confidenceVal >= 40 ? "acceptable" : "poor";

    onMetricUpdate({
      accuracy: computedAccuracy,
      blinks: gazeFrame?.blinkRatePerMin ?? detectedBlinksCount,
      confidence: confidenceVal,
      hits: correctMovements,
      correctMovements,
      incorrectMovements,
      repetitions,
      saccadicLatencyMs: avgLatency,
      currentInstruction: instructionText || voiceCoach.getPromptText("follow_target"),
      trackingState: therapyState,
      trackingQuality: quality,
    });
  }, [
    onMetricUpdate,
    correctMovements,
    incorrectMovements,
    repetitions,
    latencyHistory,
    gazeFrame,
    detectedBlinksCount,
    instructionText,
    therapyState,
    isGazeLocked,
  ]);

  // Pediatric Emoji Mascot
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
      className={`relative w-full h-[360px] sm:h-[460px] md:h-[540px] rounded-2xl sm:rounded-[2.5rem] border overflow-hidden flex items-center justify-center select-none transition-colors ${
        highContrast
          ? "bg-black text-white border-white/20"
          : "bg-slate-900/95 dark:bg-card/85 text-foreground border-border/80 shadow-2xl"
      }`}
    >
      {/* TOP HUD: Live Tracking State Machine & Gaze Precision Badge */}
      <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-6 z-40 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 bg-black/80 backdrop-blur-md px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-white/10 text-[11px] sm:text-xs font-semibold text-white shadow-xl pointer-events-auto max-w-[70%] sm:max-w-none truncate">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
              therapyState === "CORRECT"
                ? "bg-emerald-400 animate-ping shadow-[0_0_12px_rgba(52,211,153,1)]"
                : therapyState === "INCORRECT"
                ? "bg-amber-400 animate-pulse shadow-[0_0_12px_rgba(251,191,36,1)]"
                : isGazeLocked
                ? "bg-emerald-400"
                : "bg-cyan-400"
            }`}
          />
          <span
            className={`truncate font-bold ${
              therapyState === "CORRECT"
                ? "text-emerald-300"
                : therapyState === "INCORRECT"
                ? "text-amber-300"
                : "text-white"
            }`}
          >
            {therapyState === "CORRECT"
              ? "CORRECT ✓"
              : therapyState === "INCORRECT"
              ? "TRY AGAIN"
              : therapyState === "TRACKING"
              ? isGazeLocked
                ? "GAZE LOCKED"
                : "TRACKING MOVEMENT"
              : therapyState}
          </span>
          <span className="text-white/30">|</span>
          <span className="text-white/90 shrink-0">Reps: {repetitions}</span>
          <span className="text-white/30 hidden sm:inline">|</span>
          <span className="text-emerald-400 hidden sm:inline">✓ {correctMovements}</span>
          <span className="text-amber-400 hidden sm:inline">✕ {incorrectMovements}</span>
        </div>

        {/* Action controls (Speed, Chime Mute, Contrast) */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
          <button
            onClick={() => setSpeed((prev) => (prev >= 2 ? 0.75 : prev + 0.25))}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-xs font-bold border border-white/10 transition-colors shadow-lg"
            title="Adjust target speed"
          >
            {speed}x
          </button>
          <button
            onClick={toggleMute}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-colors shadow-lg"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <button
            onClick={() => setHighContrast((prev) => !prev)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-colors shadow-lg"
            title="Toggle high contrast mode"
          >
            {highContrast ? <SunMedium size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>

      {/* REAL-TIME GAZE RETICLE OVERLAY (Driven directly by camera face/eye tracking) */}
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
            <div
              className={`w-10 h-10 rounded-full border-2 transition-colors flex items-center justify-center ${
                isGazeLocked
                  ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.9)]"
                  : "border-teal-400/80 shadow-[0_0_12px_rgba(20,184,166,0.6)]"
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

      {/* Floating feedback animations */}
      {hitFeedback.map((h) => (
        <motion.div
          key={h.id}
          initial={{ opacity: 1, scale: 0.8, y: 0 }}
          animate={{ opacity: 0, scale: 1.6, y: -45 }}
          transition={{ duration: 0.65 }}
          className="absolute z-40 pointer-events-none text-emerald-400 font-black text-sm flex items-center gap-1 shadow-lg"
          style={{ left: h.x, top: h.y }}
        >
          <Sparkles size={16} /> {h.text}
        </motion.div>
      ))}

      {/* ACTIVE THERAPY TARGET (Positioned dynamically according to step state) */}
      {isPlaying && (
        <motion.div
          key={`step-${currentStepIndex}`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{
            scale: isGazeLocked ? 1.15 : 1.0,
            opacity: 1,
            left: `${targetPos.x * 100}%`,
            top: `${targetPos.y * 100}%`,
          }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          onClick={() => {
            // Space/click manual fallback to register hit
            setCorrectMovements((c) => c + 1);
            setTherapyState("CORRECT");
          }}
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            {/* Target Glow Pulse */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-200 ${
                therapyState === "CORRECT"
                  ? "bg-emerald-400/50 blur-xl scale-125 animate-ping"
                  : isGazeLocked
                  ? "bg-emerald-400/40 blur-xl scale-110"
                  : "bg-primary/30 blur-lg animate-pulse"
              }`}
            />

            {pediatricMode ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl sm:text-4xl shadow-[0_0_30px_rgba(251,191,36,0.8)]">
                {currentThemeEmoji}
              </div>
            ) : exercise.id === "blink-master" ? (
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center shadow-2xl transition-all ${
                  gazeFrame?.isBlinking ? "bg-emerald-500 scale-110" : "bg-blue-600"
                }`}
              >
                <Eye size={28} className="text-white" />
              </div>
            ) : (
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-white flex items-center justify-center shadow-2xl transition-all ${
                  therapyState === "CORRECT"
                    ? "bg-emerald-500 shadow-[0_0_35px_rgba(52,211,153,1)]"
                    : isGazeLocked
                    ? "bg-emerald-500 shadow-[0_0_25px_rgba(52,211,153,0.8)]"
                    : "bg-primary shadow-[0_0_25px_rgba(20,184,166,0.8)]"
                }`}
              >
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-white animate-ping opacity-80" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground absolute" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Central Reference Crosshair Marker */}
      <div className="w-3 h-3 rounded-full bg-white/20 pointer-events-none flex items-center justify-center">
        <div className="w-1 h-1 rounded-full bg-white/60" />
      </div>

      {/* BOTTOM HUD: Real-time Multi-language Voice Instruction & Guidance Banner */}
      {isPlaying && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-6 sm:right-auto z-40 flex items-center justify-between sm:justify-start gap-2 pointer-events-auto flex-wrap sm:flex-nowrap">
          <div
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-2xl transition-all max-w-[80%] sm:max-w-none truncate ${
              therapyState === "CORRECT"
                ? "bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                : therapyState === "INCORRECT"
                ? "bg-amber-950/90 border-amber-500 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                : "bg-black/85 border-white/15 text-white"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  therapyState === "CORRECT" ? "bg-emerald-400" : "bg-primary"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  therapyState === "CORRECT" ? "bg-emerald-500" : "bg-primary"
                }`}
              />
            </span>
            <span className="uppercase tracking-wider text-[10px] text-white/70 font-black flex items-center gap-1 shrink-0">
              <span>{voiceCoach.getLanguageOption().flag}</span>
              <span>{voiceCoach.getLanguageOption().nativeName}:</span>
            </span>
            <span className="font-extrabold truncate">
              {instructionText || voiceCoach.getPromptText("follow_target")}
            </span>
          </div>

          <button
            onClick={() => {
              const next = !voiceCoach.getMuted();
              voiceCoach.setMuted(next);
              setIsVoiceMuted(next);
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 backdrop-blur-md transition-all cursor-pointer ${
              isVoiceMuted
                ? "bg-black/80 border-white/10 text-muted-foreground hover:text-white"
                : "bg-primary/20 border-primary/50 text-primary hover:bg-primary/30"
            }`}
            title={isVoiceMuted ? "Unmute Voice Coach Guidance" : "Mute Voice Coach Guidance"}
          >
            {isVoiceMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span className="text-[10px] uppercase font-bold">{isVoiceMuted ? "Muted" : "Voice ON"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
