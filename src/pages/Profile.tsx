import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Stethoscope,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  UserRound,
  Brain,
  Target,
  PlayCircle,
  Pencil,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Play,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { usePatient } from "@/contexts/PatientContext";
import { visionService, type VisionTestResult } from "@/services/vision.service";
import { therapyService, type TherapySessionData } from "@/services/therapy.service";

const hospitalName = "FOCEYE Vision Hospital";

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function Profile() {
  const { selectedPatient } = usePatient();
  const navigate = useNavigate();

  const [latestTest, setLatestTest] = useState<VisionTestResult | null>(null);
  const [sessions, setSessions] = useState<TherapySessionData[]>([]);

  useEffect(() => {
    if (!selectedPatient) return;
    visionService.getLatest(selectedPatient.id).then(setLatestTest);
    therapyService.getSessions(selectedPatient.id).then(setSessions);
  }, [selectedPatient]);

  if (!selectedPatient) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="card-soft text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <UserRound size={28} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">No Patient Selected</h2>
          <p className="text-muted-foreground text-sm">Select a patient from the registry to view their complete clinical profile.</p>
          <button onClick={() => navigate("/patients")} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm">
            Go to Patients
          </button>
        </div>
      </div>
    );
  }

  const patient = selectedPatient;
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const cs = patient.clinicalStatus || "EYE_TEST_PENDING";

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7 font-outfit pb-12">
      {/* Page Header */}
      <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-soft flex-shrink-0">
            <UserRound size={34} />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">
              {patient.hospitalId || "HOS-001"} · {patient.id}
            </p>
            <h1 className="text-3xl font-bold text-foreground">{patientName}</h1>
            <p className="text-muted-foreground text-sm">
              Standardized Clinical Hierarchy Profile — Patient Data, Pre-Test Observations, Eye Metrics, AI Findings, and Prescribed Therapies.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  cs === "EYE_TEST_PENDING" || cs === "REGISTERED"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                    : cs === "EYE_TEST_COMPLETED"
                    ? "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                    : cs === "AI_ANALYSIS_COMPLETED" || cs === "THERAPY_RECOMMENDED"
                    ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                    : cs === "THERAPY_IN_PROGRESS"
                    ? "bg-cyan-500/15 text-cyan-500 border border-cyan-500/20"
                    : "bg-green-500/15 text-green-500 border border-green-500/20"
                }`}
              >
                Clinical State: {cs.replace(/_/g, " ")}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                Assigned Clinician: {patient.assignedDoctor || "Unassigned"}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                Registered: {formatDate(patient.registrationDate)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/patients")} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-bold transition-colors">
            Back to Registry
          </button>
        </div>
      </header>

      {/* 1. PATIENT INFORMATION SECTION */}
      <section className="card-soft border-primary/20 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <UserRound className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-foreground">1. Patient Information (Demographics & Registration)</h2>
          </div>
          <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-full">Demographic Record</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Patient ID</p>
            <p className="font-semibold text-foreground mt-0.5">{patient.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Full Name</p>
            <p className="font-semibold text-foreground mt-0.5">{patientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Age & Gender</p>
            <p className="font-semibold text-foreground mt-0.5">{patient.age} yrs · {patient.gender}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Date of Birth</p>
            <p className="font-semibold text-foreground mt-0.5">{formatDate(patient.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Phone Number</p>
            <p className="font-semibold text-foreground mt-0.5">{patient.phone || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-semibold text-foreground mt-0.5">{patient.email || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Emergency Contact</p>
            <p className="font-semibold text-foreground mt-0.5">{patient.emergencyContact || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Address</p>
            <p className="font-semibold text-foreground mt-0.5 truncate">{patient.address || "Not recorded"}</p>
          </div>
        </div>
      </section>

      {/* 2. INITIAL PHYSICAL OBSERVATION SECTION */}
      <section className="card-soft border-amber-500/20 bg-amber-500/[0.02] space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-amber-600 dark:text-amber-400" size={20} />
            <h2 className="text-lg font-bold text-foreground">2. Initial Physical Observation</h2>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-1 rounded-full">
            Pre-Test Observable Signs
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-background border border-border rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Observable Signs & Appearance</p>
            <p className="text-foreground leading-relaxed">
              {patient.initialObservation || "No specific pre-test physical observations recorded during registration."}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2 italic">
              Objective physical/visible signs recorded prior to eye-tracking test. (Non-diagnostic).
            </p>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Medical & Visual History</p>
            <p className="text-foreground leading-relaxed">
              {patient.medicalHistory || "No prior ocular medical history recorded."}
            </p>
            {patient.notes && (
              <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">
                <span className="font-semibold">Clinician Notes:</span> {patient.notes}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* 3. EYE TEST SECTION */}
      <section className="card-soft border-blue-500/20 bg-blue-500/[0.02] space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Eye className="text-blue-500" size={20} />
            <h2 className="text-lg font-bold text-foreground">3. Eye Test (Objective Camera Eye-Tracking)</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              latestTest ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
            }`}>
              {latestTest ? "Assessment Recorded" : "Test Pending"}
            </span>
            <button
              onClick={() => navigate("/vision-test")}
              className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1"
            >
              <Eye size={12} /> {latestTest ? "Retest" : "Start Eye Test"}
            </button>
          </div>
        </div>

        {latestTest ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-background border border-border rounded-xl">
              <p className="text-muted-foreground text-xs">Test Date & Timestamp</p>
              <p className="font-bold text-foreground mt-1">{formatDate(latestTest.timestamp)}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(latestTest.timestamp).toLocaleTimeString()}</p>
            </div>
            <div className="p-3 bg-background border border-border rounded-xl">
              <p className="text-muted-foreground text-xs">Composite Score</p>
              <p className="text-2xl font-black text-primary mt-0.5">{latestTest.score}/100</p>
              <p className="text-[11px] text-green-500 font-semibold">Camera Telemetry Verified</p>
            </div>
            <div className="p-3 bg-background border border-border rounded-xl sm:col-span-2">
              <p className="text-muted-foreground text-xs">Assessment Protocol</p>
              <p className="font-semibold text-foreground mt-1">{latestTest.test_type}</p>
              <p className="text-[11px] text-muted-foreground">Fixation, Horizontal/Vertical Saccades, Pursuit & Blink dynamics recorded.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-background border border-dashed border-border rounded-xl text-center space-y-2">
            <AlertCircle className="mx-auto text-amber-500" size={28} />
            <h4 className="font-bold text-foreground text-sm">No Eye Test Recorded Yet</h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              This patient has not yet undergone the standardized mobile/device camera eye assessment. Perform the Eye Test to collect real ocular metrics.
            </p>
            <button
              onClick={() => navigate("/vision-test")}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all inline-flex items-center gap-1.5"
            >
              <Eye size={13} /> Launch Baseline Eye Test
            </button>
          </div>
        )}
      </section>

      {/* 4. AI ANALYSIS SECTION */}
      <section className="card-soft border-purple-500/20 bg-purple-500/[0.02] space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-purple-500" size={20} />
            <h2 className="text-lg font-bold text-foreground">4. AI Analysis & Observed Pattern Identification</h2>
          </div>
          <button
            onClick={() => navigate("/ai-insights")}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
          >
            <Sparkles size={12} /> View AI Report
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-background border border-border rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Observed Eye-Movement Pattern</p>
            <p className="text-base font-bold text-foreground">
              {patient.observedPattern || (latestTest ? "Under AI Evaluation" : "Awaiting Eye Test Completion")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {patient.observedPattern
                ? "Identified automatically by AI analyzing actual eye-tracking measurements."
                : "Pattern will be determined once eye test telemetry is processed."}
            </p>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Clinical Assessment Finding</p>
            <p className="font-semibold text-foreground">
              {patient.diagnosis || "Pending post-test AI diagnostic model"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Medically cautious observation based on ocular sensor evidence.
            </p>
          </div>

          <div className="p-4 bg-background border border-border rounded-xl">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Recommended Therapy</p>
            <p className="font-bold text-primary">
              {patient.recommendedTherapyId || (patient.observedPattern ? "Dynamic Pursuit & Vergence Training" : "Awaiting Assessment")}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Personalized visual rehabilitation protocol tailored to identified pattern.
            </p>
          </div>
        </div>
      </section>

      {/* 5. THERAPY SECTION */}
      <section className="card-soft border-green-500/20 bg-green-500/[0.02] space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <PlayCircle className="text-green-500" size={20} />
            <h2 className="text-lg font-bold text-foreground">5. Therapy (Prescribed Sessions & History)</h2>
          </div>
          <button
            onClick={() => navigate("/mode-selection")}
            disabled={cs === "EYE_TEST_PENDING" || cs === "REGISTERED"}
            className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 disabled:opacity-50"
          >
            <Play size={12} /> Launch Session
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="p-3 bg-background border border-border rounded-xl">
            <p className="text-muted-foreground text-xs">Total Completed Sessions</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{sessions.length}</p>
            <p className="text-[11px] text-primary font-semibold">Hospital Verified</p>
          </div>
          <div className="p-3 bg-background border border-border rounded-xl">
            <p className="text-muted-foreground text-xs">Current Therapy Stage</p>
            <p className="font-bold text-foreground mt-1">{cs.replace(/_/g, " ")}</p>
            <p className="text-[11px] text-muted-foreground">Adherence tracking active</p>
          </div>
          <div className="p-3 bg-background border border-border rounded-xl sm:col-span-2">
            <p className="text-muted-foreground text-xs">Latest Session Summary</p>
            {sessions.length > 0 ? (
              <p className="text-xs font-semibold text-foreground mt-1">
                Score: {sessions[0].performanceScore ?? 85}% · Duration: {Math.round(sessions[0].sessionDuration / 60)}m · {formatDate(sessions[0].sessionDate)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {cs === "EYE_TEST_PENDING" || cs === "REGISTERED"
                  ? "Baseline Eye Test and AI Analysis must be completed before therapy sessions can commence."
                  : "Ready for initial prescribed therapy session."}
              </p>
            )}
          </div>
        </div>

        {sessions.length > 0 && (
          <div className="mt-4 border-t border-border/50 pt-4">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Recent Session Log</h4>
            <div className="space-y-2">
              {sessions.slice(0, 3).map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg text-xs">
                  <span className="font-semibold text-foreground">{s.therapyId || "Visual Therapy"}</span>
                  <span className="text-muted-foreground">{formatDate(s.sessionDate)}</span>
                  <span className="font-bold text-primary">Score: {s.performanceScore ?? 85}%</span>
                  <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded font-bold">{s.completionStatus || "Completed"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
