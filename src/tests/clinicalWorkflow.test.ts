import { describe, it, expect, beforeEach, vi } from "vitest";
import { calibrationService } from "@/services/calibration.service";
import { voiceCoach } from "@/utils/voiceCoach";

describe("Clinical Workflow: Calibration Gating & Voice Coaching", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("Calibration Service Clinical Gating", () => {
    it("returns false for isCalibrated when no calibration has occurred", () => {
      expect(calibrationService.isCalibrated("PAT-TEST-1")).toBe(false);
      expect(calibrationService.getLatestCalibration("PAT-TEST-1")).toBeNull();
    });

    it("returns false when calibration accuracy is below 85%", async () => {
      await calibrationService.submitResult({
        test_id: "test_low",
        patient_id: "PAT-TEST-1",
        score: 78,
      });

      expect(calibrationService.isCalibrated("PAT-TEST-1")).toBe(false);
      const latest = calibrationService.getLatestCalibration("PAT-TEST-1");
      expect(latest?.precision_score).toBe(78);
      expect(latest?.status).toBe("Insufficient Accuracy");
    });

    it("returns true when calibration accuracy is >= 85%", async () => {
      await calibrationService.submitResult({
        test_id: "test_high",
        patient_id: "PAT-TEST-1",
        score: 94,
      });

      expect(calibrationService.isCalibrated("PAT-TEST-1")).toBe(true);
      const latest = calibrationService.getLatestCalibration("PAT-TEST-1");
      expect(latest?.precision_score).toBe(94);
      expect(latest?.status).toBe("Successful");
    });
  });

  describe("Voice Coach Guidance & Gaze Direction Evaluation", () => {
    it("identifies aligned gaze when target and eye position match within tolerance", () => {
      const result = voiceCoach.evaluateGazeAndCoach(0.5, 0.5, 0.52, 0.51, 0.95, false);
      expect(result.status).toBe("aligned");
      expect(result.instruction).toContain("Good, continue");
      expect(result.accuracyPct).toBeGreaterThanOrEqual(85);
    });

    it("instructs user to look right when target is to the right of eye gaze", () => {
      // Gaze is at 0.3, target is at 0.8
      const result = voiceCoach.evaluateGazeAndCoach(0.8, 0.5, 0.3, 0.5, 0.95, false);
      expect(result.status).toBe("correcting");
      expect(result.instruction).toBe("Look to the right.");
    });

    it("instructs user to look left when target is to the left of eye gaze", () => {
      // Gaze is at 0.8, target is at 0.3
      const result = voiceCoach.evaluateGazeAndCoach(0.3, 0.5, 0.8, 0.5, 0.95, false);
      expect(result.status).toBe("correcting");
      expect(result.instruction).toBe("Look to the left.");
    });

    it("instructs user to look up when target is above eye gaze", () => {
      // Gaze is at 0.7, target is at 0.3 (lower Y is higher up in screen space)
      const result = voiceCoach.evaluateGazeAndCoach(0.5, 0.2, 0.5, 0.6, 0.95, false);
      expect(result.status).toBe("correcting");
      expect(result.instruction).toBe("Look up.");
    });

    it("instructs user to look down when target is below eye gaze", () => {
      // Gaze is at 0.3, target is at 0.7
      const result = voiceCoach.evaluateGazeAndCoach(0.5, 0.7, 0.5, 0.3, 0.95, false);
      expect(result.status).toBe("correcting");
      expect(result.instruction).toBe("Look down.");
    });

    it("detects blinking state accurately", () => {
      const result = voiceCoach.evaluateGazeAndCoach(0.5, 0.5, 0.5, 0.5, 0.95, true);
      expect(result.instruction).toBe("Blinking detected");
      expect(result.status).toBe("tracking");
    });

    it("toggles and persists mute state", () => {
      voiceCoach.setMuted(true);
      expect(voiceCoach.getMuted()).toBe(true);
      voiceCoach.setMuted(false);
      expect(voiceCoach.getMuted()).toBe(false);
    });
  });
});
