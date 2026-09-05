export interface VisionTestResult {
  id: string;
  patient_id: string;
  score: number;
  test_type: string;
  timestamp: string;
  details?: unknown;
}

export interface VisionTestSubmission {
  score: number;
  test_type: string;
  timestamp?: string;
  metrics?: Record<string, unknown>;
}

const STORAGE_KEY = "foceye_vision_tests";

export const visionService = {
  getHistory: async (patientId: string): Promise<VisionTestResult[]> => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: VisionTestResult[] = raw ? JSON.parse(raw) : [];
      return list.filter((t) => t.patient_id === patientId);
    } catch (err) {
      console.warn("[visionService] Error loading history:", err);
      return [];
    }
  },

  submitResult: async (patientId: string, data: VisionTestSubmission): Promise<VisionTestResult> => {
    const record: VisionTestResult = {
      id: `VT-${Date.now()}`,
      patient_id: patientId,
      score: data.score,
      test_type: data.test_type,
      timestamp: data.timestamp || new Date().toISOString(),
      details: data.metrics,
    };

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: VisionTestResult[] = raw ? JSON.parse(raw) : [];
      list.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    } catch (err) {
      console.warn("[visionService] Error saving test result:", err);
    }

    return record;
  },

  getLatest: async (patientId: string): Promise<VisionTestResult | null> => {
    try {
      const tests = await visionService.getHistory(patientId);
      return tests.length > 0 ? tests[0] : null;
    } catch {
      return null;
    }
  },
};
