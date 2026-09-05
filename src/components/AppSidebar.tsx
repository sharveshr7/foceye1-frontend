import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Eye,
  Gamepad2,
  Target,
  BarChart3,
  Brain,
  Cpu,
  Settings,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  Activity,
} from "lucide-react";

interface MenuItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badge?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Clinical Practice",
    items: [
      { id: "dashboard", icon: LayoutDashboard, label: "Workstation Dashboard", path: "/dashboard" },
      { id: "patients", icon: Users, label: "Patient Directory", path: "/patients" },
      { id: "vision-test", icon: Eye, label: "Clinical Vision Test", path: "/vision-test", badge: "Live" },
      { id: "therapy", icon: Gamepad2, label: "Therapy Sessions", path: "/mode-selection" },
      { id: "calibration", icon: Target, label: "Hardware Calibration", path: "/calibration" },
    ],
  },
  {
    title: "Diagnostics & AI",
    items: [
      { id: "reports", icon: BarChart3, label: "Clinical Analytics", path: "/analytics" },
      { id: "insights", icon: Brain, label: "AI Diagnostic Engine", path: "/ai-insights", badge: "AI" },
      { id: "device", icon: Cpu, label: "Pi-Tracker Hardware", path: "/device" },
    ],
  },
  {
    title: "Administration",
    items: [
      { id: "settings", icon: Settings, label: "Clinic Configuration", path: "/settings" },
      { id: "profile", icon: UserCheck, label: "Clinician Profile", path: "/profile" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`h-screen bg-card border-r border-slate-200/90 dark:border-slate-800 flex flex-col fixed left-0 top-0 z-30 transition-all duration-300 select-none shadow-xs ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Clinic Header Branding */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md shadow-primary/20 shrink-0 font-extrabold">
          <Eye className="w-5 h-5" />
        </div>
        {!collapsed && (
          <div className="truncate">
            <span className="text-lg font-black tracking-tight text-foreground block">
              FOCEYE <span className="text-primary font-normal text-xs uppercase tracking-widest block font-sans">Vision Health</span>
            </span>
          </div>
        )}
      </div>

      {/* Structured Clinical Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Clinical Navigation">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 font-sans">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5 pt-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    aria-current={isActive ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group relative ${
                      isActive
                        ? "bg-primary/10 text-primary font-bold shadow-xs border border-primary/20"
                        : "text-muted-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-foreground font-medium"
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}
                    />
                    {!collapsed && (
                      <span className="text-xs truncate font-sans tracking-normal flex-1">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase font-mono ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Clinical Station Status Pill */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div
          className={`bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 ${
            collapsed ? "text-center px-1" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            {!collapsed && (
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-500" /> Station 01
              </span>
            )}
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mx-auto sm:mx-0" />
          </div>
          {!collapsed && (
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
              Local Clinical Station
            </p>
          )}
        </div>
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        className="absolute -right-3 top-6 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground shadow-sm transition-transform hover:scale-110 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </aside>
  );
}
