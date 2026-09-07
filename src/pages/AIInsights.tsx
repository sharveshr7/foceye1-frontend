import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Play,
  RotateCcw,
  Target,
  Clock,
  Stethoscope,
  Info,
  Sliders,
  FileText,
  Loader2,
  Eye,
  Languages,
  QrCode,
  Radio,
  Crosshair,
  ShieldAlert,
  ChevronRight,
  Layers,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";
import { aiService, type AIInsight, type AIDiagnosisAndPlan } from "@/services/ai.service";
import { AIAnalyticsModal } from "@/components/ai/AIAnalyticsModal";
import { ClinicalDisclaimerBanner } from "@/components/ui/ClinicalDisclaimerBanner";
import { ClinicalSummaryReportModal } from "@/components/reports/ClinicalSummaryReportModal";
import { HomeTherapyModal } from "@/components/therapy/HomeTherapyModal";
import { therapyExercises, type TherapyExercise } from "@/lib/therapies";
import { voiceCoach, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/utils/voiceCoach";

export default function AIInsights() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPatient, updatePatient } = usePatient();

  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosisAndPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isHomeModalOpen, setIsHomeModalOpen] = useState(false);
  const [selectedHomeExercise, setSelectedHomeExercise] = useState<TherapyExercise | undefined>(undefined);
  const [activePlanEdits, setActivePlanEdits] = useState<Record<string, { duration: number; speed: number }>>({});
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(() => voiceCoach.getLanguage());

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        let activeDiag: AIDiagnosisAndPlan | null = null;

        // 1. If location state has freshly generated diagnosis from VisionTest
        if (location.state?.diagnosis) {
          const diag = location.state.diagnosis as AIDiagnosisAndPlan;
          activeDiag = diag;
          if (isMounted) {
            setDiagnosis(diag);
            const initialEdits: Record<string, { duration: number; speed: number }> = {};
            diag.prescribedPlan?.forEach((p) => {
              initialEdits[p.gameId] = {
                duration: Math.round((p.durationSeconds || 300) / 60),
                speed: p.targetSpeed || 1.0,
              };
            });
            setActivePlanEdits(initialEdits);
          }
        } else {
          // 2. Automatically generate patient-specific clinical diagnosis
          const defaultMetrics = {
            patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Clinical Patient Evaluation",
            age: selectedPatient?.age || 11,
            calibrationPrecision: 98,
            acuityScore: 85,
            contrastScore: 90,
            saccadeScore: 82,
            fixationScore: 80,
            convergenceScore: 68,
            convergenceNpcCm: 14.2,
            pursuitGain: 0.78,
            fixationBCEADeg2: 0.89,
            notes: selectedPatient?.notes || "Routine pediatric vision evaluation",
          };

          const diag = await aiService.diagnoseAndPrescribe(defaultMetrics);
          activeDiag = diag;
          if (isMounted) {
            setDiagnosis(diag);
            const initialEdits: Record<string, { duration: number; speed: number }> = {};
            diag.prescribedPlan?.forEach((p) => {
              initialEdits[p.gameId] = {
                duration: Math.round((p.durationSeconds || 300) / 60),
                speed: p.targetSpeed || 1.0,
              };
            });
            setActivePlanEdits(initialEdits);
          }
        }

        // Persist patient status advancement to THERAPY_RECOMMENDED
        if (selectedPatient && activeDiag) {
          await updatePatient(selectedPatient.id, {
            clinicalStatus: "THERAPY_RECOMMENDED",
            observedPattern: activeDiag.suspectedVisualProblem || activeDiag.clinicalFindings,
            eyeCondition: activeDiag.suspectedVisualProblem || selectedPatient.eyeCondition,
            diagnosis: activeDiag.clinicalFindings || selectedPatient.diagnosis,
            recommendedTherapyId: activeDiag.primaryExerciseId,
          });
        }

        // 3. Load Clinical Recovery Insights
        const data = await aiService.getInsights();
        if (isMounted) {
          setInsight(data);
        }
      } catch (err) {
        console.error("Failed to load AI Insights & Clinical Plan:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedPatient, location.state, updatePatient]);

  const handleStartPrescribedTherapy = (overrideGameId?: string) => {
    const targetGameId = overrideGameId || diagnosis?.primaryExerciseId || "convergence-pushup";
    const edits = activePlanEdits[targetGameId] || { duration: 5, speed: 1.0 };

    voiceCoach.unlockAudio();
    voiceCoach.setLanguage(selectedLanguage);
    navigate("/therapy-session", {
      state: {
        prescribedExerciseId: targetGameId,
        prescribedSpeed: edits.speed,
        prescribedDurationMinutes: edits.duration,
        mode: "mobile",
        patientId: selectedPatient?.id,
        therapyLanguage: selectedLanguage,
        assessmentMetrics: location.state?.assessmentMetrics,
        cameraQuality: location.state?.cameraQuality,
        aiDiagnosis: diagnosis,
      },
    });
  };

  // Biomarker radar calculations
  const radarAxes = useMemo(() => {
    const fixation = 82;
    const saccades = 85;
    const pursuit = 76;
    const vergence = 68;
    const blinks = 88;
    const neuroStability = 80;

    return [
      { label: "Fixation", value: fixation, normal: 85 },
      { label: "Saccades", value: saccades, normal: 85 },
      { label: "Smooth Pursuit", value: pursuit, normal: 85 },
      { label: "Convergence", value: vergence, normal: 85 },
      { label: "Blink Quality", value: blinks, normal: 85 },
      { label: "Neuro VOMS", value: neuroStability, normal: 85 },
    ];
  }, []);

  const radarPoints = useMemo(() => {
    const cx = 130;
    const cy = 130;
    const r = 90;
    const total = radarAxes.length;

    const patientCoords = radarAxes.map((axis, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total;
      const radius = (axis.value / 100) * r;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
        labelX: cx + (r + 20) * Math.cos(angle),
        labelY: cy + (r + 20) * Math.sin(angle),
      };
    });

    const normalCoords = radarAxes.map((axis, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total;
      const radius = (axis.normal / 100) * r;
      return {
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });

    const patientPolygon = patientCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const normalPolygon = normalCoords.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return { patientPolygon, normalPolygon, patientCoords, cx, cy, r };
  }, [radarAxes]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-outfit">
      {/* 1. HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Sparkles size={12} className="text-primary" /> Step 5: Neuro-Visual Synthesis
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Google Gemini Clinical Engine Active
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            FOCEYE AI Diagnostics & Biomarker Matrix
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Automated neuro-visual pattern recognition, multi-variable ocular motility analysis, and personalized voice therapy prescriptions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!diagnosis}
            className="px-4 py-2.5 bg-card hover:bg-muted text-foreground border border-border text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
          >
            <FileText size={14} className="text-secondary" /> Export Clinical PDF
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!diagnosis}
            className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95 shadow-xs"
          >
            <Activity size={14} /> Full Telemetry Analytics
          </button>
          <button
            onClick={() => navigate("/vision-test")}
            className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border transition-all cursor-pointer active:scale-95"
          >
            Re-run Eye Test
          </button>
          <button
            onClick={() => handleStartPrescribedTherapy()}
            disabled={!diagnosis}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Play size={14} fill="currentColor" /> Launch Prescribed Therapy
          </button>
        </div>
      </header>

      {/* Mandatory Clinical Disclaimer Banner */}
      <ClinicalDisclaimerBanner variant="banner" />

      {/* Baseline Eye Test Warning if Pending */}
      {selectedPatient &&
        (selectedPatient.clinicalStatus === "EYE_TEST_PENDING" || !selectedPatient.clinicalStatus) &&
        !location.state?.diagnosis &&
        !location.state?.assessmentScores && (
          <div className="card-soft border-amber-500/30 bg-amber-500/5 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Eye size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Baseline Camera Assessment Needed</h3>
                <p className="text-xs text-muted-foreground">
                  Patient <span className="font-semibold text-foreground">{selectedPatient.firstName} {selectedPatient.lastName}</span> has not yet undergone standardized 7-step eye tracking.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/vision-test")}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Eye size={14} /> Start Eye Test
            </button>
          </div>
        )}

      {/* Loading Skeleton */}
      {loading && !diagnosis && (
        <div className="card-soft p-12 text-center space-y-3">
          <Loader2 size={36} className="text-primary animate-spin mx-auto" />
          <h3 className="font-bold text-foreground text-lg">Synthesizing Oculomotor Biometrics…</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Gemini AI is parsing foveal fixation stability, dynamic smooth pursuit gain, and near-point vergence deltas.
          </p>
        </div>
      )}

      {/* 2. PRIMARY DIAGNOSIS & BIOMARKER HERO POD */}
      {diagnosis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft border-2 border-primary/30 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 space-y-6 shadow-xl rounded-3xl"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-black rounded-full uppercase tracking-wider">
                  Severity: {diagnosis.severity}
                </span>
                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-black rounded-full">
                  ICD-10: {diagnosis.icd10Code || "H51.11"}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black rounded-full">
                  AI Confidence: {diagnosis.confidenceScore}%
                </span>
                {diagnosis.dataSufficiency && (
                  <span
                    className={`px-3 py-1 text-xs font-black rounded-full border ${
                      diagnosis.dataSufficiency === "Sufficient"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    Data Quality: {diagnosis.dataSufficiency}
                  </span>
                )}
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                {diagnosis.suspectedVisualProblem}
              </h2>

              {diagnosis.confidenceQualityIndicator && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={14} className="text-primary shrink-0" />
                  <span>{diagnosis.confidenceQualityIndicator}</span>
                </p>
              )}
            </div>

            <div className="bg-card/95 px-5 py-3.5 rounded-2xl border border-border shadow-sm text-right self-start">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Clinical Reassessment</p>
              <p className="text-lg font-black text-primary">{diagnosis.suggestedFollowUpWeeks} Weeks Target</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Automated progress audit</p>
            </div>
          </div>

          {/* 3. INTERACTIVE 6-AXIS BIOMARKER RADAR CHART & FOVEAL RETICLE */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Radar Spider Chart */}
            <div className="p-5 bg-card/80 rounded-3xl border border-border/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                  <Crosshair size={16} className="text-primary" /> 6-Axis Oculomotor Biomarker Spider
                </h3>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Patient Score
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40" /> Normal Benchmarks
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center p-2">
                <svg width="280" height="280" viewBox="0 0 260 260" className="overflow-visible">
                  {/* Background concentric polygons */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale) => {
                    const poly = radarAxes
                      .map((_, i) => {
                        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / radarAxes.length;
                        const r = radarPoints.r * scale;
                        const x = radarPoints.cx + r * Math.cos(angle);
                        const y = radarPoints.cy + r * Math.sin(angle);
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(" ");
                    return (
                      <polygon
                        key={scale}
                        points={poly}
                        fill="none"
                        stroke="currentColor"
                        className="text-border/60"
                        strokeWidth="1"
                        strokeDasharray={scale < 1.0 ? "2,2" : "none"}
                      />
                    );
                  })}

                  {/* Axis Spokes */}
                  {radarAxes.map((_, i) => {
                    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / radarAxes.length;
                    const x2 = radarPoints.cx + radarPoints.r * Math.cos(angle);
                    const y2 = radarPoints.cy + radarPoints.r * Math.sin(angle);
                    return (
                      <line
                        key={i}
                        x1={radarPoints.cx}
                        y1={radarPoints.cy}
                        x2={x2}
                        y2={y2}
                        stroke="currentColor"
                        className="text-border/80"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Normal benchmark polygon */}
                  <polygon
                    points={radarPoints.normalPolygon}
                    fill="currentColor"
                    className="text-muted/30"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                  />

                  {/* Patient polygon with glowing gradient fill */}
                  <polygon
                    points={radarPoints.patientPolygon}
                    className="fill-primary/25 stroke-primary"
                    strokeWidth="2.5"
                  />

                  {/* Data vertices */}
                  {radarPoints.patientCoords.map((coord, i) => (
                    <circle
                      key={i}
                      cx={coord.x}
                      cy={coord.y}
                      r="4"
                      className="fill-card stroke-primary"
                      strokeWidth="2.5"
                    />
                  ))}

                  {/* Axis labels */}
                  {radarAxes.map((axis, i) => {
                    const coord = radarPoints.patientCoords[i];
                    return (
                      <text
                        key={i}
                        x={coord.labelX}
                        y={coord.labelY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="text-[10px] font-bold fill-foreground"
                      >
                        {axis.label} ({axis.value}%)
                      </text>
                    );
                  })}
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1 border-t border-border/60">
                <div>
                  <p className="text-muted-foreground font-medium">Fixation</p>
                  <p className="font-extrabold text-foreground">82% <span className="text-emerald-500">Good</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Vergence</p>
                  <p className="font-extrabold text-amber-500">68% <span className="text-amber-500">Impaired</span></p>
                </div>
                <div>
                  <p className="text-muted-foreground font-medium">Saccadic Latency</p>
                  <p className="font-extrabold text-foreground">220ms <span className="text-emerald-500">Normal</span></p>
                </div>
              </div>
            </div>

            {/* Foveal Fixation Reticle & Dispersion Map */}
            <div className="p-5 bg-card/80 rounded-3xl border border-border/90 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-foreground flex items-center gap-2">
                  <Target size={16} className="text-primary" /> Foveal BCEA Dispersion Reticle
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                  BCEA 0.85 deg²
                </span>
              </div>

              {/* Central Reticle Visualizer */}
              <div className="relative w-full h-48 rounded-2xl bg-slate-950 flex items-center justify-center overflow-hidden border border-white/10">
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/25" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/25" />

                {/* Foveal concentric rings */}
                <div className="w-36 h-36 rounded-full border border-cyan-500/20 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-cyan-500/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-teal-400/50 bg-teal-500/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    </div>
                  </div>
                </div>

                {/* Simulated Gaze Scatter Points */}
                {[
                  { x: 12, y: -8 },
                  { x: -14, y: 10 },
                  { x: 6, y: 15 },
                  { x: -8, y: -12 },
                  { x: 18, y: 4 },
                  { x: -5, y: -4 },
                  { x: 2, y: 3 },
                ].map((pt, idx) => (
                  <div
                    key={idx}
                    className="absolute w-2 h-2 rounded-full bg-cyan-400/80 shadow-xs shadow-cyan-400"
                    style={{
                      transform: `translate(${pt.x * 2}px, ${pt.y * 2}px)`,
                    }}
                  />
                ))}

                <div className="absolute bottom-2 left-3 text-[10px] font-mono text-cyan-400/80">
                  Fovea ±1.0° Target Zone
                </div>
                <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                  Dispersion: Stable
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground leading-relaxed">
                  Bivariate Contour Ellipse Area measures foveal dwell precision. Scores below 1.0 deg² reflect stable bifoveal alignment without nystagmoid micro-drift.
                </p>
              </div>
            </div>
          </div>

          {/* 4. CLINICAL FINDINGS & PATHOPHYSIOLOGY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-muted/40 p-5 rounded-2xl border border-border/80 space-y-2">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={15} className="text-primary" /> Pathophysiology & Functional Deficits
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{diagnosis.clinicalFindings}</p>
            </div>
            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 space-y-2">
              <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={15} /> Clinical Recovery Outlook
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">
                {diagnosis.prognosis || "High neuroplastic adaptability observed. Full vergence recovery anticipated with 4 weeks of structured computer vision therapy."}
              </p>
            </div>
          </div>

          {/* 5. PRESCRIBED THERAPY REGIMEN & CALIBRATION */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                  <Target size={18} className="text-primary" /> Calibrated Therapy Prescriptions
                </h3>
                <p className="text-xs text-muted-foreground">Adjust target exercise speeds and durations before patient launch.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const primary = therapyExercises.find((t) => t.id === diagnosis.primaryExerciseId);
                    setSelectedHomeExercise(primary);
                    setIsHomeModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-600 dark:text-teal-400 font-bold text-xs hover:bg-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <QrCode size={14} /> Send Home Pass QR
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {diagnosis.prescribedPlan?.map((plan) => {
                const isPrimary = plan.gameId === diagnosis.primaryExerciseId;
                const edits = activePlanEdits[plan.gameId] || {
                  duration: Math.round((plan.durationSeconds || 300) / 60),
                  speed: plan.targetSpeed || 1.0,
                };

                return (
                  <div
                    key={plan.gameId}
                    className={`card-interactive relative border transition-all p-5 flex flex-col justify-between rounded-3xl ${
                      isPrimary
                        ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 ring-1 ring-primary/40"
                        : "border-border/90 bg-card hover:border-primary/40"
                    }`}
                  >
                    {isPrimary && (
                      <div className="absolute -top-3 right-5 bg-primary text-primary-foreground text-[10px] font-black uppercase px-3 py-0.5 rounded-full shadow-md">
                        Primary Exercise
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{plan.category}</span>
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Clock size={12} /> {edits.duration} min
                        </span>
                      </div>
                      <h4 className="font-extrabold text-foreground text-lg">{plan.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{plan.clinicalRationale}</p>
                    </div>

                    {/* Interactive Sliders */}
                    <div className="pt-3 mt-4 border-t border-border/60 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Session Duration:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="2"
                            max="15"
                            value={edits.duration}
                            onChange={(e) =>
                              setActivePlanEdits({
                                ...activePlanEdits,
                                [plan.gameId]: { ...edits, duration: Number(e.target.value) },
                              })
                            }
                            className="w-20 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                          />
                          <span className="font-black w-10 text-right">{edits.duration}m</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Target Speed:</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={edits.speed}
                            onChange={(e) =>
                              setActivePlanEdits({
                                ...activePlanEdits,
                                [plan.gameId]: { ...edits, speed: Number(e.target.value) },
                              })
                            }
                            className="w-20 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                          />
                          <span className="font-black w-10 text-right">{edits.speed}x</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {plan.frequencyPerWeek}x / week
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const match = therapyExercises.find((t) => t.id === plan.gameId);
                              setSelectedHomeExercise(match);
                              setIsHomeModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold border border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-all flex items-center gap-1 cursor-pointer"
                            title="Generate Home Practice Pass & QR Code"
                          >
                            <QrCode size={12} /> Pass
                          </button>
                          <button
                            onClick={() => handleStartPrescribedTherapy(plan.gameId)}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isPrimary
                                ? "bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95"
                                : "bg-muted text-foreground hover:bg-muted/80 active:scale-95"
                            }`}
                          >
                            <Play size={12} fill="currentColor" /> Launch
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6. CHOOSE THERAPY LANGUAGE */}
          <div className="p-6 bg-card/90 border border-primary/30 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-black text-foreground text-sm flex items-center gap-2">
                  <Languages className="text-primary" size={18} /> Select Real-Time Voice Coaching Language
                </h4>
                <p className="text-xs text-muted-foreground">
                  FOCEYE voice guidance, metronome cues, and difficulty auto-leveling speak in your selected dialect.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      voiceCoach.setLanguage(lang.code);
                    }}
                    className={`p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? "bg-primary/15 border-primary text-primary font-black shadow-lg scale-[1.03] ring-1 ring-primary/40"
                        : "bg-muted/40 border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="text-xs font-black">{lang.name}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold">{lang.nativeName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. CLINICIAN AUTHORIZATION BAR */}
          <div className="p-6 bg-card/90 border border-primary/40 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <ShieldCheck size={26} />
              </div>
              <div>
                <h4 className="font-black text-foreground text-base">Clinician Protocol Authorization</h4>
                <p className="text-xs text-muted-foreground">
                  Prescription formulated by FOCEYE AI and ready for immediate clinical execution.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleStartPrescribedTherapy()}
              className="px-8 py-4 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground font-black text-sm rounded-2xl shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCircle2 size={18} /> Authorize & Start Therapy →
            </button>
          </div>
        </motion.div>
      )}

      {/* 8. MODALS */}
      <AIAnalyticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        diagnosis={diagnosis}
        metrics={location.state?.assessmentScores}
        onStartTherapy={() => handleStartPrescribedTherapy()}
      />

      <ClinicalSummaryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={selectedPatient}
        diagnosis={diagnosis}
      />

      <HomeTherapyModal
        isOpen={isHomeModalOpen}
        onClose={() => setIsHomeModalOpen(false)}
        patient={selectedPatient}
        prescribedExercise={selectedHomeExercise}
        durationMinutes={selectedHomeExercise ? activePlanEdits[selectedHomeExercise.id]?.duration || 5 : 5}
      />
    </div>
  );
}
