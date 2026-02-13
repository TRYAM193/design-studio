import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function AdminRoute() {
    const { user, loading } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(true);

    useEffect(() => {
        const checkAdminClaim = async () => {
            if (!user) {
                setIsAdmin(false);
                setIsChecking(false);
                return;
            }

            if (user) {
                try {
                    // Force refresh token to ensure we have the latest claims
                    const tokenResult = await user.getIdTokenResult(true);
                    // Check for the 'admin' claim we set in the script
                    setIsAdmin(!!tokenResult.claims.admin);
                } catch (error) {
                    console.error("Error verifying admin status:", error);
                    setIsAdmin(false);
                }
            }
            setIsChecking(false);
        };

        if (!loading) {
            if (user) {
                checkAdminClaim();
            } else {
                // No user, stop checking immediately
                setIsChecking(false);
            }
        }
    }, [user, loading]);

    // 1. Wait for Auth & Admin Check
    if (loading || isChecking) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            </div>
        );
    }

    // 2. Not Logged In -> Go to Login
    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    // 3. Logged In BUT Not Admin -> "Access Denied" Screen
    if (!isAdmin) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-center px-4">
                <div className="bg-red-500/10 p-4 rounded-full mb-4 border border-red-500/20">
                    <ShieldAlert className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-slate-400 max-w-md mb-8">
                    You do not have permission to view this page. This area is restricted to administrators only.
                </p>
                <Link to="/dashboard">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        );
    }

    // 4. Success -> Show Admin Page
    return <Outlet />;
}