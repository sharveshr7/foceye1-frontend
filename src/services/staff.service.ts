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
    return this.getLocalStaff();
  },

  async create(input: StaffInput): Promise<StaffMember> {
    const hospitalId = authService.getCurrentHospitalId();
    const newStaff: StaffMember = {
      ...input,
      id: `staff_${Date.now()}`,
      hospitalId,
      permissions: input.permissions || ["Patient Management", "Vision Test", "Therapy"],
      createdAt: new Date().toISOString(),
    };

    const current = this.getLocalStaff();
    const updated = [newStaff, ...current];
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

  async toggleStatus(id: string): Promise<StaffMember> {
    const current = this.getLocalStaff();
    const existing = current.find((s) => s.id === id);
    if (!existing) {
      throw new Error(`Staff member ${id} not found.`);
    }

    const newStatus: StaffStatus = existing.status === "Active" ? "Inactive" : "Active";
    return this.update(id, { status: newStatus });
  },

  async delete(id: string): Promise<void> {
    const current = this.getLocalStaff();
    const updated = current.filter((s) => s.id !== id);
    this.setLocalStaff(updated);
  },

  async getById(id: string): Promise<StaffMember | null> {
    const current = this.getLocalStaff();
    return current.find((s) => s.id === id) || null;
  },
};
