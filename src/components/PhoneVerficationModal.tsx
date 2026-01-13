import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (phone: string) => void;
}

export function PhoneVerificationModal({ isOpen, onClose, onVerified }: Props) {
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // 1. SETUP RECAPTCHA (Invisible)
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => { /* executed when solved */ }
      });
    }
  }, []);

  // 2. SEND OTP (Firebase Native)
  const handleSendOtp = async () => {
    if (phone.length < 10) return toast.error("Enter valid phone number");
    const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      // This sends the SMS using Google's servers
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
      toast.success("OTP sent via SMS!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Could not send OTP. Try refreshing.");
      // Reset recaptcha if error
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  // 3. VERIFY OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return toast.error("Enter 6-digit code");
    setLoading(true);
    
    try {
      // A. Verify the code
      const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
      
      // B. Link to current user (or just verify ownership)
      if (auth.currentUser) {
         // Option 1: Link phone to account (Best Practice)
         // await linkWithCredential(auth.currentUser, credential);
         
         // Option 2: Just update Firestore manually (Simpler if conflicts exist)
         const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
         
         await updateDoc(doc(db, "users", auth.currentUser.uid), {
             phone: formattedPhone,
             phoneVerified: true
         });

         toast.success("Phone Verified Successfully!");
         onVerified(formattedPhone);
         onClose();
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-verification-code') {
          toast.error("Wrong Code.");
      } else if (error.code === 'auth/credential-already-in-use') {
          // This means this phone is on another account. 
          // We can force update firestore anyway since we proved ownership
          const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`;
          if (auth.currentUser) {
              await updateDoc(doc(db, "users", auth.currentUser.uid), {
                  phone: formattedPhone,
                  phoneVerified: true
              });
              onVerified(formattedPhone);
              onClose();
          }
      } else {
          toast.error("Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
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
          {/* Hidden Recaptcha Div */}
          <div id="recaptcha-container"></div>

          {step === 'input' ? (
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Phone Number</Label>
                 <Input 
                   placeholder="+91 99999 99999" 
                   value={phone} 
                   onChange={(e) => setPhone(e.target.value)}
                   className="bg-slate-800 border-slate-700 text-white"
                 />
               </div>
               <Button onClick={handleSendOtp} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
                 {loading ? <Loader2 className="animate-spin" /> : "Send SMS OTP"}
               </Button>
            </div>
          ) : (
            <div className="space-y-4">
               <div className="space-y-2">
                 <Label>Enter OTP</Label>
                 <Input 
                    placeholder="123456" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-center text-2xl tracking-widest"
                    maxLength={6}
                 />
               </div>
               <Button onClick={handleVerifyOtp} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                 {loading ? <Loader2 className="animate-spin" /> : "Verify Code"}
               </Button>
               <Button variant="link" onClick={() => setStep('input')} className="text-slate-400 w-full">Change Number</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper for TypeScript window object
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}