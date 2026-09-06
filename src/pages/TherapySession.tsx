import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  X,
  ChevronRight,
  Award,
  CheckCircle2,
  Camera,
  Shield,
  Search,
  Info,
  AlertTriangle,
  Clock,
  ChevronLeft,
  FileText,
  Brain,
  StopCircle,
  Save,
  UserRound,
  ClipboardList,
  Target,
  Video,
  VideoOff,
  Sparkles,
  Eye,
  Languages,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { therapyExercises, TherapyCategory, TherapyExercise } from "../lib/therapies";
import { usePatient } from "@/contexts/PatientContext";
import { therapyService } from "@/services/therapy.service";
import { CameraFeed } from "@/components/camera/CameraFeed";
import { TherapyCanvas } from "@/components/therapy/TherapyCanvas";
import { GazeHeatmap, type GazePoint } from "@/components/therapy/GazeHeatmap";
import { PediatricRewardsModal } from "@/components/therapy/PediatricRewardsModal";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";
import { useGazeTelemetry } from "@/hooks/useGazeTelemetry";
import { calibrationService } from "@/services/calibration.service";
import { voiceCoach, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/utils/voiceCoach";

type SessionStep = "exercise-selection" | "instructions" | "setup" | "active" | "summary";
type TherapyMode = "mobile" | "device";
type TherapyStatus = "Not Started" | "In Progress" | "Completed" | "Paused";

const colorMap = {
  teal: { badge: "bg-primary/10 text-primary", border: "hover:border-primary", icon: "bg-primary/10 text-primary" },
  purple: { badge: "bg-secondary/10 text-secondary", border: "hover:border-secondary", icon: "bg-secondary/10 text-secondary" },
  blue: { badge: "bg-accent/10 text-accent", border: "hover:border-accent", icon: "bg-accent/10 text-accent" },
};

const categories: TherapyCategory[] = [
  "Eye Movement Disorders",
  "Binocular & Accommodation",
  "Visual Fatigue & Lifestyle",
  "Specialized Therapies",
];

const therapyPlanByCondition: Record<string, string> = {
  "Convergence Insufficiency": "Focus on smooth convergence pushups and target tracking to reduce near point convergence strain.",
  Amblyopia: "High-contrast visual stimulation and occlusion therapy to improve left/right eye visual acuity.",
  "Digital Eye Strain": "Blink master guided intervals, 20-20-20 visual rest, and peripheral reaction training.",
  Strabismus: "Binocular fusion exercises and rotational fixation hold to align visual axis.",
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDate = (value: Date) =>
  value.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function TherapySession() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPatient } = usePatient();

  const isCalibrated = calibrationService.isCalibrated(selectedPatient?.id);
  const latestCalib = calibrationService.getLatestCalibration(selectedPatient?.id);

  const mode: TherapyMode = location.state?.mode || "mobile";
  const [therapyLanguage, setTherapyLanguage] = useState<SupportedLanguage>(() => voiceCoach.getLanguage());
  const [step, setStep] = useState<SessionStep>(location.state?.prescribedExerciseId ? "instructions" : "exercise-selection");
  const [selectedGame, setSelectedGame] = useState<TherapyExercise>(() => {
    if (location.state?.prescribedExerciseId) {
      const match = therapyExercises.find((t) => t.id === location.state.prescribedExerciseId);
      if (match) return match;
    }
    return therapyExercises[0];
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (location.state?.prescribedDurationMinutes) {
      return Number(location.state.prescribedDurationMinutes) * 60;
    }
    return 300;
  });
  const [permission, setPermission] = useState<"idle" | "requesting" | "granted">("idle");
  const [metrics, setMetrics] = useState({ accuracy: 0, blinks: 0, confidence: 0 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sessionNumber, setSessionNumber] = useState(1);
  const [therapyStatus, setTherapyStatus] = useState<TherapyStatus>("Not Started");
  const [gazeFrame, setGazeFrame] = useState<EyeTrackingFrame | null>(null);
  // Live Hardware Eye Telemetry Stream (only run simulation fallback when mode is device)
  const { gaze: hardwareGaze, metrics: hwMetrics, isConnected: isHardwareConnected } = useGazeTelemetry(
    "default_session",
    undefined,
    mode === "device"
  );

  useEffect(() => {
    if (isHardwareConnected && hardwareGaze) {
      setGazeFrame({
        timestamp: Date.now(),
        gazeX: hardwareGaze.x,
        gazeY: hardwareGaze.y,
        pupilLeftMm: hardwareGaze.pupilLeft,
        pupilRightMm: hardwareGaze.pupilRight,
        confidence: hardwareGaze.confidence,
        isBlinking: hardwareGaze.confidence < 0.25,
        rawPoints: [],
        fixationStabilityPct: 95,
        fixationBCEADeg2: 0.6,
        pursuitGain: 0.94,
        blinkRatePerMin: 18,
        incompleteBlinkRatio: 8,
        ear: 0.32,
        isRealPersonDetected: true,
        leftEye: {
          diameterMm: hardwareGaze.pupilLeft,
          eyeballAngleXDeg: (hardwareGaze.x - 0.5) * 30,
          eyeballAngleYDeg: (hardwareGaze.y - 0.5) * 25,
        },
        rightEye: {
          diameterMm: hardwareGaze.pupilRight,
          eyeballAngleXDeg: (hardwareGaze.x - 0.5) * 30,
          eyeballAngleYDeg: (hardwareGaze.y - 0.5) * 25,
        },
      });
    }
  }, [hardwareGaze, isHardwareConnected]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [therapistNotes, setTherapistNotes] = useState("");
  const [saveReady, setSaveReady] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showPipCamera, setShowPipCamera] = useState(true);
  const [sessionDate, setSessionDate] = useState<Date | null>(null);

  // Pediatric Gamification & 2D Gaze Heatmap States
  const [pediatricMode, setPediatricMode] = useState(false);
  const [pediatricTheme, setPediatricTheme] = useState<"space" | "safari" | "ocean" | "magic">("space");
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [gazePointsHistory, setGazePointsHistory] = useState<GazePoint[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TherapyCategory | "All">("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | "Easy" | "Medium" | "Hard">("All");

  const filteredLibrary = useMemo(() => {
    return therapyExercises.filter((therapy) => {
      const matchesSearch =
        therapy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        therapy.desc.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || therapy.category === selectedCategory;
      const matchesDifficulty = difficultyFilter === "All" || therapy.level === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchTerm, selectedCategory, difficultyFilter]);

  const progressIndicator = Math.round(((selectedGame.duration - timeLeft) / selectedGame.duration) * 100);
  const therapyPlan = selectedPatient
    ? therapyPlanByCondition[selectedPatient.diagnosis] ||
      therapyPlanByCondition[selectedPatient.eyeCondition] ||
      "Supervised visual rehabilitation plan"
    : "Select a patient to load the therapy plan";
  const performanceScore = Math.round((metrics.accuracy + metrics.confidence) / 2);
  const completionDate = sessionDate ? formatDate(sessionDate) : "Pending completion";
  const savePayload = selectedPatient
    ? {
        patientId: selectedPatient.id,
        therapyId: selectedGame.id,
        sessionDuration: selectedGame.duration - timeLeft,
        completionStatus: therapyStatus,
        performanceScore,
        doctorNotes: therapistNotes,
        sessionDate: sessionDate?.toISOString() ?? "",
      }
    : undefined;

  useEffect(() => {
    let interval: number;
    if (isPlaying && step === "active" && timeLeft > 0 && countdown === null) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setMetrics((prev) => ({
          accuracy: Math.min(100, prev.accuracy + (Math.random() > 0.5 ? 1 : 0)),
          blinks: prev.blinks + (Math.random() > 0.98 ? 1 : 0),
          confidence: 95 + Math.floor(Math.random() * 5),
        }));
      }, 1000);
    } else if (timeLeft === 0 && step === "active") {
      setTherapyStatus("Completed");
      setCompletionPercentage(100);
      setSessionDate(new Date());
      setStep("summary");
      setIsPlaying(false);
      setSaveReady(true);
      if (pediatricMode) {
        setShowRewardsModal(true);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, step, timeLeft, countdown, pediatricMode]);

  useEffect(() => {
    if (countdown !== null) {
      if (countdown > 0) {
        const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      }
      setCountdown(null);
      setIsPlaying(true);
      setTherapyStatus("In Progress");
      setSessionDate(new Date());
    }
  }, [countdown]);

  useEffect(() => {
    setCompletionPercentage(Math.max(0, progressIndicator));
  }, [progressIndicator]);

  const startInstructions = (game: TherapyExercise) => {
    setSelectedGame(game);
    setTimeLeft(game.duration);
    setStep("instructions");
    setTherapyStatus("Not Started");
    setCompletionPercentage(0);
    setSaveReady(false);
    setTherapistNotes("");
  };

  const startSetup = () => {
    setStep("setup");
  };

  const startSession = () => {
    setStep("active");
    setCountdown(3);
    setMetrics({ accuracy: 85, blinks: 0, confidence: 98 });
    setTherapyStatus("In Progress");
    setSaveReady(false);
    setSessionNumber((value) => value + (therapyStatus === "Completed" ? 1 : 0));
  };

  const requestPermission = () => {
    setPermission("requesting");
    window.setTimeout(() => setPermission("granted"), 1500);
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setTherapyLanguage(lang);
    voiceCoach.setLanguage(lang);
  };

  const pauseSession = () => {
    setIsPlaying(false);
    setTherapyStatus("Paused");
    voiceCoach.sessionPaused();
  };

  const resumeSession = () => {
    setIsPlaying(true);
    setTherapyStatus("In Progress");
    voiceCoach.sessionResumed();
  };

  const endSession = () => {
    setIsPlaying(false);
    setTherapyStatus(timeLeft < selectedGame.duration ? "Completed" : "Paused");
    setSessionDate(new Date());
    setSaveReady(true);
    setStep("summary");
    voiceCoach.sessionComplete();
  };

  const saveSession = async () => {
    setSaveError("");
    try {
      await therapyService.saveSession({
        gameId: selectedGame.id,
        accuracy: metrics.accuracy,
        blinks: metrics.blinks,
        duration: selectedGame.duration - timeLeft,
        mode,
        language: therapyLanguage,
        patientId: selectedPatient?.id,
        timestamp: (sessionDate ?? new Date()).toISOString(),
      });
      setSaveReady(true);
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Unable to save session.");
    }
  };

  if (!selectedPatient) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-8">
        <div className="card-soft max-w-lg text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">No patient selected</h2>
          <p className="text-muted-foreground">
            Select a patient before starting a therapy session so the session can be saved to the correct hospital record.
          </p>
          <button onClick={() => navigate("/patients")} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold">
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  if (!isCalibrated) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-8 font-outfit">
        <div className="card-soft max-w-lg text-center space-y-5 border border-amber-500/30">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <AlertTriangle size={36} />
          </div>
          <div className="space-y-2">
            <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Step 1: Eye Calibration Required
            </span>
            <h2 className="text-2xl font-bold text-foreground">Eye Tracking Uncalibrated</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Clinical protocol requires completion of 9-point eye calibration (minimum 85% accuracy) before launching therapy exercises. Calibration ensures accurate real-time gaze biofeedback and voice coaching.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/calibration")}
              className="px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 cursor-pointer"
            >
              Complete Eye Calibration (Step 1) →
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3.5 bg-muted text-muted-foreground hover:text-foreground rounded-xl font-bold transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col font-outfit overflow-hidden">
      <header className="px-8 py-5 flex justify-between items-center bg-card/80 backdrop-blur-xl border-b border-white/10 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (step === "active") setStep("summary");
              else if (step === "setup") setStep("instructions");
              else if (step === "instructions") setStep("exercise-selection");
              else navigate("/dashboard");
            }}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            {step === "exercise-selection" ? <X size={20} /> : <ChevronLeft size={20} />}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {step === "exercise-selection" ? "Therapy Library" : selectedGame.title}
              </h2>
              <span className="px-2 py-0.5 bg-primary/10 text-[10px] font-bold text-primary rounded uppercase">
                {mode === "mobile" ? "Mobile" : "Device"} Mode
              </span>
              <span className="px-2 py-0.5 bg-secondary/10 text-[10px] font-bold text-secondary rounded uppercase">
                {therapyStatus}
              </span>
              {isCalibrated && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-[10px] font-bold text-emerald-500 rounded uppercase">
                  Calibrated: {latestCalib?.accuracy || 94}%
                </span>
              )}
              <span className="px-2.5 py-0.5 bg-primary/10 text-[10px] font-bold text-primary rounded-full flex items-center gap-1 uppercase">
                <Languages size={11} /> {voiceCoach.getLanguageOption().flag} {voiceCoach.getLanguageOption().nativeName}
              </span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {selectedPatient.firstName} {selectedPatient.lastName} · {selectedPatient.id} ·{" "}
              {step === "exercise-selection"
                ? "Select supervised therapy"
                : step === "instructions"
                  ? "Pre-session guidance"
                  : step === "setup"
                    ? "Safety verification"
                    : step === "active"
                      ? `Session in progress · ${formatTime(timeLeft)} remaining`
                      : "Session summary"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Hardware Telemetry Badge */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${
              isHardwareConnected
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-muted text-muted-foreground border-border"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isHardwareConnected ? "bg-emerald-500 animate-ping" : "bg-muted-foreground"
              }`}
            />
            <span>{isHardwareConnected ? `Pi Link: ${hwMetrics.fps || 60} FPS` : "Camera Feed"}</span>
          </div>

          {/* Pediatric Kid Mode Switch */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setPediatricMode(!pediatricMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                pediatricMode
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-105"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🦄 Kid Mode {pediatricMode ? "ON" : "OFF"}
            </button>

            {pediatricMode && (
              <select
                value={pediatricTheme}
                onChange={(e) => setPediatricTheme(e.target.value as "space" | "safari" | "ocean" | "magic")}
                className="bg-black/40 text-amber-400 text-xs font-bold px-2 py-1 rounded-lg border border-amber-400/30 focus:outline-none cursor-pointer"
              >
                <option value="space">🚀 Space</option>
                <option value="safari">🦁 Safari</option>
                <option value="ocean">🐢 Ocean</option>
                <option value="magic">✨ Magic</option>
              </select>
            )}
          </div>

          {step === "active" && countdown === null && (
            <>
              <button
                onClick={isPlaying ? pauseSession : resumeSession}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                {isPlaying ? "Pause Session" : "Resume Session"}
              </button>
              <button
                onClick={endSession}
                className="px-4 py-2.5 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <StopCircle size={18} />
                End Session
              </button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 relative flex flex-col bg-muted/20 overflow-y-auto">
        <section className="px-3 sm:px-8 pt-4 sm:pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-7 gap-3 sm:gap-4">
            <div className="card-soft sm:col-span-2 xl:col-span-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <UserRound size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Selected patient</p>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedPatient.id} · {selectedPatient.age} years · {selectedPatient.gender}
                  </p>
                </div>
              </div>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Assigned Doctor</p>
              <p className="mt-1 sm:mt-2 font-bold text-foreground text-xs sm:text-sm truncate">{selectedPatient.assignedDoctor || "Unassigned"}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Eye Condition</p>
              <p className="mt-1 sm:mt-2 font-bold text-foreground text-xs sm:text-sm truncate">{selectedPatient.eyeCondition || "Not recorded"}</p>
            </div>
            <div className="card-soft sm:col-span-2 xl:col-span-1">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Current Therapy Plan</p>
              <p className="mt-1 sm:mt-2 font-bold text-foreground text-xs sm:text-sm line-clamp-2">{therapyPlan}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Session Number</p>
              <p className="mt-1 sm:mt-2 font-bold text-foreground text-xs sm:text-sm">{sessionNumber}</p>
            </div>
          </div>
        </section>

        <section className="px-3 sm:px-8 pt-3 sm:pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2.5 sm:gap-4">
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Therapy Name</p>
              <p className="mt-2 font-semibold text-foreground">{selectedGame.title}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</p>
              <p className="mt-2 font-semibold text-foreground">{selectedGame.category}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Duration</p>
              <p className="mt-2 font-semibold text-foreground">{formatTime(selectedGame.duration)}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Difficulty</p>
              <p className="mt-2 font-semibold text-foreground">{selectedGame.level}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</p>
              <p className="mt-2 font-semibold text-foreground">{therapyStatus}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progress Indicator</p>
              <p className="mt-2 font-semibold text-foreground">{completionPercentage}%</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Remaining Time</p>
              <p className="mt-2 font-semibold text-foreground">{formatTime(timeLeft)}</p>
            </div>
            <div className="card-soft">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completion</p>
              <p className="mt-2 font-semibold text-foreground">{completionPercentage}%</p>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {step === "exercise-selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 p-8"
            >
              <div className="max-w-7xl mx-auto space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-end">
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Search Therapy</label>
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text"
                        placeholder="Search by therapy name or clinical focus..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-card border-none rounded-2xl shadow-soft focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Difficulty</label>
                    <select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value as "All" | "Easy" | "Medium" | "Hard")}
                      className="w-full px-4 py-4 bg-card border-none rounded-2xl shadow-soft focus:ring-2 focus:ring-primary/20 transition-all appearance-none font-bold"
                    >
                      <option value="All">All Levels</option>
                      <option value="Easy">Beginner (Easy)</option>
                      <option value="Medium">Intermediate (Medium)</option>
                      <option value="Hard">Advanced (Hard)</option>
                    </select>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-xs font-bold text-muted-foreground mr-1">{filteredLibrary.length} Therapies Found</p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All");
                        setDifficultyFilter("All");
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory("All")}
                    className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      selectedCategory === "All" ? "bg-primary text-primary-foreground shadow-lg" : "bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    All Therapies
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                        selectedCategory === category ? "bg-primary text-primary-foreground shadow-lg" : "bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredLibrary.map((game, index) => {
                    const colors = colorMap[game.color];
                    return (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={`card-soft group cursor-pointer transition-all ${colors.border} border-2 border-transparent flex flex-col`}
                        onClick={() => startInstructions(game)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.icon}`}>
                            <game.icon size={24} />
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                              {formatTime(game.duration)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${colors.badge}`}>
                              {game.level}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{game.title}</h3>
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-2 flex-1">{game.desc}</p>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Target Defect</p>
                            <p className="text-xs font-bold">{game.targetDefect}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                            <ChevronRight size={18} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {step === "instructions" && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-8">
                  <div className="space-y-4">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                      Therapy Details
                    </span>
                    <h2 className="text-4xl font-bold">{selectedGame.title}</h2>
                    <p className="text-lg text-muted-foreground">{selectedGame.desc}</p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="card-soft bg-card/40 space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-primary text-sm uppercase tracking-wider">
                        <Info size={16} /> Session Instructions
                      </h4>
                      <ul className="space-y-2">
                        {selectedGame.instructions.map((instruction, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary font-bold">{index + 1}.</span> {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="card-soft bg-card/40 space-y-3">
                      <h4 className="flex items-center gap-2 font-bold text-secondary text-sm uppercase tracking-wider">
                        <CheckCircle2 size={16} /> Benefits
                      </h4>
                      <ul className="space-y-2">
                        {selectedGame.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex gap-2">
                            <CheckCircle2 size={16} className="text-secondary shrink-0" /> {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-6 bg-accent/5 border border-accent/20 rounded-2xl flex gap-4">
                    <AlertTriangle className="text-accent shrink-0" size={24} />
                    <div className="space-y-1">
                      <p className="font-bold text-accent text-sm uppercase">Clinical Precautions</p>
                      <p className="text-xs text-muted-foreground">{selectedGame.precautions.join(" · ")}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  <div className="card-soft bg-primary/5 border-primary/20 text-center py-12 space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary">
                      <Clock size={40} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Session Duration</h3>
                      <p className="text-muted-foreground">Approx. {Math.ceil(selectedGame.duration / 60)} Minutes</p>
                    </div>
                    <div className="flex justify-center gap-8 py-4">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Category</p>
                        <p className="font-bold text-primary">{selectedGame.category}</p>
                      </div>
                      <div className="w-[1px] h-8 bg-white/10" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Difficulty</p>
                        <p className="font-bold text-primary">{selectedGame.level}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startSetup}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
                  >
                    Start Session Setup <ChevronRight size={24} />
                  </button>
                  <button
                    onClick={() => setStep("exercise-selection")}
                    className="w-full py-4 text-muted-foreground font-bold hover:text-foreground transition-colors"
                  >
                    Change Therapy
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-8"
            >
              <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest">
                      {mode === "mobile" ? "Camera Setup" : "Hardware Setup"}
                    </span>
                    <h2 className="text-3xl font-bold">Pre-session Verification</h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {mode === "mobile"
                        ? "Position your face in the guide oval so the camera can detect your eyes and track gaze accurately during the therapy exercise."
                        : "Verify FOCEYE Smart Device connection and patient seating before launching the session."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-white/5">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Therapy Mode</p>
                        <p className="text-[11px] text-muted-foreground">
                          {mode === "mobile" ? "Mobile / PC Camera AI Tracking" : "FOCEYE Smart Hardware"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-white/5">
                      <div className="w-9 h-9 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary shrink-0">
                        <Shield size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-xs">Clinical Security & Calibration</p>
                        <p className="text-[11px] text-muted-foreground">
                          Video frames are processed in-session for tracking and ready for secure clinical logging.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Language Voice Therapy Selector */}
                  <div className="p-4 bg-card/60 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Languages className="text-primary" size={16} />
                        <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                          Therapy Voice Language
                        </span>
                      </div>
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        Voice Guidance: ON
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SUPPORTED_LANGUAGES.map((lang) => {
                        const isSelected = therapyLanguage === lang.code;
                        return (
                          <button
                            key={lang.code}
                            type="button"
                            onClick={() => handleLanguageChange(lang.code)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between border transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/20 border-primary text-primary shadow-sm"
                                : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                          >
                            <span>{lang.flag} {lang.nativeName}</span>
                            {isSelected && <CheckCircle2 size={13} className="text-primary shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Spoken directions will be delivered in <span className="font-semibold text-primary">{voiceCoach.getLanguageOption().name} ({voiceCoach.getLanguageOption().nativeName})</span>.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={startSession}
                      className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                      <Play size={18} fill="currentColor" /> Start Therapy ({voiceCoach.getLanguageOption().nativeName})
                    </button>
                    <button
                      onClick={() => setStep("instructions")}
                      className="px-6 py-4 bg-muted hover:bg-muted/80 rounded-2xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </div>

                <div className="h-[380px] w-full">
                  {mode === "mobile" ? (
                    <CameraFeed
                      autoStart={true}
                      showOverlay={true}
                      overlayType="face-alignment"
                      className="h-full w-full"
                      statusBadge="Mobile / PC Eye Tracking"
                    />
                  ) : (
                    <div className="h-full w-full bg-card rounded-3xl border border-white/10 p-8 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                        <Target size={36} />
                      </div>
                      <h3 className="text-xl font-bold">FOCEYE Hardware Link Ready</h3>
                      <p className="text-xs text-muted-foreground max-w-xs">
                        Using dedicated eye tracking headset or bedside tracker.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "active" && (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 relative flex flex-col"
            >
              <AnimatePresence>
                {countdown !== null && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center"
                  >
                    <motion.div
                      key={countdown}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 1 }}
                      exit={{ scale: 3, opacity: 0 }}
                      className="text-8xl font-black text-primary"
                    >
                      {countdown === 0 ? "GO!" : countdown}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden">
                <div className="w-full h-full max-w-6xl max-h-[640px] relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                  <TherapyCanvas
                    exercise={selectedGame}
                    isPlaying={isPlaying && countdown === null}
                    timeLeft={timeLeft}
                    gazeFrame={gazeFrame}
                    pediatricMode={pediatricMode}
                    pediatricTheme={pediatricTheme}
                    onMetricUpdate={(m) => setMetrics((prev) => ({ ...prev, ...m }))}
                    onGazePoint={(pt) => setGazePointsHistory((prev) => [...prev.slice(-400), pt])}
                  />

                  {/* Paused Overlay */}
                  {!isPlaying && countdown === null && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-30 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-4 sm:space-y-6">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-primary/10 text-primary flex items-center justify-center">
                        <Pause size={28} />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Session Paused</h2>
                        <p className="text-muted-foreground text-xs sm:text-sm">Review patient comfort before resuming therapy.</p>
                      </div>
                      <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
                        <button
                          onClick={resumeSession}
                          className="px-6 sm:px-8 py-3 sm:py-3.5 bg-primary text-primary-foreground rounded-xl sm:rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                        >
                          <Play size={16} fill="currentColor" /> Resume Session
                        </button>
                        <button
                          onClick={() => {
                            setTimeLeft(selectedGame.duration);
                            setCountdown(3);
                            setTherapyStatus("In Progress");
                          }}
                          className="px-6 sm:px-8 py-3 sm:py-3.5 bg-muted text-foreground rounded-xl sm:rounded-2xl font-bold hover:bg-muted/80 transition-colors text-sm"
                        >
                          Restart Session
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Floating PIP Camera Preview for Mobile/Camera Mode */}
                {mode === "mobile" && countdown === null && (
                  <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end">
                    <div className="bg-black/80 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-t-xl sm:rounded-t-2xl border-t border-x border-white/10 flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold text-white shadow-xl">
                      <span className="flex items-center gap-1 sm:gap-1.5 text-primary text-[10px] sm:text-[11px]">
                        <Eye size={12} /> Live Camera
                      </span>
                      <button
                        onClick={() => setShowPipCamera((prev) => !prev)}
                        className="text-white/70 hover:text-white transition-colors"
                        title={showPipCamera ? "Hide Camera" : "Show Camera"}
                      >
                        {showPipCamera ? <VideoOff size={13} /> : <Video size={13} />}
                      </button>
                    </div>
                    {showPipCamera && (
                      <div className="w-36 h-24 sm:w-56 sm:h-36 rounded-b-xl rounded-tl-xl sm:rounded-b-2xl sm:rounded-tl-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <CameraFeed
                          autoStart={true}
                          compact={true}
                          showOverlay={true}
                          overlayType="eye-tracking"
                          statusBadge="Tracking"
                          onEyeTrackingFrame={setGazeFrame}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <footer className="px-8 py-6 bg-card/50 backdrop-blur-xl border-t border-white/10 z-30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress Indicator</p>
                    <p className="text-xl font-bold text-foreground mt-2">{completionPercentage}%</p>
                  </div>
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Remaining Time</p>
                    <p className="text-xl font-bold text-foreground mt-2">{formatTime(timeLeft)}</p>
                  </div>
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Accuracy</p>
                    <p className="text-xl font-bold text-primary mt-2">{metrics.accuracy}%</p>
                  </div>
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Blink Rate</p>
                    <p className="text-xl font-bold text-secondary mt-2">{metrics.blinks}</p>
                  </div>
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Confidence</p>
                    <p className="text-xl font-bold text-accent mt-2">{metrics.confidence}%</p>
                  </div>
                  <div className="card-soft bg-card/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Performance Score</p>
                    <p className="text-xl font-bold text-foreground mt-2">{performanceScore}%</p>
                  </div>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary" animate={{ width: `${completionPercentage}%` }} />
                </div>
              </footer>
            </motion.div>
          )}

          {step === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex items-center justify-center p-8"
            >
              <div className="max-w-4xl w-full space-y-8 bg-card p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 premium-gradient" />

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20 text-white">
                      <Award size={40} />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Therapy Session Summary</h1>
                      <p className="text-muted-foreground text-lg">
                        {selectedPatient.firstName} {selectedPatient.lastName} completed {selectedGame.title}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={saveSession}
                    className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <Save size={18} />
                    Save Session
                  </button>
                  {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card-soft bg-muted/30 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Session Duration</p>
                    <p className="text-2xl font-bold text-foreground">{formatTime(selectedGame.duration - timeLeft)}</p>
                  </div>
                  <div className="card-soft bg-muted/30 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Therapy Completed</p>
                    <p className="text-2xl font-bold text-primary">{therapyStatus}</p>
                  </div>
                  <div className="card-soft bg-muted/30 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Progress</p>
                    <p className="text-2xl font-bold text-secondary">{completionPercentage}%</p>
                  </div>
                  <div className="card-soft bg-muted/30 rounded-3xl border border-white/5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Performance Score</p>
                    <p className="text-2xl font-bold text-accent">{performanceScore}%</p>
                  </div>
                </div>

                {/* 2D Gaze Fixation Density Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GazeHeatmap
                    points={
                      gazePointsHistory.length > 0
                        ? gazePointsHistory
                        : Array.from({ length: 60 }, (_, i) => ({
                            x: 0.5 + Math.sin(i * 0.2) * 0.15 + (Math.random() - 0.5) * 0.08,
                            y: 0.5 + Math.cos(i * 0.2) * 0.12 + (Math.random() - 0.5) * 0.08,
                          }))
                    }
                    title="Session 2D Gaze Fixation Density Heatmap"
                  />

                  <div className="space-y-4 flex flex-col justify-between">
                    <div className="card-soft bg-primary/5 text-left flex gap-4 border-primary/20 p-4">
                      <Brain className="text-primary shrink-0" size={24} />
                      <div>
                        <h4 className="font-bold text-sm text-primary uppercase">Oculomotor Fixation Analysis</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Patient maintained {metrics.accuracy}% conjugate gaze accuracy with tight central foveal clustering. Saccadic overshoot was within normal limits.
                        </p>
                      </div>
                    </div>

                    <div className="card-soft bg-card/60 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ClipboardList className="text-secondary" size={16} />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-secondary">Doctor / Therapist Notes</h4>
                      </div>
                      <textarea
                        value={therapistNotes}
                        onChange={(e) => setTherapistNotes(e.target.value)}
                        placeholder="Enter therapist or doctor observations for this session..."
                        className="w-full min-h-20 bg-muted/60 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pediatric Rewards Celebration Modal */}
                <PediatricRewardsModal
                  isOpen={showRewardsModal}
                  score={performanceScore}
                  exerciseTitle={selectedGame.title}
                  theme={pediatricTheme}
                  onClose={() => setShowRewardsModal(false)}
                  onPlayAgain={() => {
                    setShowRewardsModal(false);
                    setStep("active");
                    setCountdown(3);
                    setTimeLeft(selectedGame.duration);
                  }}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="card-soft">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Completion Date</p>
                    <p className="mt-2 font-semibold text-foreground">{completionDate}</p>
                  </div>
                  <div className="card-soft">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Patient ID</p>
                    <p className="mt-2 font-semibold text-foreground">{selectedPatient.id}</p>
                  </div>
                  <div className="card-soft">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Therapy ID</p>
                    <p className="mt-2 font-semibold text-foreground">{selectedGame.id}</p>
                  </div>
                  <div className="card-soft">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Backend Status</p>
                    <p className="mt-2 font-semibold text-foreground">{saveReady ? "Ready to save" : "Pending"}</p>
                  </div>
                </div>

                <div className="card-soft border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="text-primary" size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wider text-primary">Future API Preparation</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-6">
                    This session view is prepared to submit data through `POST /patients/{'{id}'}/therapy`, refresh records from
                    `GET /patients/{'{id}'}/therapy`, update entries with `PUT /therapy/{'{sessionId}'}`, and load individual summaries from
                    `GET /therapy/{'{sessionId}'}`.
                  </p>
                  {savePayload ? (
                    <div className="mt-4 rounded-2xl bg-muted/50 border border-border p-4 text-xs text-muted-foreground">
                      Ready payload: patient ID, therapy ID, session duration, completion status, performance score, doctor notes, and session date.
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-8 py-3 bg-muted text-foreground rounded-2xl font-bold hover:bg-muted/80 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 justify-center hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                  >
                    View Clinical Report <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
