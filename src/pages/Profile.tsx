import { motion } from "framer-motion";
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Monitor,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "@/contexts/PatientContext";

const hospitalName = "FOCEYE Vision Hospital";
const latestVisit = "2026-07-20";

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
  const patientStatus = patient.status === "Active" ? "Active" : "Inactive";
  const quickStats = [
    { icon: Activity, label: "Total Vision Tests", value: "18", detail: "Latest score 84%" },
    { icon: ClipboardList, label: "Total Therapy Sessions", value: "42", detail: "Supervised sessions" },
    { icon: PlayCircle, label: "Completed Sessions", value: "36", detail: "6 pending follow-up" },
    { icon: Calendar, label: "Pending Sessions", value: "6", detail: "Next on Jul 24, 2026" },
    { icon: Target, label: "Last Calibration Date", value: "Jul 20, 2026", detail: "Calibration verified" },
    { icon: Brain, label: "Latest AI Analysis", value: "Tracking improved", detail: "Updated Jul 22, 2026" },
    { icon: FileText, label: "Latest Clinical Report", value: "Ready for review", detail: "Generated Jul 22, 2026" },
  ];
  const quickActions = [
    { icon: Activity, label: "Begin Vision Test", path: "/vision-test" },
    { icon: Target, label: "Start Calibration", path: "/calibration" },
    { icon: PlayCircle, label: "Start Therapy", path: "/mode-selection" },
    { icon: TrendingUp, label: "View Analytics", path: "/analytics" },
    { icon: FileText, label: "View Clinical Report", path: "/analytics" },
    { icon: Pencil, label: "Edit Patient Details", path: "/patients" },
  ];
  const timeline = [
    { icon: Calendar, title: "Patient Registered", date: patient.registrationDate, text: `${patientName} was registered under ${patient.hospitalId}.` },
    { icon: Activity, title: "Vision Tests", date: "2026-07-18", text: "Latest vision test showed stable fixation with improving visual tracking." },
    { icon: Target, title: "Calibration Session", date: "2026-07-20", text: "Device calibration completed successfully during supervised setup." },
    { icon: PlayCircle, title: "Therapy Session", date: "2026-07-20", text: "Completed guided therapy block with strong response consistency." },
    { icon: FileText, title: "Report Generated", date: "2026-07-22", text: "Clinical report prepared for hospital staff review and PDF export." },
    { icon: Stethoscope, title: "Doctor Note", date: "2026-07-22", text: patient.notes || "No doctor note recorded for this date." },
  ];
  const historyCards = [
    { icon: Activity, title: "Vision test results", text: "Latest supervised assessment: 84%", path: "/vision-test" },
    { icon: Calendar, title: "Calibration history", text: "Last calibration completed Jul 20, 2026", path: "/calibration" },
    { icon: ClipboardList, title: "Therapy sessions", text: "42 recorded supervised sessions", path: "/mode-selection" },
    { icon: FileText, title: "AI reports and clinical report", text: "Most recent report ready for staff review", path: "/analytics" },
    { icon: Monitor, title: "Device history", text: "FOC-Tracker v2 linked for this patient", path: "/device" },
    { icon: TrendingUp, title: "Progress history", text: "12% improvement across current review period", path: "/analytics" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
      <header className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-soft flex-shrink-0">
            <UserRound size={34} />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">
              {patient.hospitalId} · {patient.id}
            </p>
            <h1 className="text-3xl font-bold text-foreground">{patientName}</h1>
            <p className="text-muted-foreground">
              Electronic medical record for hospital staff review and patient care coordination.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {patientStatus}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                Assigned Doctor: {patient.assignedDoctor || "Unassigned"}
              </span>
              <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                Latest Visit: {formatDate(latestVisit)}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => navigate("/patients")} className="px-4 py-2 bg-muted rounded-xl text-sm font-bold">
          Back to patients
        </button>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card-gradient-teal xl:col-span-1">
          <p className="text-primary-foreground/80 text-sm">Clinical summary</p>
          <h2 className="text-2xl font-bold mt-2">{patient.diagnosis || patient.eyeCondition || "Assessment pending"}</h2>
          <p className="text-primary-foreground/80 mt-4 text-sm">Hospital: {hospitalName}</p>
          <p className="text-primary-foreground/80 mt-2 text-sm">Registration Date: {formatDate(patient.registrationDate)}</p>
          <p className="text-primary-foreground/80 mt-2 text-sm">Latest Visit: {formatDate(latestVisit)}</p>
        </div>

        <div className="card-soft xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Patient ID</p>
            <p className="font-semibold text-foreground">{patient.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Patient Name</p>
            <p className="font-semibold text-foreground">{patientName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Age</p>
            <p className="font-semibold text-foreground">{patient.age} years</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p className="font-semibold text-foreground">{patient.gender || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-semibold text-foreground">{formatDate(patient.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hospital Name</p>
            <p className="font-semibold text-foreground">{hospitalName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone Number</p>
            <p className="font-semibold text-foreground">{patient.phone || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-semibold text-foreground">{patient.email || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Address</p>
            <p className="font-semibold text-foreground">{patient.address || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Emergency Contact</p>
            <p className="font-semibold text-foreground">{patient.emergencyContact || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assigned Doctor</p>
            <p className="font-semibold text-foreground">{patient.assignedDoctor || "Unassigned"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Patient Status</p>
            <p className="font-semibold text-foreground">{patientStatus}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {quickStats.map((item) => (
          <div key={item.label} className="card-soft">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
              <item.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-foreground">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-xs text-primary font-semibold mt-1">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card-soft xl:col-span-2">
          <h2 className="text-xl font-bold mb-4">Medical information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Eye Condition</p>
              <p className="font-semibold text-foreground">{patient.eyeCondition || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Diagnosis</p>
              <p className="font-semibold text-foreground">{patient.diagnosis || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Medical History</p>
              <p className="text-foreground">{patient.medicalHistory || "No medical history recorded"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Doctor Notes</p>
              <p className="text-foreground">{patient.notes || "No doctor notes recorded"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Allergies</p>
              <p className="text-foreground">Placeholder for future backend field</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current Medications</p>
              <p className="text-foreground">Placeholder for future backend field</p>
            </div>
          </div>
        </div>

        <div className="card-soft">
          <h2 className="text-xl font-bold mb-4">Quick actions</h2>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <action.icon size={18} />
                </div>
                <span className="font-semibold text-foreground">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Patient record overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {historyCards.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="card-soft text-left hover:border-primary/50 transition-colors"
            >
              <item.icon className="text-primary mb-3" size={22} />
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{item.text}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="card-soft xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Stethoscope className="text-secondary" size={20} />
            <h2 className="font-bold text-xl">Patient timeline</h2>
          </div>
          <div className="space-y-4">
            {timeline.map((entry) => (
              <div key={`${entry.title}-${entry.date}`} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                  <entry.icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h3 className="font-bold text-foreground">{entry.title}</h3>
                    <span className="text-xs font-bold text-muted-foreground">{formatDate(entry.date)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{entry.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-soft space-y-4">
          <h2 className="text-xl font-bold">Contact snapshot</h2>
          <div className="flex items-start gap-3">
            <Phone className="text-primary mt-0.5" size={18} />
            <div>
              <p className="text-muted-foreground text-sm">Phone Number</p>
              <p className="font-semibold text-foreground">{patient.phone || "Not recorded"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="text-primary mt-0.5" size={18} />
            <div>
              <p className="text-muted-foreground text-sm">Email</p>
              <p className="font-semibold text-foreground">{patient.email || "Not recorded"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="text-primary mt-0.5" size={18} />
            <div>
              <p className="text-muted-foreground text-sm">Address</p>
              <p className="font-semibold text-foreground">{patient.address || "Not recorded"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <UserRound className="text-primary mt-0.5" size={18} />
            <div>
              <p className="text-muted-foreground text-sm">Emergency Contact</p>
              <p className="font-semibold text-foreground">{patient.emergencyContact || "Not recorded"}</p>
            </div>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border p-4">
            <p className="text-sm font-bold text-foreground">Backend readiness</p>
            <p className="text-sm text-muted-foreground mt-1">
              This record is structured to receive patient, history, therapy, report, and analytics data from future clinical endpoints.
            </p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
