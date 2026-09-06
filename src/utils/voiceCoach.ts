/**
 * FOCEYE Clinical Voice Coach & Real-Time Biofeedback Engine
 * Provides synchronized voice instructions and directional gaze coaching
 * using the Web Speech API and live camera telemetry comparison.
 */

export interface GazeEvaluation {
  instruction: string;
  status: "aligned" | "tracking" | "correcting" | "off-target";
  accuracyPct: number;
  dx: number;
  dy: number;
}

class VoiceCoachService {
  private isMuted: boolean = false;
  private lastSpokenTime: number = 0;
  private minIntervalMs: number = 3200; // Minimum 3.2s between automated voice cues
  private currentVoice: SpeechSynthesisVoice | null = null;
  private goodStreakCount: number = 0;
  private offStreakCount: number = 0;

  constructor() {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("foceye_voice_coach_muted");
      this.isMuted = storedMute === "true";
      this.initVoice();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural English voices (Google, Samantha, Daniel, Natural)
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith("en") &&
        (v.name.includes("Natural") ||
          v.name.includes("Google") ||
          v.name.includes("Samantha") ||
          v.name.includes("Daniel") ||
          v.name.includes("Karen"))
    );
    this.currentVoice = preferred || voices.find((v) => v.lang.startsWith("en")) || null;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      localStorage.setItem("foceye_voice_coach_muted", String(muted));
      if (muted && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public speak(text: string, force: boolean = false) {
    if (this.isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    const now = Date.now();
    if (!force && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Clear any queued sentence
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.currentVoice) utterance.voice = this.currentVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;
      utterance.lang = "en-US";

      this.lastSpokenTime = now;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[VoiceCoach] Speech synthesis error:", e);
    }
  }

  // Pre-defined Clinical Prompts
  public lookRight() {
    this.speak("Look to the right.");
  }

  public lookLeft() {
    this.speak("Look to the left.");
  }

  public lookUp() {
    this.speak("Look up.");
  }

  public lookDown() {
    this.speak("Look down.");
  }

  public lookCenter() {
    this.speak("Look straight ahead.");
  }

  public blinkEyes() {
    this.speak("Blink your eyes.");
  }

  public followTarget() {
    this.speak("Follow the moving target.");
  }

  public keepHeadStill() {
    this.speak("Keep your head still. Move only your eyes.");
  }

  public goodContinue() {
    this.speak("Good, continue.");
  }

  public tryAgain() {
    this.speak("Please try again.");
  }

  /**
   * Evaluates camera gaze coordinate vs target position and delivers
   * corrective voice feedback.
   */
  public evaluateGazeAndCoach(
    targetX: number,
    targetY: number,
    gazeX: number,
    gazeY: number,
    confidence: number = 1.0,
    isBlinking: boolean = false
  ): GazeEvaluation {
    const dx = gazeX - targetX;
    const dy = gazeY - targetY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Compute instantaneous alignment accuracy (0% to 100%)
    const rawAccuracy = Math.max(0, Math.min(100, Math.round((1 - distance / 0.6) * 100)));

    if (confidence < 0.25 && !isBlinking) {
      this.offStreakCount++;
      if (this.offStreakCount >= 3) {
        this.keepHeadStill();
        this.offStreakCount = 0;
      }
      return {
        instruction: "Keep your head still. Move only your eyes.",
        status: "off-target",
        accuracyPct: rawAccuracy,
        dx,
        dy,
      };
    }

    if (isBlinking) {
      return {
        instruction: "Blinking detected",
        status: "tracking",
        accuracyPct: rawAccuracy,
        dx,
        dy,
      };
    }

    // Tolerance thresholds (Normalized space)
    const ON_TARGET_RADIUS = 0.16;

    if (distance <= ON_TARGET_RADIUS) {
      this.goodStreakCount++;
      this.offStreakCount = 0;

      if (this.goodStreakCount === 4) {
        this.goodContinue();
        this.goodStreakCount = 0;
      }

      return {
        instruction: "Target aligned. Good, continue.",
        status: "aligned",
        accuracyPct: Math.max(88, rawAccuracy),
        dx,
        dy,
      };
    }

    // User is lagging or looking away from target
    this.goodStreakCount = 0;
    this.offStreakCount++;

    let instruction = "Follow the moving target.";

    // Directional guidance based on where target is relative to current gaze
    if (targetX - gazeX > 0.18) {
      instruction = "Look to the right.";
      if (this.offStreakCount >= 2) this.lookRight();
    } else if (gazeX - targetX > 0.18) {
      instruction = "Look to the left.";
      if (this.offStreakCount >= 2) this.lookLeft();
    } else if (gazeY - targetY > 0.18) {
      instruction = "Look up.";
      if (this.offStreakCount >= 2) this.lookUp();
    } else if (targetY - gazeY > 0.18) {
      instruction = "Look down.";
      if (this.offStreakCount >= 2) this.lookDown();
    } else if (Math.abs(targetX - 0.5) < 0.15 && Math.abs(targetY - 0.5) < 0.15) {
      instruction = "Look straight ahead.";
      if (this.offStreakCount >= 2) this.lookCenter();
    } else {
      instruction = "Follow the moving target.";
      if (this.offStreakCount >= 2) this.followTarget();
    }

    if (this.offStreakCount >= 2) {
      this.offStreakCount = 0;
    }

    return {
      instruction,
      status: "correcting",
      accuracyPct: rawAccuracy,
      dx,
      dy,
    };
  }
}

export const voiceCoach = new VoiceCoachService();
