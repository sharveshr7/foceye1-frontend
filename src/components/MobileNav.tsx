import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Eye,
  Gamepad2,
  Sparkles,
  FileText,
  Target,
  Menu,
  X,
  Cpu,
  Settings,
  User,
  Bluetooth,
} from "lucide-react";
import { usePatient } from "@/contexts/PatientContext";

const mainNavItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home", path: "/dashboard" },
  { id: "patients", icon: Users, label: "Patients", path: "/patients" },
  { id: "vision-test", icon: Eye, label: "Test", path: "/vision-test" },
  { id: "therapy", icon: Gamepad2, label: "Therapy", path: "/therapy-session" },
  { id: "insights", icon: Sparkles, label: "AI", path: "/ai-insights" },
];

const drawerItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { id: "patients", icon: Users, label: "Patient Registry", path: "/patients" },
  { id: "vision-test", icon: Eye, label: "Precision Vision Test", path: "/vision-test" },
  { id: "therapy-mode", icon: Gamepad2, label: "Therapy Selection", path: "/mode-selection" },
  { id: "therapy", icon: Target, label: "Live Therapy Session", path: "/therapy-session" },
  { id: "calibration", icon: Target, label: "Camera Calibration", path: "/calibration" },
  { id: "insights", icon: Sparkles, label: "FOCEYE AI Diagnostics", path: "/ai-insights" },
  { id: "reports", icon: FileText, label: "Clinical Analytics", path: "/analytics" },
  { id: "device", icon: Cpu, label: "Smart Headset Link", path: "/device" },
  { id: "settings", icon: Settings, label: "Hospital Administration", path: "/settings" },
  { id: "profile", icon: User, label: "Doctor Profile", path: "/profile" },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPatient } = usePatient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
            <Eye size={18} />
          </div>
          <span className="font-extrabold text-lg text-foreground tracking-tight">FOCEYE</span>
        </div>

        <div className="flex items-center gap-2">
          {selectedPatient && (
            <span className="text-[11px] font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-full max-w-[120px] truncate">
              {selectedPatient.firstName} {selectedPatient.lastName ? selectedPatient.lastName[0] + "." : ""}
            </span>
          )}
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-xl bg-muted/60 text-foreground hover:bg-muted"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-bottom">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
                isActive ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-transform ${
                  isActive ? "bg-primary/15 text-primary scale-110" : ""
                }`}
              >
                <item.icon size={20} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Off-Canvas Slide Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-4/5 max-w-xs bg-card h-full shadow-2xl border-r border-border flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-foreground">FOCEYE Vision</h3>
                    <p className="text-[11px] text-muted-foreground">Mobile Clinical Suite</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {drawerItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.path)}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon size={18} className={isActive ? "text-primary" : ""} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Linked Device Status */}
              <div className="p-4 border-t border-border bg-muted/20">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Bluetooth size={14} className="text-primary" /> FOC-Tracker v2
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
