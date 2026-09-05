import type { Patient, PatientInput } from "@/types/patient";
import { ApiClient } from "./api.client";
import { authService } from "./auth.service";

const PATIENTS_STORAGE_PREFIX = "foceye_patients_";

export const patientService = {
  getStorageKey(): string {
    const hospitalId = authService.getCurrentHospitalId();
    return `${PATIENTS_STORAGE_PREFIX}${hospitalId}`;
  },

  getLocalPatients(): Patient[] {
    try {
      const key = this.getStorageKey();
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: Patient[] = JSON.parse(raw);
        // Filter out any legacy demo patients (PAT-1001, PAT-1002, PAT-1003)
        const cleaned = parsed.filter(
          (p) => !["PAT-1001", "PAT-1002", "PAT-1003"].includes(p.id)
        );
        return cleaned;
      }
      return [];
    } catch {
      return [];
    }
  },

  setLocalPatients(patients: Patient[]): void {
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(patients));
    } catch (err) {
      console.warn("[patientService] Error writing patients to localStorage:", err);
    }
  },

  async list(): Promise<Patient[]> {
    try {
      const remotePatients = await ApiClient.get<any[]>("/patients");
      if (Array.isArray(remotePatients)) {
        // Map backend patient format to frontend Patient model
        const mapped: Patient[] = remotePatients.map((rp) => ({
          id: rp.id,
          hospitalId: authService.getCurrentHospitalId(),
          firstName: rp.name.split(" ")[0] || "Patient",
          lastName: rp.name.split(" ").slice(1).join(" ") || "",
          dateOfBirth: "1995-01-01",
          age: rp.age || 25,
          gender: rp.gender || "Other",
          phone: "+1 (555) 000-0000",
          email: `${rp.id.toLowerCase()}@patient.foceye.clinic`,
          address: "Clinical Station Patient Record",
          emergencyContact: "Primary Care / Clinic Guardian",
          medicalHistory: `ICD-10: ${rp.icd10 || 'H53.00'}. BCEA: ${rp.bcea_score || 1.0} deg²`,
          eyeCondition: rp.condition || "General Vision",
          diagnosis: `${rp.condition || 'General Vision'} (${rp.stage || 'Active Therapy'})`,
          assignedDoctor: "Dr. Sarah Smith, OD",
          registrationDate: rp.created_at ? rp.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          status: (rp.stage === "Completed" ? "Completed" : "Active") as any,
          notes: `Adherence: ${rp.adherence || 100}%. Last evaluated: ${rp.last_session || 'Recently'}.`,
        }));

        this.setLocalPatients(mapped);
        return mapped;
      }
    } catch {
      // Graceful offline fallback
    }
    return this.getLocalPatients();
  },

  async get(id: string): Promise<Patient> {
    try {
      const rp = await ApiClient.get<any>(`/patients/${id}`);
      if (rp && rp.id) {
        return {
          id: rp.id,
          hospitalId: authService.getCurrentHospitalId(),
          firstName: rp.name.split(" ")[0] || "Patient",
          lastName: rp.name.split(" ").slice(1).join(" ") || "",
          dateOfBirth: "1995-01-01",
          age: rp.age || 25,
          gender: rp.gender || "Other",
          phone: "+1 (555) 000-0000",
          email: `${rp.id.toLowerCase()}@patient.foceye.clinic`,
          address: "Clinical Station Patient Record",
          emergencyContact: "Primary Care / Clinic Guardian (+1 555-0199)",
          medicalHistory: `ICD-10: ${rp.icd10 || 'H53.00'}. BCEA: ${rp.bcea_score || 1.0} deg²`,
          eyeCondition: rp.condition || "General Vision",
          diagnosis: rp.condition || "Vision Deficit",
          assignedDoctor: "Dr. Sarah Smith, OD",
          registrationDate: new Date().toISOString().split("T")[0],
          status: "Active",
          notes: `Adherence: ${rp.adherence || 100}%.`,
        };
      }
    } catch {
      // Local fallback
    }

    const patients = this.getLocalPatients();
    const found = patients.find((p) => p.id === id);
    if (found) return found;
    throw new Error(`Patient ${id} not found in database.`);
  },

  async create(input: PatientInput): Promise<Patient> {
    const currentHospitalId = authService.getCurrentHospitalId();
    let assignedId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

    // Sync with FastAPI backend first to obtain canonical Supabase UUID
    try {
      const backendRes = await ApiClient.post<any>("/patients", {
        name: `${input.firstName} ${input.lastName}`.trim(),
        age: Number(input.age) || 20,
        gender: input.gender || "Other",
        condition: input.eyeCondition || "General Vision",
        icd10: "H53.00",
        stage: input.status || "Active Therapy",
        adherence: 100,
        visual_acuity_left: "20/20",
        visual_acuity_right: "20/20",
        bcea_score: 1.0,
      });
      if (backendRes && backendRes.id) {
        assignedId = backendRes.id;
      }
    } catch (e) {
      console.warn("[patientService] Backend offline, using local ID fallback:", e);
    }

    const patientRecord: Patient = {
      ...input,
      id: assignedId,
      hospitalId: input.hospitalId || currentHospitalId,
      registrationDate: new Date().toISOString().split("T")[0],
      status: input.status || "Active",
      age: Number(input.age) || 0,
    };

    // Save locally
    const patients = this.getLocalPatients();
    const updated = [patientRecord, ...patients.filter((p) => p.id !== assignedId)];
    this.setLocalPatients(updated);

    return patientRecord;
  },

  async update(id: string, input: Partial<PatientInput>): Promise<Patient> {
    const patients = this.getLocalPatients();
    const existing = patients.find((p) => p.id === id);
    if (!existing) {
      throw new Error(`Patient ${id} not found.`);
    }

    const updatedData: Patient = {
      ...existing,
      ...input,
      age: input.age !== undefined ? Number(input.age) : existing.age,
    };

    const updatedList = patients.map((p) => (p.id === id ? updatedData : p));
    this.setLocalPatients(updatedList);

    // Sync update to backend
    try {
      await ApiClient.put(`/patients/${id}`, {
        name: `${updatedData.firstName} ${updatedData.lastName}`.trim(),
        age: updatedData.age,
        condition: updatedData.eyeCondition,
      });
    } catch {
      // ignore offline
    }

    return updatedData;
  },

  async delete(id: string): Promise<void> {
    const patients = this.getLocalPatients();
    const updatedList = patients.filter((p) => p.id !== id);
    this.setLocalPatients(updatedList);

    try {
      await ApiClient.delete(`/patients/${id}`);
    } catch {
      // ignore offline
    }
  },

  async archive(id: string): Promise<Patient> {
    return this.update(id, { status: "Archived" });
  },

  async clearAll(): Promise<void> {
    this.setLocalPatients([]);
  },
};
