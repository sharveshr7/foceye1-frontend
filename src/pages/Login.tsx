import { motion } from "framer-motion";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = (location.state as any)?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectPath]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError("Please provide both your official hospital email and password.");
      toast.error("Missing required credentials.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please provide a valid email format.");
      toast.error("Invalid email address format.");
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      toast.success("Authenticated successfully! Loading clinical dashboard...");
      navigate(redirectPath, { replace: true });
    } catch (cause: unknown) {
      const message = cause instanceof Error ? cause.message : "Invalid clinician credentials or unauthorized facility access.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 font-outfit relative overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Background ambient lighting */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
            <Eye className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Hospital Clinician Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to access patient therapy telemetry and AI diagnostics.</p>
        </div>

        <div className="card-soft shadow-xl p-8 space-y-6 border-border/80">
          {error && (
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Official Hospital Email
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@foceyehospital.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-muted/40 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                <>
                  Sign In to Clinic <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-2">
            New facility?{" "}
            <Link to="/signup" className="text-primary font-bold hover:underline">
              Register New Hospital
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
