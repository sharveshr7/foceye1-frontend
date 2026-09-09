import { Navigate, useLocation, Outlet, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "./LoadingScreen";
import { ShieldAlert, ArrowLeft } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen message="Verifying clinician security session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && user?.role) {
    const hasRole = allowedRoles.some(
      (r) => r.toLowerCase() === user.role?.toLowerCase()
    );
    if (!hasRole) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 font-outfit">
          <div className="card-soft max-w-md w-full p-8 text-center space-y-5 border-destructive/20 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
              <p className="text-sm text-muted-foreground">
                Your account ({user.email}) has role <span className="font-semibold text-foreground uppercase">{user.role}</span>, which is not authorized for this clinical station section.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm shadow-md hover:bg-primary/90 transition-all w-full"
            >
              <ArrowLeft size={16} /> Return to Clinical Dashboard
            </Link>
          </div>
        </div>
      );
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
