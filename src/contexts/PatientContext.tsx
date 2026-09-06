import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { patientService } from "@/services/patient.service";
import type { Patient, PatientInput } from "@/types/patient";
export type { Patient, PatientInput } from "@/types/patient";

type Value = {
  patients: Patient[];
  selectedPatient?: Patient;
  loading: boolean;
  error?: string;
  selectPatient: (patient?: Patient) => void;
  createPatient: (input: PatientInput) => Promise<Patient>;
  updatePatient: (id: string, input: Partial<PatientInput>) => Promise<Patient>;
  archivePatient: (id: string) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  clearAllPatients: () => Promise<void>;
  refreshPatients: () => Promise<void>;
};

const Context = createContext<Value | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const loadPatients = async () => {
    try {
      setLoading(true);
      const items = await patientService.list();
      setPatients(items);
      if (items.length > 0) {
        setSelectedPatient((prev) => (prev ? items.find((p) => p.id === prev.id) || items[0] : items[0]));
      } else {
        setSelectedPatient(undefined);
      }
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const value = useMemo<Value>(
    () => ({
      patients,
      selectedPatient,
      loading,
      error,
      selectPatient: setSelectedPatient,
      createPatient: async (input) => {
        const patient = await patientService.create(input);
        setPatients((items) => [patient, ...items.filter((p) => p.id !== patient.id)]);
        setSelectedPatient(patient);
        return patient;
      },
      updatePatient: async (id, input) => {
        const patient = await patientService.update(id, input);
        setPatients((items) => items.map((item) => (item.id === id ? patient : item)));
        setSelectedPatient((item) => (item?.id === id ? patient : item));
        return patient;
      },
      archivePatient: async (id) => {
        const patient = await patientService.archive(id);
        setPatients((items) => items.map((item) => (item.id === id ? patient : item)));
        setSelectedPatient((item) => (item?.id === id ? patient : item));
      },
      deletePatient: async (id) => {
        await patientService.delete(id);
        setPatients((items) => items.filter((item) => item.id !== id));
        setSelectedPatient((item) => (item?.id === id ? undefined : item));
      },
      clearAllPatients: async () => {
        await patientService.clearAll();
        setPatients([]);
        setSelectedPatient(undefined);
      },
      refreshPatients: loadPatients,
    }),
    [patients, selectedPatient, loading, error]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePatient() {
  const value = useContext(Context);
  if (!value) throw new Error("usePatient must be used within PatientProvider");
  return value;
}
