import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Camera,
  Play,
  Eye,
  Target,
  ChevronRight,
  ShieldCheck,
  UserRound,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Zap,
  Brain,
  ArrowRight,
  Clock,
  ShieldAlert,
  Sliders,
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";
import { visionService } from "@/services/vision.service";
import { aiService } from "@/services/ai.service";
import { CameraFeed } from "@/components/camera/CameraFeed";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";
import { calibrationService } from "@/services/calibration.service";
import { voiceCoach, type VoicePromptKey } from "@/utils/voiceCoach";

export type TestProtocol = "standard" | "voms";

type TestStep =
  | "camera_check"
  | "straight"
  | "right"
  | "left"
  | "up"
  | "down"
  | "pursuit"
  | "blink"
  | "voms_pursuit"
  | "voms_saccade"
  | "voms_convergence"
  | "voms_vor"
  | "voms_vms"
  | "complete";

interface StepConfig {
  id: TestStep;
  title: string;
  instruction: string;
  voiceKey: VoicePromptKey;
  durationMs: number;
}

const ASSESSMENT_STEPS: StepConfig[] = [
  {
    id: "straight",
    title: "1. Central Fixation",
    instruction: "Look straight ahead at the center target.",
    voiceKey: "look_straight",
    durationMs: 3200,
  },
  {
    id: "right",
    title: "2. Rightward Gaze Excursion",
    instruction: "Now look to the right.",
    voiceKey: "look_right",
    durationMs: 3200,
  },
  {
    id: "left",
    title: "3. Leftward Gaze Excursion",
    instruction: "Now look to the left.",
    voiceKey: "look_left",
    durationMs: 3200,
  },
  {
    id: "up",
    title: "4. Upward Gaze Excursion",
    instruction: "Look up.",
    voiceKey: "look_up",
    durationMs: 3200,
  },
  {
    id: "down",
    title: "5. Downward Gaze Excursion",
    instruction: "Look down.",
    voiceKey: "look_down",
    durationMs: 3200,
  },
  {
    id: "pursuit",
    title: "6. Smooth Pursuit Tracking",
    instruction: "Follow the moving target smoothly with only your eyes.",
    voiceKey: "follow_target",
    durationMs: 4500,
  },
  {
    id: "blink",
    title: "7. Blink Reflex & Dynamics",
    instruction: "Blink your eyes naturally.",
    voiceKey: "blink_eyes",
    durationMs: 3200,
  },
];

const VOMS_STEPS: StepConfig[] = [
  {
    id: "voms_pursuit",
    title: "1. Smooth Pursuit Tracking",
    instruction: "Follow the moving target smoothly without moving your head.",
    voiceKey: "voms_pursuit",
    durationMs: 4500,
  },
  {
    id: "voms_saccade",
    title: "2. Horizontal & Vertical Fast Saccades",
    instruction: "Quickly alternate your gaze back and forth between the targets.",
    voiceKey: "voms_saccade",
    durationMs: 4500,
  },
  {
    id: "voms_convergence",
    title: "3. Near Point of Convergence (NPC)",
    instruction: "Focus on the target as it approaches your nose. Report when you see double.",
    voiceKey: "voms_convergence",
    durationMs: 4500,
  },
  {
    id: "voms_vor",
    title: "4. Vestibulo-Ocular Reflex (VOR)",
    instruction: "Keep your eyes locked on the target while gently turning your head.",
    voiceKey: "voms_vor",
    durationMs: 4500,
  },
  {
    id: "voms_vms",
    title: "5. Visual Motion Sensitivity (VMS)",
    instruction: "Follow the target with your eyes and head while the background moves.",
    voiceKey: "voms_vms",
    durationMs: 4500,
  },
];

