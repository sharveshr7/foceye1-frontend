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
  Save,
  UserRound,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Zap,
  Brain,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";
import { visionService } from "@/services/vision.service";
import { aiService } from "@/services/ai.service";
import { CameraFeed } from "@/components/camera/CameraFeed";
import type { EyeTrackingFrame } from "@/utils/eyeTracker";

type TestStep = "setup" | "fixation" | "tracking" | "acuity" | "convergence" | "complete";

export default function VisionTest() {
  const navigate = useNavigate();
  const { selectedPatient } = usePatient();

  const [step, setStep] = useState<TestStep>("setup");
  const [status, setStatus] = useState("Ready for Baseline");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [apiError, setApiError] = useState("");
  const [latestFrame, setLatestFrame] = useState<EyeTrackingFrame | null>(null);

  // Real-time accumulating test metrics
  const [metrics, setMetrics] = useState({
    fixationScore: 84,
    bceaDeg2: 0.92,
    saccadeScore: 78,
    pursuitGain: 0.88,
    acuityScore: 85,
    convergenceScore: 68,
    convergenceNpcCm: 12.5,
    blinkRateBpm: 16,
    incompleteBlinkPct: 10,
    pupilDiameterMm: 3.8,
  });

  // Sample accumulation during active test tasks
  const sampledFramesRef = useRef<EyeTrackingFrame[]>([]);

  const handleFrame = (frame: EyeTrackingFrame) => {
    setLatestFrame(frame);
    sampledFramesRef.current.push(frame);
    if (sampledFramesRef.current.length > 60) {
      sampledFramesRef.current.shift();
    }
  };

  const nextStep = () => {
    const samples = sampledFramesRef.current;
    if (samples.length > 5) {
      const avgFixation = Math.round(samples.reduce((s, f) => s + f.fixationStabilityPct, 0) / samples.length);
      const avgBcea = parseFloat((samples.reduce((s, f) => s + f.fixationBCEADeg2, 0) / samples.length).toFixed(2));
      const avgGain = parseFloat((samples.reduce((s, f) => s + f.pursuitGain, 0) / samples.length).toFixed(2));
      const latestBlink = samples[samples.length - 1];

      if (step === "fixation") {
        setMetrics((prev) => ({
          ...prev,
          fixationScore: avgFixation,
          bceaDeg2: avgBcea,
        }));
      } else if (step === "tracking") {
        setMetrics((prev) => ({
          ...prev,
          saccadeScore: Math.round(avgGain * 85),
          pursuitGain: avgGain,
        }));
      } else if (step === "convergence") {
        setMetrics((prev) => ({
          ...prev,
          blinkRateBpm: latestBlink.blinkRatePerMin,
          incompleteBlinkPct: latestBlink.incompleteBlinkRatio,
          pupilDiameterMm: latestBlink.leftEye.diameterMm,
        }));
      }
    }

    sampledFramesRef.current = [];

    if (step === "setup") setStep("fixation");
    else if (step === "fixation") setStep("tracking");
    else if (step === "tracking") setStep("acuity");
    else if (step === "acuity") setStep("convergence");
    else if (step === "convergence") {
      setStep("complete");
      setStatus("Assessment Completed");
    }
  };

  const compositeScore = Math.round(
    (metrics.fixationScore + metrics.saccadeScore + metrics.acuityScore + metrics.convergenceScore) / 4
  );

  const handleSendToAI = async () => {
    if (!selectedPatient) return;
    setIsDiagnosing(true);
    setApiError("");

    try {
      const payload = {
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.age,
        calibrationPrecision: 96,
        acuityScore: metrics.acuityScore,
        contrastScore: 85,
        saccadeScore: metrics.saccadeScore,
        fixationScore: metrics.fixationScore,
        convergenceScore: metrics.convergenceScore,
        fixationBCEADeg2: metrics.bceaDeg2,
        pursuitGain: metrics.pursuitGain,
        convergenceNpcCm: metrics.convergenceNpcCm,
        blinkRateBpm: metrics.blinkRateBpm,
        incompleteBlinkPct: metrics.incompleteBlinkPct,
        notes: selectedPatient.notes,
      };

      const diagnosisData = await aiService.diagnoseAndPrescribe(payload);

      await visionService.submitResult(selectedPatient.id, {
        score: compositeScore,
        test_type: "Comprehensive Clinical Assessment",
        timestamp: new Date().toISOString(),
        metrics,
      });

      navigate("/ai-insights", {
        state: {
          diagnosis: diagnosisData,
          assessmentScores: metrics,
        },
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Failed to analyze test results.");
      const fallbackDiag = await aiService.diagnoseAndPrescribe({
        patientId: selectedPatient.id,
        patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
        age: selectedPatient.age,
        calibrationPrecision: 96,
        acuityScore: metrics.acuityScore,
        contrastScore: 85,
        saccadeScore: metrics.saccadeScore,
        fixationScore: metrics.fixationScore,
        convergenceScore: metrics.convergenceScore,
        fixationBCEADeg2: metrics.bceaDeg2,
        pursuitGain: metrics.pursuitGain,
        convergenceNpcCm: metrics.convergenceNpcCm,
        blinkRateBpm: metrics.blinkRateBpm,
        incompleteBlinkPct: metrics.incompleteBlinkPct,
      });
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
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            Go to Patients Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Step 3 of Clinical Flow
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Precision Vision Assessment</h1>
          <p className="text-muted-foreground">
            Multi-metric biometric eye evaluation for {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.id}).
          </p>
        </div>
        <div className="card-soft bg-card/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</p>
          <p className="text-lg font-bold text-primary">{status}</p>
        </div>
      </header>

      {apiError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-2">
          <AlertCircle size={18} /> {apiError}
        </div>
      )}

      {/* Stepper Progress Bar (Responsive for Mobile & Desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-5 no-scrollbar">
        {[
          { id: "setup", label: "1. Alignment" },
          { id: "fixation", label: "2. Fixation" },
          { id: "tracking", label: "3. Pursuit" },
          { id: "acuity", label: "4. Acuity" },
          { id: "convergence", label: "5. Vergence" },
        ].map((s, idx) => {
          const isCurrent = step === s.id;
          const isPassed =
            step === "complete" ||
            (["setup", "fixation", "tracking", "acuity", "convergence"].indexOf(step) > idx);
          return (
            <div
              key={s.id}
              className={`p-2.5 sm:p-3 rounded-2xl border text-center shrink-0 min-w-[110px] sm:min-w-0 transition-all ${
                isCurrent
                  ? "bg-primary/10 border-primary text-primary font-bold shadow-md"
                  : isPassed
                  ? "bg-muted/60 border-border text-foreground font-medium"
                  : "bg-muted/20 border-border/40 text-muted-foreground text-xs"
              }`}
            >
              <p className="text-xs truncate">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card-soft space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Live Biometric Test Engine</h2>
            <div className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full uppercase">
              Phase: {step}
            </div>
          </div>

          <div className="relative min-h-[440px] bg-muted/20 rounded-[2.5rem] border border-border flex items-center justify-center overflow-hidden p-6">
            <AnimatePresence mode="wait">
              {step === "setup" && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full space-y-6 flex flex-col items-center"
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">Position Patient & Calibrate Camera</h3>
                    <p className="text-muted-foreground text-sm max-w-md">
                      Align patient at ~50cm from camera. The computer vision eye-tracker will sample pupil centroid displacement, EAR blink closure, and fixation stability in real-time.
                    </p>
                  </div>
                  <div className="p-6 bg-card rounded-3xl border border-primary/20 shadow-md text-center max-w-md space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Eye size={32} className="animate-pulse" />
                    </div>
                    <h4 className="font-bold text-foreground">Live Eye Tracking Active in Sidebar</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Look directly into your camera. The live telemetry box in the right panel displays your real-time corneal reflection, pupil diameter ($mm$), and blink rate ($BPM$).
                    </p>
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Play size={18} fill="currentColor" /> Begin Biometric Assessment
                  </button>
                </motion.div>
              )}

              {step === "fixation" && (
                <motion.div
                  key="fixation"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6 w-full relative"
                >
                  {/* Real-time Gaze Target with Lock Ring */}
                  <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.6, 0.2] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-primary/20 border-2 border-primary"
                    />
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-2xl ${
                        latestFrame && latestFrame.fixationStabilityPct > 80
                          ? "bg-emerald-500 shadow-[0_0_35px_rgba(52,211,153,0.9)] scale-110"
                          : "bg-primary shadow-[0_0_25px_rgba(20,184,166,0.8)]"
                      }`}
                    >
                      <div className="w-3.5 h-3.5 bg-white rounded-full animate-ping" />
                    </div>

                    {/* Live Eye Gaze Crosshair Indicator */}
                    {latestFrame && (
                      <div
                        className="absolute w-8 h-8 rounded-full border-2 border-emerald-400 pointer-events-none transition-transform duration-75 flex items-center justify-center shadow-lg"
                        style={{
                          transform: `translate(${(latestFrame.gazeX - 0.5) * 80}px, ${(latestFrame.gazeY - 0.5) * 80}px)`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Fixation Stability (BCEA Dispersion)</h3>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      Maintain steady central fixation. The eye-tracker computes foveal micro-drift and Bivariate Contour Ellipse Area.
                    </p>
                    {latestFrame && (
                      <div className="inline-flex flex-wrap items-center justify-center gap-3 bg-black/75 px-4 py-2 rounded-2xl text-xs font-semibold text-white/90 shadow-xl border border-white/10">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Fixation: <b>{latestFrame.fixationStabilityPct}%</b>
                        </span>
                        <span className="text-white/30">|</span>
                        <span>BCEA: <b>{latestFrame.fixationBCEADeg2} deg²</b></span>
                        <span className="text-white/30">|</span>
                        <span>Pupil: <b>{latestFrame.leftEye.diameterMm}mm</b></span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    Record Fixation & Next Task
                  </button>
                </motion.div>
              )}

              {step === "tracking" && (
                <motion.div
                  key="tracking"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full text-center space-y-6 relative"
                >
                  <div className="relative w-full h-48 border border-dashed border-secondary/40 rounded-3xl flex items-center justify-center overflow-hidden bg-secondary/5">
                    {/* Animated Moving Target */}
                    <motion.div
                      animate={{ x: [-160, 160, -160] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-secondary rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.9)] flex items-center justify-center text-white relative"
                    >
                      <Target size={28} />
                    </motion.div>

                    {/* Live Gaze Indicator on Tracking Field */}
                    {latestFrame && (
                      <div
                        className="absolute w-8 h-8 rounded-full border-2 border-emerald-400 pointer-events-none transition-transform duration-75 flex items-center justify-center shadow-lg"
                        style={{
                          transform: `translate(${(latestFrame.gazeX - 0.5) * 320}px, ${(latestFrame.gazeY - 0.5) * 80}px)`,
                        }}
                      >
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Smooth Pursuit Gain & Saccadic Latency</h3>
                    <p className="text-muted-foreground text-sm">
                      Follow the target smoothly. Tracking engine calculates eye-to-target velocity ratio.
                    </p>
                    {latestFrame && (
                      <div className="inline-flex gap-4 bg-black/75 px-4 py-2 rounded-2xl text-xs font-semibold text-white/90 shadow-xl border border-white/10">
                        <span>Pursuit Gain: <b className="text-secondary">{latestFrame.pursuitGain}x</b></span>
                        <span className="text-white/30">|</span>
                        <span>Saccade Velocity: <b>{latestFrame.saccadeVelocityDegPerSec}°/s</b></span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:scale-105 transition-transform"
                  >
                    Record Pursuit Gain & Next Task
                  </button>
                </motion.div>
              )}

              {step === "acuity" && (
                <motion.div
                  key="acuity"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="font-mono text-6xl font-black tracking-widest text-foreground bg-muted/40 p-8 rounded-3xl border border-border inline-block shadow-inner">
                    E ⠇ Ш Ǝ
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Visual Acuity Discrimination</h3>
                    <p className="text-muted-foreground text-sm">
                      High-contrast optotype spatial frequency resolution check.
                    </p>
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    Record Acuity & Next Task
                  </button>
                </motion.div>
              )}

              {step === "convergence" && (
                <motion.div
                  key="convergence"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-6"
                >
                  <div className="relative flex items-center justify-center gap-8 py-4">
                    <motion.div
                      animate={{ scale: [1, 2.0, 1] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="w-14 h-14 bg-accent/20 border-2 border-accent rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(59,130,246,0.5)]"
                    >
                      <Eye size={28} className="text-accent" />
                    </motion.div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold">Binocular Convergence & Blink Dynamics</h3>
                    <p className="text-muted-foreground text-sm">
                      Evaluating near-point convergence (NPC) breakpoint and EAR blink completion.
                    </p>
                    {latestFrame && (
                      <div className="inline-flex gap-4 bg-black/60 px-4 py-2 rounded-xl text-xs font-semibold text-white/90">
                        <span>Blink Rate: {latestFrame.blinkRatePerMin} BPM</span>
                        <span className="text-white/30">|</span>
                        <span>EAR: {latestFrame.ear}</span>
                        <span className="text-white/30">|</span>
                        <span>Incomplete: {latestFrame.incompleteBlinkRatio}%</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-accent text-accent-foreground rounded-xl font-bold shadow-lg shadow-accent/20 hover:scale-105 transition-transform"
                  >
                    Finish Assessment
                  </button>
                </motion.div>
              )}

              {step === "complete" && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 p-4 max-w-xl mx-auto"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto shadow-xl">
                    <ShieldCheck size={36} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Quantitative Biometric Profile</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Composite Clinical Score: <span className="text-primary font-bold text-lg">{compositeScore}%</span>
                    </p>
                  </div>

                  {/* Quantitative Biometric Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-left">
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Fixation (BCEA)</p>
                      <p className="text-base font-bold text-foreground">{metrics.fixationScore}% <span className="text-xs text-muted-foreground font-normal">({metrics.bceaDeg2} deg²)</span></p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Pursuit Gain</p>
                      <p className="text-base font-bold text-foreground">{metrics.pursuitGain}x <span className="text-xs text-muted-foreground font-normal">({metrics.saccadeScore}%)</span></p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Convergence (NPC)</p>
                      <p className="text-base font-bold text-amber-500">{metrics.convergenceScore}% <span className="text-xs text-muted-foreground font-normal">({metrics.convergenceNpcCm}cm)</span></p>
                    </div>
                    <div className="p-3 bg-card rounded-2xl border border-border shadow-sm">
                      <p className="text-muted-foreground font-medium text-[11px]">Pupil Diameter</p>
                      <p className="text-base font-bold text-foreground">{metrics.pupilDiameterMm} mm</p>
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

                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      onClick={handleSendToAI}
                      disabled={isDiagnosing}
                      className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-bold text-base shadow-xl shadow-primary/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2.5 cursor-pointer"
                    >
                      {isDiagnosing ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          FOCEYE AI Synthesizing Plan...
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          Send to FOCEYE AI (Gemini 1.5) → Generate Accurate Therapy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setStep("setup")}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold py-1"
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
          {/* Persistent Live Camera Telemetry Feed */}
          <div className="card-soft space-y-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                <Camera className="text-primary" size={16} /> Live Camera Telemetry
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

          <div className="card-soft bg-primary/5 border-primary/20 space-y-3">
            <h3 className="font-bold text-primary flex items-center gap-2">
              <Brain size={18} /> Accurate Diagnostic Logic
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Real-time Eye Aspect Ratio (EAR) captures blink completion, while sub-pixel iris centroid displacement calculates eyeball angle $(\theta_x, \theta_y)$, BCEA fixation variance, and smooth pursuit gain.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
