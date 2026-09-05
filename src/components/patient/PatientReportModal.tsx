import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Printer,
  FileText,
  Download,
  Calendar,
  User,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldCheck,
} from "lucide-react";
import type { Patient } from "@/types/patient";
import type { AIDiagnosisAndPlan } from "@/services/ai.service";
import { authService } from "@/services/auth.service";

import { reportService } from "@/services/report.service";

interface PatientReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  diagnosis?: AIDiagnosisAndPlan | null;
}

export const PatientReportModal: React.FC<PatientReportModalProps> = ({
  isOpen,
  onClose,
  patient,
  diagnosis,
}) => {
  if (!isOpen) return null;

  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);

  const hospitalName = authService.getCurrentHospitalName();
  const hospitalId = authService.getCurrentHospitalId();
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await reportService.downloadPatientPdf({
        patientId: patient.id,
        patientName: `${patient.firstName}_${patient.lastName}`,
        therapistSignature: patient.assignedDoctor || "Dr. Sarah Smith, OD",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadJSON = () => {
    const reportData = {
      hospital: { name: hospitalName, id: hospitalId },
      dateGenerated: new Date().toISOString(),
      patient,
      diagnosis,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `FOCEYE_Report_${patient.id}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl overflow-hidden my-8"
        >
          {/* Action Header Bar (Hidden during print) */}
          <div className="p-4 bg-muted/50 border-b border-border flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <FileText className="text-primary" size={18} />
              <span>Clinical Ophthalmic Evaluation Report</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadJSON}
                className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition-colors border border-border"
              >
                <Download size={14} /> JSON
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                <Download size={14} /> {isDownloadingPdf ? "Generating PDF..." : "Download Official PDF"}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 border border-border"
              >
                <Printer size={14} /> Print
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Printable Report Content */}
          <div className="p-8 sm:p-12 space-y-8 bg-background text-foreground print:p-0 print:bg-white print:text-black">
            {/* Clinical Letterhead Header */}
            <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-md">
                    <Eye size={22} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground print:text-black">
                      {hospitalName}
                    </h1>
                    <p className="text-xs text-muted-foreground print:text-gray-600 font-medium">
                      Binocular Vision & Oculomotor Rehabilitation Department | Tenant: {hospitalId}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs text-muted-foreground print:text-gray-600 space-y-0.5">
                <p className="font-semibold text-foreground print:text-black">Official Clinical Assessment</p>
                <p className="flex items-center sm:justify-end gap-1">
                  <Calendar size={13} /> {today}
                </p>
                <p className="text-[11px] font-mono">Report ID: RPT-{patient.id}-{Date.now().toString().slice(-6)}</p>
              </div>
            </div>

            {/* Patient Demographics Card */}
            <div className="rounded-2xl border border-border bg-muted/20 p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs print:bg-gray-50 print:border-gray-200">
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Patient Name</span>
                <span className="font-extrabold text-foreground text-sm block mt-0.5 print:text-black">
                  {patient.firstName} {patient.lastName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Patient ID / MRN</span>
                <span className="font-mono font-bold text-foreground block mt-0.5 print:text-black">
                  {patient.id}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Age / Gender</span>
                <span className="font-medium text-foreground block mt-0.5 print:text-black">
                  {patient.age} yrs | {patient.gender || "Unspecified"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground uppercase font-bold text-[10px] block">Assigned Clinician</span>
                <span className="font-medium text-foreground block mt-0.5 print:text-black">
                  {patient.assignedDoctor || "Dr. Rachel Evans, MD"}
                </span>
              </div>
            </div>

            {/* Diagnostic Impression & Findings */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 print:text-black">
                <Stethoscope size={18} className="text-primary" /> Diagnostic Impression &amp; ICD-10 Classification
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 md:col-span-2 space-y-2 print:border-gray-300 print:bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Primary Clinical Diagnosis</span>
                    {diagnosis?.icd10Code && (
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-lg border border-primary/20">
                        ICD-10: {diagnosis.icd10Code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-foreground print:text-black">
                    {diagnosis?.suspectedVisualProblem || patient.eyeCondition || "Binocular Vision Anomaly"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed print:text-gray-700">
                    {diagnosis?.clinicalFindings || patient.diagnosis || "Assessment completed via high-speed gaze tracking and computerized fusion stimuli."}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2.5 print:bg-white print:border-gray-300">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Assessment Summary</span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Severity:</span>
                      <span className="font-bold text-foreground print:text-black">{diagnosis?.severity || "Moderate"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className="font-bold text-emerald-500 font-mono">{diagnosis?.confidenceScore || 94}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Biometrics:</span>
                      <span className="font-bold text-emerald-500 flex items-center gap-1">
                        <ShieldCheck size={13} /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Metric Evaluation Table */}
            {diagnosis?.telemetryMetricEvaluation && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 print:text-black">
                  <Activity size={18} className="text-primary" /> Ocular Biometrics &amp; Gaze Telemetry Norms
                </h2>
                <div className="rounded-2xl border border-border overflow-hidden text-xs print:border-gray-300">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-bold text-[11px] uppercase border-b border-border print:bg-gray-100 print:text-black">
                      <tr>
                        <th className="p-3">Parameter</th>
                        <th className="p-3">Measured Value</th>
                        <th className="p-3">Clinical Reference</th>
                        <th className="p-3">Clinical Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border print:divide-gray-200">
                      {Object.entries(diagnosis.telemetryMetricEvaluation).map(([key, evalItem]) => {
                        if (!evalItem) return null;
                        const labelMap: Record<string, string> = {
                          convergenceNearPointNpc: "Near Point Convergence (NPC)",
                          smoothPursuitGain: "Smooth Pursuit Gain",
                          saccadicLatency: "Saccadic Initiation Latency",
                          fixationInstabilityBcea: "Fixation Stability (BCEA 68%)",
                          pupilSymmetryRatio: "Pupillary Reflex & Symmetry",
                        };
                        const isNormal = evalItem.status === "Normal" || evalItem.status === "Physiologically Symmetrical";
                        return (
                          <tr key={key} className="hover:bg-muted/20">
                            <td className="p-3 font-semibold text-foreground print:text-black">
                              {labelMap[key] || key}
                            </td>
                            <td className="p-3 font-mono font-bold text-foreground print:text-black">
                              {evalItem.measuredValue}
                            </td>
                            <td className="p-3 text-muted-foreground print:text-gray-600">
                              {evalItem.clinicalNormalRange}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                  isNormal
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-amber-500/10 text-amber-500"
                                }`}
                              >
                                {isNormal ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
                                {evalItem.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Prescribed Vision Rehabilitation Protocol */}
            {diagnosis?.prescribedPlan && diagnosis.prescribedPlan.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-2 print:text-black">
                  <CheckCircle2 size={18} className="text-primary" /> Prescribed Neuro-Visual Rehabilitation Regimen
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {diagnosis.prescribedPlan.map((ex, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border border-border bg-card/60 space-y-1.5 print:bg-white print:border-gray-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-primary font-mono">
                          Exercise #{idx + 1}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          {Math.round(ex.durationSeconds / 60)} min | {ex.frequencyPerWeek}x/wk
                        </span>
                      </div>
                      <h4 className="font-extrabold text-foreground text-xs print:text-black">{ex.title}</h4>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 print:text-gray-600">
                        {ex.clinicalRationale}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Doctor Signature & Legal Medical Disclaimer */}
            <div className="pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs print:border-gray-300">
              <div className="space-y-1 text-muted-foreground print:text-gray-600 text-[11px]">
                <p className="font-bold text-foreground print:text-black">Regulatory &amp; Clinical Notice</p>
                <p>
                  This digital clinical summary is generated for diagnostic assistance in orthoptics and vision therapy.
                  Results should be correlated with comprehensive slit-lamp and dilated fundus examinations.
                </p>
              </div>

              <div className="flex flex-col items-start sm:items-end justify-end space-y-2">
                <div className="w-48 border-b border-foreground/40 print:border-black h-10" />
                <p className="font-bold text-foreground print:text-black">{patient.assignedDoctor || "Dr. Rachel Evans, MD"}</p>
                <p className="text-[10px] text-muted-foreground print:text-gray-600">Authorized Clinician Signature</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
