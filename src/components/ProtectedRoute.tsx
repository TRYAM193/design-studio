import { ReactNode } from "react";
import { Navigate, useLocation, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute() {
  const { user, userProfile} = useAuth(); // Your custom hook that checks Firebase
  const location = useLocation();

  // 1. Loading State: Don't kick them out while Firebase is still thinking
  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // 2. Auth Check: If no user, redirect to Login
  if (!user) {
    // 'state' saves where they were trying to go, so we can send them back there after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (user && userProfile?.isBanned) {
    return <Navigate to="/banned" replace />;
  }

  // 3. Success: Render the protected page
  return <Outlet />;
}