import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bluetooth,
  Building2,
  ChevronDown,
  Clock3,
  Edit3,
  Globe2,
  HelpCircle,
  KeyRound,
  Laptop,
  LockKeyhole,
  Plus,
  Shield,
  Trash2,
  UserCog,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Award,
  Loader2,
  Save,
  Database,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  staffService,
  StaffMember,
  StaffInput,
  StaffRole,
  StaffStatus,
} from "@/services/staff.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { DataBackupModal } from "@/components/settings/DataBackupModal";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 cursor-pointer ${
        on ? "bg-primary" : "bg-muted"
      }`}
    >
      <div
        className={`w-5 h-5 bg-card rounded-full shadow-sm transition-transform ${
          on ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}

const ALL_PERMISSIONS = [
  "Patient Management",
  "Vision Test",
  "Calibration",
  "Therapy",
  "Clinical Reports",
  "Analytics",
  "AI Insights",
  "Device Management",
  "Hospital Settings",
];

const ROLES: StaffRole[] = [
  "Doctor",
  "Ophthalmologist",
  "Orthoptist",
  "Vision Therapist",
  "Clinical Technician",
  "Receptionist",
  "Administrator",
];

const DEPARTMENTS = [
  "Ophthalmology",
  "Pediatric Orthoptics",
  "Neuro-Visual Rehabilitation",
  "Vision Diagnostics",
  "Front Desk & Care Coordination",
  "Hospital Administration",
];

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-foreground text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

const selectClass =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-52 transition-all";
const actionClass =
  "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer shadow-sm";

