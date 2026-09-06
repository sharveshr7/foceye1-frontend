/**
 * FOCEYE Multilingual Clinical Voice Coach & Real-Time Biofeedback Engine
 * Provides synchronized voice instructions and directional gaze coaching
 * in English, Tamil, Malayalam, Telugu, and Hindi using the Web Speech API
 * and live camera telemetry comparison.
 */

export type SupportedLanguage = "en" | "ta" | "ml" | "te" | "hi";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧", bcp47: "en-US" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", bcp47: "ta-IN" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", bcp47: "ml-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", bcp47: "te-IN" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳", bcp47: "hi-IN" },
];

export type VoicePromptKey =
  | "look_right"
  | "look_left"
  | "look_up"
  | "look_down"
  | "look_straight"
  | "blink_eyes"
  | "follow_target"
  | "keep_head_still"
  | "good_continue"
  | "try_again"
  | "session_start"
  | "session_paused"
  | "session_resumed"
  | "session_complete"
  | "target_aligned"
  | "blinking_detected";

export const VOICE_TRANSLATIONS: Record<SupportedLanguage, Record<VoicePromptKey, string>> = {
  en: {
    look_right: "Look to the right.",
    look_left: "Look to the left.",
    look_up: "Look up.",
    look_down: "Look down.",
    look_straight: "Look straight ahead.",
    blink_eyes: "Blink your eyes.",
    follow_target: "Follow the moving target.",
    keep_head_still: "Keep your head still. Move only your eyes.",
    good_continue: "Good, continue.",
    try_again: "Please try again.",
    session_start: "Therapy session starting. Follow the moving target.",
    session_paused: "Session paused.",
    session_resumed: "Session resumed. Follow the target.",
    session_complete: "Session complete. Excellent work!",
    target_aligned: "Target aligned. Good, continue.",
    blinking_detected: "Blinking detected.",
  },
  ta: {
    look_right: "வலது பக்கம் பாருங்கள்.",
    look_left: "இடது பக்கம் பாருங்கள்.",
    look_up: "மேலே பாருங்கள்.",
    look_down: "கீழே பாருங்கள்.",
    look_straight: "நேராகப் பாருங்கள்.",
    blink_eyes: "கண்களை இமையுங்கள்.",
    follow_target: "நகரும் இலக்கைப் பின்பற்றுங்கள்.",
    keep_head_still: "தலையை அசைக்காதீர்கள். கண்களை மட்டும் நகர்த்துங்கள்.",
    good_continue: "நன்று, தொடருங்கள்.",
    try_again: "மீண்டும் முயற்சிக்கவும்.",
    session_start: "சிகிச்சை தொடங்குகிறது. நகரும் இலக்கைப் பின்பற்றுங்கள்.",
    session_paused: "சிகிச்சை இடைநிறுத்தப்பட்டது.",
    session_resumed: "சிகிச்சை தொடர்கிறது. இலக்கைப் பாருங்கள்.",
    session_complete: "சிகிச்சை முடிந்தது. மிகச் சிறந்த முயற்சி!",
    target_aligned: "இலக்கு சரியானது. நன்று, தொடருங்கள்.",
    blinking_detected: "இமைப்பது கண்டறியப்பட்டது.",
  },
  ml: {
    look_right: "വലത്തോട്ട് നോക്കുക.",
    look_left: "ഇടത്തോട്ട് നോക്കുക.",
    look_up: "മുകളിലേക്ക് നോക്കുക.",
    look_down: "താഴേക്ക് നോക്കുക.",
    look_straight: "നേരെ നോക്കുക.",
    blink_eyes: "കണ്ണുകൾ ചിമ്മുക.",
    follow_target: "ചലിക്കുന്ന ലക്ഷ്യത്തെ പിന്തുടരുക.",
    keep_head_still: "തല അനക്കരുത്. കണ്ണുകൾ മാത്രം ചലിപ്പിക്കുക.",
    good_continue: "വളരെ നല്ലത്, തുടരുക.",
    try_again: "ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    session_start: "തെറാപ്പി സെഷൻ ആരംഭിക്കുന്നു. ചലിക്കുന്ന ലക്ഷ്യത്തെ പിന്തുടരുക.",
    session_paused: "സെഷൻ താൽക്കാലികമായി നിർത്തി.",
    session_resumed: "സെഷൻ പുനരാരംഭിച്ചു. ലക്ഷ്യത്തെ പിന്തുടരുക.",
    session_complete: "സെഷൻ പൂർത്തിയായി. മികച്ച പ്രവർത്തനം!",
    target_aligned: "ലക്ഷ്യം ശരിയായി. വളരെ നല്ലത്, തുടരുക.",
    blinking_detected: "കണ്ണ് ചിമ്മുന്നത് കണ്ടെത്തി.",
  },
  te: {
    look_right: "కుడివైపు చూడండి.",
    look_left: "ఎడమవైపు చూడండి.",
    look_up: "పైకి చూడండి.",
    look_down: "కిందికి చూడండి.",
    look_straight: "నేరుగా చూడండి.",
    blink_eyes: "కళ్ళు మూసి తెరవండి.",
    follow_target: "కదులుతున్న లక్ష్యాన్ని అనుసరించండి.",
    keep_head_still: "తల తిప్పకండి. కళ్ళను మాత్రమే కదపండి.",
    good_continue: "బాగుంది, కొనసాగించండి.",
    try_again: "దయచేసి మళ్లీ ప్రయత్నించండి.",
    session_start: "థెరపీ సెషన్ ప్రారంభమవుతోంది. కదులుతున్న లక్ష్యాన్ని అనుసరించండి.",
    session_paused: "సెషన్ పాజ్ చేయబడింది.",
    session_resumed: "సెషన్ తిరిగి ప్రారంభమైంది. లక్ష్యాన్ని చూడండి.",
    session_complete: "సెషన్ పూర్తయింది. అద్భుతమైన పని!",
    target_aligned: "లక్ష్యం కుదిరింది. బాగుంది, కొనసాగించండి.",
    blinking_detected: "రెప్పపాటు గుర్తించబడింది.",
  },
  hi: {
    look_right: "दाईं ओर देखें।",
    look_left: "बाईं ओर देखें।",
    look_up: "ऊपर देखें।",
    look_down: "नीचे देखें।",
    look_straight: "सीधे देखें।",
    blink_eyes: "अपनी आँखें झपकाएं।",
    follow_target: "चलते हुए लक्ष्य का पीछा करें।",
    keep_head_still: "सिर को स्थिर रखें। केवल अपनी आँखें हिलाएं।",
    good_continue: "बहुत बढ़िया, जारी रखें।",
    try_again: "कृपया फिर से प्रयास करें।",
    session_start: "थेरेपी सत्र शुरू हो रहा है। चलते हुए लक्ष्य का पीछा करें।",
    session_paused: "सत्र रोक दिया गया है।",
    session_resumed: "सत्र फिर से शुरू हो गया। लक्ष्य को देखें।",
    session_complete: "सत्र पूरा हुआ। बहुत अच्छा प्रयास!",
    target_aligned: "लक्ष्य संरेखित है। बहुत बढ़िया, जारी रखें।",
    blinking_detected: "पलक झपकना पहचाना गया।",
  },
};

