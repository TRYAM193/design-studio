import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, Lock } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@/hooks/use-translation";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    setStep({ email });
    // In a real app, you might check if the email exists here to toggle isSignUp
    // For now, we'll default to login, user can toggle if they are new
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("email", (step as { email: string }).email);
      formData.append("password", password);
      formData.append("isSignUp", isSignUp ? "true" : "false");
      
      await signIn("email-password", formData);
      // Navigation happens in useEffect when isAuthenticated becomes true
    } catch (error: any) {
      console.error("Auth error:", error);
      let msg = "Authentication failed.";
      if (error.code === "auth/invalid-credential") msg = "Invalid password or user not found.";
      if (error.code === "auth/email-already-in-use") msg = "Email already in use. Try signing in.";
      if (error.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
    } catch (error) {
      setError("Failed to sign in as guest.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center justify-center h-full flex-col">
        <Card className="min-w-[350px] pb-0 border shadow-md">
          {step === "signIn" ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center">
                    <img src="./logo.svg" alt="Logo" width={64} height={64} className="rounded-lg mb-4 mt-4 cursor-pointer" onClick={() => navigate("/")} />
                </div>
                <CardTitle className="text-xl">{t("auth.getStarted")}</CardTitle>
                <CardDescription>{t("auth.desc")}</CardDescription>
              </CardHeader>
              <form onSubmit={handleEmailSubmit}>
                <CardContent>
                  <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input name="email" placeholder={t("auth.emailPlaceholder")} type="email" className="pl-9" required />
                    </div>
                    <Button type="submit" variant="outline" size="icon">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span></div>
                    </div>
                    <Button type="button" variant="outline" className="w-full mt-4" onClick={handleGuestLogin} disabled={isLoading}>
                      <UserX className="mr-2 h-4 w-4" />
                      {t("auth.guest")}
                    </Button>
                  </div>
                </CardContent>
              </form>
            </>
          ) : (
            <>
              <CardHeader className="text-center mt-4">
                <CardTitle>{isSignUp ? "Create Account" : "Welcome Back"}</CardTitle>
                <CardDescription>Enter your password for {step.email}</CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordSubmit}>
                <CardContent className="pb-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="password" 
                      placeholder="Password" 
                      className="pl-9" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}
                  
                  <div className="flex justify-between items-center mt-4">
                    <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => setStep("signIn")}>
                      Change Email
                    </Button>
                    <Button variant="link" className="p-0 h-auto text-xs" type="button" onClick={() => setIsSignUp(!isSignUp)}>
                      {isSignUp ? "Already have an account? Sign In" : "New here? Create Account"}
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={isLoading || password.length < 6}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue"}
                  </Button>
                </CardFooter>
              </form>
            </>
          )}
          <div className="py-4 px-6 text-xs text-center text-muted-foreground bg-muted border-t rounded-b-lg">
            Secured by vly.ai
          </div>
        </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}