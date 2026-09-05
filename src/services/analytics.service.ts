import { therapyService } from "./therapy.service";
import { patientService } from "./patient.service";

export interface DashboardSummary {
  vision_score: number;
  vision_score_change_pct: number;
  daily_progress_minutes: number;
  daily_target_minutes: number;
  next_milestone_title: string;
  next_milestone_sessions_left: number;
  total_patients?: number;
  total_sessions?: number;
}

export interface AnalyticsTrend {
  weekly_trends: { label: string; score: number; minutes: number }[];
  monthly_avg_accuracy: number;
  total_sessions_completed: number;
}

export const analyticsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const [patients, sessions] = await Promise.all([
      patientService.list(),
      therapyService.getHistory(),
    ]);

    const totalPatients = patients.length;
    const totalSessions = sessions.length;

    let totalMinutes = 0;
    let totalAccuracy = 0;

    sessions.forEach((s) => {
      totalMinutes += Math.round((s.sessionDuration || s.duration || 300) / 60);
      totalAccuracy += s.performanceScore || s.accuracy || 88;
    });

    const avgScore = totalSessions > 0 ? Math.round(totalAccuracy / totalSessions) : 0;
    const dailyProgress = totalSessions > 0 ? Math.min(30, Math.round(totalMinutes / Math.max(1, totalSessions))) : 0;

    return {
      vision_score: avgScore,
      vision_score_change_pct: totalSessions > 0 ? 0 : 0,
      daily_progress_minutes: dailyProgress,
      daily_target_minutes: 30,
      next_milestone_title: totalSessions > 5 ? "Advanced Binocular Fusion" : "Initial Baseline Calibration",
      next_milestone_sessions_left: Math.max(0, 5 - (totalSessions % 5)),
      total_patients: totalPatients,
      total_sessions: totalSessions,
    };
  },

  getTrends: async (patientId?: string): Promise<AnalyticsTrend> => {
    const sessions = await therapyService.getHistory(patientId);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayData: Record<string, { totalScore: number; count: number; minutes: number }> = {};
    days.forEach((d) => (dayData[d] = { totalScore: 0, count: 0, minutes: 0 }));

    let totalAccuracy = 0;
    let totalCount = 0;

    sessions.forEach((s) => {
      const score = s.performanceScore || s.accuracy || 88;
      const mins = Math.round((s.sessionDuration || s.duration || 300) / 60);
      totalAccuracy += score;
      totalCount++;

      const date = new Date(s.timestamp || s.sessionDate || Date.now());
      const dayName = days[(date.getDay() + 6) % 7];
      if (dayData[dayName]) {
        dayData[dayName].totalScore += score;
        dayData[dayName].count++;
        dayData[dayName].minutes += mins;
      }
    });

    const weeklyTrends = days.map((d) => ({
      label: d,
      score: dayData[d].count > 0 ? Math.round(dayData[d].totalScore / dayData[d].count) : 0,
      minutes: dayData[d].minutes || 0,
    }));

    return {
      weekly_trends: weeklyTrends,
      monthly_avg_accuracy: totalCount > 0 ? Math.round(totalAccuracy / totalCount) : 0,
      total_sessions_completed: totalCount,
    };
  },
};