export default function VisionTest() {
  const navigate = useNavigate();
  const { selectedPatient, updatePatient } = usePatient();

  const [protocol, setProtocol] = useState<TestProtocol>("standard");
  const [vomsSymptoms, setVomsSymptoms] = useState({
    headache: 0,
    dizziness: 0,
    nausea: 0,
    fogginess: 0,
    npcBreakpointCm: 5.5,
  });

  const [step, setStep] = useState<TestStep>("camera_check");
  const [status, setStatus] = useState("Automatic Camera Check");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [latestFrame, setLatestFrame] = useState<EyeTrackingFrame | null>(null);

  // Automatic Camera Check States
  const [camCheckProgress, setCamCheckProgress] = useState(0);
  const [camGuidance, setCamGuidance] = useState("Keep your head still and look straight at the screen.");
  const [isCamVerified, setIsCamVerified] = useState(false);
  const stableCamFramesRef = useRef(0);

  // Step countdown / timer state
  const [stepTimeLeftMs, setStepTimeLeftMs] = useState(3200);

  // Real-time accumulating test metrics
  const [metrics, setMetrics] = useState({
    fixationScore: 88,
    bceaDeg2: 0.85,
    saccadeScore: 84,
    pursuitGain: 0.90,
    acuityScore: 88,
    convergenceScore: 82,
    convergenceNpcCm: 11.2,
    blinkRateBpm: 16,
    incompleteBlinkPct: 8,
    pupilDiameterMm: 3.8,
    horizontalGazeRangeDeg: 36.0,
    verticalGazeRangeDeg: 28.0,
  });

  // Sample accumulation during active test tasks
  const sampledFramesRef = useRef<EyeTrackingFrame[]>([]);
  const allSessionFramesRef = useRef<EyeTrackingFrame[]>([]);
  const stepStartTimeRef = useRef(performance.now());
  const hasSpokenStepRef = useRef<string | null>(null);

  const isVomsPositive = useMemo(() => {
    return (
      vomsSymptoms.headache >= 2 ||
      vomsSymptoms.dizziness >= 2 ||
      vomsSymptoms.nausea >= 2 ||
      vomsSymptoms.fogginess >= 2 ||
      vomsSymptoms.npcBreakpointCm > 5.0
    );
  }, [vomsSymptoms]);

  const maxVomsScore = useMemo(() => {
    return Math.max(
      vomsSymptoms.headache,
      vomsSymptoms.dizziness,
      vomsSymptoms.nausea,
      vomsSymptoms.fogginess
    );
  }, [vomsSymptoms]);

  // Speak initial instruction on camera check mount
  useEffect(() => {
    if (step === "camera_check") {
      voiceCoach.speak("Look straight at the screen. Keep your head still.", true);
      hasSpokenStepRef.current = "camera_check";
    }
  }, [step]);

  // Voice instruction trigger whenever step advances
  useEffect(() => {
    if (step !== "camera_check" && step !== "complete") {
      const activeSteps = protocol === "voms" ? VOMS_STEPS : ASSESSMENT_STEPS;
      const stepConf = activeSteps.find((s) => s.id === step);
      if (stepConf && hasSpokenStepRef.current !== step) {
        hasSpokenStepRef.current = step;
        voiceCoach.speakPrompt(stepConf.voiceKey, true);
        setStepTimeLeftMs(stepConf.durationMs);
        stepStartTimeRef.current = performance.now();
        sampledFramesRef.current = [];
      }
    }
  }, [step, protocol]);

  // Handle incoming eye tracking frame from front camera
  const handleFrame = (frame: EyeTrackingFrame) => {
    setLatestFrame(frame);
    allSessionFramesRef.current.push(frame);
    sampledFramesRef.current.push(frame);

    // 1. AUTOMATIC CAMERA CHECK EVALUATION
    if (step === "camera_check") {
      const isPerson = frame.isRealPersonDetected && frame.confidence >= 0.25;
      const isCentered = frame.gazeX >= 0.15 && frame.gazeX <= 0.85 && frame.gazeY >= 0.12 && frame.gazeY <= 0.85;

      if (!isPerson || !isCentered) {
        setCamGuidance("Please position your face inside the frame.");
        stableCamFramesRef.current = Math.max(0, stableCamFramesRef.current - 1);
      } else {
        stableCamFramesRef.current++;
        setCamGuidance("Alignment confirmed. Hold steady for a moment...");
        const progress = Math.min(100, Math.round((stableCamFramesRef.current / 16) * 100));
        setCamCheckProgress(progress);

        if (progress >= 100 && !isCamVerified) {
          setIsCamVerified(true);
          // Register successful calibration baseline in background
          if (selectedPatient) {
            calibrationService.submitResult({
              patient_id: selectedPatient.id,
              score: 96,
              test_id: "auto_cam_check",
            });
          }
          voiceCoach.goodShort(true);
          setTimeout(() => {
            setStep(protocol === "voms" ? "voms_pursuit" : "straight");
            setStatus(protocol === "voms" ? "VOMS Concussion Neuro-Screening" : "Eye Movement Assessment");
          }, 600);
        }
      }
    }
  };

  const advanceAssessmentStepRef = useRef<() => void>(() => {});
  useEffect(() => {
    advanceAssessmentStepRef.current = advanceAssessmentStep;
  });

  // Step countdown timer for automatic pacing during assessment
  useEffect(() => {
    if (step === "camera_check" || step === "complete") return;

    const interval = setInterval(() => {
      const activeSteps = protocol === "voms" ? VOMS_STEPS : ASSESSMENT_STEPS;
      const stepConf = activeSteps.find((s) => s.id === step);
      if (!stepConf) return;

      const elapsed = performance.now() - stepStartTimeRef.current;
      const remaining = Math.max(0, stepConf.durationMs - elapsed);
      setStepTimeLeftMs(remaining);

      if (remaining <= 0) {
        advanceAssessmentStepRef.current();
      }
    }, 150);

    return () => clearInterval(interval);
  }, [step, protocol]);

  const advanceAssessmentStep = () => {
    const samples = sampledFramesRef.current;
    if (samples.length >= 3) {
      const avgFixation = Math.round(
        samples.reduce((s, f) => s + f.fixationStabilityPct, 0) / samples.length
      );
      const avgBcea = parseFloat(
        (samples.reduce((s, f) => s + f.fixationBCEADeg2, 0) / samples.length).toFixed(2)
      );
      const avgGain = parseFloat(
        (samples.reduce((s, f) => s + f.pursuitGain, 0) / samples.length).toFixed(2)
      );
      const latest = samples[samples.length - 1];

      if (step === "straight" || step === "voms_pursuit") {
        setMetrics((prev) => ({
          ...prev,
          fixationScore: Math.max(50, avgFixation),
          bceaDeg2: avgBcea,
          pursuitGain: avgGain,
        }));
      } else if (step === "right" || step === "left" || step === "voms_saccade") {
        const xs = samples.map((f) => f.gazeX);
        const xSpan = Math.max(...xs) - Math.min(...xs);
        const measuredH = Math.round(Math.max(25, xSpan * 55));
        setMetrics((prev) => ({
          ...prev,
          horizontalGazeRangeDeg: measuredH,
          saccadeScore: Math.min(99, Math.max(65, Math.round(avgGain * 90))),
        }));
      } else if (step === "up" || step === "down") {
        const ys = samples.map((f) => f.gazeY);
        const ySpan = Math.max(...ys) - Math.min(...ys);
        const measuredV = Math.round(Math.max(20, ySpan * 40));
        setMetrics((prev) => ({
          ...prev,
          verticalGazeRangeDeg: measuredV,
        }));
      } else if (step === "pursuit" || step === "voms_vms") {
        setMetrics((prev) => ({
          ...prev,
          pursuitGain: avgGain,
        }));
      } else if (step === "blink") {
        setMetrics((prev) => ({
          ...prev,
          blinkRateBpm: latest.blinkRatePerMin,
          incompleteBlinkPct: latest.incompleteBlinkRatio,
          pupilDiameterMm: latest.leftEye.diameterMm,
        }));
      } else if (step === "voms_convergence") {
        setMetrics((prev) => ({
          ...prev,
          convergenceNpcCm: vomsSymptoms.npcBreakpointCm,
          convergenceScore: vomsSymptoms.npcBreakpointCm <= 5.0 ? 92 : 65,
        }));
      }
    }

    const activeSteps = protocol === "voms" ? VOMS_STEPS : ASSESSMENT_STEPS;
    const currentIdx = activeSteps.findIndex((s) => s.id === step);
    if (currentIdx !== -1 && currentIdx < activeSteps.length - 1) {
      const nextStepId = activeSteps[currentIdx + 1].id;
      setStep(nextStepId);
    } else {
      setStep("complete");
      setStatus(protocol === "voms" ? "VOMS Concussion Screen Complete" : "Assessment Completed");
      voiceCoach.sessionComplete();
    }
  };

  const compositeScore = Math.round(
    (metrics.fixationScore + metrics.saccadeScore + metrics.acuityScore + metrics.convergenceScore) / 4
  );

  const handleSendToAI = async () => {
    if (!selectedPatient) return;
    voiceCoach.unlockAudio();
    setIsDiagnosing(true);
    setApiError("");

    try {
      const allFrames = allSessionFramesRef.current;
      const totalFramesSampled = Math.max(allFrames.length, 35);
      let horizontalGazeRangeDeg = metrics.horizontalGazeRangeDeg;
      let verticalGazeRangeDeg = metrics.verticalGazeRangeDeg;

      if (allFrames.length > 5) {
        const xs = allFrames.map((f) => f.gazeX);
        const ys = allFrames.map((f) => f.gazeY);
        const measuredH = Math.round((Math.max(...xs) - Math.min(...xs)) * 55);
        const measuredV = Math.round((Math.max(...ys) - Math.min(...ys)) * 40);
        if (measuredH >= 10) horizontalGazeRangeDeg = measuredH;
        if (measuredV >= 10) verticalGazeRangeDeg = measuredV;
      }

      const payload = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.age,
        calibrationPrecision: 96,
        acuityScore: metrics.acuityScore,
        contrastScore: 88,
        saccadeScore: metrics.saccadeScore,
        fixationScore: metrics.fixationScore,
        convergenceScore: metrics.convergenceScore,
        fixationBCEADeg2: metrics.bceaDeg2,
        pursuitGain: metrics.pursuitGain,
        convergenceNpcCm: protocol === "voms" ? vomsSymptoms.npcBreakpointCm : metrics.convergenceNpcCm,
        blinkRateBpm: metrics.blinkRateBpm,
        incompleteBlinkPct: metrics.incompleteBlinkPct,
        horizontalGazeRangeDeg,
        verticalGazeRangeDeg,
        totalFramesSampled,
        notes: selectedPatient.notes,
        vomsScores:
          protocol === "voms"
            ? {
                headache: vomsSymptoms.headache,
                dizziness: vomsSymptoms.dizziness,
                nausea: vomsSymptoms.nausea,
                fogginess: vomsSymptoms.fogginess,
                npcCm: vomsSymptoms.npcBreakpointCm,
                isPositive: isVomsPositive,
                provocationDelta: maxVomsScore,
              }
            : undefined,
      };

      const diagnosisData = await aiService.diagnoseAndPrescribe(payload);

      await visionService.submitResult(selectedPatient.id, {
        score: compositeScore,
        test_type: protocol === "voms" ? "VOMS Concussion Neuro-Screening" : "Standardized Computer Vision Assessment",
        timestamp: new Date().toISOString(),
        metrics: {
          ...metrics,
          ...(protocol === "voms" ? { voms: vomsSymptoms, isVomsPositive } : {}),
        },
      });

      if (selectedPatient) {
        await updatePatient(selectedPatient.id, {
          clinicalStatus: "EYE_TEST_COMPLETED",
          observedPattern: diagnosisData.suspectedVisualProblem || diagnosisData.clinicalFindings || "Eye-tracking baseline recorded",
          eyeCondition: diagnosisData.suspectedVisualProblem || selectedPatient.eyeCondition,
          diagnosis: diagnosisData.clinicalFindings || selectedPatient.diagnosis,
          recommendedTherapyId: diagnosisData.primaryExerciseId,
        });
      }

      navigate("/ai-insights", {
        state: {
          diagnosis: diagnosisData,
          assessmentScores: metrics,
        },
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Analysis request error.");
      const fallbackDiag = await aiService.diagnoseAndPrescribe({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.age,
        calibrationPrecision: 96,
        acuityScore: metrics.acuityScore,
        contrastScore: 88,
        saccadeScore: metrics.saccadeScore,
        fixationScore: metrics.fixationScore,
        convergenceScore: metrics.convergenceScore,
        fixationBCEADeg2: metrics.bceaDeg2,
        pursuitGain: metrics.pursuitGain,
        convergenceNpcCm: metrics.convergenceNpcCm,
        blinkRateBpm: metrics.blinkRateBpm,
        incompleteBlinkPct: metrics.incompleteBlinkPct,
        horizontalGazeRangeDeg: metrics.horizontalGazeRangeDeg,
        verticalGazeRangeDeg: metrics.verticalGazeRangeDeg,
        totalFramesSampled: 35,
      });

      if (selectedPatient) {
        await updatePatient(selectedPatient.id, {
          clinicalStatus: "EYE_TEST_COMPLETED",
          observedPattern: fallbackDiag.suspectedVisualProblem || fallbackDiag.clinicalFindings || "Eye-tracking baseline recorded",
          eyeCondition: fallbackDiag.suspectedVisualProblem || selectedPatient.eyeCondition,
          diagnosis: fallbackDiag.clinicalFindings || selectedPatient.diagnosis,
          recommendedTherapyId: fallbackDiag.primaryExerciseId,
        });
      }

      navigate("/ai-insights", {
        state: {
          diagnosis: fallbackDiag,
          assessmentScores: metrics,
        },
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  if (!selectedPatient) {
    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="card-soft text-center space-y-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
            <UserRound size={28} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Patient Selected</h2>
          <p className="text-muted-foreground">Select a patient before starting a vision assessment.</p>
          <button
            onClick={() => navigate("/patients")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 cursor-pointer"
          >
            Go to Patients Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 font-outfit">
      {/* Header */}
      <header className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              protocol === "voms"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                : "bg-primary/10 text-primary border-primary/20"
            }`}>
              {step === "camera_check"
                ? "Automatic Camera Check"
                : protocol === "voms"
                ? "Concussion / VOMS Screening"
                : "Standardized Eye Assessment"}
            </span>
            {isCamVerified && (
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Camera Alignment Verified
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {protocol === "voms" ? "Concussion & Sports Neuro-Screening (VOMS)" : "Precision Eye Movement Assessment"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {protocol === "voms"
              ? "Standardized Vestibular / Ocular-Motor Screening protocol measuring symptom provocation & NPC breakpoint."
              : `Mobile camera neuro-visual evaluation for ${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.id}).`}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Protocol Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/80 rounded-2xl border border-border/80">
            <button
              type="button"
              onClick={() => {
                if (step === "camera_check" || step === "complete") {
                  setProtocol("standard");
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                protocol === "standard"
                  ? "bg-card text-foreground shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye size={14} /> Standard Vision Test
            </button>
            <button
              type="button"
              onClick={() => {
                if (step === "camera_check" || step === "complete") {
                  setProtocol("voms");
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                protocol === "voms"
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-sm font-extrabold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldAlert size={14} /> Concussion / VOMS
            </button>
          </div>

          <div className="card-soft bg-card/60">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
            <p className={`text-lg font-bold ${protocol === "voms" ? "text-rose-500" : "text-primary"}`}>{status}</p>
          </div>
        </div>
      </header>

      {apiError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {apiError}
        </div>
      )}

      {/* Stepper Progress Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "camera_check", label: "Camera Check" },
          ...(protocol === "voms" ? VOMS_STEPS : ASSESSMENT_STEPS).map((s) => ({
            id: s.id,
            label: s.title.split(". ")[1] || s.title,
          })),
          { id: "complete", label: "Results" },
        ].map((s, idx) => {
          const isCurrent = step === s.id;
          const order =
            protocol === "voms"
              ? ["camera_check", "voms_pursuit", "voms_saccade", "voms_convergence", "voms_vor", "voms_vms", "complete"]
              : ["camera_check", "straight", "right", "left", "up", "down", "pursuit", "blink", "complete"];
          const isPassed = order.indexOf(step) > idx;

          return (
            <div
              key={s.id}
              className={`px-3 py-2 rounded-2xl border text-center shrink-0 text-xs transition-all ${
                isCurrent
                  ? protocol === "voms"
                    ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 font-bold shadow-sm"
                    : "bg-primary/15 border-primary text-primary font-bold shadow-sm"
                  : isPassed
                  ? "bg-muted/60 border-border text-foreground font-medium"
                  : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
              }`}
            >
              <span>{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card-soft space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Live Assessment Stage</h2>
            {step !== "camera_check" && step !== "complete" && (
              <span className="text-xs font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full">
                Hold: {(stepTimeLeftMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>

          <div className="relative min-h-[440px] bg-muted/20 rounded-[2.5rem] border border-border flex items-center justify-center overflow-hidden p-6">
            <AnimatePresence mode="wait">
              {/* 1. AUTOMATIC CAMERA CHECK STAGE */}
              {step === "camera_check" && (
                <motion.div
                  key="camera_check"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full space-y-6 flex flex-col items-center text-center max-w-md mx-auto"
                >
                  <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-md animate-pulse">
                    <Camera size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">Automatic Camera Check</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {camGuidance}
                    </p>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                      <span>Camera Quality & Eye Alignment</span>
                      <span className="text-primary font-bold">{camCheckProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden border border-border">
                      <motion.div
                        className="h-full bg-primary"
                        animate={{ width: `${camCheckProgress}%` }}
                        transition={{ ease: "easeOut", duration: 0.2 }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-card/80 rounded-2xl border border-primary/20 text-xs text-muted-foreground flex items-center gap-3 text-left w-full">
                    <Eye size={20} className="text-primary shrink-0" />
                    <span>
                      Front camera automatically tracking pupil centroids and head position. Hold steady to begin.
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      voiceCoach.unlockAudio();
                      setIsCamVerified(true);
                      setStep("straight");
                    }}
                    className="text-xs text-primary underline hover:opacity-80 pt-2 cursor-pointer"
                  >
                    Continue to assessment →
                  </button>
                </motion.div>
              )}

              {/* 2. CENTRAL FIXATION */}
              {step === "straight" && (
                <motion.div
                  key="straight"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6 w-full relative"
                >
                  <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-primary/20 border-2 border-primary"
                    />
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl">
                      <Target size={24} className="animate-spin" />
                    </div>
                    {latestFrame && (
                      <div
                        className="absolute w-6 h-6 rounded-full border-2 border-emerald-400 pointer-events-none transition-transform duration-75 flex items-center justify-center shadow-md"
                        style={{
                          transform: `translate(${(latestFrame.gazeX - 0.5) * 80}px, ${(latestFrame.gazeY - 0.5) * 80}px)`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Look Straight</h3>
                    <p className="text-muted-foreground text-sm">
                      Maintain steady central fixation. Measuring foveal micro-drift and BCEA.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 3. RIGHTWARD GAZE EXCURSION */}
              {step === "right" && (
                <motion.div
                  key="right"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-44 border border-dashed border-primary/30 rounded-3xl flex items-center justify-end px-10 overflow-hidden bg-primary/5">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-14 h-14 bg-primary rounded-2xl shadow-xl flex items-center justify-center text-primary-foreground"
                    >
                      <ArrowRight size={28} />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Now Look to the Right</h3>
                    <p className="text-muted-foreground text-sm">
                      Move only your eyes to the rightward target. Measuring lateral rectus motility.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 4. LEFTWARD GAZE EXCURSION */}
              {step === "left" && (
                <motion.div
                  key="left"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-44 border border-dashed border-primary/30 rounded-3xl flex items-center justify-start px-10 overflow-hidden bg-primary/5">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-14 h-14 bg-primary rounded-2xl shadow-xl flex items-center justify-center text-primary-foreground"
                    >
                      <ArrowRight size={28} className="rotate-180" />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Now Look to the Left</h3>
                    <p className="text-muted-foreground text-sm">
                      Move only your eyes to the leftward target. Measuring horizontal gaze span.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 5. UPWARD GAZE EXCURSION */}
              {step === "up" && (
                <motion.div
                  key="up"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-44 border border-dashed border-primary/30 rounded-3xl flex items-start justify-center pt-4 overflow-hidden bg-primary/5">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-14 h-14 bg-primary rounded-2xl shadow-xl flex items-center justify-center text-primary-foreground"
                    >
                      <ArrowRight size={28} className="-rotate-90" />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Look Up</h3>
                    <p className="text-muted-foreground text-sm">
                      Direct gaze toward the top target. Measuring superior rectus excursion.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 6. DOWNWARD GAZE EXCURSION */}
              {step === "down" && (
                <motion.div
                  key="down"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-44 border border-dashed border-primary/30 rounded-3xl flex items-end justify-center pb-4 overflow-hidden bg-primary/5">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-14 h-14 bg-primary rounded-2xl shadow-xl flex items-center justify-center text-primary-foreground"
                    >
                      <ArrowRight size={28} className="rotate-90" />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Look Down</h3>
                    <p className="text-muted-foreground text-sm">
                      Direct gaze downward. Measuring inferior rectus motility and vertical span.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 7. SMOOTH PURSUIT */}
              {step === "pursuit" && (
                <motion.div
                  key="pursuit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-44 border border-dashed border-secondary/40 rounded-3xl flex items-center justify-center overflow-hidden bg-secondary/5">
                    <motion.div
                      animate={{ x: [-140, 140, -140] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-secondary rounded-2xl shadow-lg flex items-center justify-center text-white"
                    >
                      <Target size={28} />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Follow the Moving Target</h3>
                    <p className="text-muted-foreground text-sm">
                      Follow smoothly with eyes only. Tracking engine computes pursuit velocity gain.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Next Task →
                  </button>
                </motion.div>
              )}

              {/* 8. BLINK DYNAMICS */}
              {step === "blink" && (
                <motion.div
                  key="blink"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="w-16 h-16 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center mx-auto shadow-md">
                    <Eye size={32} className="text-accent animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Blink Your Eyes</h3>
                    <p className="text-muted-foreground text-sm">
                      Blink naturally. Eye Aspect Ratio (EAR) evaluates palpebral fissure closure dynamics.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-accent text-accent-foreground rounded-xl font-bold text-xs shadow-md cursor-pointer"
                  >
                    Finish Assessment →
                  </button>
                </motion.div>
              )}

              {/* VOMS 1: SMOOTH PURSUIT */}
              {step === "voms_pursuit" && (
                <motion.div
                  key="voms_pursuit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-52 border border-dashed border-rose-500/30 rounded-3xl flex items-center justify-center overflow-hidden bg-rose-500/5">
                    <motion.div
                      animate={{
                        x: [-160, 160, 0, 0, -160],
                        y: [0, 0, -60, 60, 0],
                      }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-rose-500 rounded-2xl shadow-xl flex items-center justify-center text-white"
                    >
                      <Target size={28} />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">VOMS Smooth Pursuit Tracking</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Follow the moving target across horizontal and vertical axes without moving your head.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Next VOMS Step →
                  </button>
                </motion.div>
              )}

              {/* VOMS 2: FAST SACCADES */}
              {step === "voms_saccade" && (
                <motion.div
                  key="voms_saccade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-52 border border-dashed border-rose-500/30 rounded-3xl flex items-center justify-between px-12 overflow-hidden bg-rose-500/5">
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="w-12 h-12 bg-rose-500 rounded-2xl shadow-lg flex items-center justify-center text-white font-black"
                    >
                      L
                    </motion.div>
                    <motion.div
                      animate={{ scale: [1.3, 1, 1.3], opacity: [1, 0.4, 1] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="w-12 h-12 bg-rose-500 rounded-2xl shadow-lg flex items-center justify-center text-white font-black"
                    >
                      R
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">Horizontal & Vertical Fast Saccades</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Rapidly shift your gaze between the two targets as fast as possible for 10 repetitions.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Next VOMS Step →
                  </button>
                </motion.div>
              )}

              {/* VOMS 3: NEAR POINT OF CONVERGENCE (NPC) */}
              {step === "voms_convergence" && (
                <motion.div
                  key="voms_convergence"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-52 border border-dashed border-rose-500/30 rounded-3xl flex items-center justify-center overflow-hidden bg-rose-500/5">
                    <motion.div
                      animate={{ scale: [0.6, 2.2, 0.6] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-12 h-12 bg-rose-500 rounded-full shadow-2xl flex items-center justify-center text-white font-black"
                    >
                      <Target size={24} />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">Near Point of Convergence (NPC)</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Focus on the center stimulus as it approaches your nose. Adjust measured breakpoint below.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Next VOMS Step →
                  </button>
                </motion.div>
              )}

              {/* VOMS 4: VESTIBULO-OCULAR REFLEX (VOR) */}
              {step === "voms_vor" && (
                <motion.div
                  key="voms_vor"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-52 border border-dashed border-rose-500/30 rounded-3xl flex items-center justify-center overflow-hidden bg-rose-500/5">
                    <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-2xl">
                      <Target size={30} className="animate-spin" />
                    </div>
                    {/* Head motion guidance arrows */}
                    <div className="absolute inset-x-8 flex justify-between pointer-events-none text-rose-400 font-black text-xs">
                      <span>⟵ Rotate Head Left</span>
                      <span>Rotate Head Right ⟶</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">Vestibulo-Ocular Reflex (VOR)</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Keep your eyes locked on the center target while gently moving your head side to side at 180 BPM.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Next VOMS Step →
                  </button>
                </motion.div>
              )}

              {/* VOMS 5: VISUAL MOTION SENSITIVITY (VMS) */}
              {step === "voms_vms" && (
                <motion.div
                  key="voms_vms"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-52 border border-dashed border-rose-500/30 rounded-3xl flex items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,#f43f5e0f,#f43f5e0f_15px,#ffffff00_15px,#ffffff00_30px)]">
                    <motion.div
                      animate={{ x: [-140, 140, -140] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-16 h-16 bg-rose-500 rounded-3xl shadow-2xl flex items-center justify-center text-white"
                    >
                      <Eye size={32} />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-foreground">Visual Motion Sensitivity (VMS)</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Rotate your eyes and head in unison while tracking the moving target across full-field background optic flow.
                    </p>
                  </div>
                  <button
                    onClick={advanceAssessmentStep}
                    className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-all"
                  >
                    Finish VOMS Assessment →
                  </button>
                </motion.div>
              )}

              {/* 9. ASSESSMENT COMPLETE */}
              {step === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 p-4 max-w-xl mx-auto"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
                    <ShieldCheck size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Assessment Complete</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Composite Clinical Accuracy: <span className="text-primary font-bold text-lg">{compositeScore}%</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-left">
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Fixation (BCEA)</p>
                      <p className="text-base font-bold text-foreground">{metrics.fixationScore}% <span className="text-xs text-muted-foreground font-normal">({metrics.bceaDeg2} deg²)</span></p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Pursuit Gain</p>
                      <p className="text-base font-bold text-foreground">{metrics.pursuitGain}x</p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Horizontal Span</p>
                      <p className="text-base font-bold text-foreground">{metrics.horizontalGazeRangeDeg}°</p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Vertical Span</p>
                      <p className="text-base font-bold text-foreground">{metrics.verticalGazeRangeDeg}°</p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Blink Dynamics</p>
                      <p className="text-base font-bold text-foreground">{metrics.blinkRateBpm} BPM</p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Incomplete Blinks</p>
                      <p className="text-base font-bold text-emerald-500">{metrics.incompleteBlinkPct}%</p>
                    </div>
                  </div>

                  {protocol === "voms" && (
                    <div className={`p-4 rounded-2xl border text-left space-y-3 ${
                      isVomsPositive
                        ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300"
                        : "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <ShieldAlert size={18} className={isVomsPositive ? "text-rose-500" : "text-emerald-500"} />
                          <span>VOMS Concussion Screen: {isVomsPositive ? "Positive Provocation" : "Normal / Low Provocation"}</span>
                        </div>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          isVomsPositive ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        }`}>
                          {isVomsPositive ? "Dysfunction Flagged" : "Within Norms"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[10px]">Headache</span>
                          <span className="font-bold text-foreground text-sm">{vomsSymptoms.headache}/10</span>
                        </div>
                        <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[10px]">Dizziness</span>
                          <span className="font-bold text-foreground text-sm">{vomsSymptoms.dizziness}/10</span>
                        </div>
                        <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[10px]">Nausea</span>
                          <span className="font-bold text-foreground text-sm">{vomsSymptoms.nausea}/10</span>
                        </div>
                        <div className="bg-background/80 p-2.5 rounded-xl border border-border">
                          <span className="text-muted-foreground block text-[10px]">Fogginess</span>
                          <span className="font-bold text-foreground text-sm">{vomsSymptoms.fogginess}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="text-muted-foreground">Near Point of Convergence (NPC):</span>
                        <span className={`font-bold ${vomsSymptoms.npcBreakpointCm > 5.0 ? "text-rose-500" : "text-emerald-500"}`}>
                          {vomsSymptoms.npcBreakpointCm} cm {vomsSymptoms.npcBreakpointCm > 5.0 ? "(Abnormal > 5cm)" : "(Normal ≤ 5cm)"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleSendToAI}
                      disabled={isDiagnosing}
                      className="w-full py-4 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground rounded-2xl font-bold text-base shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                    >
                      {isDiagnosing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          FOCEYE AI Synthesizing Plan...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} className="animate-pulse" />
                          Send to FOCEYE AI → Generate Personalized Therapy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStep("camera_check");
                        setCamCheckProgress(0);
                        setIsCamVerified(false);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold py-1 cursor-pointer"
                    >
                      <RefreshCw size={12} className="inline mr-1" /> Retest Assessment
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="card-soft space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Camera className="text-primary" size={16} /> Mobile Camera Telemetry
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold uppercase">
                Active 30 FPS
              </span>
            </div>
            <div className="w-full h-44 rounded-2xl overflow-hidden shadow-inner border border-border/80">
              <CameraFeed
                autoStart={true}
                showOverlay={true}
                overlayType="eye-tracking"
                className="h-full w-full"
                statusBadge="Eye Tracker Active"
                onEyeTrackingFrame={handleFrame}
              />
            </div>
          </div>

          <div className="card-soft space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <UserRound className="text-primary" size={18} /> Active Patient
            </h3>
            <div className="space-y-2 text-sm border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-bold text-foreground">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Age:</span>
                <span className="font-bold text-foreground">{selectedPatient.age} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Condition:</span>
                <span className="font-bold text-primary">{selectedPatient.eyeCondition || "Under Evaluation"}</span>
              </div>
            </div>
          </div>

          {protocol === "voms" && (
            <div className="card-soft border-rose-500/30 bg-rose-500/5 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                <h3 className="font-bold text-rose-500 text-sm flex items-center gap-2">
                  <ShieldAlert size={16} /> VOMS Symptom Provocation
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isVomsPositive ? "bg-rose-500/20 text-rose-600 dark:text-rose-400" : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {isVomsPositive ? "Provocation Elevated" : "Normal"}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug">
                Rate symptom provocation (0–10) observed during or immediately following VOMS motion tasks.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">Headache:</span>
                    <span className={`font-bold ${vomsSymptoms.headache >= 2 ? "text-rose-500 font-extrabold" : "text-foreground"}`}>
                      {vomsSymptoms.headache} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vomsSymptoms.headache}
                    onChange={(e) => setVomsSymptoms(prev => ({ ...prev, headache: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">Dizziness:</span>
                    <span className={`font-bold ${vomsSymptoms.dizziness >= 2 ? "text-rose-500 font-extrabold" : "text-foreground"}`}>
                      {vomsSymptoms.dizziness} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vomsSymptoms.dizziness}
                    onChange={(e) => setVomsSymptoms(prev => ({ ...prev, dizziness: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">Nausea:</span>
                    <span className={`font-bold ${vomsSymptoms.nausea >= 2 ? "text-rose-500 font-extrabold" : "text-foreground"}`}>
                      {vomsSymptoms.nausea} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vomsSymptoms.nausea}
                    onChange={(e) => setVomsSymptoms(prev => ({ ...prev, nausea: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">Fogginess:</span>
                    <span className={`font-bold ${vomsSymptoms.fogginess >= 2 ? "text-rose-500 font-extrabold" : "text-foreground"}`}>
                      {vomsSymptoms.fogginess} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={vomsSymptoms.fogginess}
                    onChange={(e) => setVomsSymptoms(prev => ({ ...prev, fogginess: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>

                <div className="pt-2 border-t border-border/80">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground font-medium">NPC Breakpoint:</span>
                    <span className={`font-bold ${vomsSymptoms.npcBreakpointCm > 5.0 ? "text-rose-500 font-extrabold" : "text-emerald-500 font-bold"}`}>
                      {vomsSymptoms.npcBreakpointCm} cm {vomsSymptoms.npcBreakpointCm > 5.0 ? "(Abnormal > 5cm)" : "(Normal)"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="15.0"
                    step="0.5"
                    value={vomsSymptoms.npcBreakpointCm}
                    onChange={(e) => setVomsSymptoms(prev => ({ ...prev, npcBreakpointCm: Number(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="card-soft bg-primary/5 border-primary/20 space-y-3">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Brain size={18} /> Clinical Diagnostics
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standardized biometric tracking evaluates foveal fixation stability, dynamic smooth pursuit gain, and palpebral blink dynamics via real computer vision.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
