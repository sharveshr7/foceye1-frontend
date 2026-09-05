export type PatientStatus = "Active" | "Archived";

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
  eyeCondition: string;
  diagnosis: string;
  assignedDoctor: string;
  registrationDate: string;
  status: PatientStatus;
  notes: string;
}

export type PatientInput = Omit<Patient, "id" | "registrationDate" | "status"> & Partial<Pick<Patient, "status">>;