export default function SettingsPage() {
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [submittingStaff, setSubmittingStaff] = useState(false);

  // Delete Confirmation State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<StaffInput>({
    name: "",
    role: "Doctor",
    department: "Ophthalmology",
    phone: "",
    email: "",
    status: "Active",
    licenseNumber: "",
    permissions: ["Patient Management", "Vision Test", "Therapy"],
  });

  // Hospital Profile Form State
  const currentUser = authService.getCurrentUser();
  const [hospitalProfile, setHospitalProfile] = useState({
    hospitalName: currentUser?.hospital_name || "FOCEYE Vision Care Center",
    registrationNumber: currentUser?.hospital_registration_number || "HOSP-REG-2026-001",
    hospitalType: currentUser?.hospital_type || "Eye Care Center",
    phoneNumber: currentUser?.mobile_number || "+1 555 0199",
    officialEmail: currentUser?.email || "admin@foceyehospital.com",
    website: "www.foceyehospital.com",
    address: currentUser?.city && currentUser?.state ? `${currentUser.city}, ${currentUser.state}` : "42 Vision Medical Center",
    workingHours: "Monday–Saturday, 8:30 AM–6:30 PM",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // System Toggles
  const [notifications, setNotifications] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Load Staff
  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const data = await staffService.list();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to load staff list:", err);
      toast.error("Failed to load staff roster.");
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((member) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        !q ||
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        member.department.toLowerCase().includes(q) ||
        member.role.toLowerCase().includes(q);

      const matchesRole = roleFilter === "All" || member.role === roleFilter;
      const matchesStatus = statusFilter === "All" || member.status === statusFilter;

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, roleFilter, statusFilter]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingStaffId(null);
    setFormData({
      name: "",
      role: "Doctor",
      department: "Ophthalmology",
      phone: "",
      email: "",
      status: "Active",
      licenseNumber: "",
      permissions: ["Patient Management", "Vision Test", "Therapy"],
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (member: StaffMember) => {
    setEditingStaffId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      department: member.department,
      phone: member.phone,
      email: member.email,
      status: member.status,
      licenseNumber: member.licenseNumber || "",
      permissions: member.permissions || ["Patient Management"],
    });
    setIsModalOpen(true);
  };

  // Save Staff (Create or Update)
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter staff member's full name.");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter staff member's email.");
      return;
    }

    setSubmittingStaff(true);
    try {
      if (editingStaffId) {
        const updated = await staffService.update(editingStaffId, formData);
        setStaffList((prev) => prev.map((s) => (s.id === editingStaffId ? updated : s)));
        toast.success(`Updated ${formData.name}'s profile.`);
      } else {
        const created = await staffService.create(formData);
        setStaffList((prev) => [created, ...prev]);
        toast.success(`Added ${formData.name} to staff roster.`);
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save staff member.");
    } finally {
      setSubmittingStaff(false);
    }
  };

  // Delete Staff
  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    setDeletingId(staffToDelete.id);
    try {
      await staffService.delete(staffToDelete.id);
      setStaffList((prev) => prev.filter((s) => s.id !== staffToDelete.id));
      toast.success(`Removed ${staffToDelete.name} from hospital records.`);
      setStaffToDelete(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove staff member.");
    } finally {
      setDeletingId(null);
    }
  };

  // Toggle Staff Status (Active / Inactive)
  const handleToggleStatus = async (member: StaffMember) => {
    try {
      const updated = await staffService.toggleStatus(member.id);
      if (updated) {
        setStaffList((prev) => prev.map((s) => (s.id === member.id ? updated : s)));
        toast.info(`${member.name} marked as ${updated.status}.`);
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  // Save Hospital Profile
  const handleSaveHospitalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      try {
        localStorage.setItem("foceye_hospital_profile", JSON.stringify(hospitalProfile));
        toast.success("Hospital profile updated successfully.");
      } catch {
        toast.error("Unable to save profile.");
      } finally {
        setSavingProfile(false);
      }
    }, 400);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => {
      const current = prev.permissions || [];
      if (current.includes(permission)) {
        return { ...prev, permissions: current.filter((p) => p !== permission) };
      } else {
        return { ...prev, permissions: [...current, permission] };
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl space-y-8 pb-12 font-outfit"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 size={14} /> Hospital Administration
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">Clinic Administration & Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage hospital profile, authorized clinician roster, security credentials, and hardware settings.
          </p>
        </div>
      </header>

      {/* SECTION 1: HOSPITAL PROFILE */}
      <section className="card-soft space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Building2 size={20} className="text-primary" /> Hospital Profile
          </h2>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Tenant: {authService.getCurrentHospitalId()}
          </span>
        </div>

        <form onSubmit={handleSaveHospitalProfile} className="space-y-4">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary shadow-inner">
              <Building2 size={36} />
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Hospital Name</label>
                <input
                  type="text"
                  value={hospitalProfile.hospitalName}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, hospitalName: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Registration Number</label>
                <input
                  type="text"
                  value={hospitalProfile.registrationNumber}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, registrationNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Facility Type</label>
                <select
                  value={hospitalProfile.hospitalType}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, hospitalType: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer"
                >
                  <option value="Eye Care Center">Eye Care Center / Orthoptic Clinic</option>
                  <option value="Specialty Eye Hospital">Specialty Eye Hospital</option>
                  <option value="Private Practice">Private Practice / Optometry Clinic</option>
                  <option value="Research Institute">Research & Pediatric Institute</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Official Contact Phone</label>
                <input
                  type="text"
                  value={hospitalProfile.phoneNumber}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, phoneNumber: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Official Hospital Email</label>
                <input
                  type="email"
                  value={hospitalProfile.officialEmail}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, officialEmail: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1 block">Clinic Address</label>
                <input
                  type="text"
                  value={hospitalProfile.address}
                  onChange={(e) => setHospitalProfile({ ...hospitalProfile, address: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className={`${actionClass} bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2`}
            >
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Hospital Profile
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 2: STAFF MANAGEMENT */}
      <section className="card-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Users size={20} className="text-primary" /> Staff & Clinician Management
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Add, update, or remove authorized doctors, orthoptists, technicians, and receptionists.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className={`${actionClass} inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20`}
          >
            <Plus size={16} /> Add Staff Member
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 bg-muted/60 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted/60 rounded-xl border border-border text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-all"
            >
              <option value="All">All Roles ({staffList.length})</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 bg-muted/60 rounded-xl border border-border text-sm text-foreground outline-none focus:border-primary cursor-pointer transition-all"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive / Disabled</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          {loadingStaff ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-xs font-semibold">Loading authorized hospital staff...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Users size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-foreground text-sm">No staff members found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {searchQuery || roleFilter !== "All" || statusFilter !== "All"
                    ? "Try adjusting your search query or filters."
                    : "No staff members have been registered yet. Add your first clinical team member."}
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
              >
                + Add First Staff Member
              </button>
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Staff Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary font-extrabold flex items-center justify-center text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="leading-none">{member.name}</p>
                          {member.licenseNumber && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ID: {member.licenseNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs font-semibold text-foreground">
                      <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{member.department}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground">{member.phone || "—"}</td>
                    <td className="px-4 py-3.5 text-xs font-medium text-muted-foreground">{member.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          member.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                            : member.status === "On Leave"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-destructive/10 text-destructive border border-destructive/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.status === "Active"
                              ? "bg-emerald-500"
                              : member.status === "On Leave"
                              ? "bg-amber-500"
                              : "bg-destructive"
                          }`}
                        />
                        {member.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(member)}
                          title="Edit Staff Member"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(member)}
                          title={member.status === "Active" ? "Disable Staff Access" : "Activate Staff Access"}
                          className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            member.status === "Active"
                              ? "text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500"
                              : "text-emerald-500 hover:bg-emerald-500/10"
                          }`}
                        >
                          {member.status === "Active" ? <LockKeyhole size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStaffToDelete(member)}
                          title="Remove Staff"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* SECTION 3: ROLES & SYSTEM PERMISSIONS */}
      <section className="card-soft space-y-4">
        <div>
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <UserCog size={20} className="text-primary" /> Roles &amp; System Permissions
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Role-based clinical permission matrix enforced across hospital patient data.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.slice(0, 4).map((role) => (
            <div key={role} className="rounded-2xl border border-border bg-background/50 p-4 space-y-1">
              <span className="font-bold text-sm text-foreground block">{role}</span>
              <p className="text-xs text-muted-foreground">
                {role === "Doctor" || role === "Ophthalmologist"
                  ? "Full diagnostics, prescription & clinical notes"
                  : role === "Orthoptist"
                  ? "Vision tests, 9-point calibration & therapy"
                  : "Administration & scheduling"}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {ALL_PERMISSIONS.map((perm) => (
            <span
              key={perm}
              className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-bold"
            >
              ✓ {perm}
            </span>
          ))}
        </div>
      </section>

      {/* SECTION 4: SYSTEM & HARDWARE PREFERENCES */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="card-soft space-y-4">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Globe2 size={20} className="text-primary" /> System Settings
          </h2>
          <SettingRow title="Language" description="Default language for hospital staff">
            <select defaultValue="English" className={selectClass}>
              <option>English</option>
              <option>Hindi</option>
              <option>Spanish</option>
            </select>
          </SettingRow>
          <SettingRow title="Time Zone" description="Used for clinical records and activity logs">
            <select defaultValue="Asia/Kolkata (IST)" className={selectClass}>
              <option>Asia/Kolkata (IST)</option>
              <option>UTC (Coordinated Universal Time)</option>
              <option>America/New_York (EST)</option>
            </select>
          </SettingRow>
          <SettingRow title="Date Format" description="Display format across the clinical panel">
            <select defaultValue="DD/MM/YYYY" className={selectClass}>
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </SettingRow>
          <SettingRow title="Notification Alerts" description="Receive system and telemetry alerts">
            <Toggle on={notifications} onToggle={() => setNotifications(!notifications)} />
          </SettingRow>
          <SettingRow title="Auto Logout Security" description="Sign out inactive clinicians after 30 minutes">
            <Toggle on={autoLogout} onToggle={() => setAutoLogout(!autoLogout)} />
          </SettingRow>
        </section>

        <section className="card-soft space-y-4">
          <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
            <Bluetooth size={20} className="text-primary" /> Device &amp; Hardware Telemetry
          </h2>
          <SettingRow title="Hardware Model" description="Configured eye-tracking camera device">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-muted rounded-lg text-foreground">
              Raspberry Pi 5 (FOC-PI5-001)
            </span>
          </SettingRow>
          <SettingRow title="Camera Sensor Guidance" description="Enable corneal reflection and pupil reticle">
            <Toggle on={cameraEnabled} onToggle={() => setCameraEnabled(!cameraEnabled)} />
          </SettingRow>
          <SettingRow title="Auto-Connect Gateway" description="Connect to device telemetry tracker on page load">
            <Toggle on={autoConnect} onToggle={() => setAutoConnect(!autoConnect)} />
          </SettingRow>
          <SettingRow title="Session Inactivity Timeout" description="Disconnect telemetry during idle periods">
            <select defaultValue="15 minutes" className={selectClass}>
              <option>15 minutes</option>
              <option>30 minutes</option>
              <option>Never</option>
            </select>
          </SettingRow>
        </section>
      </div>

      {/* SECTION 5: SECURITY & COMPLIANCE */}
      <section className="card-soft space-y-4">
        <h2 className="font-bold text-foreground text-lg flex items-center gap-2">
          <Shield size={20} className="text-primary" /> Security, Privacy &amp; HIPAA Compliance
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Clock3, title: "Data Backup", description: "Local encrypted patient & telemetry storage" },
            { icon: Shield, title: "Audit Trail", description: "Immutable audit logs of patient record access" },
            { icon: Laptop, title: "Active Sessions", description: "Scoped clinician login session monitoring" },
            { icon: KeyRound, title: "Credentials", description: "Secure clinician authentication & token storage" },
            { icon: LockKeyhole, title: "Data Encryption", description: "AES-256 client encryption at rest" },
            { icon: Users, title: "Tenant Isolation", description: "Zero cross-hospital data leakage" },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-2xl border border-border bg-background/50 p-4 space-y-1">
              <Icon size={20} className="mb-2 text-primary" />
              <p className="text-sm font-bold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <SettingRow
          title="Enforce Two-Factor Authentication"
          description="Require SMS / Email OTP verification for clinician login"
        >
          <Toggle on={twoFactor} onToggle={() => setTwoFactor(!twoFactor)} />
        </SettingRow>

        <SettingRow
          title="Hospital Database Backups"
          description="Export all patients, staff, and session history as an encrypted JSON backup, or restore previous records"
        >
          <button
            onClick={() => setIsBackupModalOpen(true)}
            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Database size={14} /> Manage JSON Backups
          </button>
        </SettingRow>
      </section>

      {/* MODAL: ADD / EDIT STAFF MEMBER */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-xl rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground">
                      {editingStaffId ? "Edit Staff Member" : "Add Staff Member"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Authorize clinician or staff member for hospital records.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveStaff} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ananya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Clinical Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffRole })}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                    >
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      License / Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LIC-OPH-4482"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">
                      Official Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="doctor@foceyehospital.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Phone Contact</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 0123"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Account Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StaffStatus })}
                    className="w-full rounded-xl border border-border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
                  >
                    <option value="Active">Active (Permitted to sign in & log sessions)</option>
                    <option value="Inactive">Inactive / Disabled (Access revoked)</option>
                    <option value="On Leave">On Leave (Temporary suspended)</option>
                  </select>
                </div>

                {/* Permissions Multi-Select */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-foreground block">
                    Assigned Module Permissions
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = (formData.permissions || []).includes(perm);
                      return (
                        <button
                          type="button"
                          key={perm}
                          onClick={() => togglePermission(perm)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all border flex items-center justify-between cursor-pointer ${
                            isChecked
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{perm}</span>
                          {isChecked && <CheckCircle2 size={14} className="shrink-0 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingStaff}
                    className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submittingStaff && <Loader2 size={16} className="animate-spin" />}
                    {editingStaffId ? "Save Changes" : "Create Staff Profile"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DELETE CONFIRMATION */}
      <AnimatePresence>
        {staffToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-md rounded-3xl border border-destructive/20 shadow-2xl p-6 space-y-5 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <Trash2 size={28} />
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-xl text-foreground">Remove Staff Member?</h3>
                <p className="text-xs text-muted-foreground">
                  Are you sure you want to remove <strong className="text-foreground">{staffToDelete.name}</strong> ({staffToDelete.role}) from the hospital staff directory?
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl text-left text-[11px] text-muted-foreground border border-border">
                <p>• Associated past therapy session records will remain archived.</p>
                <p>• Staff portal authentication access will be permanently revoked.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deletingId === staffToDelete.id}
                  className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {deletingId === staffToDelete.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Confirm Removal"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DATA BACKUP & RESTORE */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onDataRestored={() => fetchStaff()}
      />
    </motion.div>
  );
}
