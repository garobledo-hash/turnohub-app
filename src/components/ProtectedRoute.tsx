import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { isAccessAllowed } from "@/services/profile";
import { Loader2 } from "lucide-react";
import { type ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;
  if (profile && !isAccessAllowed(profile) && location.pathname !== "/billing") {
    return <Navigate to="/billing" replace />;
  }
  return <>{children}</>;
}
