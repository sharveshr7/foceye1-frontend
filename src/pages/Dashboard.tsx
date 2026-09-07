import { motion } from "framer-motion";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatient } from "@/contexts/PatientContext";
import { analyticsService, DashboardSummary } from "@/services/analytics.service";
import { therapyService, TherapySessionData } from "@/services/therapy.service";
import { authService } from "@/services/auth.service";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
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

  const hospitalName = authService.getCurrentHospitalName();
  const hospitalId = authService.getCurrentHospitalId();

  useEffect(() => {
    Promise.all([
      analyticsService.getDashboardSummary(),
      therapyService.getHistory(selectedPatient?.id),
    ])
      .then(([dashboard, sessions]) => {
        setSummary(dashboard);
        setRecentSessions(sessions.slice(0, 4));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load dashboard."))
      .finally(() => setIsLoading(false));
  }, [selectedPatient]);

  return (
    <motion.div {...fadeUp} className="space-y-8 font-outfit max-w-7xl mx-auto pb-12">
      {/* Header with Hospital Letterhead badge */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={13} className="text-primary" /> {hospitalId} · {hospitalName}
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Clinical Operations Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Real-time neuro-visual therapy monitoring, patient telemetry, and computer vision rehabilitation.
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={() => navigate(selectedPatient ? "/vision-test" : "/patients")}
          className="px-5 py-3 bg-primary text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/25 hover:scale-105 transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer"
        >
          <Eye size={18} /> Launch Baseline Vision Test
        </button>
      </header>

      {error && <p role="alert" className="text-sm text-destructive p-3 bg-destructive/10 rounded-xl border border-destructive/20">{error}</p>}

      {/* Selected Patient Banner */}
      <section className="card-interactive border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-card p-6 relative overflow-hidden group shadow-lg shadow-primary/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/15 transition-all duration-500" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-600 text-primary-foreground flex items-center justify-center font-black text-lg shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                {selectedPatient ? selectedPatient.firstName[0] : <UserRound size={26} />}
              </div>
              {selectedPatient && (
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Active Clinical Session
                </span>
                {selectedPatient && (
                  <span
                    className={`text-[10px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1.5 transition-all ${
                      selectedPatient.clinicalStatus === "EYE_TEST_PENDING" || !selectedPatient.clinicalStatus
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : selectedPatient.clinicalStatus === "EYE_TEST_COMPLETED"
                        ? "bg-blue-500/15 text-blue-500 border border-blue-500/30"
                        : selectedPatient.clinicalStatus === "THERAPY_RECOMMENDED"
                        ? "bg-purple-500/15 text-purple-500 border border-purple-500/30"
                        : selectedPatient.clinicalStatus === "THERAPY_IN_PROGRESS"
                        ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/30"
                        : "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse-glow" />
                    {selectedPatient.clinicalStatus === "EYE_TEST_PENDING" || !selectedPatient.clinicalStatus
                      ? "Eye Test Pending"
                      : selectedPatient.clinicalStatus === "EYE_TEST_COMPLETED"
                      ? "Analysis Pending"
                      : selectedPatient.clinicalStatus === "THERAPY_RECOMMENDED"
                      ? "Therapy Recommended"
                      : selectedPatient.clinicalStatus === "THERAPY_IN_PROGRESS"
                      ? "Therapy In Progress"
                      : "Therapy Completed"}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mt-0.5">
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "No Patient Selected"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {selectedPatient
                  ? `${selectedPatient.id} · ${selectedPatient.age} yrs · ${
                      selectedPatient.observedPattern
                        ? `Findings: ${selectedPatient.observedPattern}`
                        : selectedPatient.initialObservation
                        ? `Initial Observation: "${selectedPatient.initialObservation}"`
                        : "Awaiting baseline objective camera eye test"
                    }`
                  : `Currently managing ${patients.length} registered hospital patients. Select or add a patient to begin.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => navigate("/patients")}
              className="px-4 py-2.5 bg-card/80 hover:bg-muted text-foreground rounded-xl text-xs font-bold transition-all cursor-pointer border border-border/80 shadow-xs hover:border-primary/40 active:scale-95"
            >
              {selectedPatient ? "Switch Patient" : "Select Patient"}
            </button>
            {(() => {
              if (!selectedPatient) {
                return (
                  <button
                    onClick={() => navigate("/patients")}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <UserRound size={15} /> Add Patient
                  </button>
                );
              }
              const cs = selectedPatient.clinicalStatus || "EYE_TEST_PENDING";
              if (cs === "EYE_TEST_PENDING" || cs === "REGISTERED") {
                return (
                  <button
                    onClick={() => navigate("/vision-test")}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/25 hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Eye size={15} /> Start Eye Test
                  </button>
                );
              }
              if (cs === "EYE_TEST_COMPLETED") {
                return (
                  <button
                    onClick={() => navigate("/ai-insights")}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles size={15} /> Run AI Analysis
                  </button>
                );
              }
              return (
                <button
                  onClick={() => navigate("/mode-selection")}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-cyan-600 hover:from-primary/90 hover:to-cyan-700 text-primary-foreground rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/25 hover:scale-[1.03] active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Play size={15} fill="currentColor" /> Start Therapy
                </button>
              );
            })()}
          </div>
        </div>
      </section>

      {/* Clinical Workflow Progression Hierarchy (Interactive Connected Timeline) */}
      <section className="card-soft border-slate-200/90 dark:border-white/10 p-5 bg-card/60 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
              Standardized Clinical Protocol Progression
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            Stage-Gated Hierarchy: Add Patient → Eye Test → AI Analysis → Therapy
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

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
              {/* Step 1 */}
              <div
                onClick={() => navigate("/patients")}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative group ${
                  step1Done
                    ? "bg-primary/10 border-primary/40 text-foreground hover:shadow-md hover:border-primary/60"
                    : "bg-background border-dashed border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">1</span>
                    Patient Profile
                  </span>
                  {step1Done ? (
                    <CheckCircle2 size={16} className="text-primary animate-scale-in" />
                  ) : (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Pending</span>
                  )}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "Add New Patient"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Demographics & initial signs only</p>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => selectedPatient && navigate("/vision-test")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !selectedPatient
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step2Active
                    ? "bg-amber-500/10 border-amber-500/50 text-foreground cursor-pointer shadow-md shadow-amber-500/10 ring-2 ring-amber-500/30 hover:scale-[1.02]"
                    : step2Done
                    ? "bg-primary/10 border-primary/40 text-foreground cursor-pointer hover:shadow-md hover:border-primary/60"
                    : "bg-background border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    Eye Test
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
                  {step2Done ? "Assessment Recorded" : "Camera Tracking Test"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">7-step gaze telemetry collection</p>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => step2Done && navigate("/ai-insights")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !step2Done
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step3Active
                    ? "bg-blue-500/10 border-blue-500/50 text-foreground cursor-pointer shadow-md shadow-blue-500/10 ring-2 ring-blue-500/30 hover:scale-[1.02]"
                    : step3Done
                    ? "bg-primary/10 border-primary/40 text-foreground cursor-pointer hover:shadow-md hover:border-primary/60"
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
                      Analyze Telemetry
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {step3Done ? "Findings Identified" : "Gemini AI Diagnosis"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Biomarker & pattern evaluation</p>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => step3Done && navigate("/mode-selection")}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                  !step3Done
                    ? "opacity-50 cursor-not-allowed bg-background border-border text-muted-foreground"
                    : step4Done
                    ? "bg-emerald-500/10 border-emerald-500/40 text-foreground cursor-pointer hover:shadow-md"
                    : step4Active
                    ? "bg-purple-500/10 border-purple-500/50 text-foreground cursor-pointer shadow-md shadow-purple-500/10 ring-2 ring-purple-500/30 hover:scale-[1.02]"
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
                      Ready to Launch
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                  {step4Done ? "Therapy Completed" : "Prescribed Sessions"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Voice guidance in 5 languages</p>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Primary Clinical KPI Metrics (Interactive Glowing Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {isLoading ? (
          <>
            <Skeleton className="h-[170px] rounded-3xl" />
            <Skeleton className="h-[170px] rounded-3xl" />
            <Skeleton className="h-[170px] rounded-3xl" />
            <Skeleton className="h-[170px] rounded-3xl" />
          </>
        ) : (
          <>
            {/* Card 1: Composite Vision Score */}
            <div className="card-gradient-teal relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <p className="text-primary-foreground/90 font-bold text-xs uppercase tracking-wider">
                  Composite Vision Score
                </p>
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-primary-foreground">
                  <TrendingUp size={18} />
                </div>
              </div>
              <h2 className="text-5xl font-black my-2">{summary?.vision_score ?? 89}</h2>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-primary-foreground/20 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                  +{summary?.vision_score_change_pct ?? 9.2}% this week
                </span>
                <span className="text-[11px] text-primary-foreground/80 font-medium">Optimal trajectory</span>
              </div>
            </div>

            {/* Card 2: Daily Therapy Progress */}
            <div className="card-interactive space-y-3 bg-card border-slate-200/90 dark:border-white/10">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Daily Therapy Progress
                </p>
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Clock size={16} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground">
                {summary?.daily_progress_minutes ?? 18} <span className="text-sm text-muted-foreground font-medium">/ {summary?.daily_target_minutes ?? 30} min</span>
              </h2>
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

            {/* Card 3: Fixation BCEA Stability */}
            <div className="card-interactive space-y-2 bg-card border-slate-200/90 dark:border-white/10">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Fixation Stability (BCEA)
                </p>
                <div className="w-8 h-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <Target size={16} />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-foreground">
                0.92 <span className="text-sm text-muted-foreground font-medium">deg²</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Foveal dispersion index <span className="text-emerald-500 font-bold">(Normal &lt; 1.0 deg²)</span>
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                <ShieldCheck size={14} /> High Fixation Precision
              </div>
            </div>

            {/* Card 4: Clinical Milestone */}
            <div className="card-interactive space-y-2 bg-card border-slate-200/90 dark:border-white/10">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Clinical Milestone
                </p>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Award size={16} />
                </div>
              </div>
              <h2 className="text-lg font-bold text-foreground mt-1 truncate">
                {summary?.next_milestone_title ?? "Advanced Fusion Recovery"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {summary ? `${summary.next_milestone_sessions_left} sessions to graduate protocol` : "Protocol on track"}
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                <CheckCircle2 size={14} /> High Adherence (94%)
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick-Launch Clinical Modules */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Zap size={18} className="text-primary" /> Clinical Workflow Fast Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: "1. Camera Calibration",
              desc: "9-point foveal gaze alignment",
              icon: Camera,
              route: "/calibration",
              color: "text-primary bg-primary/10",
            },
            {
              title: "2. Vision Test",
              desc: "Acuity, saccade & vergence test",
              icon: Eye,
              route: "/vision-test",
              color: "text-secondary bg-secondary/10",
            },
            {
              title: "3. AI Diagnostics",
              desc: "Prescription & ICD-10 breakdown",
              icon: Brain,
              route: "/ai-insights",
              color: "text-purple-500 bg-purple-500/10",
            },
            {
              title: "4. Vision Therapy",
              desc: "Interactive rehabilitation games",
              icon: Target,
              route: "/mode-selection",
              color: "text-emerald-500 bg-emerald-500/10",
            },
          ].map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.route)}
              className="card-interactive p-4 flex flex-col justify-between group bg-card"
            >
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-xs`}>
                  <item.icon size={20} />
                </div>
                <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-1 transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-extrabold text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Therapy Exercise Library & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exercise Recommendations */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Gamepad2 size={18} className="text-primary" /> Prescribed Exercises for Current Plan
            </h3>
            <button
              onClick={() => navigate("/therapy-selection")}
              className="text-primary font-bold text-xs hover:underline cursor-pointer flex items-center gap-1"
            >
              Explore All 6 Games <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                id: "target-tracking",
                title: "Smooth Pursuit Target Tracking",
                desc: "Strengthen conjugate tracking & pursuit gain",
                badge: "Pursuits",
                duration: "5 min",
                speed: "1.2x",
              },
              {
                id: "convergence-pushup",
                title: "Near-Point Convergence Push-ups",
                desc: "Medial recti co-contraction & fusional vergence",
                badge: "Vergence",
                duration: "6 min",
                speed: "1.0x",
              },
              {
                id: "reaction-speed",
                title: "Saccadic Stepping & Reaction",
                desc: "Rapid foveal re-orienting & latency training",
                badge: "Saccades",
                duration: "4 min",
                speed: "1.5x",
              },
              {
                id: "focus-hold",
                title: "Bifoveal Fixation Stability",
                desc: "Minimizes micro-saccadic drift and square wave jerks",
                badge: "Fixation",
                duration: "4 min",
                speed: "0.8x",
              },
            ].map((game) => (
              <div
                key={game.id}
                onClick={() =>
                  navigate("/therapy-session", {
                    state: { prescribedExerciseId: game.id, patientId: selectedPatient?.id },
                  })
                }
                className="card-interactive p-4 flex flex-col justify-between group bg-card"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {game.badge}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md">{game.duration}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                    {game.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{game.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground font-mono text-[11px]">Speed: {game.speed}</span>
                  <span className="font-bold text-primary flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    Start Session <Play size={12} fill="currentColor" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Session History Card */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Activity size={18} className="text-primary" /> Recent History
            </h3>
            <button
              onClick={() => navigate("/analytics")}
              className="text-primary font-bold text-xs hover:underline cursor-pointer"
            >
              Analytics →
            </button>
          </div>

          <div className="card-soft p-4 space-y-3">
            {recentSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No sessions recorded yet.</p>
            ) : (
              recentSessions.map((session, i) => (
                <div
                  key={session.id || i}
                  className="p-3 bg-muted/30 rounded-xl border border-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-foreground capitalize">
                      {session.gameId.replace(/-/g, " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(session.timestamp || Date.now()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold font-mono rounded-lg text-xs">
                      {session.performanceScore || session.accuracy || 90}% Acc
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </motion.div>
  );
}
