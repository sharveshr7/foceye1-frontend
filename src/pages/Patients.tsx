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
  eyeCondition: "Convergence Insufficiency",
  diagnosis: "Convergence insufficiency",
  assignedDoctor: "Dr. Rachel Evans, MD",
  notes: "",
  status: "Active",
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
      const matchesQuery = `${patient.id} ${patient.firstName} ${patient.lastName} ${patient.assignedDoctor} ${patient.eyeCondition}`
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

  const handleQuickPrefill = () => {
    const samples = [
      {
        firstName: "Alexander",
        lastName: "Wright",
        age: 34,
        gender: "Male",
        dateOfBirth: "1992-05-18",
        phone: "+1 (555) 789-0123",
        email: "a.wright@example.com",
        address: "88 Market St, San Francisco, CA",
        eyeCondition: "Binocular Vision Dysfunction",
        diagnosis: "Vertical heterophoria with reading fatigue",
        assignedDoctor: "Dr. Rachel Evans, MD",
        medicalHistory: "Complaints of headaches and words jumping while reading.",
        notes: "Recommended 10 sessions of binocular fusion therapy.",
      },
      {
        firstName: "Maya",
        lastName: "Patel",
        age: 14,
        gender: "Female",
        dateOfBirth: "2012-08-30",
        phone: "+1 (555) 654-3210",
        email: "patel.family@example.com",
        address: "304 University Ave, Palo Alto, CA",
        eyeCondition: "Lazy Eye (Amblyopia)",
        diagnosis: "Right eye strabismic amblyopia",
        assignedDoctor: "Dr. Marcus Vance, OD",
        medicalHistory: "Early childhood patching therapy with incomplete recovery.",
        notes: "Focus on high-contrast stimuli and active visual tracking.",
      },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setForm((prev) => ({ ...prev, ...picked }));
    toast.info("Prefilled sample patient details!");
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
        "⚠️ Are you sure you want to delete ALL patients from Firebase Firestore? This will clear all records so you can add fresh patient data."
      )
    ) {
      try {
        await clearAllPatients();
        toast.success("All patient records cleared from Firebase database.");
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
        <div className="card-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <UserRound size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Patients</p>
            <p className="text-2xl font-bold text-foreground">{patients.length}</p>
          </div>
        </div>
        <div className="card-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Therapy Cases</p>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="card-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
            <Stethoscope size={24} />
          </div>
          <div>
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
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Condition</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Assigned Doctor</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
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
                          <span className="font-semibold text-foreground block text-xs">{patient.eyeCondition || "General"}</span>
                          <span className="text-[11px] text-muted-foreground block truncate max-w-[180px]">
                            {patient.diagnosis || "Under evaluation"}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-medium text-foreground">{patient.assignedDoctor || "Unassigned"}</td>
                        <td className="p-4">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              patient.status === "Active"
                                ? "bg-green-500/10 text-green-500 border border-green-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {patient.status || "Active"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                selectPatient(patient);
                                navigate("/mode-selection");
                              }}
                              title="Start Therapy Session"
                              className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              Therapy <ArrowRight size={13} />
                            </button>
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
                  {!editing && (
                    <button
                      type="button"
                      onClick={handleQuickPrefill}
                      title="Quick fill sample data"
                      className="px-2.5 py-1 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Sparkles size={13} /> Auto-fill
                    </button>
                  )}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Eye Condition / Category</label>
                    <select
                      value={form.eyeCondition}
                      onChange={(e) => setForm({ ...form, eyeCondition: e.target.value })}
                      className="w-full px-3 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                    >
                      <option value="Convergence Insufficiency">Convergence Insufficiency</option>
                      <option value="Amblyopia">Amblyopia (Lazy Eye)</option>
                      <option value="Strabismus">Strabismus</option>
                      <option value="Binocular Vision Dysfunction">Binocular Vision Dysfunction</option>
                      <option value="Eye Movement Disorders">Eye Movement Disorders</option>
                      <option value="Digital Eye Strain">Digital Eye Strain</option>
                      <option value="Refractive Errors">Refractive Errors</option>
                      <option value="General Eye Wellness">General Eye Wellness</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1">Assigned Doctor</label>
                    <input
                      type="text"
                      placeholder="Dr. Rachel Evans, MD"
                      value={form.assignedDoctor}
                      onChange={(e) => setForm({ ...form, assignedDoctor: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Clinical Diagnosis</label>
                  <input
                    type="text"
                    placeholder="e.g. Convergence insufficiency with reading fatigue"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
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
