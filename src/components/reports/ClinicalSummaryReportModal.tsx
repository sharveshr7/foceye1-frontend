import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  UserRound,
  Stethoscope,
  Activity,
  Download,
  AlertCircle,
} from "lucide-react";
import type { AIDiagnosisAndPlan } from "@/services/ai.service";
import type { Patient } from "@/types/patient";

export interface ClinicalSummaryReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  diagnosis: AIDiagnosisAndPlan | null;
  hospitalName?: string;
  doctorName?: string;
}

export const ClinicalSummaryReportModal: React.FC<ClinicalSummaryReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  diagnosis,
  hospitalName = "Apollo Eye Institute & Vision Hospital",
  doctorName = "Dr. Rachel Evans, MD (Ophthalmology)",
}) => {
  const [clinicianSignature, setClinicianSignature] = useState(doctorName);
  const [clinicianRegistration, setClinicianRegistration] = useState("MCI-OPH-88492");
  const [isSigned, setIsSigned] = useState(true);

  if (!isOpen || !diagnosis) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Action Header (Hidden in Print) */}
          <div className="flex items-center justify-between p-4 px-6 bg-muted/60 border-b border-border print:hidden">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h2 className="text-sm font-bold text-foreground">Official Clinical Diagnostic Report (PDF Preview)</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-primary/20 cursor-pointer transition-all"
              >
                <Printer size={14} /> Print / Save as PDF
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Printable Document Body */}
          <div className="p-8 sm:p-12 overflow-y-auto space-y-8 font-sans print:p-0 print:m-0 print:border-none print:shadow-none bg-white text-slate-900 dark:bg-card dark:text-foreground">
            {/* Hospital Letterhead Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-200 dark:border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white">
                    <Activity size={18} />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-foreground tracking-tight">
                    {hospitalName}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-muted-foreground font-medium">
                  Department of Pediatric Orthoptics & Neuro-Visual Rehabilitation
                </p>
                <p className="text-[11px] text-slate-400 dark:text-muted-foreground/80">
                  Hospital Reg: REG-8849-VISION · Accredited Ophthalmic Clinical Facility
                </p>
              </div>

              <div className="text-left sm:text-right space-y-0.5 text-xs">
                <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary font-bold rounded-md uppercase tracking-wider text-[10px]">
                  Clinical Summary Report
                </span>
                <p className="font-bold text-slate-700 dark:text-foreground mt-1">Date: {currentDate}</p>
                <p className="text-slate-500 dark:text-muted-foreground">Report ID: FOC-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            {/* Patient Demographics & Facility Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-200 dark:border-border text-xs">
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Patient Name</p>
                <p className="font-extrabold text-sm text-slate-900 dark:text-foreground mt-0.5">
                  {patient ? `${patient.firstName} ${patient.lastName}` : "Clinical Patient Record"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Patient ID / Age</p>
                <p className="font-bold text-slate-800 dark:text-foreground mt-0.5">
                  {patient?.id || "Active Record"} · {patient?.age || 11} yrs ({patient?.gender || "Female"})
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Assigned Clinician</p>
                <p className="font-bold text-slate-800 dark:text-foreground mt-0.5">{doctorName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-wider">Evaluation Engine</p>
                <p className="font-bold text-primary mt-0.5">FOCEYE-AI (Gemini 1.5 CDSS)</p>
              </div>
            </div>

            {/* Diagnostic Impression & ICD-10 Code */}
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-primary/5 border border-blue-100 dark:border-primary/20 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold rounded-full uppercase">
                    Severity: {diagnosis.severity}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-600/10 text-blue-600 dark:text-primary border border-blue-600/20 text-xs font-mono font-bold rounded-full">
                    ICD-10: {diagnosis.icd10Code || "H51.11"}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-600/10 text-emerald-600 border border-emerald-600/20 text-xs font-bold rounded-full">
                    AI Confidence: {diagnosis.confidenceScore}%
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-muted-foreground">
                  Follow-Up: {diagnosis.suggestedFollowUpWeeks} Weeks
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight">
                {diagnosis.suspectedVisualProblem}
              </h2>
              <p className="text-xs text-slate-700 dark:text-foreground/90 leading-relaxed">
                {diagnosis.clinicalFindings}
              </p>
            </div>

            {/* 5-Variable Telemetry Baselines Comparison Table */}
            {diagnosis.telemetryMetricEvaluation && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-700 dark:text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-primary" /> Multi-Variable Oculomotor Telemetry Baselines
                </h3>

                <div className="border border-slate-200 dark:border-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-muted/60 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-muted-foreground">
                        <th className="p-2.5 pl-3">Oculomotor Parameter</th>
                        <th className="p-2.5">Measured Value</th>
                        <th className="p-2.5">Normative Baseline</th>
                        <th className="p-2.5">Status & Deviation</th>
                        <th className="p-2.5 pr-3">Clinical Implication</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-border/60">
                      {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc && (
                        <tr>
                          <td className="p-2.5 pl-3 font-bold text-slate-900 dark:text-foreground">Convergence Near Point (NPC)</td>
                          <td className="p-2.5 font-mono font-bold text-red-600">
                            {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.measuredValue}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-muted-foreground">
                            {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.clinicalNormalRange}
                          </td>
                          <td className="p-2.5 text-red-600 font-semibold">
                            {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.status} ({diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.deviationDelta})
                          </td>
                          <td className="p-2.5 pr-3 text-slate-600 dark:text-muted-foreground text-[11px] leading-snug">
                            {diagnosis.telemetryMetricEvaluation.convergenceNearPointNpc.clinicalImplication}
                          </td>
                        </tr>
                      )}

                      {diagnosis.telemetryMetricEvaluation.smoothPursuitGain && (
                        <tr>
                          <td className="p-2.5 pl-3 font-bold text-slate-900 dark:text-foreground">Smooth Pursuit Velocity Gain</td>
                          <td className="p-2.5 font-mono font-bold text-amber-600">
                            {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.measuredValue}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-muted-foreground">
                            {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.clinicalNormalRange}
                          </td>
                          <td className="p-2.5 text-amber-600 font-semibold">
                            {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.status} ({diagnosis.telemetryMetricEvaluation.smoothPursuitGain.deviationDelta})
                          </td>
                          <td className="p-2.5 pr-3 text-slate-600 dark:text-muted-foreground text-[11px] leading-snug">
                            {diagnosis.telemetryMetricEvaluation.smoothPursuitGain.clinicalImplication}
                          </td>
                        </tr>
                      )}

                      {diagnosis.telemetryMetricEvaluation.saccadicLatency && (
                        <tr>
                          <td className="p-2.5 pl-3 font-bold text-slate-900 dark:text-foreground">Saccadic Initiation Latency</td>
                          <td className="p-2.5 font-mono font-bold text-blue-600">
                            {diagnosis.telemetryMetricEvaluation.saccadicLatency.measuredValue}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-muted-foreground">
                            {diagnosis.telemetryMetricEvaluation.saccadicLatency.clinicalNormalRange}
                          </td>
                          <td className="p-2.5 text-blue-600 font-semibold">
                            {diagnosis.telemetryMetricEvaluation.saccadicLatency.status} ({diagnosis.telemetryMetricEvaluation.saccadicLatency.deviationDelta})
                          </td>
                          <td className="p-2.5 pr-3 text-slate-600 dark:text-muted-foreground text-[11px] leading-snug">
                            {diagnosis.telemetryMetricEvaluation.saccadicLatency.clinicalImplication}
                          </td>
                        </tr>
                      )}

                      {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea && (
                        <tr>
                          <td className="p-2.5 pl-3 font-bold text-slate-900 dark:text-foreground">Fixation Dispersion (BCEA)</td>
                          <td className="p-2.5 font-mono font-bold text-slate-700">
                            {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.measuredValue}
                          </td>
                          <td className="p-2.5 text-slate-500 dark:text-muted-foreground">
                            {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.clinicalNormalRange}
                          </td>
                          <td className="p-2.5 text-slate-700 font-semibold">
                            {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.status}
                          </td>
                          <td className="p-2.5 pr-3 text-slate-600 dark:text-muted-foreground text-[11px] leading-snug">
                            {diagnosis.telemetryMetricEvaluation.fixationInstabilityBcea.clinicalImplication}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescribed Vision Therapy Regimen */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 dark:text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={14} className="text-primary" /> Prescribed Vision Therapy Regimen
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {diagnosis.prescribedPlan?.map((plan, idx) => (
                  <div
                    key={plan.gameId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-border bg-slate-50/70 dark:bg-muted/30 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-foreground">{idx + 1}. {plan.title}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        {Math.round(plan.durationSeconds / 60)} min · {plan.frequencyPerWeek}x/wk
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-muted-foreground leading-tight">
                      {plan.clinicalRationale}
                    </p>
                    {plan.executionGuidelines && (
                      <ul className="list-disc pl-3.5 text-[10px] text-slate-500 dark:text-muted-foreground space-y-0.5 pt-1">
                        {plan.executionGuidelines.map((g, gIdx) => (
                          <li key={gIdx}>{g}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Clinician Signature & Certification Block */}
            <div className="pt-4 border-t-2 border-slate-200 dark:border-border flex flex-col sm:flex-row justify-between items-end gap-6 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-700 dark:text-foreground">Clinical Prognosis:</p>
                <p className="text-slate-600 dark:text-muted-foreground max-w-md text-[11px]">
                  {diagnosis.prognosis || "Full binocular resolution expected within 4-6 weeks with supervised therapy adherence."}
                </p>
              </div>

              <div className="text-right space-y-1 sm:min-w-[240px]">
                <div className="font-serif italic text-lg text-slate-900 dark:text-foreground pb-1 border-b border-slate-300 dark:border-border">
                  {clinicianSignature}
                </div>
                <p className="text-[10px] font-bold uppercase text-slate-500 dark:text-muted-foreground">Certified Attending Clinician</p>
                <p className="text-[10px] text-slate-400 dark:text-muted-foreground">Reg No: {clinicianRegistration}</p>
              </div>
            </div>

            {/* Mandatory CDSS Regulatory Disclaimer Footer */}
            <div className="p-3.5 bg-slate-100 dark:bg-muted/50 rounded-xl border border-slate-200 dark:border-border text-[9px] text-slate-500 dark:text-muted-foreground leading-relaxed">
              <strong>MANDATORY CLINICAL DECISION SUPPORT NOTICE:</strong> FOCEYE-AI outputs are generated solely as assistive decision-support tools for certified eye care professionals (optometrists and ophthalmologists). This assessment does not constitute an independent medical diagnosis. Clinical verification, risk-benefit evaluation, and prescription validation by a licensed practitioner are legally required prior to therapy execution.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
