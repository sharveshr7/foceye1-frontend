export interface CalibrationStatus {
  status: string;
  precision_score: number;
  camera_status: string;
  last_calibration_date?: string;
}

export interface CalibrationStartResponse {
  status: string;
  camera_status: string;
}

export interface CalibrationSubmitRequest {
  test_id: string;
  score: number;
  patient_id?: string;
  notes?: string;
}

export interface CalibrationRecord {
  test_id: string;
  score: number;
  patient_id?: string;
  notes?: string;
  precision_score: number;
  status: string;
  timestamp: string;
}

const STORAGE_KEY = "foceye_calibration_history";

const defaultStatus: CalibrationStatus = {
  status: "Ready",
  precision_score: 96,
  camera_status: "Camera calibrated and tracking",
  last_calibration_date: new Date().toISOString().split("T")[0],
};

export const calibrationService = {
  getStatus: async (): Promise<CalibrationStatus> => {
    try {
      const stored = localStorage.getItem("foceye_calibration_status");
      if (stored) return JSON.parse(stored);
    } catch (err) {
      console.warn("[calibrationService] Status read error:", err);
    }
    return defaultStatus;
  },

  start: async (): Promise<CalibrationStartResponse> => {
    return {
      status: "In Progress",
      camera_status: "Camera active and tracking 9-point grid",
    };
  },

  submitResult: async (data: CalibrationSubmitRequest): Promise<{ precision_score: number; status: string }> => {
    const precision = data.score || 95;
    const record: CalibrationRecord = {
      ...data,
      precision_score: precision,
      status: "Successful",
      timestamp: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: CalibrationRecord[] = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      localStorage.setItem(
        "foceye_calibration_status",
        JSON.stringify({
          status: "Calibrated",
          precision_score: precision,
          camera_status: "Camera aligned and calibrated",
          last_calibration_date: new Date().toISOString().split("T")[0],
        })
      );
    } catch (err) {
      console.warn("[calibrationService] Result submit error:", err);
    }

    return { precision_score: precision, status: "Successful" };
  },

  getHistory: async (patientId?: string): Promise<CalibrationRecord[]> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: CalibrationRecord[] = raw ? JSON.parse(raw) : [];
      if (patientId) {
        return list.filter((item) => item.patient_id === patientId);
      }
      return list;
    } catch {
      return [];
    }
  },
};
