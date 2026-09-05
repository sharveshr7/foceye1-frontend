import { useState } from "react";
import { Battery, Bell, Search, UserRound, ChevronDown, Check, Sparkles } from "lucide-react";
import { usePatient } from "@/contexts/PatientContext";
import { useNavigate } from "react-router-dom";

export function TopBar() {
  const { patients, selectedPatient, selectPatient } = usePatient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  const matchingPatients = searchQuery.trim()
    ? patients.filter((p) =>
        `${p.firstName} ${p.lastName} ${p.id} ${p.eyeCondition}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="flex justify-between items-center mb-8 gap-4 px-2 md:px-0 relative z-30">
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

        {/* Profile Avatar */}
        <div
          onClick={() => navigate("/profile")}
          className="w-10 h-10 bg-primary/10 rounded-2xl border border-border shadow-soft overflow-hidden cursor-pointer hover:scale-105 transition-transform shrink-0 flex items-center justify-center text-primary font-black"
          role="button"
          title="Clinician Profile"
        >
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Leo"
            alt="User Profile"
            className="w-full h-full"
          />
        </div>
      </div>
    </header>
  );
}
