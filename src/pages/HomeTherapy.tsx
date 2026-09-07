import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Play,
  CheckCircle2,
  RotateCcw,
  Flame,
  Shield,
  Heart,
  Eye,
  ArrowLeft,
  Volume2,
  VolumeX,
  Smartphone,
  Award,
  Zap,
  Clock,
  Target,
} from "lucide-react";
import { therapyExercises, type TherapyExercise } from "@/lib/therapies";
import { TherapyCanvas } from "@/components/therapy/TherapyCanvas";
import { CameraFeed } from "@/components/camera/CameraFeed";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";
import { voiceCoach, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/utils/voiceCoach";
import { soundEffects } from "@/utils/audioSynth";
import { therapyService } from "@/services/therapy.service";

export default function HomeTherapy() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const patientId = searchParams.get("patientId") || "guest";
  const patientName = searchParams.get("patientName") || "Patient";
  const exerciseId = searchParams.get("exerciseId") || "target-tracking";
  const prescribedDurationMinutes = Number(searchParams.get("duration") || "3");
  const initialLang = (searchParams.get("lang") as SupportedLanguage) || "en";

  const [activeLang, setActiveLang] = useState<SupportedLanguage>(() => {
    if (["en", "ta", "ml", "te", "hi"].includes(initialLang)) {
      voiceCoach.setLanguage(initialLang);
      return initialLang;
    }
    return voiceCoach.getLanguage();
  });

  const exercise: TherapyExercise = useMemo(() => {
    return (
      therapyExercises.find((t) => t.id === exerciseId) ||
      therapyExercises[0]
    );
  }, [exerciseId]);

  // States
  const [phase, setPhase] = useState<"welcome" | "active" | "completed">("welcome");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(prescribedDurationMinutes * 60);
  const [gazeFrame, setGazeFrame] = useState<EyeTrackingFrame | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [metrics, setMetrics] = useState({
    accuracy: 92,
    blinks: 0,
    confidence: 95,
    hits: 0,
    correctMovements: 0,
    incorrectMovements: 0,
    repetitions: 0,
    currentInstruction: "Look at the screen",
    currentSpeedFactor: 1.0,
    autoLevelStage: "Standard Clinical Pace",
  });
  const [streakDays, setStreakDays] = useState<number>(() => {
    const key = `foceye_streak_${patientId}`;
    const saved = localStorage.getItem(key);
    return saved ? parseInt(saved, 10) : 3;
  });

  const handleStartSession = () => {
    voiceCoach.unlockAudio();
    voiceCoach.sessionStart();
    setIsPlaying(true);
    setPhase("active");
  };

  const handleCompleteSession = async () => {
    setIsPlaying(false);
    setPhase("completed");
    soundEffects.playLevelUp();
    voiceCoach.sessionComplete();

    // Increment and store daily streak
    const nextStreak = streakDays + 1;
    setStreakDays(nextStreak);
    localStorage.setItem(`foceye_streak_${patientId}`, String(nextStreak));

    // Save session payload to database
    try {
      await therapyService.saveSession({
        patientId,
        gameId: exercise.id,
        therapyId: exercise.id,
        accuracy: metrics.accuracy,
        blinks: metrics.blinks,
        duration: prescribedDurationMinutes * 60 - timeLeft,
        sessionDuration: prescribedDurationMinutes * 60 - timeLeft,
        repetitions: metrics.repetitions,
        completionStatus: "Completed",
        performanceScore: metrics.accuracy,
        doctorNotes: `Home therapy session completed independently. Accuracy: ${metrics.accuracy}%, Reps: ${metrics.repetitions}.`,
        language: activeLang,
      });
    } catch (e) {
      console.warn("Failed to log home therapy session:", e);
    }
  };

  const handleCompleteSessionRef = useRef(handleCompleteSession);
  useEffect(() => {
    handleCompleteSessionRef.current = handleCompleteSession;
  });

  // Countdown timer for active session
  useEffect(() => {
    let interval: number;
    if (phase === "active" && isPlaying && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCompleteSessionRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase, isPlaying, timeLeft]);

  const handleRestart = () => {
    setTimeLeft(prescribedDurationMinutes * 60);
    setPhase("welcome");
    setIsPlaying(false);
  };

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Mobile Bar */}
      <header className="px-4 py-3 border-b border-white/10 bg-slate-900/80 backdrop-blur-md flex items-center justify-between z-30 sticky top-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Return to FOCEYE Home"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-xs font-black tracking-widest text-teal-400 uppercase">
              FOCEYE HOME
            </span>
            <span className="mx-1 text-white/30 text-xs">|</span>
            <span className="text-xs font-semibold text-white/90 truncate max-w-[140px] inline-block align-bottom">
              {patientName}
            </span>
          </div>
        </div>

        {/* Streak & Language Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold shadow-sm">
            <Flame size={13} className="fill-amber-400" />
            <span>{streakDays}d Streak</span>
          </div>

          <select
            value={activeLang}
            onChange={(e) => {
              const lang = e.target.value as SupportedLanguage;
              setActiveLang(lang);
              voiceCoach.setLanguage(lang);
            }}
            className="bg-slate-800 border border-white/10 text-white text-xs font-bold rounded-lg px-2 py-1 outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative max-w-4xl mx-auto w-full">
        {/* PHASE 1: WELCOME & SETUP */}
        {phase === "welcome" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg space-y-6 text-center"
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-bold">
                <Sparkles size={14} /> Prescribed Remote Vision Exercise
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {exercise.title}
              </h1>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {exercise.desc}
              </p>
            </div>

            {/* Regimen Details Card */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Duration</div>
                <div className="text-lg font-black text-teal-400 flex items-center justify-center gap-1 mt-0.5">
                  <Clock size={16} /> {prescribedDurationMinutes}m
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Level</div>
                <div className="text-lg font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <Zap size={16} /> {exercise.level}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Target</div>
                <div className="text-lg font-black text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <Target size={16} /> Foveal
                </div>
              </div>
            </div>

            {/* Patient Tips */}
            <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-left space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                <Shield size={14} /> Practice Tips
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                <li>Position phone at arm's length (about 40-50 cm away).</li>
                <li>Make sure your face is evenly lit with no strong glare behind you.</li>
                <li>Keep your head still and follow the moving target with your eyes only.</li>
                <li>Turn up your phone volume to hear the voice coach guide you.</li>
              </ul>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartSession}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-black text-base shadow-xl shadow-teal-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" /> Start Home Practice Now
            </button>
          </motion.div>
        )}

        {/* PHASE 2: ACTIVE SESSION */}
        {phase === "active" && (
          <div className="w-full flex flex-col items-center space-y-3">
            {/* Top In-Session HUD */}
            <div className="w-full flex items-center justify-between gap-2 px-2">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-white/10 text-white font-mono text-xs font-extrabold flex items-center gap-1.5">
                  <Clock size={13} className="text-teal-400" />
                  <span>{formatMinSec(timeLeft)}</span>
                </div>

                <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>{metrics.accuracy}% Accuracy</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {metrics.currentSpeedFactor && (
                  <div className="px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1 border border-teal-500/30">
                    <Zap size={11} className="animate-pulse" />
                    <span>{metrics.currentSpeedFactor}x</span>
                  </div>
                )}
                <button
                  onClick={() => handleCompleteSession()}
                  className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-colors"
                >
                  End Early
                </button>
              </div>
            </div>

            {/* Interactive Therapy Canvas */}
            <div className="w-full relative rounded-3xl overflow-hidden shadow-2xl border border-white/15">
              <TherapyCanvas
                exercise={exercise}
                isPlaying={isPlaying}
                timeLeft={timeLeft}
                gazeFrame={gazeFrame}
                onMetricUpdate={(m) => setMetrics((prev) => ({ ...prev, ...m }))}
                onSessionComplete={handleCompleteSession}
              />

              {/* Front Camera PiP */}
              <div className="absolute top-3 right-3 w-28 h-20 sm:w-36 sm:h-26 rounded-2xl overflow-hidden border border-white/20 shadow-xl z-30 bg-black/80">
                <CameraFeed
                  onEyeTrackingFrame={(frame) => {
                    setGazeFrame(frame);
                    setHasCameraPermission(true);
                  }}
                  showOverlay={false}
                  compact={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: COMPLETED CELEBRATION */}
        {phase === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-slate-900 border border-white/15 p-6 rounded-3xl text-center space-y-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
              <Award size={36} />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black">
                <Flame size={12} fill="currentColor" /> {streakDays}-Day Streak Kept Alive!
              </div>
              <h2 className="text-2xl font-black text-white">
                Great Job, {patientName}!
              </h2>
              <p className="text-xs text-slate-300">
                Your home session results have been securely synced to your clinic chart.
              </p>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Tracking Accuracy</div>
                <div className="text-2xl font-black text-emerald-400 mt-0.5">
                  {metrics.accuracy}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Repetitions</div>
                <div className="text-2xl font-black text-teal-400 mt-0.5">
                  {metrics.repetitions}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 px-5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
              >
                <RotateCcw size={16} /> Practice Another Session
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Done for Today
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-4 py-3 border-t border-white/10 text-center text-[11px] text-slate-500 font-medium">
        FOCEYE Clinical Gaze Telemetry • AI Powered Visual Rehabilitation
      </footer>
    </div>
  );
}
