// src/components/ExitIntentModal.tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExitIntent } from "@/hooks/useExitIntent";
import { trackExitFeedback } from "@/lib/analytics";
import { Sparkles, MessageCircle, ArrowRight, CheckCircle2, HeartHandshake, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "react-router";

const FEEDBACK_OPTIONS = [
  { id: "price", label: "💰 Price is too high", tag: "pricing" },
  { id: "art", label: "🎨 Couldn't get the design I wanted", tag: "design_tools" },
  { id: "browsing", label: "⏳ Just exploring, will return later", tag: "just_browsing" },
  { id: "question", label: "❓ Unsure about quality/sizing/delivery", tag: "info_needed" },
];

export function ExitIntentModal() {
  const { showExitModal, dismissModal } = useExitIntent({ enabled: true, idleTimeoutMs: 75000 });
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith("/design");

  const handleSelectFeedback = async (reasonId: string, label: string) => {
    setSelectedReason(reasonId);
    await trackExitFeedback(label, `Page: ${location.pathname}`);
    setSubmitted(true);
    toast.success("Thank you for helping us improve!");
    setTimeout(() => {
      dismissModal();
    }, 1800);
  };

  return (
    <Dialog open={showExitModal} onOpenChange={(open) => !open && dismissModal()}>
      <DialogContent className="bg-slate-950/95 border border-orange-500/30 text-white sm:max-w-[480px] w-[95vw] rounded-2xl shadow-2xl backdrop-blur-2xl p-6 overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        <DialogHeader className="relative z-10 text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-purple-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10 mb-1">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {isEditorPage ? "Save Your Custom Design?" : "Wait, Before You Go!"}
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs sm:text-sm font-normal">
            {isEditorPage
              ? "Your design draft is safely preserved. What can we do to make your experience better?"
              : "We're always tuning TRYAM. Quick 1-click feedback helps us improve your experience:"}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 mt-4 space-y-3">
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-2"
              >
                {FEEDBACK_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectFeedback(opt.id, opt.label)}
                    className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/40 text-slate-300 hover:text-white transition-all text-xs sm:text-sm font-medium flex items-center justify-between group active:scale-[0.99]"
                  >
                    <span>{opt.label}</span>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-transform group-hover:translate-x-1" />
                  </button>
                ))}

                <div className="pt-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={dismissModal}
                    className="w-full border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold py-2.5"
                  >
                    Keep Exploring
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="thankyou"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-6 text-center space-y-2"
              >
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <p className="text-white font-bold text-base">Feedback Recorded!</p>
                <p className="text-slate-400 text-xs">
                  We appreciate your help in making TRYAM awesome.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </DialogContent>
    </Dialog>
  );
}
