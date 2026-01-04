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
import { Loader2, Mail, Lock, User as UserIcon, Chrome, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0f172a] text-white font-sans selection:bg-orange-500/30">
      
      {/* 🌌 COSMIC BACKGROUND */}
      <div className="fixed inset-0 -z-10 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px] animate-pulse" style={{animationDuration: '10s'}} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* 🔹 MAIN CONTENT */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-white/10 bg-slate-900/60 backdrop-blur-2xl shadow-2xl text-slate-200 ring-1 ring-white/5">
          
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-6">
               <div className="relative group cursor-pointer" onClick={() => navigate("/")}>
                  {/* Glowing Ring Effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative h-20 w-20 rounded-full bg-slate-950 p-1 flex items-center justify-center ring-1 ring-white/10">
                    <img src="/assets/LOGO.png" alt="Logo" className="h-full w-full object-cover rounded-full" />
                  </div>
               </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-slate-400 mt-1">Enter your details to access your creative space.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2">
            
            {/* 1. MODERN GOOGLE BUTTON */}
            <Button 
                onClick={handleGoogleLogin} 
                disabled={isLoading}
                className="w-full h-12 bg-white hover:bg-slate-50 text-slate-900 font-semibold border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-slate-400" /> : <Chrome className="mr-2 h-5 w-5 text-blue-600" />}
                Continue with Google
            </Button>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-slate-500 uppercase tracking-widest font-medium">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* 2. TABS FOR LOGIN / SIGNUP */}
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-950/50 border border-white/10 p-1 h-12 rounded-xl">
                <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 font-medium transition-all">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-slate-800 data-[state=active]:text-white text-slate-400 font-medium transition-all">Sign Up</TabsTrigger>
              </TabsList>

              {/* --- SIGN IN FORM --- */}
              <TabsContent value="signin" className="mt-4 focus-visible:ring-0">
                <form onSubmit={(e) => handleAuthSubmit(e, false)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold ml-1">Email</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                        <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            className="h-11 pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 rounded-xl transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center ml-1">
                        <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold">Password</Label>
                        <span className="text-xs text-orange-400 cursor-pointer hover:text-orange-300 transition-colors">Forgot?</span>
                    </div>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
                        <Input 
                            type="password" 
                            placeholder="••••••••" 
                            className="h-11 pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 rounded-xl transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  
                  {error && <div className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{error}</div>}

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-12 bg-gradient-to-r from-orange-500 via-red-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 hover:shadow-orange-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2">Sign In <ArrowRight className="h-4 w-4 opacity-70" /></span>}
                  </Button>
                </form>
              </TabsContent>

              {/* --- SIGN UP FORM --- */}
              <TabsContent value="signup" className="mt-4 focus-visible:ring-0">
                <form onSubmit={(e) => handleAuthSubmit(e, true)} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold ml-1">Email</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            type="email" 
                            placeholder="name@example.com" 
                            className="h-11 pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl transition-all"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-xs uppercase tracking-wider font-bold ml-1">Create Password</Label>
                    <div className="relative group">
                        <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                        <Input 
                            type="password" 
                            placeholder="Min 6 characters" 
                            className="h-11 pl-10 bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 rounded-xl transition-all"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                  </div>

                  {error && <div className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />{error}</div>}

                  <Button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-blue-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 bg-slate-950/30 rounded-b-xl">
             <Button 
                variant="outline" 
                onClick={handleGuestLogin} 
                disabled={isLoading}
                className="w-full h-11 border-white/5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all duration-200 backdrop-blur-sm border-dashed"
             >
                <UserIcon className="mr-2 h-4 w-4" /> Continue as Guest
             </Button>
             <p className="text-[10px] text-slate-500 text-center">
                By continuing, you agree to our <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Terms</span> and <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
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