import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Sparkles,
  Smartphone,
  Languages,
  Clock,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import type { Patient } from "@/contexts/PatientContext";
import { therapyExercises, type TherapyExercise } from "@/lib/therapies";
import { SUPPORTED_LANGUAGES, type SupportedLanguage, voiceCoach } from "@/utils/voiceCoach";

interface HomeTherapyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  prescribedExercise?: TherapyExercise;
  durationMinutes?: number;
}

export const HomeTherapyModal: React.FC<HomeTherapyModalProps> = ({
  isOpen,
  onClose,
  patient,
  prescribedExercise,
  durationMinutes = 5,
}) => {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(() => voiceCoach.getLanguage());
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const activeExercise = useMemo(() => {
    if (prescribedExercise) return prescribedExercise;
    if (patient?.diagnosis?.toLowerCase().includes("convergence")) {
      return therapyExercises.find((t) => t.id === "convergence-pushup") || therapyExercises[0];
    }
    if (patient?.diagnosis?.toLowerCase().includes("amblyopia")) {
      return therapyExercises.find((t) => t.id === "target-tracking") || therapyExercises[0];
    }
    return therapyExercises[0];
  }, [prescribedExercise, patient]);

  // Construct magic home URL
  const homeTherapyUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const params = new URLSearchParams({
      patientId: patient?.id || "guest",
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Patient",
      exerciseId: activeExercise.id,
      duration: String(durationMinutes),
      lang: selectedLang,
    });
    return `${origin}/home-therapy?${params.toString()}`;
  }, [patient, activeExercise, durationMinutes, selectedLang]);

  // Generate QR code data URL
  useEffect(() => {
    if (!homeTherapyUrl) return;
    QRCode.toDataURL(homeTherapyUrl, {
      width: 340,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code Error:", err));
  }, [homeTherapyUrl]);

  const handleCopyLink = () => {
    if (!homeTherapyUrl) return;
    navigator.clipboard.writeText(homeTherapyUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    if (!homeTherapyUrl) return;
    const message = `Hello ${patient?.firstName || "Patient"}, here is your prescribed FOCEYE Home Vision Therapy link:\n\n📌 Exercise: ${activeExercise.title}\n⏱️ Daily Duration: ${durationMinutes} minutes\n🔗 Access Link: ${homeTherapyUrl}\n\nPlease open on your smartphone with good lighting and follow the voice instructions!`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md overflow-y-auto animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-xl bg-card border border-border/80 rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  Home Therapy Pass
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold uppercase tracking-wider">
                    Mobile Access
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Prescribe and dispatch remote visual rehabilitation to the patient's smartphone
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Prescribed Regimen Banner */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Smartphone size={22} />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned To
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    {patient ? `${patient.firstName} ${patient.lastName} (ID: ${patient.id})` : "Guest Patient"}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-foreground truncate">
                  {activeExercise.title}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock size={13} className="text-primary" /> {durationMinutes} min daily
                  </span>
                  <span>•</span>
                  <span className="text-teal-600 dark:text-teal-400 font-bold">
                    {activeExercise.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Language Selection */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Languages size={14} className="text-primary" /> Voice Coach Language for Home Session
              </label>
              <div className="grid grid-cols-5 gap-2">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 ${
                      selectedLang === lang.code
                        ? "bg-primary/15 border-primary text-primary shadow-sm ring-1 ring-primary/40 font-bold"
                        : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <span className="text-base">{lang.flag}</span>
                    <span className="text-[11px] font-bold leading-tight">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* QR Code & Scan Instructions */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-950 text-white border border-white/10 shadow-xl">
              <div className="bg-white p-3 rounded-2xl shrink-0 shadow-inner flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="Home Therapy QR Code"
                    className="w-40 h-40 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] font-bold">
                  <Sparkles size={13} />
                  <span>Zero-App Install Required</span>
                </div>
                <h4 className="text-base font-extrabold text-white">
                  Scan to Practice at Home
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Patient simply points their mobile phone camera at this QR code to open their personalized therapy session directly in their browser.
                </p>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-[11px] text-slate-400 font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-400" /> Secure Token
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HeartHandshake size={14} className="text-teal-400" /> Auto-Syncs to Hospital
                  </span>
                </div>
              </div>
            </div>

            {/* Share and Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs sm:text-sm text-foreground transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {isCopied ? (
                  <>
                    <Check size={16} className="text-emerald-500" /> Link Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy size={16} className="text-primary" /> Copy Patient Link
                  </>
                )}
              </button>

              <button
                onClick={handleWhatsAppShare}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs sm:text-sm text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
              >
                <Share2 size={16} /> Share via WhatsApp
              </button>
            </div>

            {/* Direct Open Testing Link */}
            <div className="text-center pt-1">
              <a
                href={homeTherapyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-semibold"
              >
                <span>Launch Home Therapy in new tab (Preview)</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
