import { ApiClient } from "./api.client";
import { authService } from "./auth.service";

export type StaffRole =
  | "Doctor"
  | "Ophthalmologist"
  | "Orthoptist"
  | "Vision Therapist"
  | "Clinical Technician"
  | "Receptionist"
  | "Administrator";

export type StaffStatus = "Active" | "Inactive" | "On Leave";

export interface StaffMember {
  id: string;
  hospitalId: string;
  name: string;
  role: StaffRole;
  department: string;
  phone: string;
  email: string;
  status: StaffStatus;
  licenseNumber?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type StaffInput = Omit<StaffMember, "id" | "hospitalId" | "createdAt" | "updatedAt">;

const STORAGE_KEY_PREFIX = "foceye_staff_";

export const staffService = {
  getStorageKey(): string {
    const hospitalId = authService.getCurrentHospitalId();
    return `${STORAGE_KEY_PREFIX}${hospitalId}`;
  },

  getLocalStaff(): StaffMember[] {
    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: StaffMember[] = JSON.parse(raw);
        return parsed.filter((s) => !["staff_1", "staff_2", "staff_3"].includes(s.id));
      }
      return [];
    } catch {
      return [];
    }
  },

  setLocalStaff(staffList: StaffMember[]) {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(staffList));
    } catch (err) {
      console.warn("[staffService] Error saving staff list:", err);
    }
  },

  async list(): Promise<StaffMember[]> {
    try {
      const remoteStaff = await ApiClient.get<any[]>("/auth/staff");
      if (Array.isArray(remoteStaff) && remoteStaff.length > 0) {
        const mapped: StaffMember[] = remoteStaff.map((s) => ({
          id: s.id,
          hospitalId: s.hospitalId || authService.getCurrentHospitalId(),
          name: s.name,
          email: s.email,
          role: (s.role === "DOCTOR" ? "Doctor" : "Vision Therapist") as StaffRole,
          department: s.department || "Vision Therapy",
          phone: s.phone || "+1 (555) 012-3456",
          status: (s.status === "ACTIVE" ? "Active" : "Inactive") as StaffStatus,
          createdAt: s.joinDate || new Date().toISOString(),
          permissions: ["Patient Management", "Vision Test", "Therapy"]
        }));
        this.setLocalStaff(mapped);
        return mapped;
      }
    } catch (e) {
      // Backend offline fallback
    }
    return this.getLocalStaff();
  },

  async create(input: StaffInput): Promise<StaffMember> {
    const hospitalId = authService.getCurrentHospitalId();
    let assignedId = `staff_${Date.now()}`;

    try {
      const res = await ApiClient.post<any>("/auth/staff", {
        name: input.name,
        email: input.email,
        role: input.role,
        department: input.department,
        phone: input.phone
      });
      if (res && res.id) assignedId = res.id;
    } catch (e) {
      console.warn("[staffService] Failed to sync new staff with backend:", e);
    }

    const newStaff: StaffMember = {
      ...input,
      id: assignedId,
      hospitalId,
      permissions: input.permissions || ["Patient Management", "Vision Test", "Therapy"],
      createdAt: new Date().toISOString(),
    };

    const current = this.getLocalStaff();
    const updated = [newStaff, ...current.filter((s) => s.id !== newStaff.id)];
    this.setLocalStaff(updated);
    return newStaff;
  },

  async add(input: StaffInput): Promise<StaffMember> {
    return this.create(input);
  },

  async update(id: string, input: Partial<StaffInput>): Promise<StaffMember> {
    const current = this.getLocalStaff();
    const existing = current.find((s) => s.id === id);
    if (!existing) {
      throw new Error(`Staff member ${id} not found.`);
    }

    const updatedMember: StaffMember = {
      ...existing,
      ...input,
      updatedAt: new Date().toISOString(),
    };

    const updated = current.map((s) => (s.id === id ? updatedMember : s));
    this.setLocalStaff(updated);
    return updatedMember;
  },

  async remove(id: string): Promise<void> {
    try {
      await ApiClient.delete(`/auth/staff/${id}`);
    } catch (e) {
      // Ignore network errors
    }
    const current = this.getLocalStaff();
    const filtered = current.filter((s) => s.id !== id);
    this.setLocalStaff(filtered);
  },
};