export interface GazeEvaluation {
  instruction: string;
  promptKey: VoicePromptKey;
  status: "aligned" | "tracking" | "correcting" | "off-target";
  accuracyPct: number;
  dx: number;
  dy: number;
  language: SupportedLanguage;
}

class VoiceCoachService {
  private isMuted: boolean = false;
  private currentLanguage: SupportedLanguage = "en";
  private lastSpokenTime: number = 0;
  private lastSpokenPromptKey: VoicePromptKey | null = null;
  private minIntervalMs: number = 3000; // Minimum 3.0s between automated voice cues
  private currentVoice: SpeechSynthesisVoice | null = null;
  private goodStreakCount: number = 0;
  private offStreakCount: number = 0;

  constructor() {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("foceye_voice_coach_muted");
      this.isMuted = storedMute === "true";

      const storedLang = localStorage.getItem("foceye_therapy_language") as SupportedLanguage;
      if (storedLang && ["en", "ta", "ml", "te", "hi"].includes(storedLang)) {
        this.currentLanguage = storedLang;
      }

      this.initVoice();
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    this.currentLanguage = lang;
    if (typeof window !== "undefined") {
      localStorage.setItem("foceye_therapy_language", lang);
    }
    this.initVoice();
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  public getLanguageOption(): LanguageOption {
    return (
      SUPPORTED_LANGUAGES.find((l) => l.code === this.currentLanguage) ||
      SUPPORTED_LANGUAGES[0]
    );
  }

  public getSupportedLanguages(): LanguageOption[] {
    return SUPPORTED_LANGUAGES;
  }

  public getInstructionText(key: string, lang?: SupportedLanguage): string {
    const snakeKey = key
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase() as VoicePromptKey;
    return this.getPromptText(snakeKey, lang);
  }

  private initVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const voices = window.speechSynthesis.getVoices();
    const lang = this.currentLanguage;

    // Search for voice matching language code (e.g., 'ta', 'ml', 'te', 'hi', 'en')
    let matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));

    // Fallback search by voice name keyword
    if (!matchedVoice) {
      const nameKeywords: Record<SupportedLanguage, string[]> = {
        ta: ["tamil", "valluvar", "tam"],
        ml: ["malayalam", "lekha", "mal"],
        te: ["telugu", "chitra", "tel"],
        hi: ["hindi", "kalpana", "hemant", "hin", "india"],
        en: ["natural", "google", "samantha", "daniel", "karen"],
      };
      const keywords = nameKeywords[lang] || [];
      matchedVoice = voices.find((v) =>
        keywords.some((k) => v.name.toLowerCase().includes(k))
      );
    }

    // Default fallback to English voice or first available
    this.currentVoice =
      matchedVoice ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0] ||
      null;
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

  public getPromptText(key: VoicePromptKey, lang?: SupportedLanguage): string {
    const activeLang = lang || this.currentLanguage;
    return VOICE_TRANSLATIONS[activeLang]?.[key] || VOICE_TRANSLATIONS.en[key];
  }

  public speakPrompt(key: VoicePromptKey, force: boolean = false) {
    const text = this.getPromptText(key);
    this.speak(text, force, key);
  }

  public speak(text: string, force: boolean = false, key?: VoicePromptKey) {
    if (this.isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    const now = Date.now();
    // Prevent repeating the identical phrase too rapidly unless forced
    if (!force && key && key === this.lastSpokenPromptKey && now - this.lastSpokenTime < 5000) {
      return;
    }

    if (!force && now - this.lastSpokenTime < this.minIntervalMs) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Prevent queue buildup
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.currentVoice) utterance.voice = this.currentVoice;

      const langMeta = this.getLanguageOption();
      utterance.lang = langMeta.bcp47;
      utterance.rate = 0.95; // Clear clinical pace
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      this.lastSpokenTime = now;
      if (key) this.lastSpokenPromptKey = key;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("[VoiceCoach] Speech synthesis error:", e);
    }
  }

  // Pre-defined Clinical Prompts
  public lookRight() {
    this.speakPrompt("look_right");
  }

  public lookLeft() {
    this.speakPrompt("look_left");
  }

  public lookUp() {
    this.speakPrompt("look_up");
  }

  public lookDown() {
    this.speakPrompt("look_down");
  }

  public lookCenter() {
    this.speakPrompt("look_straight");
  }

  public blinkEyes() {
    this.speakPrompt("blink_eyes");
  }

  public followTarget() {
    this.speakPrompt("follow_target");
  }

  public keepHeadStill() {
    this.speakPrompt("keep_head_still");
  }

  public goodContinue() {
    this.speakPrompt("good_continue");
  }

  public tryAgain() {
    this.speakPrompt("try_again");
  }

  public sessionStart() {
    this.speakPrompt("session_start", true);
  }

  public sessionPaused() {
    this.speakPrompt("session_paused", true);
  }

  public sessionResumed() {
    this.speakPrompt("session_resumed", true);
  }

  public sessionComplete() {
    this.speakPrompt("session_complete", true);
  }

  /**
   * Evaluates camera gaze coordinate vs target position and delivers
   * synchronized, natural voice instructions in the active language.
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
        instruction: this.getPromptText("keep_head_still"),
        promptKey: "keep_head_still",
        status: "off-target",
        accuracyPct: rawAccuracy,
        dx,
        dy,
        language: this.currentLanguage,
      };
    }

    if (isBlinking) {
      return {
        instruction: this.getPromptText("blinking_detected"),
        promptKey: "blinking_detected",
        status: "tracking",
        accuracyPct: rawAccuracy,
        dx,
        dy,
        language: this.currentLanguage,
      };
    }

    // Tolerance threshold (Normalized space)
    const ON_TARGET_RADIUS = 0.16;

    if (distance <= ON_TARGET_RADIUS) {
      this.goodStreakCount++;
      this.offStreakCount = 0;

      if (this.goodStreakCount === 4) {
        this.goodContinue();
        this.goodStreakCount = 0;
      }

      return {
        instruction: this.getPromptText("target_aligned"),
        promptKey: "target_aligned",
        status: "aligned",
        accuracyPct: Math.max(88, rawAccuracy),
        dx,
        dy,
        language: this.currentLanguage,
      };
    }

    // User is lagging or looking away from target
    this.goodStreakCount = 0;
    this.offStreakCount++;

    let promptKey: VoicePromptKey = "follow_target";

    // Directional guidance based on where target is relative to current gaze
    if (targetX - gazeX > 0.18) {
      promptKey = "look_right";
      if (this.offStreakCount >= 2) this.lookRight();
    } else if (gazeX - targetX > 0.18) {
      promptKey = "look_left";
      if (this.offStreakCount >= 2) this.lookLeft();
    } else if (gazeY - targetY > 0.18) {
      promptKey = "look_up";
      if (this.offStreakCount >= 2) this.lookUp();
    } else if (targetY - gazeY > 0.18) {
      promptKey = "look_down";
      if (this.offStreakCount >= 2) this.lookDown();
    } else if (Math.abs(targetX - 0.5) < 0.15 && Math.abs(targetY - 0.5) < 0.15) {
      promptKey = "look_straight";
      if (this.offStreakCount >= 2) this.lookCenter();
    } else {
      promptKey = "follow_target";
      if (this.offStreakCount >= 2) this.followTarget();
    }

    if (this.offStreakCount >= 2) {
      this.offStreakCount = 0;
    }

    return {
      instruction: this.getPromptText(promptKey),
      promptKey,
      status: "correcting",
      accuracyPct: rawAccuracy,
      dx,
      dy,
      language: this.currentLanguage,
    };
  }
}

export const voiceCoach = new VoiceCoachService();
