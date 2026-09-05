import { authService } from "./auth.service";

export interface TherapySessionData {
  id?: string;
  patientId?: string;
  hospitalId?: string;
  gameId: string;
  therapyId?: string;
  accuracy: number;
  blinks: number;
  duration: number;
  sessionDuration?: number;
  mode?: "mobile" | "device";
  timestamp?: string;
  sessionDate?: string;
  completionStatus?: string;
  performanceScore?: number;
  doctorNotes?: string;
}

import { ApiClient } from "./api.client";

const STORAGE_KEY = "foceye_therapy_sessions";

export const therapyService = {
  saveSession: async (sessionData: TherapySessionData) => {
    const hospitalId = authService.getCurrentHospitalId();
    const payload: TherapySessionData = {
      ...sessionData,
      id: sessionData.id || `SES-${Date.now()}`,
      hospitalId,
      timestamp: sessionData.timestamp || new Date().toISOString(),
      sessionDate: sessionData.sessionDate || new Date().toISOString().split("T")[0],
      completionStatus: sessionData.completionStatus || "Completed",
      performanceScore: sessionData.performanceScore ?? sessionData.accuracy ?? 90,
    };

    // 1. Sync with FastAPI Backend
    if (sessionData.patientId) {
      try {
        await ApiClient.post("/therapy/sessions", {
          patient_id: sessionData.patientId,
          exercise_type: sessionData.gameId,
          duration_seconds: sessionData.duration || 300,
          fixation_score: sessionData.accuracy || 90,
          saccadic_score: sessionData.performanceScore || 88,
          convergence_score: 90,
          clinical_notes: sessionData.doctorNotes || "Routine vision therapy session completed.",
        });
      } catch (err) {
        console.warn("[therapyService] Backend therapy sync note:", err);
      }
    }

    // 2. Persist in local storage
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const list: TherapySessionData[] = existingRaw ? JSON.parse(existingRaw) : [];
      const cleaned = list.filter((s) => !["SES-101", "SES-102", "SES-103"].includes(s.id || ""));
      cleaned.unshift(payload);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned.slice(0, 100)));
    } catch (err) {
      console.warn("[therapyService] Save session error:", err);
    }

    return { success: true, session: payload };
  },

  getHistory: async (patientId?: string): Promise<TherapySessionData[]> => {
    try {
      const endpoint = patientId
        ? `/therapy/sessions?patient_id=${encodeURIComponent(patientId)}`
        : "/therapy/sessions";
      const remoteSessions = await ApiClient.get<any[]>(endpoint);
      if (Array.isArray(remoteSessions)) {
        const mapped: TherapySessionData[] = remoteSessions.map((s) => ({
          id: s.id,
          patientId: s.patient_id,
          gameId: s.exercise_type || "target-tracking",
          accuracy: Math.round(s.fixation_score ?? s.overall_score ?? 90),
          blinks: 0,
          duration: s.duration_seconds || 300,
          sessionDuration: s.duration_seconds || 300,
          timestamp: s.created_at,
          sessionDate: s.created_at ? s.created_at.split("T")[0] : undefined,
          completionStatus: "Completed",
          performanceScore: Math.round(s.overall_score ?? s.saccadic_score ?? s.fixation_score ?? 90),
          doctorNotes: s.clinical_notes,
        }));
        return mapped;
      }
    } catch {
      // Graceful offline fallback to local storage
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: TherapySessionData[] = raw ? JSON.parse(raw) : [];
      const cleaned = list.filter((s) => !["SES-101", "SES-102", "SES-103"].includes(s.id || ""));
      if (patientId) {
        return cleaned.filter((s) => s.patientId === patientId);
      }
      return cleaned;
    } catch {
      return [];
    }
  },

  getRecommendations: async () => {
    return {
      recommended_category: "Eye Movement Disorders",
      recommended_exercises: [
        {
          id: "target-tracking",
          title: "Smooth Pursuit Target Tracking",
          reason: "Enhances continuous conjugate gaze fixation.",
        },
        {
          id: "convergence-pushup",
          title: "Near-Point Convergence Fusion",
          reason: "Strengthens medial rectus co-contraction.",
        },
      ],
    };
  },

  getRecommendedExercises: async () => {
    return [
      {
        id: "target-tracking",
        title: "Dynamic Pursuit Tracking",
        category: "Pursuits",
        difficulty: "Moderate",
        durationMinutes: 5,
      },
      {
        id: "focus-hold",
        title: "Fixation Stability Hold",
        category: "Fixation",
        difficulty: "Easy",
        durationMinutes: 4,
      },
      {
        id: "convergence-pushup",
        title: "Binocular Convergence Training",
        category: "Vergence",
        difficulty: "Moderate",
        durationMinutes: 6,
      },
    ];
  },
};
