import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  Phone,
  FileText,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hospitalName: "",
    administratorName: "",
    officialHospitalEmail: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    hospitalRegistrationNumber: "",
    hospitalType: "Eye Care Center",
    city: "",
    state: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    const pwd = form.password;
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  }, [form.password]);

  // Form validation checks
  const validationErrors = useMemo(() => {
    const errs: Record<string, string> = {};

    if (!form.hospitalName.trim()) {
      errs.hospitalName = "Hospital or clinic name is required.";
    } else if (form.hospitalName.trim().length < 3) {
      errs.hospitalName = "Name must be at least 3 characters.";
    }

    if (!form.administratorName.trim()) {
      errs.administratorName = "Administrator full name is required.";
    } else if (form.administratorName.trim().length < 3) {
      errs.administratorName = "Administrator name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.officialHospitalEmail.trim()) {
      errs.officialHospitalEmail = "Official hospital email is required.";
    } else if (!emailRegex.test(form.officialHospitalEmail.trim())) {
      errs.officialHospitalEmail = "Please provide a valid official email address.";
    }

    const phoneDigits = form.mobileNumber.replace(/\D/g, "");
    if (!form.mobileNumber.trim()) {
      errs.mobileNumber = "Contact phone number is required.";
    } else if (phoneDigits.length < 8) {
      errs.mobileNumber = "Please provide a valid contact number (minimum 8 digits).";
    }

    if (!form.password) {
      errs.password = "Password is required.";
    } else if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters long.";
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  }, [form]);

  const isFormValid = Object.keys(validationErrors).length === 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all required fields as touched
    setTouched({
      hospitalName: true,
      administratorName: true,
      officialHospitalEmail: true,
      mobileNumber: true,
      password: true,
      confirmPassword: true,
    });

    if (!isFormValid) {
      const firstError = Object.values(validationErrors)[0];
      setError(firstError);
      toast.error(firstError);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await authService.signup({
        email: form.officialHospitalEmail.trim(),
        password: form.password,
        full_name: form.administratorName.trim(),
        hospital_name: form.hospitalName.trim(),
        hospital_registration_number: form.hospitalRegistrationNumber.trim() || undefined,
        hospital_type: form.hospitalType || undefined,
        mobile_number: form.mobileNumber.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
      });

      toast.success("Hospital account registered successfully! Redirecting to dashboard...");
      navigate("/dashboard");
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Unable to complete hospital registration.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setSubmitting(true);
    try {
      await authService.signInWithGoogle();
      toast.success("Authenticated with Google! Redirecting...");
      navigate("/dashboard");
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : "Unable to register with Google.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10 font-outfit relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-2xl relative z-10 space-y-6"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-wide uppercase shadow-sm">
            <Activity size={14} className="animate-pulse" />
            FOCEYE Clinical Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Hospital & Clinic Onboarding
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Register your healthcare facility to manage patient records, deploy smart hardware telemetry, and run AI vision therapy regimens.
          </p>
        </div>

        {/* Main Form Container */}
        <div className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 text-destructive text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs uppercase tracking-wider">Registration Error</p>
                <p className="leading-relaxed">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Section 1: Facility Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <Building2 size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  1. Healthcare Facility Details
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Hospital / Clinic Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="hospitalName"
                      value={form.hospitalName}
                      onChange={(e) => setForm({ ...form, hospitalName: e.target.value })}
                      onBlur={() => handleBlur("hospitalName")}
                      placeholder="e.g. Apollo Eye Institute"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        touched.hospitalName && validationErrors.hospitalName
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {touched.hospitalName && validationErrors.hospitalName && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.hospitalName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Facility Type</label>
                  <div className="relative">
                    <select
                      name="hospitalType"
                      value={form.hospitalType}
                      onChange={(e) => setForm({ ...form, hospitalType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-muted/60 rounded-xl border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="Eye Care Center">Eye Care Center / Orthoptic Clinic</option>
                      <option value="Hospital">Multispeciality Hospital</option>
                      <option value="Clinic">Private Practice / Optometry Clinic</option>
                      <option value="Research Institute">Research & Pediatric Institute</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">Registration ID (Optional)</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="hospitalRegistrationNumber"
                      value={form.hospitalRegistrationNumber}
                      onChange={(e) => setForm({ ...form, hospitalRegistrationNumber: e.target.value })}
                      placeholder="e.g. REG-8849"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">City</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="city"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="e.g. Mumbai"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">State / Region</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="e.g. Maharashtra"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Administrator & Login Credentials */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-border/60">
                <UserIcon size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Administrator & Clinician Account
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Administrator Full Name <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="administratorName"
                      value={form.administratorName}
                      onChange={(e) => setForm({ ...form, administratorName: e.target.value })}
                      onBlur={() => handleBlur("administratorName")}
                      placeholder="e.g. Dr. Rachel Evans, MD"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        touched.administratorName && validationErrors.administratorName
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {touched.administratorName && validationErrors.administratorName && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.administratorName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Contact Phone Number <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={form.mobileNumber}
                      onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                      onBlur={() => handleBlur("mobileNumber")}
                      placeholder="e.g. +1 555 0199"
                      className={`w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        touched.mobileNumber && validationErrors.mobileNumber
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                  </div>
                  {touched.mobileNumber && validationErrors.mobileNumber && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.mobileNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Official Hospital Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    name="officialHospitalEmail"
                    value={form.officialHospitalEmail}
                    onChange={(e) => setForm({ ...form, officialHospitalEmail: e.target.value })}
                    onBlur={() => handleBlur("officialHospitalEmail")}
                    placeholder="doctor@hospital.org"
                    className={`w-full pl-10 pr-3.5 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                      touched.officialHospitalEmail && validationErrors.officialHospitalEmail
                        ? "border-destructive focus:border-destructive"
                        : "border-border focus:border-primary"
                    }`}
                  />
                </div>
                {touched.officialHospitalEmail && validationErrors.officialHospitalEmail && (
                  <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.officialHospitalEmail}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onBlur={() => handleBlur("password")}
                      placeholder="Minimum 8 characters"
                      className={`w-full pl-10 pr-10 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        touched.password && validationErrors.password
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {touched.password && validationErrors.password && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.password}</p>
                  )}

                  {/* Password Strength Meter */}
                  {form.password && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            passwordStrength <= 25
                              ? "bg-destructive w-1/4"
                              : passwordStrength <= 50
                              ? "bg-amber-500 w-2/4"
                              : passwordStrength <= 75
                              ? "bg-blue-500 w-3/4"
                              : "bg-emerald-500 w-full"
                          }`}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground text-right font-semibold">
                        {passwordStrength <= 25
                          ? "Weak"
                          : passwordStrength <= 50
                          ? "Fair"
                          : passwordStrength <= 75
                          ? "Good"
                          : "Strong"}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1.5 block">
                    Confirm Password <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="Re-enter password"
                      className={`w-full pl-10 pr-10 py-2.5 bg-muted/60 rounded-xl border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
                        touched.confirmPassword && validationErrors.confirmPassword
                          ? "border-destructive focus:border-destructive"
                          : "border-border focus:border-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {touched.confirmPassword && validationErrors.confirmPassword && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Compliance Guarantee */}
            <div className="p-3 bg-muted/40 rounded-2xl border border-border/60 flex items-center gap-2.5 text-xs text-muted-foreground">
              <ShieldCheck size={18} className="text-primary shrink-0" />
              <span>
                By registering, you confirm that patient health data stored within FOCEYE complies with HIPAA & regional ophthalmic regulatory standards.
              </span>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.99 }}
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm rounded-2xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Hospital Profile & Account…
                </>
              ) : (
                <>
                  Complete Hospital Registration
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Social Auth Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-border w-full" />
            <span className="bg-card px-3 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
              or authenticate with
            </span>
            <div className="border-t border-border w-full" />
          </div>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={submitting}
            className="w-full py-3 bg-muted/60 hover:bg-muted text-foreground rounded-2xl font-bold border border-border transition-all flex items-center justify-center gap-3 text-sm shadow-sm cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google Workspace
          </button>

          {/* Footer Navigation */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            Already have an active clinician account?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In to Hospital Portal
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
