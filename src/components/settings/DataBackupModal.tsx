import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Upload,
  Database,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw,
  HardDrive,
} from "lucide-react";
import { patientService } from "@/services/patient.service";
import { staffService } from "@/services/staff.service";
import { therapyService } from "@/services/therapy.service";
import { calibrationService } from "@/services/calibration.service";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  onDataRestored,
}) => {
  const [importing, setImporting] = useState(false);
  const [backupStats, setBackupStats] = useState<{
    patientsCount: number;
    staffCount: number;
    sessionsCount: number;
  }>({
    patientsCount: 0,
    staffCount: 0,
    sessionsCount: 0,
  });

  React.useEffect(() => {
    if (isOpen) {
      Promise.all([
        patientService.list(),
        staffService.list(),
        therapyService.getHistory(),
      ]).then(([patients, staff, sessions]) => {
        setBackupStats({
          patientsCount: patients.length,
          staffCount: staff.length,
          sessionsCount: sessions.length,
        });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExportBackup = async () => {
    try {
      const [patients, staff, sessions, calibrations] = await Promise.all([
        patientService.list(),
        staffService.list(),
        therapyService.getHistory(),
        calibrationService.getHistory(),
      ]);

      const hospitalId = authService.getCurrentHospitalId();
      const hospitalName = authService.getCurrentHospitalName();

      const backupPayload = {
        meta: {
          app: "FOCEYE Vision Platform",
          version: "2.0.0",
          exportDate: new Date().toISOString(),
          hospitalId,
          hospitalName,
        },
        data: {
          patients,
          staff,
          therapySessions: sessions,
          calibrationRecords: calibrations,
        },
      };

      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FOCEYE_Backup_${hospitalId}_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Database snapshot downloaded successfully!");
    } catch (err: unknown) {
      toast.error("Failed to generate backup export.");
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.data || (!parsed.data.patients && !parsed.data.staff)) {
          throw new Error("Invalid FOCEYE backup file format.");
        }

        if (Array.isArray(parsed.data.patients)) {
          patientService.setLocalPatients(parsed.data.patients);
        }
        if (Array.isArray(parsed.data.staff)) {
          staffService.setLocalStaff(parsed.data.staff);
        }
        if (Array.isArray(parsed.data.therapySessions)) {
          localStorage.setItem("foceye_therapy_sessions", JSON.stringify(parsed.data.therapySessions));
        }
        if (Array.isArray(parsed.data.calibrationRecords)) {
          localStorage.setItem("foceye_calibration_history", JSON.stringify(parsed.data.calibrationRecords));
        }

        toast.success("Data backup restored successfully! Reloading view...");
        onDataRestored?.();
        setTimeout(() => {
          onClose();
        }, 800);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to parse backup JSON file.");
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card w-full max-w-lg rounded-3xl border border-border shadow-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Database size={20} />
              </div>
              <div>
                <h3 className="font-extrabold text-foreground text-lg">Hospital Data Management</h3>
                <p className="text-xs text-muted-foreground">Export, backup, or restore client records</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Current Local Database Summary */}
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <HardDrive size={14} className="text-primary" /> Active Local Database Statistics
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-muted-foreground text-[10px] block">Patients</span>
                <span className="text-base font-extrabold text-foreground">{backupStats.patientsCount}</span>
              </div>
              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-muted-foreground text-[10px] block">Staff</span>
                <span className="text-base font-extrabold text-foreground">{backupStats.staffCount}</span>
              </div>
              <div className="p-3 bg-card rounded-xl border border-border">
                <span className="text-muted-foreground text-[10px] block">Sessions</span>
                <span className="text-base font-extrabold text-foreground">{backupStats.sessionsCount}</span>
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="space-y-3">
            {/* Export */}
            <div className="p-4 rounded-2xl border border-border bg-card/60 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Download size={16} className="text-primary" /> Export Full Backup
                </h4>
                <p className="text-xs text-muted-foreground">Download all patients, sessions, and clinical records as JSON.</p>
              </div>
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 shrink-0"
              >
                Download JSON
              </button>
            </div>

            {/* Import */}
            <div className="p-4 rounded-2xl border border-dashed border-border hover:border-primary/40 transition-colors bg-muted/10 space-y-3">
              <div className="space-y-0.5">
                <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Upload size={16} className="text-primary" /> Restore from JSON Backup
                </h4>
                <p className="text-xs text-muted-foreground">Select a previously exported `.json` file to restore hospital records.</p>
              </div>

              <label className="flex items-center justify-center gap-2 p-3 bg-muted hover:bg-muted/80 rounded-xl cursor-pointer text-xs font-bold text-foreground border border-border transition-colors">
                {importing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin text-primary" />
                    <span>Restoring data...</span>
                  </>
                ) : (
                  <>
                    <FileJson size={16} className="text-primary" />
                    <span>Choose JSON Backup File</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileImport}
                  className="hidden"
                  disabled={importing}
                />
              </label>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
