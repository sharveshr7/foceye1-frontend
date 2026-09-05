/**
 * FOCEYE Clinical PDF Report Service
 * Connects to FastAPI Backend /api/v1/reports/pdf to generate and stream formal clinical PDF documents.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export interface ReportGenerationOptions {
  patientId: string;
  includeAiInsights?: boolean;
  therapistSignature?: string;
  patientName?: string;
}

export const reportService = {
  /**
   * Generates and downloads the official ophthalmic PDF report for a patient.
   */
  async downloadPatientPdf(options: ReportGenerationOptions): Promise<boolean> {
    try {
      const token = localStorage.getItem("foceye_auth_token") || localStorage.getItem("foceye_token");

      const response = await fetch(`${API_BASE_URL}/reports/pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patient_id: options.patientId,
          include_ai_insights: options.includeAiInsights ?? true,
          therapist_signature: options.therapistSignature || "Dr. Sarah Smith, OD",
        }),
      });

      if (!response.ok) {
        throw new Error(`Report generation failed with HTTP ${response.status}`);
      }

      const blob = await response.blob();
      if (!blob || blob.size < 10) {
        throw new Error("Received empty or invalid PDF payload");
      }

      // Trigger native browser download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      const sanitizedName = (options.patientName || options.patientId).replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `FOCEYE_Clinical_Report_${sanitizedName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (err) {
      console.warn("[reportService] Live PDF generation error, falling back to window print:", err);
      // Client-side print fallback
      window.print();
      return false;
    }
  },
};
