import React from "react";
import { AlertCircle, ShieldAlert, FileText, Info } from "lucide-react";

interface ClinicalDisclaimerBannerProps {
  variant?: "banner" | "compact" | "printable" | "footer";
  className?: string;
  showIcon?: boolean;
}

/**
 * Reusable Clinical Decision Support System (CDSS) Regulatory & Medical Disclaimer Banner.
 * Compliant with FDA/CE SaMD assistive decision support guidelines.
 */
export const ClinicalDisclaimerBanner: React.FC<ClinicalDisclaimerBannerProps> = ({
  variant = "banner",
  className = "",
  showIcon = true,
}) => {
  if (variant === "compact") {
    return (
      <div
        className={`flex items-center gap-2 p-2.5 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 ${className}`}
      >
        {showIcon && <AlertCircle size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />}
        <p className="leading-tight">
          <span className="font-bold">Assistive CDSS Notice:</span> AI diagnostic recommendations and therapy calibrations are assistive tools requiring licensed clinician evaluation and authorization prior to treatment.
        </p>
      </div>
    );
  }

  if (variant === "printable" || variant === "footer") {
    return (
      <div
        className={`pt-4 border-t border-border/80 text-[10px] text-muted-foreground leading-relaxed print:text-black print:border-gray-400 print:block ${className}`}
      >
        <div className="flex items-start gap-2">
          {showIcon && <FileText size={12} className="shrink-0 text-muted-foreground mt-0.5 print:hidden" />}
          <div>
            <span className="font-bold uppercase tracking-wider text-foreground print:text-black">
              Mandatory Clinical Regulatory Disclaimer:
            </span>{" "}
            FOCEYE Vision Therapy Hospital Platform & Dr. Iris AI Diagnostic Engine are Class I/SaMD Assistive Clinical Decision Support Software. Biometric ocular dispersion (BCEA), smooth pursuit gain calculations, and suggested visual exercises do not replace comprehensive physical slit-lamp or fundoscopic ophthalmic examinations. Final clinical diagnosis and treatment plans remain the sole legal responsibility of the supervising licensed ophthalmologist or optometrist.
          </div>
        </div>
      </div>
    );
  }

  // Default Banner Variant
  return (
    <div
      className={`relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        {showIcon && (
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
            <ShieldAlert size={18} />
          </div>
        )}
        <div className="space-y-1">
          <h5 className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            Clinical Decision Support System (CDSS) Notice
          </h5>
          <p className="leading-relaxed text-[11px] text-amber-900/90 dark:text-amber-200/90">
            FOCEYE AI algorithms and automated therapy prescriptions are designed exclusively as assistive decision-support tools for certified eye care clinicians. These outputs do not constitute a standalone medical diagnosis. All treatment parameters must be reviewed and authorized by a licensed healthcare professional.
          </p>
        </div>
      </div>
    </div>
  );
};
