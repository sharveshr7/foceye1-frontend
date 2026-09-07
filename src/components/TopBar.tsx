import { useState } from "react";
import { Battery, Bell, Search, UserRound, ChevronDown, Check, Sparkles, LogOut, Settings, User, Eye, Play, FileText } from "lucide-react";
import { usePatient } from "@/contexts/PatientContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function TopBar() {
  const { patients, selectedPatient, selectPatient } = usePatient();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    toast.success("Signed out of clinical station.");
    navigate("/login");
  };

  const matchingPatients = searchQuery.trim()
    ? patients.filter((p) =>
        `${p.firstName} ${p.lastName} ${p.id} ${p.eyeCondition}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="flex flex-col mb-8 gap-3 px-2 md:px-0 relative z-30">
      <div className="flex justify-between items-center w-full gap-4">
        {/* Search Input with Instant Dropdown */}
      <div className="flex-1 max-w-md hidden lg:block relative">
        <div className="relative group">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            placeholder="Search patients, conditions, IDs..."
            className="w-full pl-10 pr-4 py-2.5 bg-card/60 backdrop-blur-md border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
            aria-label="Search"
          />
        </div>

        {/* Live Search Results Popover */}
        {isSearchFocused && matchingPatients.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 divide-y divide-border">
            {matchingPatients.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  selectPatient(p);
                  setSearchQuery("");
                  navigate("/patients");
                }}
                className="w-full p-3 text-left hover:bg-primary/5 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {p.firstName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.id} · {p.eyeCondition}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Select
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Action Icons & Active Patient Switcher */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto">
        {/* Quick Patient Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsPatientDropdownOpen(!isPatientDropdownOpen)}
            className="flex items-center gap-2.5 bg-card/60 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-border hover:border-primary/40 transition-all text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              <UserRound size={14} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Active Room
              </p>
              <p className="text-xs font-bold text-foreground truncate max-w-[130px] mt-0.5">
                {selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : "No Patient"}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>

          {/* Dropdown Menu */}
          {isPatientDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-2 py-1.5 border-b border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Switch Active Patient ({patients.length})
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-0.5">
                {patients.map((p) => {
                  const isCurrent = selectedPatient?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectPatient(p);
                        setIsPatientDropdownOpen(false);
                      }}
                      className={`w-full p-2 rounded-xl text-left text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? "bg-primary/10 text-primary font-bold"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <div className="truncate">
                        <p className="font-semibold">{p.firstName} {p.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">{p.eyeCondition}</p>
                      </div>
                      {isCurrent && <Check size={14} className="text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Device Status Pill */}
        <div className="flex items-center gap-2 bg-card/60 backdrop-blur-md px-3 py-2 rounded-2xl border border-border">
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none">Pi Tracker</p>
            <p className="text-xs font-bold text-emerald-500 mt-0.5">60 FPS Ready</p>
          </div>
          <div className="w-7 h-7 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Battery size={15} />
          </div>
        </div>

        {/* Clinician Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer"
            aria-label="Clinician Account Menu"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-2xl border border-border shadow-soft overflow-hidden shrink-0 flex items-center justify-center text-primary font-black text-sm">
              {user?.full_name ? user.full_name[0].toUpperCase() : "Dr"}
            </div>
            <div className="hidden xl:block text-left">
              <p className="text-xs font-bold text-foreground leading-tight truncate max-w-[120px]">
                {user?.full_name || "Dr. Sarah Smith"}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
                {user?.hospital_name || "FOCEYE Clinic"}
              </p>
            </div>
            <ChevronDown size={13} className="text-muted-foreground hidden sm:block" />
          </button>

          {/* Clinician Popover Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-2xl p-2 z-50 space-y-1">
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-bold text-foreground truncate">
                  {user?.full_name || "Clinical Specialist"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email || "clinician@foceye.clinic"}</p>
                <span className="inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase font-mono">
                  {user?.role || "Clinician"} · Verified
                </span>
              </div>

              <div className="pt-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted rounded-xl flex items-center gap-2 text-foreground transition-colors cursor-pointer"
                >
                  <User size={14} className="text-muted-foreground" />
                  Clinician Profile
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-muted rounded-xl flex items-center gap-2 text-foreground transition-colors cursor-pointer"
                >
                  <Settings size={14} className="text-muted-foreground" />
                  Hospital Settings
                </button>

                <div className="border-t border-border/60 my-1" />

                <button
                  onClick={handleSignOut}
                  className="w-full px-3 py-2 text-left text-xs font-bold hover:bg-destructive/10 text-destructive rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Row 2: Global Sticky Clinical Progression Breadcrumb Ribbon */}
      {selectedPatient && (() => {
        const cs = selectedPatient.clinicalStatus || "EYE_TEST_PENDING";
        const isEyeTestDone = ["EYE_TEST_COMPLETED", "THERAPY_RECOMMENDED", "THERAPY_IN_PROGRESS", "THERAPY_COMPLETED"].includes(cs);
        const isAiDone = ["THERAPY_RECOMMENDED", "THERAPY_IN_PROGRESS", "THERAPY_COMPLETED"].includes(cs);
        const isTherapyDone = cs === "THERAPY_COMPLETED";

        return (
          <div className="w-full px-4 py-2 bg-card/85 backdrop-blur-xl border border-primary/25 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground hidden sm:inline">Active Patient Flow:</span>
              <span className="text-xs font-bold text-foreground truncate max-w-[160px] sm:max-w-[220px]">
                {selectedPatient.firstName} {selectedPatient.lastName} <span className="text-primary font-mono text-[11px]">({selectedPatient.id})</span>
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] overflow-x-auto scrollbar-hide">
              <button
                onClick={() => navigate("/patients")}
                className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-bold flex items-center gap-1 hover:bg-primary/20 transition-all cursor-pointer"
                title="Patient Intake & Demographics"
              >
                <Check size={12} /> 1. Intake
              </button>

              <span className="text-muted-foreground/50 text-[10px]">→</span>

              <button
                onClick={() => navigate("/vision-test")}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isEyeTestDone
                    ? "bg-primary/10 text-primary"
                    : cs === "EYE_TEST_PENDING"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
                title="Standard 7-Step or VOMS Eye Test"
              >
                {isEyeTestDone ? <Check size={12} /> : <Eye size={12} />} 2. Eye Test
              </button>

              <span className="text-muted-foreground/50 text-[10px]">→</span>

              <button
                onClick={() => isEyeTestDone && navigate("/ai-insights")}
                disabled={!isEyeTestDone}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  !isEyeTestDone
                    ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                    : isAiDone
                    ? "bg-primary/10 text-primary cursor-pointer"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 animate-pulse cursor-pointer shadow-xs"
                }`}
                title="Gemini Neuro-Visual Diagnosis"
              >
                {isAiDone ? <Check size={12} /> : <Sparkles size={12} />} 3. AI Insights
              </button>

              <span className="text-muted-foreground/50 text-[10px]">→</span>

              <button
                onClick={() => isAiDone && navigate("/mode-selection")}
                disabled={!isAiDone}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  !isAiDone
                    ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                    : isTherapyDone
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    : "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 animate-pulse cursor-pointer shadow-xs"
                }`}
                title="Multi-Language Voice Therapy"
              >
                {isTherapyDone ? <Check size={12} /> : <Play size={12} fill="currentColor" />} 4. Therapy
              </button>

              <span className="text-muted-foreground/50 text-[10px]">→</span>

              <button
                onClick={() => navigate(`/profile?patientId=${selectedPatient.id}`)}
                className="px-2.5 py-1 rounded-lg bg-card border border-border text-foreground hover:border-primary/40 font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Clinical Dossier & PDF Report"
              >
                <FileText size={12} /> 5. Report
              </button>
            </div>
          </div>
        );
      })()}
    </header>
  );
}
