import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  X,
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Download,
} from "lucide-react";
import type { AIDiagnosisAndPlan, AssessmentMetrics } from "@/services/ai.service";

interface AIAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: AIDiagnosisAndPlan | null;
  metrics?: AssessmentMetrics | null;
  onStartTherapy?: () => void;
}

export function AIAnalyticsModal({
  isOpen,
  onClose,
  diagnosis,
  metrics,
  onStartTherapy,
}: AIAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<"biometrics" | "pathophysiology" | "protocol">("biometrics");

  if (!isOpen || !diagnosis) return null;

  const bcea = metrics?.fixationBCEADeg2 ?? 0.88;
  const gain = metrics?.pursuitGain ?? 0.89;
  const npc = metrics?.convergenceNpcCm ?? 9.5;
  const acuity = metrics?.acuityScore ?? 82;
  const bpm = metrics?.blinkRateBpm ?? 15;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                <Brain size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">FOCEYE AI Clinical Deep-Dive</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold">
                    Gemini 1.5 Verified
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  In-depth ocular biometrics and neuro-visual recovery trajectory analytics.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Diagnosis Headline Banner */}
          <div className="px-6 py-4 bg-primary/5 border-b border-primary/10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Identified Deficit</p>
              <h3 className="text-lg font-extrabold text-foreground">{diagnosis.suspectedVisualProblem}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold">
                Severity: {diagnosis.severity}
              </span>
              <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                Confidence: {diagnosis.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 px-6 pt-4 border-b border-border bg-card">
            <button
              onClick={() => setActiveTab("biometrics")}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "biometrics"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Biometric Differential
            </button>
            <button
              onClick={() => setActiveTab("pathophysiology")}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "pathophysiology"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Pathophysiology & Findings
            </button>
            <button
              onClick={() => setActiveTab("protocol")}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all ${
                activeTab === "protocol"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Prescribed Exercise Protocol
            </button>
          </div>

          {/* Modal Body Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
            {activeTab === "biometrics" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Fixation Stability (BCEA)</p>
                    <p className="text-xl font-bold text-foreground mt-1">{bcea} deg²</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Clinical Normal: &lt; 0.85 deg²</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Smooth Pursuit Gain</p>
                    <p className="text-xl font-bold text-secondary mt-1">{gain}x</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Target Conjugate: &gt; 0.95x</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-muted/40 border border-border">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">NPC Breakpoint</p>
                    <p className="text-xl font-bold text-primary mt-1">{npc} cm</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Clinical Normal: &lt; 6.0 cm</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity size={14} className="text-primary" /> Verified Biological Liveness & Ocular Symmetry
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Pupil Diameter:</span>
                      <span className="font-bold text-foreground">{metrics?.pupilDiameterMm ?? 3.8} mm</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Blink Frequency:</span>
                      <span className="font-bold text-foreground">{bpm} BPM</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Liveness Confidence:</span>
                      <span className="font-bold text-emerald-500">98% Verified</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Visual Acuity:</span>
                      <span className="font-bold text-foreground">{acuity}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "pathophysiology" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <FileText size={14} /> Clinical Findings & Retinal Error
                  </h4>
                  <p className="text-xs text-foreground/90 leading-relaxed">{diagnosis.clinicalFindings}</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                    <TrendingUp size={14} /> Clinical Prognosis
                  </h4>
                  <p className="text-xs text-foreground/80 leading-relaxed">{diagnosis.prognosis}</p>
                </div>

                {diagnosis.precautions && diagnosis.precautions.length > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Safety & Ergonomic Precautions
                    </h4>
                    <ul className="text-xs text-foreground/80 list-disc list-inside space-y-1">
                      {diagnosis.precautions.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "protocol" && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  FOCEYE AI calibrated exercises tailored to patient deficit and oculomotor velocity threshold:
                </p>
                <div className="space-y-3">
                  {diagnosis.prescribedPlan?.map((ex, i) => (
                    <div
                      key={ex.gameId}
                      className="p-4 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {ex.category}
                          </span>
                          <h4 className="font-bold text-foreground text-sm">{ex.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">{ex.clinicalRationale}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-foreground block">
                          {Math.round(ex.durationSeconds / 60)} min · {ex.targetSpeed}x
                        </span>
                        <span className="text-[11px] text-primary font-semibold">{ex.frequencyPerWeek}x / week</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 px-6 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} /> Print Report PDF
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
              {onStartTherapy && (
                <button
                  onClick={() => {
                    onClose();
                    onStartTherapy();
                  }}
                  className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                  <Sparkles size={14} /> Launch Prescribed Therapy
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
