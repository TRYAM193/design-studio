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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Mail, Lock, User as UserIcon, Chrome } from "lucide-react"; // Chrome icon for Google
import { Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Separator } from "@/components/ui/separator";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/dashboard";
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("google");
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError("Failed to sign in with Google.");
      setIsLoading(false);
    }
  };

  // Handle Email/Password Login & Signup
  const handleAuthSubmit = async (e: React.FormEvent, isSignUp: boolean) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsLoading(false);
        return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("isSignUp", isSignUp ? "true" : "false");
      
      await signIn("email-password", formData);
    } catch (err: any) {
      console.error("Auth error:", err);
      let msg = "Authentication failed.";
      if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
      if (err.code === "auth/email-already-in-use") msg = "This email is already registered.";
      if (err.code === "auth/weak-password") msg = "Password should be at least 6 characters.";
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("anonymous");
    } catch (error) {
      setError("Failed to sign in as guest.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0f172a] text-white">
      
      {/* 🌌 COSMIC BACKGROUND (Same as Editor) */}
      <div className="fixed inset-0 -z-10 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/10 bg-slate-900/60 backdrop-blur-xl shadow-2xl text-slate-200">
          
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
               <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-orange-500 to-red-600 p-0.5 shadow-lg shadow-orange-500/20">
                  <div className="h-full w-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
                    <img src="/assets/LOGO.png" alt="Logo" className="h-full w-full object-cover" />
                  </div>
               </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white tracking-tight">Welcome to TRYAM</CardTitle>
            <CardDescription className="text-slate-400">Design your style, wear your imagination.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            
            {/* 1. GOOGLE BUTTON */}
            <Button 
                onClick={handleGoogleLogin} 
                disabled={isLoading}
                variant="outline" 
                className="w-full h-11 bg-white hover:bg-slate-100 text-slate-900 border-0 font-medium transition-all"
            >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Chrome className="mr-2 h-4 w-4 text-blue-600" />}
                Continue with Google
            </Button>

            <div className="flex items-center gap-4 text-xs text-slate-500 uppercase">
                <Separator className="flex-1 bg-white/10" /> OR <Separator className="flex-1 bg-white/10" />
            </div>

            {/* 2. TABS FOR LOGIN / SIGNUP */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/5">
                <TabsTrigger value="signin" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400">Sign Up</TabsTrigger>
              </TabsList>

              {/* --- SIGN IN FORM --- */}
              <TabsContent value="signin">
                <form onSubmit={(e) => handleAuthSubmit(e, false)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-slate-300">Password</Label>
                        <span className="text-xs text-orange-400 cursor-pointer hover:underline">Forgot password?</span>
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  
                  {error && <p className="text-sm text-red-400 text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

                  <Button type="submit" disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* --- SIGN UP FORM --- */}
              <TabsContent value="signup">
                <form onSubmit={(e) => handleAuthSubmit(e, true)} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email Address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input 
                            type="email" 
                            placeholder="you@example.com" 
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Create Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <Input 
                            type="password" 
                            placeholder="At least 6 characters" 
                            className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-400 text-center bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}

                  <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6">
             <Button 
                variant="ghost" 
                onClick={handleGuestLogin} 
                disabled={isLoading}
                className="text-slate-400 hover:text-white w-full"
             >
                <UserIcon className="mr-2 h-4 w-4" /> Continue as Guest
             </Button>
             <p className="text-[10px] text-slate-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
             </p>
          </CardFooter>
        </Card>
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