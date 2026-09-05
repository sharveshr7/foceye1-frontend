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
      <section className="card-soft border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-base shadow-md shadow-primary/20">
              {selectedPatient ? selectedPatient.firstName[0] : <UserRound size={22} />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Active Patient Session
              </span>
              <h2 className="text-xl font-bold text-foreground">
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "No Patient Selected"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedPatient
                  ? `${selectedPatient.id} · ${selectedPatient.age} yrs · Condition: ${selectedPatient.eyeCondition}`
                  : `Currently managing ${patients.length} registered hospital patients`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/patients")}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer border border-border"
            >
              Switch Patient
            </button>
            <button
              onClick={() => navigate("/mode-selection")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold transition-all hover:bg-primary/90 shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Play size={14} /> Start Therapy
            </button>
          </div>
        </div>
      </section>

      {/* Primary Clinical KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[160px] rounded-3xl" />
            <Skeleton className="h-[160px] rounded-3xl" />
            <Skeleton className="h-[160px] rounded-3xl" />
          </>
        ) : (
          <>
            <div className="card-gradient-teal relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <p className="text-primary-foreground/90 font-bold text-xs uppercase tracking-wider">
                  Composite Vision Score
                </p>
                <TrendingUp size={20} className="text-primary-foreground/70" />
              </div>
              <h2 className="text-5xl font-black my-2">{summary?.vision_score ?? 89}</h2>
              <div className="flex items-center gap-2 mt-3">
                <span className="bg-primary-foreground/20 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                  +{summary?.vision_score_change_pct ?? 9.2}% this week
                </span>
                <span className="text-[11px] text-primary-foreground/80">Optimal trajectory</span>
              </div>
            </div>

            <div className="card-soft space-y-3">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Daily Therapy Progress
                </p>
                <Clock size={20} className="text-primary" />
              </div>
              <h2 className="text-4xl font-extrabold text-foreground">
                {summary?.daily_progress_minutes ?? 18} <span className="text-base text-muted-foreground font-medium">/ {summary?.daily_target_minutes ?? 30} min</span>
              </h2>
              <div className="space-y-1">
                <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.round(((summary?.daily_progress_minutes ?? 18) / (summary?.daily_target_minutes ?? 30)) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground font-medium text-right">
                  {Math.round(((summary?.daily_progress_minutes ?? 18) / (summary?.daily_target_minutes ?? 30)) * 100)}% of daily target completed
                </p>
              </div>
            </div>

            <div className="card-soft space-y-2">
              <div className="flex justify-between items-start">
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-wider">
                  Clinical Milestone
                </p>
                <Award size={20} className="text-secondary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mt-1">
                {summary?.next_milestone_title ?? "Advanced Fusion Calibration"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {summary ? `${summary.next_milestone_sessions_left} more sessions required to graduate protocol` : "On track"}
              </p>
              <div className="pt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
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
              className="card-soft p-4 flex flex-col justify-between hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                  <item.icon size={20} />
                </div>
                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-4">
                <h4 className="font-extrabold text-foreground text-sm">{item.title}</h4>
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
              className="text-primary font-bold text-xs hover:underline cursor-pointer"
            >
              Explore All 6 Games →
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
                className="card-soft p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {game.badge}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">{game.duration}</span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                    {game.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{game.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground font-mono text-[11px]">Speed: {game.speed}</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    Play <Play size={12} />
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
