export type PatientStatus = "Active" | "Archived";

export type PatientClinicalStatus =
  | "REGISTERED"
  | "EYE_TEST_PENDING"
  | "EYE_TEST_COMPLETED"
  | "AI_ANALYSIS_COMPLETED"
  | "THERAPY_RECOMMENDED"
  | "THERAPY_IN_PROGRESS"
  | "THERAPY_COMPLETED";

export interface Patient {
  id: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  medicalHistory: string;
  initialObservation?: string;
  eyeCondition?: string;
  diagnosis?: string;
  assignedDoctor: string;
  registrationDate: string;
  status: PatientStatus;
  clinicalStatus?: PatientClinicalStatus;
  observedPattern?: string;
  recommendedTherapyId?: string;
  notes: string;
}

export type PatientInput = Omit<Patient, "id" | "registrationDate" | "status"> & Partial<Pick<Patient, "status">>;
