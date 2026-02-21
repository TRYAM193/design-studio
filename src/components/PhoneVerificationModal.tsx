import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { is } from "date-fns/locale";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
  phoneNumber: string;
}

export function PhoneVerificationModal({ isOpen, onClose, onVerified, phoneNumber }: Props) {
  const displayPhone = `${phoneNumber?.slice(0,3)} ${phoneNumber?.slice(3, 8)} ${phoneNumber?.slice(8)}`;
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState(displayPhone || phoneNumber ||"");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. ROBUST RECAPTCHA INIT & CLEANUP
  useEffect(() => {
    // Helper to safely clear existing instance
    const clearRecaptcha = () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Recaptcha clear error", e);
        }
        window.recaptchaVerifier = undefined;
      }
    };

    // If modal is OPEN, initialize. If CLOSED, cleanup.
    if (isOpen) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        // Double check div exists
        const container = document.getElementById("recaptcha-container");
        if (container) {
          clearRecaptcha(); // Always clear old instance first
          try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => { console.log("Recaptcha solved"); }
            });
          } catch (e) {
            console.error("Recaptcha init failed", e);
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      clearRecaptcha(); // Cleanup when modal closes
    }

    // Cleanup on unmount
    return () => clearRecaptcha();
  }, [isOpen]);

  // 2. TIMER LOGIC (Unchanged)
  useEffect(() => {
    const checkTimer = () => {
      const savedTarget = localStorage.getItem('otp_cooldown_target');
      if (savedTarget) {
        const diff = Math.ceil((parseInt(savedTarget, 10) - Date.now()) / 1000);
        setTimeLeft(diff > 0 ? diff : 0);
        if (diff <= 0) localStorage.removeItem('otp_cooldown_target');
      }
    };
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const startCooldown = () => {
    const COOLDOWN = 30;
    localStorage.setItem('otp_cooldown_target', (Date.now() + COOLDOWN * 1000).toString());
    setTimeLeft(COOLDOWN);
  };

  // 3. SEND OTP (With Auto-Repair)
  const handleSendOtp = async (isResend = false) => {
    if (timeLeft > 0) return toast.warning(`Wait ${timeLeft}s.`);
    if (phone.length < 10) return toast.error("Enter valid phone number");
    
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
    setLoading(true);

    try {
      // 🛡️ SAFETY: If verifier is missing (zombie state), re-create it NOW
      if (!window.recaptchaVerifier) {
         const container = document.getElementById("recaptcha-container");
         if(container) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': () => { console.log("Recaptcha recovered"); }
            });
         } else {
            throw new Error("Recaptcha container missing. Please refresh.");
         }
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setStep('otp');
      startCooldown();
      toast.success(isResend ? "OTP Resent!" : "OTP Sent!");

    } catch (error: any) {
      console.error(error);
      
      // If error is specifically "client element removed", force a hard reset
      if (error.message.includes("client element has been removed") || error.message.includes("reCAPTCHA client")) {
          toast.error("Security check updated. Please click Send again.");
          if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
          window.recaptchaVerifier = undefined;
      } else {
          toast.error(error.message || "Failed to send OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 4. VERIFY OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error("Enter 6-digit code");
    setLoading(true);
    
    try {
      if (!confirmationResult) throw new Error("Session expired.");
      await confirmationResult.confirm(otp);
      
      if (auth.currentUser) {
         const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
         await setDoc(doc(db, "users", auth.currentUser.uid), {
             phoneNumber: formattedPhone, 
             phoneVerified: true,
             updatedAt: new Date()
         }, { merge: true });

         toast.success("Verified!");
         onVerified(formattedPhone);
         localStorage.removeItem('otp_cooldown_target');
         setTimeLeft(0);
         onClose();
      }
    } catch (error) {
      toast.error("Invalid Code.");
    } finally {
      setLoading(false);
    }
  };

  if(!isOpen && phone !== displayPhone) setPhone(displayPhone)

  return (
    <>
      {/* 🟢 ALWAYS RENDERED DIV (Invisible) */}
      <div id="recaptcha-container"></div>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-400" /> Verify Phone
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              We will send a standard SMS to verify your number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {step === 'input' ? (
              <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Phone Number</Label>
                   <Input 
                     placeholder="Enter phone number" value={phone} 
                     onChange={(e) => setPhone(e.target.value)}
                     className="bg-slate-800 border-slate-700 text-white" type="tel"
                   />
                 </div>
                 <Button onClick={() => handleSendOtp(false)} disabled={loading || timeLeft > 0} className="w-full bg-blue-600 hover:bg-blue-700">
                   {loading ? <Loader2 className="animate-spin" /> : (timeLeft > 0 ? `Wait ${timeLeft}s` : "Send SMS OTP")}
                 </Button>
              </div>
            ) : (
              <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Enter OTP</Label>
                   <Input 
                      placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
                      maxLength={6}
                   />
                 </div>
                 
                 <Button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-lg h-12">
                   {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
                 </Button>

                 <div className="flex justify-center pt-2">
                     <Button variant="ghost" size="sm" onClick={() => handleSendOtp(true)} disabled={timeLeft > 0 || loading} className="text-slate-400 hover:text-white">
                        {timeLeft > 0 ? (
                           <span className="flex items-center gap-2 text-slate-500">
                               <Loader2 className="h-3 w-3 animate-spin" /> {timeLeft}s
                           </span>
                        ) : (
                           <span className="flex items-center gap-2"><RefreshCw className="h-3 w-3" /> Resend OTP</span>
                        )}
                     </Button>
                 </div>
                 <Button variant="link" onClick={() => setStep('input')} className="text-slate-500 w-full text-xs">Change Number</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

declare global { interface Window { recaptchaVerifier: any; } }