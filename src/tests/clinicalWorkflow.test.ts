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
      expect(result.instruction).toBe("Blinking detected.");
      expect(result.status).toBe("tracking");
    });

    it("toggles and persists mute state", () => {
      voiceCoach.setMuted(true);
      expect(voiceCoach.getMuted()).toBe(true);
      voiceCoach.setMuted(false);
      expect(voiceCoach.getMuted()).toBe(false);
    });
  });

  describe("Multilingual Voice Coaching System", () => {
    it("supports all 5 required languages: English, Tamil, Malayalam, Telugu, Hindi", () => {
      const supported = voiceCoach.getSupportedLanguages();
      const codes = supported.map((l) => l.code);
      expect(codes).toEqual(["en", "ta", "ml", "te", "hi"]);
    });

    it("switches language and translates directional cues accurately into Tamil", () => {
      voiceCoach.setLanguage("ta");
      expect(voiceCoach.getLanguage()).toBe("ta");
      expect(voiceCoach.getInstructionText("lookRight")).toContain("வலது பக்கம் பாருங்கள்");
      expect(voiceCoach.getInstructionText("lookLeft")).toContain("இடது பக்கம் பாருங்கள்");
      expect(voiceCoach.getInstructionText("goodContinue")).toContain("நன்று, தொடருங்கள்");
      expect(voiceCoach.getInstructionText("keepHeadStill")).toContain("தலையை அசைக்காதீர்கள்");
    });

    it("switches language and translates cues into Malayalam", () => {
      voiceCoach.setLanguage("ml");
      expect(voiceCoach.getLanguage()).toBe("ml");
      expect(voiceCoach.getInstructionText("lookUp")).toContain("മുകളിലേക്ക് നോക്കുക");
      expect(voiceCoach.getInstructionText("lookDown")).toContain("താഴേക്ക് നോക്കുക");
      expect(voiceCoach.getInstructionText("blinkEyes")).toContain("കണ്ണുകൾ ചിമ്മുക");
    });

    it("switches language and translates cues into Telugu", () => {
      voiceCoach.setLanguage("te");
      expect(voiceCoach.getLanguage()).toBe("te");
      expect(voiceCoach.getInstructionText("lookRight")).toContain("కుడివైపు చూడండి");
      expect(voiceCoach.getInstructionText("lookLeft")).toContain("ఎడమవైపు చూడండి");
      expect(voiceCoach.getInstructionText("followTarget")).toContain("లక్ష్యాన్ని అనుసరించండి");
    });

    it("switches language and translates cues into Hindi", () => {
      voiceCoach.setLanguage("hi");
      expect(voiceCoach.getLanguage()).toBe("hi");
      expect(voiceCoach.getInstructionText("lookStraight")).toContain("सीधे देखें");
      expect(voiceCoach.getInstructionText("tryAgain")).toContain("कृपया फिर से प्रयास करें");
      expect(voiceCoach.getInstructionText("goodContinue")).toContain("बहुत बढ़िया, जारी रखें");
    });

    it("reverts cleanly back to English", () => {
      voiceCoach.setLanguage("en");
      expect(voiceCoach.getLanguage()).toBe("en");
      expect(voiceCoach.getInstructionText("lookRight")).toContain("Look to the right");
    });
  });

  describe("Smarter AI Analysis: Data-Driven and Separation of Findings", () => {
    it("flags data as Insufficient if calibration precision is below 85%", async () => {
      const { aiService } = await import("@/services/ai.service");
      const result = await aiService.diagnoseAndPrescribe({
        patientName: "John Doe",
        age: 25,
        calibrationPrecision: 70, // Below 85%
        acuityScore: 80,
        contrastScore: 85,
        saccadeScore: 80,
        fixationScore: 80,
        convergenceScore: 70,
        totalFramesSampled: 40,
      });

      expect(result.dataSufficiency).toBe("Insufficient");
      expect(result.observedFindings).toBeDefined();
      expect(result.possibleConcerns).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.confidenceQualityIndicator).toContain("calibration precision 70%");
    });

    it("flags data as Sufficient with high calibration accuracy and separates findings", async () => {
      const { aiService } = await import("@/services/ai.service");
      const result = await aiService.diagnoseAndPrescribe({
        patientName: "Jane Smith",
        age: 30,
        calibrationPrecision: 95,
        acuityScore: 90,
        contrastScore: 90,
        saccadeScore: 85,
        fixationScore: 85,
        convergenceScore: 65,
        convergenceNpcCm: 14.5,
        fixationBCEADeg2: 0.75,
        pursuitGain: 0.92,
        totalFramesSampled: 45,
      });

      expect(result.dataSufficiency).toBe("Sufficient");
      expect(result.observedFindings?.length).toBeGreaterThan(0);
      expect(result.possibleConcerns?.length).toBeGreaterThan(0);
      expect(result.recommendations?.length).toBeGreaterThan(0);
      expect(result.confidenceQualityIndicator).toContain("High Clinical Confidence");
    });
  });
});
