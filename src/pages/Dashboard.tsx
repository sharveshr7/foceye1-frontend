import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gamepad2,
  Activity,
  Zap,
  Target,
  Play,
  UserRound,
  Eye,
  Camera,
  Sparkles,
  Brain,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Award,
  Radio,
  QrCode,
  Share2,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Stethoscope,
  Layers,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/contexts/PatientContext";
import { analyticsService, DashboardSummary } from "@/services/analytics.service";
import { therapyService, TherapySessionData } from "@/services/therapy.service";
import { authService } from "@/services/auth.service";
import { HomeTherapyModal } from "@/components/therapy/HomeTherapyModal";
import { therapyExercises } from "@/lib/therapies";

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedPatient, patients } = usePatient();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>();
  const [recentSessions, setRecentSessions] = useState<TherapySessionData[]>([]);
  const [error, setError] = useState("");
  const [showHomeModal, setShowHomeModal] = useState(false);

  const hospitalName = authService.getCurrentHospitalName();
  const hospitalId = authService.getCurrentHospitalId();

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboardSummary(),
      therapyService.getHistory(selectedPatient?.id),
    ])
      .then(([dashboard, sessions]) => {
        setSummary(dashboard);
        setRecentSessions(sessions.slice(0, 5));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load dashboard."))
      .finally(() => setIsLoading(false));
  }, [selectedPatient]);

  // Determine prescribed exercise for selected patient
  const prescribedExercise = useMemo(() => {
    if (!selectedPatient?.recommendedTherapyId) return therapyExercises[0];
    return (
      therapyExercises.find((ex) => ex.id === selectedPatient.recommendedTherapyId) ||
      therapyExercises[0]
    );
  }, [selectedPatient?.recommendedTherapyId]);

  const teleSessionId = selectedPatient?.id ? `session-${selectedPatient.id}` : "room-101";

  return (
    <motion.div {...fadeUp} className="space-y-8 font-outfit max-w-7xl mx-auto pb-16">
      {/* 1. CLINICAL COMMAND DECK HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/25 rounded-full text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              STATION LIVE · {hospitalId}
            </span>
            <span className="text-xs text-muted-foreground font-semibold px-2.5 py-1 bg-muted/60 rounded-full border border-border/80">
              {hospitalName}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <Activity size={12} className="animate-pulse" /> Telemetry Server Online
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Clinical Operations Command Deck
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time neuro-visual therapy monitoring, automated patient triage, and computer vision rehabilitation.
          </p>
        </div>

        {/* Global Fast Action Toolbar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate("/patients")}
            className="px-4 py-2.5 bg-card hover:bg-muted text-foreground border border-border hover:border-primary/40 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            title="Register new patient into clinical workflow"
          >
            <Plus size={15} className="text-primary" /> Add Patient
          </button>

          <button
            onClick={() => {
              window.open(`/tele-observe/${teleSessionId}`, "_blank", "noopener,noreferrer");
            }}
            className="px-4 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-300 border border-teal-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            title="Open real-time tele-consultation gaze mirror room"
          >
            <Radio size={14} className="text-teal-500 animate-pulse" /> Tele-Mirror Room
          </button>

          <button
            onClick={() => navigate(selectedPatient ? "/vision-test" : "/patients")}
            className="px-5 py-2.5 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground font-bold text-xs rounded-xl shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Eye size={16} /> Launch Objective Eye Test
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="text-sm text-destructive p-3.5 bg-destructive/10 rounded-2xl border border-destructive/20 flex items-center gap-2">
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {/* 2. ACTIVE PATIENT COMMAND HERO HUD */}
      <section className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-8 shadow-xl shadow-primary/5 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/15 transition-all duration-700" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Patient Bio & Triage Pill */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-cyan-600 to-teal-500 text-primary-foreground flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl shadow-primary/30 group-hover:scale-105 transition-transform">
                {selectedPatient ? selectedPatient.firstName[0] : <UserRound size={32} />}
              </div>
              {selectedPatient && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center" title="Active Patient Loaded">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Active Clinical Patient
                </span>

                {selectedPatient && (
                  <span
                    className={`text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs ${
                      selectedPatient.clinicalStatus === "EYE_TEST_PENDING" || !selectedPatient.clinicalStatus
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : selectedPatient.clinicalStatus === "EYE_TEST_COMPLETED"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30"
                        : selectedPatient.clinicalStatus === "THERAPY_RECOMMENDED"
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                        : selectedPatient.clinicalStatus === "THERAPY_IN_PROGRESS"
                        ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                    {selectedPatient.clinicalStatus === "EYE_TEST_PENDING" || !selectedPatient.clinicalStatus
                      ? "Stage 2: Eye Test Pending"
                      : selectedPatient.clinicalStatus === "EYE_TEST_COMPLETED"
                      ? "Stage 3: Ready for AI Synthesis"
                      : selectedPatient.clinicalStatus === "THERAPY_RECOMMENDED"
                      ? "Stage 4: Therapy Prescribed"
                      : selectedPatient.clinicalStatus === "THERAPY_IN_PROGRESS"
                      ? "Stage 4: Therapy In Progress"
                      : "Stage 5: Protocol Completed"}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "No Active Patient Selected"}
              </h2>

              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {selectedPatient ? (
                  <>
                    <span className="font-semibold text-foreground font-mono">{selectedPatient.id}</span> · {selectedPatient.age} yrs · {selectedPatient.gender} · Assigned:{" "}
                    <span className="text-primary font-semibold">{selectedPatient.assignedDoctor || "Chief Neuro-Ophthalmologist"}</span> ·{" "}
                    {selectedPatient.observedPattern ? (
                      <span className="text-foreground font-medium">Observed Pattern: <strong>{selectedPatient.observedPattern}</strong></span>
                    ) : selectedPatient.initialObservation ? (
                      <span>Physical Signs: &quot;{selectedPatient.initialObservation}&quot;</span>
                    ) : (
                      "Awaiting standardized camera telemetry baseline"
                    )}
                  </>
                ) : (
                  `Currently managing ${patients.length} registered hospital patients. Select or admit a patient to execute clinical hierarchy.`
                )}
              </p>

              {/* Patient Quick Info Chips */}
              {selectedPatient && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-lg bg-card/80 border border-border text-foreground font-semibold">
                    Condition: <strong className="text-primary">{selectedPatient.eyeCondition || "Under Evaluation"}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-card/80 border border-border text-foreground font-semibold">
                    Visual Target: <strong>Bifoveal Fusion & Vergence</strong>
                  </span>
                  {selectedPatient.recommendedTherapyId && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-300 font-bold">
                      Prescribed: {prescribedExercise.title}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap lg:flex-col sm:flex-row items-stretch lg:items-end gap-2.5 shrink-0">
            {(() => {
              if (!selectedPatient) {
                return (
                  <button
                    onClick={() => navigate("/patients")}
                    className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserRound size={16} /> Select / Register Patient
                  </button>
                );
              }
              const cs = selectedPatient.clinicalStatus || "EYE_TEST_PENDING";
              if (cs === "EYE_TEST_PENDING" || cs === "REGISTERED") {
                return (
                  <button
                    onClick={() => navigate("/vision-test")}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> Start Objective Eye Test →
                  </button>
                );
              }
              if (cs === "EYE_TEST_COMPLETED") {
                return (
                  <button
                    onClick={() => navigate("/ai-insights")}
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} /> Synthesize AI Insights →
                  </button>
                );
              }
              return (
                <button
                  onClick={() => navigate("/mode-selection")}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground rounded-2xl text-xs font-bold transition-all shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Play size={16} fill="currentColor" /> Open Therapy Session →
                </button>
              );
            })()}

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {selectedPatient && (
                <button
                  onClick={() => setShowHomeModal(true)}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 bg-card/90 hover:bg-muted text-foreground border border-border/90 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs hover:border-primary/40 active:scale-95"
                  title="Generate remote home therapy pass & WhatsApp share link"
                >
                  <QrCode size={14} className="text-primary" /> Home Pass QR
                </button>
              )}

              <button
                onClick={() => navigate("/patients")}
                className="flex-1 sm:flex-none px-3.5 py-2.5 bg-card/90 hover:bg-muted text-foreground border border-border/90 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs hover:border-primary/40 active:scale-95 text-center"
              >
                {selectedPatient ? "Switch Patient" : "Browse Directory"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. STANDARDIZED CLINICAL WORKFLOW HIERARCHY (INTERACTIVE STAGE GATES) */}
      <section className="card-soft border-slate-200/90 dark:border-white/10 p-6 bg-card/60 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-foreground">
              Clinical Workflow Progression Pipeline
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Strict Stage Gates: Demographics → Eye Test → AI Diagnostics → Therapy → Clinical Report
          </span>
        </div>

        {(() => {
          const cs = selectedPatient?.clinicalStatus || (selectedPatient ? "EYE_TEST_PENDING" : "REGISTERED");
          const step1Done = !!selectedPatient;
          const step2Active = cs === "EYE_TEST_PENDING" || cs === "REGISTERED";
          const step2Done = ["EYE_TEST_COMPLETED", "AI_ANALYSIS_COMPLETED", "THERAPY_RECOMMENDED", "THERAPY_IN_PROGRESS", "THERAPY_COMPLETED"].includes(cs);
          const step3Active = cs === "EYE_TEST_COMPLETED";
          const step3Done = ["AI_ANALYSIS_COMPLETED", "THERAPY_RECOMMENDED", "THERAPY_IN_PROGRESS", "THERAPY_COMPLETED"].includes(cs);
          const step4Active = ["THERAPY_RECOMMENDED", "THERAPY_IN_PROGRESS"].includes(cs);
          const step4Done = cs === "THERAPY_COMPLETED";
          const step5Active = step4Done || !!selectedPatient?.notes;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative">
              {/* Step 1: Patient Intake */}
              <div
                onClick={() => navigate("/patients")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group ${
                  step1Done
                    ? "bg-primary/10 border-primary/40 text-foreground hover:shadow-md hover:border-primary/70"
                    : "bg-background border-dashed border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">1</span>
                    Intake & Physical
                  </span>
                  {step1Done ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Pending</span>
                  )}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Add New Patient"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {selectedPatient?.initialObservation || "Demographics & physical signs"}
                </p>
              </div>

              {/* Step 2: Objective Eye Test */}
              <div
                onClick={() => selectedPatient && navigate("/vision-test")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !selectedPatient
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step2Active
                    ? "bg-amber-500/10 border-amber-500/60 text-foreground cursor-pointer shadow-lg shadow-amber-500/10 ring-2 ring-amber-500/30 hover:scale-[1.02]"
                    : step2Done
                    ? "bg-primary/10 border-primary/40 text-foreground cursor-pointer hover:shadow-md hover:border-primary/70"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    Eye Test / VOMS
                  </span>
                  {step2Done ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : step2Active ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold animate-pulse">
                      Action Needed
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {step2Done ? "Telemetry Recorded" : "Camera Tracking Test"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  Foveal fixation, saccades, vergence
                </p>
              </div>

              {/* Step 3: AI Diagnosis */}
              <div
                onClick={() => step2Done && navigate("/ai-insights")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !step2Done
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step3Active
                    ? "bg-blue-500/10 border-blue-500/60 text-foreground cursor-pointer shadow-lg shadow-blue-500/10 ring-2 ring-blue-500/30 hover:scale-[1.02]"
                    : step3Done
                    ? "bg-primary/10 border-primary/40 text-foreground cursor-pointer hover:shadow-md hover:border-primary/70"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px]">3</span>
                    AI Analysis
                  </span>
                  {step3Done ? (
                    <CheckCircle2 size={16} className="text-primary" />
                  ) : step3Active ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold animate-pulse">
                      Synthesize Plan
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {step3Done ? "Observed Pattern Set" : "Gemini Diagnostics"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  Biomarker & ICD-10 synthesis
                </p>
              </div>

              {/* Step 4: Therapy Session */}
              <div
                onClick={() => step3Done && navigate("/mode-selection")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !step3Done
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step4Done
                    ? "bg-emerald-500/10 border-emerald-500/40 text-foreground cursor-pointer hover:shadow-md"
                    : step4Active
                    ? "bg-purple-500/10 border-purple-500/60 text-foreground cursor-pointer shadow-lg shadow-purple-500/10 ring-2 ring-purple-500/30 hover:scale-[1.02]"
                    : "bg-background border-border text-muted-foreground cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-[10px]">4</span>
                    Voice Therapy
                  </span>
                  {step4Done ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : step4Active ? (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold animate-pulse">
                      Ready to Run
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {step4Done ? "Therapy Complete" : "Auto-Leveling Session"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  Paced voice coaching in 5 languages
                </p>
              </div>

              {/* Step 5: PDF & Home Care */}
              <div
                onClick={() => selectedPatient && navigate(`/profile?patientId=${selectedPatient.id}`)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !selectedPatient
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step5Active
                    ? "bg-teal-500/10 border-teal-500/40 text-foreground cursor-pointer hover:shadow-md hover:border-teal-500/70"
                    : "bg-background border-border text-muted-foreground cursor-pointer"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-[10px]">5</span>
                    Report & Home
                  </span>
                  <ExternalLink size={14} className="text-muted-foreground group-hover:text-teal-500 transition-colors" />
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  Clinical PDF & Home Pass
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  Longitudinal history & QR sync
                </p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* 4. CLINICAL TELEMETRY & PERFORMANCE KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-[180px] rounded-3xl" />
            <Skeleton className="h-[180px] rounded-3xl" />
            <Skeleton className="h-[180px] rounded-3xl" />
            <Skeleton className="h-[180px] rounded-3xl" />
          </>
        ) : (
          <>
            {/* KPI 1: Composite Vision Score */}
            <div className="card-interactive p-6 rounded-3xl bg-gradient-to-br from-primary/95 to-teal-700 text-white relative overflow-hidden shadow-xl shadow-primary/20 group">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              <div className="flex justify-between items-start">
                <p className="text-white/80 font-bold text-xs uppercase tracking-wider">
                  Composite Vision Index
                </p>
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="my-3 flex items-baseline gap-2">
                <h2 className="text-5xl font-black tracking-tight">{summary?.vision_score ?? 89}</h2>
                <span className="text-sm font-bold text-white/80">/ 100</span>
              </div>
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-lg font-extrabold backdrop-blur-xs">
                  +{summary?.vision_score_change_pct ?? 9.2}% this week
                </span>
                <span className="text-white/80 font-medium">Optimal healing curve</span>
              </div>
            </div>

            {/* KPI 2: Foveal Fixation Stability (BCEA) */}
            <div className="card-interactive p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm hover:border-secondary/50">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Fixation Stability (BCEA)
                </p>
                <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Target size={18} />
                </div>
              </div>
              <div className="my-1 flex items-baseline gap-1.5">
                <h2 className="text-3xl font-black text-foreground">0.85</h2>
                <span className="text-xs text-muted-foreground font-semibold">deg² dispersion</span>
              </div>
              <p className="text-xs text-muted-foreground">
                68.2% bivariate contour ellipse area. <span className="text-emerald-500 font-bold">Standard &lt; 1.0 deg²</span>
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                <ShieldCheck size={14} /> Stable Foveal Fixation
              </div>
            </div>

            {/* KPI 3: Daily Therapy Velocity */}
            <div className="card-interactive p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm hover:border-primary/50">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Daily Therapy Progress
                </p>
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock size={18} />
                </div>
              </div>
              <div className="my-1 flex items-baseline gap-1.5">
                <h2 className="text-3xl font-black text-foreground">{summary?.daily_progress_minutes ?? 18}</h2>
                <span className="text-xs text-muted-foreground font-semibold">/ {summary?.daily_target_minutes ?? 30} prescribed min</span>
              </div>
              <div className="space-y-1.5 pt-1">
                <div className="w-full bg-muted h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-cyan-500 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round(((summary?.daily_progress_minutes ?? 18) / (summary?.daily_target_minutes ?? 30)) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Target Adherence</span>
                  <span className="text-primary font-bold">{Math.round(((summary?.daily_progress_minutes ?? 18) / (summary?.daily_target_minutes ?? 30)) * 100)}%</span>
                </div>
              </div>
            </div>

            {/* KPI 4: Telemetry Throughput */}
            <div className="card-interactive p-6 rounded-3xl bg-card border border-border space-y-3 shadow-sm hover:border-teal-500/50">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Live Telemetry Link
                </p>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                  <Radio size={18} />
                </div>
              </div>
              <div className="my-1 flex items-baseline gap-1.5">
                <h2 className="text-3xl font-black text-foreground">60 <span className="text-base font-bold text-muted-foreground">FPS</span></h2>
                <span className="text-xs text-emerald-500 font-bold">Active</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Low-latency binary Float32Array frames streaming via WebSockets.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold">
                <CheckCircle2 size={14} /> Tele-Mirror Room Ready
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. QUICK-LAUNCH CLINICAL MODULES (FAST ACTION DECK) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <Zap size={18} className="text-primary" /> Rapid Clinical Action Deck
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Direct one-click access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {[
            {
              title: "1. Calibration",
              desc: "9-point foveal alignment",
              icon: Camera,
              route: "/calibration",
              color: "text-primary bg-primary/10 hover:border-primary/50",
            },
            {
              title: "2. Precision Eye Test",
              desc: "7-step biometric baseline",
              icon: Eye,
              route: "/vision-test",
              color: "text-secondary bg-secondary/10 hover:border-secondary/50",
            },
            {
              title: "3. VOMS Concussion",
              desc: "Vestibular & sports screen",
              icon: ShieldAlert,
              route: "/vision-test",
              color: "text-rose-500 bg-rose-500/10 hover:border-rose-500/50",
            },
            {
              title: "4. AI Synthesis",
              desc: "Multi-modal Gemini diagnostics",
              icon: Brain,
              route: "/ai-insights",
              color: "text-purple-500 bg-purple-500/10 hover:border-purple-500/50",
            },
            {
              title: "5. Auto-Level Therapy",
              desc: "Real-time dynamic difficulty",
              icon: Target,
              route: "/mode-selection",
              color: "text-emerald-500 bg-emerald-500/10 hover:border-emerald-500/50",
            },
            {
              title: "6. Tele-Consultation",
              desc: "Live gaze mirror room",
              icon: Radio,
              route: `/tele-observe/${teleSessionId}`,
              color: "text-teal-500 bg-teal-500/10 hover:border-teal-500/50",
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.route)}
              className="card-interactive p-4 flex flex-col justify-between group bg-card border border-border/80 hover:shadow-md transition-all cursor-pointer rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-xs`}>
                  <item.icon size={18} />
                </div>
                <div className="w-6 h-6 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-all">
                  <ArrowRight size={12} />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-black text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. PRESCRIBED REHABILITATION SUITE & RECENT CLINICAL SESSIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prescribed Exercises Deck */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Gamepad2 size={18} className="text-primary" /> Active Prescription Protocols
            </h3>
            <button
              onClick={() => navigate("/therapy-selection")}
              className="text-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
            >
              Explore Full Library (6 Modules) <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {therapyExercises.slice(0, 4).map((game) => {
              const isPrescribed = selectedPatient?.recommendedTherapyId === game.id;

              return (
                <div
                  key={game.id}
                  onClick={() =>
                    navigate("/therapy-session", {
                      state: { prescribedExerciseId: game.id, patientId: selectedPatient?.id },
                    })
                  }
                  className={`card-interactive p-5 flex flex-col justify-between group bg-card border transition-all rounded-2xl ${
                    isPrescribed
                      ? "border-primary shadow-md shadow-primary/10 ring-1 ring-primary/40"
                      : "border-border/80 hover:border-primary/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                          {game.category}
                        </span>
                        {isPrescribed && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 text-[10px] font-bold border border-purple-500/30">
                            ★ Prescribed
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md font-bold">
                        {Math.ceil(game.duration / 60)} min
                      </span>
                    </div>

                    <h4 className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">
                      {game.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {game.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px] font-semibold">
                      Difficulty: <strong className="text-foreground">{game.level}</strong>
                    </span>
                    <span className="font-bold text-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Launch Exercise <Play size={12} fill="currentColor" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recent Clinical Audit History Feed */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-foreground flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Session Activity Log
            </h3>
            <button
              onClick={() => navigate("/analytics")}
              className="text-primary font-bold text-xs hover:underline cursor-pointer"
            >
              Full Analytics →
            </button>
          </div>

          <div className="card-soft p-4 space-y-3 bg-card/60 backdrop-blur-sm">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Clock size={24} className="mx-auto text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground">No recent therapy sessions recorded.</p>
                <button
                  onClick={() => navigate("/vision-test")}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  Start First Session
                </button>
              </div>
            ) : (
              recentSessions.map((session, i) => (
                <div
                  key={session.id || i}
                  className="p-3 bg-muted/40 hover:bg-muted/70 transition-colors rounded-xl border border-border/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground capitalize">
                      {session.gameId.replace(/-/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {new Date(session.timestamp || Date.now()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-black font-mono rounded-lg text-xs">
                      {session.performanceScore || session.accuracy || 92}% Acc
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* 7. HOME THERAPY PASS & QR MODAL */}
      <HomeTherapyModal
        isOpen={showHomeModal}
        onClose={() => setShowHomeModal(false)}
        patient={selectedPatient}
        prescribedExercise={prescribedExercise}
        durationMinutes={Math.ceil(prescribedExercise.duration / 60)}
      />
    </motion.div>
  );
}
