import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportService } from "../services/report.service";

describe("reportService", () => {
  beforeEach(() => {
    // Mock window.URL methods
    global.window.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost:3000/mock-pdf");
    global.window.URL.revokeObjectURL = vi.fn();
    global.window.print = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully handles valid PDF response and triggers download", async () => {
    // Mock global fetch to return dummy binary PDF blob
    const mockBlob = new Blob(["%PDF-1.4 mock pdf content exceeding 100 bytes of data for valid ophthalmic report test payload"], {
      type: "application/pdf",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: vi.fn().mockResolvedValue(mockBlob),
    });

    const success = await reportService.downloadPatientPdf({
      patientId: "patient-123",
      patientName: "Jane Doe",
      therapistSignature: "Dr. Sarah Smith, OD",
    });

    expect(success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/reports/pdf"),
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(global.window.URL.createObjectURL).toHaveBeenCalled();
  });

  it("falls back to window.print when backend report generation fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network Error"));

    const success = await reportService.downloadPatientPdf({
      patientId: "patient-err",
    });

    expect(success).toBe(false);
    expect(global.window.print).toHaveBeenCalled();
  });
});
