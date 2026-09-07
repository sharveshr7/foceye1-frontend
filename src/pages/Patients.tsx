import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  Pencil,
  Plus,
  Search,
  UserRound,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Stethoscope,
  Activity,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Filter,
  Trash2,
  RotateCcw,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { usePatient } from "@/contexts/PatientContext";
import type { Patient, PatientInput } from "@/types/patient";
import { PatientReportModal } from "@/components/patient/PatientReportModal";

const blankForm: PatientInput = {
  hospitalId: "HOS-001",
  firstName: "",
  lastName: "",
  age: 25,
  gender: "Female",
  dateOfBirth: "1999-01-01",
  phone: "",
  email: "",
  address: "",
  emergencyContact: "",
  medicalHistory: "",
  initialObservation: "",
  assignedDoctor: "Dr. Rachel Evans, MD",
  notes: "",
  status: "Active",
  clinicalStatus: "EYE_TEST_PENDING",
};

export default function Patients() {
  const {
    patients,
    selectedPatient,
    selectPatient,
    createPatient,
    updatePatient,
    archivePatient,
    deletePatient,
    clearAllPatients,
  } = usePatient();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Archived">("Active");
  const [editing, setEditing] = useState<Patient | undefined>();
  const [form, setForm] = useState<PatientInput>(blankForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportPatient, setReportPatient] = useState<Patient | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesQuery = `${patient.id} ${patient.firstName} ${patient.lastName} ${patient.assignedDoctor} ${patient.eyeCondition || ""} ${patient.observedPattern || ""} ${patient.initialObservation || ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || (patient.status || "Active") === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [patients, query, statusFilter]);

  const startCreate = () => {
    setEditing(undefined);
    setForm(blankForm);
    setIsFormOpen(true);
  };

  const startEdit = (patient: Patient) => {
    setEditing(patient);
    const { id, registrationDate, ...input } = patient;
    setForm(input);
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error("Please enter first and last name.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        const updated = await updatePatient(editing.id, form);
        selectPatient(updated);
        toast.success(`Patient ${updated.firstName} ${updated.lastName} updated!`);
      } else {
        const created = await createPatient(form);
        selectPatient(created);
        toast.success(`New patient ${created.firstName} ${created.lastName} registered!`);
      }
      setIsFormOpen(false);
      setForm(blankForm);
      setEditing(undefined);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    try {
      await archivePatient(id);
      toast.success(`Patient record ${name} archived.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to archive patient.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete patient "${name}" (${id}) from the Firebase database?`)) {
      try {
        await deletePatient(id);
        toast.success(`Patient ${name} permanently deleted from database.`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to delete patient.");
      }
    }
  };

  const handleClearAll = async () => {
    if (
      window.confirm(
        "⚠️ Are you sure you want to delete ALL patients from the clinical database? This will clear all records so you can add fresh patient data."
      )
    ) {
      try {
        await clearAllPatients();
        toast.success("All patient records cleared from clinical database.");
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to clear database.");
      }
    }
  };

  const activeCount = patients.filter((p) => (p.status || "Active") === "Active").length;
  const archivedCount = patients.filter((p) => p.status === "Archived").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              Clinical Directory · Standalone Registry
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Patient Registry</h1>
          <p className="text-muted-foreground text-sm">
            Manage hospital patients, condition records, and launch supervised therapy sessions with instant client persistence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {patients.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              title="Delete all patient records from Firebase to start completely fresh"
            >
              <Trash2 size={15} /> Clear All Records
            </button>
          )}
          <button
            onClick={startCreate}
            className="px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus size={18} /> Register New Patient
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-interactive flex items-center gap-4 bg-card">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserRound size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-black text-foreground">{patients.length}</p>
          </div>
        </div>
        <div className="card-interactive flex items-center gap-4 bg-card">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Therapy Cases</p>
            <p className="text-2xl font-black text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="card-interactive flex items-center gap-4 bg-card">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
            <Stethoscope size={24} />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Selected for Session</p>
            <p className="text-sm font-bold text-foreground truncate max-w-[180px]">
              {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "None selected"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Patient Table & Directory */}
        <section
          className={`card-soft p-0 overflow-hidden transition-all ${
            isFormOpen ? "xl:col-span-7" : "xl:col-span-12"
          }`}
        >
          {/* Filter Bar */}
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, ID, condition, or doctor..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground font-semibold mr-1 flex items-center gap-1">
                <Filter size={14} /> Status:
              </span>
              {(["All", "Active", "Archived"] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === status
                      ? "bg-primary text-primary-foreground shadow"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {status} {status === "Active" ? `(${activeCount})` : status === "Archived" ? `(${archivedCount})` : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-left text-muted-foreground bg-muted/20 border-b border-border">
                <tr>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Patient</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Clinical Findings</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Assigned Clinician</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Clinical Status</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Workflow Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      <UserRound size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-foreground">No patients found</p>
                      <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or register a new patient.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;
                    const cs = patient.clinicalStatus || (patient.status === "Archived" ? "Archived" : "EYE_TEST_PENDING");
                    return (
                      <tr
                        key={patient.id}
                        className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="p-4">
                          <button
                            onClick={() => {
                              selectPatient(patient);
                            }}
                            className="text-left group flex items-center gap-3"
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-105 ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {patient.firstName?.[0] || "P"}
                              {patient.lastName?.[0] || ""}
                            </div>
                            <div>
                              <span className="font-bold text-foreground block group-hover:text-primary transition-colors">
                                {patient.firstName || "Patient"} {patient.lastName || ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {patient.id} · {patient.age} yrs · {patient.gender}
                              </span>
                            </div>
                          </button>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-foreground block text-xs">
                            {patient.observedPattern || (cs === "EYE_TEST_PENDING" || cs === "REGISTERED" ? "Eye Test Required" : patient.eyeCondition || "Under Assessment")}
                          </span>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[220px]">
                            {patient.initialObservation ? `Obs: ${patient.initialObservation}` : (patient.diagnosis || "No pre-test observations")}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium text-foreground">{patient.assignedDoctor || "Unassigned"}</td>
                        <td className="p-4">
                          {(() => {
                            let badgeClass = "bg-muted text-muted-foreground";
                            let badgeText = "Registered";

                            if (cs === "EYE_TEST_PENDING" || cs === "REGISTERED") {
                              badgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
                              badgeText = "Eye Test Pending";
                            } else if (cs === "EYE_TEST_COMPLETED") {
                              badgeClass = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
                              badgeText = "Analysis Pending";
                            } else if (cs === "AI_ANALYSIS_COMPLETED" || cs === "THERAPY_RECOMMENDED") {
                              badgeClass = "bg-purple-500/10 text-purple-500 border border-purple-500/20";
                              badgeText = "Therapy Recommended";
                            } else if (cs === "THERAPY_IN_PROGRESS") {
                              badgeClass = "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20";
                              badgeText = "Therapy In Progress";
                            } else if (cs === "THERAPY_COMPLETED") {
                              badgeClass = "bg-green-500/10 text-green-500 border border-green-500/20";
                              badgeText = "Therapy Completed";
                            }

                            return (
                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${badgeClass}`}>
                                {badgeText}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(() => {
                              if (cs === "EYE_TEST_PENDING" || cs === "REGISTERED") {
                                return (
                                  <button
                                    onClick={() => {
                                      selectPatient(patient);
                                      navigate("/vision-test");
                                    }}
                                    title="Start Baseline Eye Test"
                                    className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Eye size={13} /> Eye Test
                                  </button>
                                );
                              }
                              if (cs === "EYE_TEST_COMPLETED") {
                                return (
                                  <button
                                    onClick={() => {
                                      selectPatient(patient);
                                      navigate("/ai-insights");
                                    }}
                                    title="Run AI Analysis"
                                    className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
                                  >
                                    <Sparkles size={13} /> AI Analysis
                                  </button>
                                );
                              }
                              return (
                                <button
                                  onClick={() => {
                                    selectPatient(patient);
                                    navigate("/mode-selection");
                                  }}
                                  title="Start Prescribed Therapy Session"
                                  className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap"
                                >
                                  Therapy <ArrowRight size={13} />
                                </button>
                              );
                            })()}
                            <button
                              title="View Official Clinical Report"
                              onClick={() => {
                                setReportPatient(patient);
                                setIsReportOpen(true);
                              }}
                              className="p-2 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                            >
                              <FileText size={15} />
                            </button>
                            <button
                              title="Edit Patient"
                              onClick={() => startEdit(patient)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              title="Archive Patient"
                              onClick={() => handleArchive(patient.id, `${patient.firstName} ${patient.lastName}`)}
                              className="p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors"
                            >
                              <Archive size={15} />
                            </button>
                            <button
                              title="Delete Patient Permanently from Database"
                              onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Add / Edit Patient Form Panel */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.aside
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              className="xl:col-span-5 card-soft sticky top-6 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-6 shadow-2xl border-primary/20"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <UserRound size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">{editing ? "Edit Patient Record" : "New Patient Registration"}</h2>
                    <p className="text-xs text-muted-foreground">Fill in clinical information below.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      First Name <span className="text-primary">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Sarah"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">
                      Last Name <span className="text-primary">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Jenkins"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Age</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={form.age || ""}
                      onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Gender</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Birth Date</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full px-2.5 py-2 bg-muted/50 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Assigned Clinician / Doctor</label>
                  <input
                    type="text"
                    placeholder="Dr. Rachel Evans, MD"
                    value={form.assignedDoctor}
                    onChange={(e) => setForm({ ...form, assignedDoctor: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-foreground">
                      Initial Physical Observation <span className="text-muted-foreground font-normal">(Objective signs prior to eye test)</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold text-primary tracking-wide">Pre-Test Observation</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="E.g. Mild conjunctival redness noted, head tilt to right shoulder, normal pupil reactivity, no visible ptosis..."
                    value={form.initialObservation || ""}
                    onChange={(e) => setForm({ ...form, initialObservation: e.target.value })}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Record only objective observable signs. Eye movement patterns and clinical therapy recommendations will be automatically determined after the Eye Test and AI Analysis.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Medical & Visual History</label>
                  <textarea
                    rows={2}
                    placeholder="Notes on glasses prescription, screen habits, previous treatments..."
                    value={form.medicalHistory}
                    onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                    className="w-full px-3.5 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Therapist Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Initial plan and therapy frequency recommendations..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>
                        <CheckCircle2 size={18} /> {editing ? "Update Patient" : "Save & Register Patient"}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-5 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Printable Clinical Report Modal */}
      {reportPatient && (
        <PatientReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setReportPatient(null);
          }}
          patient={reportPatient}
        />
      )}
    </div>
  );
}
