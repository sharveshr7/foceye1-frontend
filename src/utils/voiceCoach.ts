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
  | "good_short"
  | "try_again"
  | "session_start"
  | "session_paused"
  | "session_resumed"
  | "session_complete"
  | "target_aligned"
  | "blinking_detected"
  | "look_further_right"
  | "look_further_left"
  | "look_higher"
  | "look_lower"
  | "look_straight_screen"
  | "position_face"
  | "move_brighter"
  | "level_up"
  | "level_relax"
  | "voms_pursuit"
  | "voms_saccade"
  | "voms_convergence"
  | "voms_vor"
  | "voms_vms";

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
    good_short: "Good.",
    try_again: "Please try again.",
    session_start: "Therapy session starting. Follow the moving target.",
    session_paused: "Session paused.",
    session_resumed: "Session resumed. Follow the target.",
    session_complete: "Session complete. Excellent work!",
    target_aligned: "Target aligned. Good, continue.",
    blinking_detected: "Blinking detected.",
    look_further_right: "Try looking a little further to the right.",
    look_further_left: "Try looking a little further to the left.",
    look_higher: "Try looking a little higher.",
    look_lower: "Try looking a little lower.",
    look_straight_screen: "Look straight at the screen. Keep your head still.",
    position_face: "Please position your face inside the frame.",
    move_brighter: "Please move to a brighter area.",
    level_up: "Target speed increasing. Keep up the good focus!",
    level_relax: "Pacing adjusted. Relax your eyes and follow the target.",
    voms_pursuit: "Follow the smooth moving target horizontally and vertically.",
    voms_saccade: "Quickly look back and forth between the targets.",
    voms_convergence: "Focus on the target as it approaches your nose.",
    voms_vor: "Keep your eyes locked on the target while gently turning your head.",
    voms_vms: "Follow the target with your eyes and head while the background moves.",
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
    good_short: "நன்று.",
    try_again: "மீண்டும் முயற்சிக்கவும்.",
    session_start: "சிகிச்சை தொடங்குகிறது. நகரும் இலக்கைப் பின்பற்றுங்கள்.",
    session_paused: "சிகிச்சை இடைநிறுத்தப்பட்டது.",
    session_resumed: "சிகிச்சை தொடர்கிறது. இலக்கைப் பாருங்கள்.",
    session_complete: "சிகிச்சை முடிந்தது. மிகச் சிறந்த முயற்சி!",
    target_aligned: "இலக்கு சரியானது. நன்று, தொடருங்கள்.",
    blinking_detected: "இமைப்பது கண்டறியப்பட்டது.",
    look_further_right: "இன்னும் கொஞ்சம் வலது பக்கம் பார்க்க முயற்சிக்கவும்.",
    look_further_left: "இன்னும் கொஞ்சம் இடது பக்கம் பார்க்க முயற்சிக்கவும்.",
    look_higher: "இன்னும் கொஞ்சம் மேலே பார்க்கவும்.",
    look_lower: "இன்னும் கொஞ்சம் கீழே பார்க்கவும்.",
    look_straight_screen: "திரையை நேராகப் பாருங்கள். தலையை அசைக்காதீர்கள்.",
    position_face: "உங்கள் முகத்தை சட்டத்திற்குள் வைக்கவும்.",
    move_brighter: "வெளிச்சமான இடத்திற்கு மாறவும்.",
    level_up: "இலக்கின் வேகம் அதிகரிக்கிறது. சிறப்பான கவனம்!",
    level_relax: "வேகம் சரிசெய்யப்பட்டது. கண்களைத் தளர்த்தி இலக்கைப் பின்பற்றுங்கள்.",
    voms_pursuit: "கிடைமட்டமாகவும் செங்குத்தாகவும் நகரும் இலக்கைப் பின்பற்றுங்கள்.",
    voms_saccade: "இலக்குகளுக்கு இடையே விரைவாக மாறி மாறிப் பாருங்கள்.",
    voms_convergence: "இலக்கு உங்கள் மூக்கை நோக்கி வரும்போது அதைக் கூர்ந்து கவனியுங்கள்.",
    voms_vor: "தலையை மெதுவாகத் திருப்பும்போது கண்களை இலக்கில் நிலையாக வையுங்கள்.",
    voms_vms: "பின்னணி நகரும் போது உங்கள் கண்கள் மற்றும் தலையால் இலக்கைப் பின்பற்றுங்கள்.",
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
    good_short: "നല്ലത്.",
    try_again: "ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    session_start: "തെറാപ്പി സെഷൻ ആരംഭിക്കുന്നു. ചലിക്കുന്ന ലക്ഷ്യത്തെ പിന്തുടരുക.",
    session_paused: "സെഷൻ താൽക്കാലികമായി നിർത്തി.",
    session_resumed: "സെഷൻ പുനരാരംഭിച്ചു. ലക്ഷ്യത്തെ പിന്തുടരുക.",
    session_complete: "സെഷൻ പൂർത്തിയായി. മികച്ച പ്രവർത്തനം!",
    target_aligned: "ലക്ഷ്യം ശരിയായി. വളരെ നല്ലത്, തുടരുക.",
    blinking_detected: "കണ്ണ് ചിമ്മുന്നത് കണ്ടെത്തി.",
    look_further_right: "കുറച്ചുകൂടി വലത്തോട്ട് നോക്കാൻ ശ്രമിക്കുക.",
    look_further_left: "കുറച്ചുകൂടി ഇടത്തോട്ട് നോക്കാൻ ശ്രമിക്കുക.",
    look_higher: "കുറച്ചുകൂടി മുകളിലേക്ക് നോക്കുക.",
    look_lower: "കുറച്ചുകൂടി താഴേക്ക് നോക്കുക.",
    look_straight_screen: "സ്ക്രീനിലേക്ക് നേരെ നോക്കുക. തല അനക്കരുത്.",
    position_face: "നിങ്ങളുടെ മുഖം ഫ്രെയിമിനുള്ളിൽ വയ്ക്കുക.",
    move_brighter: "കൂടുതൽ വെളിച്ചമുള്ള സ്ഥലത്തേക്ക് മാറുക.",
    level_up: "ലക്ഷ്യത്തിന്റെ വേഗത വർദ്ധിക്കുന്നു. മികച്ച ഏകാഗ്രത!",
    level_relax: "വേഗത ക്രമീകരിച്ചു. കണ്ണുകൾക്ക് അയവ് നൽകി ലക്ഷ്യം പിന്തുടരുക.",
    voms_pursuit: "തിരശ്ചീനമായും ലംബമായും ചലിക്കുന്ന ലക്ഷ്യത്തെ സുഗമമായി പിന്തുടരുക.",
    voms_saccade: "ലക്ഷ്യങ്ങൾക്കിടയിൽ വേഗത്തിൽ മാറിമാറി നോക്കുക.",
    voms_convergence: "ലക്ഷ്യം മൂക്കിനടുത്തേക്ക് വരുമ്പോൾ സൂക്ഷ്മമായി ശ്രദ്ധിക്കുക.",
    voms_vor: "തല പതുക്കെ തിരിക്കുമ്പോൾ കണ്ണുകൾ ലക്ഷ്യത്തിൽ ഉറപ്പിച്ചു നിർത്തുക.",
    voms_vms: "പശ്ചാത്തലം മാറുമ്പോൾ കണ്ണും തലയും ഒരുമിച്ച് ലക്ഷ്യത്തെ പിന്തുടരുക.",
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
    good_short: "బాగుంది.",
    try_again: "దయచేసి మళ్లీ ప్రయత్నించండి.",
    session_start: "థెరపీ సెషన్ ప్రారంభమవుతోంది. కదులుతున్న లక్ష్యాన్ని అనుసరించండి.",
    session_paused: "సెషన్ పాజ్ చేయబడింది.",
    session_resumed: "సెషన్ తిరిగి ప్రారంభమైంది. లక్ష్యాన్ని చూడండి.",
    session_complete: "సెషన్ పూర్తయింది. అద్భుతమైన పని!",
    target_aligned: "లక్ష్యం కుదిరింది. బాగుంది, కొనసాగించండి.",
    blinking_detected: "రెప్పపాటు గుర్తించబడింది.",
    look_further_right: "ఇంకొంచెం కుడివైపు చూడటానికి ప్రయత్నించండి.",
    look_further_left: "ఇంకొంచెం ఎడమవైపు చూడటానికి ప్రయత్నించండి.",
    look_higher: "ఇంకొంచెం పైకి చూడండి.",
    look_lower: "ఇంకొంచెం కిందికి చూడండి.",
    look_straight_screen: "స్క్రీన్ వైపు నేరుగా చూడండి. తల తిప్పకండి.",
    position_face: "దయచేసి మీ ముఖాన్ని ఫ్రేమ్‌లో ఉంచండి.",
    move_brighter: "దయచేసి మరింత వెలుతురు ఉన్న ప్రదేశానికి వెళ్ళండి.",
    level_up: "లక్ష్యం వేగం పెరుగుతోంది. అద్భుతమైన ఏకాగ్రత!",
    level_relax: "వేగం సర్దుబాటు చేయబడింది. కళ్ళను ప్రశాంతంగా ఉంచి లక్ష్యాన్ని అనుసరించండి.",
    voms_pursuit: "అడ్డంగా మరియు నిలువుగా కదులుతున్న లక్ష్యాన్ని సాఫీగా అనుసరించండి.",
    voms_saccade: "లక్ష్యాల మధ్య వేగంగా అటూ ఇటూ చూడండి.",
    voms_convergence: "లక్ష్యం మీ ముక్కు వద్దకు వస్తున్నప్పుడు దానిపై శ్రద్ధ పెట్టండి.",
    voms_vor: "తల నెమ్మదిగా తిప్పుతూ కళ్ళను లక్ష్యంపై స్థిరంగా ఉంచండి.",
    voms_vms: "నేపథ్యం కదులుతున్నప్పుడు మీ కళ్ళు మరియు తలతో లక్ష్యాన్ని అనుసరించండి.",
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
    good_short: "अच्छा।",
    try_again: "कृपया फिर से प्रयास करें।",
    session_start: "थेरेपी सत्र शुरू हो रहा है। चलते हुए लक्ष्य का पीछा करें।",
    session_paused: "सत्र रोक दिया गया है।",
    session_resumed: "सत्र फिर से शुरू हो गया। लक्ष्य को देखें।",
    session_complete: "सत्र पूरा हुआ। बहुत अच्छा प्रयास!",
    target_aligned: "लक्ष्य संरेखित है। बहुत बढ़िया, जारी रखें।",
    blinking_detected: "पलक झपकना पहचाना गया।",
    look_further_right: "थोड़ा और दाईं ओर देखने का प्रयास करें।",
    look_further_left: "थोड़ा और बाईं ओर देखने का प्रयास करें।",
    look_higher: "थोड़ा और ऊपर देखें।",
    look_lower: "थोड़ा और नीचे देखें।",
    look_straight_screen: "स्क्रीन पर सीधे देखें। सिर को स्थिर रखें।",
    position_face: "कृपया अपना चेहरा फ्रेम के अंदर रखें।",
    move_brighter: "कृपया अधिक रोशनी वाले स्थान पर जाएं।",
    level_up: "लक्ष्य की गति बढ़ाई जा रही है। बहुत अच्छा ध्यान!",
    level_relax: "गति धीमी की गई है। आँखों को तनावमुक्त रखें और लक्ष्य पर ध्यान दें।",
    voms_pursuit: "क्षैतिज और लंबवत गतिमान लक्ष्य का आसानी से पीछा करें।",
    voms_saccade: "लक्ष्यों के बीच तेज़ी से इधर-उधर देखें।",
    voms_convergence: "जैसे-जैसे लक्ष्य नाक के पास आए, उस पर ध्यान केंद्रित करें।",
    voms_vor: "सिर को धीरे-धीरे घुमाते हुए भी आँखें लक्ष्य पर केंद्रित रखें।",
    voms_vms: "बैकग्राउंड हिलने पर आँखों और सिर दोनों से लक्ष्य का पीछा करें।",
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
  private speechRate: number = 0.95;
  private speechVolume: number = 1.0;
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

      const storedRate = localStorage.getItem("foceye_voice_coach_rate");
      if (storedRate) this.speechRate = parseFloat(storedRate) || 0.95;

      const storedVolume = localStorage.getItem("foceye_voice_coach_volume");
      if (storedVolume) this.speechVolume = parseFloat(storedVolume) || 1.0;

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

    // Match voice specifically for current language code
    let matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(lang));

    // Fallback search by voice name keywords for Indian languages
    if (!matchedVoice) {
      const nameKeywords: Record<SupportedLanguage, string[]> = {
        ta: ["tamil", "valluvar", "tam", "ta-in", "ta_in"],
        ml: ["malayalam", "lekha", "mal", "ml-in", "ml_in"],
        te: ["telugu", "chitra", "tel", "te-in", "te_in"],
        hi: ["hindi", "kalpana", "hemant", "hin", "india", "hi-in", "hi_in"],
        en: ["natural", "google", "samantha", "daniel", "karen", "en-us", "en-gb"],
      };
      const keywords = nameKeywords[lang] || [];
      matchedVoice = voices.find((v) =>
        keywords.some((k) => v.name.toLowerCase().includes(k) || v.lang.toLowerCase().includes(k))
      );
    }

    // Only assign currentVoice if it truly matches the target language.
    // When null for non-English languages, mobile OS uses bcp47 language routing.
    if (matchedVoice) {
      this.currentVoice = matchedVoice;
    } else if (lang === "en") {
      this.currentVoice = voices.find((v) => v.lang.toLowerCase().startsWith("en")) || voices[0] || null;
    } else {
      this.currentVoice = null;
    }
  }

  /**
   * Unlocks Web Speech API audio context during user tap/click on iOS Safari & Android Chrome
   */
  public unlockAudio() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.resume();
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0.01;
      silent.rate = 10;
      window.speechSynthesis.speak(silent);
    } catch {
      // Ignore unlock exceptions
    }
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

  public setRate(rate: number) {
    this.speechRate = Math.max(0.5, Math.min(2.0, Math.round(rate * 100) / 100));
    if (typeof window !== "undefined") {
      localStorage.setItem("foceye_voice_coach_rate", String(this.speechRate));
    }
  }

  public getRate(): number {
    return this.speechRate;
  }

  public setVolume(volume: number) {
    this.speechVolume = Math.max(0.0, Math.min(1.0, Math.round(volume * 100) / 100));
    if (typeof window !== "undefined") {
      localStorage.setItem("foceye_voice_coach_volume", String(this.speechVolume));
    }
  }

  public getVolume(): number {
    return this.speechVolume;
  }

  public getPromptText(key: VoicePromptKey, lang?: SupportedLanguage): string {
    const activeLang = lang || this.currentLanguage;
    return VOICE_TRANSLATIONS[activeLang]?.[key] || VOICE_TRANSLATIONS.en[key];
  }

  public speakPrompt(key: VoicePromptKey, force: boolean = false) {
    const text = this.getPromptText(key);
    this.speak(text, force, key);
  }

  private activeUtterance: SpeechSynthesisUtterance | null = null;

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
      // Resume speech synthesis to counteract Android Chrome background pause
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel(); // Prevent queue buildup on mobile

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }

      const langMeta = this.getLanguageOption();
      utterance.lang = langMeta.bcp47;
      utterance.rate = this.speechRate; // User-controlled clinical pace
      utterance.pitch = 1.0;
      utterance.volume = this.speechVolume; // User-controlled volume

      // Keep active reference to avoid premature garbage collection on mobile Chrome
      this.activeUtterance = utterance;
      utterance.onend = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
      };
      utterance.onerror = () => {
        if (this.activeUtterance === utterance) {
          this.activeUtterance = null;
        }
      };

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

  public goodShort(force: boolean = false) {
    this.speakPrompt("good_short", force);
  }

  public lookFurtherRight(force: boolean = false) {
    this.speakPrompt("look_further_right", force);
  }

  public lookFurtherLeft(force: boolean = false) {
    this.speakPrompt("look_further_left", force);
  }

  public lookHigher(force: boolean = false) {
    this.speakPrompt("look_higher", force);
  }

  public lookLower(force: boolean = false) {
    this.speakPrompt("look_lower", force);
  }

  public lookStraightScreen(force: boolean = false) {
    this.speakPrompt("look_straight_screen", force);
  }

  public positionFace(force: boolean = false) {
    this.speakPrompt("position_face", force);
  }

  public moveBrighter(force: boolean = false) {
    this.speakPrompt("move_brighter", force);
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
