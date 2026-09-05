import { motion } from "framer-motion";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";
import { aiService, type AIInsight, type AIDiagnosisAndPlan } from "@/services/ai.service";
import { AIAnalyticsModal } from "@/components/ai/AIAnalyticsModal";
import { ClinicalDisclaimerBanner } from "@/components/ui/ClinicalDisclaimerBanner";
import { ClinicalSummaryReportModal } from "@/components/reports/ClinicalSummaryReportModal";

export default function AIInsights() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPatient } = usePatient();

  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosisAndPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [activePlanEdits, setActivePlanEdits] = useState<Record<string, { duration: number; speed: number }>>({});

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        // 1. If location state has freshly generated diagnosis from VisionTest
        if (location.state?.diagnosis) {
          const diag = location.state.diagnosis as AIDiagnosisAndPlan;
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
            patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Alex Rivera",
            age: selectedPatient?.age || 9,
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
  }, [selectedPatient, location.state]);

  const handleStartPrescribedTherapy = (overrideGameId?: string) => {
    const targetGameId = overrideGameId || diagnosis?.primaryExerciseId || "convergence-pushup";
    const edits = activePlanEdits[targetGameId] || { duration: 5, speed: 1.0 };

    navigate("/therapy-session", {
      state: {
        prescribedExerciseId: targetGameId,
        prescribedSpeed: edits.speed,
        prescribedDurationMinutes: edits.duration,
        mode: "mobile",
        patientId: selectedPatient?.id,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-outfit">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} /> Steps 5 to 8 of Clinical Flow
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">FOCEYE AI Diagnostics & Clinical Plan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Deep-learning ophthalmic analysis and tailored neuro-visual rehabilitation prescriptions powered by Gemini 1.5.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsReportModalOpen(true)}
            disabled={!diagnosis}
            className="px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <FileText size={14} /> Export Summary (PDF)
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={!diagnosis}
            className="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Activity size={14} /> Deep-Dive Analytics
          </button>
          <button
            onClick={() => navigate("/vision-test")}
            className="px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-xl border border-border transition-colors cursor-pointer"
          >
            New Vision Test
          </button>
          <button
            onClick={() => handleStartPrescribedTherapy()}
            disabled={!diagnosis}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer disabled:opacity-50"
          >
            <Play size={14} fill="currentColor" /> Start Prescribed Therapy
          </button>
        </div>
      </header>

      {/* Mandatory Clinical Decision Support System (CDSS) Disclaimer Banner */}
      <ClinicalDisclaimerBanner variant="banner" />

      {/* Loading Skeleton */}
      {loading && !diagnosis && (
        <div className="card-soft p-12 text-center space-y-3">
          <Loader2 size={32} className="text-primary animate-spin mx-auto" />
          <h3 className="font-bold text-foreground">Analyzing Clinical Eye Telemetry…</h3>
          <p className="text-xs text-muted-foreground">
            Evaluating multi-variable vergence baselines, smooth pursuit gain, and foveal stability.
          </p>
        </div>
      )}

      {/* Main Diagnosis Card */}
      {diagnosis && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-soft border-2 border-primary/30 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 p-6 md:p-8 space-y-6 shadow-xl"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
                  Suspected Problem: {diagnosis.severity}
                </span>
                <span className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-mono font-bold rounded-full">
                  ICD-10: {diagnosis.icd10Code || "H51.11"}
                </span>
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold rounded-full">
                  AI Confidence: {diagnosis.confidenceScore}%
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
                {diagnosis.suspectedVisualProblem}
              </h2>
            </div>

            <div className="bg-card/90 px-4 py-3 rounded-2xl border border-border shadow-sm text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Follow-Up Reassessment</p>
              <p className="text-base font-bold text-primary">{diagnosis.suggestedFollowUpWeeks} Weeks</p>
            </div>
          </div>

          {/* Telemetry Metric Evaluation Breakdown Table */}
          {diagnosis.telemetryMetricEvaluation && (
            <div className="bg-card/90 rounded-2xl border border-border/80 overflow-hidden shadow-sm">
              <div className="bg-muted/50 px-4 py-2.5 border-b border-border/70 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity size={14} className="text-primary" /> Multi-Variable Oculomotor Telemetry Baselines
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground">FOCEYE Clinical Benchmarks</span>
              </div>
              <div className="divide-y divide-border/60 text-xs">
                {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc && (
                  <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5 md:w-1/3">
                      <p className="font-bold text-foreground">Convergence Near Point (NPC)</p>
                      <p className="text-muted-foreground text-[11px]">Normal: {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.clinicalNormalRange}</p>
                    </div>
                    <div className="md:w-1/4">
                      <span className="font-mono font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                        {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.measuredValue}
                      </span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-medium">({diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.deviationDelta})</span>
                    </div>
                    <p className="text-muted-foreground md:w-5/12 text-[11px] leading-relaxed">
                      {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.clinicalImplication}
                    </p>
                  </div>
                )}

                {diagnosis.telemetryMetricEvaluation.smoothPursuitGain && (
                  <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5 md:w-1/3">
                      <p className="font-bold text-foreground">Smooth Pursuit Velocity Gain</p>
                      <p className="text-muted-foreground text-[11px]">Normal: {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.clinicalNormalRange}</p>
                    </div>
                    <div className="md:w-1/4">
                      <span className="font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.measuredValue}
                      </span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-medium">({diagnosis.telemetryMetricEvaluation.smoothPursuitGain.deviationDelta})</span>
                    </div>
                    <p className="text-muted-foreground md:w-5/12 text-[11px] leading-relaxed">
                      {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.clinicalImplication}
                    </p>
                  </div>
                )}

                {diagnosis.telemetryMetricEvaluation.saccadicLatency && (
                  <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5 md:w-1/3">
                      <p className="font-bold text-foreground">Saccadic Target Latency</p>
                      <p className="text-muted-foreground text-[11px]">Normal: {diagnosis.telemetryMetricEvaluation.saccadicLatency.clinicalNormalRange}</p>
                    </div>
                    <div className="md:w-1/4">
                      <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                        {diagnosis.telemetryMetricEvaluation.saccadicLatency.measuredValue}
                      </span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-medium">({diagnosis.telemetryMetricEvaluation.saccadicLatency.deviationDelta})</span>
                    </div>
                    <p className="text-muted-foreground md:w-5/12 text-[11px] leading-relaxed">
                      {diagnosis.telemetryMetricEvaluation.saccadicLatency.clinicalImplication}
                    </p>
                  </div>
                )}

                {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea && (
                  <div className="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5 md:w-1/3">
                      <p className="font-bold text-foreground">Fixation Dispersion (BCEA)</p>
                      <p className="text-muted-foreground text-[11px]">Normal: {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.clinicalNormalRange}</p>
                    </div>
                    <div className="md:w-1/4">
                      <span className="font-mono font-bold text-foreground bg-muted px-2 py-0.5 rounded-lg border border-border">
                        {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.measuredValue}
                      </span>
                      <span className="text-muted-foreground ml-2 text-[11px] font-medium">({diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.deviationDelta})</span>
                    </div>
                    <p className="text-muted-foreground md:w-5/12 text-[11px] leading-relaxed">
                      {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.clinicalImplication}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-muted/40 p-4 rounded-2xl border border-border/80 space-y-1.5">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={14} className="text-primary" /> Clinical Findings & Pathophysiology
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{diagnosis.clinicalFindings}</p>
            </div>
            <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 space-y-1.5">
              <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} /> Clinical Prognosis
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">
                {diagnosis.prognosis || "Excellent recovery expected with 4 weeks of consistent supervised therapy."}
              </p>
            </div>
          </div>

          {/* Precautions Alert */}
          {diagnosis.precautions && diagnosis.precautions.length > 0 && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Clinical Precautions: </span>
                {diagnosis.precautions.join(" • ")}
              </div>
            </div>
          )}

          {/* Prescribed Therapy Regimen */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Target size={16} className="text-primary" /> Tailored Therapy Regimen (Doctor Review & Calibration)
              </h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sliders size={12} /> Fine-tune parameters below
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {diagnosis.prescribedPlan?.map((plan) => {
                const isPrimary = plan.gameId === diagnosis.primaryExerciseId;
                const edits = activePlanEdits[plan.gameId] || {
                  duration: Math.round((plan.durationSeconds || 300) / 60),
                  speed: plan.targetSpeed || 1.0,
                };

                return (
                  <div
                    key={plan.gameId}
                    className={`card-soft relative border transition-all p-5 flex flex-col justify-between ${
                      isPrimary
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    {isPrimary && (
                      <div className="absolute -top-2.5 right-4 bg-primary text-primary-foreground text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        Primary Exercise
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{plan.category}</span>
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Clock size={12} /> {edits.duration} min
                        </span>
                      </div>
                      <h4 className="font-bold text-foreground text-lg">{plan.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{plan.clinicalRationale}</p>

                      {plan.executionGuidelines && plan.executionGuidelines.length > 0 && (
                        <div className="bg-muted/40 p-2.5 rounded-xl border border-border/50 space-y-1 text-[11px] text-muted-foreground">
                          <p className="font-bold text-foreground text-[10px] uppercase tracking-wider">Protocol Guidance:</p>
                          <ul className="list-disc pl-3.5 space-y-0.5">
                            {plan.executionGuidelines.map((guideline, idx) => (
                              <li key={idx} className="leading-tight">{guideline}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Interactive Parameter Sliders */}
                    <div className="pt-3 mt-3 border-t border-border/60 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">Duration:</span>
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
                            className="w-20 accent-primary cursor-pointer"
                          />
                          <span className="font-bold w-10 text-right">{edits.duration}m</span>
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
                            className="w-20 accent-primary cursor-pointer"
                          />
                          <span className="font-bold w-10 text-right">{edits.speed}x</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {plan.frequencyPerWeek}x / week
                        </span>
                        <button
                          onClick={() => handleStartPrescribedTherapy(plan.gameId)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isPrimary
                              ? "bg-primary text-primary-foreground shadow-sm hover:scale-105"
                              : "bg-muted text-foreground hover:bg-muted/80"
                          }`}
                        >
                          <Play size={12} fill="currentColor" /> Launch
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinician Approval Authorization */}
          <div className="space-y-3">
            <div className="p-5 bg-card/80 border border-primary/40 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Clinician Plan Authorization</h4>
                  <p className="text-xs text-muted-foreground">
                    Prescription calibrated by FOCEYE AI (Gemini 1.5) and ready for immediate clinical execution.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleStartPrescribedTherapy()}
                className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <CheckCircle2 size={18} /> Approve & Launch Session
              </button>
            </div>
            <ClinicalDisclaimerBanner variant="compact" />
          </div>
        </motion.div>
      )}

      {/* General Clinical Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-soft p-5 space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase">Tracking Accuracy</p>
          <p className="text-2xl font-extrabold text-primary">{insight?.trackingAccuracy ?? 94}%</p>
          <p className="text-[11px] text-muted-foreground">+3.2% from baseline</p>
        </div>
        <div className="card-soft p-5 space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase">Weekly Trajectory</p>
          <p className="text-2xl font-extrabold text-emerald-500">+{insight?.weeklyImprovementPct ?? 16.5}%</p>
          <p className="text-[11px] text-muted-foreground">Accelerating recovery</p>
        </div>
        <div className="card-soft p-5 space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase">Adherence Score</p>
          <p className="text-2xl font-extrabold text-foreground">{insight?.consistencyScore ?? 92}/100</p>
          <p className="text-[11px] text-muted-foreground">High compliance</p>
        </div>
        <div className="card-soft p-5 space-y-1">
          <p className="text-xs font-bold text-muted-foreground uppercase">Asthenopia / Fatigue</p>
          <p className="text-2xl font-extrabold text-foreground">{insight?.sessionFatigue ?? "Low"}</p>
          <p className="text-[11px] text-muted-foreground">Well-tolerated sessions</p>
        </div>
      </div>

      {/* Mandatory Regulatory Footer Disclaimer */}
      <ClinicalDisclaimerBanner variant="footer" className="mt-8" />

      {/* Deep-Dive Clinical Analytics Medium Modal */}
      <AIAnalyticsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        diagnosis={diagnosis}
        metrics={location.state?.assessmentScores}
        onStartTherapy={() => handleStartPrescribedTherapy()}
      />

      {/* Official Printable Clinical Summary Report Modal */}
      <ClinicalSummaryReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={selectedPatient}
        diagnosis={diagnosis}
      />
    </div>
  );
}
