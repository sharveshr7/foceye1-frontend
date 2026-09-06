import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Smartphone, Cpu, ArrowRight, Gamepad2, Target, Zap, Activity, Eye, Sparkles, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePatient } from "@/contexts/PatientContext";
import { calibrationService } from "@/services/calibration.service";

export default function TherapySelection() {
  const navigate = useNavigate();
  const { selectedPatient } = usePatient();

  const isCalibrated = calibrationService.isCalibrated(selectedPatient?.id);
  const latestCalib = calibrationService.getLatestCalibration(selectedPatient?.id);

  const selectMode = (mode: "mobile" | "device", gameId?: string) => {
    if (!selectedPatient) {
      navigate("/patients");
      return;
    }
    if (!isCalibrated) {
      navigate("/calibration");
      return;
    }
    navigate("/therapy-session", {
      state: { mode, prescribedExerciseId: gameId || "target-tracking", patientId: selectedPatient.id },
    });
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-8 font-outfit pb-16">
      <header className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider">
          <Sparkles size={13} /> Step 3: Therapy Session Delivery
        </div>
        <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Choose Therapy Delivery Mode</h1>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
          {selectedPatient
            ? `Select the tracking hardware for ${selectedPatient.firstName} ${selectedPatient.lastName} (${selectedPatient.eyeCondition}).`
            : "Select a patient to begin a supervised neuro-visual rehabilitation session."}
        </p>
      </header>

      {/* Calibration Verification Banner */}
      {selectedPatient && !isCalibrated && (
        <div className="card-soft flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-amber-500/10 border-amber-500/30">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Eye Calibration Required (Step 1)</p>
              <p className="text-xs text-muted-foreground">Eye movement calibration must be completed with $\ge 85\%$ accuracy before starting therapy exercises.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/calibration")}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:scale-105 transition-all shrink-0 cursor-pointer"
          >
            Calibrate Eyes Now →
          </button>
        </div>
      )}

      {selectedPatient && isCalibrated && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-2xl w-fit mx-auto">
          <CheckCircle2 size={16} /> Eye Tracking Calibrated ({latestCalib?.accuracy || 94}% Accuracy) · Ready for Supervised Therapy
        </div>
      )}

      {!selectedPatient && (
        <div className="card-soft flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-amber-500/5 border-amber-500/20">
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">No active patient room</p>
            <p className="text-xs text-muted-foreground">Select a patient before starting a therapy session to record metrics.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 hover:scale-105 transition-all shrink-0"
          >
            Select from Registry
          </button>
        </div>
      )}

      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera Mode */}
        <motion.div
          whileHover={{ y: -4 }}
          className={`card-soft group border-2 border-border/70 hover:border-primary transition-all overflow-hidden flex flex-col justify-between ${
            selectedPatient ? "cursor-pointer" : "cursor-not-allowed opacity-75"
          }`}
          onClick={() => selectMode("mobile")}
        >
          <div className="p-6 sm:p-8 space-y-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Smartphone size={28} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Webcam &amp; AI Gaze Tracking
              </span>
              <h2 className="text-2xl font-extrabold text-foreground mt-2">Browser Webcam Mode</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Utilizes the integrated laptop or USB camera with client-side computer vision to track pupil coordinates, corneal reflex, and fixation precision at 30 FPS.
              </p>
            </div>
          </div>
          <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs font-bold text-primary">
            <span>Launch Webcam Therapy</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>

        {/* Dedicated Hardware Mode */}
        <motion.div
          whileHover={{ y: -4 }}
          className={`card-soft group border-2 border-border/70 hover:border-secondary transition-all overflow-hidden flex flex-col justify-between ${
            selectedPatient ? "cursor-pointer" : "cursor-not-allowed opacity-75"
          }`}
          onClick={() => selectMode("device")}
        >
          <div className="p-6 sm:p-8 space-y-4">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Cpu size={28} />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider">
                High-Frequency Sensor
              </span>
              <h2 className="text-2xl font-extrabold text-foreground mt-2">FOCEYE Pi-Tracker Device</h2>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Real-time 60 FPS binary eye-tracking telemetry with dedicated infrared illumination for sub-millimeter gaze precision and saccadic latency recording.
              </p>
            </div>
          </div>
          <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between text-xs font-bold text-secondary">
            <span>Launch Device Telemetry</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      </div>

      {/* Direct Exercise Quick-Launch Matrix */}
      <section className="space-y-4 pt-4">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Gamepad2 size={20} className="text-primary" /> Instant Exercise Quick-Launch
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: "target-tracking",
              title: "Smooth Pursuit Target Tracking",
              category: "Pursuits",
              desc: "Continuous conjugate tracking across horizontal and diagonal paths.",
              icon: Target,
              color: "text-primary bg-primary/10",
            },
            {
              id: "convergence-pushup",
              title: "Near-Point Convergence Fusion",
              category: "Vergence",
              desc: "Dynamic near fusion breakpoint restoration for convergence insufficiency.",
              icon: Activity,
              color: "text-secondary bg-secondary/10",
            },
            {
              id: "reaction-speed",
              title: "Saccadic Stepping & Reaction",
              category: "Saccades",
              desc: "Rapid target acquisition to reduce visual orienting latency.",
              icon: Zap,
              color: "text-amber-500 bg-amber-500/10",
            },
            {
              id: "saccade-jumps",
              title: "Saccadic Latency & Jump Test",
              category: "Neuro-Ophthalmic",
              desc: "Millisecond saccadic onset tracking with dynamic reaction feedback.",
              icon: Zap,
              color: "text-blue-500 bg-blue-500/10",
            },
            {
              id: "focus-hold",
              title: "Fixation Stability Hold",
              category: "Fixation",
              desc: "Bifoveal alignment training to suppress micro-saccadic jitter.",
              icon: Eye,
              color: "text-emerald-500 bg-emerald-500/10",
            },
            {
              id: "blink-master",
              title: "Voluntary Complete Blink Coaching",
              category: "Ocular Surface",
              desc: "Restores tear film integrity and combats digital screen asthenopia.",
              icon: Sparkles,
              color: "text-purple-500 bg-purple-500/10",
            },
          ].map((game) => (
            <div
              key={game.id}
              onClick={() => selectMode("mobile", game.id)}
              className="card-soft p-4 flex flex-col justify-between hover:border-primary/50 transition-all cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${game.color}`}>
                    <game.icon size={16} />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {game.category}
                  </span>
                </div>
                <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                  {game.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{game.desc}</p>
              </div>

              <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs font-bold text-primary">
                <span>Play Now</span>
                <Play size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
